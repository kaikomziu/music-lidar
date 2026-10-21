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
import rainyWindow from './rainy-window.js';
import midnightAvenue from './midnight-avenue.js';
import skyPrism from './sky-prism.js';
import ironPulse from './iron-pulse.js';
import sunsetBossa from './sunset-bossa.js';
import hardReflector from './hard-reflector.js';
import sakuraLattice from './sakura-lattice.js';
import nightDrift from './night-drift.js';
import islandSignal from './island-signal.js';
import lowOrbit from './low-orbit.js';
import swingCircuit from './swing-circuit.js';
import sugarRush from './sugar-rush.js';
import dembowLights from './dembow-lights.js';
import offbeatSkater from './offbeat-skater.js';
import lastHorizon from './last-horizon.js';
import plaza1995 from './plaza-1995.js';
import finalProtocol from './final-protocol.js';

export default [
  firstLight, helloLane, plaza1995, rainyWindow, islandSignal, neonHighway, discoMirrorball, dembowLights, sunsetBossa,
  midnightAvenue, cloudPoint, pixelQuest, pulseGrid, swingCircuit, lowOrbit, ironPulse, sakuraLattice, lastHorizon,
  blueNoteLane, stellarGate, skyPrism, lidarRush, shiningStar, wubFracture, offbeatSkater, nightDrift, overdriveRiot,
  hardReflector, sugarRush, freezeFrame, hyperScanBreaker, finalProtocol, overclockOmega,
];
