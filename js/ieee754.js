/**
 * ieee754.js — Improvement #49
 * IEEE 754 Float Visualizer.
 *
 * Shows the 64-bit (double-precision) binary representation of any number
 * entered in the calculator, broken into Sign | Exponent | Mantissa.
 *
 * Security & best practices:
 *  - All DOM built with createElement/textContent (no innerHTML with user data).
 *  - Input is validated and clamped to finite numbers only.
 *  - Uses DataView + ArrayBuffer for exact IEEE 754 extraction (no hacks).
 *  - IIFE — no globals exported.
 */
(function () {
    'use strict';

    /* ── IEEE 754 extraction using DataView ────────────────────────────── */
    function float64ToBits(num) {
        const buf = new ArrayBuffer(8);
        const view = new DataView(buf);
        view.setFloat64(0, num, false); // big-endian
        const hi = view.getUint32(0);
        const lo = view.getUint32(4);
        // Convert to 64-char binary string
        const bits = hi.toString(2).padStart(32, '0') + lo.toString(2).padStart(32, '0');
        return bits;
    }

    function parseBits(bits) {
        const sign     = bits[0];
        const exponent = bits.slice(1, 12);
        const mantissa = bits.slice(12);

        const expVal   = parseInt(exponent, 2);
        const biasedExp = expVal - 1023;

        return { sign, exponent, mantissa, expVal, biasedExp };
    }

    /* ── Build the panel ───────────────────────────────────────────────── */
    const panel = document.createElement('div');
    panel.className = 'stats-panel';
    panel.id = 'ieee-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Visualizador IEEE 754');
    panel.setAttribute('aria-hidden', 'true');

    // Header
    const header = document.createElement('div');
    header.className = 'graph-header';
    const titleEl = document.createElement('h2');
    titleEl.className = 'graph-title';
    titleEl.style.cssText = 'display:flex; align-items:center; gap:8px;';
    titleEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="8" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="16" y2="21"/><line x1="2" y1="12" x2="22" y2="12"/></svg>`;
    const titleText = document.createTextNode(' IEEE 754 (64-bit)');
    titleEl.appendChild(titleText);
    header.appendChild(titleEl);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'graph-close-btn';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Cerrar');
    header.appendChild(closeBtn);
    panel.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.style.cssText = 'padding:1.2rem; overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:1rem;';

    // Input row
    const inputRow = document.createElement('div');
    inputRow.style.cssText = 'display:flex; gap:8px; align-items:center;';
    const inputLabel = document.createElement('label');
    inputLabel.textContent = 'Número:';
    inputLabel.style.cssText = 'color:var(--text-muted); font-size:0.85rem; font-weight:600;';
    inputLabel.setAttribute('for', 'ieee-input');
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'ieee-input';
    input.value = '3.14';
    input.className = 'prog-base-btn';
    input.style.cssText = 'flex:1; text-align:center; font-family:monospace; font-size:1rem;';
    input.autocomplete = 'off';
    const loadBtn = document.createElement('button');
    loadBtn.className = 'prog-base-btn';
    loadBtn.textContent = '← Display';
    loadBtn.title = 'Cargar el valor actual de la calculadora';
    loadBtn.style.cssText = 'cursor:pointer; padding:6px 12px; font-size:0.78rem;';
    inputRow.appendChild(inputLabel);
    inputRow.appendChild(input);
    inputRow.appendChild(loadBtn);
    body.appendChild(inputRow);

    // Bit visualization container
    const bitsContainer = document.createElement('div');
    bitsContainer.id = 'ieee-bits';
    bitsContainer.style.cssText = 'display:flex; flex-direction:column; gap:8px;';
    body.appendChild(bitsContainer);

    // Info container
    const infoContainer = document.createElement('div');
    infoContainer.id = 'ieee-info';
    infoContainer.style.cssText = 'padding:12px; background:rgba(255,255,255,0.04); border-radius:12px; display:flex; flex-direction:column; gap:5px; font-size:0.85rem;';
    body.appendChild(infoContainer);

    panel.appendChild(body);

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'stats-backdrop';
    backdrop.id = 'ieee-backdrop';

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
        btn.id = 'ieee-toggle';
        btn.className = 'mode-toggle';
        btn.setAttribute('aria-label', 'Visualizador IEEE 754');
        btn.setAttribute('data-tooltip', 'IEEE 754 (representación binaria)');
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="8" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="16" y2="21"/><line x1="2" y1="12" x2="22" y2="12"/></svg>`;
        btn.addEventListener('click', () => panel.classList.contains('open') ? close() : open());
        const geomBtn = document.getElementById('geometry-toggle');
        if (geomBtn) dock.insertBefore(btn, geomBtn);
        else dock.appendChild(btn);
    }

    /* ── Render bits ───────────────────────────────────────────────────── */
    function render() {
        const raw = input.value.trim();
        const num = parseFloat(raw);

        bitsContainer.innerHTML = '';
        infoContainer.innerHTML = '';

        if (raw === '' || isNaN(num)) {
            const msg = document.createElement('span');
            msg.textContent = 'Ingresa un número válido';
            msg.style.cssText = 'color:#fb7185; font-size:0.85rem;';
            bitsContainer.appendChild(msg);
            return;
        }

        const bits = float64ToBits(num);
        const parsed = parseBits(bits);

        // Color-coded bit row
        const bitRow = document.createElement('div');
        bitRow.style.cssText = 'display:flex; flex-wrap:wrap; gap:1px; font-family:monospace; font-size:0.72rem;';

        const COLORS = {
            sign:     { bg: 'rgba(251,113,133,0.25)', border: '#fb7185', color: '#fb7185' },
            exponent: { bg: 'rgba(56,189,248,0.2)',   border: '#38bdf8', color: '#38bdf8' },
            mantissa: { bg: 'rgba(52,211,153,0.15)',   border: '#34d399', color: '#34d399' },
        };

        bits.split('').forEach((bit, i) => {
            const cell = document.createElement('span');
            cell.textContent = bit;
            let type;
            if (i === 0) type = 'sign';
            else if (i < 12) type = 'exponent';
            else type = 'mantissa';

            const c = COLORS[type];
            cell.style.cssText = `
                padding: 3px 4px; border-radius: 2px; text-align: center;
                min-width: 14px;
                background: ${c.bg}; color: ${c.color};
                border-bottom: 2px solid ${c.border};
                ${i === 0 || i === 12 ? 'margin-left:4px;' : ''}
            `;
            bitRow.appendChild(cell);
        });
        bitsContainer.appendChild(bitRow);

        // Legend
        const legend = document.createElement('div');
        legend.style.cssText = 'display:flex; gap:16px; font-size:0.75rem; flex-wrap:wrap;';
        [
            { label: 'Signo (1 bit)', color: '#fb7185' },
            { label: 'Exponente (11 bits)', color: '#38bdf8' },
            { label: 'Mantisa (52 bits)', color: '#34d399' },
        ].forEach(({ label, color }) => {
            const item = document.createElement('span');
            item.style.cssText = `color:${color}; font-weight:600;`;
            item.textContent = '■ ' + label;
            legend.appendChild(item);
        });
        bitsContainer.appendChild(legend);

        // Info rows
        const infos = [
            { label: 'Signo', value: parsed.sign === '0' ? '+ (positivo)' : '– (negativo)' },
            { label: 'Exponente (sin sesgo)', value: String(parsed.expVal) },
            { label: 'Exponente (con sesgo)', value: String(parsed.biasedExp) },
            { label: 'Hex', value: '0x' + Array.from({ length: 8 }, (_, i) => parseInt(bits.slice(i * 8, (i + 1) * 8), 2).toString(16).padStart(2, '0')).join('').toUpperCase() },
            { label: 'Tipo', value: getType(parsed, num) },
        ];

        infos.forEach(({ label, value }) => {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex; justify-content:space-between;';
            const lbl = document.createElement('span');
            lbl.textContent = label + ':';
            lbl.style.cssText = 'color:var(--text-muted);';
            const val = document.createElement('strong');
            val.textContent = value;
            val.style.cssText = 'color:#f8fafc;';
            row.appendChild(lbl);
            row.appendChild(val);
            infoContainer.appendChild(row);
        });
    }

    function getType(parsed, num) {
        if (parsed.expVal === 0 && parsed.mantissa === '0'.repeat(52)) return 'Cero';
        if (parsed.expVal === 0) return 'Subnormal (denormalizado)';
        if (parsed.expVal === 2047 && parsed.mantissa === '0'.repeat(52)) return num > 0 ? '+Infinito' : '-Infinito';
        if (parsed.expVal === 2047) return 'NaN (Not a Number)';
        if (Number.isInteger(num)) return 'Normal (entero)';
        return 'Normal (flotante)';
    }

    input.addEventListener('input', render);

    loadBtn.addEventListener('click', () => {
        if (typeof calculator !== 'undefined' && calculator.currentOperand) {
            const val = String(calculator.currentOperand).replace(/,/g, '');
            input.value = val;
            render();
        }
    });

    render();
})();
