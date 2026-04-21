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

    // Simple math evaluator with variables support
    function evaluateScratchpad() {
        const lines = input.value.split('\n');
        let html = '';
        let vars = {};

        lines.forEach(line => {
            let res = '';
            let val = line.trim();
            
            if (val) {
                try {
                    // Check for variable assignment: x = 5
                    let isAssignment = false;
                    let varName = '';
                    if (val.includes('=')) {
                        const parts = val.split('=');
                        if (parts.length === 2) {
                            varName = parts[0].trim();
                            if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varName)) {
                                isAssignment = true;
                                val = parts[1].trim();
                            }
                        }
                    }

                    // Replace variables in expression
                    let expr = val;
                    Object.keys(vars).forEach(k => {
                        const regex = new RegExp(`\\b${k}\\b`, 'g');
                        expr = expr.replace(regex, `(${vars[k]})`);
                    });

                    // Handle percentages: 100 + 20% -> 100 + (100 * 0.20)
                    // Simplified: just replace 20% with *0.20 for now
                    expr = expr.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');

                    // Use Function to evaluate safely without eval
                    const fn = new Function(`return ${expr}`);
                    const result = fn();

                    if (result !== undefined && !isNaN(result)) {
                        res = result;
                        if (isAssignment) {
                            vars[varName] = result;
                        }
                    } else {
                        res = '';
                    }
                } catch(e) {
                    res = `<span style="color:#ef4444; font-size:0.8rem;">err</span>`;
                }
            }
            // Preserve line breaks exactly
            html += `<div style="height: 1.5em; line-height: 1.5; white-space: pre;">${res !== '' ? res : ' '}</div>`;
        });

        output.innerHTML = html;
    }

    input.addEventListener('input', evaluateScratchpad);
    
    // Sync scrolling
    input.addEventListener('scroll', () => {
        output.scrollTop = input.scrollTop;
    });
})();
