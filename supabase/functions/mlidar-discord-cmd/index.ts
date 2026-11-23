// 公式Discordの「MUSIC LiDAR bot」のスラッシュコマンド(Discord の Interactions Endpoint。1.87.x〜)
// - Discord からのリクエストは、アプリの公開鍵(Ed25519)で署名を確かめてから答える(公開鍵は Discord の API から取って覚える)
// - コマンド: /help /me /profile /ranking /song(公式サーバーだけに登録する)
// - 準備(コマンドの登録と Interactions Endpoint URL の設定): ヘッダー x-mlidar-cron(Vault の mlidar_discord_cron)を付けて
//   POST {"action":"setup"}。SQL から net.http_post で呼ぶ(秘密の値を外に出さないため)。コマンドを変えたらもう一度
// - ボットのトークンは Vault の mlidar_discord_bot_token(mlidar_discord_config で受け取る)
import { createClient } from 'jsr:@supabase/supabase-js@2';

const GUILD = '1573657919239622786';
const API = 'https://discord.com/api/v10';
const SITE = 'https://music-lidar.com/';
const SELF = 'https://kifnzvktwbomxthzvvgy.supabase.co/functions/v1/mlidar-discord-cmd';
const COLOR = 0x5ef2ff;
const DIFFS = ['easy', 'normal', 'hard', 'extra', 'inferno'];
const DIFF_COLOR: Record<string, number> = { easy: 0x6dffb0, normal: 0xffd25e, hard: 0xff5a8a, extra: 0xc06bff, inferno: 0xff7a45 };
const TITLES: [number, string][] = [[0, 'ルーキー'], [2, 'ブロンズ'], [4, 'シルバー'], [6, 'ゴールド'], [8, 'プラチナ'], [10, 'ダイヤ'], [12, 'マスター'], [14, 'グランドマスター'], [16, 'レジェンド']];
const DAN = ['', '初段', '二段', '三段', '四段', '五段', '六段', '七段', '八段', '九段', '十段', '皆伝'];

