(function() {
    const healthToggle = document.getElementById('health-toggle');
    const healthPanel = document.getElementById('health-panel');
    const healthBackdrop = document.getElementById('health-backdrop');
    const healthClose = document.getElementById('health-close');
    const healthMode = document.getElementById('health-mode');
    const healthInputs = document.getElementById('health-inputs');
    const healthCalcBtn = document.getElementById('health-calc-btn');
    const healthResults = document.getElementById('health-results');

    const togglePanel = () => {
        const isOpen = healthPanel.classList.toggle('open');
        healthBackdrop.classList.toggle('visible');
        healthPanel.setAttribute('aria-hidden', !isOpen);
        if (isOpen) renderInputs();
    };

    healthToggle.addEventListener('click', togglePanel);
    healthClose.addEventListener('click', togglePanel);
    healthBackdrop.addEventListener('click', togglePanel);

    healthMode.addEventListener('change', () => {
        renderInputs();
        healthResults.innerHTML = '<div class="stats-empty-msg">Ingresa tus datos físicos.</div>';
    });

    function renderInputs() {
        const mode = healthMode.value;
        let html = '';

        html = `
            <div style="display:flex; gap:10px;">
                <div style="flex:1;">
                    <label class="stats-label">Peso (kg)</label>
                    <input type="number" id="health-weight" class="stats-textarea" placeholder="70" step="0.1">
                </div>
                <div style="flex:1;">
                    <label class="stats-label">Altura (cm)</label>
                    <input type="number" id="health-height" class="stats-textarea" placeholder="175" step="1">
                </div>
            </div>
        `;

        if (mode === 'bmr') {
            html += `
                <div style="display:flex; gap:10px;">
                    <div style="flex:1;">
                        <label class="stats-label">Edad (años)</label>
                        <input type="number" id="health-age" class="stats-textarea" placeholder="25">
                    </div>
                    <div style="flex:1;">
                        <label class="stats-label">Género</label>
                        <select id="health-gender" class="stats-textarea" style="height:auto; padding:8px;">
                            <option value="male">Masculino</option>
                            <option value="female">Femenino</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="stats-label">Nivel de Actividad</label>
                    <select id="health-activity" class="stats-textarea" style="height:auto; padding:8px;">
                        <option value="1.2">Sedentario (poco ejercicio)</option>
                        <option value="1.375">Ligero (1-3 días/sem)</option>
                        <option value="1.55">Moderado (3-5 días/sem)</option>
                        <option value="1.725">Fuerte (6-7 días/sem)</option>
                        <option value="1.9">Muy fuerte (atleta)</option>
                    </select>
                </div>
            `;
        }

        healthInputs.innerHTML = html;
    }

    healthCalcBtn.addEventListener('click', () => {
        const mode = healthMode.value;
        const weight = parseFloat(document.getElementById('health-weight').value);
        const height = parseFloat(document.getElementById('health-height').value);
        let results = [];

        try {
            if (isNaN(weight) || isNaN(height) || weight <= 0 || height <= 0) {
                throw new Error("Ingresa peso y altura válidos");
            }

            if (mode === 'bmi') {
                const heightM = height / 100;
                const bmi = weight / (heightM * heightM);
                let category = "";
                let color = "#34d399";

                if (bmi < 18.5) { category = "Bajo peso"; color = "#60a5fa"; }
                else if (bmi < 25) { category = "Peso normal"; color = "#34d399"; }
                else if (bmi < 30) { category = "Sobrepeso"; color = "#fbbf24"; }
                else { category = "Obesidad"; color = "#ef4444"; }

                results = [
                    { label: "Tu IMC", value: bmi.toFixed(1) },
                    { label: "Categoría", value: category, color: color }
                ];
            } else if (mode === 'bmr') {
                const age = parseInt(document.getElementById('health-age').value);
                const gender = document.getElementById('health-gender').value;
                const activity = parseFloat(document.getElementById('health-activity').value);

                if (isNaN(age) || age <= 0) throw new Error("Ingresa una edad válida");

                // Mifflin-St Jeor Equation
                let bmr = (10 * weight) + (6.25 * height) - (5 * age);
                bmr = (gender === 'male') ? bmr + 5 : bmr - 161;

                const maintenance = bmr * activity;

                results = [
                    { label: "Tasa Metabólica (BMR)", value: `${Math.round(bmr)} kcal` },
                    { label: "Mantenimiento", value: `${Math.round(maintenance)} kcal` }
                ];
            }

            renderResults(results);
        } catch (e) {
            healthResults.innerHTML = `<div style="color:#ef4444; text-align:center; padding:10px;">Error: ${e.message}</div>`;
        }
    });

    function renderResults(data) {
        let html = '<div class="stats-grid">';
        data.forEach(item => {
            const valStyle = item.color ? `style="color: ${item.color}"` : "";
            html += `
                <div class="stats-card">
                    <span class="stats-card-label">${item.label}</span>
                    <span class="stats-card-value" ${valStyle}>${item.value}</span>
                </div>
            `;
        });
        html += '</div>';
        healthResults.innerHTML = html;
    }

    renderInputs();
})();
