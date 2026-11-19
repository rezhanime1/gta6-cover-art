// Wires the Vice Cover editor: pick a sample photo or upload one, type the
// title and subtitle, choose a grade, a panel layout and an export size,
// nudge the crop with zoom and pan, and export the poster as a PNG.
// A `?shot=` query sets up a fixed scene for a screenshot instead (see
// ./shots.js). The poster itself is painted by ./cover.js.
import { GRADES, LAYOUTS, SIZES, renderPoster } from './cover.js';
import { setupShot } from './shots.js';

const canvas = document.getElementById('poster');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const statusLine = document.getElementById('status');

const state = {
  photo: null,
  title: 'SUNSET HEIST',
  subtitle: 'VICE CITY • 2026',
  grade: 'sunset',
  layout: 'triptych',
  size: '1080x1080',
  zoom: 1,
  panX: 0,
  panY: 0,
};

function redraw() {
  renderPoster(canvas, state);
  const [w, h] = SIZES[state.size];
  canvas.style.aspectRatio = `${w} / ${h}`;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

async function useSample(name) {
  state.photo = await loadImage(`samples/${name}.jpg`);
  document.querySelectorAll('[data-photo]').forEach((b) => {
    b.classList.toggle('on', b.dataset.photo === name);
  });
  redraw();
}

function markActive(selector, key, value) {
  document.querySelectorAll(selector).forEach((b) => {
    b.classList.toggle('on', b.dataset[key] === value);
  });
}

document.querySelectorAll('[data-photo]').forEach((b) => {
  b.addEventListener('click', () => useSample(b.dataset.photo).catch((e) => {
    statusLine.textContent = e.message;
  }));
});

document.getElementById('upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  document.querySelectorAll('[data-photo]').forEach((b) => b.classList.remove('on'));
  state.photo = await loadImage(URL.createObjectURL(file));
  statusLine.textContent = `Loaded ${file.name}`;
  redraw();
});

titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });

document.querySelectorAll('[data-grade]').forEach((b) => {
  b.addEventListener('click', () => {
    state.grade = b.dataset.grade;
    markActive('[data-grade]', 'grade', state.grade);
    redraw();
  });
});
document.querySelectorAll('[data-layout]').forEach((b) => {
  b.addEventListener('click', () => {
    state.layout = b.dataset.layout;
    markActive('[data-layout]', 'layout', state.layout);
    redraw();
  });
});

document.getElementById('size').addEventListener('change', (e) => {
  state.size = e.target.value;
  redraw();
});
document.getElementById('zoom').addEventListener('input', (e) => {
  state.zoom = Number(e.target.value);
  document.getElementById('zoomVal').textContent = `${state.zoom.toFixed(2)}×`;
  redraw();
});
document.getElementById('panx').addEventListener('input', (e) => {
  state.panX = Number(e.target.value);
  redraw();
});
document.getElementById('pany').addEventListener('input', (e) => {
  state.panY = Number(e.target.value);
  redraw();
});

document.getElementById('export').addEventListener('click', () => {
  canvas.toBlob((blob) => {
    if (!blob) {
      statusLine.textContent = 'Export failed: the canvas was empty.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${state.size}.png`;
    a.click();
    statusLine.textContent = `Saved vice-cover-${state.size}.png`;
  }, 'image/png');
});

// Grade and layout buttons carry their names in data-grade / data-layout.
markActive('[data-grade]', 'grade', state.grade);
markActive('[data-layout]', 'layout', state.layout);

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  setupShot(shot, new URLSearchParams(location.search), async (scene) => {
    state.grade = scene.grade in GRADES ? scene.grade : 'sunset';
    state.layout = LAYOUTS.includes(scene.layout) ? scene.layout : 'triptych';
    state.size = scene.size in SIZES ? scene.size : '1080x1080';
    state.title = scene.title;
    state.subtitle = scene.subtitle;
    titleInput.value = scene.title;
    subtitleInput.value = scene.subtitle;
    document.getElementById('size').value = state.size;
    markActive('[data-grade]', 'grade', state.grade);
    markActive('[data-layout]', 'layout', state.layout);
    state.photo = await loadImage(`samples/${scene.photo}.jpg`);
    redraw();
  }).catch((e) => { statusLine.textContent = e.message; });
} else {
  useSample('pier').catch((e) => { statusLine.textContent = e.message; });
}
