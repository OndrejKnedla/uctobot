"""
Sentry integration for error tracking and performance monitoring
"""
import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.httpx import HttpxIntegration
from sentry_sdk.integrations.asyncio import AsyncioIntegration
from sentry_sdk.integrations.logging import LoggingIntegration


def init_sentry():
    """Initialize Sentry for error tracking and performance monitoring"""
    
    sentry_dsn = os.getenv('SENTRY_DSN')
    environment = os.getenv('ENVIRONMENT', 'development')
    
    if not sentry_dsn:
        print("⚠️  Sentry DSN not configured - error tracking disabled")
        return
    
    # Configure Sentry
    sentry_sdk.init(
        dsn=sentry_dsn,
        environment=environment,
        
        # Performance monitoring
        traces_sample_rate=0.1 if environment == 'production' else 1.0,
        profiles_sample_rate=0.1 if environment == 'production' else 1.0,
        
        # Error sampling
        sample_rate=1.0,
        
        # Integrations
        integrations=[
            FastApiIntegration(
                auto_session_tracking=True,
                transaction_style="endpoint"
            ),
            SqlalchemyIntegration(),
            HttpxIntegration(),
            AsyncioIntegration(),
            LoggingIntegration(
                level=None,  # Capture all logs
                event_level=None  # Send logs as breadcrumbs
            ),
        ],
        
        # Release tracking
        release=os.getenv('APP_VERSION', '1.0.0'),
        
        # Additional options
        attach_stacktrace=True,
        send_default_pii=False,  # Don't send personal information
        max_breadcrumbs=50,
        
        # Filter sensitive data
        before_send=filter_sensitive_data,
    )
    
    # Set user context
    sentry_sdk.set_tag("service", "ucetni-whatsapp-bot")
    sentry_sdk.set_tag("environment", environment)
    
    print(f"✅ Sentry initialized for {environment} environment")


def filter_sensitive_data(event, hint):
    """Filter sensitive data from Sentry events"""
    
    # Remove sensitive keys from event data
    sensitive_keys = [
        'twilio_auth_token',
        'twilio_account_sid', 
        'groq_api_key',
        'secret_key',
        'password',
        'token',
        'api_key',
        'auth',
        'whatsapp_number',
        'phone_number'
    ]
    
    def clean_dict(data):
        if isinstance(data, dict):
            for key in list(data.keys()):
                if any(sensitive_key in key.lower() for sensitive_key in sensitive_keys):
                    data[key] = '[REDACTED]'
                elif isinstance(data[key], (dict, list)):
                    clean_dict(data[key])
        elif isinstance(data, list):
            for item in data:
                clean_dict(item)
    
    # Clean the event
    clean_dict(event)
    
    return event


def capture_whatsapp_context(phone_number: str, user_id: int = None, message_preview: str = None):
    """Capture WhatsApp specific context for error tracking"""
    
    sentry_sdk.set_tag("whatsapp.phone_number", phone_number[-4:])  # Last 4 digits only
    
    if user_id:
        sentry_sdk.set_user({"id": user_id})
    
    if message_preview:
        sentry_sdk.add_breadcrumb(
            message="WhatsApp message received",
            category="whatsapp",
            data={
                "message_length": len(message_preview),
                "message_preview": message_preview[:50] + "..." if len(message_preview) > 50 else message_preview
            }
        )


def capture_transaction_context(user_id: int, transaction_type: str, amount: float, category: str = None):
    """Capture transaction specific context for error tracking"""
    
    sentry_sdk.set_user({"id": user_id})
    sentry_sdk.set_tag("transaction.type", transaction_type)
    sentry_sdk.set_tag("transaction.category", category)
    
    sentry_sdk.add_breadcrumb(
        message="Transaction processed",
        category="transaction",
        data={
            "type": transaction_type,
            "amount": amount,
            "category": category
        }
    )


def capture_database_context(operation: str, table: str, rows_affected: int = None):
    """Capture database specific context for error tracking"""
    
    sentry_sdk.set_tag("db.operation", operation)
    sentry_sdk.set_tag("db.table", table)
    
    sentry_sdk.add_breadcrumb(
        message="Database operation",
        category="database",
        data={
            "operation": operation,
            "table": table,
            "rows_affected": rows_affected
        }
    )


def capture_api_context(method: str, endpoint: str, status_code: int = None):
    """Capture API request specific context for error tracking"""
    
    sentry_sdk.set_tag("http.method", method)
    sentry_sdk.set_tag("http.endpoint", endpoint)
    
    if status_code:
        sentry_sdk.set_tag("http.status_code", status_code)
    
    sentry_sdk.add_breadcrumb(
        message="API request",
        category="http",
        data={
            "method": method,
            "endpoint": endpoint,
            "status_code": status_code
        }
    )


def capture_business_event(event_name: str, **data):
    """Capture business-specific events for tracking"""
    
    sentry_sdk.add_breadcrumb(
        message=f"Business event: {event_name}",
        category="business",
        data=data
    )
    
    # Also capture as a custom event
    with sentry_sdk.push_scope() as scope:
        scope.set_tag("event_type", "business")
        scope.set_tag("event_name", event_name)
        
        for key, value in data.items():
            scope.set_extra(key, value)
        
        sentry_sdk.capture_message(f"Business event: {event_name}", level="info")


# Custom exception classes for better error categorization
class WhatsAppError(Exception):
    """WhatsApp related errors"""
    pass


class TransactionError(Exception):
    """Transaction processing errors"""
    pass


class DatabaseError(Exception):
    """Database related errors"""
    pass


class AIProcessingError(Exception):
    """AI processing errors"""
    pass


class ValidationError(Exception):
    """Data validation errors"""
    pass