/**
 * fractions.js -- Calculadora de Fracciones para Calculadora Premium
 *
 * Funcionalidades:
 *   * Entrada de fracciones mediante teclado de fraccion (num /, denom)
 *   * Soporte para numeros mixtos  (ej. 2 3/4)
 *   * Operaciones: +, -, x, /
 *   * Simplificacion automatica (GCD)
 *   * Toggle fraccion <-> decimal
 *   * Historial de pasos en tiempo real
 */

'use strict';

// -- Math helpers ----------------------------------------------------------
function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { [a, b] = [b, a % b]; }
    return a || 1;
}

function lcm(a, b) {
    return Math.abs(a * b) / gcd(a, b);
}

/** Normalise a fraction: reduce to lowest terms, denominator always positive */
function simplify(n, d) {
    if (d === 0) return { n: NaN, d: 1 };
    const sign = (n < 0) !== (d < 0) ? -1 : 1;
    n = Math.abs(n); d = Math.abs(d);
    const g = gcd(n, d);
    return { n: sign * (n / g), d: d / g };
}

/** "2 3/4"  ->  { n: 11, d: 4 }   or   "3/4"  ->  { n: 3, d: 4 }   or   "5" -> { n: 5, d: 1 } */
function parseFraction(str) {
    str = str.trim();
    // Mixed: integer space fraction  e.g. "-2 3/4"
    const mixedRe = /^(-?\d+)\s+(\d+)\/(\d+)$/;
    const mMixed = str.match(mixedRe);
    if (mMixed) {
        const whole = parseInt(mMixed[1]);
        const num   = parseInt(mMixed[2]);
        const den   = parseInt(mMixed[3]);
        if (den === 0) return null;
        const absNum = Math.abs(whole) * den + num;
        return simplify(whole < 0 ? -absNum : absNum, den);
    }
    // Pure fraction  "3/4" or "-3/4"
    const fracRe = /^(-?\d+)\/(-?\d+)$/;
    const mFrac = str.match(fracRe);
    if (mFrac) {
        const n = parseInt(mFrac[1]);
        const d = parseInt(mFrac[2]);
        if (d === 0) return null;
        return simplify(n, d);
    }
    // Integer
    const intVal = parseInt(str);
    if (!isNaN(intVal)) return { n: intVal, d: 1 };
    return null;
}

/** Fraction arithmetic */
const Frac = {
    add: (a, b) => simplify(a.n * b.d + b.n * a.d, a.d * b.d),
    sub: (a, b) => simplify(a.n * b.d - b.n * a.d, a.d * b.d),
    mul: (a, b) => simplify(a.n * b.n, a.d * b.d),
    div: (a, b) => {
        if (b.n === 0) return { n: NaN, d: 1 };
        return simplify(a.n * b.d, a.d * b.n);
    }
};

/** Format a fraction object for display */
function fracToString(f, showMixed = false) {
    if (isNaN(f.n)) return 'Error';
    if (f.d === 1) return String(f.n);
    if (showMixed && Math.abs(f.n) >= f.d) {
        const whole = Math.trunc(f.n / f.d);
        const rem   = Math.abs(f.n % f.d);
        return rem === 0 ? String(whole) : `${whole} ${rem}/${f.d}`;
    }
    return `${f.n}/${f.d}`;
}

function fracToDecimal(f) {
    if (isNaN(f.n) || f.d === 0) return 'Error';
    return parseFloat((f.n / f.d).toPrecision(10)).toString();
}

// -- State -----------------------------------------------------------------
const FS = {
    open: false,
    // Input state for the current fraction being typed
    inputPhase: 'num',   // 'num' | 'den'
    inputNum: '',        // numerator string
    inputDen: '',        // denominator string
    inputWhole: '',      // whole part of mixed number (typed before space)

    // Pending binary operation
    left: null,          // Frac object
    op: null,            // '+' | '-' | 'x' | '/'
    justCalculated: false,

    // Display
    showDecimal: false,
    showMixed: true,

    // History steps
    history: []
};

// -- DOM -------------------------------------------------------------------
const fracPanel    = document.getElementById('frac-panel');
const fracBackdrop = document.getElementById('frac-backdrop');
const fracToggle   = document.getElementById('frac-toggle');
const fracClose    = document.getElementById('frac-close');

