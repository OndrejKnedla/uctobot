"""
Real database operations using SQLAlchemy async
This replaces the mock database operations from database.py
"""

import os
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, text
from sqlalchemy.orm import selectinload

from .models import User, UserSettings, Transaction, VatRecord, BusinessCategory, Reminder, ExportHistory, BUSINESS_CATEGORIES_DATA
from .connection import db_manager, get_db_session

logger = logging.getLogger(__name__)

class DatabaseOperations:
    """Real database operations using SQLAlchemy async"""
    
    def __init__(self):
        pass

    async def init_database(self, database_url: str = None):
        """Initialize database connection and create tables"""
        from .connection import init_database
        await init_database(database_url)
        await self.seed_business_categories()

    async def seed_business_categories(self):
        """Seed business categories if they don't exist"""
        async with db_manager.get_session() as session:
            # Check if categories already exist
            result = await session.execute(select(func.count(BusinessCategory.id)))
            count = result.scalar()
            
            if count == 0:
                # Insert initial business categories
                for cat_data in BUSINESS_CATEGORIES_DATA:
                    category = BusinessCategory(**cat_data)
                    session.add(category)
                
                await session.commit()
                logger.info(f"Inserted {len(BUSINESS_CATEGORIES_DATA)} business categories")

    async def get_or_create_user(self, whatsapp_number: str, profile_name: str = None) -> User:
        """Get existing user or create new one"""
        async with db_manager.get_session() as session:
            # Try to find existing user
            result = await session.execute(
                select(User).where(User.whatsapp_number == whatsapp_number)
            )
            user = result.scalar_one_or_none()
            
            if user:
                # Update profile name if provided and different
                if profile_name and user.profile_name != profile_name:
                    user.profile_name = profile_name
                    user.updated_at = datetime.now()
                    user.last_activity = datetime.now()
                    await session.commit()
                return user
            else:
                # Create new user
                user = User(
                    whatsapp_number=whatsapp_number,
                    profile_name=profile_name,
                    onboarding_completed=False,
                    subscription_status='trial',
                    trial_ends_at=datetime.now() + timedelta(days=14)
                )
                session.add(user)
                await session.commit()
                await session.refresh(user)
                
                # Create default user settings
                await self._create_default_user_settings(user.id)
                # Create default reminders
                await self._create_default_reminders(user.id)
                
                logger.info(f"Created new user {user.id} with WhatsApp {whatsapp_number}")
                return user

    async def _create_default_user_settings(self, user_id: int):
        """Create default settings for new user"""
        async with db_manager.get_session() as session:
            settings = UserSettings(
                user_id=user_id,
                tax_mode='pausalni',  # Default to paušální režim
                vat_payer=False,
                vat_monthly=True,
                country='Česká republika',
                tax_office_code='001',
                tax_office_workplace='01',
                okec_code='620200'  # Programming default
            )
            session.add(settings)
            await session.commit()

    async def _create_default_reminders(self, user_id: int):
        """Create default reminders for new user"""
        async with db_manager.get_session() as session:
            now = datetime.now()
            
            # Tax advance reminder for next month 15th
            if now.day <= 15:
                tax_deadline = now.replace(day=15)
            else:
                next_month = now.replace(day=1) + timedelta(days=32)
                tax_deadline = next_month.replace(day=15)
            
            tax_reminder = Reminder(
                user_id=user_id,
                reminder_type='tax_advance',
                title='Zálohy na daň z příjmů',
                message='📅 Připomínka: Nezapomeň zaplatit zálohy na daň z příjmů!',
                due_date=tax_deadline,
                remind_days_before=5
            )
            session.add(tax_reminder)
            
            # VAT reminder for next quarter (if applicable)
            quarter = (now.month - 1) // 3 + 1
            vat_month = quarter * 3 + 1
            if vat_month > 12:
                vat_month = 1
                vat_year = now.year + 1
            else:
                vat_year = now.year
            
            vat_deadline = datetime(vat_year, vat_month, 25)
            
            if vat_deadline > now:
                vat_reminder = Reminder(
                    user_id=user_id,
                    reminder_type='vat',
                    title='DPH přiznání',
                    message='📅 DPH: Nezapomeň podat přiznání k DPH a zaplatit daň!',
                    due_date=vat_deadline,
                    remind_days_before=7
                )
                session.add(vat_reminder)
            
            await session.commit()

    async def save_transaction(self, user_id: int, transaction_data: Dict[str, Any]) -> int:
        """Save new transaction"""
        async with db_manager.get_session() as session:
            transaction = Transaction(
                user_id=user_id,
                type=transaction_data['type'],
                original_message=transaction_data.get('original_message', ''),
                description=transaction_data.get('description', ''),
                amount_czk=Decimal(str(transaction_data['amount'])),
                original_amount=Decimal(str(transaction_data.get('original_amount', transaction_data['amount']))),
                original_currency=transaction_data.get('original_currency', 'CZK'),
                exchange_rate=Decimal(str(transaction_data.get('exchange_rate', 1.0))),
                conversion_date=transaction_data.get('conversion_date'),
                category_code=transaction_data.get('category'),
                category_name=transaction_data.get('category_name'),
                auto_categorized=transaction_data.get('auto_categorized', True),
                vat_rate=transaction_data.get('vat_rate', 0),
                vat_base=Decimal(str(transaction_data['vat_base'])) if transaction_data.get('vat_base') else None,
                vat_amount=Decimal(str(transaction_data['vat_amount'])) if transaction_data.get('vat_amount') else None,
                vat_included=transaction_data.get('vat_included', False),
                document_number=transaction_data.get('document_number'),
                partner_name=transaction_data.get('partner_name'),
                partner_vat_id=transaction_data.get('partner_vat_id'),
                notes=transaction_data.get('notes'),
                tags=transaction_data.get('tags'),
                processed_by_ai=transaction_data.get('processed_by_ai', False),
                ai_confidence=Decimal(str(transaction_data['ai_confidence'])) if transaction_data.get('ai_confidence') else None,
                ai_model_used=transaction_data.get('ai_model_used'),
                transaction_date=transaction_data.get('transaction_date', datetime.now())
            )
            
            session.add(transaction)
            await session.commit()
            await session.refresh(transaction)
            
            logger.info(f"Transaction #{transaction.id} saved for user #{user_id}")
            return transaction.id

    async def get_user_transactions(self, user_id: int, limit: int = 10, offset: int = 0) -> List[Dict[str, Any]]:
        """Get user transactions with pagination"""
        async with db_manager.get_session() as session:
            result = await session.execute(
                select(Transaction)
                .where(Transaction.user_id == user_id)
                .order_by(Transaction.transaction_date.desc())
                .limit(limit)
                .offset(offset)
            )
            transactions = result.scalars().all()
            
            return [
                {
                    'id': t.id,
                    'type': t.type,
                    'amount_czk': float(t.amount_czk),
                    'original_amount': float(t.original_amount) if t.original_amount else None,
                    'original_currency': t.original_currency,
                    'description': t.description,
                    'category_code': t.category_code,
                    'category_name': t.category_name,
                    'vat_rate': t.vat_rate,
                    'vat_amount': float(t.vat_amount) if t.vat_amount else None,
                    'transaction_date': t.transaction_date,
                    'created_at': t.created_at
                }
                for t in transactions
            ]

    async def get_monthly_summary(self, user_id: int, year: int = None, month: int = None) -> Optional[Dict[str, Any]]:
        """Get monthly summary of transactions"""
        async with db_manager.get_session() as session:
            if not year or not month:
                now = datetime.now()
                year = now.year
                month = now.month
            
            # Get summary stats
            result = await session.execute(
                select(
                    func.coalesce(func.sum(
                        func.case((Transaction.type == 'income', Transaction.amount_czk), else_=0)
                    ), 0).label('total_income'),
                    func.coalesce(func.sum(
                        func.case((Transaction.type == 'expense', Transaction.amount_czk), else_=0)
                    ), 0).label('total_expenses'),
                    func.count(Transaction.id).label('transaction_count')
                )
                .where(
                    and_(
                        Transaction.user_id == user_id,
                        func.extract('month', Transaction.transaction_date) == month,
                        func.extract('year', Transaction.transaction_date) == year
                    )
                )
            )
            summary = result.first()
            
            if not summary or summary.transaction_count == 0:
                return None
            
            # Get top expense categories
            result = await session.execute(
                select(
                    Transaction.category_name,
                    func.sum(Transaction.amount_czk).label('amount')
                )
                .where(
                    and_(
                        Transaction.user_id == user_id,
                        Transaction.type == 'expense',
                        func.extract('month', Transaction.transaction_date) == month,
                        func.extract('year', Transaction.transaction_date) == year
                    )
                )
                .group_by(Transaction.category_name)
                .order_by(func.sum(Transaction.amount_czk).desc())
                .limit(3)
            )
            top_expenses = result.all()
            
            return {
                'total_income': float(summary.total_income),
                'total_expenses': float(summary.total_expenses),
                'profit': float(summary.total_income - summary.total_expenses),
                'transaction_count': summary.transaction_count,
                'top_expenses': [
                    {'category_name': exp.category_name, 'amount': float(exp.amount)}
                    for exp in top_expenses
                ]
            }

    async def get_quarterly_summary(self, user_id: int, year: int = None, quarter: int = None) -> Optional[Dict[str, Any]]:
        """Get quarterly summary of transactions"""
        async with db_manager.get_session() as session:
            if not year or not quarter:
                now = datetime.now()
                year = now.year
                quarter = (now.month - 1) // 3 + 1
            
            # Get summary stats
            result = await session.execute(
                select(
                    func.coalesce(func.sum(
                        func.case((Transaction.type == 'income', Transaction.amount_czk), else_=0)
                    ), 0).label('total_income'),
                    func.coalesce(func.sum(
                        func.case((Transaction.type == 'expense', Transaction.amount_czk), else_=0)
                    ), 0).label('total_expenses'),
                    func.count(Transaction.id).label('transaction_count')
                )
                .where(
                    and_(
                        Transaction.user_id == user_id,
                        func.extract('quarter', Transaction.transaction_date) == quarter,
                        func.extract('year', Transaction.transaction_date) == year
                    )
                )
            )
            summary = result.first()
            
            if not summary or summary.transaction_count == 0:
                return None
            
            # Get category breakdown
            result = await session.execute(
                select(
                    Transaction.category_name,
                    func.sum(Transaction.amount_czk).label('amount')
                )
                .where(
                    and_(
                        Transaction.user_id == user_id,
                        Transaction.type == 'expense',
                        func.extract('quarter', Transaction.transaction_date) == quarter,
                        func.extract('year', Transaction.transaction_date) == year
                    )
                )
                .group_by(Transaction.category_name)
                .order_by(func.sum(Transaction.amount_czk).desc())
            )
            category_breakdown = result.all()
            
            total_income = float(summary.total_income)
            vat_estimate = total_income * 0.21 if total_income > 0 else 0
            
            return {
                'total_income': total_income,
                'total_expenses': float(summary.total_expenses),
                'profit': float(summary.total_income - summary.total_expenses),
                'transaction_count': summary.transaction_count,
                'vat_estimate': vat_estimate,
                'category_breakdown': [
                    {'category_name': cat.category_name, 'amount': float(cat.amount)}
                    for cat in category_breakdown
                ]
            }

    async def get_user_settings(self, user_id: int) -> Optional[UserSettings]:
        """Get user settings"""
        async with db_manager.get_session() as session:
            result = await session.execute(
                select(UserSettings).where(UserSettings.user_id == user_id)
            )
            return result.scalar_one_or_none()

    async def update_user_settings(self, user_id: int, settings_data: Dict[str, Any]) -> UserSettings:
        """Update user settings"""
        async with db_manager.get_session() as session:
            result = await session.execute(
                select(UserSettings).where(UserSettings.user_id == user_id)
            )
            settings = result.scalar_one_or_none()
            
            if not settings:
                # Create new settings
                settings = UserSettings(user_id=user_id, **settings_data)
                session.add(settings)
            else:
                # Update existing settings
                for key, value in settings_data.items():
                    if hasattr(settings, key):
                        setattr(settings, key, value)
                settings.updated_at = datetime.now()
            
            await session.commit()
            await session.refresh(settings)
            return settings

    async def get_business_categories(self, business_type: str = None) -> List[Dict[str, Any]]:
        """Get business categories, optionally filtered by business type"""
        async with db_manager.get_session() as session:
            query = select(BusinessCategory)
            if business_type:
                query = query.where(BusinessCategory.business_type == business_type)
            
            result = await session.execute(query.order_by(BusinessCategory.is_primary.desc(), BusinessCategory.category_name))
            categories = result.scalars().all()
            
            return [
                {
                    'id': cat.id,
                    'business_type': cat.business_type,
                    'category_code': cat.category_code,
                    'category_name': cat.category_name,
                    'is_primary': cat.is_primary,
                    'keywords': cat.keywords
                }
                for cat in categories
            ]

    async def get_pending_reminders(self, days_ahead: int = 3) -> List[Dict[str, Any]]:
        """Get pending reminders due within specified days"""
        async with db_manager.get_session() as session:
            cutoff_date = datetime.now().date() + timedelta(days=days_ahead)
            
            result = await session.execute(
                select(Reminder, User.whatsapp_number)
                .join(User, Reminder.user_id == User.id)
                .where(
                    and_(
                        Reminder.due_date <= cutoff_date,
                        Reminder.sent == False,
                        Reminder.dismissed == False
                    )
                )
                .order_by(Reminder.due_date)
            )
            reminders = result.all()
            
            return [
                {
                    'id': r.Reminder.id,
                    'user_id': r.Reminder.user_id,
                    'whatsapp_number': r.whatsapp_number,
                    'reminder_type': r.Reminder.reminder_type,
                    'title': r.Reminder.title,
                    'message': r.Reminder.message,
                    'due_date': r.Reminder.due_date,
                    'priority': r.Reminder.priority
                }
                for r in reminders
            ]

    async def mark_reminder_sent(self, reminder_id: int):
        """Mark reminder as sent"""
        async with db_manager.get_session() as session:
            result = await session.execute(
                select(Reminder).where(Reminder.id == reminder_id)
            )
            reminder = result.scalar_one_or_none()
            
            if reminder:
                reminder.sent = True
                reminder.sent_at = datetime.now()
                await session.commit()

    async def get_user_statistics(self, user_id: int) -> Dict[str, Any]:
        """Get comprehensive user statistics"""
        async with db_manager.get_session() as session:
            result = await session.execute(
                select(
                    func.count(Transaction.id).label('total_transactions'),
                    func.coalesce(func.sum(
                        func.case((Transaction.type == 'income', Transaction.amount_czk), else_=0)
                    ), 0).label('total_income'),
                    func.coalesce(func.sum(
                        func.case((Transaction.type == 'expense', Transaction.amount_czk), else_=0)
                    ), 0).label('total_expenses'),
                    func.min(Transaction.created_at).label('first_transaction'),
                    func.max(Transaction.created_at).label('last_transaction')
                )
                .where(Transaction.user_id == user_id)
            )
            stats = result.first()
            
            if not stats or stats.total_transactions == 0:
                return {
                    'total_transactions': 0,
                    'total_income': 0.0,
                    'total_expenses': 0.0,
                    'profit': 0.0,
                    'first_transaction': None,
                    'last_transaction': None
                }
            
            return {
                'total_transactions': stats.total_transactions,
                'total_income': float(stats.total_income),
                'total_expenses': float(stats.total_expenses),
                'profit': float(stats.total_income - stats.total_expenses),
                'first_transaction': stats.first_transaction,
                'last_transaction': stats.last_transaction
            }

# Global instance
db_operations = DatabaseOperations()