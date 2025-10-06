# SmartGardenHub VPS Deployment Guide

## Prerequisites
- VPS with Node.js 18+ installed
- PostgreSQL database running locally
- Domain configured (gsteaching.com)
- PM2 installed globally
- Nginx configured as reverse proxy

## Environment Setup

### 1. Database Configuration
Ensure PostgreSQL is running with these settings:
```bash
# PostgreSQL connection string for local database
DATABASE_URL="postgresql://sa:sa@localhost:5432/smartgarden"
```

### 2. Environment Variables
Create or update `/var/www/smartgarden/.env`:
```bash
DATABASE_URL="postgresql://sa:sa@localhost:5432/smartgarden"
NODE_ENV="production"
PORT="3000"
SESSION_SECRET="your-super-secret-session-key-here"
```

## Deployment Commands

### Quick Deployment (Recommended)
```bash
cd /var/www/smartgarden
chmod +x deploy-vps.sh
./deploy-vps.sh
```

### Manual Deployment Steps

#### Step 1: Resolve Git Conflicts
```bash
cd /var/www/smartgarden
git stash push -m "VPS local changes backup $(date)"
git pull origin main
```

#### Step 2: Install Dependencies
```bash
npm install
```

#### Step 3: Build Application
```bash
npm run build
```

#### Step 4: Restart PM2
```bash
pm2 restart smartgarden-prod --update-env
```

#### Step 5: Test Authentication
```bash
# Test teacher login
curl -X POST https://gsteaching.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "01762602056", "password": "sir@123@"}'

# Test admin login  
curl -X POST https://gsteaching.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "01818291546", "password": "sahidx@123@"}'
```

Expected response:
```json
{"success": true, "user": {...}, "role": "teacher"}
```

## Hardcoded Authentication

The system includes permanent hardcoded credentials that work independently of the database:

### Teacher Account
- **Phone**: `01762602056`
- **Password**: `sir@123@`
- **Role**: `teacher`

### Admin Account  
- **Phone**: `01818291546`
- **Password**: `sahidx@123@`
- **Role**: `admin`

## Troubleshooting

### Issue: Git merge conflicts
**Solution**: Use `git stash` before pulling
```bash
git stash push -m "backup local changes"
git pull origin main
```

### Issue: Missing dependencies (vite not found)
**Solution**: Run full npm install
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: SSL certificate WebSocket errors
**Solution**: Database configuration updated to prevent WebSocket connections

### Issue: Authentication returns "Login failed"
**Check**: 
1. PM2 process is running: `pm2 status`
2. Environment variables loaded: `pm2 restart smartgarden-prod --update-env`
3. Database connection: Check `pm2 logs smartgarden-prod`

## Monitoring

### Check Application Status
```bash
pm2 status
pm2 logs smartgarden-prod --lines=20
```

### Check Nginx Status
```bash
systemctl status nginx
nginx -t
```

### Check Database Connection
```bash
psql -U sa -d smartgarden -h localhost
```

## Quick Recovery Commands

If something goes wrong, use these commands for quick recovery:

```bash
# Full reset and redeploy
cd /var/www/smartgarden
git stash push -m "emergency backup"
git reset --hard origin/main
git pull origin main
npm install
npm run build
pm2 restart smartgarden-prod --update-env
```