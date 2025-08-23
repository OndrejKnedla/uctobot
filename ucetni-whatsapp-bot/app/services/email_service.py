"""
EmailService - Služba pro zasílání emailů
"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import os
from datetime import datetime

logger = logging.getLogger(__name__)

class EmailService:
    """Service pro zasílání emailů"""
    
    def __init__(self):
        # Email konfigurace z environment variables
        self.smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.from_email = os.getenv('FROM_EMAIL', self.smtp_username)
        self.from_name = os.getenv('FROM_NAME', 'ÚčetníBot')
        
        # Kontrola konfigurace
        if not all([self.smtp_username, self.smtp_password]):
            logger.warning("Email service not configured - missing SMTP credentials")
            self.configured = False
        else:
            self.configured = True
            logger.info("Email service configured successfully")
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        template_name: Optional[str] = None
    ) -> bool:
        """
        Odešle email
        
        Args:
            to_email: Příjemce
            subject: Předmět
            html_content: HTML obsah
            text_content: Textová verze (optional)
            template_name: Název šablony pro logging (optional)
        
        Returns:
            bool: True pokud byl email úspěšně odeslán
        """
        if not self.configured:
            logger.error("Email service not configured")
            return False
        
        try:
            # Vytvoř MIME zprávu
            message = MIMEMultipart('alternative')
            message['Subject'] = subject
            message['From'] = f"{self.from_name} <{self.from_email}>"
            message['To'] = to_email
            
            # Přidej textovou část (pokud je zadána)
            if text_content:
                text_part = MIMEText(text_content, 'plain', 'utf-8')
                message.attach(text_part)
            
            # Přidej HTML část
            html_part = MIMEText(html_content, 'html', 'utf-8')
            message.attach(html_part)
            
            # Odešli email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(message)
            
            logger.info(
                f"Email sent successfully to {to_email}",
                template=template_name,
                subject=subject[:50]
            )
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP authentication failed: {str(e)}")
            return False
        except smtplib.SMTPRecipientsRefused as e:
            logger.error(f"Recipient refused: {str(e)}")
            return False
        except smtplib.SMTPException as e:
            logger.error(f"SMTP error: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Email sending failed: {str(e)}")
            return False
    
    async def send_activation_email(self, email: str, activation_token: str, plan: str) -> bool:
        """
        Odešle aktivační email s tokenem
        """
        whatsapp_number = "+420777888999"  # Vaše WhatsApp číslo
        whatsapp_link = f"https://wa.me/{whatsapp_number.replace('+', '')}?text={activation_token}"
        
        plan_names = {
            "monthly": "Měsíční (299 Kč/měsíc)",
            "yearly": "Roční (2990 Kč/rok)"
        }
        plan_name = plan_names.get(plan, plan)
        
        subject = "🎉 Váš aktivační kód pro ÚčetníBot"
        
        # HTML obsah emailu
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                .container {{ max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }}
                .header {{ background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ padding: 30px; background: #f9fafb; }}
                .token-box {{ 
                    background: white; 
                    border: 3px dashed #10b981; 
                    padding: 25px; 
                    margin: 25px 0;
                    text-align: center;
                    border-radius: 8px;
                }}
                .token {{ 
                    font-family: 'Courier New', monospace; 
                    font-size: 24px; 
                    color: #1f2937;
                    word-break: break-all;
                    padding: 15px;
                    background: #f3f4f6;
                    border-radius: 6px;
                    letter-spacing: 2px;
                    font-weight: bold;
                }}
                .button {{
                    display: inline-block;
                    background: #10b981;
                    color: white !important;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 8px;
                    margin: 20px 0;
                    font-size: 16px;
                    font-weight: bold;
                }}
                .button:hover {{ background: #059669; }}
                .steps {{ background: white; padding: 25px; border-radius: 8px; margin: 25px 0; }}
                .step {{ margin: 20px 0; display: flex; align-items: flex-start; }}
                .step-number {{ 
                    display: inline-flex;
                    width: 35px;
                    height: 35px;
                    background: #10b981;
                    color: white;
                    border-radius: 50%;
                    align-items: center;
                    justify-content: center;
                    margin-right: 15px;
                    font-weight: bold;
                    flex-shrink: 0;
                }}
                .step-content {{ flex: 1; }}
                .warning {{ 
                    background: #fef3c7; 
                    padding: 20px; 
                    border-radius: 8px; 
                    margin: 25px 0;
                    border-left: 4px solid #f59e0b;
                }}
                .warning-text {{ color: #92400e; margin: 0; }}
                .footer {{ 
                    text-align: center; 
                    padding: 25px; 
                    color: #6b7280; 
                    font-size: 14px; 
                    background: white;
                    border-radius: 0 0 8px 8px;
                }}
                .phone {{ 
                    font-family: 'Courier New', monospace; 
                    background: #f3f4f6; 
                    padding: 8px 12px; 
                    border-radius: 4px;
                    font-weight: bold;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Vítejte v ÚčetníBotu!</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Váš AI asistent pro účetnictví OSVČ</p>
                </div>
                
                <div class="content">
                    <p>Dobrý den,</p>
                    
                    <p>děkujeme za zakoupení předplatného <strong>{plan_name}</strong>. 
                    Váš účet byl úspěšně vytvořen a čeká na aktivaci.</p>
                    
                    <div class="token-box">
                        <h3 style="margin-top: 0;">🔑 Váš aktivační kód:</h3>
                        <div class="token">{activation_token}</div>
                        <p style="color: #dc2626; font-weight: bold; margin-bottom: 0;">
                            ⏰ Platnost: 48 hodin od zakoupení
                        </p>
                    </div>
                    
                    <div class="steps">
                        <h3 style="margin-top: 0; color: #1f2937;">📱 Jak aktivovat WhatsApp:</h3>
                        
                        <div class="step">
                            <span class="step-number">1</span>
                            <div class="step-content">
                                <strong>Uložte si naše číslo:</strong><br>
                                <span class="phone">{whatsapp_number}</span>
                            </div>
                        </div>
                        
                        <div class="step">
                            <span class="step-number">2</span>
                            <div class="step-content">
                                <strong>Pošlete aktivační kód</strong><br>
                                Zkopírujte kód výše a pošlete ho jako zprávu na WhatsApp
                            </div>
                        </div>
                        
                        <div class="step">
                            <span class="step-number">3</span>
                            <div class="step-content">
                                <strong>Dokončete registraci</strong><br>
                                Bot vás provede vyplněním IČO a základních údajů
                            </div>
                        </div>
                        
                        <div class="step">
                            <span class="step-number">4</span>
                            <div class="step-content">
                                <strong>Začněte účtovat!</strong><br>
                                Pošlete první fotku účtenky nebo napište transakci
                            </div>
                        </div>
                    </div>
                    
                    <center>
                        <a href="{whatsapp_link}" class="button">
                            💬 Aktivovat na WhatsApp
                        </a>
                    </center>
                    
                    <div class="warning">
                        <p class="warning-text"><strong>⚠️ Důležité informace:</strong></p>
                        <ul style="color: #92400e; margin: 10px 0 0 20px;">
                            <li>Aktivační kód stačí poslat <strong>pouze jednou</strong></li>
                            <li>Bot si vás zapamatuje podle telefonního čísla</li>
                            <li>Po aktivaci už kód nebudete potřebovat</li>
                            <li>Kód má platnost <strong>48 hodin</strong> od nákupu</li>
                            <li>Fakturu obdržíte na e-mail do 24 hodin</li>
                        </ul>
                    </div>
                </div>
                
                <div class="footer">
                    <strong>Potřebujete pomoc?</strong><br>
                    📧 <a href="mailto:podpora@ucetnibot.cz" style="color: #10b981;">podpora@ucetnibot.cz</a><br>
                    🌐 <a href="https://ucetnibot.cz" style="color: #10b981;">ucetnibot.cz</a><br><br>
                    <small>ÚčetníBot - Vaše chytré účetnictví | {datetime.now().strftime('%Y')}</small>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Textová verze pro kompatibilitu
        text_content = f"""
