(function() {
    const scratchToggle = document.getElementById('scratch-toggle');
    const scratchPanel = document.getElementById('scratch-panel');
    const scratchBackdrop = document.getElementById('scratch-backdrop');
    const scratchClose = document.getElementById('scratch-close');
    const input = document.getElementById('scratch-input');
    const output = document.getElementById('scratch-output');

    const togglePanel = () => {
        const isOpen = scratchPanel.classList.toggle('open');
        scratchBackdrop.classList.toggle('visible');
        scratchPanel.setAttribute('aria-hidden', !isOpen);
        if (isOpen) {
            input.focus();
            evaluateScratchpad();
        }
    };

    scratchToggle.addEventListener('click', togglePanel);
    scratchClose.addEventListener('click', togglePanel);
    scratchBackdrop.addEventListener('click', togglePanel);

    const VAR_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

    /** Crea la línea de resultado usando textContent (nunca innerHTML con datos del usuario). */
    function createResultLine(text, isError) {
        const line = document.createElement('div');
        line.style.height = '1.5em';
        line.style.lineHeight = '1.5';
        line.style.whiteSpace = 'pre';
        if (isError) {
            const err = document.createElement('span');
            err.style.color = '#ef4444';
            err.style.fontSize = '0.8rem';
            err.textContent = 'err';
            line.appendChild(err);
        } else {
            line.textContent = text || ' ';
        }
        return line;
    }

    /**
     * Evalúa cada línea del bloc de notas con soporte de variables (x = 5).
     * Usa MathParser (js/math-parser.js), que no ejecuta código JavaScript.
     */
    function evaluateScratchpad() {
        const vars = Object.create(null);
        const fragment = document.createDocumentFragment();

        input.value.split('\n').forEach(rawLine => {
            const line = rawLine.trim();
            if (!line) {
                fragment.appendChild(createResultLine(''));
                return;
            }

            try {
                let expr = line;
                let varName = null;

                // Asignación de variable: nombre = expresión
                const parts = line.split('=');
                if (parts.length === 2 && VAR_NAME.test(parts[0].trim())) {
                    varName = parts[0].trim();
                    expr = parts[1];
                }

                const result = MathParser.compile(expr)(vars);
                if (!Number.isFinite(result)) throw new RangeError('Resultado no finito');

                const rounded = parseFloat(result.toPrecision(12));
                if (varName) vars[varName] = rounded;
                fragment.appendChild(createResultLine(String(rounded)));
            } catch (_) {
                fragment.appendChild(createResultLine('', true));
            }
        });

        output.replaceChildren(fragment);
    }

    input.addEventListener('input', evaluateScratchpad);
    
    // Sync scrolling
    input.addEventListener('scroll', () => {
        output.scrollTop = input.scrollTop;
    });
})();
