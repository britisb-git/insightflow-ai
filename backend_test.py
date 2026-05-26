#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for InsightFlow AI
Tests all authentication, dataset, and chat endpoints
"""

import requests
import json
import os
from pathlib import Path

# Configuration
BASE_URL = "https://insight-flow-22.preview.emergentagent.com/api"
SAMPLE_FILE = "/tmp/sample_hotel_bookings.xlsx"

# Test data
test_user = {
    "name": "Test User",
    "email": "test@test.com",
    "password": "password123"
}

# Global variables to store test state
auth_token = None
dataset_id = None

def print_test_header(test_name):
    """Print formatted test header"""
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")

def print_result(success, message):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")

def test_api_health():
    """Test API health check"""
    print_test_header("API Health Check")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            if data.get('status') == 'running':
                print_result(True, "API is running")
                return True
            else:
                print_result(False, f"Unexpected status: {data.get('status')}")
                return False
        else:
            print_result(False, f"Status code: {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_signup():
    """Test user signup"""
    print_test_header("User Signup")
    global auth_token
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/signup",
            json=test_user,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            if 'token' in data and 'user' in data:
                auth_token = data['token']
                print(f"Token received: {auth_token[:20]}...")
                print(f"User: {data['user']}")
                print_result(True, "Signup successful")
                return True
            else:
                print_result(False, "Missing token or user in response")
                return False
        elif response.status_code == 400 and 'already exists' in response.text:
            print_result(True, "User already exists (expected if running multiple times)")
            # Try login instead
            return test_login()
        else:
            print_result(False, f"Unexpected status code: {response.status_code}")
            return False
            
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_login():
    """Test user login"""
    print_test_header("User Login")
    global auth_token
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={
                "email": test_user["email"],
                "password": test_user["password"]
            },
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            if 'token' in data and 'user' in data:
                auth_token = data['token']
                print(f"Token received: {auth_token[:20]}...")
                print(f"User: {data['user']}")
                print_result(True, "Login successful")
                return True
            else:
                print_result(False, "Missing token or user in response")
                return False
        else:
            print_result(False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_login_invalid_credentials():
    """Test login with invalid credentials"""
    print_test_header("Login with Invalid Credentials")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={
                "email": test_user["email"],
                "password": "wrongpassword"
            },
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print_result(True, "Correctly rejected invalid credentials")
            return True
        else:
            print_result(False, f"Expected 401, got {response.status_code}")
            return False
            
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_dataset_upload():
    """Test dataset upload with AI analysis"""
    print_test_header("Dataset Upload & AI Analysis")
    global dataset_id
    
    if not auth_token:
        print_result(False, "No auth token available")
        return False
    
    if not os.path.exists(SAMPLE_FILE):
        print_result(False, f"Sample file not found: {SAMPLE_FILE}")
        return False
    
    try:
        with open(SAMPLE_FILE, 'rb') as f:
            files = {'file': ('sample_hotel_bookings.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            headers = {'Authorization': f'Bearer {auth_token}'}
            
            print(f"Uploading file: {SAMPLE_FILE}")
            response = requests.post(
                f"{BASE_URL}/datasets/upload",
                files=files,
                headers=headers,
                timeout=60
            )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:1000]}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify response structure
            required_fields = ['datasetId', 'fileName', 'sheets', 'analysis']
            missing_fields = [f for f in required_fields if f not in data]
            
            if missing_fields:
                print_result(False, f"Missing fields: {missing_fields}")
                return False
            
            dataset_id = data['datasetId']
            print(f"\nDataset ID: {dataset_id}")
            print(f"File Name: {data['fileName']}")
            print(f"Sheets: {len(data['sheets'])} sheet(s)")
            
            for sheet in data['sheets']:
                print(f"  - {sheet['name']}: {sheet['rowCount']} rows, {len(sheet['columns'])} columns")
            
            print(f"\nAI Analysis:")
            analysis = data['analysis']
            print(f"  Dimensions: {analysis.get('dimensions', [])}")
            print(f"  Measures: {analysis.get('measures', [])}")
            print(f"  Date Fields: {analysis.get('dateFields', [])}")
            print(f"  Suggested KPIs: {analysis.get('suggestedKPIs', [])}")
            
            if analysis.get('insights'):
                print(f"  Insights: {analysis['insights'][:200]}...")
            
            print_result(True, "Dataset uploaded and analyzed successfully")
            return True
        else:
            print_result(False, f"Status code: {response.status_code}")
            return False
            
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_get_datasets():
    """Test getting list of datasets"""
    print_test_header("Get Datasets List")
    
    if not auth_token:
        print_result(False, "No auth token available")
        return False
    
    try:
        headers = {'Authorization': f'Bearer {auth_token}'}
        response = requests.get(
            f"{BASE_URL}/datasets",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            if 'datasets' in data:
                datasets = data['datasets']
                print(f"Found {len(datasets)} dataset(s)")
                for ds in datasets[:3]:  # Show first 3
                    print(f"  - {ds.get('fileName')} (ID: {ds.get('datasetId')})")
                print_result(True, f"Retrieved {len(datasets)} datasets")
                return True
            else:
                print_result(False, "Missing 'datasets' field in response")
                return False
        else:
            print_result(False, f"Status code: {response.status_code}")
            return False
            
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_get_dataset_by_id():
    """Test getting specific dataset by ID"""
    print_test_header("Get Dataset by ID")
    
    if not auth_token:
        print_result(False, "No auth token available")
        return False
    
    if not dataset_id:
        print_result(False, "No dataset ID available")
        return False
    
    try:
        headers = {'Authorization': f'Bearer {auth_token}'}
        response = requests.get(
            f"{BASE_URL}/datasets/{dataset_id}",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            if 'dataset' in data:
                dataset = data['dataset']
                print(f"Dataset: {dataset.get('fileName')}")
                print(f"Sheets: {len(dataset.get('sheets', []))}")
                print(f"Analysis available: {'analysis' in dataset}")
                print_result(True, "Retrieved dataset successfully")
                return True
            else:
                print_result(False, "Missing 'dataset' field in response")
                return False
        else:
            print_result(False, f"Status code: {response.status_code}")
            return False
            
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_chat():
    """Test AI chat interface"""
    print_test_header("AI Chat Interface")
    
    if not auth_token:
        print_result(False, "No auth token available")
        return False
    
    if not dataset_id:
        print_result(False, "No dataset ID available")
        return False
    
    try:
        headers = {
            'Authorization': f'Bearer {auth_token}',
            'Content-Type': 'application/json'
        }
        
        chat_message = "Show me booking trends by city"
        print(f"Sending message: {chat_message}")
        
        response = requests.post(
            f"{BASE_URL}/chat",
            json={
                "datasetId": dataset_id,
                "message": chat_message
            },
            headers=headers,
            timeout=60
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:1000]}")
        
        if response.status_code == 200:
            data = response.json()
            if 'response' in data:
                ai_response = data['response']
                print(f"\nAI Response Type: {type(ai_response)}")
                if isinstance(ai_response, dict):
                    print(f"Response keys: {ai_response.keys()}")
                    if 'message' in ai_response:
                        print(f"Message: {ai_response['message'][:200]}...")
                else:
                    print(f"Response: {str(ai_response)[:200]}...")
                print_result(True, "Chat response received successfully")
                return True
            else:
                print_result(False, "Missing 'response' field")
                return False
        else:
            print_result(False, f"Status code: {response.status_code}")
            return False
            
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_get_chat_history():
    """Test getting chat history"""
    print_test_header("Get Chat History")
    
    if not auth_token:
        print_result(False, "No auth token available")
        return False
    
    if not dataset_id:
        print_result(False, "No dataset ID available")
        return False
    
    try:
        headers = {'Authorization': f'Bearer {auth_token}'}
        response = requests.get(
            f"{BASE_URL}/chat/{dataset_id}",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            if 'messages' in data:
                messages = data['messages']
                print(f"Found {len(messages)} message(s)")
                for msg in messages[:4]:  # Show first 4
                    print(f"  - {msg.get('role')}: {msg.get('content', '')[:50]}...")
                print_result(True, f"Retrieved {len(messages)} messages")
                return True
            else:
                print_result(False, "Missing 'messages' field")
                return False
        else:
            print_result(False, f"Status code: {response.status_code}")
            return False
            
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_delete_dataset():
    """Test deleting a dataset"""
    print_test_header("Delete Dataset")
    
    if not auth_token:
        print_result(False, "No auth token available")
        return False
    
    if not dataset_id:
        print_result(False, "No dataset ID available")
        return False
    
    try:
        headers = {'Authorization': f'Bearer {auth_token}'}
        response = requests.delete(
            f"{BASE_URL}/datasets/{dataset_id}",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print_result(True, "Dataset deleted successfully")
                return True
            else:
                print_result(False, "Success field not true")
                return False
        else:
            print_result(False, f"Status code: {response.status_code}")
            return False
            
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_unauthorized_access():
    """Test that endpoints require authentication"""
    print_test_header("Unauthorized Access Test")
    
    try:
        # Try to access datasets without token
        response = requests.get(f"{BASE_URL}/datasets", timeout=10)
        
        if response.status_code == 401:
            print_result(True, "Correctly rejected unauthorized request")
            return True
        else:
            print_result(False, f"Expected 401, got {response.status_code}")
            return False
            
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def run_all_tests():
    """Run all backend tests"""
    print("\n" + "="*80)
    print("INSIGHTFLOW AI - COMPREHENSIVE BACKEND API TESTS")
    print("="*80)
    
    results = {}
    
    # Test sequence
    tests = [
        ("API Health", test_api_health),
        ("User Signup", test_signup),
        ("Invalid Login", test_login_invalid_credentials),
        ("Unauthorized Access", test_unauthorized_access),
        ("Dataset Upload & AI Analysis", test_dataset_upload),
        ("Get Datasets List", test_get_datasets),
        ("Get Dataset by ID", test_get_dataset_by_id),
        ("AI Chat", test_chat),
        ("Get Chat History", test_get_chat_history),
        ("Delete Dataset", test_delete_dataset),
    ]
    
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"\n❌ CRITICAL ERROR in {test_name}: {str(e)}")
            results[test_name] = False
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\n{'='*80}")
    print(f"TOTAL: {passed}/{total} tests passed ({passed*100//total}%)")
    print(f"{'='*80}\n")
    
    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
