#!/usr/bin/env python3
"""
Backend API Testing for InsightFlow AI
Tests smart fallback analysis functionality
"""

import requests
import json
import os
from pathlib import Path

# Configuration
BASE_URL = "https://insight-flow-22.preview.emergentagent.com/api"
EXCEL_FILE = "/tmp/sample_hotel_bookings.xlsx"

# Test data
test_user = {
    "name": "Demo User",
    "email": "demo@test.com",
    "password": "demo123"
}

# Global variables
auth_token = None
dataset_id = None

def print_test_header(test_name):
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")

def print_result(success, message):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")

def print_json(data, title="Response"):
    print(f"\n{title}:")
    print(json.dumps(data, indent=2, default=str))

# Test 1: Create new user account
def test_signup():
    global auth_token
    print_test_header("1. User Signup")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/signup",
            json=test_user,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code in [200, 201]:
            data = response.json()
            print_json(data)
            
            if 'token' in data and 'user' in data:
                auth_token = data['token']
                print_result(True, f"User created successfully. Token received: {auth_token[:20]}...")
                return True
            else:
                print_result(False, "Response missing token or user data")
                return False
        elif response.status_code == 400 and 'already exists' in response.text.lower():
            # User already exists, try login instead
            print("User already exists, attempting login...")
            return test_login()
        else:
            print_result(False, f"Signup failed: {response.text}")
            return False
            
    except Exception as e:
        print_result(False, f"Exception during signup: {str(e)}")
        return False

def test_login():
    global auth_token
    print_test_header("1b. User Login (Fallback)")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": test_user["email"], "password": test_user["password"]},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_json(data)
            
            if 'token' in data:
                auth_token = data['token']
                print_result(True, f"Login successful. Token received: {auth_token[:20]}...")
                return True
            else:
                print_result(False, "Response missing token")
                return False
        else:
            print_result(False, f"Login failed: {response.text}")
            return False
            
    except Exception as e:
        print_result(False, f"Exception during login: {str(e)}")
        return False

