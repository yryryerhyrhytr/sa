# Production Deployment for SmartGardenHub

## Strategy: Pre-built Deployment

Since the VPS has issues with vite installation, we'll build everything locally and include the built files in the git repository for easier deployment.

### Local Build and Push
```bash
# Build everything locally
npm run build

# Commit built files to repository
git add dist/
git commit -m "📦 Include pre-built files for VPS deployment"
git push origin main
```

### VPS Deployment (No Build Required)
```bash
cd /var/www/smartgarden

# Pull pre-built code
git stash push -m "backup"
git pull origin main

# Install only production dependencies
npm ci --only=production

# Restart with updated code
pm2 restart smartgarden-prod --update-env

# Test authentication
curl -X POST https://gsteaching.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "01762602056", "password": "sir@123@"}'
```

## Environment Verification

Make sure these environment variables are set on VPS:
```bash
DATABASE_URL="postgresql://sa:sa@localhost:5432/smartgarden"
NODE_ENV="production" 
PORT="3000"
SESSION_SECRET="your-secret-key"
```

## Quick Test Commands

### Check if server is responding:
```bash
curl -I https://gsteaching.com/
```

### Check API endpoint:
```bash
curl https://gsteaching.com/api/health || echo "Health endpoint not available"
```

### Check PM2 status:
```bash
pm2 status
pm2 logs smartgarden-prod --lines=5
```

## Debug Authentication Issues

If authentication still fails after deployment:

1. **Check PM2 logs for errors:**
   ```bash
   pm2 logs smartgarden-prod --lines=20
   ```

2. **Verify environment variables:**
   ```bash
   pm2 show smartgarden-prod
   ```

3. **Test with verbose curl:**
   ```bash
   curl -v -X POST https://gsteaching.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber": "01762602056", "password": "sir@123@"}'
   ```

4. **Check if database is accessible:**
   ```bash
   psql -U sa -d smartgarden -h localhost -c "SELECT 1;"
   ```