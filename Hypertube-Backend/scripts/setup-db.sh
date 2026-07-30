#!/bin/bash

# Hypertube Monolith Database Setup Script

set -e

echo "🗄️  Setting up Hypertube database..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Copying from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env file with your configuration and run this script again.${NC}"
    exit 1
fi

# Start PostgreSQL service
echo -e "${YELLOW}🐘 Starting PostgreSQL...${NC}"
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
timeout=60
counter=0
while ! docker-compose exec -T postgres pg_isready -U hypertube_user -d hypertube > /dev/null 2>&1; do
    if [ $counter -eq $timeout ]; then
        echo -e "${RED}❌ PostgreSQL failed to start within $timeout seconds${NC}"
        exit 1
    fi
    counter=$((counter + 1))
    echo -e "${YELLOW}   Waiting... ($counter/$timeout)${NC}"
    sleep 1
done

echo -e "${GREEN}✅ PostgreSQL is ready!${NC}"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Generate Prisma client
echo -e "${YELLOW}🔧 Generating Prisma client...${NC}"
npx prisma generate

# Push database schema (creates tables)
echo -e "${YELLOW}🏗️  Pushing database schema...${NC}"
npx prisma db push

# Optionally seed the database
if [ -f "prisma/seed.ts" ]; then
    echo -e "${YELLOW}🌱 Seeding database...${NC}"
    npx prisma db seed
fi

echo -e "${GREEN}✅ Database setup completed successfully!${NC}"
echo ""
echo -e "${GREEN}🎉 You can now start the application with:${NC}"
echo -e "   ${YELLOW}npm run dev${NC}      # Development mode"
echo -e "   ${YELLOW}npm run build${NC}    # Build for production"
echo -e "   ${YELLOW}npm start${NC}        # Production mode"
echo ""
echo -e "${GREEN}🔗 Access points:${NC}"
echo -e "   ${YELLOW}Application: http://localhost:3000${NC}"
echo -e "   ${YELLOW}Health check: http://localhost:3000/health${NC}"
echo -e "   ${YELLOW}API endpoints: http://localhost:3000/api${NC}"
echo -e "   ${YELLOW}Prisma Studio: npx prisma studio${NC}"
