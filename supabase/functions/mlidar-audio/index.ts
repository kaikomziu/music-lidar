// 譜面メーカー: 管理者が自分で選んだ音声を置く
// - 音声はブラウザで AES-GCM により暗号化してから送る(ここにも storage にも、暗号化前の音声は届かない)
// - action 'begin': 曲の情報と鍵を mlidar_audio に入れ、storage(mlidar-audio/<id>.bin)へ直接送るための署名つきURLを返す
// - action 'done' : ファイルが置けたのを確かめて uploaded = true にする(これで遊ぶ人が鍵を受け取れる)
// - action 'delete': 音声と、それを使う譜面を消す
// - MUSIC LiDAR の管理者だけ使える(p_token と mlidar_is_admin で確かめる)
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const BUCKET = 'mlidar-audio';
const MAX_SIZE = 25 * 1024 * 1024;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'METHOD' }, 405);
  let p: Record<string, unknown>;
  try { p = await req.json(); } catch { return json({ error: 'BAD' }, 400); }
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  // ログインと管理者の確認
  const token = String(p.token || '');
  if (!/^[0-9a-f-]{36}$/i.test(token)) return json({ error: 'AUTH' }, 401);
  const { data: acc, error: authErr } = await db.rpc('mlidar_auth', { p_token: token });
  if (authErr || !acc) return json({ error: 'AUTH' }, 401);
  const { data: admin } = await db.rpc('mlidar_is_admin', { v: acc });
  if (!admin) return json({ error: 'NOT_ADMIN' }, 403);

  if (p.action === 'begin') {
    const title = String(p.title || '').trim().slice(0, 80);
    const artist = String(p.artist || '').trim().slice(0, 80);
    const bpm = Number(p.bpm), offset = Number(p.offset) || 0, duration = Number(p.duration), size = Number(p.size);
    const key = String(p.key || '');
    if (!title || !(bpm >= 40 && bpm <= 300) || !(duration > 1 && duration <= 1200) || !(size > 0 && size <= MAX_SIZE) || !/^[A-Za-z0-9+/]{43}=$/.test(key)) return json({ error: 'BAD_AUDIO' }, 400);
    const { data: row, error } = await db.from('mlidar_audio').insert({ owner: acc, title, artist, bpm, offset, duration, key, size }).select('id').single();
    if (error) { console.error(error); return json({ error: 'DB' }, 500); }
    const { data: up, error: e2 } = await db.storage.from(BUCKET).createSignedUploadUrl(`${row.id}.bin`);
    if (e2) { console.error(e2); return json({ error: 'STORAGE' }, 500); }
    return json({ id: row.id, path: up.path, uploadToken: up.token });
  }

  if (p.action === 'done') {
    const id = String(p.id || '');
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'BAD' }, 400);
    const { data: list } = await db.storage.from(BUCKET).list('', { search: `${id}.bin` });
    const f = list?.find((x) => x.name === `${id}.bin`);
    if (!f) return json({ error: 'NOT_UPLOADED' }, 400);
    const { data: row, error } = await db.from('mlidar_audio').update({ uploaded: true, size: f.metadata?.size ?? 0 }).eq('id', id).eq('owner', acc).select('id').maybeSingle();
    if (error || !row) return json({ error: 'NOT_OWNER' }, 403);
    return json({ ok: true });
  }
  if (p.action === 'delete') {
    // 音声と、それを使う譜面(記録・いいねも)を消す
    const id = String(p.id || '');
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'BAD' }, 400);
    const { data: row } = await db.from('mlidar_audio').select('id').eq('id', id).eq('owner', acc).maybeSingle();
    if (!row) return json({ error: 'NOT_OWNER' }, 403);
    const { data: charts } = await db.from('mlidar_charts').select('id').eq('song', 'a:' + id);
    const ids = (charts || []).map((c) => c.id);
    if (ids.length) {
      await db.from('mlidar_chart_scores').delete().in('chart_id', ids);
      await db.from('mlidar_chart_likes').delete().in('chart_id', ids);
      await db.from('mlidar_charts').delete().in('id', ids);
    }
    await db.storage.from(BUCKET).remove([`${id}.bin`]);
    await db.from('mlidar_audio').delete().eq('id', id);
    return json({ ok: true, charts: ids.length });
  }
  return json({ error: 'BAD' }, 400);
});
