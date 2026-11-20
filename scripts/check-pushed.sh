#!/usr/bin/env bash
# Refuses to deploy unless the working tree is clean and every commit is pushed to its upstream,
# so what's deployed always matches what's on GitHub. Emergency override: ALLOW_DIRTY=1.
set -euo pipefail

if [[ "${ALLOW_DIRTY:-0}" == "1" ]]; then
  echo "⚠️  ALLOW_DIRTY=1 set: skipping the clean-and-pushed check."
  exit 0
fi

cd "$(git rev-parse --show-toplevel)"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "❌ Refusing to deploy: working tree has uncommitted changes."
  git status --short
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
UPSTREAM="$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || true)"
if [[ -z "$UPSTREAM" ]]; then
  echo "❌ Refusing to deploy: branch '$BRANCH' has no upstream. Push it first (git push -u origin $BRANCH)."
  exit 1
fi

git fetch --quiet origin "${UPSTREAM#*/}" || { echo "❌ Couldn't reach origin to confirm the push."; exit 1; }
AHEAD="$(git rev-list --count "${UPSTREAM}..HEAD")"
if [[ "$AHEAD" -gt 0 ]]; then
  echo "❌ Refusing to deploy: '$BRANCH' is $AHEAD commit(s) ahead of $UPSTREAM. Push first."
  exit 1
fi

echo "✅ Clean and pushed ($BRANCH @ $(git rev-parse --short HEAD))."
