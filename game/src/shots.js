// The four staged frames behind ?shot=title|play|alarm|safe. Each one sets the
// real game state — a level, a thief, patrolling guards, a sweeping camera,
// a laser gap, an alarm value — then plays the real rules forward a few fixed
// steps, so the frame is what the game itself draws, never a mock-up.
import { loadLevel } from './engine.js';
import { SCREEN_TITLE } from './engine.js';

const NO_INPUT = {
  moveVector: () => ({ x: 0, y: 0 }),
  sneaking: () => false,
  interacting: () => false,
  wasPressed: () => false,
  takeClick: () => null,
};

function setCameraPose(game, t) {
  for (let i = 0; i < game.cameras.length; i += 1) {
    game.cameras[i].t = t + i * 1.7;
    game.cameras[i].angle = game.cameras[i].base + Math.sin(game.cameras[i].t * game.cameras[i].speed) * game.cameras[i].sweep;
  }
}

function setGuardPose(game, poses) {
  for (let i = 0; i < poses.length && i < game.guards.length; i += 1) {
    const g = game.guards[i];
    g.x = poses[i].x;
    g.y = poses[i].y;
    g.facing = poses[i].facing;
    g.alert = poses[i].alert ?? 0;
    g.waitLeft = 99;
  }
}

/**
 * Stage `game` for the named shot and return the screen to draw.
 * title: the opening screen over the Grand Gallery, cones sweeping.
 * play: mid-heist — the thief sneaking for the sapphire, alarm at a third.
 * alarm: the alarm nearly peaked, a guard giving chase by the exit.
 * safe: the vault safe's cracking dial, needle on the green arc.
 */
export function stageShot(name, game, stepGame) {
  if (name === 'safe') {
    loadLevel(game, 1);
    game.player.x = 1060;
    game.player.y = 260;
    game.player.facing = -Math.PI / 2;
    setGuardPose(game, [
      { x: 480, y: 300, facing: Math.PI / 2 },
      { x: 880, y: 480, facing: 0 },
      { x: 700, y: 620, facing: -Math.PI / 2 },
    ]);
    setCameraPose(game, 2.2);
    game.alarm = 48;
    game.safe = { angle: 0.9, speed: 1.9, zone: 1.1, zoneHalf: 0.5, hits: 1, need: 3, flash: 0.4 };
    for (let i = 0; i < 30; i += 1) stepGame(game, 1 / 60, NO_INPUT);
    game.alarm = 48;
    game.safe = { angle: 1.05, speed: 1.9, zone: 1.1, zoneHalf: 0.5, hits: 1, need: 3, flash: 0.4 };
    return;
  }
  loadLevel(game, 0);
  if (name === 'alarm') {
    game.player.x = 160;
    game.player.y = 600;
    game.player.facing = Math.PI;
    setGuardPose(game, [
      { x: 260, y: 520, facing: Math.PI, alert: 2.5 },
      { x: 900, y: 300, facing: -Math.PI / 2 },
    ]);
    setCameraPose(game, 3.1);
    game.coinsThrown.push({ x: 420, y: 420, t: 0.5 });
    for (let i = 0; i < 30; i += 1) stepGame(game, 1 / 60, NO_INPUT);
    game.alarm = 82;
    game.player.x = 160;
    game.player.y = 600;
    game.guards[0].x = 260;
    game.guards[0].y = 520;
    game.guards[0].facing = Math.PI;
    game.guards[0].alert = 2.5;
    return;
  }
  if (name === 'play') {
    game.player.x = 540;
    game.player.y = 452;
    game.player.facing = -Math.PI / 2;
    setGuardPose(game, [
      { x: 480, y: 300, facing: Math.PI / 2 },
      { x: 880, y: 500, facing: Math.PI },
    ]);
    setCameraPose(game, 1.4);
    game.coinsThrown.push({ x: 520, y: 430, t: 0.55 });
    for (let i = 0; i < 45; i += 1) stepGame(game, 1 / 60, NO_INPUT);
    game.alarm = 35;
    game.player.x = 540;
    game.player.y = 452;
    game.player.facing = -Math.PI / 2;
    return;
  }
  // title (default): the gallery at rest, guards on patrol, cones sweeping.
  setGuardPose(game, [
    { x: 180, y: 320, facing: Math.PI / 2 },
    { x: 1180, y: 320, facing: -Math.PI / 2 },
  ]);
  setCameraPose(game, 0.8);
  for (let i = 0; i < 60; i += 1) stepGame(game, 1 / 60, NO_INPUT);
  game.screen = SCREEN_TITLE;
}
