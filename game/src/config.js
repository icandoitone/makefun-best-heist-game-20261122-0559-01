// Shared constants and the three heist wings of the Aurelia Museum.
// Every number here is the game's own tuning: room sizes, patrol speeds, alarm rates.
export const VIEW = { width: 1280, height: 720 };
export const HUD_H = 64;
export const PLAY = { x: 8, y: HUD_H + 8, w: 1264, h: 640 };
export const STEP = 1 / 60;

export const PLAYER = { radius: 13, walk: 175, sneak: 95, accel: 1400 };
export const ALARM = { guardRate: 46, cameraRate: 62, laserRate: 85, decay: 7, caughtAt: 100 };
export const VISION = { guardRange: 225, guardHalf: 0.62, cameraRange: 260, cameraHalf: 0.5, sneakRange: 150 };

// Loot tiers: pocket change, gallery art, and the one piece the whole night is about.
export const LOOT_KINDS = {
  coin: { value: 100, radius: 9, label: 'Gold coin', color: '#f2c14e' },
  painting: { value: 500, radius: 14, label: 'Framed canvas', color: '#e08a4e' },
  sapphire: { value: 2000, radius: 16, label: 'Star of Aurelia', color: '#5ec8f2' },
  crown: { value: 1500, radius: 15, label: 'Duchess crown', color: '#d9a7ff' },
  bag: { value: 1200, radius: 16, label: 'Loot bag', color: '#9be15d' },
};

/**
 * One wing of the museum. Walls and display cases block movement and sight.
 * Guards walk their waypoint loop; cameras sweep from a wall mount; lasers are
 * beams with a gap that slides along them; the exit only opens once the target is taken.
 */
