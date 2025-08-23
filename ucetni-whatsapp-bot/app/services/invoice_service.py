"""
Invoice Generation Service for ÚčetníBot
Automatically generates invoices for payments and sends them via email
"""
import os
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from decimal import Decimal
import logging
from dataclasses import dataclass
import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
import jinja2
from xhtml2pdf import pisa
import httpx

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db_session
from app.database.models import User, Payment, Invoice
from app.utils.logging import get_logger, log_user_action
from app.utils.sentry import capture_business_event

logger = get_logger(__name__)

@dataclass
class InvoiceData:
    """Invoice data structure"""
    # Required fields first
    invoice_number: str
    issue_date: datetime
    due_date: datetime
    customer_name: str
    customer_email: str
    items: List[Dict[str, Any]]
    subtotal: Decimal
    vat_amount: Decimal
    total_amount: Decimal
    
    # Optional fields with defaults
    payment_date: Optional[datetime] = None
    supplier_name: str = "ÚčetníBot s.r.o."
    supplier_address: str = "Hlavní 123\n110 00 Praha 1"
    supplier_ico: str = "12345678"
    supplier_dic: str = "CZ12345678"
    supplier_email: str = "fakturace@ucetni-bot.cz"
    supplier_phone: str = "+420 123 456 789"
    customer_address: Optional[str] = None
    customer_ico: Optional[str] = None
    customer_dic: Optional[str] = None
    vat_rate: Decimal = Decimal('21.0')  # 21% DPH
    payment_method: str = "Online platba"
    bank_account: str = "123456789/0800"
    variable_symbol: Optional[str] = None
    currency: str = "CZK"
    notes: Optional[str] = None

class InvoiceGenerator:
    """Generate PDF invoices from templates"""
    
    def __init__(self):
        # Setup Jinja2 template environment
        template_dir = os.path.join(os.path.dirname(__file__), '..', 'templates')
        self.jinja_env = jinja2.Environment(
            loader=jinja2.FileSystemLoader(template_dir),
            autoescape=jinja2.select_autoescape(['html', 'xml'])
        )
        
        # Invoice counter for numbering
        self.invoice_counter_file = os.path.join(os.getcwd(), 'invoice_counter.txt')
    
    def _get_next_invoice_number(self) -> str:
        """Generate next invoice number"""
        try:
            if os.path.exists(self.invoice_counter_file):
                with open(self.invoice_counter_file, 'r') as f:
                    counter = int(f.read().strip())
            else:
                counter = 0
            
            counter += 1
            
            with open(self.invoice_counter_file, 'w') as f:
                f.write(str(counter))
            
            # Format: UB2024001
            year = datetime.now().year
            return f"UB{year}{counter:03d}"
            
        except Exception as e:
            logger.error("Invoice number generation failed", error=str(e))
            # Fallback to timestamp-based number
            return f"UB{int(datetime.now().timestamp())}"
    
    async def generate_subscription_invoice(self, user_id: int, payment: Payment, 
                                          stripe_invoice: Dict = None) -> InvoiceData:
        """Generate invoice for subscription payment"""
        try:
            # Get user data
            async for db in get_db_session():
                user_stmt = select(User).where(User.id == user_id)
                result = await db.execute(user_stmt)
                user = result.scalar_one_or_none()
                
                if not user:
                    raise ValueError(f"User {user_id} not found")
                
                # Get user settings if available
                from app.database.models import UserSettings
                settings_stmt = select(UserSettings).where(UserSettings.user_id == user_id)
                settings_result = await db.execute(settings_stmt)
                settings = settings_result.scalar_one_or_none()
                
                # Prepare invoice data
                invoice_number = self._get_next_invoice_number()
                issue_date = datetime.now()
                due_date = issue_date  # Subscription is already paid
                
                # Customer info
                customer_name = settings.full_name if settings else user.profile_name or "Zákazník"
                customer_email = user.email if hasattr(user, 'email') else "zákazník@email.cz"
                
                # Invoice items
                items = [{
                    'description': 'ÚčetníBot - Měsíční předplatné',
                    'quantity': 1,
                    'unit_price': payment.amount,
                    'total_price': payment.amount
                }]
                
                # Calculate totals
                subtotal = payment.amount
                vat_amount = subtotal * Decimal('0.21')  # 21% DPH
                total_with_vat = subtotal + vat_amount
                
                invoice_data = InvoiceData(
                    invoice_number=invoice_number,
                    issue_date=issue_date,
                    due_date=due_date,
                    payment_date=payment.completed_at or datetime.now(),
                    customer_name=customer_name,
                    customer_email=customer_email,
                    customer_ico=settings.ico if settings else None,
                    items=items,
                    subtotal=subtotal,
                    vat_amount=vat_amount,
                    total_amount=total_with_vat,
                    variable_symbol=invoice_number.replace('UB', ''),
                    notes=f"Děkujeme za využívání služeb ÚčetníBot. Platba ID: {payment.payment_id}"
                )
                
                return invoice_data
                
        except Exception as e:
            logger.error("Invoice generation failed", error=str(e), user_id=user_id)
            raise
    
    async def generate_pdf(self, invoice_data: InvoiceData) -> bytes:
        """Generate PDF from invoice data"""
        try:
            # Load HTML template
            template = self.jinja_env.get_template('invoice.html')
            
            # Render HTML with data
            html_content = template.render(
                invoice=invoice_data,
                format_currency=self._format_currency,
                format_date=self._format_date
            )
            
            # Generate PDF using xhtml2pdf
            from io import BytesIO
            pdf_buffer = BytesIO()
            
            # Create PDF
            pisa_status = pisa.CreatePDF(
                src=html_content.encode('utf-8'),
                dest=pdf_buffer,
                encoding='utf-8'
            )
            
            if pisa_status.err:
                raise Exception(f"PDF generation error: {pisa_status.err}")
            
            pdf_bytes = pdf_buffer.getvalue()
            pdf_buffer.close()
            
            logger.info("PDF invoice generated", 
                       invoice_number=invoice_data.invoice_number,
                       size_bytes=len(pdf_bytes))
            
            return pdf_bytes
            
        except Exception as e:
            logger.error("PDF generation failed", error=str(e))
            raise
    
    def _format_currency(self, amount: Decimal) -> str:
        """Format currency for Czech locale"""
        return f"{amount:,.2f} Kč".replace(',', ' ')
    
    def _format_date(self, date: datetime) -> str:
        """Format date for Czech locale"""
        return date.strftime("%d.%m.%Y")

