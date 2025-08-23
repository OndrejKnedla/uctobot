# ÚčetníBot Makefile
# Easy commands for testing, development, and deployment

.PHONY: help install test test-unit test-integration test-load test-all test-coverage clean format lint run dev deploy

# Default target
help:
	@echo "🚀 ÚčetníBot Development Commands"
	@echo "================================="
	@echo ""
	@echo "📦 Setup & Installation:"
	@echo "  make install          Install all dependencies"
	@echo "  make install-dev      Install dev dependencies" 
	@echo ""
	@echo "🧪 Testing:"
	@echo "  make test             Run all tests"
	@echo "  make test-unit        Run unit tests only"
	@echo "  make test-integration Run integration tests only"
	@echo "  make test-load        Run load tests"
	@echo "  make test-fast        Run tests (skip slow ones)"
	@echo "  make test-coverage    Run tests with coverage report"
	@echo ""
	@echo "🔧 Development:"
	@echo "  make format           Format code with black"
	@echo "  make lint             Run linting checks"
	@echo "  make clean            Clean temporary files"
	@echo "  make run              Run development server"
	@echo "  make dev              Run with auto-reload"
	@echo ""
	@echo "🚀 Deployment:"
	@echo "  make deploy           Deploy to production"
	@echo "  make migrate          Run database migrations"

# Installation
install:
	@echo "📦 Installing dependencies..."
	pip install -r requirements.txt

install-dev: install
	@echo "📦 Installing development dependencies..."
	pip install black flake8 mypy isort

# Testing commands
test:
	@echo "🧪 Running all tests..."
	python run_tests.py --all

test-unit:
	@echo "🧪 Running unit tests..."
	python run_tests.py --unit

test-integration:
	@echo "🧪 Running integration tests..."
	python run_tests.py --integration

test-load:
	@echo "🧪 Running load tests..."
	python run_tests.py --load

test-fast:
	@echo "⚡ Running fast tests..."
	python run_tests.py --all --fast

test-coverage:
	@echo "📊 Running tests with coverage..."
	python run_tests.py --all --coverage
	@echo ""
	@echo "📊 Coverage report generated:"
	@echo "  - Terminal: see output above"
	@echo "  - HTML: open htmlcov/index.html"

test-parallel:
	@echo "🚀 Running tests in parallel..."
	python run_tests.py --all --parallel 4

# Code quality
format:
	@echo "🎨 Formatting code..."
	black app/ utils/ tests/ --line-length 120
	isort app/ utils/ tests/ --profile black

lint:
	@echo "🔍 Running linting checks..."
	flake8 app/ utils/ tests/ --max-line-length 120 --extend-ignore E203,W503
	mypy app/ utils/ --ignore-missing-imports

# Development
run:
	@echo "🚀 Starting development server..."
	python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

dev:
	@echo "🔄 Starting development server with auto-reload..."
	python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Database
migrate:
	@echo "🗄️  Running database migrations..."
	alembic upgrade head

migrate-create:
	@echo "🗄️  Creating new migration..."
	alembic revision --autogenerate -m "$(MSG)"

# Deployment
deploy:
	@echo "🚀 Deploying to production..."
	@echo "⚠️  Make sure you have:"
	@echo "  1. Updated environment variables"
	@echo "  2. Run tests successfully"
	@echo "  3. Created database backups"
	@echo ""
	@read -p "Continue with deployment? [y/N]: " confirm && \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		echo "🚀 Deploying..."; \
		git push origin main; \
		echo "✅ Deployment triggered"; \
	else \
		echo "❌ Deployment cancelled"; \
	fi

# Utilities
clean:
	@echo "🧹 Cleaning temporary files..."
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf .pytest_cache
	rm -rf htmlcov
	rm -rf .coverage
	rm -rf dist
	rm -rf build
	rm -f test_*.db
	rm -f *.pdf
	@echo "✅ Cleanup complete"

# Docker commands
docker-build:
	@echo "🐳 Building Docker image..."
	docker build -t ucetni-bot .

docker-run:
	@echo "🐳 Running Docker container..."
	docker run -p 8000:8000 --env-file .env ucetni-bot

docker-test:
	@echo "🧪 Running tests in Docker..."
	docker run --rm ucetni-bot python run_tests.py --all

# Health checks
health:
	@echo "🏥 Checking application health..."
	curl -f http://localhost:8000/health || echo "❌ Health check failed"

status:
	@echo "📊 Application status:"
	curl -s http://localhost:8000/status | python -m json.tool || echo "❌ Status check failed"

# Load testing with detailed metrics
load-test:
	@echo "📈 Running comprehensive load test..."
	python run_tests.py --load --verbose
	
benchmark:
	@echo "⚡ Running performance benchmarks..."
	pytest tests/test_load.py -v --benchmark-only

# Security
security-scan:
	@echo "🔒 Running security scan..."
	pip install safety bandit
	safety check
	bandit -r app/ utils/ -f json -o security-report.json || true
	@echo "📄 Security report saved to security-report.json"

# Documentation
docs:
	@echo "📚 Generating documentation..."
	pip install sphinx
	sphinx-quickstart docs --sep --project="ÚčetníBot" --author="ÚčetníBot Team" -q
	@echo "📚 Documentation template created in docs/"

# Quick development cycle
quick-test: test-unit lint
	@echo "✅ Quick development tests passed"

pre-commit: format lint test-fast
	@echo "✅ Pre-commit checks passed"

# Environment setup
setup-env:
	@echo "⚙️  Setting up environment..."
	cp .env.example .env
	@echo "📝 Edit .env with your configuration"
	@echo "💡 Run 'make install' to install dependencies"

# Railway deployment
railway-deploy:
	@echo "🚂 Deploying to Railway..."
	railway login
	railway deploy

railway-logs:
	@echo "📋 Viewing Railway logs..."
	railway logs

# Performance monitoring
monitor:
	@echo "📊 Starting performance monitoring..."
	@echo "Metrics available at: http://localhost:8000/metrics"
	@echo "Health check at: http://localhost:8000/health"

# Backup
backup-db:
	@echo "💾 Creating database backup..."
	@if [ -f "ucetni_bot.db" ]; then \
		cp ucetni_bot.db "backups/ucetni_bot_$(shell date +%Y%m%d_%H%M%S).db"; \
		echo "✅ Database backup created"; \
	else \
		echo "❌ No database file found"; \
	fi