const fracNumerEl   = document.getElementById('frac-numer');
const fracDenomEl   = document.getElementById('frac-denom');
const fracLineEl    = document.getElementById('frac-line');
const fracWholeEl   = document.getElementById('frac-whole');
const fracExprEl    = document.getElementById('frac-expr');
const fracResultEl  = document.getElementById('frac-result');
const fracTogDecBtn = document.getElementById('frac-tog-dec');
const fracTogMixBtn = document.getElementById('frac-tog-mix');
const fracHistEl    = document.getElementById('frac-history');
const fracClearBtn  = document.getElementById('frac-clear-hist');

// -- Force styles via injected <style> at runtime --------------------------
(function injectFracStyles() {
    var s = document.createElement('style');
    s.id = 'frac-injected-styles';
    s.textContent =
        '.frac-panel{position:fixed!important;top:0!important;right:0!important;bottom:0!important;left:auto!important;width:min(460px,100vw)!important;height:100vh!important;max-height:100vh!important;background:rgba(14,14,28,.97)!important;z-index:300!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;box-sizing:border-box!important;}' +
        '.frac-body{display:flex!important;flex-direction:column!important;overflow-y:auto!important;flex:1!important;}' +
        '.frac-pad{display:grid!important;grid-template-columns:repeat(4,1fr)!important;gap:.45rem!important;}' +
        '.frac-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:299;}' +
        '.frac-backdrop.visible{display:block!important;opacity:1!important;}';
    document.head.appendChild(s);
})();


// -- Render ----------------------------------------------------------------
function renderFrac() {
    // Current input display
    const whole = FS.inputWhole !== '' ? FS.inputWhole + ' ' : '';
    fracWholeEl.textContent = whole;
    fracNumerEl.textContent = FS.inputNum  || (FS.inputPhase === 'num' ? '|' : '0');
    fracDenomEl.textContent = FS.inputDen  || (FS.inputPhase === 'den' ? '|' : '');

    // Show/hide fraction line based on phase
    const hasDen = FS.inputPhase === 'den' || FS.inputDen !== '';
    fracLineEl.style.opacity  = hasDen ? '1' : '0.2';
    fracDenomEl.style.opacity = hasDen ? '1' : '0.3';

    // Highlight active part
    fracNumerEl.classList.toggle('frac-input-active', FS.inputPhase === 'num');
    fracDenomEl.classList.toggle('frac-input-active', FS.inputPhase === 'den');

    // Expression line (left operand + op)
    if (FS.left && FS.op) {
        fracExprEl.textContent = fracToString(FS.left, FS.showMixed) + ' ' + FS.op;
    } else {
        fracExprEl.textContent = '';
    }

    // Result display
    if (FS.justCalculated && FS.left && !FS.op) {
        const txt = FS.showDecimal
            ? fracToDecimal(FS.left)
            : fracToString(FS.left, FS.showMixed);
        fracResultEl.textContent = txt;
        fracResultEl.classList.add('frac-result-visible');
    } else {
        fracResultEl.textContent = '';
        fracResultEl.classList.remove('frac-result-visible');
    }

    // Toggle button labels
    if (fracTogDecBtn) fracTogDecBtn.classList.toggle('active', FS.showDecimal);
    if (fracTogMixBtn) fracTogMixBtn.classList.toggle('active', FS.showMixed);
}

function addHistoryEntry(expr, result) {
    FS.history.unshift({ expr, result });
    if (FS.history.length > 30) FS.history.pop();
    renderHistory();
}

function renderHistory() {
    if (!fracHistEl) return;
    if (FS.history.length === 0) {
        fracHistEl.innerHTML = `<div class="frac-hist-empty">Las operaciones apareceran aqui.</div>`;
        return;
    }
    fracHistEl.innerHTML = FS.history.map(h => `
        <div class="frac-hist-row">
            <span class="frac-hist-expr">${h.expr}</span>
            <span class="frac-hist-eq">= ${h.result}</span>
        </div>
    `).join('');
}

// -- Input helpers ---------------------------------------------------------
function getCurrentFrac() {
    const whole = FS.inputWhole !== '' ? FS.inputWhole : '0';
    const num   = FS.inputNum   !== '' ? FS.inputNum   : '0';
    const den   = FS.inputDen   !== '' ? FS.inputDen   : '1';

    const wholeVal = parseInt(whole) || 0;
    const numVal   = parseInt(num)   || 0;
    const denVal   = parseInt(den)   || 1;

    const totalNum = (wholeVal < 0 ? -1 : 1) * (Math.abs(wholeVal) * denVal + numVal);
    return simplify(totalNum, denVal);
}

function resetInput() {
    FS.inputPhase = 'num';
    FS.inputNum   = '';
    FS.inputDen   = '';
    FS.inputWhole = '';
}

