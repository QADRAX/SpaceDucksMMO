/**
 * Generates an HTML file with FPS chart and phase breakdown.
 * Self-contained, no external dependencies.
 */
export interface FrameSample {
  frame: number;
  t: number;
  delta: number;
  fps: number;
}

export interface PhaseSample {
  frame: number;
  phase: string;
  duration: number;
}

export interface PerfReport {
  frames: FrameSample[];
  phases: PhaseSample[];
}

export function generateFpsChartHtml(report: PerfReport | FrameSample[], title: string): string {
  const samples = Array.isArray(report) ? report : report.frames;
  const phases = Array.isArray(report) ? [] : report.phases;

  if (samples.length === 0) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body><p>No performance data recorded.</p></body></html>`;
  }

  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const fpsValues = samples.map((s) => s.fps);
  const fpsMin = Math.min(...fpsValues);
  const fpsMax = Math.max(...fpsValues);
  const fpsFloor = Math.max(0, Math.floor(fpsMin - 5));
  const fpsCeil = Math.min(Math.ceil(fpsMax + 20), Math.max(400, Math.ceil(fpsMax * 1.5)));
  const range = fpsCeil - fpsFloor || 1;

  const points = samples
    .map((s, i) => {
      const x = padding.left + (i / Math.max(1, samples.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((s.fps - fpsFloor) / range) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');

  const avgFps = fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length;
  const gridLines = 5;
  const gridLineY = Array.from({ length: gridLines + 1 }, (_, i) => {
    const y = padding.top + (i / gridLines) * chartHeight;
    const fps = fpsFloor + (1 - i / gridLines) * range;
    return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#333" stroke-dasharray="4" opacity="0.5"/>
      <text x="${padding.left - 8}" y="${y + 4}" fill="#888" font-size="11" text-anchor="end">${Math.round(fps)}</text>`;
  }).join('\n');

  const phaseByFrame = phases.reduce<Record<number, PhaseSample[]>>((acc, p) => {
    if (!acc[p.frame]) acc[p.frame] = [];
    acc[p.frame].push(p);
    return acc;
  }, {});
  const phaseNames = ['earlyUpdate', 'physics', 'update', 'lateUpdate', 'preRender', 'render', 'postRender'].filter(
    (pn) => phases.some((p) => p.phase === pn),
  );

  const engineFrameCount = phases.length > 0 ? Math.max(...phases.map((p) => p.frame)) + 1 : 0;
  const offset = engineFrameCount - samples.length;

  const table1Rows = samples.slice(0, 25).map((s) => {
    const engineFrameIdx = s.frame + offset;
    const phs = phaseByFrame[engineFrameIdx] ?? [];
    const byPhase = Object.fromEntries(phs.map((p) => [p.phase, p.duration]));
    const total = phs.reduce((a, p) => a + p.duration, 0);
    const phaseCells = phaseNames.map((pn) => `<td style="text-align:right; padding: 4px 8px;">${(byPhase[pn] ?? 0).toFixed(2)}</td>`).join('');
    return `<tr><td style="padding: 4px 8px;">${s.frame}</td><td style="text-align:right; padding: 4px 8px;">${s.fps.toFixed(1)}</td>${phaseCells}<td style="text-align:right; padding: 4px 8px;">${total.toFixed(2)}</td></tr>`;
  });

  const table1 =
    phaseNames.length > 0 && table1Rows.length > 0
      ? `
  <h2 style="font-size: 14px; margin-top: 24px;">FPS reales + coste por fase (ms)</h2>
  <table style="font-size: 12px; border-collapse: collapse;">
    <tr><th style="text-align:left; padding: 4px 8px;">frame</th><th style="text-align:right; padding: 4px 8px;">FPS real</th>${phaseNames.map((p) => `<th style="text-align:right; padding: 4px 8px;">${p}</th>`).join('')}<th style="text-align:right; padding: 4px 8px;">total</th></tr>
    ${table1Rows.join('')}
  </table>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 20px; background: #1a1a2e; color: #eee; }
    h1 { font-size: 18px; margin-bottom: 8px; }
    .stats { font-size: 13px; color: #7dd3fc; margin-bottom: 16px; }
    svg { background: #16213e; border-radius: 8px; }
    .legend { font-size: 11px; margin-top: 8px; }
    .legend span { margin-right: 16px; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="stats">
    Frames: ${samples.length} | Avg FPS: ${avgFps.toFixed(1)} | Min: ${fpsMin.toFixed(1)} | Max: ${fpsMax.toFixed(1)}
  </div>
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${gridLineY}
    <polyline fill="none" stroke="#7dd3fc" stroke-width="2" points="${points}"/>
    <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#555"/>
    <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#555"/>
  </svg>
  <div class="legend">
    <span style="color:#7dd3fc">●</span> rAF FPS
  </div>
  ${table1}
</body>
</html>`;
}
