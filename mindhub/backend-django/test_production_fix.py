#!/usr/bin/env python3
"""
Script to test and fix production deployment issues
"""
import requests
import json
import sys

def test_production_endpoints():
    """Test various production endpoints to diagnose issues"""
    
    endpoints = [
        ("Backend Root", "https://mindhub-django-backend.vercel.app/"),
        ("Debug Auth", "https://mindhub-django-backend.vercel.app/api/expedix/debug-auth/"),
        ("Frontend Proxy", "https://mindhub.cloud/api/expedix/patients"),
    ]
    
    print("=== PRODUCTION ENDPOINT TESTING ===\n")
    
    for name, url in endpoints:
        try:
            print(f"🔍 Testing {name}...")
            response = requests.get(url, timeout=10)
            print(f"   Status: {response.status_code}")
            print(f"   Content: {response.text[:100]}...")
            
            if response.headers.get('content-type', '').startswith('application/json'):
                try:
                    data = response.json()
                    if data.get('success') is False:
                        print(f"   ❌ API Error: {data.get('error', 'Unknown')}")
                    else:
                        print(f"   ✅ JSON Response OK")
                except:
                    pass
                    
        except Exception as e:
            print(f"   ❌ Request Failed: {e}")
        print()

def test_with_auth():
    """Test frontend endpoint with authentication"""
    print("=== TESTING WITH SERVICE ROLE KEY ===\n")
    
    # This would need a real user token, not service role key
    headers = {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get("https://mindhub.cloud/api/expedix/patients", headers=headers, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Auth test failed: {e}")

if __name__ == "__main__":
    test_production_endpoints()
    test_with_auth()