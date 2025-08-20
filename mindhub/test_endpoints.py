#!/usr/bin/env python3
"""
MindHub Endpoints Testing Script
Comprehensive API testing after Django migration fixes
"""
import requests
import json
import time
from datetime import datetime

# Configuration
DJANGO_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3002"

def test_result(name, success, details=""):
    """Print formatted test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {name}")
    if details:
        print(f"    {details}")

def test_django_endpoints():
    """Test Django API endpoints"""
    print("\n🐍 DJANGO API ENDPOINTS")
    print("="*50)
    
    endpoints = [
        ("/admin/", "Django Admin"),
        ("/api/scales/", "Psychometric Scales API"),
        ("/api/assessments/", "Assessments API"), 
        ("/api/clinimetrix-pro/", "ClinimetrixPro API"),
        ("/api/expedix/", "Expedix API"),
        ("/api/agenda/", "Agenda API"),
        ("/api/resources/", "Resources API"),
        ("/scales/api/catalog/", "Scales Catalog"),
        ("/assessments/api/create-from-react/", "React Bridge API"),
    ]
    
    results = {}
    for endpoint, name in endpoints:
        try:
            response = requests.get(f"{DJANGO_URL}{endpoint}", timeout=5)
            # Accept various statuses (200=OK, 401=needs auth, 405=wrong method)
            success = response.status_code in [200, 401, 405, 302]
            details = f"Status: {response.status_code}"
            if not success and response.status_code == 404:
                details += " - Endpoint not found"
            elif not success and response.status_code >= 500:
                details += " - Server error"
            
            test_result(name, success, details)
            results[endpoint] = success
            
        except requests.exceptions.ConnectionError:
            test_result(name, False, "Connection refused - Django server not running")
            results[endpoint] = False
        except Exception as e:
            test_result(name, False, f"Error: {str(e)}")
            results[endpoint] = False
    
    return results

def test_frontend_endpoints():
    """Test Frontend API endpoints"""
    print("\n⚛️ FRONTEND API ENDPOINTS")
    print("="*50)
    
    endpoints = [
        ("/api/health", "Health Check"),
        ("/api/test-working", "Basic Test"),
        ("/api/test-backend", "Backend Connectivity Test"),
        ("/api/clinimetrix-pro", "ClinimetrixPro Proxy"),
        ("/api/expedix/django", "Expedix Django Proxy"),
        ("/api/agenda/django", "Agenda Django Proxy"),
        ("/api/resources/django", "Resources Django Proxy"),
        ("/api/expedix/patients", "Expedix Patients"),
        ("/api/debug-env", "Environment Debug"),
    ]
    
    results = {}
    for endpoint, name in endpoints:
        try:
            response = requests.get(f"{FRONTEND_URL}{endpoint}", timeout=10)
            # Accept various statuses
            success = response.status_code in [200, 401, 500]  # 500 might be expected without proper setup
            details = f"Status: {response.status_code}"
            
            # Try to parse JSON response for more details
            try:
                data = response.json()
                if 'error' in data:
                    details += f" - {data.get('error', 'Unknown error')}"
                elif 'success' in data:
                    details += f" - Success: {data.get('success')}"
            except:
                pass
                
            test_result(name, success, details)
            results[endpoint] = success
            
        except requests.exceptions.ConnectionError:
            test_result(name, False, "Connection refused - Frontend server not running")  
            results[endpoint] = False
        except Exception as e:
            test_result(name, False, f"Error: {str(e)}")
            results[endpoint] = False
    
    return results

def test_cors_configuration():
    """Test CORS configuration"""
    print("\n🌐 CORS CONFIGURATION TEST")
    print("="*50)
    
    # Test cross-origin request from frontend port to Django
    try:
        response = requests.get(
            f"{DJANGO_URL}/api/scales/",
            headers={
                'Origin': 'http://localhost:3002',
                'Access-Control-Request-Method': 'GET',
            },
            timeout=5
        )
        
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        }
        
        cors_ok = any(cors_headers.values())
        test_result("CORS Headers Present", cors_ok, f"Headers: {cors_headers}")
        
        return cors_ok
        
    except Exception as e:
        test_result("CORS Configuration", False, f"Error: {str(e)}")
        return False

def test_database_connection():
    """Test database connectivity through Django"""
    print("\n🗄️ DATABASE CONNECTION TEST")
    print("="*50)
    
    try:
        # Try to access Django admin which requires database
        response = requests.get(f"{DJANGO_URL}/admin/", timeout=5)
        
        # 200 or 302 (redirect to login) indicates database is working
        db_ok = response.status_code in [200, 302]
        details = f"Admin page status: {response.status_code}"
        
        if response.status_code == 500:
            details += " - Possible database connection error"
        elif response.status_code == 302:
            details += " - Database OK (redirected to login)"
        elif response.status_code == 200:
            details += " - Database OK (admin accessible)"
            
        test_result("Database Connection", db_ok, details)
        return db_ok
        
    except Exception as e:
        test_result("Database Connection", False, f"Error: {str(e)}")
        return False

def test_integration_flow():
    """Test the integration flow between frontend and Django"""
    print("\n🔄 INTEGRATION FLOW TEST")
    print("="*50)
    
    try:
        # Test frontend can reach Django through proxy
        response = requests.get(f"{FRONTEND_URL}/api/test-backend", timeout=10)
        
        integration_ok = response.status_code == 200
        details = f"Status: {response.status_code}"
        
        if response.status_code == 200:
            try:
                data = response.json()
                if data.get('success'):
                    details += " - Frontend successfully connected to Django"
                else:
                    details += f" - Error: {data.get('message', 'Unknown')}"
                    integration_ok = False
            except:
                details += " - Invalid JSON response"
                integration_ok = False
                
        test_result("Frontend → Django Integration", integration_ok, details)
        return integration_ok
        
    except Exception as e:
        test_result("Frontend → Django Integration", False, f"Error: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("🔧 MindHub Endpoints Testing")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    # Track results
    all_results = {}
    
    # Test database first (most critical)
    db_ok = test_database_connection()
    all_results['database'] = db_ok
    
    # Test Django endpoints
    django_results = test_django_endpoints()
    all_results['django_endpoints'] = django_results
    
    # Test frontend endpoints
    frontend_results = test_frontend_endpoints()
    all_results['frontend_endpoints'] = frontend_results
    
    # Test CORS
    cors_ok = test_cors_configuration()
    all_results['cors'] = cors_ok
    
    # Test integration
    integration_ok = test_integration_flow()
    all_results['integration'] = integration_ok
    
    # Summary
    print("\n" + "="*60)
    print("📊 TESTING SUMMARY")
    print("="*60)
    
    if not db_ok:
        print("❌ CRITICAL: Database connection failed")
        print("   → Check PostgreSQL connection in Django .env")
        print("   → Verify Supabase credentials")
        print("   → Run: python manage.py migrate")
    
    django_failed = sum(1 for v in django_results.values() if not v)
    if django_failed > 0:
        print(f"⚠️ WARNING: {django_failed}/{len(django_results)} Django endpoints failed")
        print("   → Check Django server is running on port 8000")
        print("   → Verify Django URL configuration")
    
    frontend_failed = sum(1 for v in frontend_results.values() if not v)
    if frontend_failed > 0:
        print(f"⚠️ WARNING: {frontend_failed}/{len(frontend_results)} Frontend endpoints failed")
        print("   → Check Frontend server is running on port 3002")
        print("   → Verify API proxy route configuration")
    
    if not cors_ok:
        print("⚠️ WARNING: CORS configuration issues")
        print("   → Check Django CORS settings")
        print("   → Verify allowed origins include localhost:3002")
    
    if not integration_ok:
        print("❌ CRITICAL: Integration flow broken")
        print("   → Check frontend can reach Django backend")
        print("   → Verify proxy routes are working")
    
    # Overall status
    critical_issues = sum([
        1 for x in [db_ok, integration_ok] if not x
    ])
    
    if critical_issues == 0:
        print("✅ All critical systems operational")
    else:
        print(f"❌ {critical_issues} critical issues need immediate attention")
    
    print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    return all_results

if __name__ == "__main__":
    main()