#!/usr/bin/env python3
"""
Django to Vercel Deployment Script
Prepares and deploys MindHub Django backend to Vercel
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def run_command(command, description, check=True):
    """Run a command and handle errors"""
    print(f"\n🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=check, capture_output=True, text=True)
        if result.stdout:
            print(f"   {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error in {description}:")
        print(f"   Command: {command}")
        print(f"   Error: {e.stderr}")
        return False

def check_vercel_cli():
    """Check if Vercel CLI is installed"""
    print("🔍 Checking Vercel CLI...")
    
    result = subprocess.run("vercel --version", shell=True, capture_output=True, text=True)
    if result.returncode == 0:
        print(f"✅ Vercel CLI installed: {result.stdout.strip()}")
        return True
    else:
        print("❌ Vercel CLI not found")
        print("   Install with: npm install -g vercel")
        return False

def login_vercel():
    """Login to Vercel"""
    print("\n🔐 Vercel login...")
    result = subprocess.run("vercel whoami", shell=True, capture_output=True, text=True)
    
    if result.returncode == 0:
        print(f"✅ Already logged in as: {result.stdout.strip()}")
        return True
    else:
        print("🔑 Please login to Vercel...")
        success = run_command("vercel login", "Logging in to Vercel", check=False)
        return success

def create_env_file():
    """Create production .env file for deployment"""
    print("\n📝 Creating production environment configuration...")
    
    env_content = """# Production Environment Variables for Vercel
# Copy these to your Vercel project environment variables

# Django
SECRET_KEY=your-production-secret-key-here
DEBUG=False

# Database (Supabase PostgreSQL)
DB_NAME=postgres
DB_USER=postgres.jvbcpldzoyicefdtnwkd
DB_PASSWORD=your-supabase-db-password
DB_HOST=aws-0-us-west-1.pooler.supabase.com
DB_PORT=6543

# Supabase
SUPABASE_URL=https://jvbcpldzoyicefdtnwkd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2NzI5MTIsImV4cCI6MjA1MDI0ODkxMn0.8nLUwPtGi8xtNn4w7qnzPZj8AXhM8tBXBnZFqVLwKJI
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Frontend
REACT_FRONTEND_URL=https://mindhub.cloud

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Vercel specific
VERCEL_ENV=production
"""
    
    with open('.env.production', 'w') as f:
        f.write(env_content)
    
    print("✅ Created .env.production file")
    print("   ⚠️  Please update the values with your actual credentials")
    return True

def prepare_for_deployment():
    """Prepare files for Vercel deployment"""
    print("\n📦 Preparing files for deployment...")
    
    # Create necessary directories
    os.makedirs('static', exist_ok=True)
    os.makedirs('media', exist_ok=True)
    os.makedirs('logs', exist_ok=True)
    
    # Create a simple index.html for root
    index_content = """<!DOCTYPE html>
<html>
<head>
    <title>MindHub Django Backend</title>
</head>
<body>
    <h1>🧠 MindHub Django Backend</h1>
    <h2>FormX + ClinimetrixPro API</h2>
    <ul>
        <li><a href="/admin/">Django Admin</a></li>
        <li><a href="/formx/api/">FormX API</a></li>
        <li><a href="/assessments/">ClinimetrixPro</a></li>
        <li><a href="/api/schema/swagger-ui/">API Documentation</a></li>
    </ul>
</body>
</html>"""
    
    with open('index.html', 'w') as f:
        f.write(index_content)
    
    print("✅ Files prepared for deployment")
    return True

def deploy_to_vercel():
    """Deploy to Vercel"""
    print("\n🚀 Deploying to Vercel...")
    
    # Deploy
    success = run_command("vercel --prod", "Deploying to Vercel production")
    
    if success:
        print("\n🎉 Deployment completed!")
        print("\n📋 Next steps:")
        print("1. Go to your Vercel dashboard")
        print("2. Add environment variables from .env.production")
        print("3. Redeploy to apply environment variables")
        print("4. Update your React frontend to use the new backend URL")
        
        # Get deployment URL
        result = subprocess.run("vercel ls", shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"\n🔗 Check your deployment at: https://your-project-name.vercel.app")
    
    return success

def main():
    """Main deployment function"""
    print("🚀 MindHub Django Backend - Vercel Deployment")
    print("="*50)
    
    # Change to backend directory
    backend_dir = Path(__file__).resolve().parent
    os.chdir(backend_dir)
    print(f"📁 Working directory: {backend_dir}")
    
    steps = [
        ("Vercel CLI Check", check_vercel_cli),
        ("Vercel Login", login_vercel),
        ("Environment Configuration", create_env_file),
        ("Deployment Preparation", prepare_for_deployment),
        ("Vercel Deployment", deploy_to_vercel),
    ]
    
    for step_name, step_func in steps:
        print(f"\n{'='*20} {step_name} {'='*20}")
        success = step_func()
        if not success:
            print(f"\n❌ Failed at step: {step_name}")
            print("   Please resolve the issue and try again")
            return 1
    
    print(f"\n{'='*50}")
    print("🎉 Django Backend Successfully Deployed to Vercel!")
    print("="*50)
    
    print("\n📚 Important URLs:")
    print("   🏠 Backend: https://your-backend-url.vercel.app")
    print("   🔧 Admin: https://your-backend-url.vercel.app/admin/")
    print("   📋 FormX: https://your-backend-url.vercel.app/formx/api/")
    print("   🧠 ClinimetrixPro: https://your-backend-url.vercel.app/assessments/")
    
    print("\n⚙️  Environment Variables to add in Vercel:")
    print("   Go to Project Settings > Environment Variables")
    print("   Add all variables from .env.production file")
    
    print("\n🔗 Update React Frontend:")
    print("   Update NEXT_PUBLIC_DJANGO_BACKEND_URL in your React .env")
    print("   Point it to your new Vercel backend URL")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())