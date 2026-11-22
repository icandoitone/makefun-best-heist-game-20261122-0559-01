// The heist engine: one wing at a time, a thief, patrolling guards, sweeping
// cameras, sliding laser gaps, loot tiers, a safe-cracking dial and an alarm
// meter that decides whether the night ends in a getaway or a cell.
import { ALARM, LEVELS, LOOT_KINDS, PLAY, PLAYER, STEP, VISION } from './config.js';
import { sfx } from './audio.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_WIN = 'win';
export const SCREEN_PAUSE = 'pause';

const TAU = Math.PI * 2;

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

function angleDiff(a, b) {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

/** True when the segment is blocked by any wall or display case. */
export function sightBlocked(x1, y1, x2, y2, obstacles) {
  const steps = Math.ceil(dist(x1, y1, x2, y2) / 10);
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    for (const o of obstacles) if (pointInRect(x, y, o)) return true;
  }
  return false;
}

/** Is the player inside a cone of `range`, half-angle `half`, facing `facing`? */
function inCone(ox, oy, facing, range, half, px, py, obstacles) {
  const d = dist(ox, oy, px, py);
  if (d > range) return false;
  if (Math.abs(angleDiff(angleTo(ox, oy, px, py), facing)) > half) return false;
  return !sightBlocked(ox, oy, px, py, obstacles);
}

function circleHitsRect(cx, cy, r, rect) {
  const nx = clamp(cx, rect.x, rect.x + rect.w);
  const ny = clamp(cy, rect.y, rect.y + rect.h);
  return (cx - nx) * (cx - nx) + (cy - ny) * (cy - ny) < r * r;
}

function moveCircle(body, dx, dy, obstacles) {
  const nx = body.x + dx;
  if (!obstacles.some((o) => circleHitsRect(nx, body.y, body.r, o))) body.x = nx;
  const ny = body.y + dy;
  if (!obstacles.some((o) => circleHitsRect(body.x, ny, body.r, o))) body.y = ny;
  body.x = clamp(body.x, PLAY.x + body.r, PLAY.x + PLAY.w - body.r);
  body.y = clamp(body.y, PLAY.y + body.r, PLAY.y + PLAY.h - body.r);
}

export function createGame() {
  const game = {
    screen: SCREEN_TITLE,
    levelIndex: 0,
    level: null,
    player: null,
    guards: [],
    cameras: [],
    lasers: [],
    loot: [],
    obstacles: [],
    alarm: 0,
    lives: 3,
    score: 0,
    lootValue: 0,
    coins: 0,
    smoke: 0,
    coinsThrown: [],
    smokeClouds: [],
    time: 0,
    levelTime: 0,
    targetTaken: false,
    channel: null,
    safe: null,
    message: '',
    messageUntil: 0,
    stepCount: 0,
    alarmSoundAt: 0,
    caughtReason: '',
  };
  loadLevel(game, 0);
  game.screen = SCREEN_TITLE;
  return game;
}

export function loadLevel(game, index) {
  const def = LEVELS[index];
  game.levelIndex = index;
  game.level = def;
  game.player = {
    x: def.playerStart.x,
    y: def.playerStart.y,
    r: PLAYER.radius,
    vx: 0,
    vy: 0,
    facing: -Math.PI / 2,
    moving: false,
    stepAt: 0,
  };
  game.guards = def.guards.map((g) => ({
    path: g.path,
    speed: g.speed,
    wait: g.wait,
    wp: 0,
    waitLeft: 0,
    x: g.path[0][0],
    y: g.path[0][1],
    r: 13,
    facing: Math.PI / 2,
    alert: 0,
    investigate: null,
    investigateLeft: 0,
    scanDir: 1,
  }));
  game.cameras = def.cameras.map((c) => ({ ...c, angle: c.base, t: Math.random() * 6 }));
  game.lasers = def.lasers.map((l) => ({ ...l }));
  game.loot = def.loot.map((l) => ({ ...l, taken: false }));
  game.obstacles = [
    ...def.walls,
    ...def.cases,
    ...(def.safe ? [def.safe] : []),
    { x: PLAY.x - 16, y: PLAY.y - 16, w: PLAY.w + 32, h: 16 },
    { x: PLAY.x - 16, y: PLAY.y + PLAY.h, w: PLAY.w + 32, h: 16 },
    { x: PLAY.x - 16, y: PLAY.y, w: 16, h: PLAY.h },
    { x: PLAY.x + PLAY.w, y: PLAY.y, w: 16, h: PLAY.h },
  ];
  game.alarm = def.alarmStart ?? 0;
  game.coins = def.coins;
  game.smoke = def.smoke;
  game.coinsThrown = [];
  game.smokeClouds = [];
  game.levelTime = 0;
  game.targetTaken = false;
  game.channel = null;
  game.safe = null;
  game.screen = SCREEN_PLAY;
  game.message = def.name;
  game.messageUntil = 3;
}

