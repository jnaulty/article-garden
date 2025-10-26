#!/bin/bash

# Invalidate CloudFront distribution cache for article.garden
# Run this after deploying to S3 to ensure users get the latest version

set -e  # Exit on any error

# Configuration
# TODO: Replace with your actual CloudFront distribution ID after creating the distribution
DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-YOUR_DISTRIBUTION_ID_HERE}"

if [ "$DISTRIBUTION_ID" = "YOUR_DISTRIBUTION_ID_HERE" ]; then
  echo "❌ Error: CLOUDFRONT_DISTRIBUTION_ID not set!"
  echo ""
  echo "Please set the CloudFront distribution ID either:"
  echo "  1. Set environment variable: export CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC"
  echo "  2. Edit this script and replace YOUR_DISTRIBUTION_ID_HERE with your actual ID"
  echo ""
  echo "To find your distribution ID:"
  echo "  aws cloudfront list-distributions --query 'DistributionList.Items[*].[Id,Aliases.Items[0]]' --output table"
  exit 1
fi

echo "🔄 Invalidating CloudFront cache for distribution: $DISTRIBUTION_ID"

aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*"

echo "✅ Cache invalidation initiated!"
echo ""
echo "📝 Note: It may take 5-15 minutes for the invalidation to complete."
echo "         You can check status with:"
echo "         aws cloudfront list-invalidations --distribution-id $DISTRIBUTION_ID"
echo ""
