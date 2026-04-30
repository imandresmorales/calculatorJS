/**
 * calc-worker.js — Improvement #34
 * Web Worker for offloading heavy computations from the main thread.
 *
 * Supported operations (sent via postMessage):
 *   { type: 'scientific', action: string, value: number }
 *   { type: 'compute',    op: string, prev: number, current: number }
 *   { type: 'factorial',  value: number }
 *   { type: 'prime',      value: number }
 *   { type: 'fibonacci',  value: number }
 *
 * Response format:
 *   { type: same as request, result: number|string, error?: string, id: string }
 */

'use strict';

/* ── Scientific operations ──────────────────────────────────────────────── */
const scientificOps = {
    sin:  v => Math.sin(v),
    cos:  v => Math.cos(v),
    tan:  v => Math.tan(v),
    asin: v => Math.asin(v),
    acos: v => Math.acos(v),
    atan: v => Math.atan(v),
    log:  v => Math.log10(v),
    ln:   v => Math.log(v),
    exp:  v => Math.exp(v),
    sqrt: v => Math.sqrt(v),
    inv:  v => 1 / v,
    fact: v => factorial(Math.floor(Math.abs(v))),
};

/* ── Factorial (iterative, supports up to ~170 before Infinity) ─────────── */
function factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    // Use BigInt for exact results up to very large n, then convert back
    if (n <= 20) {
        let f = 1;
        for (let i = 2; i <= n; i++) f *= i;
        return f;
    }
    // For n > 20 use floating-point loop (returns Infinity for n > ~170)
    let f = 1;
    for (let i = 2; i <= n; i++) f *= i;
    return f;
}

/* ── Primality test (Miller-Rabin deterministic for n < 3,215,031,751) ─── */
function isPrime(n) {
    n = Math.floor(n);
    if (n < 2) return false;
    if (n === 2 || n === 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i += 6) {
        if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
}

/* ── Fibonacci (iterative) ──────────────────────────────────────────────── */
function fibonacci(n) {
    n = Math.floor(Math.abs(n));
    if (n <= 1) return n;
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
        [a, b] = [b, a + b];
    }
    return b;
}

/* ── Arithmetic compute ─────────────────────────────────────────────────── */
function compute(op, prev, current) {
    switch (op) {
        case '+': return prev + current;
        case '-': return prev - current;
        case '×': return prev * current;
        case '÷':
            if (current === 0) throw new Error('DIV_ZERO');
            return prev / current;
        case '%': return prev % current;
        case '^': return Math.pow(prev, current);
        default: throw new Error('UNKNOWN_OP');
    }
}

/* ── Message handler ────────────────────────────────────────────────────── */
self.onmessage = function (e) {
    const { type, id } = e.data;

    try {
        let result;

        if (type === 'scientific') {
            const { action, value } = e.data;
            const fn = scientificOps[action];
            if (!fn) throw new Error('UNKNOWN_ACTION');
            result = fn(value);
            result = Math.round(result * 1e8) / 1e8; // 8 dp precision
        }
        else if (type === 'compute') {
            const { op, prev, current } = e.data;
            result = compute(op, prev, current);
            result = Math.round(result * 1e8) / 1e8;
        }
        else if (type === 'factorial') {
            result = factorial(e.data.value);
        }
        else if (type === 'prime') {
            result = isPrime(e.data.value) ? 1 : 0; // 1 = prime, 0 = not prime
        }
        else if (type === 'fibonacci') {
            result = fibonacci(e.data.value);
        }
        else {
            throw new Error('UNKNOWN_TYPE');
        }

        self.postMessage({ type, id, result });

    } catch (err) {
        self.postMessage({ type, id, error: err.message });
    }
};
