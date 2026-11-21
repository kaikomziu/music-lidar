// 公式Discordの「✅｜認証」チャンネルを見て、ゲームのアカウントとつなぐ(◎500 と「✅ 認証済み」ロールを渡す)
// - pg_cron(ジョブ mlidar-discord-verify)が1分ごとに呼ぶ。ヘッダー x-mlidar-cron が Vault の mlidar_discord_cron と同じときだけ動く
// - 前回の続き(mlidar_discord_state の last)からメッセージを読み、6文字のコードを mlidar_discord_redeem に渡す
// - 返事をして、貼られたメッセージは消す。ボットの返事は10分たったら消す(ピン留めは残す)
// - ボットのトークンは Vault の mlidar_discord_bot_token(mlidar_discord_config で受け取る)
import { createClient } from 'jsr:@supabase/supabase-js@2';

const GUILD = '1573657919239622786';
const CHANNEL = '1573672597730893904';
const ROLE = '1573672593334993037';
const BOT = '1573655817134276608';
const API = 'https://discord.com/api/v10';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const ERRORS: Record<string, string> = {
  CODE: 'コードが違うか、期限(15分)が切れています。プロフィールの「Discordで認証」でもう一度コードを出してください',
  DISCORD_USED: 'この Discord アカウントは、もう別のゲームアカウントとつながっています(1人1回です)',
  ACCOUNT_USED: 'そのゲームアカウントは、もう認証済みです',
};

Deno.serve(async (req) => {
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: cfg } = await db.rpc('mlidar_discord_config');
  if (!cfg?.token || !cfg?.cron || req.headers.get('x-mlidar-cron') !== cfg.cron) return new Response('NO', { status: 403 });

  const headers = { Authorization: 'Bot ' + cfg.token, 'Content-Type': 'application/json' };
  // Discord の API(レート制限なら待ってやり直す)
  const dc = async (method: string, path: string, body?: unknown) => {
    for (let i = 0; i < 3; i++) {
      const r = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
      if (r.status === 429) { const j = await r.json().catch(() => ({})); await sleep(((j as { retry_after?: number }).retry_after || 1) * 1000 + 100); continue; }
      return r;
    }
    return null;
  };
  const say = (uid: string, text: string) => dc('POST', `/channels/${CHANNEL}/messages`, { content: `<@${uid}> ${text}`, allowed_mentions: { users: [uid] } });

  // 新しいメッセージ(古い順)
  const { data: st } = await db.from('mlidar_discord_state').select('v').eq('k', 'last').maybeSingle();
  let last: string | null = st?.v ?? null;
  const r = await dc('GET', `/channels/${CHANNEL}/messages?limit=50` + (last ? `&after=${last}` : ''));
  const list = r?.ok ? await r.json() : [];
  if (!Array.isArray(list)) return new Response('BAD', { status: 500 });
  list.sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1));

  let done = 0;
  for (const m of list) {
    last = m.id;
    if (m.author?.bot || (m.type !== 0 && m.type !== 19)) continue;
    const uid = m.author.id;
    const words = String(m.content || '').normalize('NFKC').toUpperCase().replace(/[^A-Z0-9]/g, ' ').split(/\s+/);
    const code = words.find((w) => w.length === 6);
    let text: string;
    if (!code) {
      text = 'コードが見つかりませんでした。ゲームのプロフィールの「Discordで認証」に出る6文字のコードを、そのまま貼ってください';
    } else {
      const { data: res, error } = await db.rpc('mlidar_discord_redeem', { p_code: code, p_discord_id: uid, p_name: m.author.global_name || m.author.username });
      if (error) { console.error(error); text = 'うまく処理できませんでした。少しあとでもう一度試してください'; }
      else if (res?.ok) {
        await dc('PUT', `/guilds/${GUILD}/members/${uid}/roles/${ROLE}`);
        const name = String(res.account || '').replace(/[\\*_`~|>]/g, '\\$&'); // 名前の記号で文字の飾りが崩れないように
        text = `✅ 認証できました! **${name}** さんのアカウントに **◎500** を送りました。ゲームの画面を読み直すと反映されます`;
      } else text = ERRORS[res?.error] || 'うまく処理できませんでした';
    }
    await say(uid, text);
    await dc('DELETE', `/channels/${CHANNEL}/messages/${m.id}`); // コードを残さない
    done++;
  }
  if (last && last !== st?.v) await db.from('mlidar_discord_state').upsert({ k: 'last', v: last });

  // ボットの返事・ピン留めのお知らせは10分で消す
  const r2 = await dc('GET', `/channels/${CHANNEL}/messages?limit=50`);
  const recent = r2?.ok ? await r2.json() : [];
  for (const m of Array.isArray(recent) ? recent : []) {
    if (m.author?.id === BOT && !m.pinned && Date.now() - Date.parse(m.timestamp) > 10 * 60e3) await dc('DELETE', `/channels/${CHANNEL}/messages/${m.id}`);
  }
  return new Response(JSON.stringify({ ok: true, done }), { headers: { 'Content-Type': 'application/json' } });
});
