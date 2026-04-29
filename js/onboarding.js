/**
 * onboarding.js — Improvement #40
 * First-time user product tour.
 * Shows a highlighted tooltip guide on the key dock buttons the first time
 * the app is opened.
 */
(function () {
    const STORAGE_KEY = 'calc_onboarding_done';
    if (localStorage.getItem(STORAGE_KEY)) return; // Already seen

    const steps = [
        {
            targetId: 'mode-toggle',
            title: '🔬 Modo Científico',
            body: 'Activa funciones avanzadas: seno, coseno, logaritmos, factoriales y más.',
            position: 'below',
        },
        {
            targetId: 'graph-toggle',
            title: '📈 Calculadora Gráfica',
            body: 'Dibuja funciones matemáticas como sin(x), x² y más en tiempo real.',
            position: 'below',
        },
        {
            targetId: 'history-toggle',
            title: '📋 Historial',
            body: 'Revisa todos tus cálculos anteriores y reutiliza resultados.',
            position: 'below',
        },
        {
            targetId: 'unit-toggle',
            title: '📐 Conversor de Unidades',
            body: 'Convierte longitud, peso, temperatura, monedas y más.',
            position: 'below',
        },
        {
            targetId: 'theme-editor-toggle',
            title: '🎨 Editor de Temas',
            body: 'Personaliza los colores del fondo y la transparencia a tu gusto.',
            position: 'below',
        },
        {
            targetId: 'presentation-toggle',
            title: '🖥 Modo Presentación',
            body: 'Expande el display a pantalla completa — ideal para clases o reuniones.',
            position: 'below',
        },
    ];

    let currentStep = 0;
    let overlay, bubble, backdrop;

    /* ── Build overlay DOM ────────────────────────────────────────────────── */
    function buildOverlay() {
        backdrop = document.createElement('div');
        backdrop.id = 'onboarding-backdrop';
        backdrop.style.cssText = `
            position:fixed; inset:0; z-index:89998;
            background:rgba(0,0,0,0.65);
            pointer-events:all;
        `;

        bubble = document.createElement('div');
        bubble.id = 'onboarding-bubble';
        bubble.style.cssText = `
            position:fixed; z-index:89999;
            background: rgba(15,23,42,0.95);
            border:1px solid rgba(56,189,248,0.5);
            border-radius: 16px;
            padding: 18px 20px;
            max-width: 280px;
            box-shadow: 0 0 0 3px rgba(56,189,248,0.15), 0 20px 40px rgba(0,0,0,0.6);
            color: #f8fafc;
            font-family: 'Outfit', sans-serif;
            transition: opacity 0.25s ease, transform 0.25s ease;
        `;

        document.body.appendChild(backdrop);
        document.body.appendChild(bubble);
    }

    function renderBubble(step) {
        const target = document.getElementById(step.targetId);
        if (!target) { nextStep(); return; }

        const rect = target.getBoundingClientRect();

        bubble.innerHTML = `
            <div style="font-size:1.05rem; font-weight:700; margin-bottom:6px; color:#38bdf8;">${step.title}</div>
            <div style="font-size:0.88rem; color:#94a3b8; line-height:1.5; margin-bottom:14px;">${step.body}</div>
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                <span style="font-size:0.75rem; color:#475569;">${currentStep + 1} / ${steps.length}</span>
                <div style="display:flex;gap:8px;">
                    <button id="ob-skip" style="background:transparent; border:1px solid rgba(255,255,255,0.15); color:#94a3b8; border-radius:8px; padding:5px 12px; cursor:pointer; font-size:0.8rem;">Omitir</button>
                    <button id="ob-next" style="background:#38bdf8; border:none; color:#0f172a; border-radius:8px; padding:5px 14px; cursor:pointer; font-weight:700; font-size:0.85rem;">
                        ${currentStep < steps.length - 1 ? 'Siguiente →' : '¡Listo! ✓'}
                    </button>
                </div>
            </div>
        `;

        // Highlight target
        target.style.outline = '3px solid #38bdf8';
        target.style.outlineOffset = '4px';
        target.style.borderRadius = '10px';
        target.style.position = 'relative';
        target.style.zIndex = '90000';

        // Position bubble below target
        const bubbleW = 280;
        let left = rect.left + rect.width / 2 - bubbleW / 2;
        left = Math.max(10, Math.min(left, window.innerWidth - bubbleW - 10));
        let top = rect.bottom + 14;
        if (top + 160 > window.innerHeight) top = rect.top - 170;

        bubble.style.left = left + 'px';
        bubble.style.top  = top + 'px';
        bubble.style.width = bubbleW + 'px';
        bubble.style.opacity = '1';
        bubble.style.transform = 'translateY(0)';

        document.getElementById('ob-next').addEventListener('click', nextStep);
        document.getElementById('ob-skip').addEventListener('click', finish);
    }

    function clearHighlight() {
        if (currentStep > 0) {
            const prev = document.getElementById(steps[currentStep - 1]?.targetId);
            if (prev) {
                prev.style.outline = '';
                prev.style.outlineOffset = '';
                prev.style.zIndex = '';
            }
        }
        // Also clear the current one
        const cur = document.getElementById(steps[currentStep]?.targetId);
        if (cur) {
            cur.style.outline = '';
            cur.style.outlineOffset = '';
            cur.style.zIndex = '';
        }
    }

    function nextStep() {
        clearHighlight();
        currentStep++;
        if (currentStep >= steps.length) {
            finish();
        } else {
            renderBubble(steps[currentStep]);
        }
    }

    function finish() {
        clearHighlight();
        if (backdrop) backdrop.remove();
        if (bubble) bubble.remove();
        localStorage.setItem(STORAGE_KEY, '1');
        if (window.showToast) showToast('¡Tour completado! Explora todas las funciones 🚀', 'success');
    }

    /* ── Start after DOM is ready ─────────────────────────────────────────── */
    function start() {
        buildOverlay();
        renderBubble(steps[0]);
        backdrop.addEventListener('click', finish);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(start, 800));
    } else {
        setTimeout(start, 800);
    }
})();
