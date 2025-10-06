#!/bin/bash

# PostgreSQL Local Setup Script for Student Nursing Center
# This script sets up a local PostgreSQL database for the application

echo "🐘 Setting up PostgreSQL for Student Nursing Center..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    print_status "PostgreSQL not found. Installing PostgreSQL..."
    
    # Update package list
    sudo apt update
    
    # Install PostgreSQL
    sudo apt install postgresql postgresql-contrib -y
    
    print_status "PostgreSQL installed successfully!"
else
    print_status "PostgreSQL is already installed."
fi

# Start PostgreSQL service
print_status "Starting PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
print_status "Setting up database and user..."

# Switch to postgres user and create database
sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE student_nursing_center;

-- Create user with password
CREATE USER nursing_admin WITH PASSWORD 'SecureNursing2024!';

-- Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE student_nursing_center TO nursing_admin;

-- Grant schema privileges
\c student_nursing_center
GRANT ALL ON SCHEMA public TO nursing_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nursing_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nursing_admin;

-- Alter default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO nursing_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO nursing_admin;

\q
EOF

# Create .env file with database configuration
print_status "Creating environment configuration..."

cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://nursing_admin:SecureNursing2024!@localhost:5432/student_nursing_center

# Session Secret (change this for production)
SESSION_SECRET=$(openssl rand -hex 32)

# Application Environment
NODE_ENV=production
PORT=5000

# SMS Configuration (configure these later if needed)
# SMS_API_KEY=your_sms_api_key
# SMS_SENDER_ID=your_sender_id
# SMS_API_URL=http://bulksmsbd.net/api/smsapi
EOF

print_status "Environment file created: .env"

# Set proper permissions
chmod 600 .env

# Test database connection
print_status "Testing database connection..."
if psql postgresql://nursing_admin:SecureNursing2024!@localhost:5432/student_nursing_center -c "SELECT version();" > /dev/null 2>&1; then
    print_status "✅ Database connection successful!"
else
    print_error "❌ Database connection failed!"
    exit 1
fi

# Display final information
echo ""
print_status "🎉 PostgreSQL setup completed successfully!"
echo ""
echo "Database Details:"
echo "  Database Name: student_nursing_center"
echo "  Username: nursing_admin"
echo "  Password: SecureNursing2024!"
echo "  Host: localhost"
echo "  Port: 5432"
echo ""
echo "Next steps:"
echo "1. Install Node.js dependencies: npm install"
echo "2. Run database migrations: npm run db:push"
echo "3. Start the application: npm start"
echo ""
print_warning "Remember to change the default password in production!"