// -- Actions ---------------------------------------------------------------
function fracDigit(d) {
    if (FS.justCalculated) {
        FS.left = null;
        FS.op   = null;
        FS.justCalculated = false;
        resetInput();
    }
    if (FS.inputPhase === 'num') {
        if (FS.inputNum.length >= 12) return;
        // Handle negative sign only at start
        if (d === '-') {
            if (FS.inputNum === '') FS.inputNum = '-';
            return;
        }
        FS.inputNum += d;
    } else {
        if (d === '-') return; // no negative denominator input
        if (FS.inputDen.length >= 8) return;
        FS.inputDen += d;
    }
    renderFrac();
}

function fracSlash() {
    // Transition to denominator phase; save current num as whole if needed
    if (FS.inputPhase === 'den') return;

    if (FS.justCalculated) {
        FS.left = null; FS.op = null; FS.justCalculated = false;
        resetInput();
    }

    // If user already typed something in num, treat it as numerator
    FS.inputPhase = 'den';
    if (FS.inputNum === '' || FS.inputNum === '-') FS.inputNum = '0';
    renderFrac();
}

function fracSpace() {
    // Space: convert current num input to whole part for mixed number
    if (FS.inputPhase !== 'num') return;
    if (FS.inputNum === '' || FS.inputNum === '-') return;
    if (FS.justCalculated) { FS.left = null; FS.op = null; FS.justCalculated = false; resetInput(); return; }
    FS.inputWhole = FS.inputNum;
    FS.inputNum   = '';
    renderFrac();
}

function fracDelete() {
    FS.justCalculated = false;
    if (FS.inputPhase === 'den') {
        if (FS.inputDen.length > 0) {
            FS.inputDen = FS.inputDen.slice(0, -1);
        } else {
            // Go back to numerator phase
            FS.inputPhase = 'num';
        }
    } else {
        if (FS.inputNum.length > 0) {
            FS.inputNum = FS.inputNum.slice(0, -1);
        } else if (FS.inputWhole.length > 0) {
            FS.inputNum   = FS.inputWhole;
            FS.inputWhole = '';
        }
    }
    renderFrac();
}

function fracClearEntry() {
    FS.justCalculated = false;
    if (FS.inputDen !== '') { FS.inputDen = ''; FS.inputPhase = 'den'; }
    else if (FS.inputNum !== '') { FS.inputNum = ''; FS.inputPhase = 'num'; }
    else if (FS.inputWhole !== '') { FS.inputWhole = ''; }
    else { fracClearAll(); }
    renderFrac();
}

function fracClearAll() {
    FS.left = null;
    FS.op   = null;
    FS.justCalculated = false;
    resetInput();
    renderFrac();
}

function fracChooseOp(op) {
    // If we have a pending left and an input, compute first
    if (FS.left && FS.op && !FS.justCalculated) {
        fracEquals(false);
    }
    const cur = getCurrentFrac();
    FS.left = cur;
    FS.op   = op;
    FS.justCalculated = false;
    resetInput();
    renderFrac();
}

function fracEquals(addToHistory = true) {
    if (!FS.left || !FS.op) return;

    const right = getCurrentFrac();
    let result;
    const opMap = { '+': Frac.add, '-': Frac.sub, 'x': Frac.mul, '/': Frac.div };
    const fn = opMap[FS.op];
    if (!fn) return;

    // Build step string before computing
    const lStr = fracToString(FS.left, true);
    const rStr = fracToString(right, true);
    const opSym = FS.op;

    result = fn(FS.left, right);

    // Step detail for history
    const resultFrac = fracToString(result, true);
    const resultDec  = fracToDecimal(result);
    if (addToHistory) {
        addHistoryEntry(`${lStr} ${opSym} ${rStr}`, `${resultFrac} ~= ${resultDec}`);
    }

    FS.left = result;
    FS.op   = null;
    FS.justCalculated = true;
    resetInput();
    renderFrac();
}

function fracNegate() {
    if (FS.justCalculated && FS.left) {
        FS.left = simplify(-FS.left.n, FS.left.d);
        renderFrac();
        return;
    }
    if (FS.inputPhase === 'num') {
        if (FS.inputNum.startsWith('-')) {
            FS.inputNum = FS.inputNum.slice(1);
        } else {
            FS.inputNum = '-' + FS.inputNum;
        }
    }
    renderFrac();
}

function fracInvert() {
    // Swap numerator and denominator of current input or result
    if (FS.justCalculated && FS.left) {
        FS.left = simplify(FS.left.d, FS.left.n);
        renderFrac();
        return;
    }
    const num = FS.inputNum || '1';
    const den = FS.inputDen || '1';
    FS.inputNum   = den;
    FS.inputDen   = num;
    FS.inputPhase = 'den';
    renderFrac();
}

