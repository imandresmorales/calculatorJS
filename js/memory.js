/**
 * memory.js — Improvement #43
 * Scientific memory stack: M+, M-, MR, MC.
 *
 * Adds a memory indicator bar below the display and
 * injects 4 memory buttons into the buttons grid.
 */
(function () {
    'use strict';

    let memoryValue = 0;
    const STORAGE_KEY = 'calc_memory_v1';

    // Restore from localStorage
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) memoryValue = parseFloat(saved) || 0;
    } catch {}

    /* ── Memory indicator badge ────────────────────────────────────────── */
    const display = document.querySelector('.display');
    if (!display) return;

    const badge = document.createElement('div');
    badge.id = 'memory-badge';
    badge.style.cssText = `
        position: absolute; bottom: 6px; left: 10px;
        font-size: 0.65rem; font-weight: 700;
        color: var(--glow-op);
        opacity: 0; transition: opacity 0.3s;
        pointer-events: none; user-select: none;
        font-family: 'Outfit', sans-serif;
        letter-spacing: 0.05em;
    `;
    display.style.position = 'relative';
    display.appendChild(badge);

    function updateBadge() {
        if (memoryValue !== 0) {
            badge.textContent = `M: ${memoryValue}`;
            badge.style.opacity = '1';
        } else {
            badge.style.opacity = '0';
        }
        try { localStorage.setItem(STORAGE_KEY, String(memoryValue)); } catch {}
    }
    updateBadge();

    /* ── Helper: get current operand value ──────────────────────────────── */
    function getCurrentValue() {
        if (typeof calculator !== 'undefined') {
            return parseFloat(calculator.currentOperand) || 0;
        }
        return 0;
    }

    function setCurrentValue(val) {
        if (typeof calculator !== 'undefined') {
            calculator.currentOperand = String(Math.round(val * 1e8) / 1e8);
            calculator.updateDisplay();
        }
    }

    /* ── Memory operations ─────────────────────────────────────────────── */
    function memoryAdd() {
        memoryValue += getCurrentValue();
        updateBadge();
        if (window.showToast) showToast(`M+ → Memoria: ${memoryValue}`, 'info');
    }

    function memorySub() {
        memoryValue -= getCurrentValue();
        updateBadge();
        if (window.showToast) showToast(`M- → Memoria: ${memoryValue}`, 'info');
    }

    function memoryRecall() {
        if (memoryValue === 0) {
            if (window.showToast) showToast('Memoria vacía', 'info');
            return;
        }
        setCurrentValue(memoryValue);
        if (window.showToast) showToast(`MR ← ${memoryValue}`, 'success');
    }

    function memoryClear() {
        memoryValue = 0;
        updateBadge();
        if (window.showToast) showToast('Memoria borrada', 'info');
    }

    /* ── Inject memory buttons into the grid ───────────────────────────── */
    const buttonsGrid = document.querySelector('.buttons-grid');
    if (!buttonsGrid) return;

    const memRow = document.createElement('div');
    memRow.id = 'memory-row';
    memRow.style.cssText = `
        display: grid; grid-template-columns: repeat(4, 1fr);
        gap: 8px; grid-column: 1 / -1;
        margin-bottom: 4px;
    `;

    const memButtons = [
        { label: 'MC', fn: memoryClear, tooltip: 'Borrar memoria' },
        { label: 'MR', fn: memoryRecall, tooltip: 'Recuperar memoria' },
        { label: 'M+', fn: memoryAdd, tooltip: 'Sumar a memoria' },
        { label: 'M-', fn: memorySub, tooltip: 'Restar de memoria' },
    ];

    memButtons.forEach(({ label, fn, tooltip }) => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-action';
        btn.textContent = label;
        btn.setAttribute('data-tooltip', tooltip);
        btn.setAttribute('aria-label', tooltip);
        btn.style.cssText = `
            font-size: 0.72rem; font-weight: 700;
            padding: 6px 0;
            letter-spacing: 0.08em;
            min-height: 32px;
        `;
        btn.addEventListener('click', e => {
            e.stopPropagation();
            fn();
        });
        memRow.appendChild(btn);
    });

    // Insert at the very top of the buttons-grid
    buttonsGrid.insertBefore(memRow, buttonsGrid.firstChild);

    /* ── Keyboard shortcuts ────────────────────────────────────────────── */
    document.addEventListener('keydown', e => {
        if (e.altKey) {
            if (e.key === 'm' || e.key === 'M') { e.preventDefault(); memoryAdd(); }
            if (e.key === 'n' || e.key === 'N') { e.preventDefault(); memorySub(); }
            if (e.key === 'r' || e.key === 'R') { e.preventDefault(); memoryRecall(); }
        }
    });
})();
