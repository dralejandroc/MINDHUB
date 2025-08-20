#!/usr/bin/env python3
"""
MindHub System Health Check
Tests all critical connections and endpoints
"""

import requests
import json
import sys
from datetime import datetime

def test_endpoint(name, url, expected_status=200, expected_content=None):
    """Test an endpoint and return results"""
    try:
        response = requests.get(url, timeout=10)
        status_ok = response.status_code == expected_status
        content_ok = True
        
        if expected_content:
            content_ok = expected_content in response.text
            
        if status_ok and content_ok:
            print(f"✅ {name}: OK ({response.status_code})")
            return True
        else:
            print(f"❌ {name}: FAILED ({response.status_code})")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ {name}: CONNECTION REFUSED")
        return False
    except requests.exceptions.Timeout:
        print(f"⏱️ {name}: TIMEOUT")
        return False
    except Exception as e:
        print(f"❌ {name}: ERROR - {str(e)}")
        return False

def main():
    print("🔍 MindHub System Health Check")
    print("=" * 50)
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    tests = []
    
    # Test Django Backend
    print("🐍 DJANGO BACKEND TESTS:")
    tests.append(test_endpoint("Django Admin", "http://localhost:8000/admin/", 302))
    tests.append(test_endpoint("Django API Health", "http://localhost:8000/api/assessments/", 302))
    tests.append(test_endpoint("Django Expedix", "http://localhost:8000/api/expedix/", 401))  # Should require auth
    tests.append(test_endpoint("Django Agenda", "http://localhost:8000/api/agenda/", 401))   # Should require auth
    tests.append(test_endpoint("Django Resources", "http://localhost:8000/api/resources/", 401))  # Should require auth
    
    print()
    print("⚛️ REACT FRONTEND TESTS:")
    tests.append(test_endpoint("Frontend Home", "http://localhost:3000/", 200))
    tests.append(test_endpoint("Frontend Health", "http://localhost:3000/api/health", 200))
    
    print()
    print("🔗 PROXY INTEGRATION TESTS:")
    tests.append(test_endpoint("Agenda Proxy", "http://localhost:3000/api/agenda/django", 401))  # Should require auth
    tests.append(test_endpoint("Expedix Proxy", "http://localhost:3000/api/expedix/django", 401))  # Should require auth
    tests.append(test_endpoint("Resources Proxy", "http://localhost:3000/api/resources/django", 401))  # Should require auth
    
    print()
    print("=" * 50)
    print("📊 SUMMARY:")
    
    passed = sum(tests)
    total = len(tests)
    percentage = (passed / total) * 100
    
    print(f"✅ Passed: {passed}/{total} ({percentage:.1f}%)")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED - System is healthy!")
        return 0
    else:
        failed = total - passed
        print(f"❌ Failed: {failed}/{total}")
        print("⚠️  Please check the failed endpoints above")
        return 1

if __name__ == "__main__":
    sys.exit(main())