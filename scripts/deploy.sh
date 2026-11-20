#!/usr/bin/env bash
# Build and deploy the SPA to S3 + CloudFront.
# Usage: AWS_PROFILE=admin-CanaryWharfSalon pnpm deploy:aws [--infra] [--mode <vite-mode>]
# Staging (its own stack, built with apps/web/.env.staging):
#   STACK_NAME=canary-wharf-salon-site-staging AWS_PROFILE=admin-CanaryWharfSalon pnpm deploy:aws --infra --mode staging
set -euo pipefail

STACK="${STACK_NAME:-canary-wharf-salon-site}"
REGION="${AWS_REGION:-eu-west-2}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/apps/web/dist"

INFRA=false
MODE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --infra) INFRA=true; shift ;;
    --mode) MODE="${2:?--mode needs a value}"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

"$ROOT/scripts/check-pushed.sh"

if [[ -n "$MODE" && ! -f "$ROOT/apps/web/.env.$MODE" ]]; then
  echo "Missing apps/web/.env.$MODE (see apps/web/.env.example)" >&2
  exit 1
fi

if [[ "$INFRA" == true ]]; then
  aws cloudformation deploy --region "$REGION" --stack-name "$STACK" \
    --template-file "$ROOT/infra/site.yml" --no-fail-on-empty-changeset
fi

out() {
  aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}
BUCKET="$(out BucketName)"
DIST_ID="$(out DistributionId)"

if [[ -n "$MODE" ]]; then
  (cd "$ROOT" && pnpm --filter web exec tsc -b && pnpm --filter web exec vite build --mode "$MODE")
else
  (cd "$ROOT" && pnpm build)
fi

# Hashed assets: cache for a year. index.html and the rest: always revalidate.
aws s3 sync "$DIST/assets" "s3://$BUCKET/assets" --region "$REGION" --delete \
  --cache-control "public,max-age=31536000,immutable"
aws s3 sync "$DIST" "s3://$BUCKET" --region "$REGION" --delete --exclude "assets/*" \
  --cache-control "public,max-age=0,must-revalidate"

aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/index.html" "/" \
  --query 'Invalidation.Id' --output text >/dev/null

echo "Deployed: $(out SiteUrl)"
