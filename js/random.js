(function() {
    const randomToggle = document.getElementById('random-toggle');
    const randomPanel = document.getElementById('random-panel');
    const randomBackdrop = document.getElementById('random-backdrop');
    const randomClose = document.getElementById('random-close');
    const randomMode = document.getElementById('random-mode');
    const randomInputs = document.getElementById('random-inputs');
    const randomCalcBtn = document.getElementById('random-calc-btn');
    const randomResults = document.getElementById('random-results');

    const togglePanel = () => {
        const isOpen = randomPanel.classList.toggle('open');
        randomBackdrop.classList.toggle('visible');
        randomPanel.setAttribute('aria-hidden', !isOpen);
        if (isOpen) renderInputs();
    };

    randomToggle.addEventListener('click', togglePanel);
    randomClose.addEventListener('click', togglePanel);
    randomBackdrop.addEventListener('click', togglePanel);

    randomMode.addEventListener('change', () => {
        renderInputs();
        randomResults.innerHTML = '<div class="stats-empty-msg">Configura y genera.</div>';
    });

    function renderInputs() {
        const mode = randomMode.value;
        let html = '';

        if (mode === 'number') {
            html = `
                <div style="display:flex; gap:10px;">
                    <div style="flex:1;">
                        <label class="stats-label">Mínimo</label>
                        <input type="number" id="rnd-min" class="stats-textarea" value="1">
                    </div>
                    <div style="flex:1;">
                        <label class="stats-label">Máximo</label>
                        <input type="number" id="rnd-max" class="stats-textarea" value="100">
                    </div>
                </div>
            `;
        } else if (mode === 'dice') {
            html = `
                <div>
                    <label class="stats-label">Tipo de Azar</label>
                    <select id="rnd-dice-type" class="stats-textarea" style="height:auto; padding:8px;">
                        <option value="6">Dado de 6 caras (D6)</option>
                        <option value="20">Dado de 20 caras (D20)</option>
                        <option value="coin">Lanzar Moneda</option>
                    </select>
                </div>
            `;
        } else if (mode === 'list') {
            html = `
                <div>
                    <label class="stats-label">Ingresa los elementos (uno por línea o separados por comas):</label>
                    <textarea id="rnd-list-data" class="stats-textarea" rows="4" placeholder="Opción A, Opción B, Opción C"></textarea>
                </div>
            `;
        }

        randomInputs.innerHTML = html;
    }

    randomCalcBtn.addEventListener('click', () => {
        const mode = randomMode.value;
        let results = [];

        try {
            if (mode === 'number') {
                const min = parseInt(document.getElementById('rnd-min').value);
                const max = parseInt(document.getElementById('rnd-max').value);
                if (isNaN(min) || isNaN(max)) throw new Error("Valores inválidos");
                if (min >= max) throw new Error("Mínimo debe ser menor que máximo");

                const num = Math.floor(Math.random() * (max - min + 1)) + min;
                results = [{ label: "Número Generado", value: num }];
            } else if (mode === 'dice') {
                const type = document.getElementById('rnd-dice-type').value;
                if (type === 'coin') {
                    const coin = Math.random() < 0.5 ? "Cara" : "Cruz";
                    results = [{ label: "Resultado de Moneda", value: coin }];
                } else {
                    const sides = parseInt(type);
                    const roll = Math.floor(Math.random() * sides) + 1;
                    results = [{ label: `Resultado D${sides}`, value: roll }];
                }
            } else if (mode === 'list') {
                const data = document.getElementById('rnd-list-data').value;
                if (!data.trim()) throw new Error("La lista está vacía");

                const items = data.split(/[\n,]+/).map(i => i.trim()).filter(i => i !== "");
                if (items.length < 2) throw new Error("Ingresa al menos 2 opciones");

                const winner = items[Math.floor(Math.random() * items.length)];
                results = [{ label: "Selección al Azar", value: winner }];
            }

            renderResults(results);
        } catch (e) {
            randomResults.innerHTML = `<div style="color:#ef4444; text-align:center; padding:10px;">Error: ${e.message}</div>`;
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
        randomResults.innerHTML = html;
    }

    renderInputs();
})();
