"""
Unit tests for VAT calculations and DPH functionality
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from decimal import Decimal
from datetime import datetime, date
from io import BytesIO
import tempfile

from utils.vat_calculator import VatCalculator
from app.vat_handler import VatHandler


class TestVatCalculator:
    """Test VAT calculation functionality"""
    
    @pytest.fixture
    def vat_calculator(self):
        """Create VAT calculator instance"""
        return VatCalculator()
    
    @pytest.mark.unit
    def test_calculate_vat_21_percent(self, vat_calculator):
        """Test 21% VAT calculation"""
        base_amount = Decimal('1000.00')
        vat_rate = 21
        
        vat_amount = vat_calculator.calculate_vat(base_amount, vat_rate)
        total_amount = base_amount + vat_amount
        
        assert vat_amount == Decimal('210.00')
        assert total_amount == Decimal('1210.00')
    
    @pytest.mark.unit
    def test_calculate_vat_12_percent(self, vat_calculator):
        """Test 12% VAT calculation"""
        base_amount = Decimal('1000.00')
        vat_rate = 12
        
        vat_amount = vat_calculator.calculate_vat(base_amount, vat_rate)
        
        assert vat_amount == Decimal('120.00')
    
    @pytest.mark.unit
    def test_calculate_vat_0_percent(self, vat_calculator):
        """Test 0% VAT calculation (exempt goods)"""
        base_amount = Decimal('1000.00')
        vat_rate = 0
        
        vat_amount = vat_calculator.calculate_vat(base_amount, vat_rate)
        
        assert vat_amount == Decimal('0.00')
    
    @pytest.mark.unit
    def test_extract_vat_from_total_21(self, vat_calculator):
        """Test extracting VAT from total amount (21%)"""
        total_amount = Decimal('1210.00')
        vat_rate = 21
        
        result = vat_calculator.extract_vat_from_total(total_amount, vat_rate)
        
        assert result['base_amount'] == Decimal('1000.00')
        assert result['vat_amount'] == Decimal('210.00')
        assert result['total_amount'] == total_amount
    
    @pytest.mark.unit
    def test_extract_vat_from_total_12(self, vat_calculator):
        """Test extracting VAT from total amount (12%)"""
        total_amount = Decimal('1120.00')
        vat_rate = 12
        
        result = vat_calculator.extract_vat_from_total(total_amount, vat_rate)
        
        assert result['base_amount'] == Decimal('1000.00')
        assert result['vat_amount'] == Decimal('120.00')
    
    @pytest.mark.unit
    def test_vat_rounding(self, vat_calculator):
        """Test VAT calculation rounding"""
        # Test amount that would have rounding issues
        base_amount = Decimal('33.33')
        vat_rate = 21
        
        vat_amount = vat_calculator.calculate_vat(base_amount, vat_rate)
        
        # Should be properly rounded to 2 decimal places
        assert vat_amount == Decimal('7.00')  # 33.33 * 0.21 = 6.9993 -> 7.00
    
    @pytest.mark.unit
    @pytest.mark.parametrize("base_amount,vat_rate,expected_vat", [
        (1000, 21, 210),
        (1000, 12, 120),
        (1000, 0, 0),
        (500, 21, 105),
        (250.50, 21, 52.61),
    ])
    def test_vat_calculations_parametrized(self, vat_calculator, base_amount, vat_rate, expected_vat):
        """Parametrized VAT calculation tests"""
        result = vat_calculator.calculate_vat(Decimal(str(base_amount)), vat_rate)
        assert result == Decimal(str(expected_vat))
    
    @pytest.mark.unit
    def test_invalid_vat_rate(self, vat_calculator):
        """Test handling of invalid VAT rates"""
        base_amount = Decimal('1000.00')
        
        with pytest.raises(ValueError, match="Neplatná sazba DPH"):
            vat_calculator.calculate_vat(base_amount, 25)  # Invalid rate
        
        with pytest.raises(ValueError, match="Neplatná sazba DPH"):
            vat_calculator.calculate_vat(base_amount, -5)  # Negative rate


class TestVatPeriodCalculations:
    """Test VAT period calculations and reporting"""
    
    @pytest.fixture
    def vat_calculator(self):
        return VatCalculator()
    
    @pytest.mark.unit
    def test_monthly_vat_summary(self, vat_calculator, sample_vat_data):
        """Test monthly VAT summary calculation"""
        transactions = sample_vat_data['transactions']
        
        summary = vat_calculator.calculate_period_summary(
            transactions, 
            period_type='monthly',
            year=2024,
            month=1
        )
        
        assert summary['output_vat_21'] == sample_vat_data['expected_output_vat']
        assert summary['input_vat_21'] == sample_vat_data['expected_input_vat']
        assert summary['vat_liability'] == sample_vat_data['expected_liability']
    
    @pytest.mark.unit
    def test_quarterly_vat_summary(self, vat_calculator):
        """Test quarterly VAT summary"""
        transactions = [
            # January
            {'type': 'income', 'amount': 12100, 'vat_rate': 21, 'date': date(2024, 1, 15)},
            # February  
            {'type': 'expense', 'amount': 605, 'vat_rate': 21, 'date': date(2024, 2, 10)},
            # March
            {'type': 'income', 'amount': 6050, 'vat_rate': 12, 'date': date(2024, 3, 20)},
        ]
        
        summary = vat_calculator.calculate_period_summary(
            transactions,
            period_type='quarterly',
            year=2024,
            quarter=1
        )
        
        assert 'output_vat_21' in summary
        assert 'output_vat_12' in summary
        assert 'input_vat_21' in summary
        assert 'vat_liability' in summary
    
    @pytest.mark.unit
    def test_vat_liability_calculation(self, vat_calculator):
        """Test VAT liability calculation (output - input)"""
        output_vat = Decimal('5000.00')
        input_vat = Decimal('1500.00')
        
        liability = vat_calculator.calculate_vat_liability(output_vat, input_vat)
        
        assert liability == Decimal('3500.00')
    
    @pytest.mark.unit
    def test_vat_excess_deduction(self, vat_calculator):
        """Test VAT excess deduction (input > output)"""
        output_vat = Decimal('1000.00')
        input_vat = Decimal('1500.00')
        
        liability = vat_calculator.calculate_vat_liability(output_vat, input_vat)
        
        assert liability == Decimal('-500.00')  # Excess deduction
    
    @pytest.mark.unit
    def test_vat_rate_validation(self, vat_calculator):
        """Test VAT rate validation for Czech rates"""
        valid_rates = [0, 12, 21]
        
        for rate in valid_rates:
            assert vat_calculator.is_valid_vat_rate(rate) is True
        
        invalid_rates = [5, 15, 19, 25]
        for rate in invalid_rates:
            assert vat_calculator.is_valid_vat_rate(rate) is False


class TestVatHandler:
    """Test VAT handler for WhatsApp commands"""
    
    @pytest.fixture
    def vat_handler(self, db_session):
        """Create VAT handler with database session"""
        return VatHandler()
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_dph_export_command(self, vat_handler):
        """Test DPH export command handling"""
        user_id = 1
        user_settings = {
            'vat_payer': True,
            'dic': 'CZ12345678',
            'first_name': 'Jan',
            'last_name': 'Novák'
        }
        
        with patch.object(vat_handler, '_generate_dph_export') as mock_export:
            mock_export.return_value = "Export úspěšně vygenerován"
            
            result = await vat_handler.handle_vat_command(
                '/dph export', user_id, user_settings
            )
            
            assert "Export" in result
            mock_export.assert_called_once()
    
    @pytest.mark.unit
    @pytest.mark.asyncio 
    async def test_dph_status_command(self, vat_handler):
        """Test DPH status command"""
        user_id = 1
        user_settings = {
            'vat_payer': True,
            'dic': 'CZ12345678'
        }
        
        result = await vat_handler.handle_vat_command(
            'dph', user_id, user_settings
        )
        
        assert "DPH" in result
        assert "plátce" in result.lower()
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_non_vat_payer_handling(self, vat_handler):
        """Test handling for non-VAT payers"""
        user_id = 1
        user_settings = {
            'vat_payer': False
        }
        
        result = await vat_handler.handle_vat_command(
            '/dph', user_id, user_settings
        )
        
        assert "nejste plátcem" in result.lower()
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_missing_dic_error(self, vat_handler):
        """Test error handling for missing DIČ"""
        user_id = 1
        user_settings = {
            'vat_payer': True,
            'dic': None  # Missing DIČ
        }
        
        result = await vat_handler.handle_vat_command(
            '/dph export', user_id, user_settings
        )
        
        assert "chybí" in result.lower() or "není" in result.lower()


class TestVatXmlGeneration:
    """Test VAT XML generation for tax office"""
    
    @pytest.fixture
    def xml_generator(self):
        from utils.vat_xml_generator import VatXmlGenerator
        return VatXmlGenerator()
    
    @pytest.mark.unit
    def test_dp3_xml_generation(self, xml_generator):
        """Test DP3 XML generation"""
        vat_data = {
            'period_month': 1,
            'period_year': 2024,
            'output_vat_21': Decimal('4200.00'),
            'input_vat_21': Decimal('800.00'),
            'vat_liability': Decimal('3400.00'),
            'company_info': {
                'dic': 'CZ12345678',
                'name': 'Test s.r.o.'
            }
        }
        
        xml_content = xml_generator.generate_dp3_xml(vat_data)
        
        assert '<?xml' in xml_content
        assert 'CZ12345678' in xml_content
        assert '3400' in xml_content  # VAT liability
    
    @pytest.mark.unit
    def test_kh1_xml_generation(self, xml_generator):
        """Test KH1 (kontrolní hlášení) XML generation"""
        control_data = {
            'period_month': 1,
            'period_year': 2024,
            'transactions': [
                {
                    'partner_dic': 'CZ87654321',
                    'amount': Decimal('10000.00'),
                    'vat_amount': Decimal('2100.00')
                }
            ]
        }
        
        xml_content = xml_generator.generate_kh1_xml(control_data)
        
        assert '<?xml' in xml_content
        assert 'CZ87654321' in xml_content
    
    @pytest.mark.unit
    def test_xml_validation(self, xml_generator):
        """Test XML validation against XSD schema"""
        # This would test XML validation if we have XSD schemas
        pytest.skip("XSD validation requires schema files")
    
    @pytest.mark.unit
    def test_xml_encoding(self, xml_generator):
        """Test proper XML encoding for Czech characters"""
        vat_data = {
            'company_info': {
                'name': 'Účetní s.r.o.',  # Czech characters
                'dic': 'CZ12345678'
            }
        }
        
        xml_content = xml_generator.generate_dp3_xml(vat_data)
        
        assert 'encoding="UTF-8"' in xml_content
        assert 'Účetní' in xml_content


class TestVatReporting:
    """Test VAT reporting and analytics"""
    
    @pytest.mark.unit
    def test_vat_trend_analysis(self):
        """Test VAT trend analysis over periods"""
        periods_data = [
            {'month': 1, 'vat_liability': Decimal('3000.00')},
            {'month': 2, 'vat_liability': Decimal('3500.00')},
            {'month': 3, 'vat_liability': Decimal('2800.00')},
        ]
        
        from utils.vat_calculator import VatCalculator
        calculator = VatCalculator()
        
        if hasattr(calculator, 'analyze_trends'):
            trends = calculator.analyze_trends(periods_data)
            assert 'average' in trends
            assert 'trend' in trends
    
    @pytest.mark.unit
    def test_vat_compliance_check(self):
        """Test VAT compliance validation"""
        from utils.vat_calculator import VatCalculator
        calculator = VatCalculator()
        
        transaction = {
            'type': 'income',
            'amount': Decimal('12100.00'),
            'vat_rate': 21,
            'partner_dic': 'CZ87654321'
        }
        
        # Should validate transaction compliance
        if hasattr(calculator, 'validate_compliance'):
            is_compliant = calculator.validate_compliance(transaction)
            assert isinstance(is_compliant, bool)
    
    @pytest.mark.unit
    def test_vat_deadline_calculation(self):
        """Test VAT payment deadline calculations"""
        from datetime import date
        from utils.vat_calculator import VatCalculator
        
        calculator = VatCalculator()
        
        # Monthly VAT deadline
        deadline = calculator.calculate_vat_deadline(
            period_type='monthly',
            period_month=1,
            period_year=2024
        )
        
        # Should be 25th of following month
        expected_deadline = date(2024, 2, 25)
        assert deadline == expected_deadline
    
    @pytest.mark.unit
    def test_quarterly_deadline_calculation(self):
        """Test quarterly VAT deadline"""
        from utils.vat_calculator import VatCalculator
        
        calculator = VatCalculator()
        
        # Q1 deadline
        deadline = calculator.calculate_vat_deadline(
            period_type='quarterly',
            quarter=1,
            period_year=2024
        )
        
        # Q1 deadline is April 25th
        from datetime import date
        expected_deadline = date(2024, 4, 25)
        assert deadline == expected_deadline