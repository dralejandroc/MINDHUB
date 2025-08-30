#!/bin/bash

echo "🧪 Testing Django Backend Endpoints..."

BACKEND_URL="https://mindhub-django-backend.vercel.app"

echo ""
echo "1. 🏠 Testing API Root:"
curl -s "$BACKEND_URL/" | jq . || echo "❌ API Root failed"

echo ""
echo "2. 📋 Testing Assessments endpoint:"
curl -s -I "$BACKEND_URL/assessments/" | head -1 || echo "❌ Assessments endpoint failed"

echo ""
echo "3. 📊 Testing Scales endpoint:"
curl -s -I "$BACKEND_URL/scales/" | head -1 || echo "❌ Scales endpoint failed"

echo ""
echo "4. 🔬 Testing Assessment React API:"
curl -s -I "$BACKEND_URL/assessments/react-api/health/" | head -1 || echo "❌ React API health failed"

echo ""
echo "5. 📋 Testing Scale Catalog API:"
curl -s -I "$BACKEND_URL/scales/api/catalog/" | head -1 || echo "❌ Scale catalog API failed"

echo ""
echo "🏁 Endpoint testing completed"