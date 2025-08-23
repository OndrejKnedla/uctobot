import os
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import csv
import io
import base64

from .connection import (
    db_manager,
    get_db_session,
    init_database,
    close_database,
    test_database_connection,
    handle_db_errors
)

from .models import (
    Base,
    User,
    UserSettings,
    Transaction,
    VatRecord,
    BusinessCategory,
    Reminder,
    ExportHistory,
    BUSINESS_CATEGORIES_DATA
)

from .operations import db_operations

logger = logging.getLogger(__name__)

class Database:
    """
    Database interface that uses real SQLAlchemy operations
    This maintains compatibility with existing code while using real database
    """
    
    def __init__(self):
        self.database_url = os.getenv('DATABASE_URL')
        logger.info("Real database initialized with SQLAlchemy")

    async def connect(self):
        """Initialize database connection"""
        try:
            await db_operations.init_database(self.database_url)
            logger.info("Database connected successfully")
        except Exception as e:
            logger.error(f"Error connecting to database: {str(e)}")
            raise

    async def disconnect(self):
        """Close database connection"""
        try:
            await close_database()
            logger.info("Database disconnected")
        except Exception as e:
            logger.error(f"Error disconnecting database: {str(e)}")

    async def get_or_create_user(self, whatsapp_number: str, profile_name: str = None) -> Dict[str, Any]:
        """Get existing user or create new one"""
        user = await db_operations.get_or_create_user(whatsapp_number, profile_name)
        return {
            'id': user.id,
            'whatsapp_number': user.whatsapp_number,
            'profile_name': user.profile_name,
            'business_name': user.profile_name,  # For backward compatibility
            'onboarding_completed': user.onboarding_completed,
            'subscription_status': user.subscription_status,
            'created_at': user.created_at,
            'updated_at': user.updated_at
        }

    async def save_transaction(self, user_id: int, transaction_data: Dict[str, Any]) -> int:
        """Save transaction to database"""
        return await db_operations.save_transaction(user_id, transaction_data)

    async def get_monthly_summary(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get monthly summary for user"""
        return await db_operations.get_monthly_summary(user_id)

    async def get_quarterly_summary(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get quarterly summary for user"""
        return await db_operations.get_quarterly_summary(user_id)

    async def get_transactions(self, user_id: int, limit: int = 10, offset: int = 0) -> List[Dict[str, Any]]:
        """Get transactions for user"""
        return await db_operations.get_transactions(user_id, limit, offset)

    async def export_to_csv(self, user_id: int) -> str:
        """Export user transactions to CSV"""
        return await db_operations.export_to_csv(user_id)

    async def get_pending_reminders(self) -> List[Dict[str, Any]]:
        """Get pending reminders"""
        return await db_operations.get_pending_reminders()

    async def mark_reminder_sent(self, reminder_id: int):
        """Mark reminder as sent"""
        await db_operations.mark_reminder_sent(reminder_id)

    async def get_user_statistics(self, user_id: int) -> Dict[str, Any]:
        """Get user statistics"""
        return await db_operations.get_user_statistics(user_id)

__all__ = [
    # Database class
    'Database',
    
    # Connection management
    'db_manager',
    'get_db_session', 
    'init_database',
    'close_database',
    'test_database_connection',
    'handle_db_errors',
    
    # Models
    'Base',
    'User',
    'UserSettings',
    'Transaction',
    'VatRecord',
    'BusinessCategory',
    'Reminder',
    'ExportHistory',
    'BUSINESS_CATEGORIES_DATA'
]