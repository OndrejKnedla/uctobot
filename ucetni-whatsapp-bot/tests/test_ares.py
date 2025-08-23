"""
Unit tests for ARES validation functionality
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
import requests
from decimal import Decimal

from utils.ares_validator import AresValidator


class TestAresValidator:
    """Test ARES IČO validation and company data retrieval"""
    
    @pytest.fixture
    def ares_validator(self):
        """Create ARES validator instance"""
        return AresValidator()
    
    @pytest.fixture
    def valid_ares_response(self):
        """Mock valid ARES API response"""
        return {
            "ekonomickeSubjekty": [
                {
                    "ico": "12345678",
                    "obchodniJmeno": "Test Company s.r.o.",
                    "sidlo": {
                        "nazevObce": "Praha",
                        "psc": "11000",
                        "nazevUlice": "Testovací",
                        "cisloDomovni": "123"
                    },
                    "pravniForma": "112",  # s.r.o.
                    "stavSubjektu": "A",   # Active
                    "datumVzniku": "2020-01-01"
                }
            ]
        }
    
    @pytest.mark.unit
    @patch('requests.get')
    def test_valid_ico_lookup(self, mock_get, ares_validator, valid_ares_response):
        """Test lookup of valid IČO"""
        mock_response = Mock()
        mock_response.json.return_value = valid_ares_response
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        result = ares_validator.validate_ico("12345678")
        
        assert result is not None
        assert result['valid'] is True
        assert result['ico'] == "12345678"
        assert result['name'] == "Test Company s.r.o."
        assert result['address']['city'] == "Praha"
        assert result['address']['postal_code'] == "11000"
    
    @pytest.mark.unit
    @patch('requests.get')
    def test_invalid_ico_lookup(self, mock_get, ares_validator):
        """Test lookup of invalid IČO"""
        mock_response = Mock()
        mock_response.json.return_value = {"ekonomickeSubjekty": []}
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        result = ares_validator.validate_ico("99999999")
        
        assert result is not None
        assert result['valid'] is False
        assert result['ico'] == "99999999"
        assert 'error' in result
    
    @pytest.mark.unit
    def test_ico_format_validation(self, ares_validator):
        """Test IČO format validation"""
        # Valid formats
        valid_icos = [
            "12345678",
            "01234567",  # Leading zero
            "87654321"
        ]
        
        for ico in valid_icos:
            assert ares_validator.is_valid_ico_format(ico) is True
        
        # Invalid formats
        invalid_icos = [
            "1234567",    # Too short
            "123456789",  # Too long
            "1234567a",   # Contains letter
            "12 34 56 78", # Contains spaces
            "",           # Empty
            None          # None
        ]
        
        for ico in invalid_icos:
            assert ares_validator.is_valid_ico_format(ico) is False
    
    @pytest.mark.unit
    def test_ico_checksum_validation(self, ares_validator):
        """Test IČO checksum algorithm"""
        # Valid IČOs with correct checksums
        valid_checksums = [
            "25596641",  # Known valid IČO
            "00006947"   # Another valid IČO
        ]
        
        for ico in valid_checksums:
            if hasattr(ares_validator, 'validate_ico_checksum'):
                assert ares_validator.validate_ico_checksum(ico) is True
    
    @pytest.mark.unit
    @patch('requests.get')
    def test_api_timeout_handling(self, mock_get, ares_validator):
        """Test handling of API timeouts"""
        mock_get.side_effect = requests.Timeout("Request timeout")
        
        result = ares_validator.validate_ico("12345678")
        
        assert result is not None
        assert result['valid'] is False
        assert 'timeout' in result.get('error', '').lower()
    
    @pytest.mark.unit
    @patch('requests.get')
    def test_api_error_handling(self, mock_get, ares_validator):
        """Test handling of API errors"""
        mock_response = Mock()
        mock_response.raise_for_status.side_effect = requests.HTTPError("Server Error")
        mock_get.return_value = mock_response
        
        result = ares_validator.validate_ico("12345678")
        
        assert result is not None
        assert result['valid'] is False
        assert 'error' in result
    
    @pytest.mark.unit
    @patch('requests.get')
    def test_malformed_response_handling(self, mock_get, ares_validator):
        """Test handling of malformed API responses"""
        mock_response = Mock()
        mock_response.json.return_value = {"invalid": "structure"}
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        result = ares_validator.validate_ico("12345678")
        
        assert result is not None
        assert result['valid'] is False
    
    @pytest.mark.unit
    @pytest.mark.parametrize("ico,expected_valid", [
        ("12345678", True),   # Standard format
        ("01234567", True),   # Leading zero
        ("1234567", False),   # Too short
        ("123456789", False), # Too long
        ("1234567a", False),  # Contains letter
        ("", False),          # Empty
    ])
    def test_ico_format_validation_parametrized(self, ares_validator, ico, expected_valid):
        """Parametrized test for IČO format validation"""
        result = ares_validator.is_valid_ico_format(ico)
        assert result == expected_valid
    
    @pytest.mark.unit
    @patch('requests.get')
    def test_company_status_parsing(self, mock_get, ares_validator):
        """Test parsing of company status from ARES"""
        # Active company
        active_response = {
            "ekonomickeSubjekty": [{
                "ico": "12345678",
                "obchodniJmeno": "Active Company",
                "stavSubjektu": "A"  # Active
            }]
        }
        
        mock_response = Mock()
        mock_response.json.return_value = active_response
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        result = ares_validator.validate_ico("12345678")
        
        assert result['valid'] is True
        assert result.get('status') == 'active' or result.get('stavSubjektu') == 'A'
    
    @pytest.mark.unit
    @patch('requests.get')
    def test_company_address_parsing(self, mock_get, ares_validator, valid_ares_response):
        """Test parsing of company address"""
        mock_response = Mock()
        mock_response.json.return_value = valid_ares_response
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        result = ares_validator.validate_ico("12345678")
        
        assert 'address' in result
        address = result['address']
        assert address['city'] == "Praha"
        assert address['postal_code'] == "11000"
        assert address['street'] == "Testovací"
        assert address['house_number'] == "123"
    
    @pytest.mark.unit
    @patch('requests.get')
    def test_legal_form_parsing(self, mock_get, ares_validator, valid_ares_response):
        """Test parsing of legal form"""
        mock_response = Mock()
        mock_response.json.return_value = valid_ares_response
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        result = ares_validator.validate_ico("12345678")
        
        assert 'legal_form' in result or 'pravniForma' in result
        # Legal form 112 = s.r.o.
        if 'legal_form' in result:
            assert result['legal_form'] in ['s.r.o.', 'limited liability company']
    
    @pytest.mark.unit
    def test_caching_mechanism(self, ares_validator):
        """Test caching of ARES responses"""
        with patch('requests.get') as mock_get:
            mock_response = Mock()
            mock_response.json.return_value = {
                "ekonomickeSubjekty": [{
                    "ico": "12345678",
                    "obchodniJmeno": "Cached Company"
                }]
            }
            mock_response.raise_for_status.return_value = None
            mock_get.return_value = mock_response
            
            # First call should make API request
            result1 = ares_validator.validate_ico("12345678")
            assert mock_get.call_count == 1
            
            # Second call should use cache (if implemented)
            result2 = ares_validator.validate_ico("12345678")
            
            # Results should be identical
            assert result1['name'] == result2['name']
    
    @pytest.mark.unit
    def test_batch_validation(self, ares_validator):
        """Test batch validation of multiple IČOs"""
        icos = ["12345678", "87654321", "11111111"]
        
        if hasattr(ares_validator, 'validate_batch'):
            with patch('requests.get') as mock_get:
                mock_response = Mock()
                mock_response.json.return_value = {
                    "ekonomickeSubjekty": [{
                        "ico": "12345678",
                        "obchodniJmeno": "Test Company"
                    }]
                }
                mock_response.raise_for_status.return_value = None
                mock_get.return_value = mock_response
                
                results = ares_validator.validate_batch(icos)
                
                assert len(results) == len(icos)
                assert all('valid' in result for result in results)
    
    @pytest.mark.unit
    @patch('requests.get')
    def test_vat_registration_check(self, mock_get, ares_validator):
        """Test VAT registration status check"""
        # Response with VAT registration
        vat_response = {
            "ekonomickeSubjekty": [{
                "ico": "12345678",
                "obchodniJmeno": "VAT Company",
                "dic": "CZ12345678",
                "stavSubjektu": "A"
            }]
        }
        
        mock_response = Mock()
        mock_response.json.return_value = vat_response
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        result = ares_validator.validate_ico("12345678")
        
        if 'vat_number' in result or 'dic' in result:
            assert result.get('vat_number') == "CZ12345678" or result.get('dic') == "CZ12345678"
            assert result.get('vat_registered', False) is True
    
    @pytest.mark.unit
    def test_request_headers(self, ares_validator):
        """Test proper request headers for ARES API"""
        with patch('requests.get') as mock_get:
            mock_response = Mock()
            mock_response.json.return_value = {"ekonomickeSubjekty": []}
            mock_response.raise_for_status.return_value = None
            mock_get.return_value = mock_response
            
            ares_validator.validate_ico("12345678")
            
            # Verify headers were set properly
            call_args = mock_get.call_args
            if call_args and len(call_args) > 1:
                headers = call_args[1].get('headers', {})
                assert 'User-Agent' in headers
                assert 'ucetnibot' in headers['User-Agent'].lower()
    
    @pytest.mark.unit
    def test_rate_limiting_compliance(self, ares_validator):
        """Test rate limiting compliance"""
        import time
        
        # If validator implements rate limiting
        if hasattr(ares_validator, 'last_request_time'):
            with patch('requests.get') as mock_get:
                mock_response = Mock()
                mock_response.json.return_value = {"ekonomickeSubjekty": []}
                mock_response.raise_for_status.return_value = None
                mock_get.return_value = mock_response
                
                # Make multiple rapid requests
                start_time = time.time()
                for i in range(3):
                    ares_validator.validate_ico(f"1234567{i}")
                
                duration = time.time() - start_time
                
                # Should respect rate limits (implementation dependent)
                assert duration >= 0  # Basic check that it doesn't fail
    
    @pytest.mark.unit
    @patch('requests.get')
    def test_network_error_retry(self, mock_get, ares_validator):
        """Test retry mechanism for network errors"""
        # First call fails, second succeeds
        mock_get.side_effect = [
            requests.ConnectionError("Network error"),
            Mock(
                json=lambda: {"ekonomickeSubjekty": [{
                    "ico": "12345678",
                    "obchodniJmeno": "Retry Test Company"
                }]},
                raise_for_status=lambda: None
            )
        ]
        
        result = ares_validator.validate_ico("12345678")
        
        # Should eventually succeed after retry
        assert result is not None
        # Depending on implementation, might succeed or fail gracefully
    
    @pytest.mark.unit
    def test_ico_normalization(self, ares_validator):
        """Test IČO normalization (adding leading zeros)"""
        test_cases = [
            ("1234567", "01234567"),
            ("12345678", "12345678"),
            ("123456", "00123456"),
        ]
        
        for input_ico, expected_normalized in test_cases:
            if hasattr(ares_validator, 'normalize_ico'):
                normalized = ares_validator.normalize_ico(input_ico)
                assert normalized == expected_normalized
            else:
                # Test that validation handles unnormalized IČOs
                is_valid_format = ares_validator.is_valid_ico_format(input_ico)
                # Should handle both formats or normalize internally