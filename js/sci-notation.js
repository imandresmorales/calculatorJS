/**
 * sci-notation.js — Improvement #50
 * Toggle between standard and scientific notation display.
 *
 * Adds a small toggle button to the display that converts the current number
 * between formats: 1,230,000 ↔ 1.23e+6
 *
 * Security & best practices:
 *  - No innerHTML with user data — all DOM built with createElement/textContent.
 *  - Numbers are validated with isFinite before formatting.
 *  - State is persisted in localStorage with try/catch guard.
 *  - Monkey-patches Calculator.getDisplayNumber cleanly with the original preserved.
 *  - IIFE — no global scope pollution.
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'calc_sci_notation';
    let sciMode = false;

    // Restore preference
    try { sciMode = localStorage.getItem(STORAGE_KEY) === '1'; } catch {}

    /* ── Build toggle button on the display ─────────────────────────────── */
    const display = document.querySelector('.display');
    if (!display) return;
    display.style.position = 'relative';

    const btn = document.createElement('button');
    btn.id = 'sci-notation-toggle';
    btn.setAttribute('aria-label', 'Alternar notación científica');
    btn.setAttribute('data-tooltip', 'Notación científica');
    btn.style.cssText = `
        position: absolute; bottom: 6px; right: 8px;
        font-family: 'Courier New', monospace;
        font-size: 0.65rem; font-weight: 700;
        padding: 3px 8px;
        border-radius: 6px;
        border: 1px solid rgba(255,255,255,0.12);
        background: rgba(255,255,255,0.06);
        color: var(--text-muted);
        cursor: pointer;
        z-index: 5;
        transition: background 0.2s, color 0.2s;
        user-select: none;
    `;
    btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(56,189,248,0.2)';
        btn.style.color = '#38bdf8';
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.background = sciMode ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.06)';
        btn.style.color = sciMode ? '#38bdf8' : 'var(--text-muted)';
    });
    display.appendChild(btn);

    function updateBtnLabel() {
        btn.textContent = sciMode ? 'SCI' : 'STD';
        btn.style.background = sciMode ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.06)';
        btn.style.color = sciMode ? '#38bdf8' : 'var(--text-muted)';
    }
    updateBtnLabel();

    /* ── Monkey-patch getDisplayNumber ──────────────────────────────────── */
    // Wait for Calculator to be defined
    function patchCalculator() {
        if (typeof Calculator === 'undefined') return;

        const proto = Calculator.prototype;
        const originalGetDisplayNumber = proto.getDisplayNumber;

        proto.getDisplayNumber = function (number) {
            if (!sciMode) return originalGetDisplayNumber.call(this, number);

            const num = parseFloat(number);
            if (!isFinite(num)) return originalGetDisplayNumber.call(this, number);
            if (num === 0) return '0';
            if (String(number) === '-') return '-';

            // Use exponential notation
            // For very small/very large numbers: always exponential
            // For "normal" range: only if user toggled SCI mode
            const absNum = Math.abs(num);
            let precision;
            if (absNum >= 1e15 || absNum < 1e-6) {
                precision = 6; // Very large/small → 6 significant digits
            } else {
                precision = 10; // Normal range → 10 significant digits
            }

            const formatted = num.toExponential(precision)
                .replace(/\.?0+e/, 'e')  // Remove trailing zeros before 'e'
                .replace('e+0', '')       // Remove e+0 (number is already readable)
                .replace('e+', 'e+');

            return formatted;
        };
    }

    // Attempt patch immediately and also after a delay (in case Calculator loads later)
    patchCalculator();
    setTimeout(patchCalculator, 100);

    /* ── Toggle handler ────────────────────────────────────────────────── */
    btn.addEventListener('click', e => {
        e.stopPropagation();
        sciMode = !sciMode;
        updateBtnLabel();
        try { localStorage.setItem(STORAGE_KEY, sciMode ? '1' : '0'); } catch {}

        // Re-render display
        if (typeof calculator !== 'undefined') {
            calculator.updateDisplay();
        }

        if (window.showToast) {
            showToast(sciMode ? 'Notación científica activada (1.23e+6)' : 'Notación estándar (1,230,000)', 'info');
        }
    });

    /* ── Keyboard shortcut: Alt+E ──────────────────────────────────────── */
    document.addEventListener('keydown', e => {
        if (e.altKey && (e.key === 'e' || e.key === 'E')) {
            e.preventDefault();
            btn.click();
        }
    });
})();
