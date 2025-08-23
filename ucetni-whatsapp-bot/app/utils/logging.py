"""
Structured logging configuration for ÚčetníBot
"""
import os
import sys
import json
from datetime import datetime
from typing import Any, Dict, Optional
import structlog
import logging
from pythonjsonlogger import jsonlogger


class CustomJSONFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter with Czech timestamps and additional fields"""
    
    def add_fields(self, log_record: Dict[str, Any], record: logging.LogRecord, message_dict: Dict[str, Any]) -> None:
        super().add_fields(log_record, record, message_dict)
        
        # Add timestamp in Prague timezone
        if not log_record.get('timestamp'):
            log_record['timestamp'] = datetime.now().isoformat()
        
        # Add service information
        log_record['service'] = 'ucetni-whatsapp-bot'
        log_record['version'] = os.getenv('APP_VERSION', '1.0.0')
        log_record['environment'] = os.getenv('ENVIRONMENT', 'development')
        
        # Add level in uppercase
        if log_record.get('level'):
            log_record['level'] = log_record['level'].upper()


def configure_logging():
    """Configure structured logging based on environment"""
    
    log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
    log_format = os.getenv('LOG_FORMAT', 'json').lower()
    environment = os.getenv('ENVIRONMENT', 'development')
    
    # Configure structlog processors
    processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.TimeStamper(fmt="iso", utc=False),
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.StackInfoRenderer(),
    ]
    
    if environment == 'development':
        # Pretty console output for development
        processors.extend([
            structlog.dev.ConsoleRenderer(colors=True)
        ])
        formatter = None
    else:
        # JSON output for production
        processors.extend([
            structlog.processors.dict_tracebacks,
            structlog.processors.JSONRenderer()
        ])
        formatter = CustomJSONFormatter(
            '%(timestamp)s %(level)s %(name)s %(message)s %(pathname)s %(lineno)d'
        )
    
    # Configure structlog
    structlog.configure(
        processors=processors,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level)
    )
    
    # Apply JSON formatter to all handlers if needed
    if formatter:
        for handler in logging.root.handlers:
            handler.setFormatter(formatter)
    
    return structlog.get_logger()


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """Get a structured logger instance"""
    return structlog.get_logger(name)


def log_whatsapp_message(
    logger: structlog.stdlib.BoundLogger,
    direction: str,  # 'incoming' or 'outgoing'
    phone_number: str,
    message: str,
    user_id: Optional[int] = None,
    message_sid: Optional[str] = None,
    **kwargs
):
    """Log WhatsApp message with structured format"""
    
    log_data = {
        'event_type': 'whatsapp_message',
        'direction': direction,
        'phone_number': phone_number,
        'message_length': len(message),
        'message_preview': message[:100] + '...' if len(message) > 100 else message,
        'user_id': user_id,
        'message_sid': message_sid,
        **kwargs
    }
    
    logger.info("WhatsApp message processed", **log_data)


def log_transaction(
    logger: structlog.stdlib.BoundLogger,
    user_id: int,
    transaction_type: str,  # 'income' or 'expense'
    amount: float,
    description: str,
    category: Optional[str] = None,
    **kwargs
):
    """Log transaction with structured format"""
    
    log_data = {
        'event_type': 'transaction',
        'user_id': user_id,
        'transaction_type': transaction_type,
        'amount': amount,
        'currency': 'CZK',
        'description': description[:100] + '...' if len(description) > 100 else description,
        'category': category,
        **kwargs
    }
    
    logger.info("Transaction processed", **log_data)


def log_user_action(
    logger: structlog.stdlib.BoundLogger,
    user_id: int,
    action: str,
    success: bool = True,
    error_message: Optional[str] = None,
    **kwargs
):
    """Log user action with structured format"""
    
    log_data = {
        'event_type': 'user_action',
        'user_id': user_id,
        'action': action,
        'success': success,
        'error_message': error_message,
        **kwargs
    }
    
    if success:
        logger.info("User action completed", **log_data)
    else:
        logger.error("User action failed", **log_data)


def log_api_request(
    logger: structlog.stdlib.BoundLogger,
    method: str,
    endpoint: str,
    status_code: int,
    duration_ms: float,
    user_id: Optional[int] = None,
    **kwargs
):
    """Log API request with structured format"""
    
    log_data = {
        'event_type': 'api_request',
        'method': method,
        'endpoint': endpoint,
        'status_code': status_code,
        'duration_ms': round(duration_ms, 2),
        'user_id': user_id,
        **kwargs
    }
    
    if 200 <= status_code < 400:
        logger.info("API request completed", **log_data)
    else:
        logger.warning("API request failed", **log_data)


def log_database_operation(
    logger: structlog.stdlib.BoundLogger,
    operation: str,  # 'select', 'insert', 'update', 'delete'
    table: str,
    duration_ms: Optional[float] = None,
    rows_affected: Optional[int] = None,
    error: Optional[str] = None,
    **kwargs
):
    """Log database operation with structured format"""
    
    log_data = {
        'event_type': 'database_operation',
        'operation': operation,
        'table': table,
        'duration_ms': round(duration_ms, 2) if duration_ms else None,
        'rows_affected': rows_affected,
        'error': error,
        **kwargs
    }
    
    if error:
        logger.error("Database operation failed", **log_data)
    else:
        logger.info("Database operation completed", **log_data)


# Initialize logger on module import
logger = configure_logging()