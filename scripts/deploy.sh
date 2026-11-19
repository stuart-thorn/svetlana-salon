#!/usr/bin/env bash
# Build and deploy the SPA to S3 + CloudFront.
# Usage: AWS_PROFILE=admin-CanaryWharfSalon pnpm deploy:aws [--infra]
set -euo pipefail

STACK="${STACK_NAME:-canary-wharf-salon-site}"
REGION="${AWS_REGION:-eu-west-2}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/apps/web/dist"

if [[ "${1:-}" == "--infra" ]]; then
  aws cloudformation deploy --region "$REGION" --stack-name "$STACK" \
    --template-file "$ROOT/infra/site.yml" --no-fail-on-empty-changeset
fi

out() {
  aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}
BUCKET="$(out BucketName)"
DIST_ID="$(out DistributionId)"

(cd "$ROOT" && pnpm build)

# Hashed assets: cache for a year. index.html and the rest: always revalidate.
aws s3 sync "$DIST/assets" "s3://$BUCKET/assets" --region "$REGION" --delete \
  --cache-control "public,max-age=31536000,immutable"
aws s3 sync "$DIST" "s3://$BUCKET" --region "$REGION" --delete --exclude "assets/*" \
  --cache-control "public,max-age=0,must-revalidate"

aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/index.html" "/" \
  --query 'Invalidation.Id' --output text >/dev/null

echo "Deployed: $(out SiteUrl)"
