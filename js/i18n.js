(function() {
    const langToggle = document.getElementById('lang-toggle');
    const langs = ['es', 'en', 'fr'];
    let currentLang = localStorage.getItem('calc_lang') || 'es';

    const translations = {
        es: {
            tooltip_lang: "Idioma (Español)",
            tooltip_history: "Historial de operaciones",
            tooltip_matrix: "Calculadora de Matrices",
            tooltip_frac: "Calculadora de Fracciones",
            tooltip_prog: "Modo Programador",
            tooltip_graph: "Calculadora Gráfica",
            tooltip_unit: "Calculadora de Unidades",
            tooltip_stats: "Estadística",
            tooltip_finance: "Finanzas",
            tooltip_eq: "Ecuaciones",
            tooltip_date: "Fechas",
            tooltip_health: "Salud",
            tooltip_tips: "Propinas",
            tooltip_rand: "Azar",
            tooltip_theme_edit: "Editor de Temas",
            tooltip_scratch: "Papel de Cálculo",
            tooltip_theme: "Cambiar a tema Claro / Oscuro",
            tooltip_mode: "Cambiar modo Científica / Estándar"
        },
        en: {
            tooltip_lang: "Language (English)",
            tooltip_history: "Operation History",
            tooltip_matrix: "Matrix Calculator",
            tooltip_frac: "Fraction Calculator",
            tooltip_prog: "Programmer Mode",
            tooltip_graph: "Graphing Calculator",
            tooltip_unit: "Unit Converter",
            tooltip_stats: "Statistics",
            tooltip_finance: "Finance",
            tooltip_eq: "Equations",
            tooltip_date: "Dates",
            tooltip_health: "Health",
            tooltip_tips: "Tips",
            tooltip_rand: "Random",
            tooltip_theme_edit: "Theme Editor",
            tooltip_scratch: "Scratchpad",
            tooltip_theme: "Toggle Light / Dark theme",
            tooltip_mode: "Toggle Scientific / Standard mode"
        },
        fr: {
            tooltip_lang: "Langue (Français)",
            tooltip_history: "Historique des opérations",
            tooltip_matrix: "Calculatrice matricielle",
            tooltip_frac: "Calculatrice de fractions",
            tooltip_prog: "Mode Programmeur",
            tooltip_graph: "Calculatrice graphique",
            tooltip_unit: "Convertisseur d'unités",
            tooltip_stats: "Statistiques",
            tooltip_finance: "Finances",
            tooltip_eq: "Équations",
            tooltip_date: "Dates",
            tooltip_health: "Santé",
            tooltip_tips: "Pourboires",
            tooltip_rand: "Aléatoire",
            tooltip_theme_edit: "Éditeur de thème",
            tooltip_scratch: "Brouillon",
            tooltip_theme: "Basculer le thème Clair / Sombre",
            tooltip_mode: "Basculer le mode Scientifique / Standard"
        }
    };

    function applyLanguage(lang) {
        const t = translations[lang];
        if (!t) return;

        // Update Tooltips mapping
        const tooltipsMap = {
            'history-toggle': t.tooltip_history,
            'matrix-toggle': t.tooltip_matrix,
            'frac-toggle': t.tooltip_frac,
            'prog-toggle': t.tooltip_prog,
            'graph-toggle': t.tooltip_graph,
            'unit-toggle': t.tooltip_unit,
            'stats-toggle': t.tooltip_stats,
            'finance-toggle': t.tooltip_finance,
            'equations-toggle': t.tooltip_eq,
            'datetime-toggle': t.tooltip_date,
            'health-toggle': t.tooltip_health,
            'tips-toggle': t.tooltip_tips,
            'random-toggle': t.tooltip_rand,
            'theme-editor-toggle': t.tooltip_theme_edit,
            'scratch-toggle': t.tooltip_scratch,
            'theme-toggle': t.tooltip_theme,
            'mode-toggle': t.tooltip_mode,
            'lang-toggle': t.tooltip_lang
        };

        for (const [id, text] of Object.entries(tooltipsMap)) {
            const el = document.getElementById(id);
            if (el) el.setAttribute('data-tooltip', text);
        }
        
        // Additional translations could be done here (titles, buttons, etc)
        // For scope of this improvement, tooltips are the main interaction point translated.
    }

    langToggle.addEventListener('click', () => {
        let idx = langs.indexOf(currentLang);
        idx = (idx + 1) % langs.length;
        currentLang = langs[idx];
        localStorage.setItem('calc_lang', currentLang);
        applyLanguage(currentLang);
    });

    // Init
    applyLanguage(currentLang);

})();
