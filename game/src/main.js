// Bootstraps The Gilded Vault: the fixed-step loop, screen transitions, and the
// ?shot= staging hook the screenshots are taken through.
import { VIEW, STEP } from './config.js';
import { createGame, loadLevel, restartGame, restartLevel, stepGame } from './engine.js';
import {
  SCREEN_CAUGHT,
  SCREEN_CLEAR,
  SCREEN_PAUSE,
  SCREEN_PLAY,
  SCREEN_TITLE,
  SCREEN_WIN,
} from './engine.js';
import { render } from './render.js';
import { createInput } from './input.js';
import { stageShot } from './shots.js';
import { startMusic, toggleMute, unlockAudio } from './audio.js';

const canvas = document.getElementById('game');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const ctx = canvas.getContext('2d');

const game = createGame();
window.__gv = game; // Debug handle for play-testing; the game never reads it.
window.__gvLoad = loadLevel;
const input = createInput(canvas);
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

if (shot) {
  stageShot(shot, game, stepGame);
  render(ctx, game);
} else {
  let last = performance.now();
  let acc = 0;

  window.addEventListener('keydown', unlockAudio, { once: true });
  canvas.addEventListener('mousedown', unlockAudio, { once: true });

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;

    // Screen keys, handled once per frame.
    if (input.wasPressed('m')) toggleMute();
    if (game.screen === SCREEN_TITLE && input.wasPressed('Enter')) {
      game.screen = SCREEN_PLAY;
      startMusic();
    } else if (game.screen === SCREEN_PLAY && input.wasPressed('Escape')) {
      game.screen = SCREEN_PAUSE;
    } else if (game.screen === SCREEN_PAUSE && input.wasPressed('Escape')) {
      game.screen = SCREEN_PLAY;
    } else if (game.screen === SCREEN_CAUGHT && input.wasPressed('r')) {
      if (game.lives > 0) restartLevel(game);
      else restartGame(game);
    } else if (game.screen === SCREEN_CAUGHT && input.wasPressed('Enter') && game.lives <= 0) {
      restartGame(game);
    } else if (game.screen === SCREEN_CLEAR && input.wasPressed('Enter')) {
      loadLevel(game, game.levelIndex + 1);
    } else if (game.screen === SCREEN_WIN && input.wasPressed('Enter')) {
      restartGame(game);
    } else if (input.wasPressed('r') && (game.screen === SCREEN_PLAY || game.screen === SCREEN_PAUSE)) {
      restartLevel(game);
    }

    if (game.screen === SCREEN_PLAY) {
      acc += dt;
      while (acc >= STEP) {
        stepGame(game, STEP, input);
        acc -= STEP;
        if (game.screen !== SCREEN_PLAY) break;
      }
    } else {
      // Menus still breathe: loot glints, the alarm light blinks.
      game.time += dt;
    }

    render(ctx, game);
    input.endFrame();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
