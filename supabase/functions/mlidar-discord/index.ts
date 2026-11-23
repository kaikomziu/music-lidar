// 公式Discordの「✅｜認証」チャンネルを見て、ゲームのアカウントとつなぐ(◎500 と「✅ 認証済み」ロールを渡す)
// - pg_cron が呼ぶ。ヘッダー x-mlidar-cron が Vault の mlidar_discord_cron と同じときだけ動く
//   - ジョブ mlidar-discord-feed: 1分ごと。ただし投稿していない記録のお知らせがあるときだけ呼ぶ(body {"mode":"feed"} → お知らせだけ)
//   - ジョブ mlidar-discord-verify: 10分ごと(チャンネルに貼られたコードの処理・返事の片付け・お知らせ)。Supabase の節約のため 2026-11-23 に1分 → 10分
//   - 認証はふだんスラッシュコマンド /verify(mlidar-discord-cmd)ですぐ済む。チャンネルに貼る方法も残している
// - 前回の続き(mlidar_discord_state の last)からメッセージを読み、6文字のコードを mlidar_discord_redeem に渡す
// - 返事をして、貼られたメッセージは消す。ボットの返事は10分たったら消す(ピン留めは残す)
// - ボットのトークンは Vault の mlidar_discord_bot_token(mlidar_discord_config で受け取る)
// - 記録のお知らせ: mlidar_discord_feed(認証した人のランキング1位・初 ALL PERFECT・HARD/EXTRA の初フルコンボ)を「記録」チャンネルに投稿する
//   チャンネルは mlidar_discord_state の feed_channel。なければ「🏆｜スコア報告」(名前に「スコア報告」)、なければ「記録」か record が入ったテキストチャンネルを探して覚える(まだなければ待つ)
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

  const mode = ((await req.json().catch(() => ({}))) as { mode?: string }).mode;
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

  if (mode === 'feed') { // 記録のお知らせだけ
    const posted = await postFeed().catch((e) => { console.error(e); return 0; });
    return new Response(JSON.stringify({ ok: true, posted }), { headers: { 'Content-Type': 'application/json' } });
  }

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
      text = 'コードが見つかりませんでした。ゲームのプロフィールの「Discordで認証」に出る6文字のコードで `/verify コード` と打つと、すぐに認証できます';
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

  // 記録のお知らせ
  const posted = await postFeed().catch((e) => { console.error(e); return 0; });

  // ボットの返事・ピン留めのお知らせは10分で消す
  const r2 = await dc('GET', `/channels/${CHANNEL}/messages?limit=50`);
  const recent = r2?.ok ? await r2.json() : [];
  for (const m of Array.isArray(recent) ? recent : []) {
    if (m.author?.id === BOT && !m.pinned && Date.now() - Date.parse(m.timestamp) > 10 * 60e3) await dc('DELETE', `/channels/${CHANNEL}/messages/${m.id}`);
  }
  return new Response(JSON.stringify({ ok: true, done, posted }), { headers: { 'Content-Type': 'application/json' } });

  async function postFeed() {
    const { data: rows } = await db.from('mlidar_discord_feed').select('*').is('posted_at', null).order('id').limit(10);
    if (!rows?.length) return 0;
    const { data: fc } = await db.from('mlidar_discord_state').select('v').eq('k', 'feed_channel').maybeSingle();
    let ch: string | undefined = fc?.v;
    if (!ch) {
      const rc = await dc('GET', `/guilds/${GUILD}/channels`);
      const chans = rc?.ok ? await rc.json() : [];
      const text = (Array.isArray(chans) ? chans : []).filter((c: { type: number; name: string }) => c.type === 0);
      const hit = text.find((c: { name: string }) => /スコア報告/.test(c.name)) || text.find((c: { name: string }) => /記録|record/i.test(c.name));
      if (!hit) return 0; // 送り先のチャンネルができたら送る
      ch = hit.id as string;
      await db.from('mlidar_discord_state').upsert({ k: 'feed_channel', v: ch });
    }
    // 曲名・色・曲ページ(サイトの data/cards.json。i = 曲の id)
    const songs = await fetch('https://music-lidar.com/data/cards.json').then((r) => r.json()).catch(() => []);
    const byId = new Map((Array.isArray(songs) ? songs : []).map((s: { i: string }) => [s.i, s]));
    let n = 0;
    for (const f of rows) {
      const s = byId.get(f.song) as { u: string; t: string; c: string; l: number[] } | undefined;
      const title = s?.t || f.song;
      const lv = s ? ({ easy: s.l[0], normal: s.l[1], hard: s.l[2] } as Record<string, number>)[f.diff] : undefined;
      const head = f.kind === 'top' ? '🏆 ランキング1位!' : f.kind === 'ap' ? '🌈 ALL PERFECT!' : '🔥 フルコンボ!';
      const name = String(f.name).replace(/[\\*_`~|>]/g, '\\$&');
      const what = f.kind === 'top' ? 'ランキング1位になりました' : f.kind === 'ap' ? 'ALL PERFECT を達成しました' : 'フルコンボを達成しました';
      const r = await dc('POST', `/channels/${ch}/messages`, {
        allowed_mentions: { parse: [] },
        embeds: [{
          title: `${head} ${title}`, url: s ? `https://music-lidar.com/music/${s.u}/` : 'https://music-lidar.com/',
          color: parseInt((s?.c || '#5ef2ff').replace('#', ''), 16) || 0x5ef2ff,
          description: `<@${f.discord_id}>(**${name}**)さんが **${title}** の ${String(f.diff).toUpperCase()}${lv ? ' Lv' + lv : ''} で${what}!`,
          fields: [{ name: 'スコア', value: Number(f.score).toLocaleString('en-US'), inline: true }, ...(f.acc != null ? [{ name: '精度', value: Number(f.acc).toFixed(2) + '%', inline: true }] : [])],
          footer: { text: 'MUSIC LiDAR ・ music-lidar.com' }, timestamp: f.created_at,
        }],
      });
      // 送れた・送れない理由が直らない(4xx)ときは済みにする(同じものを何度も送らないように)
      if (r && (r.ok || (r.status >= 400 && r.status < 500 && r.status !== 429))) {
        await db.from('mlidar_discord_feed').update({ posted_at: new Date().toISOString() }).eq('id', f.id);
        if (r.ok) n++; else console.error('feed post', r.status, await r.text().catch(() => ''));
      }
    }
    return n;
  }
});
