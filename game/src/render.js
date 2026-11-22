// Everything the player sees: the marble gallery, velvet ropes and gold trim,
// guards and their sweeping vision cones, wall cameras, laser grids, the loot
// glinting in its cases, the thief in burgundy, and the alarm meter up top.
import { ALARM, LOOT_KINDS, PLAY, VIEW } from './config.js';
import {
  SCREEN_CAUGHT,
  SCREEN_CLEAR,
  SCREEN_PAUSE,
  SCREEN_PLAY,
  SCREEN_TITLE,
  SCREEN_WIN,
} from './engine.js';

const TAU = Math.PI * 2;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, x, y, facing, range, half, color, alpha) {
  const grad = ctx.createRadialGradient(x, y, 10, x, y, range);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - half, facing + half);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawFloor(ctx) {
  ctx.fillStyle = '#1d1a24';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  // Marble checker, two quiet tones.
  for (let y = 0; y < 9; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#232030' : '#201d2b';
      ctx.fillRect(PLAY.x + x * 79, PLAY.y + y * 71, 79, 71);
    }
  }
  // Gold trim around the room and a deep-red carpet down the middle.
  ctx.strokeStyle = '#8a6d2f';
  ctx.lineWidth = 3;
  ctx.strokeRect(PLAY.x + 2, PLAY.y + 2, PLAY.w - 4, PLAY.h - 4);
  ctx.fillStyle = '#5d1f2a';
  ctx.fillRect(PLAY.x + 40, PLAY.y + 40, PLAY.w - 80, 46);
  ctx.fillStyle = '#7a2836';
  ctx.fillRect(PLAY.x + 40, PLAY.y + PLAY.h - 86, PLAY.w - 80, 46);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 1;
  ctx.strokeRect(PLAY.x + 40, PLAY.y + 40, PLAY.w - 80, 46);
  ctx.strokeRect(PLAY.x + 40, PLAY.y + PLAY.h - 86, PLAY.w - 80, 46);
}

function drawWalls(ctx, game) {
  for (const w of game.level.walls) {
    ctx.fillStyle = '#3a3348';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#4a4360';
    ctx.fillRect(w.x, w.y, w.w, 4);
    ctx.strokeStyle = '#17131f';
    ctx.lineWidth = 1;
    ctx.strokeRect(w.x, w.y, w.w, w.h);
  }
}

