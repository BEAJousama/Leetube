# Hypertube Project Makefile
# This Makefile provides commands to manage the Hypertube frontend and backend services

.PHONY: help setup dev dev-frontend dev-backend prod build-prod up down build clean logs status restart

# Default target
help:
	@echo "Hypertube Project Management"
	@echo "============================"
	@echo ""
	@echo "Available commands:"
	@echo ""
	@echo "Development:"
	@echo "  setup            - Complete development environment setup"
	@echo "  dev              - Start both frontend and backend in development mode"
	@echo "  dev-frontend     - Start only frontend in development mode"
	@echo "  dev-backend      - Start only backend in development mode"
	@echo ""
	@echo "Production:"
	@echo "  prod             - Complete production build and deployment"
	@echo "  build-prod       - Build production Docker images"
	@echo "  up               - Start both services in production mode"
	@echo ""
	@echo "General:"
	@echo "  down             - Stop all services"
	@echo "  build            - Build development Docker images"
	@echo "  build-clean      - Build development images with clean cache"
	@echo "  clean            - Stop services and remove containers, volumes, and images"
	@echo "  logs             - Show logs for all services"
	@echo "  logs-frontend    - Show frontend logs"
	@echo "  logs-backend     - Show backend logs"
	@echo "  status           - Show status of all services"
	@echo "  restart          - Restart all services"
	@echo "  restart-frontend - Restart frontend service"
	@echo "  restart-backend  - Restart backend service"
	@echo ""

# Development commands
dev:
	@echo "🚀 Starting Hypertube frontend and backend in development mode..."
	@echo "🔧 Starting backend services..."
	@cd hypertube-backend && NODE_ENV=development docker-compose -f docker-compose.dev.yml up -d --build
	@echo "⏳ Waiting for backend to be ready..."
	@sleep 5
	@echo "🔧 Starting frontend services..."
	@cd hypertube-frontend && docker-compose up -d --build
	@echo "✅ Services started!"
	@echo "📱 Frontend: http://localhost:3001"
	@echo "🖥️  Backend: http://localhost:3000"
	@echo "🗄️  Prisma Studio: http://localhost:5555"
	@echo "📊 PostgreSQL: localhost:5432"

dev-frontend:
	@echo "🚀 Starting Hypertube frontend in development mode..."
	@cd hypertube-frontend && docker-compose up -d
	@echo "✅ Frontend started at http://localhost:3001"

dev-backend:
	@echo "🚀 Starting Hypertube backend in development mode..."
	@cd hypertube-backend && docker-compose -f docker-compose.dev.yml up -d
	@echo "✅ Backend started!"
	@echo "🖥️  Backend: http://localhost:3000"
	@echo "🗄️  Prisma Studio: http://localhost:5555"
	@echo "📊 PostgreSQL: localhost:5432"

# Production commands
build-prod:
	@echo "🔨 Building production Docker images..."
	@echo "📦 Building production backend..."
	@cd hypertube-backend && docker-compose build --no-cache
	@echo "📦 Building production frontend..."
	@cd hypertube-frontend && docker-compose -f docker-compose.prod.yml build --no-cache

up:
	@echo "🚀 Starting Hypertube in production mode..."
	@cd hypertube-backend && docker-compose up -d
	@echo "⏳ Waiting for backend to be ready..."
	@sleep 10
	@cd hypertube-frontend && docker-compose -f docker-compose.prod.yml up -d
	@echo "✅ Production services started!"
	@echo "📱 Frontend: http://localhost:3001"
	@echo "🖥️  Backend: http://localhost:3000"

prod: build-prod up
	@echo "🎉 Production deployment complete!"
	@echo "📱 Frontend: http://localhost:3001"
	@echo "🖥️  Backend: http://localhost:3000"

# Stop services
down:
	@echo "🛑 Stopping all Hypertube services..."
	@cd hypertube-frontend && docker-compose down 2>/dev/null || true
	@cd hypertube-frontend && docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
	@cd hypertube-backend && docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
	@cd hypertube-backend && docker-compose down 2>/dev/null || true
	@echo "✅ All services stopped"

