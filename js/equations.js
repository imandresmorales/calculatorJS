(function() {
    const equationsToggle = document.getElementById('equations-toggle');
    const equationsPanel = document.getElementById('equations-panel');
    const equationsBackdrop = document.getElementById('equations-backdrop');
    const equationsClose = document.getElementById('equations-close');
    const equationMode = document.getElementById('equation-mode');
    const equationInputs = document.getElementById('equation-inputs');
    const equationCalcBtn = document.getElementById('equation-calc-btn');
    const equationResults = document.getElementById('equation-results');
    const equationSteps = document.getElementById('equation-steps');

    const togglePanel = () => {
        const isOpen = equationsPanel.classList.toggle('open');
        equationsBackdrop.classList.toggle('visible');
        equationsPanel.setAttribute('aria-hidden', !isOpen);
        if (isOpen) renderInputs();
    };

    equationsToggle.addEventListener('click', togglePanel);
    equationsClose.addEventListener('click', togglePanel);
    equationsBackdrop.addEventListener('click', togglePanel);

    equationMode.addEventListener('change', () => {
        renderInputs();
        equationResults.innerHTML = '<div class="stats-empty-msg">Ingresa los coeficientes.</div>';
        equationSteps.style.display = 'none';
    });

    function renderInputs() {
        const mode = equationMode.value;
        let html = '';

        if (mode === 'linear') {
            html = `
                <div>
                    <label class="stats-label">Coeficiente a (ax + b = 0)</label>
                    <input type="number" id="eq-a" class="stats-textarea" placeholder="a" step="any">
                </div>
                <div>
                    <label class="stats-label">Coeficiente b</label>
                    <input type="number" id="eq-b" class="stats-textarea" placeholder="b" step="any">
                </div>
            `;
        } else if (mode === 'quadratic') {
            html = `
                <div>
                    <label class="stats-label">Coeficiente a (ax² + bx + c = 0)</label>
                    <input type="number" id="eq-qa" class="stats-textarea" placeholder="a" step="any">
                </div>
                <div>
                    <label class="stats-label">Coeficiente b</label>
                    <input type="number" id="eq-qb" class="stats-textarea" placeholder="b" step="any">
                </div>
                <div>
                    <label class="stats-label">Coeficiente c</label>
                    <input type="number" id="eq-qc" class="stats-textarea" placeholder="c" step="any">
                </div>
            `;
        }

        equationInputs.innerHTML = html;
    }

    equationCalcBtn.addEventListener('click', () => {
        const mode = equationMode.value;
        let results = [];
        let stepsHtml = '';

        try {
            if (mode === 'linear') {
                const a = parseFloat(document.getElementById('eq-a').value);
                const b = parseFloat(document.getElementById('eq-b').value);

                if (isNaN(a) || isNaN(b)) throw new Error("Valores inválidos");
                if (a === 0) {
                    if (b === 0) throw new Error("Infinitas soluciones (0=0)");
                    else throw new Error("Sin solución (absurdo)");
                }

                const x = -b / a;
                results = [{ label: "Valor de x", value: x.toFixed(4) }];
                stepsHtml = `
                    <strong>Pasos:</strong><br>
                    1. ax + b = 0<br>
                    2. ${a}x = ${-b}<br>
                    3. x = ${-b} / ${a}<br>
                    4. x = ${x.toFixed(4)}
                `;
            } else if (mode === 'quadratic') {
                const a = parseFloat(document.getElementById('eq-qa').value);
                const b = parseFloat(document.getElementById('eq-qb').value);
                const c = parseFloat(document.getElementById('eq-qc').value);

                if (isNaN(a) || isNaN(b) || isNaN(c)) throw new Error("Valores inválidos");
                if (a === 0) throw new Error("No es una ecuación cuadrática (a=0)");

                const discriminant = b * b - 4 * a * c;
                stepsHtml = `<strong>Discriminante (Δ):</strong> b² - 4ac = ${discriminant.toFixed(2)}<br>`;

                if (discriminant > 0) {
                    const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
                    const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
                    results = [
                        { label: "Raíz x1", value: x1.toFixed(4) },
                        { label: "Raíz x2", value: x2.toFixed(4) }
                    ];
                    stepsHtml += `Dos raíces reales distintas.`;
                } else if (discriminant === 0) {
                    const x = -b / (2 * a);
                    results = [{ label: "Raíz Única", value: x.toFixed(4) }];
                    stepsHtml += `Una raíz real única (doble).`;
                } else {
                    const realPart = (-b / (2 * a)).toFixed(4);
                    const imaginaryPart = (Math.sqrt(-discriminant) / (2 * a)).toFixed(4);
                    results = [
                        { label: "Raíz x1", value: `${realPart} + ${imaginaryPart}i` },
                        { label: "Raíz x2", value: `${realPart} - ${imaginaryPart}i` }
                    ];
                    stepsHtml += `Raíces complejas.`;
                }
            }

            renderResults(results);
            equationSteps.innerHTML = stepsHtml;
            equationSteps.style.display = 'block';
        } catch (e) {
            equationResults.innerHTML = `<div style="color:#ef4444; text-align:center; padding:10px;">Error: ${e.message}</div>`;
            equationSteps.style.display = 'none';
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
        equationResults.innerHTML = html;
    }

    renderInputs();
})();
