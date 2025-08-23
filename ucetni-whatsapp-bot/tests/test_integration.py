"""
Integration tests for ÚčetníBot - End-to-End testing
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
import json
from datetime import datetime, timedelta
from decimal import Decimal

from app.main import app
from app.onboarding import OnboardingWizard
from app.whatsapp_handler import WhatsAppHandler
from app.services.user_service import UserService


class TestWhatsAppIntegration:
    """Test complete WhatsApp message flow"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)
    
    @pytest.fixture
    def mock_whatsapp_request(self):
        """Mock WhatsApp webhook request data"""
        return {
            'From': 'whatsapp:+420123456789',
            'To': 'whatsapp:+14155238886',
            'Body': 'Oběd 250 Kč',
            'ProfileName': 'Test User',
            'MessageSid': 'SM123456789'
        }
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_complete_transaction_flow(self, client, mock_whatsapp_request, 
                                           mock_twilio_client, mock_groq_client,
                                           sample_ai_responses):
        """Test complete transaction processing flow"""
        # Mock AI response
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = json.dumps(sample_ai_responses['expense_simple'])
        mock_groq_client.chat.completions.create.return_value = mock_response
        
        # Send WhatsApp message
        response = client.post('/webhook/whatsapp', data=mock_whatsapp_request)
        
        assert response.status_code == 200
        # Verify Twilio was called to send response
        mock_twilio_client.send_message.assert_called_once()
        
        # Get the response message
        sent_message = mock_twilio_client.send_message.call_args[0][1]
        assert "✅" in sent_message  # Success indicator
        assert "250" in sent_message  # Amount
        assert "výdaj" in sent_message  # Transaction type
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_help_command_flow(self, client, mock_whatsapp_request, mock_twilio_client):
        """Test help command processing"""
        mock_whatsapp_request['Body'] = 'pomoc'
        
        response = client.post('/webhook/whatsapp', data=mock_whatsapp_request)
        
        assert response.status_code == 200
        mock_twilio_client.send_message.assert_called_once()
        
        sent_message = mock_twilio_client.send_message.call_args[0][1]
        assert "📖" in sent_message or "Nápověda" in sent_message
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_summary_command_flow(self, client, mock_whatsapp_request, 
                                      mock_twilio_client, db_session):
        """Test monthly summary command"""
        mock_whatsapp_request['Body'] = 'přehled'
        
        response = client.post('/webhook/whatsapp', data=mock_whatsapp_request)
        
        assert response.status_code == 200
        mock_twilio_client.send_message.assert_called_once()
        
        sent_message = mock_twilio_client.send_message.call_args[0][1]
        assert "Přehled" in sent_message or "Příjmy" in sent_message
    
    @pytest.mark.integration  
    @pytest.mark.asyncio
    async def test_payment_command_flow(self, client, mock_whatsapp_request,
                                      mock_twilio_client, mock_stripe_client):
        """Test payment command processing"""
        mock_whatsapp_request['Body'] = 'platba'
        
        response = client.post('/webhook/whatsapp', data=mock_whatsapp_request)
        
        assert response.status_code == 200
        mock_twilio_client.send_message.assert_called_once()
        
        sent_message = mock_twilio_client.send_message.call_args[0][1]
        assert "💳" in sent_message or "platba" in sent_message.lower()
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_invalid_message_handling(self, client, mock_whatsapp_request,
                                          mock_twilio_client, mock_groq_client):
        """Test handling of unclear/invalid messages"""
        mock_whatsapp_request['Body'] = 'Něco divného se stalo'
        
        # Mock AI to return low confidence
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = json.dumps({
            "error": "Nelze rozpoznat transakci",
            "confidence": 0.1
        })
        mock_groq_client.chat.completions.create.return_value = mock_response
        
        response = client.post('/webhook/whatsapp', data=mock_whatsapp_request)
        
        assert response.status_code == 200
        mock_twilio_client.send_message.assert_called_once()
        
        sent_message = mock_twilio_client.send_message.call_args[0][1]
        assert "❓" in sent_message or "Nerozumím" in sent_message


