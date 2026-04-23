/**
 * keyboard-sounds.js — Improvement #27
 * Generates subtle mechanical keyboard click sounds using the Web Audio API.
 * No external files needed — all sounds are synthesized procedurally.
 */
(function () {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return; // Unsupported browser

    let ctx = null;
    let enabled = localStorage.getItem('calc_sounds') !== 'off';

    function getCtx() {
        if (!ctx) ctx = new AudioContext();
        return ctx;
    }

    /**
     * Play a click sound.
     * @param {'tap'|'equal'|'clear'} type
     */
    function playClick(type = 'tap') {
        if (!enabled) return;
        const ac = getCtx();

        const osc = ac.createOscillator();
        const gainNode = ac.createGain();

        osc.connect(gainNode);
        gainNode.connect(ac.destination);

        const now = ac.currentTime;

        if (type === 'equal') {
            // Soft "ding" — higher pitch, longer decay
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);
            gainNode.gain.setValueAtTime(0.18, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === 'clear') {
            // Dull thud — low pitch
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
            gainNode.gain.setValueAtTime(0.12, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else {
            // Crisp mechanical tap
            osc.type = 'square';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);
            gainNode.gain.setValueAtTime(0.08, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
            osc.start(now);
            osc.stop(now + 0.06);
        }
    }

    // Attach to all calculator buttons
    function wireButtons() {
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action === 'calculate') playClick('equal');
                else if (action === 'clear') playClick('clear');
                else playClick('tap');
            });
        });
    }

    // Sound toggle button — reuses the existing settings area or creates a floating pill
    function createSoundToggle() {
        const existing = document.getElementById('sound-toggle');
        if (existing) return;

        const btn = document.createElement('button');
        btn.id = 'sound-toggle';
        btn.className = 'mode-toggle';
        btn.setAttribute('aria-label', 'Sonidos de Teclado');
        btn.setAttribute('data-tooltip', enabled ? 'Sonidos: ON' : 'Sonidos: OFF');
        btn.title = 'Activar / Desactivar sonidos';
        btn.innerHTML = enabled
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;

        btn.addEventListener('click', () => {
            enabled = !enabled;
            localStorage.setItem('calc_sounds', enabled ? 'on' : 'off');
            btn.setAttribute('data-tooltip', enabled ? 'Sonidos: ON' : 'Sonidos: OFF');
            btn.innerHTML = enabled
                ? `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;
            if (enabled) playClick('tap'); // preview sound when enabling
        });

        // Insert before the last button (theme-toggle) in top-controls
        const topControls = document.querySelector('.top-controls');
        if (topControls) topControls.appendChild(btn);
    }

    document.addEventListener('DOMContentLoaded', () => {
        wireButtons();
        createSoundToggle();
    });

    // Also wire in case DOM is already ready
    if (document.readyState !== 'loading') {
        wireButtons();
        createSoundToggle();
    }
})();
