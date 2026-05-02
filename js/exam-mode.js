/**
 * exam-mode.js — Improvement #46
 * Exam / Restricted Mode for the calculator.
 *
 * Security & best-practice decisions:
 *  ─ The "locked" state is stored in sessionStorage (not localStorage) so it
 *    never persists across browser sessions — a student can't pre-lock a
 *    shared machine.
 *  ─ The optional PIN is hashed with SHA-256 (via SubtleCrypto) before
 *    comparison. The raw PIN is never stored anywhere, only the hex digest.
 *  ─ All UI manipulation is done via classList/dataset, never innerHTML with
 *    user-supplied data (XSS prevention).
 *  ─ Context-menu and DevTools shortcut suppression only while exam mode is
 *    active (principle of least restriction).
 *  ─ The module is an IIFE — no global symbols are exported except the public
 *    toggle function used by the dock button.
 *
 * Features:
 *  ─ Hides all advanced panels (history, graph, stats, backup, etc.)
 *  ─ Disables the copy-to-clipboard shortcut (Ctrl+C / Cmd+C)
 *  ─ Disables right-click context menu
 *  ─ Shows a persistent "EXAM MODE" banner with a timer
 *  ─ Optional PIN to enter / exit (set PIN on activation; required to deactivate)
 *  ─ Visual lock indicator on the dock toggle button
 */