AKTIVAČNÍ KÓD PRO ÚČETNÍBOT

Děkujeme za zakoupení předplatného {plan_name}.

VÁŠ AKTIVAČNÍ KÓD: {activation_token}
PLATNOST: 48 hodin

JAK AKTIVOVAT:
1. Uložte si číslo: {whatsapp_number}
2. Pošlete aktivační kód na WhatsApp
3. Dokončete registraci (IČO, základní údaje)
4. Začněte účtovat!

DŮLEŽITÉ:
- Kód stačí poslat pouze jednou
- Bot si vás zapamatuje podle telefonního čísla
- Po aktivaci už kód nebudete potřebovat

Pomoc: podpora@ucetnibot.cz
Web: ucetnibot.cz
        """
        
        return await self.send_email(
            to_email=email,
            subject=subject,
            html_content=html_content,
            text_content=text_content,
            template_name="activation_token"
        )
    
    async def send_test_email(self, to_email: str) -> bool:
        """
        Odešle testovací email pro ověření konfigurace
        """
        subject = "Test - ÚčetníBot Email Service"
        html_content = """
        <h2>Test Email Service</h2>
        <p>Pokud vidíte tento email, email service funguje správně.</p>
        <p>Čas odeslání: """ + datetime.now().strftime('%d.%m.%Y %H:%M:%S') + """</p>
        """
        
        return await self.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            template_name="test_email"
        )