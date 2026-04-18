(function() {
    const financeToggle = document.getElementById('finance-toggle');
    const financePanel = document.getElementById('finance-panel');
    const financeBackdrop = document.getElementById('finance-backdrop');
    const financeClose = document.getElementById('finance-close');
    const financeMode = document.getElementById('finance-mode');
    const financeInputs = document.getElementById('finance-inputs');
    const financeCalcBtn = document.getElementById('finance-calc-btn');
    const financeResults = document.getElementById('finance-results');

    const togglePanel = () => {
        const isOpen = financePanel.classList.toggle('open');
        financeBackdrop.classList.toggle('visible');
        financePanel.setAttribute('aria-hidden', !isOpen);
        if (isOpen) renderInputs();
    };

    financeToggle.addEventListener('click', togglePanel);
    financeClose.addEventListener('click', togglePanel);
    financeBackdrop.addEventListener('click', togglePanel);

    financeMode.addEventListener('change', () => {
        renderInputs();
        financeResults.innerHTML = '<div class="stats-empty-msg">Ingresa los valores para calcular.</div>';
    });

    function renderInputs() {
        const mode = financeMode.value;
        let html = '';

        if (mode === 'simple' || mode === 'compound') {
            html = `
                <div>
                    <label class="stats-label">Capital Inicial ($)</label>
                    <input type="number" id="fin-principal" class="stats-textarea" placeholder="1000" step="any">
                </div>
                <div>
                    <label class="stats-label">Tasa de Interés Anual (%)</label>
                    <input type="number" id="fin-rate" class="stats-textarea" placeholder="5" step="any">
                </div>
                <div>
                    <label class="stats-label">Tiempo (Años)</label>
                    <input type="number" id="fin-time" class="stats-textarea" placeholder="1" step="any">
                </div>
            `;
            if (mode === 'compound') {
                html += `
                    <div>
                        <label class="stats-label">Frecuencia de Capitalización</label>
                        <select id="fin-frequency" class="stats-textarea" style="height:auto; padding:8px;">
                            <option value="1">Anual (1/año)</option>
                            <option value="2">Semestral (2/año)</option>
                            <option value="4">Trimestral (4/año)</option>
                            <option value="12">Mensual (12/año)</option>
                            <option value="365">Diaria (365/año)</option>
                        </select>
                    </div>
                `;
            }
        } else if (mode === 'loan') {
            html = `
                <div>
                    <label class="stats-label">Monto del Préstamo ($)</label>
                    <input type="number" id="fin-loan-amount" class="stats-textarea" placeholder="5000" step="any">
                </div>
                <div>
                    <label class="stats-label">Tasa de Interés Anual (%)</label>
                    <input type="number" id="fin-loan-rate" class="stats-textarea" placeholder="10" step="any">
                </div>
                <div>
                    <label class="stats-label">Plazo (Meses)</label>
                    <input type="number" id="fin-loan-months" class="stats-textarea" placeholder="12" step="any">
                </div>
            `;
        }

        financeInputs.innerHTML = html;
    }

    financeCalcBtn.addEventListener('click', () => {
        const mode = financeMode.value;
        let results = [];

        try {
            if (mode === 'simple') {
                const P = parseFloat(document.getElementById('fin-principal').value);
                const r = parseFloat(document.getElementById('fin-rate').value) / 100;
                const t = parseFloat(document.getElementById('fin-time').value);

                if (isNaN(P) || isNaN(r) || isNaN(t)) throw new Error("Valores inválidos");

                const interest = P * r * t;
                const total = P + interest;

                results = [
                    { label: "Interés Generado", value: `$${interest.toFixed(2)}` },
                    { label: "Monto Total", value: `$${total.toFixed(2)}` }
                ];
            } else if (mode === 'compound') {
                const P = parseFloat(document.getElementById('fin-principal').value);
                const r = parseFloat(document.getElementById('fin-rate').value) / 100;
                const t = parseFloat(document.getElementById('fin-time').value);
                const n = parseInt(document.getElementById('fin-frequency').value);

                if (isNaN(P) || isNaN(r) || isNaN(t) || isNaN(n)) throw new Error("Valores inválidos");

                const total = P * Math.pow((1 + r/n), n * t);
                const interest = total - P;

                results = [
                    { label: "Interés Compuesto", value: `$${interest.toFixed(2)}` },
                    { label: "Monto Final", value: `$${total.toFixed(2)}` }
                ];
            } else if (mode === 'loan') {
                const L = parseFloat(document.getElementById('fin-loan-amount').value);
                const annualR = parseFloat(document.getElementById('fin-loan-rate').value) / 100;
                const m = parseInt(document.getElementById('fin-loan-months').value);

                if (isNaN(L) || isNaN(annualR) || isNaN(m)) throw new Error("Valores inválidos");

                const r = annualR / 12; // Monthly rate
                const monthlyPayment = (L * r) / (1 - Math.pow(1 + r, -m));
                const totalPayment = monthlyPayment * m;
                const totalInterest = totalPayment - L;

                results = [
                    { label: "Pago Mensual", value: `$${monthlyPayment.toFixed(2)}` },
                    { label: "Interés Total", value: `$${totalInterest.toFixed(2)}` },
                    { label: "Pago Total", value: `$${totalPayment.toFixed(2)}` }
                ];
            }

            renderResults(results);
        } catch (e) {
            financeResults.innerHTML = `<div style="color:#ef4444; text-align:center; padding:10px;">Error: ${e.message}</div>`;
        }
    });

    function renderResults(data) {
        let html = '<div class="stats-grid">';
        data.forEach(item => {
            html += `
                <div class="stats-card">
                    <span class="stats-card-label">${item.label}</span>
                    <span class="stats-card-value">${item.value}</span>
                </div>
            `;
        });
        html += '</div>';
        financeResults.innerHTML = html;
    }

    renderInputs();
})();
