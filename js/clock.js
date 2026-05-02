/**
 * clock.js — Improvement #41
 * Live clock + stopwatch widget in the calculator header.
 *
 * Shows current time (HH:MM:SS) in the top-controls bar.
 * Click to toggle between clock → stopwatch → hidden.
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'calc_clock_mode'; // 'clock' | 'stopwatch' | 'hidden'
    const MODES = ['clock', 'stopwatch', 'hidden'];

    let mode = localStorage.getItem(STORAGE_KEY) || 'clock';
    let stopwatchMs = 0;
    let stopwatchRunning = false;
    let stopwatchStart = 0;
    let clockInterval = null;
    let swInterval = null;

    /* ── Build DOM ─────────────────────────────────────────────────────── */
    const dock = document.querySelector('.top-controls');
    if (!dock) return;

    const widget = document.createElement('div');
    widget.id = 'clock-widget';
    widget.setAttribute('aria-label', 'Reloj');
    widget.style.cssText = `
        display: flex; align-items: center; gap: 6px;
        font-family: 'Courier New', monospace;
        font-size: 0.82rem; font-weight: 600;
        color: var(--text-muted);
        cursor: pointer; user-select: none;
        padding: 4px 10px;
        border-radius: 8px;
        transition: background 0.2s, color 0.2s;
        white-space: nowrap;
        margin-right: auto;
        flex-shrink: 0;
    `;
    widget.addEventListener('mouseenter', () => widget.style.background = 'rgba(255,255,255,0.08)');
    widget.addEventListener('mouseleave', () => widget.style.background = 'transparent');

    // Insert at the very start of the dock
    dock.insertBefore(widget, dock.firstChild);

    /* ── Clock Mode ────────────────────────────────────────────────────── */
    function formatTime(date) {
        return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    }

    function startClock() {
        stopStopwatch();
        widget.style.display = 'flex';
        updateClock();
        clockInterval = setInterval(updateClock, 1000);
    }

    function updateClock() {
        widget.textContent = '🕐 ' + formatTime(new Date());
    }

    function stopClock() {
        if (clockInterval) { clearInterval(clockInterval); clockInterval = null; }
    }

    /* ── Stopwatch Mode ────────────────────────────────────────────────── */
    function formatSW(ms) {
        const totalSec = Math.floor(ms / 1000);
        const min = Math.floor(totalSec / 60);
        const sec = totalSec % 60;
        const centis = Math.floor((ms % 1000) / 10);
        return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
    }

    function startStopwatch() {
        stopClock();
        widget.style.display = 'flex';
        renderSW();
    }

    function renderSW() {
        const elapsed = stopwatchRunning ? (performance.now() - stopwatchStart + stopwatchMs) : stopwatchMs;
        widget.textContent = '⏱ ' + formatSW(elapsed);
    }

    function toggleSWRun() {
        if (stopwatchRunning) {
            // Pause
            stopwatchMs += performance.now() - stopwatchStart;
            stopwatchRunning = false;
            if (swInterval) { clearInterval(swInterval); swInterval = null; }
        } else {
            // Start
            stopwatchStart = performance.now();
            stopwatchRunning = true;
            swInterval = setInterval(renderSW, 47); // ~21 fps
        }
        renderSW();
    }

    function resetSW() {
        stopwatchMs = 0;
        stopwatchRunning = false;
        if (swInterval) { clearInterval(swInterval); swInterval = null; }
        renderSW();
    }

    function stopStopwatch() {
        resetSW();
    }

    /* ── Mode cycling ──────────────────────────────────────────────────── */
    function setMode(m) {
        mode = m;
        try { localStorage.setItem(STORAGE_KEY, m); } catch {}

        stopClock();
        stopStopwatch();

        if (m === 'clock') startClock();
        else if (m === 'stopwatch') startStopwatch();
        else widget.style.display = 'none';
    }

    // Single click: cycle modes. In stopwatch mode: start/pause.
    widget.addEventListener('click', e => {
        if (mode === 'stopwatch') {
            toggleSWRun();
            return;
        }
        const nextIdx = (MODES.indexOf(mode) + 1) % MODES.length;
        setMode(MODES[nextIdx]);
        if (window.showToast) {
            const labels = { clock: 'Reloj activado', stopwatch: 'Cronómetro activado', hidden: 'Reloj oculto' };
            showToast(labels[MODES[nextIdx]], 'info');
        }
    });

    // Double-click in stopwatch → reset
    widget.addEventListener('dblclick', e => {
        if (mode === 'stopwatch') {
            e.preventDefault();
            resetSW();
        }
    });

    // Right-click → cycle mode even in stopwatch
    widget.addEventListener('contextmenu', e => {
        e.preventDefault();
        const nextIdx = (MODES.indexOf(mode) + 1) % MODES.length;
        setMode(MODES[nextIdx]);
    });

    /* ── Init ──────────────────────────────────────────────────────────── */
    setMode(mode);
})();
