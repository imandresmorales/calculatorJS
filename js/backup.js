(function() {
    const backupToggle = document.getElementById('backup-toggle');
    const backupPanel = document.getElementById('backup-panel');
    const backupBackdrop = document.getElementById('backup-backdrop');
    const backupClose = document.getElementById('backup-close');
    const exportBtn = document.getElementById('backup-export-btn');
    const fileInput = document.getElementById('backup-file-input');
    const results = document.getElementById('backup-results');

    const togglePanel = () => {
        const isOpen = backupPanel.classList.toggle('open');
        backupBackdrop.classList.toggle('visible');
        backupPanel.setAttribute('aria-hidden', !isOpen);
    };

    backupToggle.addEventListener('click', togglePanel);
    backupClose.addEventListener('click', togglePanel);
    backupBackdrop.addEventListener('click', togglePanel);

    function getBackupData() {
        return {
            calc_history: localStorage.getItem('calc_history'),
            calc_favorites: localStorage.getItem('calc_favorites'),
            calc_custom_theme: localStorage.getItem('calc_custom_theme'),
            calc_lang: localStorage.getItem('calc_lang')
        };
    }

    exportBtn.addEventListener('click', () => {
        try {
            const data = getBackupData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `calculator_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            results.innerHTML = `<div style="color:#34d399; text-align:center; padding:10px;">Exportación exitosa.</div>`;
        } catch (e) {
            results.innerHTML = `<div style="color:#ef4444; text-align:center; padding:10px;">Error al exportar.</div>`;
        }
    });

    /* ── Validación del respaldo antes de importarlo ──────────────────────
     * El archivo viene del usuario y podría estar manipulado: se aceptan solo
     * las claves conocidas, con el tipo y formato esperados. */
    const MAX_FILE_BYTES = 1024 * 1024; // 1 MB
    const MAX_VALUE_LENGTH = 500 * 1024;
    const LANGS = ['es', 'en', 'fr'];
    const HEX_COLOR = /^#[0-9a-f]{6}$/i;

    const parseJson = (text) => {
        try { return JSON.parse(text); } catch (_) { return undefined; }
    };

    const isJsonArray = (text) => Array.isArray(parseJson(text));

    const isValidTheme = (text) => {
        const theme = parseJson(text);
        if (!theme || typeof theme !== 'object') return false;
        const opacity = Number(theme.opacity);
        return HEX_COLOR.test(theme.color1) && HEX_COLOR.test(theme.color2) &&
            Number.isFinite(opacity) && opacity >= 0 && opacity <= 100;
    };

    const VALIDATORS = {
        calc_history: isJsonArray,
        calc_favorites: isJsonArray,
        calc_custom_theme: isValidTheme,
        calc_lang: (value) => LANGS.includes(value),
    };

    /** Devuelve solo las entradas válidas, o null si el archivo no es un respaldo. */
    function validateBackup(data) {
        if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
        const valid = {};
        for (const [key, isValid] of Object.entries(VALIDATORS)) {
            const value = data[key];
            if (value === null || value === undefined) continue;
            if (typeof value !== 'string' || value.length > MAX_VALUE_LENGTH || !isValid(value)) return null;
            valid[key] = value;
        }
        return Object.keys(valid).length > 0 ? valid : null;
    }

    function showResult(message, ok) {
        const box = document.createElement('div');
        box.style.cssText = `color:${ok ? '#34d399' : '#ef4444'}; text-align:center; padding:10px;`;
        box.textContent = message;
        results.replaceChildren(box);
    }

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        e.target.value = ''; // Permite volver a elegir el mismo archivo
        if (!file) return;

        if (file.size > MAX_FILE_BYTES) {
            showResult('El archivo es demasiado grande (máximo 1 MB).', false);
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const backup = validateBackup(parseJson(ev.target.result));
            if (!backup) {
                showResult('Archivo inválido o corrupto.', false);
                return;
            }

            Object.entries(backup).forEach(([key, value]) => localStorage.setItem(key, value));
            showResult('Importación exitosa. Recargando…', true);

            // Recarga para aplicar tema e idioma
            setTimeout(() => window.location.reload(), 1500);
        };
        reader.onerror = () => showResult('No se pudo leer el archivo.', false);
        reader.readAsText(file);
    });
})();
