(function() {
    const themeEditorToggle = document.getElementById('theme-editor-toggle');
    const themePanel = document.getElementById('theme-panel');
    const themeBackdrop = document.getElementById('theme-backdrop');
    const themeClose = document.getElementById('theme-close');
    const color1Input = document.getElementById('theme-color-1');
    const color2Input = document.getElementById('theme-color-2');
    const opacityInput = document.getElementById('theme-glass-opacity');
    const applyBtn = document.getElementById('theme-apply-btn');
    const resetBtn = document.getElementById('theme-reset-btn');

    // Default theme values
    const defaultTheme = {
        color1: '#4c1d95',
        color2: '#38bdf8',
        opacity: 50
    };

    const togglePanel = () => {
        const isOpen = themePanel.classList.toggle('open');
        themeBackdrop.classList.toggle('visible');
        themePanel.setAttribute('aria-hidden', !isOpen);
    };

    themeEditorToggle.addEventListener('click', togglePanel);
    themeClose.addEventListener('click', togglePanel);
    themeBackdrop.addEventListener('click', togglePanel);

    function applyTheme(color1, color2, opacity) {
        document.documentElement.style.setProperty('--grad-1', color1);
        document.documentElement.style.setProperty('--grad-2', color2);
        
        // Update opacity for glass panels
        const alpha = (opacity / 100).toFixed(2);
        document.documentElement.style.setProperty('--calc-bg', `rgba(15, 23, 42, ${alpha})`);
    }

    function saveTheme(color1, color2, opacity) {
        localStorage.setItem('calc_custom_theme', JSON.stringify({ color1, color2, opacity }));
    }

    function loadTheme() {
        const saved = localStorage.getItem('calc_custom_theme');
        if (saved) {
            try {
                const theme = JSON.parse(saved);
                color1Input.value = theme.color1;
                color2Input.value = theme.color2;
                opacityInput.value = theme.opacity;
                applyTheme(theme.color1, theme.color2, theme.opacity);
            } catch(e) {
                console.error("Error loading theme", e);
            }
        }
    }

    applyBtn.addEventListener('click', () => {
        const c1 = color1Input.value;
        const c2 = color2Input.value;
        const op = opacityInput.value;
        applyTheme(c1, c2, op);
        saveTheme(c1, c2, op);
        if (window.showToast) showToast('Tema guardado correctamente', 'success');
    });

    resetBtn.addEventListener('click', () => {
        color1Input.value = defaultTheme.color1;
        color2Input.value = defaultTheme.color2;
        opacityInput.value = defaultTheme.opacity;
        applyTheme(defaultTheme.color1, defaultTheme.color2, defaultTheme.opacity);
        localStorage.removeItem('calc_custom_theme');
        if (window.showToast) showToast('Tema restaurado al original', 'info');
    });

    // Presets
    const presets = {
        neon: { c1: '#a855f7', c2: '#ec4899', op: 90 },
        ocean: { c1: '#0ea5e9', c2: '#10b981', op: 90 },
        sunset: { c1: '#f97316', c2: '#eab308', op: 95 },
        hacker: { c1: '#000000', c2: '#22c55e', op: 85 },
        royal: { c1: '#4c1d95', c2: '#38bdf8', op: 50 }
    };

    document.querySelectorAll('.theme-preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const p = presets[e.target.dataset.preset];
            if (p) {
                color1Input.value = p.c1;
                color2Input.value = p.c2;
                opacityInput.value = p.op;
                applyTheme(p.c1, p.c2, p.op);
                saveTheme(p.c1, p.c2, p.op);
            }
        });
    });

    // Initialize CSS variables to match defaults if not set in style.css directly via JS
    // We update the style.css variables format slightly via JS
    loadTheme();
})();
