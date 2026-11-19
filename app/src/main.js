// Wires the Vice Cover editor: pick a size, grade and panel layout, load photos
// into the panels, tune each panel's crop, edit the caption, and export the
// poster as a PNG. A `?shot=` query sets up a fixed scene for a screenshot
// instead (see shots.js). Photos are read on this machine only, never uploaded.

import { drawPoster, LAYOUTS, GRADES, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const panelRows = document.getElementById('panelRows');

/** The editor's state; panels grow or shrink with the layout. */
const state = {
  size: '1920x1080',
  layout: 'triptych',
  grade: 'sunset',
  title: 'SUNSET HEIST',
  subtitle: 'VICE CITY • 2026',
  halftone: true,
  panels: [],
};

/** Photos the editor knows: the two samples, then anything the user uploads. */
const photos = [];
let activePanel = 0;

/** Fresh panels for a layout, seeded with the samples in rotation. */
function freshPanels(layout) {
  const count = LAYOUTS[layout].panels;
  const seed = [0, 1, 0, 1];
  return Array.from({ length: count }, (_, i) => ({
    photo: photos[seed[i]] ?? null,
    zoom: 1,
    panX: 0.5,
    panY: 0.5,
  }));
}

/** Grows or trims the panel list to match the current layout. */
function syncPanels() {
  const want = LAYOUTS[state.layout].panels;
  const seed = [0, 1, 0, 1];
  while (state.panels.length < want) {
    const i = state.panels.length;
    state.panels.push({ photo: photos[seed[i]] ?? null, zoom: 1, panX: 0.5, panY: 0.5 });
  }
  state.panels.length = want;
  if (activePanel >= want) activePanel = 0;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Renders the poster at export size into an offscreen canvas, then copies it
 *  into the visible preview, so the preview is exactly what exports. */
function render() {
  const { w, h } = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawPoster(off, { ...state, panels: state.panels.map((p) => ({ ...p })) });
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(off, 0, 0);
  return off;
}

/** Re-renders and marks the pressed buttons as active. */
function renderAndMark() {
  render();
  for (const [attr, key] of [['size', 'size'], ['grade', 'grade'], ['layout', 'layout']]) {
    document.querySelectorAll(`[data-${attr}]`).forEach((b) =>
      b.classList.toggle('on', b.dataset[attr] === state[key]));
  }
}

/** One control row per panel: which photo it shows, and its crop sliders. */
function buildPanelRows() {
  panelRows.innerHTML = '';
  state.panels.forEach((panel, i) => {
    const row = document.createElement('div');
    row.className = 'panel-row' + (i === activePanel ? ' active' : '');
    row.innerHTML = `
      <button type="button" class="panel-tab">Panel ${i + 1}</button>
      <label>Photo
        <select>
          <option value="-1">Empty</option>
          ${photos.map((p, j) => `<option value="${j}">${p.name}</option>`).join('')}
        </select>
      </label>
      <label>Zoom <input type="range" min="1" max="2.5" step="0.05" value="${panel.zoom}"></label>
      <label>Pan X <input type="range" min="0" max="1" step="0.05" value="${panel.panX}"></label>
      <label>Pan Y <input type="range" min="0" max="1" step="0.05" value="${panel.panY}"></label>`;
    const [tab, select, zoom, panX, panY] = [
      row.querySelector('.panel-tab'),
      row.querySelector('select'),
      ...row.querySelectorAll('input[type=range]'),
    ];
    select.value = String(photos.indexOf(panel.photo));
    tab.addEventListener('click', () => { activePanel = i; buildPanelRows(); });
    select.addEventListener('change', () => {
      panel.photo = Number(select.value) < 0 ? null : photos[Number(select.value)];
      renderAndMark();
    });
    zoom.addEventListener('input', () => { panel.zoom = Number(zoom.value); renderAndMark(); });
    panX.addEventListener('input', () => { panel.panX = Number(panX.value); renderAndMark(); });
    panY.addEventListener('input', () => { panel.panY = Number(panY.value); renderAndMark(); });
    panelRows.appendChild(row);
  });
}

/** Binds a group of data-* buttons to one state field. */
function bindGroup(attr, apply) {
  document.querySelectorAll(`[data-${attr}]`).forEach((b) =>
    b.addEventListener('click', () => { apply(b.dataset[attr]); renderAndMark(); }));
}

bindGroup('size', (v) => { state.size = v; });
bindGroup('grade', (v) => { state.grade = v; });
bindGroup('layout', (v) => {
  state.layout = v;
  syncPanels();
  buildPanelRows();
});

document.getElementById('title').addEventListener('input', (e) => {
  state.title = e.target.value;
  renderAndMark();
});
document.getElementById('subtitle').addEventListener('input', (e) => {
  state.subtitle = e.target.value;
  renderAndMark();
});
document.getElementById('halftone').addEventListener('change', (e) => {
  state.halftone = e.target.checked;
  renderAndMark();
});

document.getElementById('upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const img = await loadImage(URL.createObjectURL(file));
    const name = file.name.replace(/\.[^.]+$/, '').slice(0, 24) || 'Uploaded photo';
    photos.push({ name, img });
    state.panels[activePanel].photo = photos[photos.length - 1];
    buildPanelRows();
    renderAndMark();
    status.textContent = `Loaded ${name} into panel ${activePanel + 1}.`;
  } catch {
    status.textContent = 'That file could not be read as an image.';
  }
  e.target.value = '';
});

document.getElementById('export').addEventListener('click', () => {
  const off = render();
  off.toBlob((blob) => {
    if (!blob) { status.textContent = 'Export failed — try again.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${state.size}.png`;
    a.click();
    status.textContent = `Saved vice-cover-${state.size}.png (${state.size.replace('x', ' × ')}).`;
  }, 'image/png');
});

/** Starts the editor: preload the samples, build the panel rows, render. */
export async function startEditor() {
  const pier = await loadImage('samples/pier.jpg');
  const boulevard = await loadImage('samples/boulevard.jpg');
  photos.push({ name: 'Pier at dusk', img: pier });
  photos.push({ name: 'Boulevard', img: boulevard });
  state.panels = freshPanels(state.layout);
  buildPanelRows();
  renderAndMark();
}

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), {
    state, photos, loadImage, renderAndMark, buildPanelRows, syncPanels,
  });
} else {
  startEditor();
}