# Build images
build:
	@echo "🔨 Building Docker images..."
	@echo "📦 Building backend..."
	@cd hypertube-backend && docker-compose -f docker-compose.dev.yml build --no-cache
	@echo "📦 Building frontend..."
	@cd hypertube-frontend && docker-compose build --no-cache
	@echo "✅ Build complete"

# Clean up everything
clean:
	@echo "🧹 Cleaning up all containers, volumes, and images..."
	@cd hypertube-frontend && docker-compose down -v --rmi all 2>/dev/null || true
	@cd hypertube-backend && docker-compose -f docker-compose.dev.yml down -v --rmi all 2>/dev/null || true
	@cd hypertube-backend && docker-compose down -v --rmi all 2>/dev/null || true
	@docker system prune -f
	@echo "✅ Cleanup complete"

# Build images with clean cache
build-clean:
	@echo "🔨 Building Docker images with clean cache..."
	@echo "📦 Clean building backend..."
	@cd hypertube-backend && docker-compose -f docker-compose.dev.yml build --no-cache
	@echo "📦 Clean building frontend..."
	@cd hypertube-frontend && docker-compose build --no-cache
	@echo "✅ Clean build complete"

# Logs
logs:
	@echo "📋 Showing logs for all services..."
	@echo "Frontend logs:"
	@cd hypertube-frontend && docker-compose logs --tail=50
	@echo ""
	@echo "Backend logs:"
	@cd hypertube-backend && docker-compose -f docker-compose.dev.yml logs --tail=50

logs-frontend:
	@echo "📋 Showing frontend logs..."
	@cd hypertube-frontend && docker-compose logs -f

logs-backend:
	@echo "📋 Showing backend logs..."
	@cd hypertube-backend && docker-compose -f docker-compose.dev.yml logs -f

# Status
status:
	@echo "📊 Service Status:"
	@echo "=================="
	@echo "Frontend Services:"
	@cd hypertube-frontend && docker-compose ps 2>/dev/null || echo "  No frontend services running"
	@echo ""
	@echo "Backend Services:"
	@cd hypertube-backend && docker-compose -f docker-compose.dev.yml ps 2>/dev/null || echo "  No backend services running"

# Restart services
restart:
	@echo "🔄 Restarting all services..."
	@make down
	@make dev

restart-frontend:
	@echo "🔄 Restarting frontend..."
	@cd hypertube-frontend && docker-compose restart

restart-backend:
	@echo "🔄 Restarting backend..."
	@cd hypertube-backend && docker-compose -f docker-compose.dev.yml restart

# Database commands
db-migrate:
	@echo "🗄️  Running database migrations..."
	@cd hypertube-backend && docker-compose -f docker-compose.dev.yml exec app pnpm prisma migrate dev

db-reset:
	@echo "🗄️  Resetting database..."
	@cd hypertube-backend && docker-compose -f docker-compose.dev.yml exec app pnpm prisma migrate reset --force

db-studio:
	@echo "🗄️  Opening Prisma Studio..."
	@cd hypertube-backend && docker-compose -f docker-compose.dev.yml up -d prisma-studio
	@echo "✅ Prisma Studio available at http://localhost:5555"

# Complete development setup
setup:
	@echo "⚙️  Setting up development environment..."
	@echo "📁 Creating data directories..."
	@mkdir -p data/{uploads,downloads,logs}
	@cp ~/secrets/.env hypertube-backend/.env
	@cp ~/secrets/.env.local hypertube-frontend/.env.local
	@echo "🔨 Building Docker images..."
	@make build
	@echo "🚀 Starting services..."
	@make dev
	@echo ""
	@echo "🎉 Development environment ready!"
	@echo "📱 Frontend: http://localhost:3001"
	@echo "🖥️  Backend: http://localhost:3000"
	@echo "🗄️  Prisma Studio: http://localhost:5555"