// 公式サーバーに登録するコマンド
const COMMANDS = [
  { name: 'help', description: 'MUSIC LiDAR bot のコマンドの一覧' },
  { name: 'me', description: '自分の記録を見る(ゲームのプロフィールの「Discordで認証」をした人)' },
  { name: 'profile', description: 'プレイヤーの記録を見る', options: [{ type: 3, name: 'name', description: 'ゲームでの名前', required: true }] },
  {
    name: 'ranking', description: '曲のランキング(上位10人)', options: [
      { type: 3, name: 'song', description: '曲名(打つと候補が出ます)', required: true, autocomplete: true },
      { type: 3, name: 'diff', description: '難易度(省略すると HARD)', required: false, choices: DIFFS.map((d) => ({ name: d.toUpperCase(), value: d })) },
    ],
  },
  { name: 'song', description: 'おすすめの曲をランダムに1曲', options: [{ type: 3, name: 'genre', description: 'ジャンルで絞る(例: JAZZ・ROCK)', required: false }] },
];

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
let cfgCache: { token: string; cron: string } | null = null;
let keyCache: CryptoKey | null = null;
let appId = '';
const cfg = async () => (cfgCache ||= (await db.rpc('mlidar_discord_config')).data);
const dc = async (method: string, path: string, body?: unknown) => {
  const c = await cfg();
  return fetch(API + path, { method, headers: { Authorization: 'Bot ' + c.token, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
};
const hex = (s: string) => new Uint8Array(s.match(/../g)!.map((h) => parseInt(h, 16)));
async function appInfo() {
  if (appId && keyCache) return;
  const r = await dc('GET', '/applications/@me');
  const j = await r.json();
  appId = j.id;
  keyCache = await crypto.subtle.importKey('raw', hex(j.verify_key), { name: 'Ed25519' }, false, ['verify']);
}
async function verified(req: Request, body: string) {
  const sig = req.headers.get('x-signature-ed25519'), ts = req.headers.get('x-signature-timestamp');
  if (!sig || !ts || !/^[0-9a-f]{128}$/i.test(sig)) return false;
  await appInfo();
  return crypto.subtle.verify('Ed25519', keyCache!, hex(sig), new TextEncoder().encode(ts + body));
}

// 曲の一覧(サイトの data/cards.json。10分覚える)
type Card = { i: string; u: string; t: string; a: string; g: string; b: number; c: string; l: number[] };
let cards: Card[] = [], cardsAt = 0;
async function songs() {
  if (!cards.length || Date.now() - cardsAt > 600e3) {
    const r = await fetch(SITE + 'data/cards.json');
    if (r.ok) { cards = await r.json(); cardsAt = Date.now(); }
  }
  return cards;
}
const norm = (s: string) => s.normalize('NFKC').toLowerCase().replace(/\s+/g, '');
const findSong = (list: Card[], q: string) => list.find((c) => c.i === q) || list.find((c) => norm(c.t) === norm(q)) || list.find((c) => norm(c.t).includes(norm(q)));
const md = (s: string) => String(s ?? '').replace(/[\\*_`~|>]/g, '\\$&');
const titleOf = (rate: number) => { let t = TITLES[0][1]; for (const [at, n] of TITLES) if (rate >= at) t = n; return t; };
const reply = (data: Record<string, unknown>) => Response.json({ type: 4, data: { allowed_mentions: { parse: [] }, ...data } });
const ephemeral = (content: string) => reply({ content, flags: 64 });

// プロフィールの埋め込み
async function profileEmbed(name: string) {
  const { data: p } = await db.rpc('mlidar_profile', { p_name: name });
  if (!p) return null;
  const st = p.stats || {}, rate = Number(p.rate || 0);
  const best = Object.entries(p.best || {}) as [string, { fc?: boolean; ap?: boolean; score?: number }][];
  const infFc = best.filter(([k, b]) => k.endsWith('/inferno') && b.fc).length;
  const fields = [
    { name: '称号・レート', value: `${titleOf(rate)} **${rate.toFixed(2)}**`, inline: true },
    { name: 'プレイ回数', value: `${(st.plays || 0).toLocaleString()} 回`, inline: true },
    { name: '記録した譜面', value: `${best.length} 譜面`, inline: true },
    { name: 'フルコンボ', value: `${best.filter(([, b]) => b.fc).length} 譜面`, inline: true },
    { name: 'ALL PERFECT', value: `${best.filter(([, b]) => b.ap).length} 譜面`, inline: true },
    { name: '最大コンボ', value: `${(st.max_combo || 0).toLocaleString()}`, inline: true },
  ];
  if (st.dan) fields.push({ name: '段位', value: DAN[st.dan] || String(st.dan), inline: true });
  if (p.streak?.best) fields.push({ name: '連続プレイ', value: `最高 ${p.streak.best} 日`, inline: true });
  if (infFc) fields.push({ name: 'INFERNO フルコンボ', value: `${infFc} 譜面`, inline: true });
  return { title: md(p.name), url: SITE, color: COLOR, fields, footer: { text: `${p.since} からプレイ ・ MUSIC LiDAR` } };
}

async function command(it: any) {
  const name = it.data.name, opt = (k: string) => it.data.options?.find((o: any) => o.name === k)?.value;
  const uid = it.member?.user?.id || it.user?.id;
  if (name === 'help') {
    return reply({
      embeds: [{
        title: 'MUSIC LiDAR bot', color: COLOR, url: SITE,
        description: [
          '`/me` 自分の記録(ゲームのプロフィールの「Discordで認証」をした人)',
          '`/profile 名前` プレイヤーの記録',
          '`/ranking 曲 難易度` 曲のランキング(上位10人)',
          '`/song ジャンル` おすすめの曲をランダムに1曲',
          '',
          '認証は「✅｜認証」チャンネルにコードを貼ってください。ブラウザで遊べる無料の4キー音ゲー → ' + SITE,
        ].join('\n'),
      }],
    });
  }
  if (name === 'me') {
    const { data: link } = await db.from('mlidar_discord_links').select('account_id').eq('discord_id', uid).maybeSingle();
    if (!link) return ephemeral('まだゲームのアカウントとつながっていません。ゲームのプロフィールの「Discordで認証」でコードを出し、「✅｜認証」チャンネルに貼ってください');
    const { data: a } = await db.from('mlidar_accounts').select('name').eq('id', link.account_id).maybeSingle();
    const e = a && await profileEmbed(a.name);
    return e ? reply({ embeds: [e] }) : ephemeral('記録が見つかりませんでした');
  }
  if (name === 'profile') {
    const e = await profileEmbed(String(opt('name') || ''));
    return e ? reply({ embeds: [e] }) : ephemeral('その名前のプレイヤーは見つかりませんでした(ログインして遊んでいる人だけ出せます)');
  }
  if (name === 'ranking') {
    const c = findSong(await songs(), String(opt('song') || ''));
    if (!c) return ephemeral('曲が見つかりませんでした。曲名を打つと候補が出ます');
    const d = String(opt('diff') || 'hard');
    const { data: rows } = await db.from('mlidar_scores').select('name, score, fc, ap').eq('song', c.i).eq('diff', d).order('score', { ascending: false }).limit(10);
    const medal = ['🥇', '🥈', '🥉'];
    const lines = (rows || []).map((r: any, i: number) => `${medal[i] || `**${i + 1}.**`} ${md(r.name)} — ${Number(r.score).toLocaleString()}${r.ap ? ' 💎AP' : r.fc ? ' ⭐FC' : ''}`);
    return reply({
      embeds: [{
        title: `${md(c.t)} ・ ${d.toUpperCase()}`, url: `${SITE}music/${c.u}/`, color: DIFF_COLOR[d] || COLOR,
        description: lines.length ? lines.join('\n') : 'まだ記録がありません。1位を取るチャンスです!',
        footer: { text: `${c.g} ・ BPM ${Math.round(c.b)}` },
      }],
    });
  }
  if (name === 'song') {
    const g = norm(String(opt('genre') || ''));
    const list = (await songs()).filter((c) => !g || norm(c.g).includes(g));
    if (!list.length) return ephemeral('そのジャンルの曲は見つかりませんでした');
    const c = list[Math.floor(Math.random() * list.length)];
    return reply({
      embeds: [{
        title: `🎵 ${md(c.t)}`, url: `${SITE}music/${c.u}/`, color: parseInt(c.c.slice(1), 16) || COLOR,
        description: `${md(c.g)} ・ BPM ${Math.round(c.b)}${c.a ? ` ・ ${md(c.a)}` : ''}\nEASY ${c.l[0]} / NORMAL ${c.l[1]} / HARD ${c.l[2]}`,
        footer: { text: 'リンクから、ブラウザですぐ遊べます' },
      }],
    });
  }
  return ephemeral('知らないコマンドです');
}

async function autocomplete(it: any) {
  const q = norm(String(it.data.options?.find((o: any) => o.focused)?.value || ''));
  const list = (await songs()).filter((c) => !q || norm(c.t).includes(q) || norm(c.g).includes(q)).slice(0, 25);
  return Response.json({ type: 8, data: { choices: list.map((c) => ({ name: c.t.slice(0, 100), value: c.i })) } });
}

// 準備: コマンドを公式サーバーに登録し、Interactions Endpoint URL をこの関数にする
async function setup() {
  await appInfo();
  const r1 = await dc('PUT', `/applications/${appId}/guilds/${GUILD}/commands`, COMMANDS);
  const r2 = await dc('PATCH', '/applications/@me', { interactions_endpoint_url: SELF });
  return Response.json({ commands: r1.status, endpoint: r2.status, detail: r2.ok ? undefined : await r2.text() });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('MUSIC LiDAR bot');
  const body = await req.text();
  // 準備(SQL から呼ぶ)
  const c = await cfg();
  if (req.headers.get('x-mlidar-cron')) {
    if (!c?.cron || req.headers.get('x-mlidar-cron') !== c.cron) return new Response('NO', { status: 403 });
    const j = JSON.parse(body || '{}');
    if (j.action === 'setup') return setup();
    return new Response('?', { status: 400 });
  }
  if (!(await verified(req, body))) return new Response('bad signature', { status: 401 });
  const it = JSON.parse(body);
  try {
    if (it.type === 1) return Response.json({ type: 1 }); // PING
    if (it.type === 2) return await command(it);
    if (it.type === 4) return await autocomplete(it);
  } catch (e) {
    console.error(e);
    return ephemeral('うまく処理できませんでした。少しあとでもう一度試してください');
  }
  return new Response('?', { status: 400 });
});
