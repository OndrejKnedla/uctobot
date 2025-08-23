"""
Test configuration and fixtures for ÚčetníBot
"""
import pytest
import os
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from typing import Generator, Dict, Any
import tempfile
from datetime import datetime, timedelta
from decimal import Decimal

# Set test environment
os.environ['ENVIRONMENT'] = 'test'
os.environ['DATABASE_URL'] = 'sqlite+aiosqlite:///./test_ucetni_bot.db'
os.environ['DEBUG'] = 'true'

# Mock external APIs by default
os.environ['TWILIO_ACCOUNT_SID'] = 'test_sid'
os.environ['TWILIO_AUTH_TOKEN'] = 'test_token'
os.environ['GROQ_API_KEY'] = 'test_groq_key'
os.environ['STRIPE_SECRET_KEY'] = 'sk_test_mock_key'
os.environ['WEBHOOK_URL'] = 'https://test.example.com'


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def db_session():
    """Create test database session"""
    from app.database.connection import get_db_session
    from app.database.models import Base
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    
    # Create test database
    engine = create_async_engine(
        'sqlite+aiosqlite:///./test_ucetni_bot.db',
        echo=False,
        future=True
    )
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create session
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session
        await session.rollback()
    
    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest.fixture
def mock_twilio_client():
    """Mock Twilio client"""
    with patch('utils.twilio_client.TwilioClient') as mock:
        client = Mock()
        client.send_message = AsyncMock(return_value=True)
        mock.return_value = client
        yield client


@pytest.fixture
def mock_groq_client():
    """Mock Groq AI client"""
    with patch('groq.Groq') as mock:
        client = Mock()
        client.chat.completions.create = Mock()
        mock.return_value = client
        yield client


@pytest.fixture
def mock_currency_api():
    """Mock currency conversion API"""
    mock_rates = {
        'USD': 23.45,
        'EUR': 25.67,
        'GBP': 29.12,
        'PLN': 5.89
    }
    
    with patch('utils.currency_converter.CurrencyConverter._fetch_rates') as mock:
        mock.return_value = mock_rates
        yield mock_rates


@pytest.fixture
def mock_ares_api():
    """Mock ARES validation API"""
    mock_response = {
        'ico': '12345678',
        'name': 'Test Company s.r.o.',
        'address': 'Testovací 123, Praha',
        'valid': True
    }
    
    with patch('utils.ares_validator.AresValidator.validate_ico') as mock:
        mock.return_value = mock_response
        yield mock


@pytest.fixture
def sample_user_data():
    """Sample user data for testing"""
    return {
        'id': 1,
        'whatsapp_number': '+420123456789',
        'profile_name': 'Test User',
        'onboarding_completed': True,
        'subscription_status': 'trial',
        'trial_ends_at': datetime.now() + timedelta(days=7)
    }


@pytest.fixture
def sample_transaction_data():
    """Sample transaction data for testing"""
    return {
        'type': 'expense',
        'amount': 1500.50,
        'currency': 'CZK',
        'description': 'Nákup kancelářských potřeb',
        'category': 'office_supplies',
        'confidence': 0.95,
        'vat_rate': 21,
        'vat_included': True
    }


@pytest.fixture
def sample_ai_responses():
    """Sample AI responses for different message types"""
    return {
        'expense_simple': {
            'type': 'expense',
            'amount': 500,
            'currency': 'CZK',
            'description': 'Oběd v restauraci',
            'category': 'meals',
            'confidence': 0.9
        },
        'income_with_vat': {
            'type': 'income',
            'amount': 12000,
            'currency': 'CZK',
            'description': 'Faktura za webový vývoj',
            'category': 'services',
            'vat_rate': 21,
            'confidence': 0.95
        },
        'foreign_currency': {
            'type': 'expense',
            'amount': 49.99,
            'currency': 'USD',
            'description': 'AWS hosting',
            'category': 'software',
            'confidence': 0.88
        },
        'complex_transaction': {
            'type': 'expense',
            'amount': 2500,
            'currency': 'CZK',
            'description': 'Nákup notebooku pro práci',
            'category': 'equipment',
            'vat_rate': 21,
            'confidence': 0.92,
            'partner': 'Alza.cz'
        }
    }


@pytest.fixture
def sample_vat_data():
    """Sample VAT calculation data"""
    return {
        'transactions': [
            {
                'type': 'income',
                'amount': 24200,
                'vat_rate': 21,
                'vat_base': 20000,
                'vat_amount': 4200
            },
            {
                'type': 'expense', 
                'amount': 1210,
                'vat_rate': 21,
                'vat_base': 1000,
                'vat_amount': 210
            }
        ],
        'expected_output_vat': 4200,
        'expected_input_vat': 210,
        'expected_liability': 3990
    }


@pytest.fixture
def test_messages():
    """Test WhatsApp messages for parsing"""
    return {
        'simple_expense': 'Oběd 250 Kč',
        'complex_expense': 'Nákup kancelářských potřeb v Tescu za 1500 Kč včetně DPH',
        'income': 'Přišla platba 15000 od klienta za web',
        'foreign_currency': 'AWS faktura $49.99',
        'with_description': 'Tankování benzínu 1200 Kč na čerpačce Shell',
        'unclear_message': 'Něco se stalo dnes ráno',
        'command': '/dph export',
        'help': 'pomoc'
    }


@pytest.fixture
def mock_stripe_client():
    """Mock Stripe client for payment tests"""
    with patch('stripe.api_key'), \
         patch('stripe.Customer') as mock_customer, \
         patch('stripe.checkout.Session') as mock_session:
        
        # Mock customer creation
        mock_customer.create.return_value = Mock(id='cus_test123')
        mock_customer.list.return_value = Mock(data=[])
        
        # Mock checkout session
        mock_session.create.return_value = Mock(
            id='cs_test123',
            url='https://checkout.stripe.com/pay/cs_test123'
        )
        
        yield {
            'customer': mock_customer,
            'session': mock_session
        }


@pytest.fixture 
def load_test_config():
    """Configuration for load testing"""
    return {
        'concurrent_users': 100,
        'duration_seconds': 60,
        'ramp_up_seconds': 10,
        'messages_per_user': 5,
        'target_response_time_ms': 2000
    }


# Test data cleanup
@pytest.fixture(autouse=True)
def cleanup_test_files():
    """Clean up test files after each test"""
    yield
    
    # Remove test database if exists
    test_db_files = [
        'test_ucetni_bot.db',
        'test_invoice.pdf',
        'invoice_counter.txt'
    ]
    
    for file in test_db_files:
        if os.path.exists(file):
            try:
                os.remove(file)
            except:
                pass


# Pytest plugins and async support
def pytest_configure(config):
    """Configure pytest"""
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))


# Custom markers
pytest_plugins = ['pytest_asyncio']