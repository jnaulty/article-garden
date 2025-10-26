#!/bin/bash

# Deploy article.garden to S3
# This script builds the React app and syncs it to the S3 bucket
# TODO: Create Walrus deploy script

set -e  # Exit on any error

# Configuration
BUCKET_NAME="article.garden"
BUILD_DIR="dist"
CACHE_CONTROL_SHORT="max-age=1800"  # 30 minutes for HTML/JS/CSS
CACHE_CONTROL_LONG="max-age=31536000"  # 1 year for hashed assets

echo "🏗️  Building application..."
npm run build

if [ ! -d "$BUILD_DIR" ]; then
  echo "❌ Build directory $BUILD_DIR not found!"
  exit 1
fi

echo "📦 Deploying to S3 bucket: $BUCKET_NAME"

# Sync HTML files with short cache
echo "  → Syncing HTML files..."
aws s3 sync "$BUILD_DIR" "s3://$BUCKET_NAME" \
  --exclude "*" \
  --include "*.html" \
  --content-type "text/html" \
  --cache-control "$CACHE_CONTROL_SHORT" \
  --metadata-directive REPLACE \
  --delete

# Sync JavaScript files with short cache
echo "  → Syncing JavaScript files..."
aws s3 sync "$BUILD_DIR" "s3://$BUCKET_NAME" \
  --exclude "*" \
  --include "*.js" \
  --content-type "application/javascript" \
  --cache-control "$CACHE_CONTROL_SHORT" \
  --metadata-directive REPLACE \
  --delete

# Sync CSS files with short cache
echo "  → Syncing CSS files..."
aws s3 sync "$BUILD_DIR" "s3://$BUCKET_NAME" \
  --exclude "*" \
  --include "*.css" \
  --content-type "text/css" \
  --cache-control "$CACHE_CONTROL_SHORT" \
  --metadata-directive REPLACE \
  --delete

# Sync WASM files with long cache
echo "  → Syncing WASM files..."
aws s3 sync "$BUILD_DIR" "s3://$BUCKET_NAME" \
  --exclude "*" \
  --include "*.wasm" \
  --content-type "application/wasm" \
  --cache-control "$CACHE_CONTROL_LONG" \
  --metadata-directive REPLACE \
  --delete

# Sync image files
echo "  → Syncing images..."
aws s3 sync "$BUILD_DIR" "s3://$BUCKET_NAME" \
  --exclude "*" \
  --include "*.png" \
  --include "*.jpg" \
  --include "*.jpeg" \
  --include "*.gif" \
  --include "*.svg" \
  --include "*.ico" \
  --cache-control "$CACHE_CONTROL_LONG" \
  --metadata-directive REPLACE \
  --delete

# Sync font files
echo "  → Syncing fonts..."
aws s3 sync "$BUILD_DIR" "s3://$BUCKET_NAME" \
  --exclude "*" \
  --include "*.woff" \
  --include "*.woff2" \
  --include "*.ttf" \
  --include "*.eot" \
  --cache-control "$CACHE_CONTROL_LONG" \
  --metadata-directive REPLACE \
  --delete

# Sync JSON files with short cache
echo "  → Syncing JSON files..."
aws s3 sync "$BUILD_DIR" "s3://$BUCKET_NAME" \
  --exclude "*" \
  --include "*.json" \
  --content-type "application/json" \
  --cache-control "$CACHE_CONTROL_SHORT" \
  --metadata-directive REPLACE \
  --delete

# Sync any remaining files
echo "  → Syncing remaining files..."
aws s3 sync "$BUILD_DIR" "s3://$BUCKET_NAME" \
  --cache-control "$CACHE_CONTROL_SHORT" \
  --metadata-directive REPLACE \
  --delete

echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Run ./scripts/invalidate-distribution.sh to clear CloudFront cache"
echo "  2. Visit https://article.garden to verify deployment"
echo ""
