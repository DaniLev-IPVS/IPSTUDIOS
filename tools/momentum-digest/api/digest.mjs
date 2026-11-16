// Vercel function for the Momentum daily digest.
// Vercel Cron calls it at 12:00 and 13:00 UTC; the digest only sends in the slot where
// New York time is 8 AM, which covers both EDT and EST.
// Manual: ?dry=1 returns the message without posting, ?force=1 posts now. Both need the CRON_SECRET bearer.
// Everything lives in Vercel env (this repo is public): NOTION_TOKEN, TELEGRAM_BOT_TOKEN, CRON_SECRET,
// NOTION_DATABASE_ID, TELEGRAM_CHAT_ID, NAME_MAP and HANDLES (the JSON of names.json / handles.json).
const defaults = {
  ASSIGNEE_PROP: 'Assignee',
  DUE_PROP: 'Due Date',
  STATUS_PROP: 'Status',
  DONE_STATUSES: 'Paused,Done,Canceled,Cancelled,Blocked',
};
for (const [k, v] of Object.entries(defaults)) process.env[k] ??= v;
const { run } = await import('../digest.mjs');

export async function GET(request) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  const q = new URL(request.url).searchParams;
  const dry = q.get('dry') === '1';
  const force = q.get('force') === '1';
  try {
    const r = await run({ dry, force });
    console.log(JSON.stringify({ skipped: r.skipped, sent: r.sent, tasks: r.tasks }));
    return Response.json(dry ? r : { skipped: r.skipped, sent: r.sent, tasks: r.tasks });
  } catch (e) {
    console.error('digest failed:', e);
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}
