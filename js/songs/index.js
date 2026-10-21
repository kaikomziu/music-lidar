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
import morningCoffee from './morning-coffee.js';
import paperPlanes from './paper-planes.js';
import glitterIdol from './glitter-idol.js';
import neonSamurai from './neon-samurai.js';
import deepBlueCurrent from './deep-blue-current.js';
import circuitBreaker from './circuit-breaker.js';
import jungleLights from './jungle-lights.js';
import jazzCafe from './jazz-cafe.js';
import funkyStation from './funky-station.js';
import starLullaby from './star-lullaby.js';
import chipDungeon from './chip-dungeon.js';
import mirageShift from './mirage-shift.js';
import polarNight from './polar-night.js';
import bigRoomBlast from './big-room-blast.js';
import tangoNoir from './tango-noir.js';
import celticRun from './celtic-run.js';
import gabberStorm from './gabber-storm.js';
import spaceWaltz from './space-waltz.js';
import bluesHighway from './blues-highway.js';
import kawaiiBubble from './kawaii-bubble.js';
import sunnyParade from './sunny-parade.js';
import cottonCandy from './cotton-candy.js';
import salsaFuego from './salsa-fuego.js';
import sambaCarnival from './samba-carnival.js';
import desertWind from './desert-wind.js';
import dragonGate from './dragon-gate.js';
import afroSunrise from './afro-sunrise.js';
import gospelLight from './gospel-light.js';
import velvetRnb from './velvet-rnb.js';
import boomBapDays from './boom-bap-days.js';
import liquidSky from './liquid-sky.js';
import hyperpopGlitch from './hyperpop-glitch.js';
import breakcoreCollapse from './breakcore-collapse.js';
import psyForest from './psy-forest.js';
import progAscent from './prog-ascent.js';
import moombahHeat from './moombah-heat.js';
import garageShuffle from './garage-shuffle.js';
import metalcoreFury from './metalcore-fury.js';
import pianoRain from './piano-rain.js';
import timeTwister from './time-twister.js';
import neutronOverdrive from './neutron-overdrive.js';
import abyssGate from './abyss-gate.js';
import bulletHell404 from './bullet-hell-404.js';
import thunderRequiem from './thunder-requiem.js';
import fractalStorm from './fractal-storm.js';
import kickMachinegun from './kick-machinegun.js';
import ultraSpiral from './ultra-spiral.js';
import jackhammerJazz from './jackhammer-jazz.js';
import velocityZero from './velocity-zero.js';
import terminalVelocity from './terminal-velocity.js';
import sakuraBlizzard from './sakura-blizzard.js';
import infinityBreaker from './infinity-breaker.js';

export default [
  // やさしい曲
  firstLight, helloLane, starLullaby, cottonCandy, plaza1995, sunnyParade, morningCoffee, pianoRain, polarNight, gospelLight,
  rainyWindow, islandSignal,
  // ふつう
  neonHighway, discoMirrorball, dembowLights, afroSunrise, jazzCafe, spaceWaltz, bluesHighway, velvetRnb, boomBapDays,
  sunsetBossa, deepBlueCurrent, tangoNoir, desertWind, sambaCarnival, moombahHeat, paperPlanes, midnightAvenue, funkyStation,
  progAscent, dragonGate, cloudPoint, pixelQuest, pulseGrid, swingCircuit, lowOrbit, ironPulse, garageShuffle,
  // むずかしめ
  sakuraLattice, lastHorizon, celticRun, bigRoomBlast, salsaFuego, blueNoteLane, glitterIdol, liquidSky, stellarGate, skyPrism,
  kawaiiBubble, lidarRush, shiningStar, wubFracture, offbeatSkater, nightDrift, psyForest, neonSamurai, jungleLights,
  overdriveRiot, hardReflector,
  // 鬼畜・ギミック
  sugarRush, hyperpopGlitch, chipDungeon, circuitBreaker, mirageShift, freezeFrame, fractalStorm, kickMachinegun, velocityZero,
  terminalVelocity, metalcoreFury, timeTwister, hyperScanBreaker, gabberStorm, finalProtocol, abyssGate, bulletHell404,
  thunderRequiem, jackhammerJazz, sakuraBlizzard, breakcoreCollapse, overclockOmega, ultraSpiral, neutronOverdrive, infinityBreaker,
];
