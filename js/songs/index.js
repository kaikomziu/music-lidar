// 内蔵曲の一覧(この順に選曲画面へ並ぶ)。
// 曲を追加するときは js/songs/ に新しいファイルを作り(既存の曲をコピーすると楽)、ここに1行足すだけ。
// id は英小文字・数字・ハイフンのみ(オンラインランキングのキーになる)。
// urlId は曲ページのURL(music/<urlId>/)。英小文字+数字9文字くらいのランダムな文字列にして、公開後は変えない。
// tools/release.py を実行すると曲ページ・共有画像の参照・sitemap.xml が作り直される(共有画像は music/<urlId>/og.png に置く)。
// 曲ファイルの chart: { easy: {...}, hard: {...} } で譜面の密度などを曲ごとに調整できる(composer.js の PARAM 参照)。
import firstLight from './first-light.js';
import helloLane from './hello-lane.js';
import neonHighway from './neon-highway.js';
import discoMirrorball from './disco-mirrorball.js';
import cloudPoint from './cloud-point.js';
import pixelQuest from './pixel-quest.js';
import pulseGrid from './pulse-grid.js';
import blueNoteLane from './blue-note-lane.js';
import stellarGate from './stellar-gate.js';
import lidarRush from './lidar-rush.js';
import shiningStar from './shining-star.js';
import wubFracture from './wub-fracture.js';
import overdriveRiot from './overdrive-riot.js';
import freezeFrame from './freeze-frame.js';
import hyperScanBreaker from './hyper-scan-breaker.js';
import overclockOmega from './overclock-omega.js';

export default [
  firstLight, helloLane, neonHighway, discoMirrorball, cloudPoint, pixelQuest, pulseGrid, blueNoteLane,
  stellarGate, lidarRush, shiningStar, wubFracture, overdriveRiot, freezeFrame, hyperScanBreaker, overclockOmega,
];