// -- Panel open/close ------------------------------------------------------
function openFracPanel() {
    if (!fracPanel) return;
    FS.open = true;

    // Workaround: Chrome collapses position:fixed height when body has
    // overflow-x:hidden -- set geometry explicitly via individual properties.
    Object.assign(fracPanel.style, {
        position: 'fixed',
        top: '0',
        right: '0',
        bottom: '0',
        left: 'auto',
        width: 'min(460px, 100vw)',
        height: '100vh',
        maxHeight: '100vh',
        zIndex: '300',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
        // Slide in
        transform: 'translateX(0)',
    });

    // Force correct flex on body container
    const body = fracPanel.querySelector('.frac-body');
    if (body) {
        Object.assign(body.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '0.9rem',
            padding: '1rem 1.1rem',
            overflowY: 'auto',
            flex: '1',
        });
    }

    // Force grid on the pad
    const pad = fracPanel.querySelector('.frac-pad');
    if (pad) {
        Object.assign(pad.style, {
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.45rem',
        });
    }

    fracPanel.classList.add('open');
    if (fracBackdrop) fracBackdrop.classList.add('visible');
    document.body.style.overflow = 'hidden';
    renderFrac();
    renderHistory();
}

function closeFracPanel() {
    if (!fracPanel) return;
    FS.open = false;
    // Slide back out
    fracPanel.style.transform = 'translateX(100%)';
    fracPanel.classList.remove('open');
    if (fracBackdrop) fracBackdrop.classList.remove('visible');
    document.body.style.overflow = '';
}

// -- Event bindings --------------------------------------------------------
if (fracToggle)   fracToggle.addEventListener('click', openFracPanel);
if (fracClose)    fracClose.addEventListener('click',  closeFracPanel);
if (fracBackdrop) fracBackdrop.addEventListener('click', closeFracPanel);

// Pad buttons
document.querySelectorAll('.frac-pad button').forEach(btn => {
    const digit  = btn.getAttribute('data-frac-digit');
    const action = btn.getAttribute('data-frac-action');

    if (digit !== null) {
        btn.addEventListener('click', () => fracDigit(digit));
        return;
    }
    if (action) {
        btn.addEventListener('click', () => {
            switch (action) {
                case 'slash':   fracSlash(); break;
                case 'space':   fracSpace(); break;
                case 'delete':  fracDelete(); break;
                case 'clear':   fracClearAll(); break;
                case 'ce':      fracClearEntry(); break;
                case 'negate':  fracNegate(); break;
                case 'invert':  fracInvert(); break;
                case 'equals':  fracEquals(); break;
                case 'add':     fracChooseOp('+'); break;
                case 'sub':     fracChooseOp('-'); break;
                case 'mul':     fracChooseOp('x'); break;
                case 'div':     fracChooseOp('/'); break;
            }
        });
    }
});

// Toggle decimal / mixed
if (fracTogDecBtn) {
    fracTogDecBtn.addEventListener('click', () => {
        FS.showDecimal = !FS.showDecimal;
        renderFrac();
    });
}
if (fracTogMixBtn) {
    fracTogMixBtn.addEventListener('click', () => {
        FS.showMixed = !FS.showMixed;
        renderFrac();
    });
}

// Clear history button
if (fracClearBtn) {
    fracClearBtn.addEventListener('click', () => {
        FS.history = [];
        renderHistory();
    });
}

// Keyboard support (only when open)
document.addEventListener('keydown', e => {
    if (!FS.open) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;

    if (/^[0-9]$/.test(e.key)) { e.preventDefault(); fracDigit(e.key); return; }
    if (e.key === '/') { e.preventDefault(); fracSlash(); return; }
    if (e.key === ' ') { e.preventDefault(); fracSpace(); return; }
    if (e.key === 'Backspace') { e.preventDefault(); fracDelete(); return; }
    if (e.key === 'Escape')    { closeFracPanel(); return; }
    if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); fracEquals(); return; }
    if (e.key === '+') { e.preventDefault(); fracChooseOp('+'); return; }
    if (e.key === '-') { e.preventDefault(); fracChooseOp('-'); return; }
    if (e.key === '*') { e.preventDefault(); fracChooseOp('x'); return; }
    if (e.key === 'Delete') { e.preventDefault(); fracClearEntry(); return; }
    if (e.key === 'n') { e.preventDefault(); fracNegate(); return; }
    if (e.key === 'i') { e.preventDefault(); fracInvert(); return; }
});

// Init
renderFrac();
renderHistory();
