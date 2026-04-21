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

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                
                if (data.calc_history) localStorage.setItem('calc_history', data.calc_history);
                if (data.calc_favorites) localStorage.setItem('calc_favorites', data.calc_favorites);
                if (data.calc_custom_theme) localStorage.setItem('calc_custom_theme', data.calc_custom_theme);
                if (data.calc_lang) localStorage.setItem('calc_lang', data.calc_lang);
                
                results.innerHTML = `<div style="color:#34d399; text-align:center; padding:10px;">Importación exitosa. Recarga la página.</div>`;
                
                // Force reload to apply theme and lang immediately
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } catch(err) {
                results.innerHTML = `<div style="color:#ef4444; text-align:center; padding:10px;">Archivo inválido o corrupto.</div>`;
            }
        };
        reader.readAsText(file);
    });
})();
