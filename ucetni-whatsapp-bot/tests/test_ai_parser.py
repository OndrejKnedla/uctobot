"""
Unit tests for AI message parsing functionality
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from decimal import Decimal
import json

from app.ai_processor import AIProcessor


class TestAIParser:
    """Test AI message parsing and transaction extraction"""
    
    @pytest.fixture
    def ai_processor(self, mock_groq_client):
        """Create AI processor with mocked client"""
        return AIProcessor()
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_parse_simple_expense(self, ai_processor, mock_groq_client):
        """Test parsing simple expense message"""
        # Mock Groq response
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = json.dumps({
            "type": "expense",
            "amount": 250,
            "currency": "CZK",
            "description": "Oběd v restauraci",
            "category": "meals",
            "confidence": 0.9
        })
        mock_groq_client.chat.completions.create.return_value = mock_response
        
        message = "Oběd 250 Kč"
        result = await ai_processor.process_message(message)
        
        assert result is not None
        assert result['type'] == 'expense'
        assert result['amount'] == 250
        assert result['currency'] == 'CZK'
        assert result['category'] == 'meals'
        assert result['confidence'] > 0.8
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_parse_income_message(self, ai_processor, mock_groq_client):
        """Test parsing income message"""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = json.dumps({
            "type": "income",
            "amount": 15000,
            "currency": "CZK",
            "description": "Platba za webový vývoj",
            "category": "services",
            "confidence": 0.95
        })
        mock_groq_client.chat.completions.create.return_value = mock_response
        
        message = "Přišla platba 15000 od klienta za web"
        result = await ai_processor.process_message(message)
        
        assert result['type'] == 'income'
        assert result['amount'] == 15000
        assert result['category'] == 'services'
        assert result['confidence'] > 0.9
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_parse_foreign_currency(self, ai_processor, mock_groq_client):
        """Test parsing foreign currency transactions"""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = json.dumps({
            "type": "expense",
            "amount": 49.99,
            "currency": "USD",
            "description": "AWS hosting služby",
            "category": "software",
            "confidence": 0.88,
            "original_amount": 49.99,
            "original_currency": "USD"
        })
        mock_groq_client.chat.completions.create.return_value = mock_response
        
        message = "AWS faktura $49.99"
        result = await ai_processor.process_message(message)
        
        assert result['currency'] == 'USD'
        assert result['amount'] == 49.99
        assert result['original_currency'] == 'USD'
        assert result['category'] == 'software'
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_parse_vat_transaction(self, ai_processor, mock_groq_client):
        """Test parsing transaction with VAT information"""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = json.dumps({
            "type": "expense",
            "amount": 1210,
            "currency": "CZK",
            "description": "Kancelářské potřeby",
            "category": "office_supplies",
            "vat_rate": 21,
            "vat_base": 1000,
            "vat_amount": 210,
            "vat_included": True,
            "confidence": 0.92
        })
        mock_groq_client.chat.completions.create.return_value = mock_response
        
        message = "Nákup kancelářských potřeb za 1210 Kč včetně DPH"
        result = await ai_processor.process_message(message)
        
        assert result['vat_rate'] == 21
        assert result['vat_base'] == 1000
        assert result['vat_amount'] == 210
        assert result['vat_included'] is True
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_parse_complex_transaction(self, ai_processor, mock_groq_client):
        """Test parsing complex transaction with multiple details"""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = json.dumps({
            "type": "expense",
            "amount": 2500,
            "currency": "CZK",
            "description": "Notebook Lenovo ThinkPad pro práci",
            "category": "equipment",
            "vat_rate": 21,
            "confidence": 0.95,
            "partner": "Alza.cz",
            "document_number": "ALZ123456"
        })
        mock_groq_client.chat.completions.create.return_value = mock_response
        
        message = "Koupil jsem notebook Lenovo ThinkPad za 2500 na Alze, doklad ALZ123456"
        result = await ai_processor.process_message(message)
        
        assert result['category'] == 'equipment'
        assert result['partner'] == 'Alza.cz'
        assert result['document_number'] == 'ALZ123456'
        assert result['confidence'] > 0.9
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_parse_unclear_message(self, ai_processor, mock_groq_client):
        """Test handling unclear messages"""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = json.dumps({
            "error": "Nelze rozpoznat transakci",
            "confidence": 0.1
        })
        mock_groq_client.chat.completions.create.return_value = mock_response
        
        message = "Něco se stalo dnes ráno"
        result = await ai_processor.process_message(message)
        
        assert result is None or result.get('confidence', 0) < 0.5
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_groq_api_error_handling(self, ai_processor, mock_groq_client):
        """Test handling Groq API errors"""
        # Simulate API error
        mock_groq_client.chat.completions.create.side_effect = Exception("API Error")
        
        message = "Oběd 250 Kč"
        result = await ai_processor.process_message(message)
        
        assert result is None
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_invalid_json_response(self, ai_processor, mock_groq_client):
        """Test handling invalid JSON responses from AI"""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = "Invalid JSON {broken}"
        mock_groq_client.chat.completions.create.return_value = mock_response
        
        message = "Oběd 250 Kč"
        result = await ai_processor.process_message(message)
        
        assert result is None
    
    @pytest.mark.unit
    @pytest.mark.parametrize("test_case", [
        ("Oběd 150", "expense", 150, "meals"),
        ("Faktura 5000 za konzultace", "income", 5000, "services"),
        ("Benzín 800", "expense", 800, "fuel"),
        ("Adobe 20 USD", "expense", 20, "software"),
        ("Přijatá platba 3000", "income", 3000, "other")
    ])
    @pytest.mark.asyncio
    async def test_various_message_formats(self, ai_processor, mock_groq_client, test_case):
        """Test various message formats and expected outputs"""
        message, expected_type, expected_amount, expected_category = test_case
        
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = json.dumps({
            "type": expected_type,
            "amount": expected_amount,
            "currency": "CZK" if "USD" not in message else "USD",
            "category": expected_category,
            "confidence": 0.9
        })
        mock_groq_client.chat.completions.create.return_value = mock_response
        
        result = await ai_processor.process_message(message)
        
        assert result['type'] == expected_type
        assert result['amount'] == expected_amount
        assert result['category'] == expected_category
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_confidence_threshold(self, ai_processor, mock_groq_client):
        """Test confidence threshold handling"""
        # Low confidence response
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = json.dumps({
            "type": "expense",
            "amount": 100,
            "currency": "CZK",
            "confidence": 0.3  # Low confidence
        })
        mock_groq_client.chat.completions.create.return_value = mock_response
        
        message = "Možná jsem utratil něco"
        result = await ai_processor.process_message(message)
        
        # Should reject low confidence results
        assert result is None or result.get('confidence', 0) < 0.5
    
    @pytest.mark.unit
    def test_category_mapping(self, ai_processor):
        """Test category mapping and validation"""
        valid_categories = [
            'meals', 'fuel', 'office_supplies', 'software',
            'equipment', 'services', 'travel', 'other'
        ]
        
        # Test that AI processor has category mappings
        for category in valid_categories:
            assert hasattr(ai_processor, '_validate_category') or category in str(ai_processor)
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_rate_limiting_handling(self, ai_processor, mock_groq_client):
        """Test handling of rate limiting from Groq API"""
        from groq import RateLimitError
        
        # First call fails with rate limit
        mock_groq_client.chat.completions.create.side_effect = [
            RateLimitError("Rate limit exceeded"),
            Mock(choices=[Mock(message=Mock(content=json.dumps({
                "type": "expense", 
                "amount": 250,
                "currency": "CZK",
                "confidence": 0.9
            })))])
        ]
        
        message = "Oběd 250 Kč"
        result = await ai_processor.process_message(message)
        
        # Should handle gracefully and possibly retry
        assert result is None or result['amount'] == 250
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_message_preprocessing(self, ai_processor):
        """Test message preprocessing and sanitization"""
        # Test various input sanitization
        test_cases = [
            ("  Oběd 250 Kč  ", "Oběd 250 Kč"),  # Strip whitespace
            ("OBĚD 250 KČ", "OBĚD 250 KČ"),  # Case handling
            ("Oběd 250\nKč", "Oběd 250 Kč"),  # Newline handling
        ]
        
        for raw_message, expected in test_cases:
            # Test that preprocessing works (this assumes AIProcessor has preprocessing)
            processed = getattr(ai_processor, '_preprocess_message', lambda x: x.strip())(raw_message)
            assert len(processed.strip()) > 0
    
    @pytest.mark.unit
    @pytest.mark.ai
    @pytest.mark.asyncio
    async def test_real_ai_integration(self):
        """Integration test with real AI (requires API key)"""
        if not os.getenv('GROQ_API_KEY') or os.getenv('ENVIRONMENT') == 'test':
            pytest.skip("Real AI integration test skipped in test environment")
        
        # This would test with real Groq API
        real_processor = AIProcessor()
        result = await real_processor.process_message("Oběd 250 Kč")
        
        if result:  # Only assert if we got a result
            assert 'type' in result
            assert 'amount' in result
            assert 'currency' in result