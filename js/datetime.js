(function() {
    const datetimeToggle = document.getElementById('datetime-toggle');
    const datetimePanel = document.getElementById('datetime-panel');
    const datetimeBackdrop = document.getElementById('datetime-backdrop');
    const datetimeClose = document.getElementById('datetime-close');
    const datetimeMode = document.getElementById('datetime-mode');
    const datetimeInputs = document.getElementById('datetime-inputs');
    const datetimeCalcBtn = document.getElementById('datetime-calc-btn');
    const datetimeResults = document.getElementById('datetime-results');

    const togglePanel = () => {
        const isOpen = datetimePanel.classList.toggle('open');
        datetimeBackdrop.classList.toggle('visible');
        datetimePanel.setAttribute('aria-hidden', !isOpen);
        if (isOpen) renderInputs();
    };

    datetimeToggle.addEventListener('click', togglePanel);
    datetimeClose.addEventListener('click', togglePanel);
    datetimeBackdrop.addEventListener('click', togglePanel);

    datetimeMode.addEventListener('change', () => {
        renderInputs();
        datetimeResults.innerHTML = '<div class="stats-empty-msg">Selecciona una operación.</div>';
    });

    function renderInputs() {
        const mode = datetimeMode.value;
        let html = '';

        if (mode === 'diff') {
            html = `
                <div>
                    <label class="stats-label">Fecha Inicial</label>
                    <input type="date" id="dt-start" class="stats-textarea" style="height:auto; padding:8px;">
                </div>
                <div>
                    <label class="stats-label">Fecha Final</label>
                    <input type="date" id="dt-end" class="stats-textarea" style="height:auto; padding:8px;">
                </div>
            `;
        } else if (mode === 'add') {
            html = `
                <div>
                    <label class="stats-label">Fecha Base</label>
                    <input type="date" id="dt-base" class="stats-textarea" style="height:auto; padding:8px;">
                </div>
                <div style="display:flex; gap:10px;">
                    <div style="flex:1;">
                        <label class="stats-label">Añadir/Restar</label>
                        <select id="dt-op" class="stats-textarea" style="height:auto; padding:8px;">
                            <option value="add">Añadir (+)</option>
                            <option value="sub">Restar (-)</option>
                        </select>
                    </div>
                    <div style="flex:1;">
                        <label class="stats-label">Cantidad</label>
                        <input type="number" id="dt-qty" class="stats-textarea" value="1">
                    </div>
                </div>
                <div>
                    <label class="stats-label">Unidad</label>
                    <select id="dt-unit" class="stats-textarea" style="height:auto; padding:8px;">
                        <option value="days">Días</option>
                        <option value="weeks">Semanas</option>
                        <option value="months">Meses</option>
                        <option value="years">Años</option>
                    </select>
                </div>
            `;
        }

        datetimeInputs.innerHTML = html;
        
        // Set default dates to today
        const today = new Date().toISOString().split('T')[0];
        if (document.getElementById('dt-start')) document.getElementById('dt-start').value = today;
        if (document.getElementById('dt-end')) document.getElementById('dt-end').value = today;
        if (document.getElementById('dt-base')) document.getElementById('dt-base').value = today;
    }

    datetimeCalcBtn.addEventListener('click', () => {
        const mode = datetimeMode.value;
        let results = [];

        try {
            if (mode === 'diff') {
                const startStr = document.getElementById('dt-start').value;
                const endStr = document.getElementById('dt-end').value;
                if (!startStr || !endStr) throw new Error("Selecciona ambas fechas");

                const start = new Date(startStr);
                const end = new Date(endStr);
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const diffWeeks = (diffDays / 7).toFixed(1);

                results = [
                    { label: "Días de Diferencia", value: diffDays },
                    { label: "Semanas aprox.", value: diffWeeks }
                ];
            } else if (mode === 'add') {
                const baseStr = document.getElementById('dt-base').value;
                const op = document.getElementById('dt-op').value;
                const qty = parseInt(document.getElementById('dt-qty').value);
                const unit = document.getElementById('dt-unit').value;

                if (!baseStr || isNaN(qty)) throw new Error("Valores inválidos");

                const date = new Date(baseStr);
                const factor = op === 'add' ? 1 : -1;

                if (unit === 'days') date.setDate(date.getDate() + (qty * factor));
                else if (unit === 'weeks') date.setDate(date.getDate() + (qty * 7 * factor));
                else if (unit === 'months') date.setMonth(date.getMonth() + (qty * factor));
                else if (unit === 'years') date.setFullYear(date.getFullYear() + (qty * factor));

                results = [
                    { label: "Resultado", value: date.toLocaleDateString() },
                    { label: "Día de la semana", value: date.toLocaleDateString(undefined, { weekday: 'long' }) }
                ];
            }

            renderResults(results);
        } catch (e) {
            datetimeResults.innerHTML = `<div style="color:#ef4444; text-align:center; padding:10px;">Error: ${e.message}</div>`;
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
        datetimeResults.innerHTML = html;
    }

    renderInputs();
})();
