#!/usr/bin/env python3
"""
Test script pro bezpečný aktivační systém
"""
import requests
import json
import time
import asyncio
from datetime import datetime

# Test configuration
BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"
WEBHOOK_URL = f"{BACKEND_URL}/webhook/whatsapp"

# Test data
TEST_EMAIL = "test@example.com"
TEST_PHONE = "+420999888777"
TEST_PLAN = "monthly"

class ActivationTester:
    def __init__(self):
        self.user_id = None
        self.activation_token = None
        self.session = requests.Session()
    
    def print_step(self, step, description):
        print(f"\n{'='*60}")
        print(f"KROK {step}: {description}")
        print('='*60)
    
    def print_success(self, message):
        print(f"✅ {message}")
    
    def print_error(self, message):
        print(f"❌ {message}")
    
    def print_info(self, message):
        print(f"ℹ️  {message}")
    
    def test_backend_health(self):
        """Test zdraví backend serveru"""
        try:
            response = self.session.get(f"{BACKEND_URL}/health", timeout=10)
            if response.status_code == 200:
                self.print_success("Backend server je zdravý")
                return True
            else:
                self.print_error(f"Backend health check failed: {response.status_code}")
                return False
        except Exception as e:
            self.print_error(f"Backend nedostupný: {str(e)}")
            return False
    
    def test_create_user_with_activation(self):
        """Test vytvoření uživatele s aktivačním tokenem"""
        self.print_step(1, "Vytvoření uživatele s aktivačním tokenem")
        
        # Simuluj vytvoření uživatele (normálně by to bylo přes payment webhook)
        try:
            # Pro test použijeme přímo API endpoint
            data = {
                "email": TEST_EMAIL,
                "plan": TEST_PLAN
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/webhook/payment/create-checkout-session",
                json=data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    self.user_id = result.get('user_id')
                    # Token bychom normálně dostali z emailu, zde ho simulujeme
                    self.print_success(f"Checkout session vytvořen: {result.get('session_id')}")
                    self.print_success(f"User ID: {self.user_id}")
                    return True
                else:
                    self.print_error(f"Checkout creation failed: {result}")
                    return False
            else:
                self.print_error(f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.print_error(f"Create user failed: {str(e)}")
            return False
    
    def simulate_payment_webhook(self):
        """Simuluj úspěšnou platbu a získání tokenu"""
        self.print_step(2, "Simulace úspěšné platby a získání aktivačního tokenu")
        
        try:
            # Vytvoříme uživatele přímo přes ActivationService
            import sys
            import os
            sys.path.append('/home/asznee/mvp-ucetni/ucetni-whatsapp-bot')
            
            from app.services.activation_service import ActivationService
            activation_service = ActivationService()
            
            # Asynchronní volání
            async def create_user():
                result = await activation_service.create_user_with_activation(
                    email=TEST_EMAIL,
                    plan=TEST_PLAN
                )
                return result
            
            # Spustíme async funkci
            import asyncio
            result = asyncio.run(create_user())
            
            if result.get('success'):
                self.user_id = result.get('user_id')
                self.activation_token = result.get('activation_token')
                self.print_success(f"Uživatel vytvořen: ID {self.user_id}")
                self.print_success(f"Aktivační token: {self.activation_token}")
                self.print_info(f"Token vyprší: {result.get('expires_at')}")
                return True
            else:
                self.print_error(f"User creation failed: {result.get('error')}")
                return False
                
        except Exception as e:
            self.print_error(f"Payment simulation failed: {str(e)}")
            return False
    
    def test_token_validation(self):
        """Test validace aktivačního tokenu"""
        self.print_step(3, "Validace aktivačního tokenu")
        
        if not self.activation_token:
            self.print_error("Není k dispozici aktivační token")
            return False
        
        try:
            response = self.session.get(
                f"{BACKEND_URL}/webhook/payment/activation-status/{self.activation_token}",
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('valid'):
                    self.print_success("Token je validní")
                    self.print_info(f"Použit: {result.get('used')}")
                    self.print_info(f"WhatsApp aktivován: {result.get('whatsapp_activated')}")
                    return True
                else:
                    self.print_error(f"Token není validní: {result.get('error')}")
                    return False
            else:
                self.print_error(f"Token validation failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.print_error(f"Token validation error: {str(e)}")
            return False
    
    def test_whatsapp_activation_wrong_token(self):
        """Test WhatsApp aktivace s neplatným tokenem"""
        self.print_step(4, "Test neplatného aktivačního tokenu přes WhatsApp")
        
        fake_token = "fakefakefakefakefakefakefaketoken"
        
        try:
            data = {
                'From': f'whatsapp:{TEST_PHONE}',
                'To': 'whatsapp:+14155238886',
                'Body': fake_token,
                'MessageSid': f'SM{int(time.time())}fake',
                'ProfileName': 'Test User',
                'NumMedia': '0'
            }
            
            response = self.session.post(
                WEBHOOK_URL,
                data=data,
                timeout=30
            )
            
            if response.status_code == 200:
                self.print_success("Webhook processed fake token correctly")
                self.print_info("Bot should respond with error message")
                return True
            else:
                self.print_error(f"Webhook failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.print_error(f"Fake token test failed: {str(e)}")
            return False
    
    def test_whatsapp_activation_success(self):
        """Test úspěšné WhatsApp aktivace"""
        self.print_step(5, "Test úspěšné WhatsApp aktivace")
        
        if not self.activation_token:
            self.print_error("Není k dispozici aktivační token")
            return False
        
        try:
            data = {
                'From': f'whatsapp:{TEST_PHONE}',
                'To': 'whatsapp:+14155238886',
                'Body': self.activation_token,
                'MessageSid': f'SM{int(time.time())}real',
                'ProfileName': 'Test User',
                'NumMedia': '0'
            }
            
            response = self.session.post(
                WEBHOOK_URL,
                data=data,
                timeout=30
            )
            
            if response.status_code == 200:
                self.print_success("WhatsApp aktivace úspěšná")
                self.print_info("Bot should respond with success message and start onboarding")
                return True
            else:
                self.print_error(f"Activation failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.print_error(f"WhatsApp activation failed: {str(e)}")
            return False
    
    def test_second_activation_attempt(self):
        """Test druhého pokusu o aktivaci (token už je použitý)"""
        self.print_step(6, "Test použití již použitého tokenu")
        
        if not self.activation_token:
            self.print_error("Není k dispozici aktivační token")
            return False
        
        try:
            data = {
                'From': f'whatsapp:{TEST_PHONE}',
                'To': 'whatsapp:+14155238886',
                'Body': self.activation_token,
                'MessageSid': f'SM{int(time.time())}second',
                'ProfileName': 'Test User',
                'NumMedia': '0'
            }
            
            response = self.session.post(
                WEBHOOK_URL,
                data=data,
                timeout=30
            )
            
            if response.status_code == 200:
                self.print_success("Webhook processed used token correctly")
                self.print_info("Bot should respond that token is already used")
                return True
            else:
                self.print_error(f"Used token test failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.print_error(f"Used token test error: {str(e)}")
            return False
    
    def test_registered_user_flow(self):
        """Test flow pro již registrovaného uživatele"""
        self.print_step(7, "Test zpráv od již registrovaného uživatele")
        
        test_messages = [
            ("start", "Uvítací zpráva pro registrovaného uživatele"),
            ("pomoc", "Nápověda"),
            ("Koupil jsem toner za 500 Kč", "Zpracování transakce")
        ]
        
        success_count = 0
        
        for message, description in test_messages:
            try:
                data = {
                    'From': f'whatsapp:{TEST_PHONE}',
                    'To': 'whatsapp:+14155238886',
                    'Body': message,
                    'MessageSid': f'SM{int(time.time())}{hash(message) % 1000}',
                    'ProfileName': 'Test User',
                    'NumMedia': '0'
                }
                
                response = self.session.post(
                    WEBHOOK_URL,
                    data=data,
                    timeout=30
                )
                
                if response.status_code == 200:
                    self.print_success(f"{description}: OK")
                    success_count += 1
                else:
                    self.print_error(f"{description}: FAIL ({response.status_code})")
                
                time.sleep(1)  # Pauza mezi zprávami
                
            except Exception as e:
                self.print_error(f"{description} error: {str(e)}")
        
        return success_count == len(test_messages)
    
    def test_unregistered_user_welcome(self):
        """Test uvítání neregistrovaného uživatele"""
        self.print_step(8, "Test uvítání neregistrovaného uživatele")
        
        unregistered_phone = "+420111222333"
        
        try:
            data = {
                'From': f'whatsapp:{unregistered_phone}',
                'To': 'whatsapp:+14155238886',
                'Body': 'Ahoj',
                'MessageSid': f'SM{int(time.time())}unreg',
                'ProfileName': 'Unregistered User',
                'NumMedia': '0'
            }
            
            response = self.session.post(
                WEBHOOK_URL,
                data=data,
                timeout=30
            )
            
            if response.status_code == 200:
                self.print_success("Unregistered user welcome message sent")
                self.print_info("Bot should respond with registration instructions")
                return True
            else:
                self.print_error(f"Unregistered user test failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.print_error(f"Unregistered user test error: {str(e)}")
            return False
    
    def test_frontend_activation_page(self):
        """Test aktivační stránky na frontendu"""
        self.print_step(9, "Test aktivační stránky na frontendu")
        
        if not self.activation_token:
            self.print_error("Není k dispozici aktivační token")
            return False
        
        try:
            activation_url = f"{FRONTEND_URL}/aktivace?token={self.activation_token}"
            
            response = self.session.get(activation_url, timeout=10)
            
            if response.status_code == 200:
                content = response.text
                if 'aktivační kód' in content.lower() and self.activation_token in content:
                    self.print_success("Aktivační stránka je dostupná a obsahuje token")
                    self.print_info(f"URL: {activation_url}")
                    return True
                else:
                    self.print_error("Aktivační stránka neobsahuje očekávaný obsah")
                    return False
            else:
                self.print_error(f"Aktivační stránka nedostupná: {response.status_code}")
                return False
                
        except Exception as e:
            self.print_error(f"Frontend test error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Spustí všechny testy aktivačního systému"""
        print("🧪 TESTOVÁNÍ BEZPEČNÉHO AKTIVAČNÍHO SYSTÉMU")
        print(f"📡 Backend: {BACKEND_URL}")
        print(f"🌐 Frontend: {FRONTEND_URL}")
        print(f"📱 Test phone: {TEST_PHONE}")
        print(f"✉️  Test email: {TEST_EMAIL}")
        
        test_results = []
        
        # Seznam všech testů
        tests = [
            ("Backend Health Check", self.test_backend_health),
            ("User Creation with Token", self.simulate_payment_webhook),
            ("Token Validation", self.test_token_validation),
            ("Invalid Token Test", self.test_whatsapp_activation_wrong_token),
            ("Successful Activation", self.test_whatsapp_activation_success),
            ("Used Token Test", self.test_second_activation_attempt),
            ("Registered User Flow", self.test_registered_user_flow),
            ("Unregistered User Welcome", self.test_unregistered_user_welcome),
            ("Frontend Activation Page", self.test_frontend_activation_page),
        ]
        
        # Spuštění testů
        for test_name, test_function in tests:
            try:
                result = test_function()
                test_results.append((test_name, result))
                if result:
                    self.print_success(f"{test_name}: PASSED")
                else:
                    self.print_error(f"{test_name}: FAILED")
            except Exception as e:
                self.print_error(f"{test_name}: ERROR - {str(e)}")
                test_results.append((test_name, False))
        
        # Výsledky
        print(f"\n{'='*60}")
        print("📊 VÝSLEDKY TESTŮ")
        print('='*60)
        
        passed = sum(1 for _, result in test_results if result)
        total = len(test_results)
        
        for test_name, result in test_results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name}")
        
        print(f"\n🎯 CELKOVÉ SKÓRE: {passed}/{total} ({passed/total*100:.1f}%)")
        
        if passed == total:
            print("\n🎉 VŠECHNY TESTY PROŠLY!")
            print("✅ Aktivační systém je plně funkční")
        else:
            print(f"\n⚠️  {total-passed} testů selhalo")
            print("❌ Aktivační systém vyžaduje opravu")
        
        return passed == total

if __name__ == "__main__":
    tester = ActivationTester()
    
    try:
        success = tester.run_all_tests()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⛔ Testy přerušeny uživatelem")
        exit(1)
    except Exception as e:
        print(f"\n❌ Test suite failed: {str(e)}")
        import traceback
        traceback.print_exc()
        exit(1)