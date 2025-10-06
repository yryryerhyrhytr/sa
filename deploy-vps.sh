#!/bin/bash

# SmartGardenHub VPS Deployment Script
# This script handles the complete deployment process on VPS

echo "🚀 Starting SmartGardenHub VPS Deployment..."

# Step 1: Handle git conflicts by stashing local changes
echo "📦 Resolving git conflicts..."
git stash push -m "VPS local changes backup $(date)"
git pull origin main

# Step 2: Force clean install of dependencies
echo "📋 Installing dependencies..."
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Step 3: Try building, if it fails use server-only build
echo "🔨 Building application..."
if npm run build; then
    echo "✅ Full build successful"
else
    echo "⚠️ Frontend build failed, trying server-only build..."
    # Build only the server part
    npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
    
    # Copy existing frontend files if they exist
    if [ -d "client/dist" ]; then
        cp -r client/dist dist/public
        echo "✅ Using existing frontend build"
    else
        echo "⚠️ No frontend build available, server-only mode"
    fi
fi

# Step 4: Restart PM2 process with environment variables
echo "🔄 Restarting PM2 process..."
pm2 restart smartgarden-prod --update-env

# Step 5: Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Step 6: Test the deployment
echo "🧪 Testing hardcoded authentication..."
response=$(curl -X POST https://gsteaching.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "01762602056", "password": "sir@123@"}' \
  --silent --write-out "HTTPSTATUS:%{http_code}")

http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')

echo "HTTP Status: $http_code"
echo "Response: $body"

if [[ $http_code -eq 200 ]]; then
    echo "✅ Authentication test successful!"
else
    echo "❌ Authentication test failed. Checking logs..."
    pm2 logs smartgarden-prod --lines=10
fi

echo -e "\n✅ Deployment completed!"
echo "📝 Check PM2 logs with: pm2 logs smartgarden-prod --lines=20"