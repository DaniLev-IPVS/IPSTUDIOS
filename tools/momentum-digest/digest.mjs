#!/usr/bin/env node
// Momentum 2 daily digest: Notion task board -> Telegram group.
// Groups open tasks by assignee, then Overdue / To do (today) / Up next (tomorrow).
// No dependencies; Node 18+.
//
// Env:
//   NOTION_TOKEN          Notion internal integration secret (board must be shared with it)
//   NOTION_DATABASE_ID    Momentum 2 database id
//   TELEGRAM_BOT_TOKEN    bot token (bot must be a member of the group)
//   TELEGRAM_CHAT_ID      group chat id, e.g. -1001234567890
// Optional:
//   ASSIGNEE_PROP / DUE_PROP / STATUS_PROP   force property names (auto-detected otherwise)
//   DONE_STATUSES         comma list of extra status names treated as finished
//   TZ_NAME               default America/New_York
//   SEND_HOUR             only send when local hour equals this (default 8). FORCE=1 skips the check.
//   DRY_RUN=1             print the message instead of sending
//   NAME_MAP              JSON {"<notion user id or email>": "Display name"} for people Notion can't name
//   STATE_FILE            if set, send at most once per local day, any time from SEND_HOUR until
//                         SEND_WINDOW_END (default 12) — for machines that may be asleep at 8:00

const env = process.env;
const TZ = env.TZ_NAME || 'America/New_York';
const SEND_HOUR = Number(env.SEND_HOUR ?? 8);
const DRY = env.DRY_RUN === '1';
const UNASSIGNED = 'To be assigned';
// {"Display name": "telegram_username"}: tagged next to the name so the person gets a notification
const HANDLES = JSON.parse(env.HANDLES || '{}');
const NAME_MAP = JSON.parse(env.NAME_MAP || '{}');

function need(k) {
  if (!env[k]) { console.error(`Missing env ${k}`); process.exit(1); }
  return env[k];
}

