/**
 * stats.js — Módulo de Estadística Descriptiva
 *
 * Buenas prácticas aplicadas:
 *  • IIFE para evitar contaminación del scope global.
 *  • Sanitización de inputs mediante RegExp y parseo a Float.
 *  • Renderización segura con `textContent`.
 */

(function () {
    'use strict';

    // ── Referencias DOM ────────────────────────────────────────────────────────
    const panel = document.getElementById('stats-panel');
    const backdrop = document.getElementById('stats-backdrop');
    const toggleBtn = document.getElementById('stats-toggle');
    const closeBtn = document.getElementById('stats-close');
    
    const dataInput = document.getElementById('stats-data-input');
    const calcBtn = document.getElementById('stats-calc-btn');
    const clearBtn = document.getElementById('stats-clear-btn');
    const resultsGrid = document.getElementById('stats-results-grid');

    if (!panel || !toggleBtn) return;

    // ── Lógica de Panel ────────────────────────────────────────────────────────
    function openPanel() {
        panel.classList.add('open');
        panel.setAttribute('aria-hidden', 'false');
        backdrop.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    function closePanel() {
        panel.classList.remove('open');
        panel.setAttribute('aria-hidden', 'true');
        backdrop.classList.remove('visible');
        document.body.style.overflow = '';
    }

    toggleBtn.addEventListener('click', openPanel);
    closeBtn.addEventListener('click', closePanel);
    backdrop.addEventListener('click', closePanel);
    
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
    });

    // ── Funciones Matemáticas ─────────────────────────────────────────────────
    function getMean(data) {
        return data.reduce((a, b) => a + b, 0) / data.length;
    }

    function getMedian(data) {
        const sorted = [...data].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    }

    function getMode(data) {
        const counts = {};
        let maxFreq = 0;
        let modes = [];
        data.forEach(v => {
            counts[v] = (counts[v] || 0) + 1;
            if (counts[v] > maxFreq) maxFreq = counts[v];
        });
        for (const v in counts) {
            if (counts[v] === maxFreq) modes.push(Number(v));
        }
        return { modes, freq: maxFreq };
    }

    function getVariance(data, mean) {
        return data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (data.length - 1 || 1); // Sample variance
    }

    // ── Parseo y Renderizado ──────────────────────────────────────────────────
    function formatValue(val) {
        return Number.isInteger(val) ? val.toString() : val.toFixed(4).replace(/\.?0+$/, '');
    }

    function renderStat(label, value, description) {
        const card = document.createElement('div');
        card.className = 'stats-card';

        const lbl = document.createElement('div');
        lbl.className = 'stats-card-label';
        lbl.textContent = label;

        const val = document.createElement('div');
        val.className = 'stats-card-value';
        val.textContent = value;

        const desc = document.createElement('div');
        desc.className = 'stats-card-desc';
        desc.textContent = description;

        card.appendChild(lbl);
        card.appendChild(val);
        card.appendChild(desc);
        resultsGrid.appendChild(card);
    }

    function computeStats() {
        const raw = dataInput.value;
        if (!raw.trim()) {
            resultsGrid.innerHTML = '<div class="stats-empty-msg">Ingresa datos para ver las métricas.</div>';
            return;
        }

        // Extraer números usando regex, soportando negativos y decimales
        const tokens = raw.match(/-?\d+(\.\d+)?/g);
        if (!tokens || tokens.length === 0) {
            resultsGrid.innerHTML = '<div class="stats-empty-msg">No se encontraron números válidos.</div>';
            return;
        }

        const data = tokens.map(Number);
        
        const count = data.length;
        const sum = data.reduce((a, b) => a + b, 0);
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min;
        const mean = getMean(data);
        const median = getMedian(data);
        const modeInfo = getMode(data);
        const variance = getVariance(data, mean);
        const stdDev = Math.sqrt(variance);

        let modeStr = modeInfo.modes.map(formatValue).join(', ');
        if (modeInfo.modes.length === count) modeStr = 'Amimodal';

        resultsGrid.innerHTML = '';
        
        renderStat('N (Recuento)', count, 'Número total de elementos');
        renderStat('Suma (Σx)', formatValue(sum), 'Suma de todos los valores');
        renderStat('Media (x̄)', formatValue(mean), 'Promedio aritmético');
        renderStat('Mediana', formatValue(median), 'Valor central ordenado');
        renderStat('Moda', modeStr, modeInfo.modes.length < count ? `Frecuencia: ${modeInfo.freq}` : 'Ningún valor se repite');
        renderStat('Mínimo', formatValue(min), 'Valor más bajo');
        renderStat('Máximo', formatValue(max), 'Valor más alto');
        renderStat('Rango', formatValue(range), 'Máx - Mín');
        renderStat('Varianza (s²)', formatValue(variance), 'Varianza muestral');
        renderStat('Desviación Estándar (s)', formatValue(stdDev), 'Dispersión promedio');
    }

    calcBtn?.addEventListener('click', computeStats);
    clearBtn?.addEventListener('click', () => {
        dataInput.value = '';
        computeStats();
    });

})();
