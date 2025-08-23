"""
Load testing for ÚčetníBot - Performance and stress testing
"""
import pytest
import asyncio
import aiohttp
import time
import statistics
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from typing import List, Dict, Any
import json
import random
from unittest.mock import patch, Mock

from fastapi.testclient import TestClient
from app.main import app


@dataclass
class LoadTestResult:
    """Load test result data structure"""
    total_requests: int
    successful_requests: int
    failed_requests: int
    avg_response_time: float
    min_response_time: float
    max_response_time: float
    median_response_time: float
    p95_response_time: float
    requests_per_second: float
    error_rate: float
    duration_seconds: float


class LoadTestRunner:
    """Load testing utility class"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.results: List[Dict[str, Any]] = []
    
    async def simulate_user_session(self, user_id: int, messages: List[str]) -> Dict[str, Any]:
        """Simulate a complete user session with multiple messages"""
        session_start = time.time()
        session_results = []
        
        async with aiohttp.ClientSession() as session:
            for message in messages:
                start_time = time.time()
                
                try:
                    request_data = {
                        'From': f'whatsapp:+42012345{user_id:04d}',
                        'Body': message,
                        'ProfileName': f'Load Test User {user_id}',
                        'MessageSid': f'SM{user_id}_{int(time.time())}'
                    }
                    
                    async with session.post(
                        f"{self.base_url}/webhook/whatsapp",
                        data=request_data
                    ) as response:
                        status = response.status
                        response_time = (time.time() - start_time) * 1000
                        
                        session_results.append({
                            'status': status,
                            'response_time': response_time,
                            'success': status == 200
                        })
                        
                except Exception as e:
                    response_time = (time.time() - start_time) * 1000
                    session_results.append({
                        'status': 500,
                        'response_time': response_time,
                        'success': False,
                        'error': str(e)
                    })
                
                # Small delay between messages from same user
                await asyncio.sleep(0.1)
        
        session_duration = time.time() - session_start
        
        return {
            'user_id': user_id,
            'session_duration': session_duration,
            'results': session_results,
            'total_messages': len(messages),
            'successful_messages': sum(1 for r in session_results if r['success']),
            'avg_response_time': statistics.mean(r['response_time'] for r in session_results)
        }
    
    def calculate_results(self, sessions: List[Dict[str, Any]], 
                         total_duration: float) -> LoadTestResult:
        """Calculate load test statistics"""
        all_results = []
        for session in sessions:
            all_results.extend(session['results'])
        
        if not all_results:
            return LoadTestResult(0, 0, 0, 0, 0, 0, 0, 0, 0, 100, total_duration)
        
        response_times = [r['response_time'] for r in all_results]
        successful_requests = sum(1 for r in all_results if r['success'])
        total_requests = len(all_results)
        
        return LoadTestResult(
            total_requests=total_requests,
            successful_requests=successful_requests,
            failed_requests=total_requests - successful_requests,
            avg_response_time=statistics.mean(response_times),
            min_response_time=min(response_times),
            max_response_time=max(response_times),
            median_response_time=statistics.median(response_times),
            p95_response_time=self._percentile(response_times, 95),
            requests_per_second=total_requests / total_duration if total_duration > 0 else 0,
            error_rate=(total_requests - successful_requests) / total_requests * 100,
            duration_seconds=total_duration
        )
    
    def _percentile(self, data: List[float], percentile: int) -> float:
        """Calculate percentile from data"""
        if not data:
            return 0
        sorted_data = sorted(data)
        k = (len(sorted_data) - 1) * percentile / 100
        f = int(k)
        c = k - f
        if f == len(sorted_data) - 1:
            return sorted_data[f]
        return sorted_data[f] * (1 - c) + sorted_data[f + 1] * c


class TestBasicLoad:
    """Basic load testing scenarios"""
    
    @pytest.fixture
    def load_runner(self):
        return LoadTestRunner()
    
    @pytest.fixture
    def sample_messages(self):
        """Sample messages for load testing"""
        return [
            "Oběd 250 Kč",
            "Benzín 800 Kč", 
            "Faktura 5000 za konzultace",
            "AWS $49.99",
            "Nákup kancelářských potřeb 1500",
            "přehled",
            "pomoc",
            "export"
        ]
    
    @pytest.mark.load
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_single_user_sustained_load(self, load_runner, sample_messages,
                                            mock_groq_client, mock_twilio_client):
        """Test single user sending many messages"""
        # Mock AI responses
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = json.dumps({
            "type": "expense",
            "amount": 250,
            "currency": "CZK",
            "confidence": 0.9
        })
        mock_groq_client.chat.completions.create.return_value = mock_response
        
        # Generate many messages for one user
        test_messages = sample_messages * 5  # 40 messages total
        
        start_time = time.time()
        session_result = await load_runner.simulate_user_session(1, test_messages)
        duration = time.time() - start_time
        
        # Verify results
        assert session_result['successful_messages'] >= session_result['total_messages'] * 0.95  # 95% success
        assert session_result['avg_response_time'] < 5000  # Under 5 seconds average
        
        print(f"\nSingle User Load Test Results:")
        print(f"Messages processed: {session_result['total_messages']}")
        print(f"Success rate: {session_result['successful_messages'] / session_result['total_messages'] * 100:.1f}%")
        print(f"Average response time: {session_result['avg_response_time']:.1f}ms")
        print(f"Total duration: {duration:.1f}s")
    
    @pytest.mark.load
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_concurrent_users_load(self, load_runner, sample_messages,
                                       mock_groq_client, mock_twilio_client,
                                       load_test_config):
        """Test multiple concurrent users"""
        # Mock AI responses
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = json.dumps({
            "type": "expense",
            "amount": 250,
            "currency": "CZK",
            "confidence": 0.9
        })
        mock_groq_client.chat.completions.create.return_value = mock_response
        
        concurrent_users = min(load_test_config['concurrent_users'], 10)  # Limit for tests
        messages_per_user = load_test_config['messages_per_user']
        
        # Generate user sessions
        user_sessions = []
        for user_id in range(concurrent_users):
            messages = random.choices(sample_messages, k=messages_per_user)
            user_sessions.append((user_id, messages))
        
        start_time = time.time()
        
        # Run concurrent sessions
        tasks = [
            load_runner.simulate_user_session(user_id, messages)
            for user_id, messages in user_sessions
        ]
        
        session_results = await asyncio.gather(*tasks)
        duration = time.time() - start_time
        
        # Calculate overall results
        load_result = load_runner.calculate_results(session_results, duration)
        
        print(f"\nConcurrent Users Load Test Results:")
        print(f"Concurrent users: {concurrent_users}")
        print(f"Total requests: {load_result.total_requests}")
        print(f"Success rate: {100 - load_result.error_rate:.1f}%")
        print(f"Average response time: {load_result.avg_response_time:.1f}ms")
        print(f"95th percentile: {load_result.p95_response_time:.1f}ms")
        print(f"Requests per second: {load_result.requests_per_second:.1f}")
        
        # Assertions
        assert load_result.error_rate < 5  # Less than 5% errors
        assert load_result.avg_response_time < load_test_config['target_response_time_ms']
        assert load_result.requests_per_second > 1  # At least 1 RPS
    
    @pytest.mark.load
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_gradual_load_ramp_up(self, load_runner, sample_messages,
                                      mock_groq_client, mock_twilio_client):
        """Test gradual load increase to find breaking point"""
        # Mock responses
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = json.dumps({
            "type": "expense",
            "amount": 250,
            "currency": "CZK", 
            "confidence": 0.9
        })
        mock_groq_client.chat.completions.create.return_value = mock_response
        
        load_levels = [1, 2, 5, 8]  # Reduced for testing
        results_by_load = {}
        
        for load_level in load_levels:
            print(f"\nTesting with {load_level} concurrent users...")
            
            # Create user sessions
            tasks = []
            for user_id in range(load_level):
                messages = random.choices(sample_messages, k=3)  # 3 messages per user
                tasks.append(load_runner.simulate_user_session(user_id, messages))
            
            start_time = time.time()
            session_results = await asyncio.gather(*tasks)
            duration = time.time() - start_time
            
            load_result = load_runner.calculate_results(session_results, duration)
            results_by_load[load_level] = load_result
            
            print(f"Success rate: {100 - load_result.error_rate:.1f}%")
            print(f"Average response time: {load_result.avg_response_time:.1f}ms")
            print(f"RPS: {load_result.requests_per_second:.1f}")
            
            # Stop if error rate gets too high
            if load_result.error_rate > 10:
                print(f"Stopping at {load_level} users due to high error rate")
                break
        
        # Find optimal load level
        successful_loads = [load for load, result in results_by_load.items() 
                          if result.error_rate < 5]
        
        if successful_loads:
            max_successful_load = max(successful_loads)
            print(f"\nMaximum successful load: {max_successful_load} concurrent users")
        
        assert len(results_by_load) > 0
        assert any(result.error_rate < 10 for result in results_by_load.values())


class TestSpecificScenarioLoad:
    """Load testing for specific scenarios"""
    
    @pytest.mark.load
    @pytest.mark.asyncio
    async def test_onboarding_load(self, mock_twilio_client, mock_ares_api):
        """Test load on onboarding system"""
        client = TestClient(app)
        mock_ares_api.return_value = {'valid': True, 'name': 'Test Company'}
        
        concurrent_onboardings = 5
        
        async def simulate_onboarding(user_id: int):
            """Simulate complete onboarding for one user"""
            base_request = {
                'From': f'whatsapp:+42012345{user_id:04d}',
                'ProfileName': f'Test User {user_id}'
            }
            
            # Onboarding steps
            steps = [
                'start',
                f'User {user_id}',
                '12345678',  # IČO
                'it_programming',
                'ne'  # Not VAT payer
            ]
            
            results = []
            for step in steps:
                start_time = time.time()
                request = base_request.copy()
                request['Body'] = step
                
                response = client.post('/webhook/whatsapp', data=request)
                response_time = (time.time() - start_time) * 1000
                
                results.append({
                    'status': response.status_code,
                    'response_time': response_time,
                    'success': response.status_code == 200
                })
                
                await asyncio.sleep(0.1)  # Small delay between steps
            
            return results
        
        start_time = time.time()
        tasks = [simulate_onboarding(i) for i in range(concurrent_onboardings)]
        all_results = await asyncio.gather(*tasks)
        duration = time.time() - start_time
        
        # Flatten results
        flat_results = [result for results in all_results for result in results]
        
        success_rate = sum(1 for r in flat_results if r['success']) / len(flat_results) * 100
        avg_response_time = statistics.mean(r['response_time'] for r in flat_results)
        
        print(f"\nOnboarding Load Test Results:")
        print(f"Concurrent onboardings: {concurrent_onboardings}")
        print(f"Success rate: {success_rate:.1f}%")
        print(f"Average response time: {avg_response_time:.1f}ms")
        print(f"Total duration: {duration:.1f}s")
        
        assert success_rate >= 95  # At least 95% success
        assert avg_response_time < 3000  # Under 3 seconds
    
    @pytest.mark.load
    @pytest.mark.asyncio
    async def test_payment_flow_load(self, mock_stripe_client, mock_twilio_client):
        """Test load on payment processing"""
        client = TestClient(app)
        
        concurrent_payments = 5
        
        async def simulate_payment_request(user_id: int):
            start_time = time.time()
            
            response = client.post('/webhook/whatsapp', data={
                'From': f'whatsapp:+42012345{user_id:04d}',
                'Body': 'platba',
                'ProfileName': f'Payment User {user_id}'
            })
            
            response_time = (time.time() - start_time) * 1000
            
            return {
                'status': response.status_code,
                'response_time': response_time,
                'success': response.status_code == 200
            }
        
        start_time = time.time()
        tasks = [simulate_payment_request(i) for i in range(concurrent_payments)]
        results = await asyncio.gather(*tasks)
        duration = time.time() - start_time
        
        success_rate = sum(1 for r in results if r['success']) / len(results) * 100
        avg_response_time = statistics.mean(r['response_time'] for r in results)
        
        print(f"\nPayment Flow Load Test Results:")
        print(f"Concurrent payments: {concurrent_payments}")
        print(f"Success rate: {success_rate:.1f}%")
        print(f"Average response time: {avg_response_time:.1f}ms")
        
        # Verify Stripe was called appropriately
        expected_calls = concurrent_payments
        actual_calls = mock_stripe_client['session'].create.call_count
        assert actual_calls == expected_calls
        
        assert success_rate >= 95
        assert avg_response_time < 5000


class TestResourceUtilization:
    """Test resource utilization during load"""
    
    @pytest.mark.load
    @pytest.mark.slow
    def test_memory_usage_under_load(self, mock_groq_client, mock_twilio_client):
        """Test memory usage during sustained load"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        client = TestClient(app)
        
        # Mock AI response
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = json.dumps({
            "type": "expense",
            "amount": 250,
            "currency": "CZK",
            "confidence": 0.9
        })
        mock_groq_client.chat.completions.create.return_value = mock_response
        
        memory_samples = []
        
        # Send many requests
        for i in range(50):  # Reduced for test speed
            response = client.post('/webhook/whatsapp', data={
                'From': f'whatsapp:+4201234567{i % 10:02d}',
                'Body': f'Oběd {250 + i} Kč',
                'ProfileName': f'User {i}'
            })
            
            assert response.status_code == 200
            
            if i % 10 == 0:  # Sample memory every 10 requests
                current_memory = process.memory_info().rss / 1024 / 1024
                memory_samples.append(current_memory)
        
        final_memory = process.memory_info().rss / 1024 / 1024
        memory_increase = final_memory - initial_memory
        
        print(f"\nMemory Usage Test Results:")
        print(f"Initial memory: {initial_memory:.1f} MB")
        print(f"Final memory: {final_memory:.1f} MB")
        print(f"Memory increase: {memory_increase:.1f} MB")
        print(f"Memory samples: {[f'{m:.1f}' for m in memory_samples]} MB")
        
        # Memory increase should be reasonable
        assert memory_increase < 100  # Less than 100MB increase
    
    @pytest.mark.load
    @pytest.mark.slow
    def test_response_time_degradation(self, mock_groq_client, mock_twilio_client):
        """Test response time degradation under sustained load"""
        client = TestClient(app)
        
        # Mock AI response
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = json.dumps({
            "type": "expense",
            "amount": 250,
            "currency": "CZK",
            "confidence": 0.9
        })
        mock_groq_client.chat.completions.create.return_value = mock_response
        
        response_times = []
        batch_size = 10
        
        for batch in range(5):  # 5 batches of 10 requests
            batch_times = []
            
            for i in range(batch_size):
                start_time = time.time()
                
                response = client.post('/webhook/whatsapp', data={
                    'From': f'whatsapp:+420123456{batch:01d}{i:02d}',
                    'Body': f'Oběd {250 + batch * batch_size + i} Kč',
                    'ProfileName': f'Batch User {batch}_{i}'
                })
                
                response_time = (time.time() - start_time) * 1000
                batch_times.append(response_time)
                
                assert response.status_code == 200
            
            avg_batch_time = statistics.mean(batch_times)
            response_times.append(avg_batch_time)
            
            print(f"Batch {batch + 1} average response time: {avg_batch_time:.1f}ms")
        
        # Response times should not degrade significantly
        first_batch_time = response_times[0]
        last_batch_time = response_times[-1]
        degradation = (last_batch_time - first_batch_time) / first_batch_time * 100
        
        print(f"\nResponse Time Degradation Test:")
        print(f"First batch avg: {first_batch_time:.1f}ms")
        print(f"Last batch avg: {last_batch_time:.1f}ms")
        print(f"Degradation: {degradation:.1f}%")
        
        # Should not degrade more than 50%
        assert degradation < 50
    
    @pytest.mark.load
    def test_database_connection_pool(self, db_session):
        """Test database connection pool under load"""
        import threading
        import time
        
        results = []
        errors = []
        
        def db_operation(thread_id: int):
            try:
                start_time = time.time()
                
                # Simulate database operation
                with db_session as session:
                    # Simple query simulation
                    time.sleep(0.05)  # 50ms simulated query time
                
                duration = (time.time() - start_time) * 1000
                results.append({
                    'thread_id': thread_id,
                    'duration': duration,
                    'success': True
                })
                
            except Exception as e:
                errors.append({
                    'thread_id': thread_id,
                    'error': str(e),
                    'success': False
                })
        
        # Create multiple threads to test connection pool
        num_threads = 20
        threads = [threading.Thread(target=db_operation, args=(i,)) 
                  for i in range(num_threads)]
        
        start_time = time.time()
        
        # Start all threads
        for thread in threads:
            thread.start()
        
        # Wait for completion
        for thread in threads:
            thread.join()
        
        total_duration = time.time() - start_time
        
        success_count = len(results)
        error_count = len(errors)
        
        if results:
            avg_duration = statistics.mean(r['duration'] for r in results)
            max_duration = max(r['duration'] for r in results)
        else:
            avg_duration = max_duration = 0
        
        print(f"\nDatabase Connection Pool Test:")
        print(f"Concurrent connections: {num_threads}")
        print(f"Successful operations: {success_count}")
        print(f"Failed operations: {error_count}")
        print(f"Average operation time: {avg_duration:.1f}ms")
        print(f"Max operation time: {max_duration:.1f}ms")
        print(f"Total test duration: {total_duration:.1f}s")
        
        # Should handle all connections successfully
        assert error_count == 0
        assert success_count == num_threads
        assert avg_duration < 1000  # Under 1 second average