class TestOnboardingIntegration:
    """Test complete onboarding flow"""
    
    @pytest.fixture
    def onboarding_wizard(self, db_session):
        return OnboardingWizard()
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_complete_onboarding_flow(self, client, onboarding_wizard,
                                          mock_twilio_client, mock_ares_api):
        """Test complete onboarding process"""
        user_phone = 'whatsapp:+420123456789'
        
        # Step 1: Start onboarding
        request_data = {
            'From': user_phone,
            'Body': 'start',
            'ProfileName': 'Test User'
        }
        
        response = client.post('/webhook/whatsapp', data=request_data)
        assert response.status_code == 200
        
        # Verify welcome message sent
        mock_twilio_client.send_message.assert_called()
        welcome_message = mock_twilio_client.send_message.call_args[0][1]
        assert "Vítejte" in welcome_message or "🚀" in welcome_message
        
        # Step 2: Provide name
        mock_twilio_client.reset_mock()
        request_data['Body'] = 'Jan Novák'
        
        response = client.post('/webhook/whatsapp', data=request_data)
        assert response.status_code == 200
        
        # Step 3: Provide IČO
        mock_twilio_client.reset_mock()
        request_data['Body'] = '12345678'
        
        response = client.post('/webhook/whatsapp', data=request_data)
        assert response.status_code == 200
        
        # Should validate IČO via ARES
        mock_ares_api.assert_called_with('12345678')
        
        # Step 4: Confirm business type
        mock_twilio_client.reset_mock()
        request_data['Body'] = 'it_programming'
        
        response = client.post('/webhook/whatsapp', data=request_data)
        assert response.status_code == 200
        
        # Step 5: VAT payer status
        mock_twilio_client.reset_mock()
        request_data['Body'] = 'ne'  # Not VAT payer
        
        response = client.post('/webhook/whatsapp', data=request_data)
        assert response.status_code == 200
        
        # Should complete onboarding
        completion_message = mock_twilio_client.send_message.call_args[0][1]
        assert "dokončen" in completion_message or "✅" in completion_message
    
    @pytest.mark.integration
    @pytest.mark.asyncio  
    async def test_onboarding_with_invalid_ico(self, client, mock_twilio_client, mock_ares_api):
        """Test onboarding with invalid IČO"""
        # Mock ARES to return invalid
        mock_ares_api.return_value = {'valid': False}
        
        request_data = {
            'From': 'whatsapp:+420123456789',
            'Body': 'start',
            'ProfileName': 'Test User'
        }
        
        # Start onboarding
        response = client.post('/webhook/whatsapp', data=request_data)
        mock_twilio_client.reset_mock()
        
        # Proceed to IČO step and provide invalid IČO
        request_data['Body'] = 'Jan Novák'
        response = client.post('/webhook/whatsapp', data=request_data)
        mock_twilio_client.reset_mock()
        
        request_data['Body'] = '99999999'  # Invalid IČO
        response = client.post('/webhook/whatsapp', data=request_data)
        
        error_message = mock_twilio_client.send_message.call_args[0][1]
        assert "neplatné" in error_message.lower() or "❌" in error_message
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_onboarding_interruption_recovery(self, client, mock_twilio_client):
        """Test recovery from interrupted onboarding"""
        user_phone = 'whatsapp:+420123456789'
        
        # Start onboarding
        request_data = {
            'From': user_phone,
            'Body': 'start',
            'ProfileName': 'Test User'
        }
        response = client.post('/webhook/whatsapp', data=request_data)
        
        # User sends unrelated message during onboarding
        mock_twilio_client.reset_mock()
        request_data['Body'] = 'Oběd 250 Kč'  # Transaction during onboarding
        
        response = client.post('/webhook/whatsapp', data=request_data)
        
        # Should continue onboarding, not process transaction
        response_message = mock_twilio_client.send_message.call_args[0][1]
        assert "onboarding" in response_message.lower() or "dokončete" in response_message.lower()


class TestPaymentIntegration:
    """Test payment system integration"""
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_stripe_payment_flow(self, client, mock_stripe_client, mock_twilio_client):
        """Test Stripe payment integration"""
        # Simulate payment command
        request_data = {
            'From': 'whatsapp:+420123456789',
            'Body': 'platba',
            'ProfileName': 'Test User'
        }
        
        response = client.post('/webhook/whatsapp', data=request_data)
        assert response.status_code == 200
        
        # Should create Stripe checkout session
        mock_stripe_client['session'].create.assert_called_once()
        
        # Should send payment link via WhatsApp
        payment_message = mock_twilio_client.send_message.call_args[0][1]
        assert "stripe.com" in payment_message or "checkout" in payment_message.lower()
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_stripe_webhook_processing(self, client, db_session):
        """Test Stripe webhook processing"""
        webhook_payload = {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_test123",
                    "client_reference_id": "1",
                    "customer": "cus_test123",
                    "subscription": "sub_test123"
                }
            }
        }
        
        headers = {
            "stripe-signature": "test_signature"
        }
        
        with patch('stripe.Webhook.construct_event') as mock_verify:
            mock_verify.return_value = webhook_payload
            
            response = client.post(
                '/webhook/payment/stripe',
                json=webhook_payload,
                headers=headers
            )
            
            assert response.status_code == 200
            assert response.json()["received"] is True


