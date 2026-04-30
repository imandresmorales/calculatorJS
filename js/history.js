/**
 * history.js — Módulo de Historial de Operaciones
 *
 * Buenas prácticas aplicadas:
 *  • IIFE para encapsular el módulo y no contaminar el scope global.
 *  • IndexedDB como almacenamiento principal (#33).
 *  • localStorage como fallback automático si IndexedDB no está disponible.
 *  • Renderizado con textContent — nunca innerHTML con datos del usuario (XSS).
 *  • Mitigación de CSV Injection (OWASP).
 *  • Los Object URLs se revocan después del uso para evitar memory leaks.
 *  • Comunicación con script.js mediante CustomEvents (bajo acoplamiento).
 */

(function () {
    'use strict';

    // ── Constantes ────────────────────────────────────────────────────────────
    const STORAGE_KEY        = 'calc_history_v1';
    const MAX_ENTRIES        = 50;
    const MAX_EXPR_LENGTH    = 200;   // chars
    const MAX_RESULT_LENGTH  = 60;    // chars
    const MAX_STORAGE_BYTES  = 50 * 1024; // 50 KB

    // ── Estado interno ────────────────────────────────────────────────────────
    /** @type {Array<{id:string, expression:string, result:string, timestamp:string}>} */
    let entries = [];

    // ── Validación de entradas ────────────────────────────────────────────────
    /**
     * Confirma que un objeto leído de localStorage tiene la forma esperada.
     * Rechaza cualquier tipo inesperado para evitar ejecución de datos corruptos.
     * @param {unknown} e
     * @returns {boolean}
     */
    function isValidEntry(e) {
        return (
            e !== null &&
            typeof e === 'object' &&
            typeof e.id === 'string'         && e.id.length > 0 && e.id.length <= 64 &&
            typeof e.expression === 'string' && e.expression.length <= MAX_EXPR_LENGTH &&
            typeof e.result     === 'string' && e.result.length     <= MAX_RESULT_LENGTH &&
            typeof e.timestamp  === 'string' &&
            /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(e.timestamp)  // ISO 8601 básico
        );
    }

    // ── Persistencia con IndexedDB + localStorage fallback (#33) ─────────────
    const useIDB = typeof CalcDB !== 'undefined';

    function loadFromStorage() {
        if (useIDB) {
            // IndexedDB: load async, then re-render
            CalcDB.getAll(CalcDB.STORES.history).then(rows => {
                entries = rows.map(r => ({
                    id:         String(r.id),
                    expression: String(r.expression).slice(0, MAX_EXPR_LENGTH),
                    result:     String(r.result).slice(0, MAX_RESULT_LENGTH),
                    timestamp:  r.timestamp,
                })).filter(isValidEntry).slice(0, MAX_ENTRIES);
                renderList();
            }).catch(() => {
                entries = loadFromLocalStorage();
                renderList();
            });
            return []; // initial empty; will re-render on promise resolve
        }
        return loadFromLocalStorage();
    }

    function loadFromLocalStorage() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            return parsed
                .filter(isValidEntry)
                .map(e => ({
                    id:         String(e.id).slice(0, 64),
                    expression: String(e.expression).slice(0, MAX_EXPR_LENGTH),
                    result:     String(e.result).slice(0, MAX_RESULT_LENGTH),
                    timestamp:  e.timestamp
                }))
                .slice(0, MAX_ENTRIES);
        } catch { return []; }
    }

    function saveToStorage() {
        if (useIDB) return; // IDB writes happen in addEntry / removeEntry
        try {
            let toSave = entries.slice(0, MAX_ENTRIES);
            let json   = JSON.stringify(toSave);
            while (json.length > MAX_STORAGE_BYTES && toSave.length > 1) {
                toSave = toSave.slice(0, Math.floor(toSave.length * 0.75));
                json   = JSON.stringify(toSave);
            }
            localStorage.setItem(STORAGE_KEY, json);
        } catch (err) {
            console.warn('[History] No se pudo guardar en localStorage:', err.message);
        }
    }

    // ── Gestión de entradas ───────────────────────────────────────────────────
    function generateId() {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    }

    function addEntry(expression, result) {
        const entry = {
            id:         generateId(),
            expression: String(expression).trim().slice(0, MAX_EXPR_LENGTH),
            result:     String(result).trim().slice(0, MAX_RESULT_LENGTH),
            timestamp:  new Date().toISOString(),
        };

        if (useIDB) {
            CalcDB.addEntry(CalcDB.STORES.history, entry).catch(() => {});
        }

        entries.unshift(entry);
        if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
        if (!useIDB) saveToStorage();
        renderList();
        animateHistoryBadge();
    }

    function removeEntry(id) {
        if (useIDB) {
            // IDB keys are auto-incremented numbers; find the IDB key from our entries
            CalcDB.getAll(CalcDB.STORES.history).then(rows => {
                const row = rows.find(r => String(r.id) === String(id) ||
                    (r.expression + r.timestamp) === (entries.find(e => e.id === id)?.expression + entries.find(e => e.id === id)?.timestamp));
                if (row && row.id) CalcDB.delete(CalcDB.STORES.history, row.id).catch(() => {});
            }).catch(() => {});
        }
        entries = entries.filter(e => e.id !== id);
        if (!useIDB) saveToStorage();
        renderList();
    }

    function clearAll() {
        entries = [];
        if (useIDB) {
            CalcDB.clear(CalcDB.STORES.history).catch(() => {});
        } else {
            try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
        }
        renderList();
    }

    // ── DOM ───────────────────────────────────────────────────────────────────
    const panel     = document.getElementById('history-panel');
    const backdrop  = document.getElementById('history-backdrop');
    const listEl    = document.getElementById('history-list');
    const emptyEl   = document.getElementById('history-empty');
    const openBtn   = document.getElementById('history-toggle');
    const closeBtn  = document.getElementById('history-close-btn');
    const clearBtn  = document.getElementById('history-clear-btn');
    const exportBtn = document.getElementById('history-export-btn');

    // Salida anticipada si el DOM no está listo (por ej. tests unitarios)
    if (!panel || !listEl) return;

    // ── Formateo de fecha ─────────────────────────────────────────────────────
    function formatTimestamp(isoString) {
        try {
            return new Date(isoString).toLocaleString('es', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch {
            return '';
        }
    }

    // ── Renderizado seguro ────────────────────────────────────────────────────
    /**
     * Construye y añade un nodo DOM para una entrada del historial.
     * Todo el contenido de usuario se asigna con .textContent (nunca innerHTML).
     * @param {DocumentFragment} fragment
     * @param {{ id, expression, result, timestamp }} entry
     */
    function buildEntryNode(fragment, entry) {
        const item = document.createElement('article');
        item.className = 'history-entry';
        item.dataset.id = entry.id;
        item.setAttribute('role', 'listitem');

        // Línea de expresión
        const exprEl = document.createElement('div');
        exprEl.className = 'history-expr';
        exprEl.textContent = entry.expression;   // ← textContent, no innerHTML

        // Línea de resultado
        const resultEl = document.createElement('div');
        resultEl.className = 'history-result';

        const eqSpan  = document.createElement('span');
        eqSpan.className = 'history-eq';
        eqSpan.textContent = '=';

        const valSpan = document.createElement('span');
        valSpan.className = 'history-val';
        valSpan.textContent = entry.result;      // ← textContent, no innerHTML

        resultEl.appendChild(eqSpan);
        resultEl.appendChild(valSpan);

        // Timestamp
        const tsEl = document.createElement('time');
        tsEl.className  = 'history-ts';
        tsEl.dateTime   = entry.timestamp;
        tsEl.textContent = formatTimestamp(entry.timestamp);

        // Fila de acciones
        const actionsEl = document.createElement('div');
        actionsEl.className = 'history-entry-actions';

        const loadBtn = document.createElement('button');
        loadBtn.className = 'history-load-btn';
        loadBtn.textContent = '↩ Usar';
        loadBtn.title = 'Cargar resultado en la calculadora';
        loadBtn.setAttribute('aria-label', `Cargar ${entry.result} en la calculadora`);
        loadBtn.addEventListener('click', () => loadValue(entry.result));

        const delBtn = document.createElement('button');
        delBtn.className = 'history-del-btn';
        delBtn.textContent = '✕';
        delBtn.title = 'Eliminar esta entrada';
        delBtn.setAttribute('aria-label', `Eliminar: ${entry.expression}`);
        delBtn.addEventListener('click', () => removeEntry(entry.id));

        actionsEl.appendChild(loadBtn);
        actionsEl.appendChild(delBtn);

        item.appendChild(exprEl);
        item.appendChild(resultEl);
        item.appendChild(tsEl);
        item.appendChild(actionsEl);

        fragment.appendChild(item);
    }

    function renderList() {
        // Eliminar entradas previas sin tocar el nodo #history-empty
        listEl.querySelectorAll('.history-entry').forEach(el => el.remove());

        if (entries.length === 0) {
            emptyEl.style.display = 'flex';
            return;
        }

        emptyEl.style.display = 'none';

        const fragment = document.createDocumentFragment();
        entries.forEach(entry => buildEntryNode(fragment, entry));
        listEl.appendChild(fragment);
    }

    // ── Cargar resultado en la calculadora ────────────────────────────────────
    function loadValue(rawResult) {
        // `calculator` está definido en script.js, cargado antes que este archivo.
        // No usamos window.calculator para no depender de que sea enumerable en window.
        if (typeof calculator === 'undefined') {
            console.warn('[History] calculadora no disponible.');
            return;
        }

        const num = parseFloat(rawResult);
        if (!isFinite(num)) return;   // rechazar NaN, Infinity

        calculator.clear();
        calculator.currentOperand = String(rawResult);
        calculator.updateDisplay();
        closePanel();
    }

    // ── Animación badge ───────────────────────────────────────────────────────
    function animateHistoryBadge() {
        if (!openBtn) return;
        openBtn.classList.remove('history-btn-pulse');
        // Forzar reflow para reiniciar la animación
        void openBtn.offsetWidth;
        openBtn.classList.add('history-btn-pulse');
        openBtn.addEventListener('animationend', () => {
            openBtn.classList.remove('history-btn-pulse');
        }, { once: true });
    }

    // ── Panel ─────────────────────────────────────────────────────────────────
    function openPanel() {
        panel.classList.add('open');
        panel.setAttribute('aria-hidden', 'false');
        backdrop.classList.add('visible');
        document.body.style.overflow = 'hidden';
        closeBtn && closeBtn.focus();
    }

    function closePanel() {
        panel.classList.remove('open');
        panel.setAttribute('aria-hidden', 'true');
        backdrop.classList.remove('visible');
        document.body.style.overflow = '';
        openBtn && openBtn.focus();
    }

    if (openBtn)  openBtn.addEventListener('click',  openPanel);
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    if (backdrop) backdrop.addEventListener('click', closePanel);

    // Cerrar con Escape
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && panel.classList.contains('open')) {
            e.stopPropagation();
            closePanel();
        }
    });

    // ── Limpiar historial ─────────────────────────────────────────────────────
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (entries.length === 0) return;
            if (window.confirm('¿Eliminar todo el historial?')) clearAll();
        });
    }

    // ── Exportar CSV ──────────────────────────────────────────────────────────
    /**
     * Protege contra CSV Injection (OWASP):
     * Prefija con comilla simple cualquier valor que comience con =, +, -, @, |, ` o TAB,
     * ya que las hojas de cálculo los interpretan como fórmulas o comandos.
     * @param {string} val
     * @returns {string}
     */
    function csvSafe(val) {
        const s = String(val);
        // Prefijo de neutralización
        if (/^[=+\-@|`\t]/.test(s)) return `'${s}`;
        // Escapado de comillas y campos con comas o saltos de línea
        if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (entries.length === 0) return;

            const header = 'Fecha,Expresion,Resultado\n';
            const rows   = entries
                .map(e => [
                    csvSafe(formatTimestamp(e.timestamp)),
                    csvSafe(e.expression),
                    csvSafe(e.result)
                ].join(','))
                .join('\n');

            // BOM UTF-8 para compatibilidad con Excel
            const blob = new Blob(['\uFEFF' + header + rows], {
                type: 'text/csv;charset=utf-8;'
            });

            const url = URL.createObjectURL(blob);
            const a   = document.createElement('a');
            a.href     = url;
            a.download = `historial-calc-${new Date().toISOString().slice(0, 10)}.csv`;
            // El elemento no necesita estar en el DOM para disparar la descarga en Chrome
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Revocar el Object URL para liberar memoria
            setTimeout(() => URL.revokeObjectURL(url), 1500);
        });
    }

    // ── Escuchar eventos de la calculadora ───────────────────────────────────
    window.addEventListener('calc-result', e => {
        const detail = e.detail;
        // Validación defensiva del payload del evento
        if (!detail || typeof detail !== 'object') return;
        if (typeof detail.expression !== 'string') return;
        if (typeof detail.result     !== 'string') return;
        if (detail.result === '' || detail.result === '0') return;  // Skip triviales

        addEntry(detail.expression, detail.result);
    });

    // ── Inicialización ────────────────────────────────────────────────────────
    entries = loadFromStorage();
    renderList();

})();
