// Renders a GTA 6-style poster onto a canvas: multi-panel photo composition,
// a Vice City sunset or neon sky with a striped sun and palm silhouettes,
// halftone texture, and bold condensed caption lettering. Everything is drawn
// procedurally — no Rockstar artwork, logo or font is used anywhere.

/** The three colour grades the app offers. */
export const PRESETS = {
  sunset: {
    name: 'Sunset',
    sky: ['#2b1055', '#7597de'],
    skyStops: [[0, '#1d0b3d'], [0.45, '#7b2d8b'], [0.75, '#ff6b4a'], [1, '#ffb347']],
    sun: ['#ffd76a', '#ff5e62'],
    sunGlow: 'rgba(255, 120, 60, 0.55)',
    gradeTop: 'rgba(255, 170, 90, 0.10)',
    gradeBottom: 'rgba(255, 80, 40, 0.30)',
    title: '#ffffff',
    titleShadow: '#ff5e62',
    accent: '#ffb347',
    border: '#ffffff',
    palm: 'rgba(20, 8, 30, 0.9)',
  },
  neon: {
    name: 'Neon Night',
    sky: ['#050214', '#1b0b3b'],
    skyStops: [[0, '#050214'], [0.55, '#1b0b3b'], [0.8, '#3b0f54'], [1, '#7a1e6e']],
    sun: ['#ff9de2', '#ff2e88'],
    sunGlow: 'rgba(255, 46, 136, 0.6)',
    gradeTop: 'rgba(0, 229, 255, 0.14)',
    gradeBottom: 'rgba(255, 0, 128, 0.24)',
    title: '#e8fbff',
    titleShadow: '#00e5ff',
    accent: '#ff2e88',
    border: '#00e5ff',
    palm: 'rgba(5, 2, 20, 0.92)',
  },
  noir: {
    name: 'Noir',
    sky: ['#0c0c0e', '#2a2a30'],
    skyStops: [[0, '#0c0c0e'], [0.6, '#232329'], [1, '#3d3d46']],
    sun: ['#e8e8e8', '#9a9aa2'],
    sunGlow: 'rgba(200, 200, 210, 0.25)',
    gradeTop: 'rgba(255, 255, 255, 0.05)',
    gradeBottom: 'rgba(0, 0, 0, 0.30)',
    title: '#f5f5f5',
    titleShadow: '#d92626',
    accent: '#d92626',
    border: '#e8e8e8',
    palm: 'rgba(0, 0, 0, 0.9)',
  },
};

/** Panel layouts: how many photos the poster holds and where. */
export const LAYOUTS = {
  hero: { name: 'Hero', panels: 1 },
  split: { name: 'Split', panels: 2 },
  triptych: { name: 'Triptych', panels: 3 },
  quad: { name: 'Quad', panels: 4 },
};

/** Post sizes the app exports. */
export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: '1080 × 1080 square' },
  '1080x1350': { w: 1080, h: 1350, label: '1080 × 1350 portrait' },
  '1920x1080': { w: 1920, h: 1080, label: '1920 × 1080 wide' },
};

/** Panel rectangles for a layout: panels fill the top 70% of the poster. */
export function panelRects(layout, w, h) {
  const m = Math.round(w * 0.012);
  const g = Math.round(w * 0.008);
  const top = m;
  const height = Math.round(h * 0.7) - m;
  const width = w - 2 * m;
  const col = (x, cw) => ({ x, y: top, w: cw, h: height });
  switch (layout) {
    case 'split': {
      const cw = Math.round((width - g) / 2);
      return [col(m, cw), col(m + cw + g, width - cw - g)];
    }
    case 'triptych': {
      const side = Math.round((width - 2 * g) * 0.28);
      const mid = width - 2 * side - 2 * g;
      return [
        col(m, side),
        col(m + side + g, mid),
        col(m + side + g + mid + g, side),
      ];
    }
    case 'quad': {
      const cw = Math.round((width - g) / 2);
      const ch = Math.round((height - g) / 2);
      return [
        { x: m, y: top, w: cw, h: ch },
        { x: m + cw + g, y: top, w: width - cw - g, h: ch },
        { x: m, y: top + ch + g, w: cw, h: height - ch - g },
        { x: m + cw + g, y: top + ch + g, w: width - cw - g, h: height - ch - g },
      ];
    }
    default:
      return [col(m, width)];
  }
}

/** Fits a font size so `text` spans at most `maxWidth` (condensed 0.84 factor). */
function fitTitleFont(ctx, text, size, maxWidth) {
  let s = size;
  for (;;) {
    ctx.font = `900 ${s}px 'Arial Black', Impact, 'Arial Narrow', sans-serif`;
    if (ctx.measureText(text).width * 0.84 <= maxWidth || s <= 12) return s;
    s = Math.max(12, s - 4);
  }
}

