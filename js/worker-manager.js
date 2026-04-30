/**
 * worker-manager.js — Improvement #34
 * Manages the calc-worker.js Web Worker lifecycle.
 *
 * Usage:
 *   CalcWorker.run({ type: 'scientific', action: 'sin', value: 1.5 })
 *     .then(result => console.log(result))
 *     .catch(err => console.error(err));
 *
 * Falls back silently to synchronous execution if Workers are unavailable.
 */
const CalcWorker = (() => {
    let worker = null;
    const pending = new Map(); // id → { resolve, reject }

    /* ── Synchronous fallback ────────────────────────────────────────────── */
    function syncFallback(msg) {
        try {
            let result;
            if (msg.type === 'compute') {
                const { op, prev, current } = msg;
                if (op === '÷' && current === 0) return Promise.reject(new Error('DIV_ZERO'));
                const ops = { '+': prev + current, '-': prev - current, '×': prev * current,
                              '÷': prev / current, '%': prev % current, '^': Math.pow(prev, current) };
                result = Math.round(ops[op] * 1e8) / 1e8;
            } else if (msg.type === 'scientific') {
                const fns = {
                    sin: Math.sin, cos: Math.cos, tan: Math.tan,
                    asin: Math.asin, acos: Math.acos, atan: Math.atan,
                    log: Math.log10, ln: Math.log, exp: Math.exp,
                    sqrt: Math.sqrt, inv: v => 1/v,
                    fact: v => { let f=1; for(let i=2;i<=Math.floor(v);i++) f*=i; return f; },
                };
                result = Math.round(fns[msg.action](msg.value) * 1e8) / 1e8;
            } else if (msg.type === 'factorial') {
                let f = 1; const n = Math.floor(msg.value);
                for (let i = 2; i <= n; i++) f *= i;
                result = f;
            } else if (msg.type === 'prime') {
                const n = Math.floor(msg.value);
                let prime = n >= 2;
                for (let i = 2; i * i <= n && prime; i++) {
                    if (n % i === 0) prime = false;
                }
                result = prime ? 1 : 0;
            } else if (msg.type === 'fibonacci') {
                let a = 0, b = 1, n = Math.floor(Math.abs(msg.value));
                for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
                result = n <= 1 ? n : b;
            }
            return Promise.resolve(result);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /* ── Worker init ─────────────────────────────────────────────────────── */
    function getWorker() {
        if (worker) return worker;
        if (typeof Worker === 'undefined') return null;

        try {
            worker = new Worker('js/calc-worker.js');
            worker.onmessage = e => {
                const { id, result, error } = e.data;
                const p = pending.get(id);
                if (!p) return;
                pending.delete(id);
                error ? p.reject(new Error(error)) : p.resolve(result);
            };
            worker.onerror = err => {
                // On fatal worker error, tear down and clear pending
                console.warn('[CalcWorker] Worker error:', err.message);
                pending.forEach(p => p.reject(new Error('WORKER_ERROR')));
                pending.clear();
                worker = null;
            };
            return worker;
        } catch {
            return null;
        }
    }

    /* ── Public run() ────────────────────────────────────────────────────── */
    function run(msg) {
        const w = getWorker();
        if (!w) return syncFallback(msg);

        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        return new Promise((resolve, reject) => {
            pending.set(id, { resolve, reject });
            w.postMessage({ ...msg, id });
        });
    }

    /* ── Terminate (called on page unload to free resources) ─────────────── */
    function terminate() {
        if (worker) { worker.terminate(); worker = null; }
        pending.clear();
    }

    window.addEventListener('pagehide', terminate);

    return { run, terminate };
})();

window.CalcWorker = CalcWorker;
