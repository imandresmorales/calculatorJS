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
    });

    resetBtn.addEventListener('click', () => {
        color1Input.value = defaultTheme.color1;
        color2Input.value = defaultTheme.color2;
        opacityInput.value = defaultTheme.opacity;
        applyTheme(defaultTheme.color1, defaultTheme.color2, defaultTheme.opacity);
        localStorage.removeItem('calc_custom_theme');
    });

    // Initialize CSS variables to match defaults if not set in style.css directly via JS
    // We update the style.css variables format slightly via JS
    loadTheme();
})();
