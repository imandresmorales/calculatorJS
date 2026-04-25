/**
 * toast.js — Improvement #30
 * Elegant, auto-dismissing toast notifications.
 * Usage: window.showToast('Mensaje', 'success' | 'error' | 'info');
 */
(function () {
    const DURATION = 3200; // ms before auto-close

    // Create container once
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.setAttribute('role', 'status');
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'false');
        document.body.appendChild(container);
    }

    const icons = {
        success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
        error:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
        info:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    };

    /**
     * Show a toast notification.
     * @param {string} message
     * @param {'success'|'error'|'info'} type
     */
    window.showToast = function (message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `calc-toast calc-toast--${type}`;
        toast.innerHTML = `
            <span class="calc-toast__icon">${icons[type] ?? icons.info}</span>
            <span class="calc-toast__msg">${message}</span>
            <button class="calc-toast__close" aria-label="Cerrar notificación">&#x2715;</button>
        `;

        // Close on button click
        toast.querySelector('.calc-toast__close').addEventListener('click', () => dismiss(toast));

        container.appendChild(toast);

        // Trigger entrance animation on next frame
        requestAnimationFrame(() => toast.classList.add('calc-toast--show'));

        // Auto-dismiss
        const timer = setTimeout(() => dismiss(toast), DURATION);
        toast._timer = timer;
    };

    function dismiss(toast) {
        clearTimeout(toast._timer);
        toast.classList.remove('calc-toast--show');
        toast.classList.add('calc-toast--hide');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }
})();
