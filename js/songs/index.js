// 内蔵曲の一覧。
// 曲を追加するときは js/songs/ に新しいファイルを作り(既存の曲をコピーすると楽)、ここに1行足すだけ。
// id は英小文字・数字・ハイフンのみ(オンラインランキングのキーになる)。
import cloudPoint from './cloud-point.js';
import pulseGrid from './pulse-grid.js';
import lidarRush from './lidar-rush.js';

export default [cloudPoint, pulseGrid, lidarRush];
