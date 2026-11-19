// Vice Cover's poster painter: draws a GTA 6-style cover onto a canvas.
// A Vice City sky (gradient + striped sun + palm silhouettes), a set of photo
// panels on top, and bold condensed caption lettering below. All art is drawn
// procedurally with canvas primitives — no Rockstar artwork, logo or font.

/** Colour grades. Each grade carries its sky ramp, sun colours, the tint it
 *  puts over photos, and the ink used for the caption and panel frames. */
export const GRADES = {
  sunset: {
    label: 'Sunset',
    sky: [[0, '#1d0b3d'], [0.42, '#7b2d8b'], [0.72, '#ff6b4a'], [1, '#ffb347']],
    sunTop: '#ffd76a',
    sunBottom: '#ff5e62',
    sunHalo: 'rgba(255, 120, 60, 0.55)',
    washTop: 'rgba(255, 170, 90, 0.10)',
    washBottom: 'rgba(255, 80, 40, 0.30)',
    ink: '#ffffff',
    inkEcho: '#ff5e62',
    accent: '#ffb347',
    frame: '#ffffff',
    palmInk: 'rgba(20, 8, 30, 0.9)',
  },
  neon: {
    label: 'Neon Night',
    sky: [[0, '#050214'], [0.5, '#1b0b3b'], [0.78, '#3b0f54'], [1, '#7a1e6e']],
    sunTop: '#ff9de2',
    sunBottom: '#ff2e88',
    sunHalo: 'rgba(255, 46, 136, 0.6)',
    washTop: 'rgba(0, 229, 255, 0.14)',
    washBottom: 'rgba(255, 0, 128, 0.24)',
    ink: '#e8fbff',
    inkEcho: '#00e5ff',
    accent: '#ff2e88',
    frame: '#00e5ff',
    palmInk: 'rgba(5, 2, 20, 0.92)',
  },
  noir: {
    label: 'Noir',
    sky: [[0, '#0c0c0e'], [0.55, '#232329'], [1, '#3d3d46']],
    sunTop: '#e8e8e8',
    sunBottom: '#9a9aa2',
    sunHalo: 'rgba(200, 200, 210, 0.25)',
    washTop: 'rgba(255, 255, 255, 0.05)',
    washBottom: 'rgba(0, 0, 0, 0.30)',
    ink: '#f5f5f5',
    inkEcho: '#d92626',
    accent: '#d92626',
    frame: '#e8e8e8',
    palmInk: 'rgba(0, 0, 0, 0.9)',
  },
};

/** How the poster splits its photo area into panels. */
export const LAYOUTS = {
  hero: { label: 'Hero', panels: 1 },
  split: { label: 'Split', panels: 2 },
  triptych: { label: 'Triptych', panels: 3 },
  quad: { label: 'Quad', panels: 4 },
};

/** Export sizes. */
export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: '1080 × 1080 square' },
  '1080x1350': { w: 1080, h: 1350, label: '1080 × 1350 portrait' },
  '1920x1080': { w: 1920, h: 1080, label: '1920 × 1080 wide' },
};

/** Panel rectangles for a layout. Panels occupy the top ~70% of the poster,
 *  inside a margin, with a small gutter between them. */
export function layoutPanels(layout, w, h) {
  const m = Math.round(w * 0.012);
  const g = Math.round(w * 0.008);
  const y = m;
  const ph = Math.round(h * 0.7) - m;
  const pw = w - 2 * m;
  const box = (x, y2, bw, bh) => ({ x, y: y2, w: bw, h: bh });
  if (layout === 'split') {
    const cw = Math.round((pw - g) / 2);
    return [box(m, y, cw, ph), box(m + cw + g, y, pw - cw - g, ph)];
  }
  if (layout === 'triptych') {
    const side = Math.round((pw - 2 * g) * 0.28);
    const mid = pw - 2 * side - 2 * g;
    return [
      box(m, y, side, ph),
      box(m + side + g, y, mid, ph),
      box(m + side + g + mid + g, y, side, ph),
    ];
  }
  if (layout === 'quad') {
    const cw = Math.round((pw - g) / 2);
    const ch = Math.round((ph - g) / 2);
    return [
      box(m, y, cw, ch),
      box(m + cw + g, y, pw - cw - g, ch),
      box(m, y + ch + g, cw, ph - ch - g),
      box(m + cw + g, y + ch + g, pw - cw - g, ph - ch - g),
    ];
  }
  return [box(m, y, pw, ph)];
}