// ---- dates in the team's timezone ----
function localParts(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(d).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) };
}
function addDays(ymd, n) {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function pretty(ymd) {
  return new Date(`${ymd}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' });
}
// Notion date start may be a date or a datetime with offset; reduce to the local calendar day.
function toLocalDay(start) {
  if (!start) return null;
  if (start.length === 10) return start;
  return localParts(new Date(start)).date;
}

// ---- Notion ----
const NOTION_VERSION = '2022-06-28';
async function notion(path, body) {
  const res = await fetch(`https://api.notion.com/v1/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${need('NOTION_TOKEN')}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Notion ${path}: ${res.status} ${json.message || ''}`);
  return json;
}

function pickProp(props, override, types, nameHints) {
  if (override) {
    if (!props[override]) throw new Error(`Property "${override}" not found. Have: ${Object.keys(props).join(', ')}`);
    return override;
  }
  const cands = Object.entries(props).filter(([, v]) => types.includes(v.type));
  const hinted = cands.find(([k]) => nameHints.some(h => k.toLowerCase().includes(h)));
  return (hinted || cands[0] || [])[0];
}

async function loadTasks(today, tomorrow) {
  const dbId = need('NOTION_DATABASE_ID');
  const db = await notion(`databases/${dbId}`);
  const props = db.properties;

  const titleProp = Object.keys(props).find(k => props[k].type === 'title');
  const assigneeProp = pickProp(props, env.ASSIGNEE_PROP, ['people'], ['assign', 'owner', 'person', 'who']);
  const dueProp = pickProp(props, env.DUE_PROP, ['date'], ['due', 'deadline', 'date']);
  const statusProp = pickProp(props, env.STATUS_PROP, ['status', 'select', 'checkbox'], ['status', 'state', 'done', 'complete']);
  if (!dueProp) throw new Error('No date property found on the board');

  // Which status values count as finished
  const done = new Set((env.DONE_STATUSES || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean));
  const sp = statusProp && props[statusProp];
  if (sp?.type === 'status') {
    const completeGroup = sp.status.groups.find(g => /complete|done/i.test(g.name));
    const ids = new Set(completeGroup?.option_ids || []);
    sp.status.options.filter(o => ids.has(o.id)).forEach(o => done.add(o.name.toLowerCase()));
  }
  ['done', 'complete', 'completed', 'cancelled', 'canceled', 'archived'].forEach(s => done.add(s));

  const meta = { titleProp, assigneeProp, dueProp, statusProp, statusType: sp?.type };
  console.error('Using properties:', JSON.stringify(meta));

  const tasks = [];
  let cursor;
  do {
    const page = await notion(`databases/${dbId}/query`, {
      filter: { property: dueProp, date: { on_or_before: tomorrow } },
      page_size: 100,
      start_cursor: cursor,
    });
    for (const r of page.results) {
      const p = r.properties;
      const title = (p[titleProp]?.title || []).map(t => t.plain_text).join('').trim() || 'Untitled';
      const day = toLocalDay(p[dueProp]?.date?.start);
      if (!day || day > tomorrow) continue;

      let finished = false;
      if (statusProp) {
        const s = p[statusProp];
        if (s.type === 'checkbox') finished = s.checkbox;
        else finished = done.has((s[s.type]?.name || '').toLowerCase());
      }
      if (finished) continue;

      const people = (assigneeProp && p[assigneeProp]?.people) || [];
      const names = people.map(u =>
        NAME_MAP[u.id] || NAME_MAP[u.person?.email] ||
        (u.name && !u.name.includes('@') ? u.name : null) ||
        (u.person?.email ? u.person.email.split('@')[0].replace(/^./, c => c.toUpperCase()) : null) ||
        `Unknown (${u.id.slice(0, 8)})`);
      const bucket = day < today ? 'overdue' : day === today ? 'today' : 'next';
      tasks.push({ title, day, bucket, url: r.url, names: names.length ? [...new Set(names)] : [UNASSIGNED] });
    }
    cursor = page.has_more ? page.next_cursor : undefined;
  } while (cursor);
  return tasks;
}

// ---- message ----
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function buildBlocks(tasks, today) {
  const byPerson = new Map();
  for (const t of tasks) for (const n of t.names) {
    if (!byPerson.has(n)) byPerson.set(n, { overdue: [], today: [], next: [] });
    byPerson.get(n)[t.bucket].push(t);
  }
  const people = [...byPerson.keys()].sort((a, b) =>
    a === UNASSIGNED ? 1 : b === UNASSIGNED ? -1 : a.localeCompare(b));

  const line = (t, showDate) =>
    `  • <a href="${t.url}">${esc(t.title)}</a>${showDate ? ` <i>(due ${pretty(t.day)})</i>` : ''}`;
  const section = (label, list, showDate) =>
    list.length ? [label, ...list.sort((a, b) => a.day.localeCompare(b.day)).map(t => line(t, showDate))] : [];

  return people.map(n => {
    const b = byPerson.get(n);
    return [
      `👤 <b>${esc(n)}</b>${HANDLES[n] ? ' @' + HANDLES[n].replace(/^@/, '') : ''}`,
      ...section('🔴 <b>Overdue</b>', b.overdue, true),
      ...section('🟡 <b>To do</b> (today)', b.today, false),
      ...section('🔵 <b>Up next</b> (tomorrow)', b.next, false),
    ].join('\n');
  });
}

// One Telegram message per person. The header rides on top of the first person's message.
// A person whose list is longer than Telegram's limit is split by lines, still on their own.
// Telegram's 4096 limit counts visible text, not HTML tags or link URLs.
const visibleLen = s => s.replace(/<[^>]+>/g, '').replace(/&(amp|lt|gt);/g, 'x').length;
function chunk(header, blocks, limit = 4000) {
  if (!blocks.length) return [header];
  const out = [];
  blocks.forEach((block, i) => {
    let cur = i === 0 ? header + '\n\n' : '';
    for (const line of block.split('\n')) {
      if (cur && visibleLen(cur + line) > limit) { out.push(cur.trimEnd()); cur = ''; }
      cur += line + '\n';
    }
    out.push(cur.trimEnd());
  });
  return out;
}

async function sendTelegram(text) {
  const res = await fetch(`https://api.telegram.org/bot${need('TELEGRAM_BOT_TOKEN')}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: need('TELEGRAM_CHAT_ID'), text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(`Telegram: ${json.description}`);
}

// ---- main ----
import { readFileSync, writeFileSync } from 'node:fs';
const now = localParts();
const STATE = env.STATE_FILE;
if (env.FORCE !== '1' && !DRY) {
  if (STATE) {
    let last = ''; try { last = readFileSync(STATE, 'utf8').trim(); } catch {}
    const end = Number(env.SEND_WINDOW_END ?? 12);
    if (last === now.date || now.hour < SEND_HOUR || now.hour >= end) process.exit(0);
  } else if (now.hour !== SEND_HOUR) {
    console.error(`Local hour in ${TZ} is ${now.hour}, not ${SEND_HOUR}; skipping.`);
    process.exit(0);
  }
}
const today = now.date;
const tomorrow = addDays(today, 1);

const tasks = await loadTasks(today, tomorrow);
const header = `☀️ <b>Momentum — ${pretty(today)}</b>\n` +
  (tasks.length ? `${tasks.length} open task${tasks.length === 1 ? '' : 's'} due through tomorrow.` : 'Nothing overdue, due today, or due tomorrow. 🎉');
const messages = chunk(header, buildBlocks(tasks, today));

for (const m of messages) {
  if (DRY) console.log(m + '\n-----');
  else await sendTelegram(m);
}
if (!DRY && STATE) writeFileSync(STATE, today);
console.error(DRY ? 'Dry run done.' : `${new Date().toISOString()} Sent ${messages.length} message(s).`);
