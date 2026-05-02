/**
 * sparkline.js — Improvement #45
 * Tiny sparkline chart rendered on the display, showing the trend
 * of the last N numeric results.
 *
 * The sparkline is a thin SVG path overlaid at the bottom of the display.
 * It updates automatically when a new result is computed.
 */
(function () {
    'use strict';

    const MAX_POINTS = 20;
    const STORAGE_KEY = 'calc_sparkline_data';
    const HEIGHT = 28;

    let dataPoints = [];

    // Restore
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) dataPoints = JSON.parse(saved).slice(-MAX_POINTS);
    } catch {}

    const display = document.querySelector('.display');
    if (!display) return;
    display.style.position = 'relative';

    /* ── SVG container ─────────────────────────────────────────────────── */
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'sparkline-svg';
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = `
        position: absolute; bottom: 0; left: 0;
        width: 100%; height: ${HEIGHT}px;
        pointer-events: none;
        opacity: 0.35;
        transition: opacity 0.3s;
    `;
    display.appendChild(svg);

    // Show more on hover
    display.addEventListener('mouseenter', () => { svg.style.opacity = '0.65'; });
    display.addEventListener('mouseleave', () => { svg.style.opacity = '0.35'; });

    /* ── Draw sparkline ────────────────────────────────────────────────── */
    function draw() {
        svg.innerHTML = '';
        if (dataPoints.length < 2) return;

        const W = svg.clientWidth || display.clientWidth || 300;
        const H = HEIGHT;
        const padding = 2;

        const min = Math.min(...dataPoints);
        const max = Math.max(...dataPoints);
        const range = max - min || 1;

        const stepX = (W - padding * 2) / (dataPoints.length - 1);

        const points = dataPoints.map((val, i) => {
            const x = padding + i * stepX;
            const y = H - padding - ((val - min) / range) * (H - padding * 2);
            return `${x},${y}`;
        });

        // Gradient definition
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        grad.id = 'spark-grad';
        grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
        grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '0%');

        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%'); stop1.setAttribute('stop-color', '#a855f7');
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%'); stop2.setAttribute('stop-color', '#38bdf8');

        grad.appendChild(stop1);
        grad.appendChild(stop2);
        defs.appendChild(grad);
        svg.appendChild(defs);

        // Line path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        path.setAttribute('points', points.join(' '));
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'url(#spark-grad)');
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        svg.appendChild(path);

        // Dot at last point
        const lastParts = points[points.length - 1].split(',');
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', lastParts[0]);
        dot.setAttribute('cy', lastParts[1]);
        dot.setAttribute('r', '2.5');
        dot.setAttribute('fill', '#38bdf8');
        svg.appendChild(dot);
    }

    /* ── Listen for new results ─────────────────────────────────────────── */
    window.addEventListener('calc-result', e => {
        const result = parseFloat(e.detail?.result);
        if (!isFinite(result)) return;

        dataPoints.push(result);
        if (dataPoints.length > MAX_POINTS) dataPoints.shift();

        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(dataPoints)); } catch {}
        draw();
    });

    /* ── Initial draw ──────────────────────────────────────────────────── */
    // Draw after a small delay to ensure display has rendered
    setTimeout(draw, 500);
    window.addEventListener('resize', draw);
})();
