// Gmail に届いたメールを、MUSIC LiDAR の管理者ページ(受信メール)に送る Google Apps Script
// - 受信する Gmail(karubiwakame@gmail.com)のアカウントで https://script.google.com/ に新しいプロジェクトを作り、これを貼る
// - SECRET(合言葉)は Supabase Vault の 'mlidar_mail_secret'。このファイル(公開しているリポジトリ)には書かない。
//   合言葉入りのものは、リポジトリの外の music-lidar-private/gmail-to-mlidar.gs にある
// - 最初に setup() を1回実行すると、5分ごとに pushNewMail() が動く(Gmail を読む許可と、外へ送る許可を自分で出す)
// - サーバー(mlidar_mail_put)は、差出人・件名・本文を暗号化して保存し、同じメールは2回入れない
const ENDPOINT = 'https://kifnzvktwbomxthzvvgy.supabase.co/rest/v1/rpc/mlidar_mail_put';
const ANON_KEY = 'ここにサイトの公開キー(js/ranking.js の KEY)';
const SECRET = 'ここに合言葉';
const QUERY = 'in:inbox newer_than:2d'; // 送る対象(受信トレイの直近2日)

function pushNewMail() {
  const threads = GmailApp.search(QUERY, 0, 40);
  const items = [];
  for (const t of threads) {
    for (const m of t.getMessages()) {
      if (m.isInTrash() || m.isDraft()) continue;
      items.push({ id: m.getId(), from: m.getFrom(), subject: m.getSubject(), body: m.getPlainBody().slice(0, 8000), at: m.getDate().toISOString() });
    }
  }
  if (!items.length) return;
  for (let i = 0; i < items.length; i += 100) {
    const res = UrlFetchApp.fetch(ENDPOINT, {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY },
      payload: JSON.stringify({ p_secret: SECRET, p_items: items.slice(i, i + 100) }),
    });
    if (res.getResponseCode() !== 200) console.error('送れませんでした', res.getResponseCode(), res.getContentText());
  }
}

// 最初に1回だけ実行: 5分ごとに pushNewMail が動くようにする(すでにあれば作り直す)
function setup() {
  for (const tr of ScriptApp.getProjectTriggers()) if (tr.getHandlerFunction() === 'pushNewMail') ScriptApp.deleteTrigger(tr);
  ScriptApp.newTrigger('pushNewMail').timeBased().everyMinutes(5).create();
  pushNewMail();
}
