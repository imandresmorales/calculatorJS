/**
 * percentage.js — Improvement #44
 * Quick percentage & tip calculator panel.
 *
 * Features:
 *  - Calculate X% of a number
 *  - Percent change between two numbers
 *  - Tip calculator with bill split
 */
(function () {
    'use strict';

    /* ── Create panel HTML ─────────────────────────────────────────────── */
    const panelHTML = `
    <div class="stats-panel" id="percentage-panel" role="dialog" aria-label="Calculadora de Porcentajes" aria-hidden="true">
        <div class="graph-header">
            <h2 class="graph-title" style="display:flex;align-items:center;gap:8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
                Porcentajes y Propinas
            </h2>
            <button class="graph-close-btn" id="percentage-close-btn" aria-label="Cerrar">&times;</button>
        </div>
        <div style="padding:1.2rem; display:flex; flex-direction:column; gap:1.5rem; overflow-y:auto; flex:1;">

            <!-- % of Number -->
            <fieldset style="border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1rem;">
                <legend style="color:#fbbf24; font-weight:600; font-size:0.85rem; padding:0 6px;">¿Cuánto es X% de Y?</legend>
                <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                    <input type="number" id="pct-x" placeholder="%" style="width:70px;" class="prog-base-btn" value="15">
                    <span style="color:var(--text-muted);">% de</span>
                    <input type="number" id="pct-y" placeholder="Número" style="width:100px;" class="prog-base-btn" value="200">
                    <span style="color:var(--text-muted);">=</span>
                    <strong id="pct-result" style="color:#34d399; font-size:1.1rem;">30</strong>
                </div>
            </fieldset>

            <!-- % change -->
            <fieldset style="border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1rem;">
                <legend style="color:#38bdf8; font-weight:600; font-size:0.85rem; padding:0 6px;">Cambio porcentual</legend>
                <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                    <span style="color:var(--text-muted);">De</span>
                    <input type="number" id="pctc-from" placeholder="Antes" style="width:90px;" class="prog-base-btn" value="80">
                    <span style="color:var(--text-muted);">a</span>
                    <input type="number" id="pctc-to" placeholder="Después" style="width:90px;" class="prog-base-btn" value="100">
                    <span style="color:var(--text-muted);">=</span>
                    <strong id="pctc-result" style="color:#a78bfa; font-size:1.1rem;">+25%</strong>
                </div>
            </fieldset>

            <!-- Tip calculator -->
            <fieldset style="border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1rem;">
                <legend style="color:#fb7185; font-weight:600; font-size:0.85rem; padding:0 6px;">💰 Calculadora de Propinas</legend>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                        <span style="color:var(--text-muted); min-width:60px;">Cuenta:</span>
                        <input type="number" id="tip-bill" placeholder="$" style="width:100px;" class="prog-base-btn" value="50">
                    </div>
                    <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                        <span style="color:var(--text-muted); min-width:60px;">Propina:</span>
                        <div style="display:flex;gap:4px;" id="tip-presets">
                            <button class="prog-base-btn active" data-tip="10" style="padding:4px 10px; cursor:pointer;">10%</button>
                            <button class="prog-base-btn" data-tip="15" style="padding:4px 10px; cursor:pointer;">15%</button>
                            <button class="prog-base-btn" data-tip="18" style="padding:4px 10px; cursor:pointer;">18%</button>
                            <button class="prog-base-btn" data-tip="20" style="padding:4px 10px; cursor:pointer;">20%</button>
                            <button class="prog-base-btn" data-tip="25" style="padding:4px 10px; cursor:pointer;">25%</button>
                        </div>
                    </div>
                    <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                        <span style="color:var(--text-muted); min-width:60px;">Personas:</span>
                        <input type="number" id="tip-split" placeholder="1" style="width:60px;" class="prog-base-btn" value="1" min="1">
                    </div>
                    <div style="margin-top:6px; padding:10px; background:rgba(255,255,255,0.04); border-radius:10px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                            <span style="color:var(--text-muted); font-size:0.82rem;">Propina:</span>
                            <strong id="tip-amount" style="color:#34d399;">$5.00</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                            <span style="color:var(--text-muted); font-size:0.82rem;">Total:</span>
                            <strong id="tip-total" style="color:#fbbf24;">$55.00</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span style="color:var(--text-muted); font-size:0.82rem;">Por persona:</span>
                            <strong id="tip-per-person" style="color:#a78bfa;">$55.00</strong>
                        </div>
                    </div>
                </div>
            </fieldset>
        </div>
    </div>`;

    const backdrop = document.createElement('div');
    backdrop.className = 'stats-backdrop';
    backdrop.id = 'percentage-backdrop';

    document.body.insertAdjacentHTML('beforeend', panelHTML);
    document.body.appendChild(backdrop);

    const panel = document.getElementById('percentage-panel');
    const closeBtn = document.getElementById('percentage-close-btn');

    /* ── Open / Close ──────────────────────────────────────────────────── */
    function open() {
        panel.classList.add('open');
        panel.setAttribute('aria-hidden', 'false');
        backdrop.classList.add('visible');
    }
    function close() {
        panel.classList.remove('open');
        panel.setAttribute('aria-hidden', 'true');
        backdrop.classList.remove('visible');
    }

    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && panel.classList.contains('open')) close();
    });

    /* ── Add toggle button to dock ─────────────────────────────────────── */
    const dock = document.querySelector('.top-controls');
    if (dock) {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'percentage-toggle';
        toggleBtn.className = 'mode-toggle';
        toggleBtn.setAttribute('aria-label', 'Calculadora de Porcentajes');
        toggleBtn.setAttribute('data-tooltip', 'Porcentajes y Propinas');
        toggleBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`;
        toggleBtn.addEventListener('click', () => panel.classList.contains('open') ? close() : open());
        // Insert before the last button
        const presToggle = document.getElementById('presentation-toggle');
        if (presToggle) dock.insertBefore(toggleBtn, presToggle);
        else dock.appendChild(toggleBtn);
    }

    /* ── Calculations ──────────────────────────────────────────────────── */
    const pctX = document.getElementById('pct-x');
    const pctY = document.getElementById('pct-y');
    const pctResult = document.getElementById('pct-result');

    function calcPct() {
        const x = parseFloat(pctX.value) || 0;
        const y = parseFloat(pctY.value) || 0;
        pctResult.textContent = (Math.round((x / 100 * y) * 100) / 100).toLocaleString('es');
    }
    pctX.addEventListener('input', calcPct);
    pctY.addEventListener('input', calcPct);

    const pctcFrom = document.getElementById('pctc-from');
    const pctcTo = document.getElementById('pctc-to');
    const pctcResult = document.getElementById('pctc-result');

    function calcPctChange() {
        const from = parseFloat(pctcFrom.value) || 0;
        const to = parseFloat(pctcTo.value) || 0;
        if (from === 0) { pctcResult.textContent = '—'; return; }
        const change = ((to - from) / Math.abs(from)) * 100;
        const rounded = Math.round(change * 100) / 100;
        pctcResult.textContent = (rounded >= 0 ? '+' : '') + rounded + '%';
        pctcResult.style.color = rounded >= 0 ? '#34d399' : '#fb7185';
    }
    pctcFrom.addEventListener('input', calcPctChange);
    pctcTo.addEventListener('input', calcPctChange);

    // Tip calculator
    let currentTipPct = 10;
    const tipBill = document.getElementById('tip-bill');
    const tipSplit = document.getElementById('tip-split');
    const tipAmount = document.getElementById('tip-amount');
    const tipTotal = document.getElementById('tip-total');
    const tipPerPerson = document.getElementById('tip-per-person');
    const tipPresets = document.getElementById('tip-presets');

    function calcTip() {
        const bill = parseFloat(tipBill.value) || 0;
        const split = Math.max(1, parseInt(tipSplit.value) || 1);
        const tip = Math.round(bill * currentTipPct) / 100;
        const total = bill + tip;
        const pp = Math.round(total / split * 100) / 100;

        tipAmount.textContent = '$' + tip.toFixed(2);
        tipTotal.textContent = '$' + total.toFixed(2);
        tipPerPerson.textContent = '$' + pp.toFixed(2);
    }

    tipPresets.addEventListener('click', e => {
        const btn = e.target.closest('[data-tip]');
        if (!btn) return;
        currentTipPct = parseInt(btn.dataset.tip);
        tipPresets.querySelectorAll('[data-tip]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        calcTip();
    });
    tipBill.addEventListener('input', calcTip);
    tipSplit.addEventListener('input', calcTip);

    // Init calcs
    calcPct();
    calcPctChange();
    calcTip();
})();
