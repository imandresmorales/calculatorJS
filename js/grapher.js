/**
 * grapher.js – Calculadora gráfica premium
 * Características:
 *  • Traza múltiples funciones simultáneamente con colores únicos
 *  • Zoom con rueda del ratón / pinch en móvil
 *  • Desplazamiento con arrastre
 *  • Detección de raíces (ceros), máximos/mínimos locales e intersecciones
 *  • Tabla de valores configurable
 *  • Cuadrícula dinámica que se adapta al zoom
 */

(function () {
    'use strict';

    // ── Palette ──────────────────────────────────────────────────────────────
    const COLORS = [
        '#38bdf8', '#fb7185', '#a78bfa', '#34d399',
        '#fbbf24', '#f472b6', '#60a5fa', '#4ade80'
    ];

    // ── State ────────────────────────────────────────────────────────────────
    let functions = [];       // { expr, color, visible }
    let viewXMin = -10, viewXMax = 10, viewYMin = -10, viewYMax = 10;
    let isDragging = false;
    let dragStart  = { x: 0, y: 0 };
    let dragView   = { xMin: 0, xMax: 0, yMin: 0, yMax: 0 };

    // ── DOM refs ─────────────────────────────────────────────────────────────
    const canvas       = document.getElementById('graph-canvas');
    const ctx          = canvas ? canvas.getContext('2d') : null;
    const fnList       = document.getElementById('graph-functions-list');
    const addFnBtn     = document.getElementById('graph-add-fn');
    const plotBtn      = document.getElementById('graph-plot-btn');
    const xMinIn       = document.getElementById('x-min');
    const xMaxIn       = document.getElementById('x-max');
    const yMinIn       = document.getElementById('y-min');
    const yMaxIn       = document.getElementById('y-max');
    const showGridChk  = document.getElementById('graph-show-grid');
    const showPtsChk   = document.getElementById('graph-show-points');
    const showTblChk   = document.getElementById('graph-show-table');
    const infoPanel    = document.getElementById('graph-info-panel');
    const tableWrap    = document.getElementById('graph-table-wrap');
    const tableBody    = document.getElementById('graph-table-body');

    if (!canvas || !ctx) return;   // Panel not present

    // ── Function row creation ────────────────────────────────────────────────
    function createFunctionRow(index) {
        const color = COLORS[index % COLORS.length];
        const row = document.createElement('div');
        row.className = 'graph-fn-row';
        row.dataset.index = index;
        row.innerHTML = `
            <span class="graph-fn-dot" style="background:${color}"></span>
            <span class="graph-fn-label">f(x) =</span>
            <input type="text" class="graph-fn-input" placeholder="ej: sin(x)*2, x^2-3" value="">
            <button class="graph-fn-eye" title="Mostrar/Ocultar">👁</button>
            <button class="graph-fn-del" title="Eliminar">✕</button>
        `;
        const eye = row.querySelector('.graph-fn-eye');
        const del = row.querySelector('.graph-fn-del');
        const inp = row.querySelector('.graph-fn-input');

        eye.addEventListener('click', () => {
            const fn = functions[index];
            if (!fn) return;
            fn.visible = !fn.visible;
            eye.style.opacity = fn.visible ? '1' : '0.3';
            render();
        });

        del.addEventListener('click', () => {
            functions.splice(index, 1);
            rebuildFunctionList();
            render();
        });

        inp.addEventListener('input', () => {
            ensureFunctions(index);
            functions[index].expr = inp.value.trim();
        });

        inp.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                ensureFunctions(index);
                functions[index].expr = inp.value.trim();
                render();
                updateInfoPanel();
                updateTable();
            }
        });

        return row;
    }

    function ensureFunctions(index) {
        while (functions.length <= index) {
            functions.push({ expr: '', color: COLORS[functions.length % COLORS.length], visible: true });
        }
    }

    function rebuildFunctionList() {
        fnList.innerHTML = '';
        functions.forEach((fn, i) => {
            const row = createFunctionRow(i);
            row.querySelector('.graph-fn-input').value = fn.expr;
            fnList.appendChild(row);
        });
        if (functions.length === 0) addDefaultRow();
    }

    function addDefaultRow() {
        ensureFunctions(functions.length);
        const row = createFunctionRow(functions.length - 1);
        fnList.appendChild(row);
    }

    // Initialise with two empty slots
    ensureFunctions(0);
    functions[0].expr = 'sin(x)';
    ensureFunctions(1);
    functions[1].expr = 'x^2/4';
    rebuildFunctionList();

    addFnBtn.addEventListener('click', () => {
        addDefaultRow();
    });

    // ── Safe function evaluator ──────────────────────────────────────────────
    function buildFn(expr) {
        if (!expr || expr.trim() === '') return null;
        // Translate common notation to JS
        let e = expr
            .replace(/\^/g, '**')
            .replace(/(\d)(x)/g, '$1*x')
            .replace(/(x)(\d)/g, 'x*$2')
            .replace(/(\))(\()/g, ')*(')
            .replace(/(\d)(\()/g, '$1*(')
            .replace(/\bsin\b/g, 'Math.sin')
            .replace(/\bcos\b/g, 'Math.cos')
            .replace(/\btan\b/g, 'Math.tan')
            .replace(/\basin\b/g, 'Math.asin')
            .replace(/\bacos\b/g, 'Math.acos')
            .replace(/\batan\b/g, 'Math.atan')
            .replace(/\bsqrt\b/g, 'Math.sqrt')
            .replace(/\babs\b/g,  'Math.abs')
            .replace(/\blog\b/g,  'Math.log10')
            .replace(/\bln\b/g,   'Math.log')
            .replace(/\bexp\b/g,  'Math.exp')
            .replace(/\bfloor\b/g,'Math.floor')
            .replace(/\bceil\b/g, 'Math.ceil')
            .replace(/\bround\b/g,'Math.round')
            .replace(/\bPI\b/g,   'Math.PI')
            .replace(/\bpi\b/g,   'Math.PI')
            .replace(/\bPi\b/g,   'Math.PI')
            .replace(/\be\b/g,    'Math.E');
        try {
            // eslint-disable-next-line no-new-func
            const fn = new Function('x', `"use strict"; try { return ${e}; } catch(e){ return NaN; }`);
            // Quick test
            fn(0);
            return fn;
        } catch (_) {
            return null;
        }
    }

    // ── Coordinate mapping ───────────────────────────────────────────────────
    function toCanvasX(wx) {
        return ((wx - viewXMin) / (viewXMax - viewXMin)) * canvas.width;
    }
    function toCanvasY(wy) {
        return canvas.height - ((wy - viewYMin) / (viewYMax - viewYMin)) * canvas.height;
    }
    function toWorldX(cx) {
        return viewXMin + (cx / canvas.width) * (viewXMax - viewXMin);
    }
    function toWorldY(cy) {
        return viewYMin + ((canvas.height - cy) / canvas.height) * (viewYMax - viewYMin);
    }

    // ── Grid helpers ─────────────────────────────────────────────────────────
    function niceStep(range) {
        const rawStep = range / 10;
        const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
        const normalized = rawStep / mag;
        let step;
        if      (normalized < 1.5) step = 1;
        else if (normalized < 3.5) step = 2;
        else if (normalized < 7.5) step = 5;
        else                       step = 10;
        return step * mag;
    }

    // ── Main render ──────────────────────────────────────────────────────────
    function render() {
        const isDark = !document.body.classList.contains('light-theme');
        const W = canvas.width;
        const H = canvas.height;

        // Clear
        ctx.clearRect(0, 0, W, H);

        // Background
        if (isDark) {
            ctx.fillStyle = 'rgba(10,16,35,0.95)';
        } else {
            ctx.fillStyle = 'rgba(248,250,252,0.97)';
        }
        ctx.fillRect(0, 0, W, H);

        const gridColor   = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
        const axisColor   = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)';
        const labelColor  = isDark ? 'rgba(148,163,184,0.8)'  : 'rgba(71,85,105,0.9)';

        const xRange = viewXMax - viewXMin;
        const yRange = viewYMax - viewYMin;
        const xStep  = niceStep(xRange);
        const yStep  = niceStep(yRange);

        // ── Grid lines ──
        if (showGridChk && showGridChk.checked) {
            ctx.strokeStyle = gridColor;
            ctx.lineWidth   = 1;

            let x = Math.ceil(viewXMin / xStep) * xStep;
            while (x <= viewXMax) {
                const cx = toCanvasX(x);
                ctx.beginPath();
                ctx.moveTo(cx, 0);
                ctx.lineTo(cx, H);
                ctx.stroke();
                x += xStep;
            }

            let y = Math.ceil(viewYMin / yStep) * yStep;
            while (y <= viewYMax) {
                const cy = toCanvasY(y);
                ctx.beginPath();
                ctx.moveTo(0, cy);
                ctx.lineTo(W, cy);
                ctx.stroke();
                y += yStep;
            }
        }

        // ── Axes ──
        ctx.strokeStyle = axisColor;
        ctx.lineWidth   = 1.5;
        // x-axis
        if (viewYMin <= 0 && viewYMax >= 0) {
            const cy = toCanvasY(0);
            ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
        }
        // y-axis
        if (viewXMin <= 0 && viewXMax >= 0) {
            const cx = toCanvasX(0);
            ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
        }

        // ── Axis labels ──
        ctx.fillStyle  = labelColor;
        ctx.font       = '11px Outfit, sans-serif';
        ctx.textAlign  = 'center';

        let lx = Math.ceil(viewXMin / xStep) * xStep;
        const axisY = Math.max(4, Math.min(H - 4, toCanvasY(0)));
        while (lx <= viewXMax) {
            if (Math.abs(lx) > xStep * 0.01) {
                const cx = toCanvasX(lx);
                const label = parseFloat(lx.toPrecision(6)).toString();
                ctx.fillText(label, cx, axisY + 14);
            }
            lx += xStep;
        }

        ctx.textAlign  = 'right';
        let ly = Math.ceil(viewYMin / yStep) * yStep;
        const axisX = Math.max(40, Math.min(W - 4, toCanvasX(0)));
        while (ly <= viewYMax) {
            if (Math.abs(ly) > yStep * 0.01) {
                const cy = toCanvasY(ly);
                const label = parseFloat(ly.toPrecision(6)).toString();
                ctx.fillText(label, axisX - 4, cy + 4);
            }
            ly += yStep;
        }

        // ── Functions ──
        const SAMPLES = Math.round(W * 2);  // double resolution for smoothness
        functions.forEach(fn => {
            if (!fn.visible || !fn.expr) return;
            const f = buildFn(fn.expr);
            if (!f) return;

            ctx.strokeStyle = fn.color;
            ctx.lineWidth   = 2.5;
            ctx.setLineDash([]);
            ctx.shadowBlur  = 8;
            ctx.shadowColor = fn.color;
            ctx.beginPath();

            let started = false;
            let prevY   = null;

            for (let i = 0; i <= SAMPLES; i++) {
                const wx = viewXMin + (i / SAMPLES) * xRange;
                const wy = f(wx);
                const cx = toCanvasX(wx);
                const cy = toCanvasY(wy);

                const valid = isFinite(wy) && !isNaN(wy);
                // Detect discontinuities – large jumps likely asymptotes
                const bigJump = prevY !== null && Math.abs(cy - prevY) > H * 1.5;

                if (!valid || bigJump) {
                    started = false;
                    prevY   = null;
                } else {
                    if (!started) { ctx.moveTo(cx, cy); started = true; }
                    else          { ctx.lineTo(cx, cy); }
                    prevY = cy;
                }
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        });

        // ── Key points ──
        if (showPtsChk && showPtsChk.checked) {
            drawKeyPoints();
        }
    }

    // ── Key point detection ──────────────────────────────────────────────────
    function findRoots(f, xMin, xMax, samples = 2000) {
        const roots = [];
        const step  = (xMax - xMin) / samples;
        let prev    = f(xMin);
        for (let i = 1; i <= samples; i++) {
            const x   = xMin + i * step;
            const cur = f(x);
            if (isFinite(prev) && isFinite(cur) && prev * cur < 0) {
                // Bisect
                let a = x - step, b = x, fa = prev, fb = cur;
                for (let j = 0; j < 40; j++) {
                    const m = (a + b) / 2;
                    const fm = f(m);
                    if (fa * fm <= 0) { b = m; fb = fm; }
                    else              { a = m; fa = fm; }
                }
                roots.push((a + b) / 2);
            }
            prev = cur;
        }
        return roots;
    }

    function findExtrema(f, xMin, xMax, samples = 2000) {
        const extrema = [];
        const step    = (xMax - xMin) / samples;
        let p1 = f(xMin), p2 = f(xMin + step);
        for (let i = 2; i <= samples; i++) {
            const x  = xMin + i * step;
            const p3 = f(x);
            // local extremum between p2 (centre) and neighbours
            if (isFinite(p1) && isFinite(p2) && isFinite(p3)) {
                if ((p2 > p1 && p2 > p3)) extrema.push({ x: x - step, y: p2, type: 'max' });
                if ((p2 < p1 && p2 < p3)) extrema.push({ x: x - step, y: p2, type: 'min' });
            }
            p1 = p2; p2 = p3;
        }
        return extrema;
    }

    function drawKeyPoints() {
        functions.forEach(fn => {
            if (!fn.visible || !fn.expr) return;
            const f = buildFn(fn.expr);
            if (!f) return;

            // Roots
            const roots = findRoots(f, viewXMin, viewXMax);
            roots.forEach(rx => {
                const cx = toCanvasX(rx);
                const cy = toCanvasY(0);
                ctx.fillStyle   = fn.color;
                ctx.strokeStyle = '#fff';
                ctx.lineWidth   = 1.5;
                ctx.beginPath();
                ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle  = fn.color;
                ctx.font       = '10px Outfit,sans-serif';
                ctx.textAlign  = 'center';
                ctx.fillText(`x=${parseFloat(rx.toFixed(3))}`, cx, cy - 10);
            });

            // Extrema
            const extrema = findExtrema(f, viewXMin, viewXMax);
            extrema.forEach(pt => {
                const cx  = toCanvasX(pt.x);
                const cy  = toCanvasY(pt.y);
                ctx.fillStyle   = pt.type === 'max' ? '#4ade80' : '#fb7185';
                ctx.strokeStyle = '#fff';
                ctx.lineWidth   = 1.5;
                ctx.beginPath();
                ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle  = pt.type === 'max' ? '#4ade80' : '#fb7185';
                ctx.font       = '10px Outfit,sans-serif';
                ctx.textAlign  = 'center';
                ctx.fillText(
                    `(${parseFloat(pt.x.toFixed(2))}, ${parseFloat(pt.y.toFixed(2))})`,
                    cx, cy + (pt.type === 'max' ? -10 : 14)
                );
            });
        });
    }

    // ── Info panel ───────────────────────────────────────────────────────────
    function updateInfoPanel() {
        infoPanel.innerHTML = '';
        functions.forEach((fn, i) => {
            if (!fn.expr) return;
            const f = buildFn(fn.expr);
            if (!f) {
                infoPanel.innerHTML += `<div class="graph-point-row" style="color:#fb7185">⚠️ f${i+1}: expresión inválida</div>`;
                return;
            }
            const roots   = findRoots(f, viewXMin, viewXMax);
            const extrema = findExtrema(f, viewXMin, viewXMax);

            let html = `<div class="graph-fn-info-header" style="color:${fn.color}">f${i+1}(x) = ${fn.expr}</div>`;
            if (roots.length) {
                html += `<div class="graph-point-row">🎯 Raíces: ${roots.map(r => parseFloat(r.toFixed(4))).join(', ')}</div>`;
            }
            extrema.slice(0, 5).forEach(pt => {
                const icon = pt.type === 'max' ? '⬆️' : '⬇️';
                html += `<div class="graph-point-row">${icon} ${pt.type === 'max' ? 'Máx' : 'Mín'}: (${parseFloat(pt.x.toFixed(3))}, ${parseFloat(pt.y.toFixed(3))})</div>`;
            });
            infoPanel.innerHTML += html;
        });
    }

    // ── Value table ──────────────────────────────────────────────────────────
    function updateTable() {
        if (!showTblChk.checked) { tableWrap.style.display = 'none'; return; }
        tableWrap.style.display = 'block';
        tableBody.innerHTML = '';

        // Build header with one column per function
        const thead = document.querySelector('#graph-table thead tr');
        thead.innerHTML = '<th>x</th>';
        const fns = functions.map(fn => ({
            fn: fn.expr ? buildFn(fn.expr) : null,
            color: fn.color,
            expr: fn.expr
        }));
        fns.forEach((item, i) => {
            const th = document.createElement('th');
            th.textContent = item.expr ? `f${i+1}(x)` : '';
            th.style.color = item.color;
            thead.appendChild(th);
        });

        const step = (viewXMax - viewXMin) / 20;
        for (let x = viewXMin; x <= viewXMax + step * 0.01; x += step) {
            const xr = parseFloat(x.toPrecision(6));
            const tr = document.createElement('tr');
            const td0 = document.createElement('td');
            td0.textContent = xr;
            tr.appendChild(td0);
            fns.forEach(item => {
                const td = document.createElement('td');
                if (item.fn) {
                    const y = item.fn(xr);
                    td.textContent = isFinite(y) ? parseFloat(y.toPrecision(6)) : '—';
                    td.style.color = item.color;
                }
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        }
    }

    // ── Plot button ──────────────────────────────────────────────────────────
    plotBtn.addEventListener('click', () => {
        viewXMin = parseFloat(xMinIn.value) || -10;
        viewXMax = parseFloat(xMaxIn.value) || 10;
        viewYMin = parseFloat(yMinIn.value) || -10;
        viewYMax = parseFloat(yMaxIn.value) || 10;
        render();
        updateInfoPanel();
        updateTable();
    });

    showGridChk.addEventListener('change', render);
    showPtsChk .addEventListener('change', () => { render(); updateInfoPanel(); });
    showTblChk .addEventListener('change', updateTable);

    // ── Resize canvas ────────────────────────────────────────────────────────
    function resizeCanvas() {
        const wrap = canvas.parentElement;
        if (!wrap) return;
        canvas.width  = wrap.clientWidth  || 600;
        canvas.height = wrap.clientHeight || 420;
        render();
    }

    // ── Mouse / Touch interaction ────────────────────────────────────────────
    // Drag to pan
    canvas.addEventListener('mousedown', e => {
        isDragging = true;
        dragStart  = { x: e.clientX, y: e.clientY };
        dragView   = { xMin: viewXMin, xMax: viewXMax, yMin: viewYMin, yMax: viewYMax };
        canvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', e => {
        if (!isDragging) return;
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        const xRange = dragView.xMax - dragView.xMin;
        const yRange = dragView.yMax - dragView.yMin;
        const ddx = -(dx / canvas.width)  * xRange;
        const ddy =  (dy / canvas.height) * yRange;
        viewXMin = dragView.xMin + ddx;
        viewXMax = dragView.xMax + ddx;
        viewYMin = dragView.yMin + ddy;
        viewYMax = dragView.yMax + ddy;
        syncRangeInputs();
        render();
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
        canvas.style.cursor = 'crosshair';
    });

    // Zoom with wheel
    canvas.addEventListener('wheel', e => {
        e.preventDefault();
        const rect   = canvas.getBoundingClientRect();
        const cx     = e.clientX - rect.left;
        const cy     = e.clientY - rect.top;
        const wx     = toWorldX(cx);
        const wy     = toWorldY(cy);
        const factor = e.deltaY > 0 ? 1.15 : 0.87;

        viewXMin = wx + (viewXMin - wx) * factor;
        viewXMax = wx + (viewXMax - wx) * factor;
        viewYMin = wy + (viewYMin - wy) * factor;
        viewYMax = wy + (viewYMax - wy) * factor;
        syncRangeInputs();
        render();
    }, { passive: false });

    // Touch drag + pinch
    let lastTouches = null;
    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        lastTouches = e.touches;
    }, { passive: false });

    canvas.addEventListener('touchmove', e => {
        e.preventDefault();
        if (e.touches.length === 1 && lastTouches && lastTouches.length === 1) {
            const dx = e.touches[0].clientX - lastTouches[0].clientX;
            const dy = e.touches[0].clientY - lastTouches[0].clientY;
            const xRange = viewXMax - viewXMin;
            const yRange = viewYMax - viewYMin;
            viewXMin -= (dx / canvas.width)  * xRange;
            viewXMax -= (dx / canvas.width)  * xRange;
            viewYMin += (dy / canvas.height) * yRange;
            viewYMax += (dy / canvas.height) * yRange;
        } else if (e.touches.length === 2 && lastTouches && lastTouches.length === 2) {
            const prevDist = Math.hypot(
                lastTouches[0].clientX - lastTouches[1].clientX,
                lastTouches[0].clientY - lastTouches[1].clientY
            );
            const curDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const factor = prevDist / curDist;
            const midX   = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const midY   = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            const rect   = canvas.getBoundingClientRect();
            const wx     = toWorldX(midX - rect.left);
            const wy     = toWorldY(midY - rect.top);
            viewXMin = wx + (viewXMin - wx) * factor;
            viewXMax = wx + (viewXMax - wx) * factor;
            viewYMin = wy + (viewYMin - wy) * factor;
            viewYMax = wy + (viewYMax - wy) * factor;
        }
        lastTouches = e.touches;
        syncRangeInputs();
        render();
    }, { passive: false });

    function syncRangeInputs() {
        xMinIn.value = parseFloat(viewXMin.toFixed(4));
        xMaxIn.value = parseFloat(viewXMax.toFixed(4));
        yMinIn.value = parseFloat(viewYMin.toFixed(4));
        yMaxIn.value = parseFloat(viewYMax.toFixed(4));
    }

    // ── Tooltip: hover to show value ────────────────────────────────────────
    let tooltipEl = null;

    canvas.addEventListener('mousemove', e => {
        if (isDragging) return;
        const rect = canvas.getBoundingClientRect();
        const cx   = e.clientX - rect.left;
        const wx   = toWorldX(cx);

        const activeFns = functions.filter(fn => fn.visible && fn.expr);
        if (!activeFns.length) { removeTooltip(); return; }

        let lines = [`x = ${parseFloat(wx.toFixed(4))}`];
        activeFns.forEach((fn, i) => {
            const f = buildFn(fn.expr);
            if (!f) return;
            const wy = f(wx);
            if (!isFinite(wy)) return;
            lines.push(`f${i+1} = ${parseFloat(wy.toFixed(4))}`);
        });

        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.className = 'graph-tooltip';
            canvas.parentElement.appendChild(tooltipEl);
        }
        tooltipEl.innerHTML = lines.join('<br>');
        tooltipEl.style.left = (cx + 14) + 'px';
        tooltipEl.style.top  = (e.clientY - rect.top - 10) + 'px';
        tooltipEl.style.display = 'block';
    });

    canvas.addEventListener('mouseleave', removeTooltip);

    function removeTooltip() {
        if (tooltipEl) tooltipEl.style.display = 'none';
    }

    // ── Init on panel open ───────────────────────────────────────────────────
    window.addEventListener('graph-panel-opened', () => {
        setTimeout(() => {
            resizeCanvas();
            render();
        }, 80); // wait for CSS transition
    });

    // Also listen to window resize
    window.addEventListener('resize', () => {
        if (document.getElementById('graph-panel').classList.contains('open')) {
            resizeCanvas();
        }
    });

})();
