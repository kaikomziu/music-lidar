// みんなでライブ: 人数が多いときに使う Daily.co(SFU)の部屋と参加トークンを発行する
// - APIキーは Supabase の Secret「DAILY_API_KEY」に置く(ブラウザには出さない)
// - MUSIC LiDAR にログインしている人だけ使える(p_token を確かめる)
// - 映像・音声は使わず、データ(app message)だけをやり取りする
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const API = 'https://api.daily.co/v1';
const ROOM_HOURS = 4; // 部屋の寿命(これを過ぎると自動で消える)
const MAX_PEOPLE = 20;

async function daily(path: string, body: unknown) {
  const res = await fetch(API + path, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + Deno.env.get('DAILY_API_KEY'), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error('DAILY ' + res.status + ' ' + (j?.info || j?.error || ''));
  return j;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'METHOD' }, 405);
  if (!Deno.env.get('DAILY_API_KEY')) return json({ error: 'NO_KEY' }, 503);
  let p: { token?: string; action?: string; room?: string };
  try { p = await req.json(); } catch { return json({ error: 'BAD' }, 400); }
  // ログイン確認
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  if (!/^[0-9a-f-]{36}$/i.test(p.token || '')) return json({ error: 'AUTH' }, 401);
  const { data: s } = await db.from('mlidar_sessions').select('account_id').eq('token', p.token).maybeSingle();
  if (!s) return json({ error: 'AUTH' }, 401);
  const { data: a } = await db.from('mlidar_accounts').select('name').eq('id', s.account_id).maybeSingle();
  const exp = Math.floor(Date.now() / 1000) + ROOM_HOURS * 3600;
  try {
    let room = p.room || '';
    if (p.action === 'create') {
      // 名前は推測できない文字列にする(部屋は private なので、トークンがないと入れない)
      room = 'ml-' + crypto.randomUUID().replace(/-/g, '').slice(0, 20);
      await daily('/rooms', {
        name: room, privacy: 'private',
        properties: { exp, max_participants: MAX_PEOPLE, eject_at_room_exp: true, start_video_off: true, start_audio_off: true, enable_chat: false, enable_prejoin_ui: false },
      });
    } else if (p.action !== 'join' || !/^ml-[a-z0-9]{20}$/.test(room)) return json({ error: 'BAD' }, 400);
    const t = await daily('/meeting-tokens', {
      properties: { room_name: room, exp, user_name: String(a?.name || 'guest').slice(0, 16), start_video_off: true, start_audio_off: true },
    });
    const domain = Deno.env.get('DAILY_DOMAIN'); // 例: yourname.daily.co(なければ部屋情報から取る)
    let url = domain ? `https://${domain}/${room}` : '';
    if (!url) {
      const r = await fetch(`${API}/rooms/${room}`, { headers: { Authorization: 'Bearer ' + Deno.env.get('DAILY_API_KEY') } }).then((x) => x.json());
      url = r.url;
    }
    return json({ room, url, token: t.token });
  } catch (e) {
    console.error(e);
    return json({ error: 'DAILY' }, 502);
  }
});