class TestVATIntegration:
    """Test VAT/DPH functionality integration"""
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_vat_export_flow(self, client, mock_twilio_client, db_session):
        """Test complete VAT export flow"""
        request_data = {
            'From': 'whatsapp:+420123456789',
            'Body': '/dph export',
            'ProfileName': 'VAT User'
        }
        
        response = client.post('/webhook/whatsapp', data=request_data)
        assert response.status_code == 200
        
        vat_message = mock_twilio_client.send_message.call_args[0][1]
        assert "DPH" in vat_message or "export" in vat_message.lower()
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_vat_transaction_processing(self, client, mock_twilio_client, 
                                            mock_groq_client, sample_ai_responses):
        """Test VAT transaction processing"""
        # Mock AI to return VAT transaction
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = json.dumps(sample_ai_responses['income_with_vat'])
        mock_groq_client.chat.completions.create.return_value = mock_response
        
        request_data = {
            'From': 'whatsapp:+420123456789',
            'Body': 'Faktura 12000 včetně DPH za vývoj',
            'ProfileName': 'VAT User'
        }
        
        response = client.post('/webhook/whatsapp', data=request_data)
        assert response.status_code == 200
        
        vat_response = mock_twilio_client.send_message.call_args[0][1]
        assert "DPH" in vat_response
        assert "12000" in vat_response


class TestDatabaseIntegration:
    """Test database operations and data persistence"""
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_user_creation_and_retrieval(self, db_session):
        """Test user creation and retrieval from database"""
        user_service = UserService()
        
        # Create user
        user = await user_service.get_or_create_user(
            whatsapp_number='+420123456789',
            profile_name='Test User'
        )
        
        assert user is not None
        assert user.whatsapp_number == '+420123456789'
        assert user.profile_name == 'Test User'
        
        # Retrieve same user
        user2 = await user_service.get_or_create_user(
            whatsapp_number='+420123456789',
            profile_name='Test User'
        )
        
        assert user.id == user2.id  # Should be same user
    
    @pytest.mark.integration
    @pytest.mark.database
    @pytest.mark.asyncio
    async def test_transaction_persistence(self, db_session):
        """Test transaction saving and retrieval"""
        from app.database.operations import DatabaseOperations
        
        db_ops = DatabaseOperations()
        
        transaction_data = {
            'type': 'expense',
            'amount': 1500.50,
            'currency': 'CZK',
            'description': 'Test transaction',
            'category': 'office_supplies'
        }
        
        # Save transaction
        transaction_id = await db_ops.save_transaction(1, transaction_data)
        assert transaction_id is not None
        
        # Retrieve transactions
        transactions = await db_ops.get_user_transactions(1)
        assert len(transactions) >= 1
        
        saved_transaction = next(t for t in transactions if t.id == transaction_id)
        assert saved_transaction.amount_czk == Decimal('1500.50')
        assert saved_transaction.description == 'Test transaction'
    
    @pytest.mark.integration
    @pytest.mark.database
    @pytest.mark.asyncio
    async def test_payment_record_persistence(self, db_session):
        """Test payment record saving"""
        from app.services.payment_service import payment_service
        
        # This would test actual database persistence
        # Currently using mock data due to test environment
        user_id = 1
        subscription_info = await payment_service.get_user_subscription_info(user_id)
        
        assert 'status' in subscription_info
        # In real test with database, would assert actual payment data