class EmailService:
    """Send invoices via email"""
    
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.from_email = os.getenv('FROM_EMAIL', 'noreply@ucetni-bot.cz')
        self.from_name = os.getenv('FROM_NAME', 'ÚčetníBot')
    
    async def send_invoice_email(self, invoice_data: InvoiceData, pdf_bytes: bytes) -> bool:
        """Send invoice via email"""
        try:
            if not self.smtp_username or not self.smtp_password:
                logger.warning("SMTP credentials not configured")
                return False
            
            # Create email message
            msg = MIMEMultipart()
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = invoice_data.customer_email
            msg['Subject'] = f"Faktura {invoice_data.invoice_number} - ÚčetníBot"
            
            # Email body
            body = f"""
Dobrý den,

děkujeme za využívání služeb ÚčetníBot!

V příloze naleznete fakturu č. {invoice_data.invoice_number} za měsíční předplatné.

Detaily faktury:
• Číslo faktury: {invoice_data.invoice_number}
• Datum vystavení: {self._format_date(invoice_data.issue_date)}
• Částka: {self._format_currency(invoice_data.total_amount)}
• Způsob platby: {invoice_data.payment_method}

Platba již byla úspěšně zpracována.

Pokud máte jakékoli dotazy, neváhejte nás kontaktovat na podpora@ucetni-bot.cz.

S pozdravem,
Tým ÚčetníBot

---
Tento e-mail byl vygenerován automaticky.
ÚčetníBot - Český asistent pro účetnictví OSVČ
Web: https://ucetni-bot.cz
"""
            
            msg.attach(MIMEText(body, 'plain', 'utf-8'))
            
            # Attach PDF invoice
            pdf_attachment = MIMEApplication(pdf_bytes, _subtype='pdf')
            pdf_attachment.add_header(
                'Content-Disposition', 
                'attachment', 
                filename=f'faktura_{invoice_data.invoice_number}.pdf'
            )
            msg.attach(pdf_attachment)
            
            # Send email
            await self._send_email_async(msg)
            
            logger.info("Invoice email sent", 
                       invoice_number=invoice_data.invoice_number,
                       recipient=invoice_data.customer_email)
            
            return True
            
        except Exception as e:
            logger.error("Invoice email sending failed", 
                        error=str(e),
                        invoice_number=invoice_data.invoice_number)
            return False
    
    async def _send_email_async(self, msg: MIMEMultipart):
        """Send email asynchronously"""
        def send_email():
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
        
        # Run in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, send_email)
    
    def _format_currency(self, amount: Decimal) -> str:
        """Format currency for Czech locale"""
        return f"{amount:,.2f} Kč".replace(',', ' ')
    
    def _format_date(self, date: datetime) -> str:
        """Format date for Czech locale"""
        return date.strftime("%d.%m.%Y")

