#!/bin/bash

# =============================================================================
# MindHub Database Setup Script
# Sets up PostgreSQL database for local development
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="mindhub_dev"
DB_USER="mindhub"
DB_PASSWORD="mindhub_dev_password"
DB_HOST="localhost"
DB_PORT="5432"

echo -e "${BLUE}🏥 MindHub Database Setup${NC}"
echo "=================================="

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is running${NC}"
}

# Function to check if PostgreSQL container is running
check_postgres() {
    if docker ps | grep -q "mindhub-postgres"; then
        echo -e "${GREEN}✅ PostgreSQL container is running${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  PostgreSQL container is not running${NC}"
        return 1
    fi
}

# Function to start database services
start_services() {
    echo -e "${BLUE}🚀 Starting database services...${NC}"
    
    # Start only the database services
    docker-compose up -d postgres redis
    
    echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
    
    # Wait for PostgreSQL to be ready
    for i in {1..30}; do
        if docker exec mindhub-postgres pg_isready -U $DB_USER -d $DB_NAME > /dev/null 2>&1; then
            echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ PostgreSQL failed to start within 60 seconds${NC}"
        exit 1
    fi
}

# Function to create database if it doesn't exist
create_database() {
    echo -e "${BLUE}🗄️  Checking database...${NC}"
    
    # Check if database exists
    if docker exec mindhub-postgres psql -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
        echo -e "${GREEN}✅ Database '$DB_NAME' already exists${NC}"
    else
        echo -e "${YELLOW}📝 Creating database '$DB_NAME'...${NC}"
        docker exec mindhub-postgres createdb -U $DB_USER $DB_NAME
        echo -e "${GREEN}✅ Database '$DB_NAME' created${NC}"
    fi
}

# Function to run database migrations
run_migrations() {
    echo -e "${BLUE}🔄 Running database migrations...${NC}"
    
    # Get the directory where this script is located
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
    PROJECT_DIR="$( cd "$SCRIPT_DIR/.." &> /dev/null && pwd )"
    
    # Run each SQL file in order
    SQL_FILES=(
        "01-init-database.sql"
        "02-expedix-schema.sql"
        "03-clinimetrix-schema.sql"
        "04-formx-schema.sql"
        "05-resources-schema.sql"
        "06-seed-data.sql"
    )
    
    for sql_file in "${SQL_FILES[@]}"; do
        if [ -f "$PROJECT_DIR/database/init/$sql_file" ]; then
            echo -e "${YELLOW}📄 Running $sql_file...${NC}"
            docker exec -i mindhub-postgres psql -U $DB_USER -d $DB_NAME < "$PROJECT_DIR/database/init/$sql_file"
            echo -e "${GREEN}✅ $sql_file completed${NC}"
        else
            echo -e "${RED}❌ File $sql_file not found${NC}"
            exit 1
        fi
    done
}

# Function to show database info
show_info() {
    echo -e "${GREEN}🎉 Database setup completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📋 Connection Information:${NC}"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  Username: $DB_USER"
    echo "  Password: $DB_PASSWORD"
    echo ""
    echo -e "${BLUE}🔧 Development Tools:${NC}"
    echo "  pgAdmin: http://localhost:5050"
    echo "    Email: admin@mindhub.local"
    echo "    Password: mindhub_pgadmin_password"
    echo ""
    echo "  Redis: localhost:6379"
    echo "    Password: mindhub_redis_password"
    echo ""
    echo -e "${BLUE}📊 Sample Data Created:${NC}"
    echo "  - 3 users with different roles (psychiatrist, psychologist, admin)"
    echo "  - 3 sample patients with medical history"
    echo "  - 3 medications and 2 consultations"
    echo "  - 3 assessment scales with sample items"
    echo "  - Form builder field types and templates"
    echo "  - Educational resources with categories and tags"
    echo ""
    echo -e "${BLUE}🚀 Next Steps:${NC}"
    echo "  1. Update your .env.local files with these database credentials"
    echo "  2. Start your application servers"
    echo "  3. Access pgAdmin to explore the database structure"
    echo ""
    echo -e "${YELLOW}💡 Tip: Run 'docker-compose --profile tools up -d' to start pgAdmin${NC}"
}

# Function to reset database
reset_database() {
    echo -e "${YELLOW}⚠️  This will completely reset the database and all data will be lost!${NC}"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}ℹ️  Database reset cancelled${NC}"
        exit 0
    fi
    
    echo -e "${BLUE}🗑️  Dropping database...${NC}"
    docker exec mindhub-postgres dropdb -U $DB_USER $DB_NAME --if-exists
    
    create_database
    run_migrations
    show_info
}

# Function to show help
show_help() {
    echo "MindHub Database Setup Script"
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  setup     Set up the database (default)"
    echo "  reset     Reset the database (WARNING: destroys all data)"
    echo "  start     Start database services only"
    echo "  stop      Stop database services"
    echo "  status    Show database status"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                # Set up database"
    echo "  $0 setup          # Set up database"
    echo "  $0 reset          # Reset database"
    echo "  $0 start          # Start services"
    echo "  $0 stop           # Stop services"
}

# Function to stop services
stop_services() {
    echo -e "${BLUE}🛑 Stopping database services...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ Services stopped${NC}"
}

# Function to show status
show_status() {
    echo -e "${BLUE}📊 Database Status${NC}"
    echo "==================="
    
    if check_postgres; then
        echo -e "${GREEN}PostgreSQL: Running${NC}"
        
        # Show container info
        echo -e "${BLUE}Container Details:${NC}"
        docker ps --filter "name=mindhub-postgres" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        
        # Test database connection
        if docker exec mindhub-postgres psql -U $DB_USER -d $DB_NAME -c "SELECT current_database(), current_user, version();" > /dev/null 2>&1; then
            echo -e "${GREEN}Database Connection: OK${NC}"
        else
            echo -e "${RED}Database Connection: Failed${NC}"
        fi
    else
        echo -e "${RED}PostgreSQL: Not running${NC}"
    fi
    
    if docker ps | grep -q "mindhub-redis"; then
        echo -e "${GREEN}Redis: Running${NC}"
    else
        echo -e "${RED}Redis: Not running${NC}"
    fi
}

# Main script logic
case "${1:-setup}" in
    setup)
        check_docker
        start_services
        create_database
        run_migrations
        show_info
        ;;
    reset)
        check_docker
        if ! check_postgres; then
            start_services
        fi
        reset_database
        ;;
    start)
        check_docker
        start_services
        ;;
    stop)
        stop_services
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unknown option: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac