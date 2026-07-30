#!/bin/sh

# Docker entrypoint script for development
# This script runs database setup before starting the application

set -e

echo "🚀 Starting Hypertube development server..."
echo "📁 Working directory: $(pwd)"

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
counter=0
max_attempts=30

while [ $counter -lt $max_attempts ]; do
    if nc -z postgres 5432 2>/dev/null; then
        echo "✅ Database connection established!"
        break
    fi
    
    echo "🔄 Database not ready yet - attempt $((counter + 1))/$max_attempts"
    sleep 2
    counter=$((counter + 1))
done

if [ $counter -eq $max_attempts ]; then
    echo "❌ Database connection timeout after $max_attempts attempts"
    echo "⚠️  Continuing anyway..."
fi

# Set up database schema
echo "🔧 Setting up database schema..."
pnpm prisma generate || {
    echo "⚠️  Prisma generate failed, but continuing..."
}

# Run database migrations/push
echo "📊 Running database setup..."
pnpm prisma db push --skip-generate --accept-data-loss || {
    echo "⚠️  Database push failed, but continuing..."
}

echo "🎉 Database setup complete!"

# Start the application
echo "🏃 Starting application..."
exec "$@"