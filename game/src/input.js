// Keyboard and mouse state for the heist: WASD or arrows to move, Shift to sneak,
// E to interact, click to throw a coin, F for a smoke pellet, Space in the safe
// minigame, M to mute, R to restart the wing, Esc to pause.
export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  let mouse = { x: 0, y: 0, clicked: false };
  let clickPoint = null;

  function keyOf(e) {
    return e.key.length === 1 ? e.key.toLowerCase() : e.key;
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    const k = keyOf(e);
    if (!keys.has(k)) pressed.add(k);
    keys.add(k);
  });
  window.addEventListener('keyup', (e) => keys.delete(keyOf(e)));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse = {
      x: ((e.clientX - r.left) / r.width) * canvas.width,
      y: ((e.clientY - r.top) / r.height) * canvas.height,
      clicked: mouse.clicked,
    };
  });
  canvas.addEventListener('mousedown', (e) => {
    const r = canvas.getBoundingClientRect();
    clickPoint = {
      x: ((e.clientX - r.left) / r.width) * canvas.width,
      y: ((e.clientY - r.top) / r.height) * canvas.height,
    };
    mouse.clicked = true;
  });
  window.addEventListener('mouseup', () => {
    mouse.clicked = false;
  });

  return {
    get down() {
      return keys;
    },
    get mouse() {
      return mouse;
    },
    /** True once for the frame the key went down; call after the frame's update. */
    wasPressed(key) {
      return pressed.has(key);
    },
    /** The canvas point of the latest mouse-down this frame, or null. */
    takeClick() {
      const p = clickPoint;
      clickPoint = null;
      return p;
    },
    moveVector() {
      let x = 0;
      let y = 0;
      if (keys.has('a') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('d') || keys.has('ArrowRight')) x += 1;
      if (keys.has('w') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('s') || keys.has('ArrowDown')) y += 1;
      if (x !== 0 && y !== 0) {
        x *= Math.SQRT1_2;
        y *= Math.SQRT1_2;
      }
      return { x, y };
    },
    sneaking() {
      return keys.has('Shift');
    },
    interacting() {
      return keys.has('e');
    },
    endFrame() {
      pressed.clear();
    },
  };
}
