// Modo Presentación (#39)
(function () {
    const btn = document.getElementById('presentation-toggle');
    const exitBtn = document.getElementById('presentation-exit');
    if (!btn || !exitBtn) return;

    function enterPresentation() {
        document.body.classList.add('presentation-mode');
        document.body.classList.remove('mini-mode');
        if (window.showToast) showToast('Modo Presentación activo — Usa el teclado para operar', 'info');
    }
    function exitPresentation() {
        document.body.classList.remove('presentation-mode');
        if (window.showToast) showToast('Modo Presentación desactivado', 'info');
    }

    btn.addEventListener('click', () => {
        document.body.classList.contains('presentation-mode') ? exitPresentation() : enterPresentation();
    });
    exitBtn.addEventListener('click', exitPresentation);

    // ESC to exit
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && document.body.classList.contains('presentation-mode')) {
            exitPresentation();
        }
    });
})();
