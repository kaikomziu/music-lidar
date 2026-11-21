// 更新履歴(js/changelog.js)に増えたバージョンを、公式Discordの「アップデート」チャンネルに投稿する
// GitHub Actions(.github/workflows/discord-update.yml)から呼ばれる
//   node tools/discord-update.mjs <新しい changelog.mjs> [前の changelog.mjs]
// 前のファイルを渡さないときは、いちばん新しいバージョンだけを投稿する(手動実行用)
// 投稿先は環境変数 DISCORD_UPDATE_WEBHOOK(GitHub の Secret)
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const SITE = 'https://music-lidar.com/';
const [newPath, oldPath] = process.argv.slice(2);
const webhook = process.env.DISCORD_UPDATE_WEBHOOK;
if (!webhook) { console.error('DISCORD_UPDATE_WEBHOOK がありません'); process.exit(1); }

const load = async (p) => (await import(pathToFileURL(p).href)).CHANGELOG;
const now = await load(newPath);

let fresh;
if (oldPath && existsSync(oldPath)) {
  const before = new Set((await load(oldPath)).map((e) => e.version));
  // 増えたものを古い順に投稿する
  fresh = now.filter((e) => !before.has(e.version)).reverse();
} else {
  fresh = now.slice(0, 1);
}
if (!fresh.length) { console.log('新しいバージョンはありません'); process.exit(0); }

for (const e of fresh) {
  let desc = e.notes.map((n) => `・${n}`).join('\n');
  if (desc.length > 3900) desc = desc.slice(0, 3900) + '…';
  const body = {
    username: 'MUSIC LiDAR',
    avatar_url: SITE + 'icon-512.png',
    embeds: [{
      title: `🆕 ver ${e.version} にアップデートしました`,
      url: SITE + 'changelog/',
      description: `${desc}\n\n▶ [今すぐ遊ぶ](${SITE})`,
      color: 0x5ef2ff,
      footer: { text: e.date },
    }],
  };
  const res = await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) { console.error('投稿に失敗', e.version, res.status, await res.text()); process.exit(1); }
  console.log('投稿しました', e.version);
  await new Promise((r) => setTimeout(r, 1500)); // 連続投稿の間をあける
}
