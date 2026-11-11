# Momentum daily digest

Every morning at 8:00 AM New York time, posts open tasks from the Momentum initiatives tracker in Notion to the team's Telegram group.

- One Telegram message per person, starting with their name and @handle so they get a notification.
- Each person's tasks are split into 🔴 **Overdue**, 🟡 **To do** (due today) and 🔵 **Up next** (due tomorrow).
- Tasks marked Paused, Done, Canceled or Blocked are left out.
- Tasks with no assignee go under **To be assigned**, at the end.

## Setup

1. The repo's `.env.local` needs `TELEGRAM_BOT_KEY` (the bot must be in the group) and `NOTION_CONNECTOR_TOKEN` (the integration must be connected to the board).
2. Copy the example files and fill them in. The copies are git-ignored because this repo is public.
   - `.env.example` → `.env`: the Notion database id and the Telegram chat id.
   - `names.example.json` → `names.json`: Notion user id → display name. Give one person's duplicate accounts the same name to merge them.
   - `handles.example.json` → `handles.json`: display name → Telegram username.
3. Dry run, which prints instead of posting: `DRY_RUN=1 ./run.sh`
4. Send now: `FORCE=1 ./run.sh`
5. Schedule it: `./install.sh` sets up a macOS LaunchAgent. It checks every 15 minutes and posts once a day, the first time it runs between 8:00 and 12:00 ET.
