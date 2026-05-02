/**
 * clipboard.js — Improvement #42
 * One-click copy result to clipboard.
 *
 * Adds a small "copy" button overlaid on the display area.
 * Also supports Ctrl+C when the calculator is focused.
 */
(function () {
    'use strict';

    const display = document.querySelector('.display');
    const currentEl = document.querySelector('[data-current-operand]');
    if (!display || !currentEl) return;

    /* ── Build copy button ─────────────────────────────────────────────── */
    const btn = document.createElement('button');
    btn.id = 'copy-result-btn';
    btn.setAttribute('aria-label', 'Copiar resultado');
    btn.setAttribute('data-tooltip', 'Copiar al portapapeles');
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
    btn.style.cssText = `
        position: absolute; top: 8px; right: 8px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.1);
        color: var(--text-muted);
        border-radius: 8px;
        padding: 5px 7px;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s, background 0.2s, color 0.2s, transform 0.15s;
        z-index: 5;
        display: flex; align-items: center; justify-content: center;
    `;
    btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(56,189,248,0.2)';
        btn.style.color = '#38bdf8';
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.background = 'rgba(255,255,255,0.06)';
        btn.style.color = 'var(--text-muted)';
    });

    // Ensure display is position:relative for absolute positioning
    display.style.position = 'relative';
    display.appendChild(btn);

    // Show on hover
    display.addEventListener('mouseenter', () => { btn.style.opacity = '1'; });
    display.addEventListener('mouseleave', () => { btn.style.opacity = '0'; });

    /* ── Copy logic ────────────────────────────────────────────────────── */
    function getCleanValue() {
        // Get the raw number from the calculator, removing thousands separators
        const raw = currentEl.textContent || '0';
        return raw.replace(/,/g, '').trim();
    }

    async function copyToClipboard() {
        const val = getCleanValue();
        if (!val || val === '0') return;

        try {
            await navigator.clipboard.writeText(val);
            showCopiedFeedback();
            if (window.showToast) showToast(`Copiado: ${val}`, 'success');
        } catch {
            // Fallback for older browsers / file:// protocol
            const textarea = document.createElement('textarea');
            textarea.value = val;
            textarea.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
            document.body.appendChild(textarea);
            textarea.select();
            try { document.execCommand('copy'); showCopiedFeedback(); } catch {}
            document.body.removeChild(textarea);
        }
    }

    function showCopiedFeedback() {
        btn.style.transform = 'scale(1.25)';
        btn.style.color = '#34d399';
        setTimeout(() => {
            btn.style.transform = 'scale(1)';
            btn.style.color = 'var(--text-muted)';
        }, 300);
    }

    btn.addEventListener('click', e => {
        e.stopPropagation();
        copyToClipboard();
    });

    /* ── Keyboard shortcut: Ctrl+C ─────────────────────────────────────── */
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            // Only if no text is manually selected
            const sel = window.getSelection();
            if (!sel || sel.toString().length === 0) {
                e.preventDefault();
                copyToClipboard();
            }
        }
    });
})();
