// Registro del Service Worker (#37)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => {
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            if (window.showToast) showToast('Nueva versión disponible — recarga para actualizar 🔄', 'info');
                        }
                    });
                });
            })
            .catch(() => {});
    });
}
