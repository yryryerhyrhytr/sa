#!/bin/bash

# SmartGardenHub VPS Deployment Script
# This script handles the complete deployment process on VPS

echo "🚀 Starting SmartGardenHub VPS Deployment..."

# Step 1: Handle git conflicts by stashing local changes
echo "📦 Resolving git conflicts..."
git stash push -m "VPS local changes backup $(date)"
git pull origin main

# Step 2: Install dependencies
echo "📋 Installing dependencies..."
npm install

# Step 3: Build the application
echo "🔨 Building application..."
npm run build

# Step 4: Restart PM2 process with environment variables
echo "🔄 Restarting PM2 process..."
pm2 restart smartgarden-prod --update-env

# Step 5: Test the deployment
echo "🧪 Testing hardcoded authentication..."
sleep 3
curl -X POST https://gsteaching.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "01762602056", "password": "sir@123@"}' \
  --silent --show-error

echo -e "\n✅ Deployment completed!"
echo "📝 Check PM2 logs with: pm2 logs smartgarden-prod --lines=20"