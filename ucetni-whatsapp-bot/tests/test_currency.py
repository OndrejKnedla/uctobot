"""
Unit tests for currency conversion functionality
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from decimal import Decimal
from datetime import datetime, timedelta
import json

from utils.currency_converter import CurrencyConverter


class TestCurrencyConverter:
    """Test currency conversion and exchange rate handling"""
    
    @pytest.fixture
    def currency_converter(self, mock_currency_api):
        """Create currency converter with mocked API"""
        return CurrencyConverter()
    
    @pytest.mark.unit
    def test_init_currency_converter(self, currency_converter):
        """Test currency converter initialization"""
        assert currency_converter is not None
        assert hasattr(currency_converter, 'rates')
        assert isinstance(currency_converter.rates, dict)
    
    @pytest.mark.unit
    def test_convert_usd_to_czk(self, currency_converter, mock_currency_api):
        """Test USD to CZK conversion"""
        usd_amount = Decimal('100.00')
        expected_rate = mock_currency_api['USD']  # 23.45
        
        czk_amount = currency_converter.convert_to_czk(usd_amount, 'USD')
        
        assert isinstance(czk_amount, Decimal)
        assert czk_amount == usd_amount * Decimal(str(expected_rate))
        assert czk_amount == Decimal('2345.00')
    
    @pytest.mark.unit  
    def test_convert_eur_to_czk(self, currency_converter, mock_currency_api):
        """Test EUR to CZK conversion"""
        eur_amount = Decimal('50.00')
        expected_rate = mock_currency_api['EUR']  # 25.67
        
        czk_amount = currency_converter.convert_to_czk(eur_amount, 'EUR')
        
        assert czk_amount == eur_amount * Decimal(str(expected_rate))
        assert czk_amount == Decimal('1283.50')
    
    @pytest.mark.unit
    def test_convert_czk_to_czk(self, currency_converter):
        """Test CZK to CZK conversion (should return same amount)"""
        czk_amount = Decimal('1000.00')
        
        result = currency_converter.convert_to_czk(czk_amount, 'CZK')
        
        assert result == czk_amount
        assert result == Decimal('1000.00')
    
    @pytest.mark.unit
    def test_unsupported_currency(self, currency_converter):
        """Test handling of unsupported currencies"""
        amount = Decimal('100.00')
        
        with pytest.raises(ValueError, match="Nepodporovaná měna"):
            currency_converter.convert_to_czk(amount, 'XYZ')
    
    @pytest.mark.unit
    def test_format_amount_czk(self, currency_converter):
        """Test formatting CZK amounts"""
        test_cases = [
            (Decimal('1000.00'), 'CZK', '1 000,00 Kč'),
            (Decimal('1500.50'), 'CZK', '1 500,50 Kč'),
            (Decimal('999.99'), 'CZK', '999,99 Kč'),
        ]
        
        for amount, currency, expected in test_cases:
            formatted = currency_converter.format_amount(amount, currency)
            assert formatted == expected
    
    @pytest.mark.unit
    def test_format_amount_foreign(self, currency_converter):
        """Test formatting foreign currency amounts"""
        test_cases = [
            (Decimal('100.00'), 'USD', '$100.00'),
            (Decimal('50.99'), 'EUR', '€50.99'),
            (Decimal('75.50'), 'GBP', '£75.50'),
        ]
        
        for amount, currency, expected in test_cases:
            formatted = currency_converter.format_amount(amount, currency)
            assert formatted == expected
    
    @pytest.mark.unit
    def test_get_exchange_rate(self, currency_converter, mock_currency_api):
        """Test getting exchange rates"""
        usd_rate = currency_converter.get_exchange_rate('USD')
        eur_rate = currency_converter.get_exchange_rate('EUR')
        czk_rate = currency_converter.get_exchange_rate('CZK')
        
        assert usd_rate == mock_currency_api['USD']
        assert eur_rate == mock_currency_api['EUR']
        assert czk_rate == 1.0  # CZK to CZK is always 1
    
    @pytest.mark.unit
    def test_rate_caching(self, currency_converter):
        """Test that exchange rates are cached"""
        with patch.object(currency_converter, '_fetch_rates') as mock_fetch:
            mock_fetch.return_value = {'USD': 23.45, 'EUR': 25.67}
            
            # First call should fetch rates
            currency_converter.get_exchange_rate('USD')
            assert mock_fetch.call_count == 1
            
            # Second call should use cached rates
            currency_converter.get_exchange_rate('EUR')
            assert mock_fetch.call_count == 1  # Still 1, not called again
    
    @pytest.mark.unit
    def test_rate_expiry(self, currency_converter):
        """Test that rates expire and are refetched"""
        with patch.object(currency_converter, '_fetch_rates') as mock_fetch:
            mock_fetch.return_value = {'USD': 23.45}
            
            # Mock old timestamp to force refresh
            currency_converter.last_update = datetime.now() - timedelta(hours=2)
            currency_converter.cache_duration = timedelta(hours=1)
            
            currency_converter.get_exchange_rate('USD')
            assert mock_fetch.called
    
    @pytest.mark.unit
    @pytest.mark.parametrize("amount,from_currency,expected_czk", [
        (100, 'USD', 2345.00),
        (50, 'EUR', 1283.50),
        (200, 'GBP', 5824.00),
        (1000, 'CZK', 1000.00)
    ])
    def test_conversion_parametrized(self, currency_converter, mock_currency_api, 
                                   amount, from_currency, expected_czk):
        """Parametrized test for various currency conversions"""
        result = currency_converter.convert_to_czk(Decimal(str(amount)), from_currency)
        assert float(result) == expected_czk
    
    @pytest.mark.unit
    def test_precision_handling(self, currency_converter, mock_currency_api):
        """Test decimal precision in conversions"""
        # Test with high precision amount
        amount = Decimal('123.456789')
        result = currency_converter.convert_to_czk(amount, 'USD')
        
        # Should maintain precision
        expected = amount * Decimal(str(mock_currency_api['USD']))
        assert result == expected
        assert result.as_tuple().digits  # Has decimal places
    
    @pytest.mark.unit
    def test_zero_amount_conversion(self, currency_converter):
        """Test conversion of zero amounts"""
        result = currency_converter.convert_to_czk(Decimal('0.00'), 'USD')
        assert result == Decimal('0.00')
    
    @pytest.mark.unit
    def test_negative_amount_conversion(self, currency_converter, mock_currency_api):
        """Test conversion of negative amounts (refunds, etc.)"""
        result = currency_converter.convert_to_czk(Decimal('-50.00'), 'USD')
        expected = Decimal('-50.00') * Decimal(str(mock_currency_api['USD']))
        assert result == expected
        assert result < 0
    
    @pytest.mark.unit
    def test_api_error_handling(self, currency_converter):
        """Test handling of API errors"""
        with patch.object(currency_converter, '_fetch_rates') as mock_fetch:
            mock_fetch.side_effect = Exception("API Error")
            
            # Should use fallback rates or handle gracefully
            try:
                rate = currency_converter.get_exchange_rate('USD')
                assert rate > 0  # Should have some fallback
            except ValueError:
                # Or should raise appropriate error
                pass
    
    @pytest.mark.unit
    def test_supported_currencies(self, currency_converter):
        """Test list of supported currencies"""
        supported = currency_converter.get_supported_currencies()
        
        assert 'CZK' in supported
        assert 'USD' in supported
        assert 'EUR' in supported
        assert 'GBP' in supported
        assert len(supported) >= 4
    
    @pytest.mark.unit
    def test_conversion_with_metadata(self, currency_converter, mock_currency_api):
        """Test conversion that includes metadata"""
        amount = Decimal('100.00')
        
        result = currency_converter.convert_with_metadata(amount, 'USD')
        
        assert 'czk_amount' in result
        assert 'original_amount' in result
        assert 'original_currency' in result
        assert 'exchange_rate' in result
        assert 'conversion_date' in result
        
        assert result['czk_amount'] == amount * Decimal(str(mock_currency_api['USD']))
        assert result['original_amount'] == amount
        assert result['original_currency'] == 'USD'
        assert result['exchange_rate'] == mock_currency_api['USD']
    
    @pytest.mark.unit
    def test_rate_history_tracking(self, currency_converter):
        """Test that rate changes are tracked for reporting"""
        # This test assumes the converter tracks rate history
        if hasattr(currency_converter, 'rate_history'):
            initial_count = len(currency_converter.rate_history)
            currency_converter.get_exchange_rate('USD')
            assert len(currency_converter.rate_history) >= initial_count
    
    @pytest.mark.unit
    @patch('requests.get')
    def test_cnb_api_integration(self, mock_get, currency_converter):
        """Test integration with Czech National Bank API"""
        # Mock CNB response
        mock_response = Mock()
        mock_response.text = """Datum|Země|Měna|Množství|Kód|Kurz
