#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

DEFAULT_VERCEL_CMD='vercel --prod'

usage() {
  cat <<'USAGE'
Usage:
  publish-dual.sh [--vercel] [--edgeone]

Description:
  发布脚本：默认主链路 + 国内镜像。支持 --vercel / --edgeone 单独发布。

Examples:
  ./scripts/publish-dual.sh                 # 默认同时发布 Vercel + EdgeOne
  ./scripts/publish-dual.sh --vercel         # 仅 Vercel
  ./scripts/publish-dual.sh --edgeone        # 仅 EdgeOne
USAGE
}

run_with_cmd() {
  local name="$1"
  local cmd="$2"
  local ts

  ts="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
  echo "[$ts] [$name] start: $cmd"

  if ! sh -lc "$cmd"; then
    echo "[$name] publish failed. check logs above."
    return 1
  fi

  echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] [$name] done."
}

has_target=false
deploy_vercel=false
deploy_edgeone=false

while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --vercel)
      deploy_vercel=true
      has_target=true
      ;;
    --edgeone)
      deploy_edgeone=true
      has_target=true
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown arg: $1"
      usage
      exit 2
      ;;
  esac
  shift
done

if ! $has_target; then
  deploy_vercel=true
  deploy_edgeone=true
fi

cd "$PROJECT_DIR"

START_TIME="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
echo "Release start at: $START_TIME"

if $deploy_vercel; then
  vercel_cmd="${VERCEL_DEPLOY_CMD:-$DEFAULT_VERCEL_CMD}"
  run_with_cmd "vercel" "$vercel_cmd"
fi

if $deploy_edgeone; then
  if [[ -z "${EDGEONE_DEPLOY_CMD:-}" ]]; then
    cat <<'MSG'
ERROR: Environment variable EDGEONE_DEPLOY_CMD is required for EdgeOne deploy.
Example:
  EDGEONE_DEPLOY_CMD='edgeone pages deploy . --project-id "$EDGEONE_PROJECT_ID" --token "$EDGEONE_TOKEN"'
MSG
    exit 1
  fi
  run_with_cmd "edgeone" "$EDGEONE_DEPLOY_CMD"
fi

END_TIME="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
echo "Release end at: $END_TIME"

echo "Release window: $START_TIME -> $END_TIME"

if [[ -n "${VERCEL_PRIMARY_URL:-}" || -n "${EDGEONE_MIRROR_URL:-}" ]]; then
  echo
  echo "Post-release check list:"
  [[ -n "${VERCEL_PRIMARY_URL:-}" ]] && echo "- Vercel:  $VERCEL_PRIMARY_URL"
  [[ -n "${EDGEONE_MIRROR_URL:-}" ]] && echo "- EdgeOne: $EDGEONE_MIRROR_URL"
  echo
  echo "Run with:"
  [[ -n "${VERCEL_PRIMARY_URL:-}" ]] && echo "  curl -I \"$VERCEL_PRIMARY_URL\""
  [[ -n "${EDGEONE_MIRROR_URL:-}" ]] && echo "  curl -I \"$EDGEONE_MIRROR_URL\""
fi

echo "Done."
