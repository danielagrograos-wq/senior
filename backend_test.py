#!/usr/bin/env python3
"""
SeniorCare+ Backend API Testing Suite
Testing Care Log and Smart Match endpoints
"""

import asyncio
import aiohttp
import json
from datetime import datetime
from typing import Dict, Any, Optional

# Test Configuration
BASE_URL = "https://elderly-care-match.preview.emergentagent.com/api"
TEST_BOOKING_ID = "d76708c1-9ce7-4871-8b7a-49e8e54799e7"

# Test Credentials
TEST_CREDENTIALS = {
    "caregiver": {"email": "maria.souza@example.com", "password": "password123"},
    "client": {"email": "joao.filho@example.com", "password": "password123"},
    "admin": {"email": "admin@seniorcare.com", "password": "admin123"}
}

class SeniorCareAPITester:
    def __init__(self):
        self.session = None
        self.tokens = {}
        self.test_results = []
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_test(self, test_name: str, success: bool, message: str, details: Any = None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    async def login(self, role: str) -> bool:
        """Login and store auth token"""
        try:
            credentials = TEST_CREDENTIALS[role]
            async with self.session.post(f"{BASE_URL}/auth/login", json=credentials) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    self.tokens[role] = data.get('access_token')
                    self.log_test(f"Login {role}", True, f"Successfully logged in as {role}")
                    return True
                else:
                    error_text = await resp.text()
                    self.log_test(f"Login {role}", False, f"Login failed with status {resp.status}", error_text)
                    return False
        except Exception as e:
            self.log_test(f"Login {role}", False, f"Login exception: {str(e)}")
            return False
    
    def get_headers(self, role: str) -> Dict[str, str]:
        """Get authorization headers for role"""
        token = self.tokens.get(role)
        if not token:
            return {}
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    async def test_new_care_log_create(self):
        """Test POST /api/bookings/{booking_id}/logs - New RESTful endpoint"""
        headers = self.get_headers("caregiver")
        if not headers.get("Authorization"):
            self.log_test("Care Log Create (New)", False, "No caregiver token available")
            return None
            
        test_log = {
            "log_type": "med",
            "description": "Maria Helena Santos tomou remédio das 10h conforme prescrição médica"
        }
        
        try:
            async with self.session.post(
                f"{BASE_URL}/bookings/{TEST_BOOKING_ID}/logs",
                json=test_log,
                headers=headers
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    required_fields = ["id", "log_type", "description"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        self.log_test("Care Log Create (New)", False, f"Missing fields in response: {missing_fields}", data)
                        return None
                    
                    if data.get("log_type") != "med":
                        self.log_test("Care Log Create (New)", False, f"Incorrect log_type returned: {data.get('log_type')}")
                        return None
                        
                    self.log_test("Care Log Create (New)", True, f"Log created with ID: {data.get('id')}")
                    return data.get("id")
                else:
                    error_text = await resp.text()
                    self.log_test("Care Log Create (New)", False, f"Failed with status {resp.status}", error_text)
                    return None
                    
        except Exception as e:
            self.log_test("Care Log Create (New)", False, f"Exception: {str(e)}")
            return None
    
    async def test_new_care_log_timeline(self):
        """Test GET /api/bookings/{booking_id}/logs - New RESTful endpoint"""
        headers = self.get_headers("caregiver")
        if not headers.get("Authorization"):
            self.log_test("Care Log Timeline (New)", False, "No caregiver token available")
            return
            
        try:
            async with self.session.get(
                f"{BASE_URL}/bookings/{TEST_BOOKING_ID}/logs",
                headers=headers
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    
                    required_fields = ["booking_id", "total_logs", "timeline"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        self.log_test("Care Log Timeline (New)", False, f"Missing fields: {missing_fields}", data)
                        return
                    
                    timeline = data.get("timeline", [])
                    if not isinstance(timeline, list):
                        self.log_test("Care Log Timeline (New)", False, "Timeline should be a list", data)
                        return
                    
                    # Check timeline ordering (should be most recent first)
                    if len(timeline) >= 2:
                        first_time = datetime.fromisoformat(timeline[0]["created_at"].replace('Z', '+00:00'))
                        second_time = datetime.fromisoformat(timeline[1]["created_at"].replace('Z', '+00:00'))
                        if first_time < second_time:
                            self.log_test("Care Log Timeline (New)", False, "Timeline not ordered correctly (should be newest first)")
                            return
                    
                    self.log_test("Care Log Timeline (New)", True, f"Timeline retrieved with {data['total_logs']} logs")
                    
                else:
                    error_text = await resp.text()
                    self.log_test("Care Log Timeline (New)", False, f"Failed with status {resp.status}", error_text)
                    
        except Exception as e:
            self.log_test("Care Log Timeline (New)", False, f"Exception: {str(e)}")
    
    async def test_legacy_care_log_create(self):
        """Test POST /api/care-log - Legacy endpoint"""
        headers = self.get_headers("caregiver")
        if not headers.get("Authorization"):
            self.log_test("Care Log Create (Legacy)", False, "No caregiver token available")
            return
            
        test_log = {
            "booking_id": TEST_BOOKING_ID,
            "entry_type": "medication",
            "description": "Medicação administrada - Teste legacy endpoint"
        }
        
        try:
            async with self.session.post(
                f"{BASE_URL}/care-log",
                json=test_log,
                headers=headers
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data.get("entry_type") == "medication":
                        self.log_test("Care Log Create (Legacy)", True, f"Legacy log created with ID: {data.get('id')}")
                    else:
                        self.log_test("Care Log Create (Legacy)", False, f"Unexpected entry_type: {data.get('entry_type')}")
                else:
                    error_text = await resp.text()
                    self.log_test("Care Log Create (Legacy)", False, f"Failed with status {resp.status}", error_text)
                    
        except Exception as e:
            self.log_test("Care Log Create (Legacy)", False, f"Exception: {str(e)}")
    
    async def test_legacy_care_log_list(self):
        """Test GET /api/care-log/{booking_id} - Legacy endpoint"""
        headers = self.get_headers("caregiver")
        if not headers.get("Authorization"):
            self.log_test("Care Log List (Legacy)", False, "No caregiver token available")
            return
            
        try:
            async with self.session.get(
                f"{BASE_URL}/care-log/{TEST_BOOKING_ID}",
                headers=headers
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if isinstance(data, list):
                        self.log_test("Care Log List (Legacy)", True, f"Retrieved {len(data)} legacy logs")
                    else:
                        self.log_test("Care Log List (Legacy)", False, "Expected array response")
                else:
                    error_text = await resp.text()
                    self.log_test("Care Log List (Legacy)", False, f"Failed with status {resp.status}", error_text)
                    
        except Exception as e:
            self.log_test("Care Log List (Legacy)", False, f"Exception: {str(e)}")
    
    async def test_ai_summary(self):
        """Test GET /api/care-log/{booking_id}/summary - AI Summary"""
        headers = self.get_headers("client")
        if not headers.get("Authorization"):
            self.log_test("AI Summary", False, "No client token available")
            return
            
        try:
            async with self.session.get(
                f"{BASE_URL}/care-log/{TEST_BOOKING_ID}/summary",
                headers=headers
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if "summary" in data and "total_entries" in data:
                        self.log_test("AI Summary", True, f"AI Summary generated for {data['total_entries']} entries")
                    else:
                        self.log_test("AI Summary", False, "Missing summary or total_entries fields", data)
                else:
                    error_text = await resp.text()
                    self.log_test("AI Summary", False, f"Failed with status {resp.status}", error_text)
                    
        except Exception as e:
            self.log_test("AI Summary", False, f"Exception: {str(e)}")
    
    async def test_smart_match(self):
        """Test GET /api/caregivers?smart_match=true - Smart Match"""
        headers = self.get_headers("client")
        if not headers.get("Authorization"):
            self.log_test("Smart Match", False, "No client token available")
            return
            
        try:
            async with self.session.get(
                f"{BASE_URL}/caregivers?smart_match=true&limit=5",
                headers=headers
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    
                    if not isinstance(data, list):
                        self.log_test("Smart Match", False, "Expected array response", data)
                        return
                    
                    if not data:
                        self.log_test("Smart Match", False, "No caregivers returned")
                        return
                    
                    # Check for match_score in response
                    scores_found = 0
                    valid_scores = 0
                    
                    for caregiver in data:
                        if "match_score" in caregiver:
                            scores_found += 1
                            score = caregiver["match_score"]
                            if isinstance(score, (int, float)) and 0 <= score <= 100:
                                valid_scores += 1
                            else:
                                self.log_test("Smart Match", False, f"Invalid match_score: {score} (should be 0-100)")
                                return
                    
                    if scores_found == 0:
                        self.log_test("Smart Match", False, "No match_score fields found in caregivers")
                        return
                    
                    if scores_found != valid_scores:
                        self.log_test("Smart Match", False, f"Some invalid scores found: {scores_found} total, {valid_scores} valid")
                        return
                    
                    # Check if results are sorted by match_score (descending)
                    scores = [c.get("match_score", 0) for c in data if "match_score" in c]
                    if len(scores) >= 2 and scores != sorted(scores, reverse=True):
                        self.log_test("Smart Match", False, "Results not sorted by match_score (descending)")
                        return
                    
                    avg_score = sum(scores) / len(scores) if scores else 0
                    self.log_test("Smart Match", True, f"Smart Match working: {len(data)} caregivers, avg score: {avg_score:.1f}")
                    
                else:
                    error_text = await resp.text()
                    self.log_test("Smart Match", False, f"Failed with status {resp.status}", error_text)
                    
        except Exception as e:
            self.log_test("Smart Match", False, f"Exception: {str(e)}")
    
    async def test_log_types_validation(self):
        """Test that all required log_type values are accepted"""
        headers = self.get_headers("caregiver")
        if not headers.get("Authorization"):
            self.log_test("Log Types Validation", False, "No caregiver token available")
            return
            
        required_types = ["meal", "med", "mood", "vital"]
        success_count = 0
        
        for log_type in required_types:
            test_log = {
                "log_type": log_type,
                "description": f"Test {log_type} log entry"
            }
            
            try:
                async with self.session.post(
                    f"{BASE_URL}/bookings/{TEST_BOOKING_ID}/logs",
                    json=test_log,
                    headers=headers
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        if data.get("log_type") == log_type:
                            success_count += 1
                        else:
                            print(f"   - {log_type}: Expected {log_type}, got {data.get('log_type')}")
                    else:
                        error_text = await resp.text()
                        print(f"   - {log_type}: Failed with status {resp.status} - {error_text}")
                        
            except Exception as e:
                print(f"   - {log_type}: Exception {str(e)}")
        
        if success_count == len(required_types):
            self.log_test("Log Types Validation", True, f"All {len(required_types)} log types accepted")
        else:
            self.log_test("Log Types Validation", False, f"Only {success_count}/{len(required_types)} log types working")
    
    async def print_summary(self):
        """Print test summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print("\n" + "="*60)
        print("🧪 SENIORCARE+ API TEST SUMMARY")
        print("="*60)
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   - {result['test']}: {result['message']}")
        
        print("\n📊 ENDPOINT STATUS:")
        endpoint_status = {
            "Care Log (New RESTful)": False,
            "Care Log (Legacy)": False, 
            "Smart Match": False,
            "AI Summary": False
        }
        
        for result in self.test_results:
            if "Care Log" in result["test"] and "New" in result["test"] and result["success"]:
                endpoint_status["Care Log (New RESTful)"] = True
            elif "Care Log" in result["test"] and "Legacy" in result["test"] and result["success"]:
                endpoint_status["Care Log (Legacy)"] = True
            elif "Smart Match" in result["test"] and result["success"]:
                endpoint_status["Smart Match"] = True
            elif "AI Summary" in result["test"] and result["success"]:
                endpoint_status["AI Summary"] = True
        
        for endpoint, working in endpoint_status.items():
            status = "✅ WORKING" if working else "❌ FAILED"
            print(f"   {status} - {endpoint}")

async def main():
    """Run all tests"""
    print("🚀 Starting SeniorCare+ API Tests...")
    print(f"🔗 Backend URL: {BASE_URL}")
    print(f"📋 Test Booking ID: {TEST_BOOKING_ID}")
    print("="*60)
    
    async with SeniorCareAPITester() as tester:
        # Step 1: Login all users
        print("🔐 AUTHENTICATION PHASE")
        await tester.login("caregiver")
        await tester.login("client") 
        await tester.login("admin")
        print()
        
        # Step 2: Test Care Log endpoints
        print("📝 CARE LOG TESTING PHASE")
        await tester.test_new_care_log_create()
        await tester.test_new_care_log_timeline()
        await tester.test_legacy_care_log_create()
        await tester.test_legacy_care_log_list()
        await tester.test_ai_summary()
        print()
        
        # Step 3: Test Smart Match
        print("🎯 SMART MATCH TESTING PHASE")
        await tester.test_smart_match()
        print()
        
        # Step 4: Test log types validation
        print("✅ VALIDATION TESTING PHASE")
        await tester.test_log_types_validation()
        print()
        
        # Step 5: Print summary
        await tester.print_summary()

if __name__ == "__main__":
    asyncio.run(main())