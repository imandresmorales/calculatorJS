/**
 * pdf-export.js — Improvement #47
 * Export calculation history as a styled PDF document.
 *
 * Uses the browser's native print-to-PDF capability via a hidden iframe,
 * avoiding any external dependencies. The generated page is self-contained
 * HTML with inline CSS.
 *
 * Security:
 *  - All user data is escaped via textContent assignment before injection.
 *  - The iframe is sandboxed (allow-same-origin only for printing).
 *  - The iframe is removed after printing completes.
 */
(function () {
    'use strict';

    /* ── Escape HTML entities (defense-in-depth) ───────────────────────── */
    function escapeHTML(str) {
        const el = document.createElement('span');
        el.textContent = String(str);
        return el.innerHTML;
    }

    /* ── Build PDF-ready HTML ──────────────────────────────────────────── */
    function buildPDFContent(entries) {
        const now = new Date().toLocaleString('es', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });

        const rows = entries.map((e, i) => `
            <tr>
                <td style="color:#64748b;">${i + 1}</td>
                <td>${escapeHTML(e.expression || '')}</td>
                <td style="font-weight:700; color:#0284c7;">= ${escapeHTML(e.result || '')}</td>
                <td style="color:#94a3b8; font-size:0.8em;">${escapeHTML(e.timestamp ? new Date(e.timestamp).toLocaleString('es', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '')}</td>
            </tr>`).join('');

        return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Historial de Cálculos — Calculadora Premium</title>
<style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 32px; color: #1e293b; }
    h1 { font-size: 1.3rem; color: #0f172a; margin-bottom: 4px; }
    .subtitle { font-size: 0.82rem; color: #64748b; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    th { background: #0f172a; color: #f8fafc; text-align: left; padding: 8px 10px; font-weight: 600; font-size: 0.78rem; letter-spacing: 0.06em; }
    td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .footer { margin-top: 24px; font-size: 0.72rem; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
    @media print { body { padding: 16px; } }
</style>
</head>
<body>
    <h1>🧮 Historial de Cálculos</h1>
    <p class="subtitle">Exportado el ${escapeHTML(now)} — ${entries.length} operaciones</p>
    <table>
        <thead><tr><th>#</th><th>Expresión</th><th>Resultado</th><th>Fecha</th></tr></thead>
        <tbody>${rows}</tbody>
    </table>
    <div class="footer">Calculadora Premium — Generado automáticamente</div>
</body>
</html>`;
    }

    /* ── Gather entries from IndexedDB or localStorage ──────────────────── */
    async function getHistoryEntries() {
        // Try IndexedDB first
        if (window.CalcDB) {
            try {
                const rows = await CalcDB.getAll(CalcDB.STORES.history);
                if (rows && rows.length > 0) return rows;
            } catch { /* fall through */ }
        }

        // Fallback: localStorage
        try {
            const raw = localStorage.getItem('calc_history_v1');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch { /* noop */ }

        return [];
    }

    /* ── Print via hidden iframe ────────────────────────────────────────── */
    function printHTML(html) {
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed; top:-9999px; left:-9999px; width:0; height:0; border:none;';
        iframe.setAttribute('sandbox', 'allow-same-origin allow-modals');
        document.body.appendChild(iframe);

        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();

        // Wait for content to render then trigger print
        iframe.contentWindow.addEventListener('afterprint', () => {
            setTimeout(() => iframe.remove(), 500);
        });

        setTimeout(() => {
            try { iframe.contentWindow.print(); } catch { /* noop */ }
            // Fallback removal if afterprint doesn't fire
            setTimeout(() => { if (iframe.parentNode) iframe.remove(); }, 10000);
        }, 300);
    }

    /* ── Public trigger ─────────────────────────────────────────────────── */
    async function exportPDF() {
        const entries = await getHistoryEntries();
        if (entries.length === 0) {
            if (window.showToast) showToast('El historial está vacío', 'info');
            return;
        }
        const html = buildPDFContent(entries);
        printHTML(html);
        if (window.showToast) showToast(`Exportando ${entries.length} operaciones como PDF…`, 'success');
    }

    /* ── Add button to history panel header ─────────────────────────────── */
    const exportBtn = document.getElementById('history-export-btn');
    if (exportBtn) {
        // Clone and replace to remove old CSV-only listener
        const pdfBtn = document.createElement('button');
        pdfBtn.className = exportBtn.className;
        pdfBtn.id = 'history-pdf-btn';
        pdfBtn.textContent = '📄 PDF';
        pdfBtn.title = 'Exportar historial como PDF';
        pdfBtn.setAttribute('aria-label', 'Exportar historial como PDF');
        pdfBtn.style.cssText = exportBtn.style.cssText || '';
        pdfBtn.addEventListener('click', exportPDF);
        exportBtn.parentNode.insertBefore(pdfBtn, exportBtn.nextSibling);
    }

    window.exportHistoryPDF = exportPDF;
})();
