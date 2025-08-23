"""
Databázový wrapper pro zachování kompatibility se starým kódem
"""

import logging
from .database.operations import db_operations

logger = logging.getLogger(__name__)

class Database:
    """
    Kompatibilní wrapper pro starý Database interface
    Všechny operace nyní deleguje na nové SQLAlchemy operace
    """
    
    def __init__(self):
        logger.info("Database wrapper initialized - using new SQLAlchemy backend")
    
    async def get_monthly_summary(self, user_id: int):
        """Get monthly summary for user"""
        return await db_operations.get_monthly_summary(user_id)
    
    async def get_quarterly_summary(self, user_id: int):
        """Get quarterly summary for user"""
        return await db_operations.get_quarterly_summary(user_id)
    
    async def export_to_csv(self, user_id: int):
        """Export user data to CSV"""
        return await db_operations.export_to_csv(user_id)
    
    async def save_transaction(self, user_id: int, transaction_data: dict):
        """Save transaction to database"""
        return await db_operations.save_transaction(user_id, transaction_data)
    
    async def get_all_users(self):
        """Get all users"""
        return await db_operations.get_all_users()
    
    async def get_transactions(self, user_id: int, limit: int = 10, offset: int = 0):
        """Get user transactions"""
        return await db_operations.get_transactions(user_id, limit, offset)
    
    async def get_pending_reminders(self):
        """Get pending reminders"""
        return await db_operations.get_pending_reminders()
    
    async def mark_reminder_sent(self, reminder_id: int):
        """Mark reminder as sent"""
        return await db_operations.mark_reminder_sent(reminder_id)