function drawCases(ctx, game) {
  for (const c of game.level.cases) {
    ctx.fillStyle = '#2c2836';
    rr(ctx, c.x, c.y, c.w, c.h, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(160, 210, 255, 0.16)';
    rr(ctx, c.x + 5, c.y + 5, c.w - 10, c.h - 10, 4);
    ctx.fill();
    ctx.strokeStyle = c.grand ? '#c9a227' : '#6b6480';
    ctx.lineWidth = c.grand ? 3 : 1.5;
    rr(ctx, c.x, c.y, c.w, c.h, 6);
    ctx.stroke();
    if (c.grand) {
      ctx.fillStyle = '#c9a227';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★ STAR OF AURELIA ★', c.x + c.w / 2, c.y - 8);
    }
  }
}

function drawLoot(ctx, game, time) {
  for (const l of game.loot) {
    if (l.taken) continue;
    const kind = LOOT_KINDS[l.kind];
    const pulse = 1 + Math.sin(time * 3 + l.x) * 0.12;
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.scale(pulse, pulse);
    if (l.kind === 'sapphire' || l.kind === 'crown' || l.kind === 'bag') {
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.beginPath();
      ctx.arc(0, 0, kind.radius + 12, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = kind.color;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    if (l.kind === 'coin') {
      ctx.beginPath();
      ctx.arc(0, 0, kind.radius, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#8a6d2f';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 0.5);
    } else if (l.kind === 'painting') {
      ctx.fillRect(-14, -10, 28, 20);
      ctx.strokeRect(-14, -10, 28, 20);
      ctx.fillStyle = '#2c2836';
      ctx.fillRect(-10, -6, 20, 12);
      ctx.fillStyle = '#e08a4e';
      ctx.beginPath();
      ctx.arc(-3, -1, 4, 0, TAU);
      ctx.fill();
    } else if (l.kind === 'sapphire') {
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(13, -4);
      ctx.lineTo(9, 12);
      ctx.lineTo(-9, 12);
      ctx.lineTo(-13, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(6, -4);
      ctx.lineTo(-6, -4);
      ctx.closePath();
      ctx.fill();
    } else if (l.kind === 'crown') {
      ctx.beginPath();
      ctx.moveTo(-14, 8);
      ctx.lineTo(-14, -6);
      ctx.lineTo(-7, 2);
      ctx.lineTo(0, -12);
      ctx.lineTo(7, 2);
      ctx.lineTo(14, -6);
      ctx.lineTo(14, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, kind.radius, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#3c5a1e';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 0.5);
    }
    ctx.restore();
  }
  ctx.textBaseline = 'alphabetic';
}

function drawLasers(ctx, game, time) {
  for (const l of game.lasers) {
    const gapX = l.x1 + (l.x2 - l.x1) * l.pos;
    const gapY = l.y1 + (l.y2 - l.y1) * l.pos;
    ctx.strokeStyle = 'rgba(255, 60, 60, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#ff2222';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(gapX - ((l.x2 - l.x1) / Math.hypot(l.x2 - l.x1, l.y2 - l.y1)) * (l.gap / 2), gapY - ((l.y2 - l.y1) / Math.hypot(l.x2 - l.x1, l.y2 - l.y1)) * (l.gap / 2));
    ctx.moveTo(gapX + ((l.x2 - l.x1) / Math.hypot(l.x2 - l.x1, l.y2 - l.y1)) * (l.gap / 2), gapY + ((l.y2 - l.y1) / Math.hypot(l.x2 - l.x1, l.y2 - l.y1)) * (l.gap / 2));
    ctx.lineTo(l.x2, l.y2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    // Emitter posts and the safe gap's marker.
    for (const [ex, ey] of [[l.x1, l.y1], [l.x2, l.y2]]) {
      ctx.fillStyle = '#444';
      ctx.fillRect(ex - 4, ey - 4, 8, 8);
      ctx.fillStyle = '#ff3333';
      ctx.beginPath();
      ctx.arc(ex, ey, 3, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(120, 255, 120, 0.7)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(gapX, gapY, l.gap / 2, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawCameras(ctx, game) {
  for (const cam of game.cameras) {
    drawCone(ctx, cam.x, cam.y, cam.angle, 260, 0.5, 'rgba(255, 210, 80, 0.55)', 0.35);
    ctx.fillStyle = '#222';
    ctx.fillRect(cam.x - 9, cam.y - 6, 18, 12);
    ctx.fillStyle = '#888';
    ctx.fillRect(cam.x - 9, cam.y - 6, 18, 3);
    const blink = Math.floor(game.time * 2) % 2 === 0;
    ctx.fillStyle = blink ? '#ff3333' : '#661111';
    ctx.beginPath();
    ctx.arc(cam.x + 8, cam.y, 3, 0, TAU);
    ctx.fill();
  }
}

function drawGuards(ctx, game) {
  for (const g of game.guards) {
    const alerted = g.alert > 0;
    const color = alerted ? 'rgba(255, 70, 60, 0.5)' : 'rgba(255, 210, 80, 0.42)';
    drawCone(ctx, g.x, g.y, g.facing, 225, 0.62, color, alerted ? 0.5 : 0.38);
    // Body: navy uniform, cap, and a flashlight dot ahead.
    ctx.fillStyle = '#2b3a67';
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#101830';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#1c2a4d';
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r - 4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#d8d3c0';
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.facing) * 5, g.y + Math.sin(g.facing) * 5, 4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = alerted ? '#ff4444' : '#ffd257';
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.facing) * (g.r + 5), g.y + Math.sin(g.facing) * (g.r + 5), 2.5, 0, TAU);
    ctx.fill();
    if (g.investigate) {
      ctx.fillStyle = '#ffd257';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', g.x, g.y - g.r - 8);
    }
    if (alerted) {
      ctx.fillStyle = '#ff5544';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - g.r - 8);
    }
  }
}

function drawPlayer(ctx, game) {
  const p = game.player;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 10, 12, 5, 0, 0, TAU);
  ctx.fill();
  // Burgundy coat, mask and hat: Mara Voss, the Velvet Fox.
  ctx.fillStyle = '#a02636';
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#7a1f2b';
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r - 3, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#f2d8a7';
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.facing) * 4, p.y + Math.sin(p.facing) * 4, 5.5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#1a1a22';
  ctx.fillRect(p.x - 7, p.y - 4, 14, 4);
  ctx.fillStyle = '#7a1f2b';
  ctx.beginPath();
  ctx.arc(p.x, p.y - 3, 7, Math.PI, 0);
  ctx.fill();
  if (game.channel) {
    ctx.strokeStyle = '#ffd257';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r + 8, -Math.PI / 2, -Math.PI / 2 + (game.channel / 0.9) * TAU);
    ctx.stroke();
  }
}

function drawCoinsAndSmoke(ctx, game) {
  for (const c of game.coinsThrown) {
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 6, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#8a6d2f';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(242,193,78,0.6)';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 6 + (0.6 - c.t) * 30, 0, TAU);
    ctx.stroke();
  }
  for (const c of game.smokeClouds) {
    ctx.fillStyle = `rgba(180, 180, 200, ${0.22 + 0.1 * Math.sin(game.time * 5)})`;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, TAU);
    ctx.fill();
  }
}

function drawExit(ctx, game) {
  const e = game.level.exit;
  const open = game.targetTaken;
  ctx.fillStyle = open ? '#1f5d2a' : '#3a2a1f';
  rr(ctx, e.x, e.y, e.w, e.h, 6);
  ctx.fill();
  ctx.strokeStyle = open ? '#7be07b' : '#8a6d2f';
  ctx.lineWidth = open ? 3 : 2;
  rr(ctx, e.x, e.y, e.w, e.h, 6);
  ctx.stroke();
  ctx.fillStyle = open ? '#b8f0b8' : '#c9a86a';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT OPEN' : e.label, e.x + e.w / 2, e.y + e.h / 2 - 4);
  ctx.font = '10px sans-serif';
  ctx.fillText(open ? '→ GO!' : 'LOCKED', e.x + e.w / 2, e.y + e.h / 2 + 12);
  if (open) {
    ctx.fillStyle = `rgba(123, 224, 123, ${0.25 + 0.2 * Math.sin(game.time * 4)})`;
    rr(ctx, e.x - 6, e.y - 6, e.w + 12, e.h + 12, 8);
    ctx.fill();
  }
}

function drawSafe(ctx, game) {
  const s = game.level.safe;
  if (!s) return;
  ctx.fillStyle = '#3d3a44';
  rr(ctx, s.x, s.y, s.w, s.h, 8);
  ctx.fill();
  ctx.strokeStyle = '#8a6d2f';
  ctx.lineWidth = 3;
  rr(ctx, s.x, s.y, s.w, s.h, 8);
  ctx.stroke();
  ctx.fillStyle = '#c9c2b2';
  ctx.beginPath();
  ctx.arc(s.x + s.w / 2, s.y + s.h / 2, 22, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(s.x + s.w / 2, s.y + s.h / 2, 6, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c9a227';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(s.label, s.x + s.w / 2, s.y - 8);
  if (!game.targetTaken) {
    ctx.fillStyle = '#ffd257';
    ctx.font = '11px sans-serif';
    ctx.fillText('hold E to crack', s.x + s.w / 2, s.y + s.h + 14);
  }
}

function drawHud(ctx, game) {
  ctx.fillStyle = '#14101c';
  ctx.fillRect(0, 0, VIEW.width, 64);
  ctx.fillStyle = '#c9a227';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('THE GILDED VAULT', 16, 28);
  ctx.fillStyle = '#9a8fb0';
  ctx.font = '13px sans-serif';
  ctx.fillText(game.level.name, 16, 50);

  // Alarm meter: the heart of the HUD.
  const ax = 430;
  const ay = 16;
  const aw = 340;
  ctx.fillStyle = '#2a2438';
  rr(ctx, ax, ay, aw, 22, 11);
  ctx.fill();
  const frac = game.alarm / ALARM.caughtAt;
  const grad = ctx.createLinearGradient(ax, 0, ax + aw, 0);
  grad.addColorStop(0, '#4caf50');
  grad.addColorStop(0.55, '#ffb300');
  grad.addColorStop(1, '#e53935');
  ctx.fillStyle = grad;
  if (frac > 0.01) {
    rr(ctx, ax, ay, Math.max(18, aw * frac), 22, 11);
    ctx.fill();
  }
  ctx.strokeStyle = '#0c0a12';
  ctx.lineWidth = 2;
  rr(ctx, ax, ay, aw, 22, 11);
  ctx.stroke();
  ctx.fillStyle = game.alarm > 70 ? '#ff6b5e' : '#e8e2d5';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  const label = game.alarm > 70 ? '⚠ ALARM' : 'ALARM';
  ctx.fillText(label, ax, ay + 38);
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.floor(game.alarm)}%`, ax + aw, ay + 38);
  ctx.textAlign = 'left';

  // Loot, tools, lives, score, timer.
  ctx.fillStyle = '#f2c14e';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`Loot $${game.lootValue.toLocaleString()}`, 800, 28);
  ctx.fillStyle = '#cfc6dd';
  ctx.font = '13px sans-serif';
  ctx.fillText(`Coins ${game.coins} · Smoke ${game.smoke} · ♥ ${'●'.repeat(game.lives)}${'○'.repeat(Math.max(0, 3 - game.lives))}`, 800, 50);
  ctx.fillStyle = '#e8e2d5';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`Score ${game.score.toLocaleString()}`, 1264, 28);
  const mm = String(Math.floor(game.levelTime / 60)).padStart(2, '0');
  const ss = String(Math.floor(game.levelTime % 60)).padStart(2, '0');
  ctx.fillStyle = '#9a8fb0';
  ctx.font = '13px sans-serif';
  ctx.fillText(`${mm}:${ss}`, 1264, 50);
  ctx.textAlign = 'left';

  if (game.messageUntil > 0) {
    ctx.fillStyle = 'rgba(20,16,28,0.85)';
    const w = ctx.measureText(game.message).width + 32;
    rr(ctx, (VIEW.width - w) / 2, 72, w, 30, 15);
    ctx.fill();
    ctx.fillStyle = '#ffd257';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.message, VIEW.width / 2, 92);
    ctx.textAlign = 'left';
  }
}

function drawSafeOverlay(ctx, game) {
  const s = game.safe;
  if (!s) return;
  ctx.fillStyle = 'rgba(10, 8, 16, 0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const cx = VIEW.width / 2;
  const cy = VIEW.height / 2;
  ctx.fillStyle = '#1e1a28';
  rr(ctx, cx - 260, cy - 170, 520, 340, 16);
  ctx.fill();
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  rr(ctx, cx - 260, cy - 170, 520, 340, 16);
  ctx.stroke();
  ctx.fillStyle = '#f2e6c0';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CRACK THE VAULT SAFE', cx, cy - 128);
  ctx.fillStyle = '#9a8fb0';
  ctx.font = '14px sans-serif';
  ctx.fillText('Press SPACE when the needle crosses the green arc. Three clean stops open it.', cx, cy - 102);
  // Dial.
  ctx.fillStyle = '#2c2836';
  ctx.beginPath();
  ctx.arc(cx, cy + 20, 95, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = '#4caf50';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(cx, cy + 20, 88, s.zone - s.zoneHalf, s.zone + s.zoneHalf);
  ctx.stroke();
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * TAU;
    ctx.strokeStyle = '#777';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 78, cy + 20 + Math.sin(a) * 78);
    ctx.lineTo(cx + Math.cos(a) * 88, cy + 20 + Math.sin(a) * 88);
    ctx.stroke();
  }
  ctx.strokeStyle = s.flash > 0 ? '#7be07b' : s.flash < 0 ? '#ff5544' : '#ffd257';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, cy + 20);
  ctx.lineTo(cx + Math.cos(s.angle) * 84, cy + 20 + Math.sin(s.angle) * 84);
  ctx.stroke();
  ctx.fillStyle = '#f2e6c0';
  ctx.beginPath();
  ctx.arc(cx, cy + 20, 7, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffd257';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`Clean stops: ${s.hits} / ${s.need}`, cx, cy + 140);
  ctx.fillStyle = '#9a8fb0';
  ctx.font = '13px sans-serif';
  ctx.fillText('Esc — step away from the safe', cx, cy + 162);
  ctx.textAlign = 'left';
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(10, 8, 16, 0.78)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW.width / 2, 250);
  ctx.fillStyle = '#e8e2d5';
  ctx.font = '17px sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW.width / 2, 300 + i * 30));
  ctx.textAlign = 'left';
}

function drawTitle(ctx, game) {
  overlay(
    ctx,
    'THE GILDED VAULT',
    [
      'Mara Voss, the Velvet Fox, has one night in the Aurelia Museum.',
      'Lift the Star of Aurelia, crack the Duchess vault, and reach the skylight rope.',
      '',
      'WASD / arrows — move      Shift — sneak      E — lift loot / crack the safe',
      'Click — throw a coin to lure a guard      F — smoke pellet      M — mute      R — restart wing',
      'Stay out of the yellow cones. Cameras and lasers feed the same alarm meter.',
      '',
      'Press ENTER to begin the heist',
    ],
    '#c9a227',
  );
}

export function render(ctx, game) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawFloor(ctx);
  drawCases(ctx, game);
  drawWalls(ctx, game);
  drawSafe(ctx, game);
  drawExit(ctx, game);
  drawLoot(ctx, game, game.time);
  drawLasers(ctx, game, game.time);
  drawCameras(ctx, game);
  drawGuards(ctx, game);
  drawCoinsAndSmoke(ctx, game);
  drawPlayer(ctx, game);
  drawHud(ctx, game);
  if (game.safe) drawSafeOverlay(ctx, game);
  if (game.screen === SCREEN_TITLE) drawTitle(ctx, game);
  if (game.screen === SCREEN_PAUSE) {
    overlay(ctx, 'PAUSED', ['The museum waits. Press Esc to slip back into the dark.'], '#9a8fb0');
  }
  if (game.screen === SCREEN_CAUGHT) {
    overlay(
      ctx,
      'CAUGHT!',
      [
        `The alarm peaked — ${game.caughtReason}.`,
        game.lives > 0 ? `Lives left: ${game.lives}. Press R to try this wing again.` : 'No lives left. Press ENTER to start the night over.',
        `Score so far: ${game.score.toLocaleString()}`,
      ],
      '#ff5544',
    );
  }
  if (game.screen === SCREEN_CLEAR) {
    const b = game.clearBonus ?? { timeBonus: 0, alarmBonus: 0 };
    overlay(
      ctx,
      'WING CLEARED',
      [
        `${game.level.name} — loot $${game.lootValue.toLocaleString()} and counting.`,
        `Time bonus +${b.timeBonus} · Quiet bonus +${b.alarmBonus}`,
        'Press ENTER for the next wing.',
      ],
      '#7be07b',
    );
  }
  if (game.screen === SCREEN_WIN) {
    overlay(
      ctx,
      'THE GETAWAY!',
      [
        'Mara Voss slips over the skylight rope as the Aurelia Museum sleeps on.',
        `Total loot $${game.lootValue.toLocaleString()} · Final score ${game.score.toLocaleString()}`,
        'Press ENTER to run the night again.',
      ],
      '#c9a227',
    );
  }
}
