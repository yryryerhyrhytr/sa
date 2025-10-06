# 🏥 Student Nursing Center - VPS Deployment Guide

This guide will help you deploy the Student Nursing Center application on your VPS with a local PostgreSQL database.

## 📋 Prerequisites

- Ubuntu/Debian VPS with sudo access
- Node.js 18+ 
- Git

## 🚀 Quick Setup (Automated)

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd sa
```

2. **Run the automated setup:**
```bash
npm run setup
```

This will:
- Install and configure PostgreSQL
- Create the database and user
- Generate environment configuration
- Set up all necessary permissions

3. **Install dependencies:**
```bash
npm install
```

4. **Build the application:**
```bash
npm run build
```

5. **Initialize the database:**
```bash
npm run db:push
```

6. **Start the application:**
```bash
npm start
```

## 🔧 Manual Setup (If automated setup fails)

### Step 1: Install PostgreSQL

```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Step 2: Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL console:
CREATE DATABASE student_nursing_center;
CREATE USER nursing_admin WITH PASSWORD 'SecureNursing2024!';
GRANT ALL PRIVILEGES ON DATABASE student_nursing_center TO nursing_admin;

# Connect to the database
\c student_nursing_center

# Grant schema privileges
GRANT ALL ON SCHEMA public TO nursing_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nursing_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nursing_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO nursing_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO nursing_admin;

# Exit
\q
```

### Step 3: Configure Environment

Create `.env` file:

```bash
cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://nursing_admin:SecureNursing2024!@localhost:5432/student_nursing_center

# Session Secret (generate a random secret)
SESSION_SECRET=your-super-secret-session-key-here

# Application Environment
NODE_ENV=production
PORT=5000

# SMS Configuration (optional)
# SMS_API_KEY=your_sms_api_key
# SMS_SENDER_ID=your_sender_id
# SMS_API_URL=http://bulksmsbd.net/api/smsapi
EOF
```

Set proper permissions:
```bash
chmod 600 .env
```

### Step 4: Install and Build

```bash
# Install Node.js dependencies
npm install

# Build the application
npm run build

# Initialize database schema
npm run db:push
```

### Step 5: Start the Application

```bash
# Start in production mode
npm start
```

## 🔐 Default Login Credentials

After setup, you can login with these default accounts:

**Teacher Account:**
- Phone: `01762602056`
- Password: `sir@123@`

**Super User Account:**
- Phone: `01818291546`
- Password: `sahidx@123`

## 🌐 Setting up Reverse Proxy (Optional)

For production deployment, set up Nginx as a reverse proxy:

### Install Nginx:
```bash
sudo apt install nginx -y
```

### Create Nginx configuration:
```bash
sudo tee /etc/nginx/sites-available/nursing-center << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
```

### Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/nursing-center /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔄 Setting up as System Service (Recommended)

Create a systemd service for automatic startup:

```bash
sudo tee /etc/systemd/system/nursing-center.service << 'EOF'
[Unit]
Description=Student Nursing Center
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/sa
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
```

Enable and start the service:
```bash
sudo systemctl enable nursing-center
sudo systemctl start nursing-center
sudo systemctl status nursing-center
```

## 📊 Database Management

### Backup Database:
```bash
pg_dump postgresql://nursing_admin:SecureNursing2024!@localhost:5432/student_nursing_center > backup.sql
```

### Restore Database:
```bash
psql postgresql://nursing_admin:SecureNursing2024!@localhost:5432/student_nursing_center < backup.sql
```

### Monitor Logs:
```bash
# Application logs (if using systemd service)
sudo journalctl -u nursing-center -f

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

## 🔧 Troubleshooting

### Database Connection Issues:
1. Check if PostgreSQL is running: `sudo systemctl status postgresql`
2. Verify database exists: `sudo -u postgres psql -l`
3. Test connection: `psql postgresql://nursing_admin:SecureNursing2024!@localhost:5432/student_nursing_center -c "SELECT version();"`

### Permission Issues:
```bash
# Fix file permissions
chmod 600 .env
chown -R $USER:$USER .

# Check PostgreSQL user permissions
sudo -u postgres psql -c "\du"
```

### Port Issues:
```bash
# Check if port 5000 is available
sudo netstat -tlnp | grep :5000

# Change port in .env file if needed
echo "PORT=3000" >> .env
```

## 🔒 Security Recommendations

1. **Change default passwords** immediately after setup
2. **Use strong session secrets** (generated automatically by setup script)
3. **Configure firewall** to only allow necessary ports
4. **Regular backups** of the database
5. **Keep system updated**: `sudo apt update && sudo apt upgrade`
6. **Use HTTPS** in production with SSL certificates

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review application logs
3. Verify all environment variables are set correctly
4. Ensure PostgreSQL is properly configured and running

---

✅ **Your Student Nursing Center is now ready for production use!**