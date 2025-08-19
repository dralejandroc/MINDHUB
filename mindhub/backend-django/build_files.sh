#!/bin/bash

echo "🚀 Building Django for Vercel deployment..."

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Create staticfiles directory
echo "📁 Creating static files directory..."
mkdir -p staticfiles_build

# Collect static files
echo "📋 Collecting static files..."
python manage.py collectstatic --noinput --clear

# Copy static files to build directory
echo "📂 Copying static files to build directory..."
cp -r staticfiles/* staticfiles_build/ 2>/dev/null || :

# Make sure logs directory exists
echo "📝 Creating logs directory..."
mkdir -p logs

echo "✅ Build completed successfully!"