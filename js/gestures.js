/**
 * gestures.js — Improvement #31
 * Mobile touch gesture support.
 *
 * Gestures supported:
 *  - Swipe LEFT  on the display → delete last digit (same as DEL button)
 *  - Swipe RIGHT on the display → clear all (same as AC button)
 *  - Swipe DOWN  anywhere       → close the currently open panel
 */
(function () {
    const MIN_SWIPE_DISTANCE = 60; // px threshold
    const MAX_SWIPE_TIME     = 400; // ms threshold

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    function onTouchStart(e) {
        if (e.touches.length !== 1) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
    }

    function onTouchEnd(e) {
        if (e.changedTouches.length !== 1) return;

        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        const dt = Date.now() - touchStartTime;

        if (dt > MAX_SWIPE_TIME) return; // too slow

        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // Horizontal swipe on the display
        const display = document.querySelector('.display');
        if (display && display.contains(e.target)) {
            if (absDx > MIN_SWIPE_DISTANCE && absDx > absDy * 1.5) {
                if (dx < 0) {
                    // ← Swipe left → Delete last digit
                    const deleteBtn = document.querySelector('[data-action="delete"]');
                    if (deleteBtn) {
                        deleteBtn.click();
                        if (window.showToast) showToast('Dígito borrado', 'info');
                    }
                } else {
                    // → Swipe right → Clear all
                    const clearBtn = document.querySelector('[data-action="clear"]');
                    if (clearBtn) {
                        clearBtn.click();
                        if (window.showToast) showToast('Pantalla limpiada', 'info');
                    }
                }
                return;
            }
        }

        // Swipe down anywhere → close open panels
        if (absDy > MIN_SWIPE_DISTANCE && absDy > absDx * 1.5 && dy > 0) {
            const openPanel = document.querySelector('.stats-panel.open');
            if (openPanel) {
                const closeBtn = openPanel.querySelector('.graph-close-btn');
                if (closeBtn) {
                    closeBtn.click();
                    if (window.showToast) showToast('Panel cerrado', 'info');
                }
            }
        }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend',   onTouchEnd,   { passive: true });

    // Visual hint on the display for first-time mobile users
    function addSwipeHint() {
        if (localStorage.getItem('swipe_hint_shown')) return;
        const display = document.querySelector('.display');
        if (!display || window.matchMedia('(pointer: fine)').matches) return; // skip for non-touch

        const hint = document.createElement('div');
        hint.style.cssText = `
            position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%);
            font-size: 0.65rem; color: rgba(255,255,255,0.3); white-space: nowrap;
            pointer-events: none; user-select: none;
        `;
        hint.textContent = '← desliza para borrar  |  → para limpiar';
        display.style.position = 'relative';
        display.appendChild(hint);

        setTimeout(() => hint.remove(), 4000);
        localStorage.setItem('swipe_hint_shown', '1');
    }

    document.addEventListener('DOMContentLoaded', addSwipeHint);
    if (document.readyState !== 'loading') addSwipeHint();
})();