/** Draws the caption in condensed, slanted, outlined capitals. */
export function drawTitle(ctx, text, cx, baseline, size, maxWidth, preset) {
  const clean = (text || '').trim().toUpperCase();
  if (!clean) return;
  const s = fitTitleFont(ctx, clean, size, maxWidth);
  ctx.save();
  ctx.translate(cx, baseline);
  ctx.transform(0.84, 0, -0.1, 1, 0, 0);
  ctx.font = `900 ${s}px 'Arial Black', Impact, 'Arial Narrow', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.fillStyle = preset.titleShadow;
  ctx.fillText(clean, s * 0.05, s * 0.06);
  ctx.lineWidth = s * 0.1;
  ctx.strokeStyle = '#0d0a12';
  ctx.strokeText(clean, 0, 0);
  ctx.fillStyle = preset.title;
  ctx.fillText(clean, 0, 0);
  ctx.restore();
  return s;
}

/** Draws the subtitle in spaced capitals with accent rules on each side. */
export function drawSubtitle(ctx, text, cx, y, size, maxWidth, preset) {
  const clean = (text || '').trim().toUpperCase();
  if (!clean) return;
  let s = size;
  ctx.font = `700 ${s}px 'Arial Narrow', 'Helvetica Neue', sans-serif`;
  try { ctx.letterSpacing = `${Math.round(s * 0.35)}px`; } catch { /* older canvas */ }
  while (ctx.measureText(clean).width > maxWidth && s > 10) {
    s -= 1;
    ctx.font = `700 ${s}px 'Arial Narrow', 'Helvetica Neue', sans-serif`;
  }
  const tw = ctx.measureText(clean).width;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = preset.accent;
  ctx.fillRect(cx - tw / 2 - s * 2.2, y - s * 0.08, s * 1.4, s * 0.16);
  ctx.fillRect(cx + tw / 2 + s * 0.8, y - s * 0.08, s * 1.4, s * 0.16);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(clean, cx, y);
  ctx.restore();
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
}

/** A sun disc with horizontal slats cut through its lower half, drawn offscreen. */
function drawStripedSun(ctx, cx, cy, r, preset) {
  const off = document.createElement('canvas');
  off.width = off.height = Math.ceil(r * 2 + 4);
  const o = off.getContext('2d');
  const g = o.createLinearGradient(0, 0, 0, off.height);
  g.addColorStop(0, preset.sun[0]);
  g.addColorStop(1, preset.sun[1]);
  o.fillStyle = g;
  o.beginPath();
  o.arc(off.width / 2, off.height / 2, r, 0, Math.PI * 2);
  o.fill();
  o.globalCompositeOperation = 'destination-out';
  let y = off.height * 0.52;
  let gap = Math.max(2, r * 0.03);
  while (y < off.height) {
    o.fillRect(0, y, off.width, gap);
    y += gap + Math.max(3, r * 0.06);
    gap *= 1.5;
  }
  ctx.save();
  ctx.shadowColor = preset.sunGlow;
  ctx.shadowBlur = r * 0.6;
  ctx.drawImage(off, cx - off.width / 2, cy - off.height / 2);
  ctx.restore();
}

/** One palm silhouette: a leaning trunk and drooping fronds, all strokes. */
function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2, s * 0.05);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.06, y - s * 0.55, x - s * 0.1, y - s * 0.95);
  ctx.stroke();
  const crownX = x - s * 0.1;
  const crownY = y - s * 0.95;
  ctx.lineWidth = Math.max(2, s * 0.045);
  const fronds = [
    [-0.55, -0.28, -0.95, -0.05], [-0.3, -0.5, -0.62, -0.42],
    [0.05, -0.55, 0.1, -0.62], [0.35, -0.42, 0.72, -0.5],
    [0.55, -0.18, 0.95, -0.12], [-0.5, -0.02, -0.85, 0.22],
    [0.45, -0.02, 0.8, 0.28],
  ];
  for (const [c1x, c1y, ex, ey] of fronds) {
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(crownX + c1x * s, crownY + c1y * s, crownX + ex * s, crownY + ey * s);
    ctx.stroke();
  }
  ctx.restore();
}

/** A synthwave perspective grid across a band (neon preset). */
function drawGridFloor(ctx, y0, y1, w, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = Math.max(1, w * 0.001);
  const cx = w / 2;
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * w * 0.06, y0);
    ctx.lineTo(cx + i * w * 0.28, y1);
    ctx.stroke();
  }
  let y = y0;
  let step = (y1 - y0) * 0.08;
  while (y < y1) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
    y += step;
    step *= 1.45;
  }
  ctx.restore();
}

/** Halftone dots, growing toward the bottom of a rectangle. */
function drawHalftone(ctx, rect, scale, color) {
  const spacing = Math.max(7, 10 * scale);
  const maxR = 2.6 * scale;
  ctx.save();
  ctx.fillStyle = color;
  for (let y = rect.y + spacing / 2; y < rect.y + rect.h; y += spacing) {
    const t = (y - rect.y) / rect.h;
    if (t < 0.25) continue;
    const r = maxR * (t - 0.25) * (t - 0.25) * 1.78;
    if (r < 0.5) continue;
    for (let x = rect.x + spacing / 2; x < rect.x + rect.w; x += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Draws one photo cover-fit into a panel rect, with zoom and pan (0..1). */
function drawPanelPhoto(ctx, photo, rect, zoom, panX, panY) {
  const scale = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight) * zoom;
  const pw = photo.naturalWidth * scale;
  const ph = photo.naturalHeight * scale;
  const x = rect.x + (rect.w - pw) * panX;
  const y = rect.y + (rect.h - ph) * panY;
  ctx.drawImage(photo, x, y, pw, ph);
}

/** The colour grade over a panel photo, per preset. */
function drawPanelGrade(ctx, rect, preset) {
  const g = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  g.addColorStop(0, preset.gradeTop);
  g.addColorStop(1, preset.gradeBottom);
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  if (preset === PRESETS.noir) {
    ctx.save();
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = '#808080';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  }
}

/** A diagonal-striped placeholder where a panel has no photo yet. */
function drawEmptyPanel(ctx, rect, preset) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  g.addColorStop(0, preset.sky[0]);
  g.addColorStop(1, preset.sky[1]);
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = Math.max(2, rect.w * 0.004);
  for (let x = -rect.h; x < rect.w + rect.h; x += rect.w * 0.09) {
    ctx.beginPath();
    ctx.moveTo(rect.x + x, rect.y + rect.h);
    ctx.lineTo(rect.x + x + rect.h, rect.y);
    ctx.stroke();
  }
  ctx.restore();
}

/** The whole poster. `state` holds size, layout, preset, title, subtitle,
 *  halftone and panels: [{ photo: image|null, zoom, panX, panY }]. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const scale = w / 1080;
  const preset = PRESETS[state.preset] ?? PRESETS.sunset;

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  for (const [stop, color] of preset.skyStops) sky.addColorStop(stop, color);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const bandY = Math.round(h * 0.72);
  const bandH = h - bandY;
  drawStripedSun(ctx, w * 0.5, bandY + bandH * 0.3, Math.min(w, h) * 0.15, preset);
  if (state.preset === 'neon') {
    drawGridFloor(ctx, bandY + bandH * 0.55, h, w, preset.accent);
  }
  drawPalm(ctx, w * 0.045, h * 0.995, bandH * 0.85, preset.palm);
  drawPalm(ctx, w * 0.955, h * 0.995, bandH * 0.78, preset.palm);

  const rects = panelRects(state.layout, w, h);
  const bw = Math.max(2, Math.round(5 * scale));
  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    const panel = state.panels[i] ?? {};
    const img = panel.photo && panel.photo.img ? panel.photo.img : panel.photo ?? null;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (img) {
      drawPanelPhoto(ctx, img, rect, panel.zoom ?? 1, panel.panX ?? 0.5, panel.panY ?? 0.5);
      drawPanelGrade(ctx, rect, preset);
    } else {
      drawEmptyPanel(ctx, rect, preset);
    }
    if (state.halftone) drawHalftone(ctx, rect, scale, 'rgba(0,0,0,0.45)');
    const shade = ctx.createLinearGradient(0, rect.y + rect.h * 0.7, 0, rect.y + rect.h);
    shade.addColorStop(0, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = shade;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    ctx.save();
    if (state.preset === 'neon') {
      ctx.shadowColor = preset.border;
      ctx.shadowBlur = 14 * scale;
    }
    ctx.lineWidth = bw;
    ctx.strokeStyle = preset.border;
    ctx.strokeRect(rect.x + bw / 2, rect.y + bw / 2, rect.w - bw, rect.h - bw);
    ctx.restore();
  }

  const titleSize = Math.round(h * 0.115);
  drawTitle(ctx, state.title, w / 2, bandY + bandH * 0.52, titleSize, w * 0.92, preset);
  drawSubtitle(ctx, state.subtitle, w / 2, bandY + bandH * 0.82, Math.round(h * 0.032), w * 0.8, preset);

  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}