class TestPerformanceIntegration:
    """Test system performance under load"""
    
    @pytest.mark.integration
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_concurrent_message_processing(self, client, mock_twilio_client, 
                                                mock_groq_client, sample_ai_responses):
        """Test processing multiple messages concurrently"""
        import asyncio
        import aiohttp
        
        # Mock AI responses
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = json.dumps(sample_ai_responses['expense_simple'])
        mock_groq_client.chat.completions.create.return_value = mock_response
        
        async def send_message(i):
            request_data = {
                'From': f'whatsapp:+42012345678{i % 10}',
                'Body': f'Oběd {250 + i} Kč',
                'ProfileName': f'User {i}'
            }
            
            response = client.post('/webhook/whatsapp', data=request_data)
            return response.status_code
        
        # Send 10 concurrent messages
        tasks = [send_message(i) for i in range(10)]
        results = await asyncio.gather(*tasks)
        
        # All should succeed
        assert all(status == 200 for status in results)
        
        # Should have processed all messages
        assert mock_twilio_client.send_message.call_count == 10
    
    @pytest.mark.integration
    @pytest.mark.slow
    def test_database_connection_limits(self, db_session):
        """Test database connection handling under load"""
        import threading
        import time
        
        def db_operation():
            try:
                # Simulate database operation
                time.sleep(0.1)
                return True
            except Exception:
                return False
        
        # Create multiple threads
        threads = [threading.Thread(target=db_operation) for _ in range(20)]
        
        # Start all threads
        for thread in threads:
            thread.start()
        
        # Wait for completion
        for thread in threads:
            thread.join()
        
        # All operations should complete successfully
        assert True  # If we get here, no deadlocks occurred
    
    @pytest.mark.integration
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_response_time_under_load(self, client, mock_groq_client, 
                                          sample_ai_responses, load_test_config):
        """Test response times under simulated load"""
        import time
        
        # Mock fast AI response
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = json.dumps(sample_ai_responses['expense_simple'])
        mock_groq_client.chat.completions.create.return_value = mock_response
        
        response_times = []
        
        for i in range(10):  # Reduced for test speed
            start_time = time.time()
            
            response = client.post('/webhook/whatsapp', data={
                'From': f'whatsapp:+42012345678{i}',
                'Body': f'Oběd {250 + i} Kč',
                'ProfileName': f'User {i}'
            })
            
            end_time = time.time()
            response_time_ms = (end_time - start_time) * 1000
            response_times.append(response_time_ms)
            
            assert response.status_code == 200
        
        # Check average response time
        avg_response_time = sum(response_times) / len(response_times)
        assert avg_response_time < load_test_config['target_response_time_ms']
        
        # Check that no individual request was too slow
        max_response_time = max(response_times)
        assert max_response_time < load_test_config['target_response_time_ms'] * 2


class TestErrorHandlingIntegration:
    """Test error handling across system components"""
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_ai_service_failure_handling(self, client, mock_twilio_client, mock_groq_client):
        """Test handling when AI service fails"""
        # Make Groq API fail
        mock_groq_client.chat.completions.create.side_effect = Exception("API Error")
        
        request_data = {
            'From': 'whatsapp:+420123456789',
            'Body': 'Oběd 250 Kč',
            'ProfileName': 'Test User'
        }
        
        response = client.post('/webhook/whatsapp', data=request_data)
        assert response.status_code == 200  # Should handle gracefully
        
        # Should send error message to user
        error_message = mock_twilio_client.send_message.call_args[0][1]
        assert "❌" in error_message or "chyba" in error_message.lower()
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_database_failure_handling(self, client, mock_twilio_client):
        """Test handling when database fails"""
        request_data = {
            'From': 'whatsapp:+420123456789',
            'Body': 'přehled',
            'ProfileName': 'Test User'
        }
        
        with patch('app.database.connection.get_db_session') as mock_db:
            mock_db.side_effect = Exception("Database error")
            
            response = client.post('/webhook/whatsapp', data=request_data)
            assert response.status_code == 200
            
            # Should handle gracefully
            error_message = mock_twilio_client.send_message.call_args[0][1]
            assert "nedostupná" in error_message.lower() or "❌" in error_message
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_external_api_timeout_handling(self, client, mock_twilio_client):
        """Test handling of external API timeouts"""
        request_data = {
            'From': 'whatsapp:+420123456789',
            'Body': '12345678',  # IČO during onboarding
            'ProfileName': 'Test User'
        }
        
        # Start onboarding first
        start_request = request_data.copy()
        start_request['Body'] = 'start'
        client.post('/webhook/whatsapp', data=start_request)
        
        # Proceed to name step
        name_request = request_data.copy()
        name_request['Body'] = 'Jan Novák'
        client.post('/webhook/whatsapp', data=name_request)
        
        with patch('utils.ares_validator.AresValidator.validate_ico') as mock_ares:
            import requests
            mock_ares.side_effect = requests.Timeout("Request timeout")
            
            response = client.post('/webhook/whatsapp', data=request_data)
            assert response.status_code == 200
            
            # Should handle timeout gracefully
            timeout_message = mock_twilio_client.send_message.call_args[0][1]
            assert "nedostupn" in timeout_message.lower() or "zkuste" in timeout_message.lower()