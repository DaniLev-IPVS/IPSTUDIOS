# Momentum daily digest

Every morning at 8:00 AM New York time, Vercel posts open tasks from the Momentum initiatives tracker in Notion to the team's Telegram group.

- One Telegram message per person, starting with their name and @handle so they get a notification.
- Each person's tasks are split into 🔴 **Overdue**, 🟡 **To do** (due today) and 🔵 **Up next** (due tomorrow).
- Tasks marked Paused, Done, Canceled or Blocked are left out.
- Tasks with no assignee go under **To be assigned**, at the end.

## Where it runs

On Vercel: project `ip-ventures/momentum-digest`, https://momentum-digest.vercel.app, deployed from this folder. Vercel Cron (`vercel.json`) calls `api/digest.mjs` at 12:00 and 13:00 UTC, and the digest only sends in the slot that is 8 AM in New York. Each slot has its own path, because Vercel keeps only one schedule per path.

Because this repo is public, all settings are in Vercel env, not in git: `NOTION_TOKEN`, `TELEGRAM_BOT_TOKEN`, `CRON_SECRET`, `NOTION_DATABASE_ID`, `TELEGRAM_CHAT_ID`, plus `NAME_MAP` and `HANDLES` (the contents of `names.json` and `handles.json`). If you change the team list, update those two variables and redeploy.

Manual runs need the cron secret:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" "https://momentum-digest.vercel.app/api/digest?dry=1"
```

`?dry=1` returns the message without posting. `?force=1` posts now. To deploy, run `vercel deploy --prod --scope ip-ventures` from this folder.

Don't also run the Mac LaunchAgent (`install.sh`) while Vercel is on, or the group gets two posts a day.

## Running it locally


1. The repo's `.env.local` needs `TELEGRAM_BOT_KEY` (the bot must be in the group) and `NOTION_CONNECTOR_TOKEN` (the integration must be connected to the board).
2. Copy the example files and fill them in. The copies are git-ignored because this repo is public.
   - `.env.example` → `.env`: the Notion database id and the Telegram chat id.
   - `names.example.json` → `names.json`: Notion user id → display name. Give one person's duplicate accounts the same name to merge them.
   - `handles.example.json` → `handles.json`: display name → Telegram username.
3. Dry run, which prints instead of posting: `DRY_RUN=1 ./run.sh`
4. Send now: `FORCE=1 ./run.sh`
5. Mac schedule (only if Vercel is off): `./install.sh` sets up a macOS LaunchAgent. It checks every 15 minutes and posts once a day, the first time it runs between 8:00 and 12:00 ET.
