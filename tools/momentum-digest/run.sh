#!/bin/bash
# Runs the digest with keys from the repo's .env.local and settings from ./.env,
# ./names.json and ./handles.json (all git-ignored). Extra env passes through (DRY_RUN=1, FORCE=1).
DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_ENV="$DIR/../../.env.local"
get(){ grep -E "^$1=" "$2" 2>/dev/null | head -1 | cut -d= -f2- | sed -E "s/^[\"']//; s/[\"']$//"; }
export TELEGRAM_BOT_TOKEN="$(get TELEGRAM_BOT_KEY "$ROOT_ENV")"
export NOTION_TOKEN="$(get NOTION_CONNECTOR_TOKEN "$ROOT_ENV")"
export NOTION_DATABASE_ID="$(get NOTION_DATABASE_ID "$DIR/.env")"
export TELEGRAM_CHAT_ID="$(get TELEGRAM_CHAT_ID "$DIR/.env")"
export ASSIGNEE_PROP=Assignee DUE_PROP="Due Date" STATUS_PROP=Status
export DONE_STATUSES="Paused,Done,Canceled,Cancelled,Blocked"
export HANDLES="$(cat "$DIR/handles.json" 2>/dev/null || echo '{}')"
export NAME_MAP="$(cat "$DIR/names.json" 2>/dev/null || echo '{}')"
export STATE_FILE="$DIR/.last-sent"
exec "$(command -v node || echo /opt/homebrew/bin/node)" "$DIR/digest.mjs"