export const LEVELS = [
  {
    id: 'gallery',
    name: 'Wing I — The Grand Gallery',
    sub: 'Lift the Star of Aurelia from its case, then slip out the front door.',
    targetId: 'sapphire',
    playerStart: { x: 90, y: 640 },
    coins: 5,
    smoke: 2,
    walls: [
      { x: 300, y: 96, w: 16, h: 210 },
      { x: 300, y: 420, w: 16, h: 100 },
      { x: 300, y: 560, w: 16, h: 80 },
      { x: 640, y: 96, w: 16, h: 150 },
      { x: 640, y: 360, w: 16, h: 280 },
      { x: 950, y: 96, w: 16, h: 210 },
      { x: 950, y: 420, w: 16, h: 220 },
      { x: 430, y: 300, w: 40, h: 16 },
      { x: 790, y: 520, w: 160, h: 16 },
    ],
    cases: [
      { x: 380, y: 140, w: 120, h: 54, loot: 'painting-a' },
      { x: 700, y: 140, w: 120, h: 54, loot: 'painting-b' },
      { x: 380, y: 600, w: 120, h: 54, loot: 'coin-a' },
      { x: 1030, y: 300, w: 120, h: 54, loot: 'coin-b' },
      { x: 460, y: 330, w: 160, h: 70, loot: 'sapphire', grand: true },
    ],
    loot: [
      { id: 'coin-a', kind: 'coin', x: 440, y: 627 },
      { id: 'coin-b', kind: 'coin', x: 1090, y: 327 },
      { id: 'painting-a', kind: 'painting', x: 440, y: 167 },
      { id: 'painting-b', kind: 'painting', x: 760, y: 167 },
      { id: 'sapphire', kind: 'sapphire', x: 540, y: 365 },
    ],
    guards: [
      { path: [[180, 180], [180, 540], [480, 540], [480, 330], [180, 330]], speed: 62, wait: 1.2 },
      { path: [[1180, 180], [1180, 560], [1000, 560], [1000, 380], [1180, 380]], speed: 62, wait: 1.2 },
    ],
    cameras: [
      { x: 316, y: 96, base: Math.PI / 2, sweep: 1.1, speed: 0.55 },
      { x: 966, y: 640, base: -Math.PI / 2, sweep: 1.1, speed: 0.55 },
    ],
    lasers: [
      { x1: 330, y1: 400, x2: 630, y2: 400, gap: 110, pos: 0.5, speed: 0.22 },
    ],
    safe: null,
    exit: { x: 24, y: 620, w: 64, h: 72, label: 'FRONT DOOR' },
  },
  {
    id: 'vault',
    name: 'Wing II — The Vault Wing',
    sub: 'Crack the Duchess vault safe, take the crown, and leave by the service door.',
    targetId: 'crown',
    playerStart: { x: 90, y: 640 },
    coins: 5,
    smoke: 2,
    walls: [
      { x: 300, y: 96, w: 16, h: 170 },
      { x: 300, y: 380, w: 16, h: 260 },
      { x: 600, y: 96, w: 16, h: 130 },
      { x: 600, y: 340, w: 16, h: 300 },
      { x: 900, y: 96, w: 16, h: 170 },
      { x: 900, y: 380, w: 16, h: 260 },
      { x: 520, y: 260, w: 80, h: 16 },
      { x: 800, y: 470, w: 60, h: 16 },
      { x: 1030, y: 300, w: 130, h: 16 },
    ],
    cases: [
      { x: 380, y: 140, w: 120, h: 54, loot: 'coin-c' },
      { x: 700, y: 140, w: 120, h: 54, loot: 'painting-c' },
      { x: 380, y: 600, w: 120, h: 54, loot: 'coin-d' },
      { x: 1030, y: 560, w: 120, h: 54, loot: 'painting-d' },
    ],
    loot: [
      { id: 'coin-c', kind: 'coin', x: 440, y: 167 },
      { id: 'coin-d', kind: 'coin', x: 440, y: 627 },
      { id: 'painting-c', kind: 'painting', x: 760, y: 167 },
      { id: 'painting-d', kind: 'painting', x: 1090, y: 587 },
      { id: 'crown', kind: 'crown', x: 1150, y: 200 },
    ],
    guards: [
      { path: [[180, 180], [180, 560], [480, 560], [480, 300], [180, 300]], speed: 72, wait: 0.9 },
      { path: [[1180, 340], [1180, 660], [760, 660], [760, 340]], speed: 72, wait: 0.9 },
      { path: [[640, 300], [880, 300], [880, 660], [640, 660]], speed: 66, wait: 0.9 },
    ],
    cameras: [
      { x: 316, y: 96, base: Math.PI / 2, sweep: 1.2, speed: 0.7 },
      { x: 616, y: 640, base: -Math.PI / 2, sweep: 1.2, speed: 0.7 },
      { x: 916, y: 96, base: Math.PI / 2, sweep: 1.0, speed: 0.8 },
    ],
    lasers: [
      { x1: 330, y1: 380, x2: 590, y2: 380, gap: 90, pos: 0.3, speed: 0.3 },
      { x1: 930, y1: 380, x2: 1180, y2: 380, gap: 90, pos: 0.7, speed: -0.3 },
    ],
    safe: { x: 1090, y: 130, w: 110, h: 90, label: 'DUCHESS VAULT' },
    exit: { x: 24, y: 620, w: 64, h: 72, label: 'SERVICE DOOR' },
  },
  {
    id: 'roof',
    name: 'Wing III — The Rooftop Getaway',
    sub: 'Grab the loot bag and reach the skylight rope before the alarm peaks.',
    targetId: 'bag',
    playerStart: { x: 640, y: 640 },
    coins: 4,
    smoke: 2,
    alarmStart: 25,
    walls: [
      { x: 300, y: 200, w: 16, h: 180 },
      { x: 964, y: 200, w: 16, h: 180 },
      { x: 480, y: 380, w: 60, h: 16 },
      { x: 600, y: 380, w: 100, h: 16 },
      { x: 760, y: 380, w: 40, h: 16 },
      { x: 210, y: 480, w: 170, h: 16 },
      { x: 900, y: 480, w: 170, h: 16 },
    ],
    cases: [
      { x: 200, y: 140, w: 120, h: 54, loot: 'coin-e' },
      { x: 960, y: 140, w: 120, h: 54, loot: 'coin-f' },
      { x: 580, y: 180, w: 120, h: 54, loot: 'bag' },
    ],
    loot: [
      { id: 'coin-e', kind: 'coin', x: 260, y: 167 },
      { id: 'coin-f', kind: 'coin', x: 1020, y: 167 },
      { id: 'bag', kind: 'bag', x: 640, y: 207 },
    ],
    guards: [
      { path: [[180, 300], [180, 620], [560, 620], [560, 120], [180, 120]], speed: 80, wait: 0.7 },
      { path: [[1100, 300], [1100, 620], [720, 620], [720, 120], [1100, 120]], speed: 80, wait: 0.7 },
      { path: [[400, 140], [880, 140], [880, 300], [400, 300]], speed: 74, wait: 0.7 },
    ],
    cameras: [
      { x: 640, y: 96, base: Math.PI / 2, sweep: 1.4, speed: 0.9 },
      { x: 316, y: 640, base: -Math.PI / 2, sweep: 1.2, speed: 0.8 },
      { x: 964, y: 640, base: -Math.PI / 2, sweep: 1.2, speed: 0.8 },
    ],
    lasers: [
      { x1: 400, y1: 480, x2: 880, y2: 480, gap: 80, pos: 0.5, speed: 0.4 },
    ],
    safe: null,
    exit: { x: 608, y: 96, w: 64, h: 56, label: 'SKYLIGHT ROPE' },
  },
];