class InvoiceService:
    """Main invoice service orchestrator"""
    
    def __init__(self):
        self.generator = InvoiceGenerator()
        self.email_service = EmailService()
    
    async def process_payment_invoice(self, user_id: int, payment: Payment, 
                                    stripe_invoice: Dict = None) -> bool:
        """Process invoice for payment - generate and send"""
        try:
            # Generate invoice data
            invoice_data = await self.generator.generate_subscription_invoice(
                user_id, payment, stripe_invoice
            )
            
            # Generate PDF
            pdf_bytes = await self.generator.generate_pdf(invoice_data)
            
            # Save invoice record to database
            invoice_record = await self._save_invoice_record(
                user_id=user_id,
                payment_id=payment.id,
                invoice_data=invoice_data,
                pdf_size=len(pdf_bytes)
            )
            
            # Send via email
            email_sent = await self.email_service.send_invoice_email(invoice_data, pdf_bytes)
            
            # Update invoice record with email status
            if invoice_record:
                await self._update_invoice_status(invoice_record.id, email_sent)
            
            # Log success
            log_user_action(
                logger,
                user_id=user_id,
                action='invoice_generated',
                success=True,
                invoice_number=invoice_data.invoice_number,
                email_sent=email_sent
            )
            
            # Capture business event
            capture_business_event(
                'invoice_generated',
                user_id=user_id,
                invoice_number=invoice_data.invoice_number,
                amount=float(invoice_data.total_amount),
                email_sent=email_sent
            )
            
            return True
            
        except Exception as e:
            logger.error("Invoice processing failed", error=str(e), user_id=user_id)
            
            # Log failure
            log_user_action(
                logger,
                user_id=user_id,
                action='invoice_generation_failed',
                success=False,
                error_message=str(e)
            )
            
            return False
    
    async def _save_invoice_record(self, user_id: int, payment_id: int, 
                                 invoice_data: InvoiceData, pdf_size: int) -> Invoice:
        """Save invoice record to database"""
        async for db in get_db_session():
            invoice = Invoice(
                user_id=user_id,
                payment_id=payment_id,
                invoice_number=invoice_data.invoice_number,
                issue_date=invoice_data.issue_date,
                due_date=invoice_data.due_date,
                amount_without_vat=invoice_data.subtotal,
                vat_amount=invoice_data.vat_amount,
                total_amount=invoice_data.total_amount,
                currency=invoice_data.currency,
                customer_name=invoice_data.customer_name,
                customer_email=invoice_data.customer_email,
                status='generated',
                pdf_size=pdf_size
            )
            
            db.add(invoice)
            await db.commit()
            await db.refresh(invoice)
            
            return invoice
    
    async def _update_invoice_status(self, invoice_id: int, email_sent: bool):
        """Update invoice status after email attempt"""
        async for db in get_db_session():
            status = 'sent' if email_sent else 'email_failed'
            stmt = update(Invoice).where(Invoice.id == invoice_id).values(
                status=status,
                email_sent_at=datetime.now() if email_sent else None
            )
            await db.execute(stmt)
            await db.commit()
    
    async def get_user_invoices(self, user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """Get user's invoices"""
        async for db in get_db_session():
            stmt = (
                select(Invoice)
                .where(Invoice.user_id == user_id)
                .order_by(Invoice.created_at.desc())
                .limit(limit)
            )
            result = await db.execute(stmt)
            invoices = result.scalars().all()
            
            return [
                {
                    'id': inv.id,
                    'invoice_number': inv.invoice_number,
                    'issue_date': inv.issue_date.isoformat(),
                    'total_amount': float(inv.total_amount),
                    'currency': inv.currency,
                    'status': inv.status,
                    'email_sent_at': inv.email_sent_at.isoformat() if inv.email_sent_at else None
                }
                for inv in invoices
            ]

# Global invoice service instance
invoice_service = InvoiceService()