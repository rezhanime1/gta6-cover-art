// Vice Cover renderer: paints a GTA-style poster onto a canvas with the 2D API.
// A poster is a sky strip (striped sun + palm silhouettes), a set of photo
// panels in one of four layouts, a halftone band, and a big outlined title
// over a subtitle. No assets, no network: every pixel comes from code.

export const GRADES = {
  sunset: {
    skyTop: '#1c0b33', skyMid: '#7a2a6d', skyBot: '#ff7e3d',
    sunTop: '#ffd166', sunBot: '#ff5e62', ink: '#fff6e8', accent: '#ffd166',
    gap: '#140824', tint: 'rgba(255, 110, 60, 0.14)', band: '#160a26',
  },
  neon: {
    skyTop: '#070418', skyMid: '#2a1a5e', skyBot: '#7c2d8e',
    sunTop: '#67e8f9', sunBot: '#e879f9', ink: '#f4efff', accent: '#22d3ee',
    gap: '#05030f', tint: 'rgba(90, 70, 255, 0.18)', band: '#0a0524',
  },
  noir: {
    skyTop: '#0a0a0a', skyMid: '#333333', skyBot: '#8a8a8a',
    sunTop: '#fafafa', sunBot: '#8f8f8f', ink: '#fafafa', accent: '#e11d2e',
    gap: '#000000', tint: 'rgba(0, 0, 0, 0.28)', band: '#0d0d0d',
  },
};

export const LAYOUTS = ['triptych', 'split', 'hero', 'stack'];

export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

// Geometry of one poster: sky strip on top, photo panels in the middle,
// title band at the bottom. Returns the panels as rects with a focus point
// (where the photo's centre should sit inside each panel).
export function posterGeometry(w, h, layout) {
  const skyH = Math.round(h * 0.16);
  const bandH = Math.round(h * 0.2);
  const top = skyH;
  const bottom = h - bandH;
  const gap = Math.max(4, Math.round(w * 0.012));
  const area = { x: 0, y: top, w, h: bottom - top };
  let panels = [];
  if (layout === 'triptych') {
    const pw = (area.w - gap * 2) / 3;
    panels = [0, 1, 2].map((i) => ({
      x: area.x + i * (pw + gap), y: area.y, w: pw, h: area.h,
      fx: [0.22, 0.5, 0.78][i], fy: 0.5,
    }));
  } else if (layout === 'split') {
    const leftW = area.w * 0.62 - gap / 2;
    const rightX = area.x + leftW + gap;
    const rightW = area.w - leftW - gap;
    const rh = (area.h - gap) / 2;
    panels = [
      { x: area.x, y: area.y, w: leftW, h: area.h, fx: 0.5, fy: 0.5 },
      { x: rightX, y: area.y, w: rightW, h: rh, fx: 0.72, fy: 0.42 },
      { x: rightX, y: area.y + rh + gap, w: rightW, h: rh, fx: 0.28, fy: 0.58 },
    ];
  } else if (layout === 'stack') {
    const th = area.h * 0.58 - gap / 2;
    panels = [
      { x: area.x, y: area.y, w: area.w, h: th, fx: 0.5, fy: 0.35 },
      { x: area.x, y: area.y + th + gap, w: area.w, h: area.h - th - gap, fx: 0.5, fy: 0.65 },
    ];
  } else {
    panels = [{ x: area.x, y: area.y, w: area.w, h: area.h, fx: 0.5, fy: 0.5 }];
  }
  return { skyH, bandH, panels, gap };
}

function coverDrawRect(img, box, fx, fy, zoom, panX, panY) {
  const scale = Math.max(box.w / img.naturalWidth, box.h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  return {
    dx: box.x + (box.w - dw) * fx + panX * box.w,
    dy: box.y + (box.h - dh) * fy + panY * box.h,
    dw, dh,
  };
}

// The retro slatted sun: a disc with horizontal gaps cut out of its lower
// half, drawn on a scratch canvas so the gaps stay transparent.
function stripedSun(diameter, top, bottom) {
  const c = document.createElement('canvas');
  c.width = diameter;
  c.height = diameter;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, diameter);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  g.fillStyle = grad;
  g.beginPath();
  g.arc(diameter / 2, diameter / 2, diameter / 2, 0, Math.PI * 2);
  g.fill();
  g.globalCompositeOperation = 'destination-out';
  let y = diameter * 0.52;
  let cut = diameter * 0.035;
  while (y < diameter) {
    g.fillRect(0, y, diameter, cut);
    y += cut * 2.6;
    cut *= 1.5;
  }
  return c;
}

// One palm silhouette: a leaning trunk and a crown of drooping fronds.
function palm(g, x, y, s, color) {
  g.strokeStyle = color;
  g.fillStyle = color;
  g.lineCap = 'round';
  g.lineWidth = Math.max(2, s * 0.07);
  g.beginPath();
  g.moveTo(x, y);
  g.quadraticCurveTo(x + s * 0.1, y - s * 0.55, x + s * 0.28, y - s);
  g.stroke();
  const cx = x + s * 0.28;
  const cy = y - s;
  g.lineWidth = Math.max(1.5, s * 0.045);
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * (0.08 + i * 0.16);
    const ex = cx + Math.cos(a) * s * 0.55;
    const ey = cy + Math.sin(a) * s * 0.3 + s * 0.22;
    const mx = cx + Math.cos(a) * s * 0.3;
    const my = cy - s * 0.08;
    g.beginPath();
    g.moveTo(cx, cy);
    g.quadraticCurveTo(mx, my, ex, ey);
    g.stroke();
  }
  g.beginPath();
  g.arc(cx, cy, s * 0.07, 0, Math.PI * 2);
  g.fill();
}