export function restartLevel(game) {
  game.lives = Math.max(game.lives, 1);
  loadLevel(game, game.levelIndex);
}

export function restartGame(game) {
  game.score = 0;
  game.lootValue = 0;
  game.lives = 3;
  game.time = 0;
  loadLevel(game, 0);
}

function say(game, text, seconds = 2.5) {
  game.message = text;
  game.messageUntil = seconds;
}

function nearestGuard(game, x, y) {
  let best = null;
  let bestD = Infinity;
  for (const g of game.guards) {
    const d = dist(g.x, g.y, x, y);
    if (d < bestD) {
      bestD = d;
      best = g;
    }
  }
  return bestD < 320 ? best : null;
}

function startSafeCrack(game) {
  game.safe = {
    angle: 0,
    speed: 1.9,
    zone: Math.random() * TAU,
    zoneHalf: 0.5,
    hits: 0,
    need: 3,
    flash: 0,
  };
  sfx.click();
}

function updateSafe(game, dt, input) {
  const s = game.safe;
  s.angle = (s.angle + s.speed * dt) % TAU;
  s.flash = Math.max(0, s.flash - dt);
  if (input.wasPressed(' ')) {
    const d = Math.abs(angleDiff(s.angle, s.zone));
    if (d <= s.zoneHalf) {
      s.hits += 1;
      sfx.safeTick();
      if (s.hits >= s.need) {
        game.safe = null;
        const crown = game.loot.find((l) => l.id === game.level.targetId);
        if (crown) {
          crown.taken = true;
          game.targetTaken = true;
          game.score += LOOT_KINDS[crown.kind].value;
          game.lootValue += LOOT_KINDS[crown.kind].value;
        }
        sfx.safeOpen();
        say(game, 'Vault open — the crown is yours. Reach the exit!', 3);
      } else {
        s.zone = Math.random() * TAU;
        s.speed += 0.55;
        s.flash = 0.4;
      }
    } else {
      game.alarm = Math.min(100, game.alarm + 15);
      sfx.spotted();
      s.flash = -0.4;
      say(game, 'Wrong tumbler! The alarm jumps.', 2);
    }
  }
  if (input.wasPressed('Escape') || input.wasPressed('e')) game.safe = null;
}

function updateGuard(game, g, dt) {
  const p = game.player;
  if (g.alert > 0) g.alert -= dt;
  if (g.investigate) {
    g.investigateLeft -= dt;
    if (g.investigateLeft <= 0) g.investigate = null;
  }
  const chase = g.alert > 0.6;
  let tx;
  let ty;
  let speed = g.speed;
  if (chase) {
    tx = p.x;
    ty = p.y;
    speed = g.speed * 1.55;
  } else if (g.investigate) {
    tx = g.investigate.x;
    ty = g.investigate.y;
    speed = g.speed * 1.15;
  } else {
    const wp = g.path[g.wp];
    tx = wp[0];
    ty = wp[1];
  }
  const d = dist(g.x, g.y, tx, ty);
  if (d < 6) {
    if (chase || g.investigate) {
      if (g.investigate && d < 10) g.investigate = null;
    } else {
      g.waitLeft -= dt;
      if (g.waitLeft <= 0) {
        g.wp = (g.wp + 1) % g.path.length;
        g.waitLeft = g.wait;
      }
      g.facing += g.scanDir * 0.7 * dt;
      if (g.facing > Math.PI) g.scanDir = -1;
      if (g.facing < -Math.PI) g.scanDir = 1;
      return;
    }
  }
  const a = angleTo(g.x, g.y, tx, ty);
  g.facing = a;
  moveCircle(g, Math.cos(a) * speed * dt, Math.sin(a) * speed * dt, game.obstacles);
}

