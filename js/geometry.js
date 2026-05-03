/**
 * geometry.js — Improvement #48
 * Area and Volume Calculator panel.
 *
 * Supported shapes:
 *   2D: Circle, Rectangle, Triangle, Trapezoid, Ellipse
 *   3D: Sphere, Cube, Cylinder, Cone, Rectangular Prism
 *
 * Security & best practices:
 *  - All DOM is built with createElement/textContent (no innerHTML with user data).
 *  - Input values are parsed with parseFloat and validated before computation.
 *  - Results are capped at 15 significant digits (Number precision limit).
 *  - IIFE — no global pollution.
 */
(function () {
    'use strict';

    /* ── Shape definitions ─────────────────────────────────────────────── */
    const SHAPES = {
        '2D — Áreas': [
            {
                name: 'Círculo', icon: '⚫',
                fields: [{ id: 'r', label: 'Radio', placeholder: 'r' }],
                calc: v => ({ area: Math.PI * v.r ** 2, perimeter: 2 * Math.PI * v.r }),
                labels: ['Área', 'Perímetro'],
            },
            {
                name: 'Rectángulo', icon: '▬',
                fields: [{ id: 'w', label: 'Ancho', placeholder: 'a' }, { id: 'h', label: 'Alto', placeholder: 'b' }],
                calc: v => ({ area: v.w * v.h, perimeter: 2 * (v.w + v.h) }),
                labels: ['Área', 'Perímetro'],
            },
            {
                name: 'Triángulo', icon: '▲',
                fields: [{ id: 'b', label: 'Base', placeholder: 'b' }, { id: 'h', label: 'Altura', placeholder: 'h' }],
                calc: v => ({ area: 0.5 * v.b * v.h }),
                labels: ['Área'],
            },
            {
                name: 'Trapecio', icon: '⏢',
                fields: [{ id: 'a', label: 'Base mayor', placeholder: 'a' }, { id: 'b', label: 'Base menor', placeholder: 'b' }, { id: 'h', label: 'Altura', placeholder: 'h' }],
                calc: v => ({ area: ((v.a + v.b) / 2) * v.h }),
                labels: ['Área'],
            },
            {
                name: 'Elipse', icon: '⬮',
                fields: [{ id: 'a', label: 'Semi-eje a', placeholder: 'a' }, { id: 'b', label: 'Semi-eje b', placeholder: 'b' }],
                calc: v => ({ area: Math.PI * v.a * v.b, perimeter: Math.PI * (3 * (v.a + v.b) - Math.sqrt((3 * v.a + v.b) * (v.a + 3 * v.b))) }),
                labels: ['Área', 'Perímetro (aprox.)'],
            },
        ],
        '3D — Volúmenes': [
            {
                name: 'Esfera', icon: '🔵',
                fields: [{ id: 'r', label: 'Radio', placeholder: 'r' }],
                calc: v => ({ volume: (4 / 3) * Math.PI * v.r ** 3, surface: 4 * Math.PI * v.r ** 2 }),
                labels: ['Volumen', 'Superficie'],
            },
            {
                name: 'Cubo', icon: '🟦',
                fields: [{ id: 'a', label: 'Lado', placeholder: 'a' }],
                calc: v => ({ volume: v.a ** 3, surface: 6 * v.a ** 2 }),
                labels: ['Volumen', 'Superficie'],
            },
            {
                name: 'Cilindro', icon: '🛢',
                fields: [{ id: 'r', label: 'Radio', placeholder: 'r' }, { id: 'h', label: 'Altura', placeholder: 'h' }],
                calc: v => ({ volume: Math.PI * v.r ** 2 * v.h, surface: 2 * Math.PI * v.r * (v.r + v.h) }),
                labels: ['Volumen', 'Superficie'],
            },
            {
                name: 'Cono', icon: '🔺',
                fields: [{ id: 'r', label: 'Radio base', placeholder: 'r' }, { id: 'h', label: 'Altura', placeholder: 'h' }],
                calc: v => {
                    const slant = Math.sqrt(v.r ** 2 + v.h ** 2);
                    return { volume: (1 / 3) * Math.PI * v.r ** 2 * v.h, surface: Math.PI * v.r * (v.r + slant) };
                },
                labels: ['Volumen', 'Superficie'],
            },
            {
                name: 'Prisma Rectangular', icon: '📦',
                fields: [{ id: 'l', label: 'Largo', placeholder: 'l' }, { id: 'w', label: 'Ancho', placeholder: 'w' }, { id: 'h', label: 'Alto', placeholder: 'h' }],
                calc: v => ({ volume: v.l * v.w * v.h, surface: 2 * (v.l * v.w + v.l * v.h + v.w * v.h) }),
                labels: ['Volumen', 'Superficie'],
            },
        ],
    };

    /* ── Build panel ───────────────────────────────────────────────────── */
    const panel = document.createElement('div');
    panel.className = 'stats-panel';
    panel.id = 'geometry-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Calculadora de Área y Volumen');
    panel.setAttribute('aria-hidden', 'true');

    // Header
    const header = document.createElement('div');
    header.className = 'graph-header';
    header.innerHTML = `
        <h2 class="graph-title" style="display:flex;align-items:center;gap:8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><polygon points="12 2 2 22 22 22"/></svg>
            Área y Volumen
        </h2>`;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'graph-close-btn';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Cerrar');
    header.appendChild(closeBtn);
    panel.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.style.cssText = 'padding:1rem; overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:1rem;';

    // Shape selector
    const selectWrap = document.createElement('div');
    selectWrap.style.cssText = 'display:flex; gap:8px; align-items:center; flex-wrap:wrap;';
    const selectLabel = document.createElement('span');
    selectLabel.textContent = 'Figura:';
    selectLabel.style.cssText = 'color:var(--text-muted); font-size:0.85rem; font-weight:600;';
    const select = document.createElement('select');
    select.id = 'geom-shape-select';
    select.className = 'unit-select';
    select.style.cssText = 'flex:1; max-width:220px;';

    // Populate options
    const allShapes = [];
    Object.entries(SHAPES).forEach(([group, shapes]) => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = group;
        shapes.forEach((s, i) => {
            const opt = document.createElement('option');
            opt.value = String(allShapes.length);
            opt.textContent = `${s.icon} ${s.name}`;
            optgroup.appendChild(opt);
            allShapes.push(s);
        });
        select.appendChild(optgroup);
    });

    selectWrap.appendChild(selectLabel);
    selectWrap.appendChild(select);
    body.appendChild(selectWrap);

    // Dynamic fields container
    const fieldsDiv = document.createElement('div');
    fieldsDiv.id = 'geom-fields';
    fieldsDiv.style.cssText = 'display:flex; flex-direction:column; gap:10px;';
    body.appendChild(fieldsDiv);

    // Results container
    const resultsDiv = document.createElement('div');
    resultsDiv.id = 'geom-results';
    resultsDiv.style.cssText = 'padding:12px; background:rgba(255,255,255,0.04); border-radius:12px; display:flex; flex-direction:column; gap:6px;';
    body.appendChild(resultsDiv);

    panel.appendChild(body);

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'stats-backdrop';
    backdrop.id = 'geometry-backdrop';

    document.body.appendChild(panel);
    document.body.appendChild(backdrop);

    /* ── Open / Close ──────────────────────────────────────────────────── */
    function open() { panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); backdrop.classList.add('visible'); }
    function close() { panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true'); backdrop.classList.remove('visible'); }
    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('open')) close(); });

    /* ── Dock button ───────────────────────────────────────────────────── */
    const dock = document.querySelector('.top-controls');
    if (dock) {
        const btn = document.createElement('button');
        btn.id = 'geometry-toggle';
        btn.className = 'mode-toggle';
        btn.setAttribute('aria-label', 'Calculadora de Geometría');
        btn.setAttribute('data-tooltip', 'Área y Volumen');
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 22 22 22"/></svg>`;
        btn.addEventListener('click', () => panel.classList.contains('open') ? close() : open());
        const examBtn = document.getElementById('exam-toggle');
        if (examBtn) dock.insertBefore(btn, examBtn);
        else dock.appendChild(btn);
    }

    /* ── Render fields & compute ───────────────────────────────────────── */
    function renderShape(idx) {
        const shape = allShapes[idx];
        if (!shape) return;

        // Clear
        fieldsDiv.innerHTML = '';
        resultsDiv.innerHTML = '';

        // Build input fields
        shape.fields.forEach(f => {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex; align-items:center; gap:8px;';
            const label = document.createElement('label');
            label.textContent = f.label + ':';
            label.style.cssText = 'color:var(--text-muted); font-size:0.85rem; min-width:90px; font-weight:500;';
            label.setAttribute('for', 'geom-' + f.id);
            const input = document.createElement('input');
            input.type = 'number';
            input.id = 'geom-' + f.id;
            input.placeholder = f.placeholder;
            input.className = 'prog-base-btn';
            input.style.cssText = 'flex:1; max-width:120px; text-align:center;';
            input.min = '0';
            input.step = 'any';
            input.value = '1';
            input.addEventListener('input', () => compute(idx));
            row.appendChild(label);
            row.appendChild(input);
            fieldsDiv.appendChild(row);
        });

        compute(idx);
    }

    function compute(idx) {
        const shape = allShapes[idx];
        if (!shape) return;

        // Gather values safely
        const vals = {};
        let valid = true;
        shape.fields.forEach(f => {
            const el = document.getElementById('geom-' + f.id);
            const v = el ? parseFloat(el.value) : NaN;
            if (!isFinite(v) || v < 0) valid = false;
            vals[f.id] = v;
        });

        resultsDiv.innerHTML = '';
        if (!valid) {
            const msg = document.createElement('span');
            msg.textContent = 'Ingresa valores válidos (≥ 0)';
            msg.style.cssText = 'color:#fb7185; font-size:0.85rem;';
            resultsDiv.appendChild(msg);
            return;
        }

        const results = shape.calc(vals);
        const keys = Object.keys(results);
        keys.forEach((key, i) => {
            const label = shape.labels[i] || key;
            const val = results[key];
            const row = document.createElement('div');
            row.style.cssText = 'display:flex; justify-content:space-between; align-items:center;';
            const lbl = document.createElement('span');
            lbl.textContent = label + ':';
            lbl.style.cssText = 'color:var(--text-muted); font-size:0.88rem;';
            const valEl = document.createElement('strong');
            // Cap precision to avoid floating-point garbage
            valEl.textContent = isFinite(val) ? parseFloat(val.toPrecision(12)).toLocaleString('es') : '—';
            valEl.style.cssText = 'color:#34d399; font-size:1.05rem;';
            row.appendChild(lbl);
            row.appendChild(valEl);
            resultsDiv.appendChild(row);
        });
    }

    select.addEventListener('change', () => renderShape(parseInt(select.value)));
    renderShape(0);
})();