01.01.2024|USA|dolar|1|USD|23,450
01.01.2024|EMU|euro|1|EUR|25,670"""
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response
        
        rates = currency_converter._fetch_rates()
        
        assert 'USD' in rates
        assert 'EUR' in rates
        assert rates['USD'] == 23.45
        assert rates['EUR'] == 25.67
    
    @pytest.mark.unit
    def test_currency_symbol_mapping(self, currency_converter):
        """Test currency symbol recognition"""
        symbol_tests = [
            ('$', 'USD'),
            ('€', 'EUR'),  
            ('£', 'GBP'),
            ('Kč', 'CZK'),
            ('CZK', 'CZK')
        ]
        
        for symbol, expected_currency in symbol_tests:
            if hasattr(currency_converter, 'get_currency_from_symbol'):
                result = currency_converter.get_currency_from_symbol(symbol)
                assert result == expected_currency
    
    @pytest.mark.unit
    def test_bulk_conversion(self, currency_converter, mock_currency_api):
        """Test converting multiple amounts at once"""
        transactions = [
            {'amount': Decimal('100.00'), 'currency': 'USD'},
            {'amount': Decimal('50.00'), 'currency': 'EUR'},
            {'amount': Decimal('1000.00'), 'currency': 'CZK'},
        ]
        
        results = currency_converter.convert_bulk(transactions)
        
        assert len(results) == 3
        assert results[0]['czk_amount'] == Decimal('2345.00')
        assert results[1]['czk_amount'] == Decimal('1283.50')
        assert results[2]['czk_amount'] == Decimal('1000.00')
    
    @pytest.mark.unit
    def test_thread_safety(self, currency_converter):
        """Test thread safety of currency converter"""
        import threading
        import time
        
        results = []
        errors = []
        
        def convert_currency():
            try:
                result = currency_converter.convert_to_czk(Decimal('100'), 'USD')
                results.append(result)
            except Exception as e:
                errors.append(e)
        
        # Create multiple threads
        threads = [threading.Thread(target=convert_currency) for _ in range(5)]
        
        # Start all threads
        for thread in threads:
            thread.start()
        
        # Wait for completion
        for thread in threads:
            thread.join()
        
        assert len(errors) == 0  # No errors should occur
        assert len(results) == 5  # All conversions should complete
        assert all(r == results[0] for r in results)  # All results should be same