# Test 2: Upload Excel file with smart analysis
def test_upload_dataset():
    global dataset_id
    print_test_header("2. Upload Excel File with Smart Analysis")
    
    if not auth_token:
        print_result(False, "No auth token available")
        return False
    
    if not os.path.exists(EXCEL_FILE):
        print_result(False, f"Excel file not found: {EXCEL_FILE}")
        return False
    
    try:
        with open(EXCEL_FILE, 'rb') as f:
            files = {'file': ('sample_hotel_bookings.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            headers = {'Authorization': f'Bearer {auth_token}'}
            
            response = requests.post(
                f"{BASE_URL}/datasets/upload",
                files=files,
                headers=headers,
                timeout=30
            )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code in [200, 201]:
            data = response.json()
            print_json(data)
            
            # Verify smart fallback analysis
            checks = []
            
            # Check datasetId
            if 'datasetId' in data:
                dataset_id = data['datasetId']
                checks.append(("datasetId present", True))
            else:
                checks.append(("datasetId present", False))
            
            # Check sheets info
            if 'sheets' in data and len(data['sheets']) > 0:
                checks.append(("sheets info present", True))
                print(f"\nSheets found: {[s['name'] for s in data['sheets']]}")
            else:
                checks.append(("sheets info present", False))
            
            # Check analysis structure
            if 'analysis' in data:
                analysis = data['analysis']
                checks.append(("analysis present", True))
                
                # Check dimensions
                if 'dimensions' in analysis and len(analysis['dimensions']) > 0:
                    checks.append(("dimensions identified", True))
                    print(f"Dimensions: {analysis['dimensions']}")
                else:
                    checks.append(("dimensions identified", False))
                
                # Check measures
                if 'measures' in analysis and len(analysis['measures']) > 0:
                    checks.append(("measures identified", True))
                    print(f"Measures: {analysis['measures']}")
                else:
                    checks.append(("measures identified", False))
                
                # Check insights
                if 'insights' in analysis and len(analysis['insights']) > 0:
                    checks.append(("insights generated", True))
                    print(f"Insights: {analysis['insights']}")
                else:
                    checks.append(("insights generated", False))
            else:
                checks.append(("analysis present", False))
            
            # Print all checks
            print("\nSmart Analysis Verification:")
            all_passed = True
            for check_name, passed in checks:
                print_result(passed, check_name)
                if not passed:
                    all_passed = False
            
            if all_passed:
                print_result(True, "Upload with smart analysis successful")
                return True
            else:
                print_result(False, "Some analysis checks failed")
                return False
        else:
            print_result(False, f"Upload failed: {response.text}")
            return False
            
    except Exception as e:
        print_result(False, f"Exception during upload: {str(e)}")
        return False

# Test 3: Get datasets list
def test_get_datasets():
    print_test_header("3. Get Datasets List")
    
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
        
        if response.status_code == 200:
            data = response.json()
            print_json(data)
            
            if 'datasets' in data:
                dataset_count = len(data['datasets'])
                print_result(True, f"Retrieved {dataset_count} dataset(s)")
                
                if dataset_count > 0 and dataset_id:
                    # Verify our uploaded dataset is in the list
                    found = any(d.get('datasetId') == dataset_id for d in data['datasets'])
                    if found:
                        print_result(True, "Uploaded dataset found in list")
                    else:
                        print_result(False, "Uploaded dataset NOT found in list")
                
                return True
            else:
                print_result(False, "Response missing 'datasets' field")
                return False
        else:
            print_result(False, f"Get datasets failed: {response.text}")
            return False
            
    except Exception as e:
        print_result(False, f"Exception during get datasets: {str(e)}")
        return False

# Test 4: Get specific dataset
def test_get_dataset_by_id():
    print_test_header("4. Get Specific Dataset")
    
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
        
        if response.status_code == 200:
            data = response.json()
            print_json(data)
            
            if 'dataset' in data:
                dataset = data['dataset']
                checks = [
                    ('datasetId matches', dataset.get('datasetId') == dataset_id),
                    ('fileName present', 'fileName' in dataset),
                    ('sheets present', 'sheets' in dataset and len(dataset['sheets']) > 0),
                    ('analysis present', 'analysis' in dataset)
                ]
                
                print("\nDataset Details Verification:")
                all_passed = True
                for check_name, passed in checks:
                    print_result(passed, check_name)
                    if not passed:
                        all_passed = False
                
                if all_passed:
                    print_result(True, "Dataset details retrieved successfully")
                    return True
                else:
                    print_result(False, "Some dataset details missing")
                    return False
            else:
                print_result(False, "Response missing 'dataset' field")
                return False
        else:
            print_result(False, f"Get dataset failed: {response.text}")
            return False
            
    except Exception as e:
        print_result(False, f"Exception during get dataset: {str(e)}")
        return False

# Test 5: Chat with fallback responses
def test_chat_fallback():
    print_test_header("5. Chat with Fallback Responses")
    
    if not auth_token:
        print_result(False, "No auth token available")
        return False
    
    if not dataset_id:
        print_result(False, "No dataset ID available")
        return False
    
    # Test multiple chat messages with different keywords
    test_messages = [
        "Give me a summary of this data",
        "Show me trends"
    ]
    
    all_passed = True
    
    for i, message in enumerate(test_messages, 1):
        print(f"\n--- Chat Message {i}: '{message}' ---")
        
        try:
            headers = {'Authorization': f'Bearer {auth_token}'}
            response = requests.post(
                f"{BASE_URL}/chat",
                json={"datasetId": dataset_id, "message": message},
                headers=headers,
                timeout=15
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code in [200, 201]:
                data = response.json()
                print_json(data)
                
                if 'response' in data:
                    response_data = data['response']
                    
                    # Check if response contains meaningful content
                    if isinstance(response_data, dict):
                        if 'message' in response_data and len(response_data['message']) > 0:
                            print_result(True, f"Chat response received (length: {len(response_data['message'])})")
                        else:
                            print_result(False, "Chat response empty or missing message")
                            all_passed = False
                    elif isinstance(response_data, str) and len(response_data) > 0:
                        print_result(True, f"Chat response received (length: {len(response_data)})")
                    else:
                        print_result(False, "Chat response in unexpected format")
                        all_passed = False
                else:
                    print_result(False, "Response missing 'response' field")
                    all_passed = False
            else:
                print_result(False, f"Chat failed: {response.text}")
                all_passed = False
                
        except Exception as e:
            print_result(False, f"Exception during chat: {str(e)}")
            all_passed = False
    
    return all_passed

# Test 6: Get chat history
def test_get_chat_history():
    print_test_header("6. Get Chat History")
    
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
        
        if response.status_code == 200:
            data = response.json()
            print_json(data)
            
            if 'messages' in data:
                message_count = len(data['messages'])
                print_result(True, f"Retrieved {message_count} chat message(s)")
                
                # We sent 2 messages, so we should have at least 4 (2 user + 2 assistant)
                if message_count >= 4:
                    print_result(True, "Chat messages saved and retrieved correctly")
                    
                    # Verify message structure
                    sample_msg = data['messages'][0]
                    has_role = 'role' in sample_msg
                    has_content = 'content' in sample_msg
                    has_timestamp = 'timestamp' in sample_msg
                    
                    if has_role and has_content and has_timestamp:
                        print_result(True, "Message structure is correct")
                        return True
                    else:
                        print_result(False, "Message structure incomplete")
                        return False
                else:
                    print_result(False, f"Expected at least 4 messages, got {message_count}")
                    return False
            else:
                print_result(False, "Response missing 'messages' field")
                return False
        else:
            print_result(False, f"Get chat history failed: {response.text}")
            return False
            
    except Exception as e:
        print_result(False, f"Exception during get chat history: {str(e)}")
        return False

# Test 7: Delete dataset
def test_delete_dataset():
    print_test_header("7. Delete Dataset")
    
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
        
        if response.status_code == 200:
            data = response.json()
            print_json(data)
            
            if data.get('success'):
                print_result(True, "Dataset deleted successfully")
                
                # Verify dataset is actually deleted
                print("\nVerifying deletion...")
                verify_response = requests.get(
                    f"{BASE_URL}/datasets/{dataset_id}",
                    headers=headers,
                    timeout=10
                )
                
                if verify_response.status_code == 404:
                    print_result(True, "Dataset confirmed deleted (404 on GET)")
                    
                    # Verify chat messages are also deleted
                    chat_response = requests.get(
                        f"{BASE_URL}/chat/{dataset_id}",
                        headers=headers,
                        timeout=10
                    )
                    
                    if chat_response.status_code == 200:
                        chat_data = chat_response.json()
                        if len(chat_data.get('messages', [])) == 0:
                            print_result(True, "Chat messages also deleted")
                            return True
                        else:
                            print_result(False, "Chat messages still exist after dataset deletion")
                            return False
                    else:
                        print_result(True, "Chat endpoint returns non-200 (messages likely deleted)")
                        return True
                else:
                    print_result(False, f"Dataset still accessible after deletion (status: {verify_response.status_code})")
                    return False
            else:
                print_result(False, "Delete response missing 'success' field")
                return False
        else:
            print_result(False, f"Delete failed: {response.text}")
            return False
            
    except Exception as e:
        print_result(False, f"Exception during delete: {str(e)}")
        return False

# Main test runner
def run_all_tests():
    print("\n" + "="*80)
    print("INSIGHTFLOW AI - BACKEND API TESTING")
    print("Testing Smart Fallback Analysis Functionality")
    print("="*80)
    
    results = {}
    
    # Run tests in sequence
    results['signup'] = test_signup()
    
    if results['signup']:
        results['upload'] = test_upload_dataset()
        results['get_datasets'] = test_get_datasets()
        results['get_dataset_by_id'] = test_get_dataset_by_id()
        results['chat'] = test_chat_fallback()
        results['chat_history'] = test_get_chat_history()
        results['delete'] = test_delete_dataset()
    else:
        print("\n❌ Signup/Login failed. Skipping remaining tests.")
        results['upload'] = False
        results['get_datasets'] = False
        results['get_dataset_by_id'] = False
        results['chat'] = False
        results['chat_history'] = False
        results['delete'] = False
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    test_names = {
        'signup': '1. User Signup/Login',
        'upload': '2. Upload with Smart Analysis',
        'get_datasets': '3. Get Datasets List',
        'get_dataset_by_id': '4. Get Dataset by ID',
        'chat': '5. Chat with Fallback',
        'chat_history': '6. Get Chat History',
        'delete': '7. Delete Dataset'
    }
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for key, name in test_names.items():
        status = "✅ PASS" if results[key] else "❌ FAIL"
        print(f"{status} - {name}")
    
    print(f"\n{'='*80}")
    print(f"TOTAL: {passed}/{total} tests passed")
    print(f"{'='*80}\n")
    
    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
