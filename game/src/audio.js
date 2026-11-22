// Every sound in the game is synthesized live with WebAudio: no audio files,
// no network, just oscillators and filtered noise shaped into the heist's own
// footsteps, coin clinks, safe clicks, alarm siren and a low bassline loop.
let ctx = null;
let muted = false;
let musicTimer = null;
let musicStep = 0;
let master = null;

// A slow, sneaky bassline in A minor, one note per beat, with a soft hat tick.
const BASSLINE = [55, 0, 55, 65.41, 0, 55, 49, 61.74];
const BEAT_SECONDS = 0.42;

function ensureContext() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  return ctx;
}

export function unlockAudio() {
  const c = ensureContext();
  if (c && c.state === 'suspended') void c.resume();
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.5;
  return muted;
}

function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
  const c = ensureContext();
  if (!c || muted) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, vol, filterFreq, when = 0) {
  const c = ensureContext();
  if (!c || muted) return;
  const t0 = c.currentTime + when;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buffer = c.createBuffer(1, len, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const gain = c.createGain();
  gain.gain.value = vol;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start(t0);
}

export const sfx = {
  step() {
    noiseBurst(0.05, 0.05, 700);
  },
  coin() {
    tone(1568, 0.09, 'sine', 0.16);
    tone(2093, 0.14, 'sine', 0.12, 0.06);
  },
  pickup() {
    tone(880, 0.1, 'triangle', 0.18);
    tone(1318, 0.16, 'triangle', 0.14, 0.07);
  },
  target() {
    tone(523, 0.12, 'triangle', 0.2);
    tone(659, 0.12, 'triangle', 0.2, 0.1);
    tone(784, 0.12, 'triangle', 0.2, 0.2);
    tone(1046, 0.3, 'triangle', 0.2, 0.3);
  },
  throwCoin() {
    noiseBurst(0.08, 0.1, 2400);
    tone(2093, 0.08, 'sine', 0.1, 0.18);
  },
  smoke() {
    noiseBurst(0.5, 0.14, 500);
  },
  click() {
    tone(1200, 0.05, 'square', 0.12);
  },
  safeTick() {
    tone(1800, 0.04, 'square', 0.1);
  },
  safeOpen() {
    tone(392, 0.15, 'triangle', 0.2);
    tone(523, 0.15, 'triangle', 0.2, 0.12);
    tone(659, 0.3, 'triangle', 0.2, 0.24);
  },
  spotted() {
    tone(440, 0.16, 'sawtooth', 0.14, 0, 660);
  },
  caught() {
    tone(330, 0.25, 'sawtooth', 0.2, 0, 165);
    tone(220, 0.4, 'sawtooth', 0.2, 0.22, 110);
  },
  laserZap() {
    tone(1200, 0.12, 'sawtooth', 0.12, 0, 300);
  },
  levelClear() {
    tone(523, 0.14, 'triangle', 0.2);
    tone(659, 0.14, 'triangle', 0.2, 0.12);
    tone(784, 0.14, 'triangle', 0.2, 0.24);
    tone(1046, 0.4, 'triangle', 0.22, 0.36);
  },
  win() {
    [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone(f, 0.22, 'triangle', 0.2, i * 0.13));
  },
  alarmLoop() {
    tone(740, 0.22, 'square', 0.07);
    tone(554, 0.22, 'square', 0.07, 0.24);
  },
};

export function startMusic() {
  const c = ensureContext();
  if (!c || musicTimer) return;
  musicStep = 0;
  musicTimer = window.setInterval(() => {
    if (muted || !ctx) return;
    const note = BASSLINE[musicStep % BASSLINE.length];
    if (note) tone(note, BEAT_SECONDS * 0.9, 'triangle', 0.11);
    if (musicStep % 2 === 0) noiseBurst(0.03, 0.025, 6000);
    musicStep += 1;
  }, BEAT_SECONDS * 1000);
}

export function stopMusic() {
  if (musicTimer) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
}
