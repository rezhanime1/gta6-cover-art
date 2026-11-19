// Fixed scenes for screenshots: ?shot=editor shows the page with a sample photo
// loaded; ?shot=cover shows the cover alone, filling the viewport. The query
// picks the photo, caption, subtitle, preset, size and layout, then the scene
// paints and window.__shotReady is set. `api` is the editor's live state and
// helpers, passed in from main.js.

/** Applies a shot's query to the editor state and renders it. */
export async function runShot(shot, query, api) {
  const { state, photos, loadImage, renderAndMark, buildPanelRows, syncPanels } = api;
  if (shot === 'cover') document.body.classList.add('shot-cover');

  const pier = await loadImage('samples/pier.jpg');
  const boulevard = await loadImage('samples/boulevard.jpg');
  photos.push({ name: 'Pier at dusk', img: pier });
  photos.push({ name: 'Boulevard', img: boulevard });

  const wanted = query.get('photo') ?? 'pier';
  const pick = wanted === 'boulevard' ? 1 : 0;
  state.preset = query.get('preset') ?? 'sunset';
  state.layout = query.get('layout') ?? 'triptych';
  state.size = query.get('size') ?? '1920x1080';
  state.title = query.get('caption') ?? 'Sunset Heist';
  state.subtitle = query.get('subtitle') ?? 'VICE CITY • 2026';
  state.halftone = query.get('halftone') !== 'off';
  syncPanels();
  state.panels.forEach((panel, i) => {
    panel.photo = photos[(pick + i) % 2];
    panel.zoom = 1;
    panel.panX = 0.5;
    // Hero panels crop hardest vertically: aim the window at the face.
    panel.panY = state.layout === 'hero' ? 0.22 : (i % 2 ? 0.35 : 0.6);
  });
  buildPanelRows();
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  renderAndMark();
  // `?shot=export` exercises the same export button a user clicks.
  if (shot === 'export') document.getElementById('export').click();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
