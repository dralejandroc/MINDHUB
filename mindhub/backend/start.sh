#!/bin/sh

echo "🚀 Starting MindHub Backend on Railway..."

# Run Prisma migrations if needed
echo "📊 Setting up database..."
npx prisma migrate deploy || echo "⚠️ Migrations failed or already applied"

# Start the server
echo "🌐 Starting Node.js server on port ${PORT:-8080}..."
node server.js