#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WITH_VERCEL=false
WITH_FEISHU=false
SKIP_GITHUB=false

usage() {
  cat <<'USAGE'
Usage:
  publish-site.sh [--with-vercel] [--with-feishu] [--skip-github]

Default:
  Publish the current committed main branch to GitHub Pages by pushing origin/main.

Optional backends:
  --with-vercel   Also run VERCEL_DEPLOY_CMD, defaulting to: npx vercel@latest --prod
  --with-feishu   Also run FEISHU_SITE_DEPLOY_CMD. No default is provided.
  --skip-github   Run only explicitly requested optional backends.
USAGE
}

run_cmd() {
  local name="$1"
  local cmd="$2"
  echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] [$name] $cmd"
  sh -lc "$cmd"
}

while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --with-vercel) WITH_VERCEL=true ;;
    --with-feishu) WITH_FEISHU=true ;;
    --skip-github) SKIP_GITHUB=true ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1"; usage; exit 2 ;;
  esac
  shift
done

cd "$PROJECT_DIR"

if ! $SKIP_GITHUB; then
  if [[ ! -d .git ]]; then
    echo "ERROR: GitHub Pages publish requires this directory to be a git repository." >&2
    exit 1
  fi
  branch="${GITHUB_PAGES_BRANCH:-main}"
  echo "GitHub Pages default publish: git push origin $branch"
  git push origin "$branch"
fi

if $WITH_VERCEL; then
  run_cmd "vercel" "${VERCEL_DEPLOY_CMD:-npx vercel@latest --prod}"
fi

if $WITH_FEISHU; then
  if [[ -z "${FEISHU_SITE_DEPLOY_CMD:-}" ]]; then
    echo "ERROR: FEISHU_SITE_DEPLOY_CMD is required for --with-feishu." >&2
    exit 1
  fi
  run_cmd "feishu" "$FEISHU_SITE_DEPLOY_CMD"
fi

echo "Done. Primary site: https://superqyl.github.io/mee-insight-hub/"
