#!/bin/bash

# AI Solution Center - Development Environment Setup Script

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${BLUE}"
    echo "🚀 AI Solution Center - Development Environment Setup"
    echo "=================================================="
    echo -e "${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local missing_deps=()
    
    if ! command_exists node; then
        missing_deps+=("Node.js (v18+)")
    else
        local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$node_version" -lt 18 ]; then
            missing_deps+=("Node.js v18+ (current: $(node --version))")
        fi
    fi
    
    if ! command_exists yarn; then
        missing_deps+=("Yarn")
    fi
    
    if ! command_exists docker; then
        missing_deps+=("Docker")
    fi
    
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        missing_deps+=("Docker Compose")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing prerequisites:"
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep"
        done
        echo ""
        echo "Please install the missing dependencies and run this script again."
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Setup environment variables
setup_env() {
    print_status "Setting up environment variables..."
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success "Created .env from .env.example"
        else
            print_warning ".env.example not found, creating basic .env file"
            cat > .env << EOF
# AI Solution Center Environment Variables

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=developer
DATABASE_PASSWORD=dev123
DATABASE_NAME=ai_solution

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=dev123

# LLM Providers
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434

# Authentication
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Development
NODE_ENV=development
CORS_ORIGIN=*
EOF
            print_success "Created basic .env file"
        fi
        
        print_warning "Please edit .env file with your API keys and configuration"
        print_warning "Required: OPENAI_API_KEY or ANTHROPIC_API_KEY for LLM functionality"
    else
        print_success ".env file already exists"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if [ ! -d node_modules ]; then
        yarn install
        print_success "Dependencies installed"
    else
        print_status "Dependencies already installed, checking for updates..."
        yarn install --check-files
        print_success "Dependencies verified"
    fi
}

# Start Docker services
start_docker() {
    print_status "Starting Docker services..."
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Start basic services (PostgreSQL, Redis)
    if docker compose -f docker/development/docker-compose.yml ps postgres | grep -q "Up"; then
        print_success "Docker services are already running"
    else
        docker compose -f docker/development/docker-compose.yml up -d postgres redis
        
        # Wait for services to be ready
        print_status "Waiting for services to be ready..."
        
        local max_attempts=30
        local attempt=1
        
        while [ $attempt -le $max_attempts ]; do
            if docker compose -f docker/development/docker-compose.yml exec -T postgres pg_isready -U developer -d ai_solution >/dev/null 2>&1; then
                break
            fi
            echo -n "."
            sleep 2
            attempt=$((attempt + 1))
        done
        
        if [ $attempt -gt $max_attempts ]; then
            print_error "Database failed to start within expected time"
            exit 1
        fi
        
        print_success "Docker services started successfully"
    fi
    
    # Display service information
    echo ""
    print_status "Service URLs:"
    echo "  📊 Database (PostgreSQL): localhost:5432"
    echo "  🗄️  Cache (Redis): localhost:6379"
    echo "  🔧 DB Admin (Adminer): http://localhost:8080 (optional: docker compose --profile tools up -d)"
    echo "  🤖 Local LLM (Ollama): http://localhost:11434 (optional: docker compose --profile ollama up -d)"
}

# Optional: Start additional services
start_optional_services() {
    echo ""
    read -p "$(echo -e ${YELLOW}"🔧 Start optional services (Adminer, Ollama)? (y/N): "${NC})" -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Starting optional services..."
        
        # Start Adminer (Database admin tool)
        docker compose -f docker/development/docker-compose.yml --profile tools up -d adminer
        print_success "Adminer started: http://localhost:8080"
        
        # Ask about Ollama
        read -p "$(echo -e ${YELLOW}"🤖 Start Ollama (Local LLM)? This requires significant resources (y/N): "${NC})" -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker compose -f docker/development/docker-compose.yml --profile ollama up -d ollama
            print_status "Ollama is starting... This may take a few minutes."
            print_status "Download a model: docker exec ai-solution-ollama ollama pull llama3.2"
            print_success "Ollama will be available at: http://localhost:11434"
        fi
    fi
}

# Build core libraries
build_core() {
    print_status "Building core libraries..."
    
    # Check if libraries exist and build them
    local libs=("core-llm" "core-database" "core-auth")
    
    for lib in "${libs[@]}"; do
        if [ -d "libs/core/${lib#core-}" ]; then
            print_status "Building $lib..."
            yarn nx build $lib 2>/dev/null || true
        fi
    done
    
    print_success "Core libraries built"
}

# Run health checks
health_check() {
    print_status "Running health checks..."
    
    # Check database connection
    if docker compose -f docker/development/docker-compose.yml exec -T postgres pg_isready -U developer -d ai_solution >/dev/null 2>&1; then
        print_success "Database connection: OK"
    else
        print_error "Database connection: Failed"
    fi
    
    # Check Redis connection
    if docker compose -f docker/development/docker-compose.yml exec -T redis redis-cli -a dev123 ping >/dev/null 2>&1; then
        print_success "Redis connection: OK"
    else
        print_error "Redis connection: Failed"
    fi
    
    # Check if Nx is working
    if yarn nx --version >/dev/null 2>&1; then
        print_success "Nx workspace: OK"
    else
        print_error "Nx workspace: Failed"
    fi
}

# Main setup function
main() {
    print_header
    
    check_prerequisites
    setup_env
    install_dependencies
    start_docker
    start_optional_services
    build_core
    health_check
    
    echo ""
    print_success "Development environment setup complete!"
    echo ""
    print_status "Next steps:"
    echo "  1. Edit .env file with your API keys"
    echo "  2. Create your first service: yarn create:service my-service"
    echo "  3. Run a service: yarn nx serve my-service"
    echo ""
    print_status "Useful commands:"
    echo "  📦 Install dependencies: yarn install"
    echo "  🐳 Start Docker: yarn docker:up"
    echo "  🛑 Stop Docker: yarn docker:down"
    echo "  🔧 Create service: yarn create:service <name>"
    echo "  🚀 Run service: yarn nx serve <service-name>"
    echo "  🧪 Run tests: yarn nx test <service-name>"
    echo "  📊 View services: yarn nx show projects"
    echo ""
}

# Handle script interruption
trap 'echo -e "\n${YELLOW}Setup interrupted${NC}"; exit 1' INT

# Check if running from correct directory
if [ ! -f package.json ] || ! grep -q "ai-solution" package.json 2>/dev/null; then
    print_error "Please run this script from the AI Solution Center root directory"
    exit 1
fi

# Run main function
main