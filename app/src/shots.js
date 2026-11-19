// Fixed scenes for screenshots: ?shot=editor shows the page with a sample
// photo loaded; ?shot=cover shows the cover alone, controls hidden.
// `photo` picks the sample (samples/<photo>.jpg); `caption` is the title,
// `subtitle` the small line under it, `grade` the colour grade, `layout`
// the panel layout and `size` the export size. window.__shotReady is set
// once the poster has been painted.
export async function setupShot(kind, params, apply) {
  if (kind === 'cover') document.body.classList.add('shot-cover');
  await apply({
    photo: params.get('photo') ?? 'pier',
    title: params.get('caption') ?? 'Sunset Heist',
    subtitle: params.get('subtitle') ?? 'VICE CITY • 2026',
    grade: params.get('grade') ?? 'sunset',
    layout: params.get('layout') ?? 'triptych',
    size: params.get('size') ?? '1080x1080',
  });
  await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  window.__shotReady = true;
}