/** Shrinks `size` until `text` fits `maxWidth` in the condensed title face. */
function fitTitle(ctx, text, size, maxWidth) {
  let s = size;
  for (;;) {
    ctx.font = `900 ${s}px 'Arial Black', Impact, 'Arial Narrow', sans-serif`;
    if (ctx.measureText(text).width * 0.84 <= maxWidth || s <= 12) return s;
    s = Math.max(12, s - 4);
  }
}

/** The big caption: slanted, squashed, dark-outlined capitals with a coloured
 *  echo offset down-right. `baseline` is where the text sits. */
export function paintTitle(ctx, text, cx, baseline, size, maxWidth, grade) {
  const clean = (text || '').trim().toUpperCase();
  if (!clean) return 0;
  const s = fitTitle(ctx, clean, size, maxWidth);
  ctx.save();
  ctx.translate(cx, baseline);
  ctx.transform(0.84, 0, -0.1, 1, 0, 0);
  ctx.font = `900 ${s}px 'Arial Black', Impact, 'Arial Narrow', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.fillStyle = grade.inkEcho;
  ctx.fillText(clean, s * 0.05, s * 0.06);
  ctx.lineWidth = s * 0.1;
  ctx.strokeStyle = '#0d0a12';
  ctx.strokeText(clean, 0, 0);
  ctx.fillStyle = grade.ink;
  ctx.fillText(clean, 0, 0);
  ctx.restore();
  return s;
}

/** The subtitle: wide-spaced capitals with a short accent bar on each side. */
export function paintSubtitle(ctx, text, cx, y, size, maxWidth, grade) {
  const clean = (text || '').trim().toUpperCase();
  if (!clean) return;
  let s = size;
  const face = () => `700 ${s}px 'Arial Narrow', 'Helvetica Neue', sans-serif`;
  ctx.font = face();
  try { ctx.letterSpacing = `${Math.round(s * 0.35)}px`; } catch { /* older canvas */ }
  while (ctx.measureText(clean).width > maxWidth && s > 10) {
    s -= 1;
    ctx.font = face();
  }
  const tw = ctx.measureText(clean).width;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = grade.accent;
  ctx.fillRect(cx - tw / 2 - s * 2.2, y - s * 0.08, s * 1.4, s * 0.16);
  ctx.fillRect(cx + tw / 2 + s * 0.8, y - s * 0.08, s * 1.4, s * 0.16);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(clean, cx, y);
  ctx.restore();
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
}

/** A sun disc with slats cut through its lower half, painted offscreen so the
 *  glow can be applied to the whole disc at once. */
function paintSun(ctx, cx, cy, r, grade) {
  const side = Math.ceil(r * 2 + 4);
  const off = document.createElement('canvas');
  off.width = off.height = side;
  const o = off.getContext('2d');
  const g = o.createLinearGradient(0, 0, 0, side);
  g.addColorStop(0, grade.sunTop);
  g.addColorStop(1, grade.sunBottom);
  o.fillStyle = g;
  o.beginPath();
  o.arc(side / 2, side / 2, r, 0, Math.PI * 2);
  o.fill();
  o.globalCompositeOperation = 'destination-out';
  let y = side * 0.52;
  let gap = Math.max(2, r * 0.03);
  while (y < side) {
    o.fillRect(0, y, side, gap);
    y += gap + Math.max(3, r * 0.06);
    gap *= 1.5;
  }
  ctx.save();
  ctx.shadowColor = grade.sunHalo;
  ctx.shadowBlur = r * 0.6;
  ctx.drawImage(off, cx - side / 2, cy - side / 2);
  ctx.restore();
}

/** One palm silhouette: a curved trunk and seven drooping fronds. */
function paintPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2, s * 0.05);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.06, y - s * 0.55, x - s * 0.1, y - s * 0.95);
  ctx.stroke();
  const topX = x - s * 0.1;
  const topY = y - s * 0.95;
  ctx.lineWidth = Math.max(2, s * 0.045);
  const fronds = [
    [-0.55, -0.28, -0.95, -0.05], [-0.3, -0.5, -0.62, -0.42],
    [0.05, -0.55, 0.1, -0.62], [0.35, -0.42, 0.72, -0.5],
    [0.55, -0.18, 0.95, -0.12], [-0.5, -0.02, -0.85, 0.22],
    [0.45, -0.02, 0.8, 0.28],
  ];
  for (const [c1x, c1y, ex, ey] of fronds) {
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + c1x * s, topY + c1y * s, topX + ex * s, topY + ey * s);
    ctx.stroke();
  }
  ctx.restore();
}

/** A synthwave perspective grid across a band at the poster's foot. */
function paintGrid(ctx, y0, y1, w, color) {
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

/** Halftone dots over a rectangle, growing toward its bottom edge. */
function paintHalftone(ctx, rect, scale, color) {
  const spacing = Math.max(7, 10 * scale);
  const maxR = 2.6 * scale;
  ctx.save();
  ctx.fillStyle = color;
  for (let row = 0, y = rect.y + spacing / 2; y < rect.y + rect.h; y += spacing, row++) {
    const t = (y - rect.y) / rect.h;
    if (t < 0.25) continue;
    const r = maxR * (t - 0.25) * (t - 0.25) * 1.78;
    if (r < 0.5) continue;
    const offset = (row % 2) * spacing / 2;
    for (let x = rect.x + spacing / 2 + offset; x < rect.x + rect.w; x += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Cover-fits one photo into a panel, with zoom and pan (0..1 each way). */
function paintPhoto(ctx, photo, rect, zoom, panX, panY) {
  const scale = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight) * zoom;
  const pw = photo.naturalWidth * scale;
  const ph = photo.naturalHeight * scale;
  ctx.drawImage(photo, rect.x + (rect.w - pw) * panX, rect.y + (rect.h - ph) * panY, pw, ph);
}

/** The grade's wash over a panel photo; noir also drains the colour. */
function paintWash(ctx, rect, grade) {
  const g = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  g.addColorStop(0, grade.washTop);
  g.addColorStop(1, grade.washBottom);
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  if (grade === GRADES.noir) {
    ctx.save();
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = '#808080';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  }
}

/** Diagonal stripes where a panel has no photo yet. */
function paintEmpty(ctx, rect, grade) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  g.addColorStop(0, grade.sky[0][1]);
  g.addColorStop(1, grade.sky[grade.sky.length - 1][1]);
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

/** Paints the whole poster. `state` holds size, layout, grade, title,
 *  subtitle, halftone and panels: [{ photo, zoom, panX, panY }]. */
export function drawPoster(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const scale = w / 1080;
  const grade = GRADES[state.grade] ?? GRADES.sunset;

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  for (const [stop, color] of grade.sky) sky.addColorStop(stop, color);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const bandY = Math.round(h * 0.72);
  const bandH = h - bandY;
  paintSun(ctx, w * 0.5, bandY + bandH * 0.3, Math.min(w, h) * 0.15, grade);
  if (state.grade === 'neon') paintGrid(ctx, bandY + bandH * 0.55, h, w, grade.accent);
  paintPalm(ctx, w * 0.045, h * 0.995, bandH * 0.85, grade.palmInk);
  paintPalm(ctx, w * 0.955, h * 0.995, bandH * 0.78, grade.palmInk);

  const rects = layoutPanels(state.layout, w, h);
  const bw = Math.max(2, Math.round(5 * scale));
  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    const panel = state.panels[i] ?? {};
    const img = panel.photo?.img ?? panel.photo ?? null;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (img) {
      paintPhoto(ctx, img, rect, panel.zoom ?? 1, panel.panX ?? 0.5, panel.panY ?? 0.5);
      paintWash(ctx, rect, grade);
    } else {
      paintEmpty(ctx, rect, grade);
    }
    if (state.halftone) paintHalftone(ctx, rect, scale, 'rgba(0,0,0,0.45)');
    const shade = ctx.createLinearGradient(0, rect.y + rect.h * 0.7, 0, rect.y + rect.h);
    shade.addColorStop(0, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = shade;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    ctx.save();
    if (state.grade === 'neon') {
      ctx.shadowColor = grade.frame;
      ctx.shadowBlur = 14 * scale;
    }
    ctx.lineWidth = bw;
    ctx.strokeStyle = grade.frame;
    ctx.strokeRect(rect.x + bw / 2, rect.y + bw / 2, rect.w - bw, rect.h - bw);
    ctx.restore();
  }

  paintTitle(ctx, state.title, w / 2, bandY + bandH * 0.52, Math.round(h * 0.115), w * 0.92, grade);
  paintSubtitle(ctx, state.subtitle, w / 2, bandY + bandH * 0.82, Math.round(h * 0.032), w * 0.8, grade);

  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}
