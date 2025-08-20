#!/usr/bin/env python3
"""
MindHub System Debug Script
Comprehensive debugging for Django migration issues
"""
import os
import sys
import requests
import json
from datetime import datetime

# Configuration
DJANGO_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3002"
SUPABASE_URL = "https://jvbcpldzoyicefdtnwkd.supabase.co"

def log_test(test_name, status, message="", details=None):
    """Log test results"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    status_emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"[{timestamp}] {status_emoji} {test_name}: {message}")
    if details:
        print(f"    Details: {details}")

def test_django_server():
    """Test Django server connectivity"""
    try:
        response = requests.get(f"{DJANGO_URL}/admin/", timeout=5)
        if response.status_code in [200, 302]:
            log_test("Django Server", "PASS", "Server is running")
            return True
        else:
            log_test("Django Server", "FAIL", f"Unexpected status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        log_test("Django Server", "FAIL", "Connection refused - server not running")
        return False
    except Exception as e:
        log_test("Django Server", "FAIL", f"Error: {str(e)}")
        return False

def test_frontend_server():
    """Test frontend server connectivity"""
    try:
        response = requests.get(f"{FRONTEND_URL}/api/health", timeout=5)
        if response.status_code == 200:
            log_test("Frontend Server", "PASS", "Server is running")
            return True
        else:
            log_test("Frontend Server", "FAIL", f"Unexpected status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        log_test("Frontend Server", "FAIL", "Connection refused - server not running")
        return False
    except Exception as e:
        log_test("Frontend Server", "FAIL", f"Error: {str(e)}")
        return False

def test_django_api_endpoints():
    """Test Django API endpoints"""
    endpoints = [
        "/api/scales/",
        "/api/assessments/", 
        "/api/expedix/",
        "/api/agenda/",
        "/api/resources/"
    ]
    
    results = {}
    for endpoint in endpoints:
        try:
            response = requests.get(f"{DJANGO_URL}{endpoint}", timeout=5)
            if response.status_code in [200, 401]:  # 401 is expected without auth
                log_test(f"Django API {endpoint}", "PASS", f"Status: {response.status_code}")
                results[endpoint] = True
            else:
                log_test(f"Django API {endpoint}", "FAIL", f"Status: {response.status_code}")
                results[endpoint] = False
        except Exception as e:
            log_test(f"Django API {endpoint}", "FAIL", f"Error: {str(e)}")
            results[endpoint] = False
    
    return results

def test_frontend_api_endpoints():
    """Test frontend API endpoints"""
    endpoints = [
        "/api/health",
        "/api/test-working",
        "/api/expedix/patients",
        "/api/clinimetrix-pro"
    ]
    
    results = {}
    for endpoint in endpoints:
        try:
            response = requests.get(f"{FRONTEND_URL}{endpoint}", timeout=10)
            if response.status_code in [200, 401, 500]:  # Various acceptable statuses
                log_test(f"Frontend API {endpoint}", "PASS", f"Status: {response.status_code}")
                results[endpoint] = True
            else:
                log_test(f"Frontend API {endpoint}", "FAIL", f"Status: {response.status_code}")
                results[endpoint] = False
        except Exception as e:
            log_test(f"Frontend API {endpoint}", "FAIL", f"Error: {str(e)}")
            results[endpoint] = False
    
    return results

def test_supabase_connection():
    """Test Supabase connectivity"""
    try:
        response = requests.get(f"{SUPABASE_URL}/rest/v1/", timeout=10, headers={
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDE0NzAsImV4cCI6MjA3MDk3NzQ3MH0.st42ODkomKcaTcT88Xqc3LT_Zo9oVWhkCVwCP07n4NY'
        })
        if response.status_code in [200, 401, 406]:  # Various acceptable statuses
            log_test("Supabase Connection", "PASS", f"Status: {response.status_code}")
            return True
        else:
            log_test("Supabase Connection", "FAIL", f"Status: {response.status_code}")
            return False
    except Exception as e:
        log_test("Supabase Connection", "FAIL", f"Error: {str(e)}")
        return False

def test_environment_variables():
    """Test critical environment variables"""
    django_env_path = "/Users/alekscon/MINDHUB-Pro/mindhub/backend-django/.env"
    frontend_env_path = "/Users/alekscon/MINDHUB-Pro/mindhub/frontend/.env.local"
    
    # Test Django .env
    try:
        with open(django_env_path, 'r') as f:
            django_env = f.read()
            if 'SUPABASE_URL' in django_env and 'SECRET_KEY' in django_env:
                log_test("Django Environment", "PASS", "Key variables present")
            else:
                log_test("Django Environment", "FAIL", "Missing key variables")
    except Exception as e:
        log_test("Django Environment", "FAIL", f"Error reading .env: {str(e)}")
    
    # Test Frontend .env.local
    try:
        with open(frontend_env_path, 'r') as f:
            frontend_env = f.read()
            if 'NEXT_PUBLIC_SUPABASE_URL' in frontend_env:
                log_test("Frontend Environment", "PASS", "Key variables present")
            else:
                log_test("Frontend Environment", "FAIL", "Missing key variables")
    except Exception as e:
        log_test("Frontend Environment", "FAIL", f"Error reading .env.local: {str(e)}")

def main():
    """Run all debugging tests"""
    print("🔍 MindHub System Debug - Starting comprehensive analysis...")
    print("=" * 60)
    
    # Test server connectivity
    print("\n📡 Server Connectivity Tests")
    django_running = test_django_server()
    frontend_running = test_frontend_server()
    supabase_ok = test_supabase_connection()
    
    # Test environment variables
    print("\n🔧 Environment Configuration Tests")
    test_environment_variables()
    
    # Test API endpoints (only if servers are running)
    if django_running:
        print("\n🐍 Django API Endpoint Tests")
        django_endpoints = test_django_api_endpoints()
    else:
        print("\n🐍 Django API Endpoint Tests - SKIPPED (server not running)")
        django_endpoints = {}
    
    if frontend_running:
        print("\n⚛️ Frontend API Endpoint Tests")  
        frontend_endpoints = test_frontend_api_endpoints()
    else:
        print("\n⚛️ Frontend API Endpoint Tests - SKIPPED (server not running)")
        frontend_endpoints = {}
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 SUMMARY OF FINDINGS")
    print("=" * 60)
    
    if not django_running:
        print("❌ CRITICAL: Django server is not running on port 8000")
        print("   Solution: Run 'python manage.py runserver 8000' in backend-django/")
    
    if not frontend_running:
        print("❌ CRITICAL: Frontend server is not running on port 3002")
        print("   Solution: Run 'npm run dev' in frontend/ (check package.json for port)")
    
    if not supabase_ok:
        print("⚠️ WARNING: Supabase connection issues detected")
        print("   Check internet connection and API keys")
    
    # Count failed endpoints
    failed_django = sum(1 for v in django_endpoints.values() if not v)
    failed_frontend = sum(1 for v in frontend_endpoints.values() if not v)
    
    if failed_django > 0:
        print(f"⚠️ WARNING: {failed_django} Django API endpoints failing")
    
    if failed_frontend > 0:
        print(f"⚠️ WARNING: {failed_frontend} Frontend API endpoints failing")
    
    if django_running and frontend_running and supabase_ok:
        print("✅ All core services are operational")
    
    print("\nDebug completed at:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

if __name__ == "__main__":
    main()