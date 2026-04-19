(function() {
    const tipsToggle = document.getElementById('tips-toggle');
    const tipsPanel = document.getElementById('tips-panel');
    const tipsBackdrop = document.getElementById('tips-backdrop');
    const tipsClose = document.getElementById('tips-close');
    const tipsPercent = document.getElementById('tips-percent');
    const tipsCustomBox = document.getElementById('tips-custom-box');
    const tipsCalcBtn = document.getElementById('tips-calc-btn');
    const tipsResults = document.getElementById('tips-results');

    const togglePanel = () => {
        const isOpen = tipsPanel.classList.toggle('open');
        tipsBackdrop.classList.toggle('visible');
        tipsPanel.setAttribute('aria-hidden', !isOpen);
    };

    tipsToggle.addEventListener('click', togglePanel);
    tipsClose.addEventListener('click', togglePanel);
    tipsBackdrop.addEventListener('click', togglePanel);

    tipsPercent.addEventListener('change', () => {
        tipsCustomBox.style.display = (tipsPercent.value === 'custom') ? 'block' : 'none';
    });

    tipsCalcBtn.addEventListener('click', () => {
        const bill = parseFloat(document.getElementById('tips-bill').value);
        const split = parseInt(document.getElementById('tips-split').value);
        let percent = 15;

        try {
            if (isNaN(bill) || bill <= 0) throw new Error("Ingresa el total de la cuenta");
            if (isNaN(split) || split <= 0) throw new Error("Número de personas inválido");

            if (tipsPercent.value === 'custom') {
                percent = parseFloat(document.getElementById('tips-custom-val').value);
            } else {
                percent = parseFloat(tipsPercent.value);
            }

            if (isNaN(percent)) throw new Error("Porcentaje de propina inválido");

            const tipAmount = bill * (percent / 100);
            const total = bill + tipAmount;
            const perPerson = total / split;

            renderResults([
                { label: "Propina Total", value: `$${tipAmount.toFixed(2)}` },
                { label: "Total con Propina", value: `$${total.toFixed(2)}` },
                { label: "Total por Persona", value: `$${perPerson.toFixed(2)}` }
            ]);
        } catch (e) {
            tipsResults.innerHTML = `<div style="color:#ef4444; text-align:center; padding:10px;">Error: ${e.message}</div>`;
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
        tipsResults.innerHTML = html;
    }
})();