(function () {
    'use strict';

    /* ════════════════════════════════════════════════════════════════════
     * Constants
     * ════════════════════════════════════════════════════════════════════ */
    const SESSION_KEY = 'calc_exam_active';    // sessionStorage — clears on tab close
    const PIN_KEY     = 'calc_exam_pin_hash';  // sessionStorage — same session only

    /**
     * IDs of dock buttons to disable while in exam mode.
     * These grant access to panels that are off-limits during a test.
     */
    const BLOCKED_BTN_IDS = [
        'history-toggle',
        'graph-toggle',
        'unit-toggle',
        'stats-toggle',
        'scratchpad-toggle',
        'backup-toggle',
        'theme-editor-toggle',
        'fav-toggle',
        'fav-save-btn',
        'mini-mode-toggle',
        'presentation-toggle',
        'percentage-toggle',
        'random-toggle',
        'finance-toggle',
        'health-toggle',
        'datetime-toggle',
    ];

    /** CSS class applied to the body when exam mode is active. */
    const BODY_CLASS = 'exam-mode';

    /* ════════════════════════════════════════════════════════════════════
     * Crypto helpers
     * ════════════════════════════════════════════════════════════════════ */

    /**
     * Hash a plain-text PIN using SHA-256 (WebCrypto).
     * Returns a hex string, or null if the API is unavailable.
     *
     * @param {string} pin  Raw PIN entered by the user.
     * @returns {Promise<string|null>}
     */
    async function hashPin(pin) {
        if (!window.crypto?.subtle) return null; // Graceful degradation
        const encoder = new TextEncoder();
        const data    = encoder.encode(String(pin).slice(0, 64)); // Limit input length
        const buffer  = await window.crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Compare a plain-text PIN against the stored hash in constant time
     * (avoids timing-based side-channels on same-origin comparisons).
     *
     * @param {string} pin
     * @returns {Promise<boolean>}
     */
    async function verifyPin(pin) {
        const stored = sessionStorage.getItem(PIN_KEY);
        if (!stored) return true; // No PIN configured → always pass
        const attempt = await hashPin(pin);
        if (!attempt || attempt.length !== stored.length) return false;

        // Constant-time comparison (same length guaranteed above)
        let diff = 0;
        for (let i = 0; i < stored.length; i++) {
            diff |= stored.charCodeAt(i) ^ attempt.charCodeAt(i);
        }
        return diff === 0;
    }

    /* ════════════════════════════════════════════════════════════════════
     * State
     * ════════════════════════════════════════════════════════════════════ */
    let isActive = false;
    let bannerEl = null;
    let timerInterval = null;
    let startTime = null;
    let examToggleBtn = null;

    /* ════════════════════════════════════════════════════════════════════
     * Banner
     * ════════════════════════════════════════════════════════════════════ */
    function createBanner() {
        const el = document.createElement('div');
        el.id = 'exam-banner';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        el.setAttribute('aria-label', 'Modo examen activo');
        el.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0;
            z-index: 99999;
            background: linear-gradient(90deg, #b91c1c 0%, #dc2626 100%);
            color: #fff;
            font-family: 'Outfit', sans-serif;
            font-size: 0.78rem;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-align: center;
            padding: 5px 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            box-shadow: 0 2px 12px rgba(185,28,28,0.5);
            user-select: none;
        `;
        el.innerHTML = `
            <span>🔒 MODO EXAMEN ACTIVO</span>
            <span id="exam-timer" style="
                font-variant-numeric: tabular-nums;
                background: rgba(0,0,0,0.25);
                padding: 1px 8px;
                border-radius: 4px;
            ">00:00:00</span>
        `;
        return el;
    }

    function updateTimer() {
        if (!startTime || !bannerEl) return;
        const elapsed  = Math.floor((Date.now() - startTime) / 1000);
        const h = Math.floor(elapsed / 3600);
        const m = Math.floor((elapsed % 3600) / 60);
        const s = elapsed % 60;
        const timerEl = bannerEl.querySelector('#exam-timer');
        if (timerEl) {
            // Using textContent — no user data involved
            timerEl.textContent =
                String(h).padStart(2, '0') + ':' +
                String(m).padStart(2, '0') + ':' +
                String(s).padStart(2, '0');
        }
    }

    /* ════════════════════════════════════════════════════════════════════
     * Blocked event handlers (stored to remove on deactivation)
     * ════════════════════════════════════════════════════════════════════ */
    function preventContextMenu(e) { e.preventDefault(); }
    function preventCopy(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            e.preventDefault();
            e.stopPropagation();
        }
    }
    // Prevent F12 / Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+U
    function preventDevTools(e) {
        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && ['i','I','j','J','c','C'].includes(e.key)) ||
            (e.ctrlKey && e.key === 'u')
        ) {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    /* ════════════════════════════════════════════════════════════════════
     * Activate / Deactivate
     * ════════════════════════════════════════════════════════════════════ */
    function activate() {
        isActive = true;
        startTime = Date.now();

        // Body class → CSS handles hiding panels and scientific grid overlays
        document.body.classList.add(BODY_CLASS);

        // Disable blocked dock buttons
        BLOCKED_BTN_IDS.forEach(id => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.disabled = true;
            btn.setAttribute('aria-disabled', 'true');
            btn.setAttribute('data-exam-blocked', 'true');
        });

        // Attach security event listeners
        document.addEventListener('contextmenu', preventContextMenu, true);
        document.addEventListener('keydown', preventCopy, true);
        document.addEventListener('keydown', preventDevTools, true);

        // Banner
        bannerEl = createBanner();
        document.body.prepend(bannerEl);

        // Timer
        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);

        // Toggle button visual state
        if (examToggleBtn) {
            examToggleBtn.classList.add('active');
            examToggleBtn.setAttribute('aria-pressed', 'true');
            examToggleBtn.setAttribute('data-tooltip', 'Desactivar Modo Examen');
        }

        // Persist to sessionStorage (not localStorage — no cross-session leak)
        try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* quota / private */ }

        if (window.showToast) showToast('Modo Examen activado 🔒', 'error');
    }

    function deactivate() {
        isActive = false;

        document.body.classList.remove(BODY_CLASS);

        // Re-enable blocked buttons
        BLOCKED_BTN_IDS.forEach(id => {
            const btn = document.getElementById(id);
            if (!btn || !btn.hasAttribute('data-exam-blocked')) return;
            btn.disabled = false;
            btn.removeAttribute('aria-disabled');
            btn.removeAttribute('data-exam-blocked');
        });

        // Remove security handlers
        document.removeEventListener('contextmenu', preventContextMenu, true);
        document.removeEventListener('keydown', preventCopy, true);
        document.removeEventListener('keydown', preventDevTools, true);

        // Remove banner & timer
        if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
        if (bannerEl) { bannerEl.remove(); bannerEl = null; }

        // Clear session entries
        try {
            sessionStorage.removeItem(SESSION_KEY);
            sessionStorage.removeItem(PIN_KEY);
        } catch { /* noop */ }

        // Toggle button visual state
        if (examToggleBtn) {
            examToggleBtn.classList.remove('active');
            examToggleBtn.setAttribute('aria-pressed', 'false');
            examToggleBtn.setAttribute('data-tooltip', 'Activar Modo Examen');
        }

        if (window.showToast) showToast('Modo Examen desactivado', 'info');
    }

    /* ════════════════════════════════════════════════════════════════════
     * PIN dialog (minimal, no innerHTML with user data)
     * ════════════════════════════════════════════════════════════════════ */
    function buildPinDialog(title, onSubmit, onCancel) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 100000;
            background: rgba(0,0,0,0.75); display: flex;
            align-items: center; justify-content: center;
        `;

        const box = document.createElement('div');
        box.style.cssText = `
            background: #0f172a; border: 1px solid rgba(255,255,255,0.15);
            border-radius: 16px; padding: 24px 28px; min-width: 280px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.7);
            font-family: 'Outfit', sans-serif; color: #f8fafc;
            display: flex; flex-direction: column; gap: 16px;
        `;

        const titleEl = document.createElement('h3');
        titleEl.style.cssText = 'margin:0; font-size:1rem; font-weight:700;';
        titleEl.textContent = title; // plain text — not interpolated from user input

        const input = document.createElement('input');
        input.type = 'password';
        input.placeholder = 'PIN (4-8 dígitos)';
        input.maxLength = 8;
        input.autocomplete = 'off';
        input.style.cssText = `
            padding: 10px 14px; border-radius: 10px; font-size: 1rem;
            border: 1px solid rgba(255,255,255,0.15);
            background: rgba(255,255,255,0.05); color: #f8fafc; width: 100%;
        `;

        const errEl = document.createElement('p');
        errEl.style.cssText = 'margin:0; font-size:0.8rem; color:#fb7185; min-height:1rem;';

        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex; gap:10px; justify-content:flex-end;';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.style.cssText = `
            background:transparent; border:1px solid rgba(255,255,255,0.15);
            color:#94a3b8; border-radius:8px; padding:7px 16px; cursor:pointer;
        `;

        const okBtn = document.createElement('button');
        okBtn.textContent = 'Confirmar';
        okBtn.style.cssText = `
            background:#dc2626; border:none; color:#fff;
            border-radius:8px; padding:7px 16px; cursor:pointer; font-weight:700;
        `;

        btnRow.appendChild(cancelBtn);
        btnRow.appendChild(okBtn);
        box.appendChild(titleEl);
        box.appendChild(input);
        box.appendChild(errEl);
        box.appendChild(btnRow);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        function close() { overlay.remove(); }

        cancelBtn.addEventListener('click', () => { close(); onCancel?.(); });
        overlay.addEventListener('click', e => { if (e.target === overlay) { close(); onCancel?.(); } });

        async function submit() {
            const raw = input.value.trim();
            // Validate PIN format: 4-8 digits only
            if (!/^\d{4,8}$/.test(raw)) {
                errEl.textContent = 'El PIN debe tener entre 4 y 8 dígitos.';
                input.focus();
                return;
            }
            okBtn.disabled = true;
            okBtn.textContent = '…';
            const ok = await onSubmit(raw);
            if (!ok) {
                errEl.textContent = 'PIN incorrecto. Inténtalo de nuevo.';
                input.value = '';
                okBtn.disabled = false;
                okBtn.textContent = 'Confirmar';
                input.focus();
            } else {
                close();
            }
        }

        okBtn.addEventListener('click', submit);
        input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });

        setTimeout(() => input.focus(), 50);
    }

    /* ════════════════════════════════════════════════════════════════════
     * Toggle handler
     * ════════════════════════════════════════════════════════════════════ */
    async function handleToggle() {
        if (!isActive) {
            // Ask if user wants a PIN to protect this session
            const wantsPin = window.confirm('¿Deseas proteger el Modo Examen con un PIN?\n(Recomendado para evitar que el estudiante lo desactive)');
            if (wantsPin) {
                buildPinDialog('Establece un PIN para el Modo Examen', async (pin) => {
                    const hash = await hashPin(pin);
                    if (!hash) {
                        // SubtleCrypto unavailable — activate without PIN
                        if (window.showToast) showToast('SHA-256 no disponible en este contexto. Modo Examen sin PIN.', 'info');
                        activate();
                        return true;
                    }
                    try { sessionStorage.setItem(PIN_KEY, hash); } catch { /* noop */ }
                    activate();
                    return true;
                }, null);
            } else {
                activate();
            }
        } else {
            // Deactivate — verify PIN if one is set
            const hasPIN = !!sessionStorage.getItem(PIN_KEY);
            if (hasPIN) {
                buildPinDialog('Introduce el PIN para salir del Modo Examen', async (pin) => {
                    const ok = await verifyPin(pin);
                    if (ok) { deactivate(); }
                    return ok;
                }, null);
            } else {
                deactivate();
            }
        }
    }

    /* ════════════════════════════════════════════════════════════════════
     * Build dock button
     * ════════════════════════════════════════════════════════════════════ */
    function buildDockButton() {
        const dock = document.querySelector('.top-controls');
        if (!dock) return;

        examToggleBtn = document.createElement('button');
        examToggleBtn.id = 'exam-toggle';
        examToggleBtn.className = 'mode-toggle';
        examToggleBtn.setAttribute('aria-label', 'Modo Examen');
        examToggleBtn.setAttribute('aria-pressed', 'false');
        examToggleBtn.setAttribute('data-tooltip', 'Activar Modo Examen');
        // Lock icon SVG — inline, no user data
        examToggleBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>`.trim();

        examToggleBtn.addEventListener('click', handleToggle);

        // Insert before presentation-toggle (or last)
        const presentationBtn = document.getElementById('presentation-toggle');
        if (presentationBtn) dock.insertBefore(examToggleBtn, presentationBtn);
        else dock.appendChild(examToggleBtn);
    }

    /* ════════════════════════════════════════════════════════════════════
     * CSS injected for exam-mode body class
     * ════════════════════════════════════════════════════════════════════ */
    function injectStyles() {
        const style = document.createElement('style');
        style.id = 'exam-mode-styles';
        // Inline all rules — no user data, purely class-based
        style.textContent = `
            /* Exam mode: hide all advanced panels and their backdrops */
            body.exam-mode .stats-panel,
            body.exam-mode .stats-backdrop { display: none !important; }

            /* Keep only the main calculator visible */
            body.exam-mode .scientific-grid { display: none !important; }

            /* Banner pushes top-controls down */
            body.exam-mode .top-controls { margin-top: 28px; }

            /* Lock icon turns red when active */
            #exam-toggle[aria-pressed="true"] svg { stroke: #fb7185; }
            #exam-toggle[aria-pressed="true"] { box-shadow: 0 0 0 2px rgba(220,38,38,0.5); }

            /* Blocked buttons appear faded */
            .top-controls button[data-exam-blocked] {
                opacity: 0.28;
                cursor: not-allowed !important;
                filter: grayscale(1);
            }
        `;
        document.head.appendChild(style);
    }

    /* ════════════════════════════════════════════════════════════════════
     * Init
     * ════════════════════════════════════════════════════════════════════ */
    function init() {
        injectStyles();
        buildDockButton();

        // Restore state if this page was reloaded mid-session
        // (sessionStorage survives page reloads within the same tab)
        try {
            if (sessionStorage.getItem(SESSION_KEY) === '1') {
                activate();
            }
        } catch { /* Private browsing may throw */ }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