function updateCamera(cam, dt) {
  cam.t += dt;
  cam.angle = cam.base + Math.sin(cam.t * cam.speed) * cam.sweep;
}

function updateLaser(laser, dt) {
  laser.pos += laser.speed * dt;
  if (laser.pos > 0.88) {
    laser.pos = 0.88;
    laser.speed = -Math.abs(laser.speed);
  }
  if (laser.pos < 0.12) {
    laser.pos = 0.12;
    laser.speed = Math.abs(laser.speed);
  }
}

function pointSegmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = clamp(t, 0, 1);
  return dist(px, py, x1 + dx * t, y1 + dy * t);
}

function inSmoke(game, x, y) {
  return game.smokeClouds.some((c) => dist(x, y, c.x, c.y) < c.r);
}

/** One fixed step of the heist. `input` is the live input object; `auto` steers the thief. */
export function stepGame(game, dt, input, auto = null) {
  game.stepCount += 1;
  if (game.screen !== SCREEN_PLAY) return;
  game.time += dt;
  game.levelTime += dt;
  if (game.messageUntil > 0) game.messageUntil -= dt;

  const p = game.player;
  const hidden = inSmoke(game, p.x, p.y);

  // Safe-cracking freezes the thief but not the room.
  if (game.safe) {
    updateSafe(game, dt, input);
  } else {
    // Movement.
    const mv = auto ?? input.moveVector();
    const sneaking = auto ? auto.sneak : input.sneaking();
    const speed = sneaking ? PLAYER.sneak : PLAYER.walk;
    const tx = mv.x * speed;
    const ty = mv.y * speed;
    p.vx += (tx - p.vx) * Math.min(1, dt * 10);
    p.vy += (ty - p.vy) * Math.min(1, dt * 10);
    p.moving = Math.hypot(p.vx, p.vy) > 12;
    if (p.moving) {
      p.facing = Math.atan2(p.vy, p.vx);
      if (game.time - p.stepAt > 0.34) {
        p.stepAt = game.time;
        if (!sneaking) sfx.step();
      }
    }
    moveCircle(p, p.vx * dt, p.vy * dt, game.obstacles);

    // Coin toss: click to throw, the nearest guard walks over to look.
    const click = input.takeClick();
    if (click && game.coins > 0 && !auto) {
      game.coins -= 1;
      game.coinsThrown.push({ x: click.x, y: click.y, t: 0.6 });
      const g = nearestGuard(game, click.x, click.y);
      if (g) {
        g.investigate = { x: click.x, y: click.y };
        g.investigateLeft = 3.5;
      }
      sfx.throwCoin();
    }
    if (input.wasPressed('f') && game.smoke > 0) {
      game.smoke -= 1;
      game.smokeClouds.push({ x: p.x, y: p.y, r: 90, left: 4 });
      sfx.smoke();
      say(game, 'Smoke out — you are hidden inside the cloud.', 2);
    }
    if (input.wasPressed('e')) {
      const def = game.level;
      if (def.safe && dist(p.x, p.y, def.safe.x + def.safe.w / 2, def.safe.y + def.safe.h / 2) < 120 && !game.targetTaken) {
        startSafeCrack(game);
      }
    }
    // Loot: walk over pocket loot; the target piece needs a held E to lift.
    for (const l of game.loot) {
      if (l.taken) continue;
      const d = dist(p.x, p.y, l.x, l.y);
      if (l.id === game.level.targetId) {
        if (d < 56 && input.interacting()) {
          game.channel = (game.channel ?? 0) + dt;
          if (game.channel >= 0.9) {
            l.taken = true;
            game.targetTaken = true;
            game.channel = null;
            game.score += LOOT_KINDS[l.kind].value;
            game.lootValue += LOOT_KINDS[l.kind].value;
            sfx.target();
            say(game, `${LOOT_KINDS[l.kind].label} secured — get to the exit!`, 3);
          }
        } else if (d >= 56) {
          game.channel = null;
        }
      } else if (d < 50) {
        l.taken = true;
        game.score += LOOT_KINDS[l.kind].value;
        game.lootValue += LOOT_KINDS[l.kind].value;
        sfx.pickup();
      }
    }
  }

  // Coins on the floor fade; smoke clears.
  for (const c of game.coinsThrown) c.t -= dt;
  game.coinsThrown = game.coinsThrown.filter((c) => c.t > 0);
  for (const c of game.smokeClouds) c.left -= dt;
  game.smokeClouds = game.smokeClouds.filter((c) => c.left > 0);

  // Patrols, cameras and lasers keep moving.
  for (const g of game.guards) updateGuard(game, g, dt);
  for (const cam of game.cameras) updateCamera(cam, dt);
  for (const l of game.lasers) updateLaser(l, dt);

  // Detection: guards, cameras and lasers all feed the same alarm meter.
  let seen = 0;
  let seenBy = '';
  const range = (input.sneaking() && !game.safe ? VISION.sneakRange : VISION.guardRange);
  for (const g of game.guards) {
    const d = dist(g.x, g.y, p.x, p.y);
    if (!hidden && d < 30) {
      seen = Math.max(seen, ALARM.guardRate * 2.2);
      seenBy = 'bumped into a guard';
      g.alert = 2.5;
    } else if (!hidden && inCone(g.x, g.y, g.facing, range, VISION.guardHalf, p.x, p.y, game.obstacles)) {
      seen = Math.max(seen, ALARM.guardRate);
      seenBy = 'spotted by a guard';
      g.alert = 2;
    }
  }
  for (const cam of game.cameras) {
    if (!hidden && inCone(cam.x, cam.y, cam.angle, VISION.cameraRange, VISION.cameraHalf, p.x, p.y, game.obstacles)) {
      seen = Math.max(seen, ALARM.cameraRate);
      seenBy = 'caught on camera';
    }
  }
  for (const l of game.lasers) {
    if (hidden) continue;
    const gapX = l.x1 + (l.x2 - l.x1) * l.pos;
    const gapY = l.y1 + (l.y2 - l.y1) * l.pos;
    const dBeam = pointSegmentDistance(p.x, p.y, l.x1, l.y1, l.x2, l.y2);
    const dGap = dist(p.x, p.y, gapX, gapY);
    if (dBeam < p.r + 4 && dGap > l.gap / 2) {
      seen = Math.max(seen, ALARM.laserRate);
      seenBy = 'tripped a laser';
      if (game.time - (game.laserZapAt ?? -9) > 0.8) {
        game.laserZapAt = game.time;
        sfx.laserZap();
      }
    }
  }
  if (seen > 0) {
    game.alarm = Math.min(100, game.alarm + seen * dt);
    if (game.alarm > 55 && game.time - game.alarmSoundAt > 1.1) {
      game.alarmSoundAt = game.time;
      sfx.alarmLoop();
    }
    if (!game.spottedAt || game.time - game.spottedAt > 2) {
      game.spottedAt = game.time;
      sfx.spotted();
    }
  } else {
    game.alarm = Math.max(0, game.alarm - ALARM.decay * dt);
  }

  // Caught: the alarm peaks, the night is over for this wing.
  if (game.alarm >= ALARM.caughtAt) {
    game.lives -= 1;
    game.caughtReason = seenBy || 'the alarm peaked';
    game.screen = SCREEN_CAUGHT;
    sfx.caught();
    return;
  }

  // Exit opens once the target is taken.
  const exit = game.level.exit;
  if (game.targetTaken && pointInRect(p.x, p.y, exit)) {
    const timeBonus = Math.max(0, 600 - Math.floor(game.levelTime) * 5);
    const alarmBonus = Math.round((100 - game.alarm) * 2);
    game.score += timeBonus + alarmBonus;
    sfx.levelClear();
    if (game.levelIndex + 1 >= LEVELS.length) {
      game.screen = SCREEN_WIN;
      sfx.win();
    } else {
      game.screen = SCREEN_CLEAR;
      game.clearBonus = { timeBonus, alarmBonus };
    }
  }
}

export { STEP };