// A field of halftone dots whose size swells and fades across the band.
function halftone(g, x, y, w, h, color) {
  const step = Math.max(10, Math.round(w / 72));
  g.fillStyle = color;
  for (let row = 0; row * step < h; row++) {
    for (let col = 0; col * step < w; col++) {
      const t = row / Math.max(1, Math.floor(h / step));
      const r = step * 0.16 * (0.4 + Math.sin(t * Math.PI) * 0.9);
      g.beginPath();
      g.arc(x + col * step + step / 2, y + row * step + step / 2, r, 0, Math.PI * 2);
      g.fill();
    }
  }
}

function fitFont(g, text, maxWidth, startSize) {
  let size = startSize;
  g.font = `900 ${size}px 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif`;
  while (size > 14 && g.measureText(text).width > maxWidth) {
    size -= 2;
    g.font = `900 ${size}px 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif`;
  }
  return size;
}

// Draws the whole poster. `state` holds the photo (an image or null), the
// title and subtitle, the grade and layout names, the size key, and the
// crop controls (zoom, panX, panY as fractions of the panel).
export function renderPoster(canvas, state) {
  const [w, h] = SIZES[state.size] ?? SIZES['1080x1080'];
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d');
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const geo = posterGeometry(w, h, state.layout);
  const unit = w / 1080;

  // Sky strip with the grade's gradient.
  const sky = g.createLinearGradient(0, 0, 0, geo.skyH);
  sky.addColorStop(0, grade.skyTop);
  sky.addColorStop(0.55, grade.skyMid);
  sky.addColorStop(1, grade.skyBot);
  g.fillStyle = sky;
  g.fillRect(0, 0, w, geo.skyH);

  // Striped sun, sized to sit fully inside the sky strip so its slats show;
  // palms, left of it.
  const sunD = Math.round(geo.skyH * 0.88);
  const sun = stripedSun(sunD, grade.sunTop, grade.sunBot);
  g.drawImage(sun, w - sunD * 1.15, geo.skyH * 0.06, sunD, sunD);
  g.fillStyle = grade.gap;
  palm(g, w * 0.06, geo.skyH * 0.98, geo.skyH * 0.95, grade.gap);
  palm(g, w * 0.16, geo.skyH * 0.98, geo.skyH * 0.62, grade.gap);

  // Photo panels, each a cover-cropped view of the same photo.
  for (const panel of geo.panels) {
    g.save();
    g.beginPath();
    g.rect(panel.x, panel.y, panel.w, panel.h);
    g.clip();
    if (state.photo) {
      if (state.grade === 'noir') g.filter = 'grayscale(1) contrast(1.12)';
      const r = coverDrawRect(state.photo, panel, panel.fx, panel.fy, state.zoom, state.panX, state.panY);
      g.drawImage(state.photo, r.dx, r.dy, r.dw, r.dh);
      g.filter = 'none';
    } else {
      g.fillStyle = grade.band;
      g.fillRect(panel.x, panel.y, panel.w, panel.h);
    }
    g.fillStyle = grade.tint;
    g.fillRect(panel.x, panel.y, panel.w, panel.h);
    g.restore();
    g.fillStyle = grade.gap;
    g.fillRect(panel.x, panel.y, panel.w, Math.max(2, 3 * unit));
  }

  // Halftone strip where the panels meet the title band.
  g.save();
  g.globalAlpha = 0.5;
  halftone(g, 0, h - geo.bandH - 18 * unit, w, 18 * unit, grade.accent);
  g.restore();

  // Title band: dark ground, accent rule, huge outlined title, subtitle.
  const bandY = h - geo.bandH;
  g.fillStyle = grade.band;
  g.fillRect(0, bandY, w, geo.bandH);
  g.fillStyle = grade.accent;
  g.fillRect(0, bandY, w, Math.max(3, 5 * unit));

  const title = (state.title || '').trim().toUpperCase();
  if (title) {
    const size = fitFont(g, title, w * 0.92, geo.bandH * 0.52);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineJoin = 'round';
    g.lineWidth = Math.max(2, size * 0.07);
    g.strokeStyle = grade.gap;
    g.fillStyle = grade.ink;
    const ty = bandY + geo.bandH * 0.42;
    g.strokeText(title, w / 2, ty);
    g.fillText(title, w / 2, ty);
  }
  const sub = (state.subtitle || '').trim().toUpperCase();
  if (sub) {
    const size = Math.max(12, geo.bandH * 0.15);
    g.font = `700 ${size}px 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif`;
    try { g.letterSpacing = `${Math.round(size * 0.35)}px`; } catch { /* older canvas: no tracking */ }
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = grade.accent;
    g.fillText(sub, w / 2, bandY + geo.bandH * 0.82);
    try { g.letterSpacing = '0px'; } catch { /* reset */ }
  }
}
