/**
 * programmer.js — Modo Programador para Calculadora Premium
 * Funcionalidades:
 *   • Cambio de base en tiempo real: DEC ↔ HEX ↔ OCT ↔ BIN
 *   • Operadores bitwise: AND, OR, XOR, NOT, <<, >>
 *   • Visualización de los 32 bits del número actual
 *   • Entrada en cualquier base desde el teclado de la UI
 */

// ── State ─────────────────────────────────────────────────────────────────
const ProgrammerState = {
    open: false,
    base: 10,          // current input/display base (2, 8, 10, 16)
    value: 0,          // current integer value (safe 32-bit signed)
    accumulator: null, // left operand for bitwise binary ops
    pendingOp: null,   // pending bitwise operation symbol
    freshResult: false // true right after = is pressed
};

// ── DOM references ────────────────────────────────────────────────────────
const progPanel     = document.getElementById('prog-panel');
const progBackdrop  = document.getElementById('prog-backdrop');
const progToggleBtn = document.getElementById('prog-toggle');
const progCloseBtn  = document.getElementById('prog-close');

const progDisplay   = document.getElementById('prog-display');
const progExpr      = document.getElementById('prog-expr');
const progDecView   = document.getElementById('prog-dec-view');
const progHexView   = document.getElementById('prog-hex-view');
const progOctView   = document.getElementById('prog-oct-view');
const progBinView   = document.getElementById('prog-bin-view');

const bitGrid       = document.getElementById('prog-bit-grid');
const baseButtons   = document.querySelectorAll('.prog-base-btn');
const progPadBtns   = document.querySelectorAll('.prog-pad button');

// ── Helpers ───────────────────────────────────────────────────────────────
function toSigned32(n) {
    return (n | 0); // coerce to signed 32-bit integer
}

function basePrefix(base) {
    const map = { 2: '0b', 8: '0o', 16: '0x', 10: '' };
    return map[base] || '';
}

function formatInBase(value, base) {
    const n = toSigned32(value);
    if (n < 0) {
        // show negative sign + absolute value in base
        return '-' + Math.abs(n).toString(base).toUpperCase();
    }
    return n.toString(base).toUpperCase();
}

function groupBin(binStr) {
    // Group binary string into nibbles (4-bit groups) for readability
    const clean = binStr.replace(/^-/, '');
    const sign  = binStr.startsWith('-') ? '-' : '';
    const padded = clean.padStart(Math.ceil(clean.length / 4) * 4, '0');
    return sign + padded.match(/.{1,4}/g).join(' ');
}

// ── Render ────────────────────────────────────────────────────────────────
function renderProgrammer() {
    const v = toSigned32(ProgrammerState.value);

    // Main display
    const dispStr = formatInBase(v, ProgrammerState.base);
    if (progDisplay) {
        progDisplay.textContent = dispStr || '0';
        // Shrink font if too wide
        progDisplay.style.fontSize = '';
        const maxW = progDisplay.parentElement ? progDisplay.parentElement.clientWidth - 32 : 400;
        let fs = 36;
        progDisplay.style.fontSize = fs + 'px';
        while (progDisplay.scrollWidth > maxW && fs > 14) {
            fs -= 1;
            progDisplay.style.fontSize = fs + 'px';
        }
    }

    // Expression line
    if (progExpr) {
        if (ProgrammerState.pendingOp && ProgrammerState.accumulator !== null) {
            progExpr.textContent =
                formatInBase(ProgrammerState.accumulator, ProgrammerState.base) +
                ' ' + ProgrammerState.pendingOp;
        } else {
            progExpr.textContent = '';
        }
    }

    // Cross-base views
    if (progDecView) progDecView.textContent = v.toString(10);
    if (progHexView) progHexView.textContent = '0x' + (v < 0 ? '-' + Math.abs(v).toString(16) : v.toString(16)).toUpperCase();
    if (progOctView) progOctView.textContent = '0o' + (v < 0 ? '-' + Math.abs(v).toString(8) : v.toString(8));
    if (progBinView) {
        const binStr = v < 0 ? '-' + Math.abs(v).toString(2) : v.toString(2);
        progBinView.textContent = groupBin(binStr);
    }

    // 32-bit grid
    renderBitGrid(v);

    // Enable/disable digit buttons by base
    updatePadState();
}

function renderBitGrid(value) {
    if (!bitGrid) return;
    // Convert to unsigned 32-bit representation for display
    const u32 = value >>> 0;
    const bits = u32.toString(2).padStart(32, '0').split('');

    // Create or reuse bit cells
    if (bitGrid.children.length !== 32) {
        bitGrid.innerHTML = '';
        for (let i = 0; i < 32; i++) {
            const cell = document.createElement('button');
            cell.className = 'prog-bit-cell';
            cell.setAttribute('data-bit', 31 - i);
            cell.setAttribute('aria-label', `Bit ${31 - i}`);
            cell.addEventListener('click', () => {
                const bit = parseInt(cell.getAttribute('data-bit'));
                ProgrammerState.value = toSigned32(ProgrammerState.value ^ (1 << bit));
                ProgrammerState.freshResult = false;
                renderProgrammer();
            });
            bitGrid.appendChild(cell);
        }
    }

    const cells = bitGrid.querySelectorAll('.prog-bit-cell');
    cells.forEach((cell, idx) => {
        const isOne = bits[idx] === '1';
        cell.textContent = bits[idx];
        cell.classList.toggle('prog-bit-one', isOne);
        cell.classList.toggle('prog-bit-zero', !isOne);

        // Highlight sign bit (bit 31)
        const bitPos = 31 - idx;
        cell.classList.toggle('prog-bit-sign', bitPos === 31);
    });
}

function updatePadState() {
    const base = ProgrammerState.base;
    progPadBtns.forEach(btn => {
        const digit = btn.getAttribute('data-prog-digit');
        if (digit === null) return; // not a digit button
        const d = parseInt(digit, 16); // hex digit value
        btn.disabled = d >= base;
        btn.classList.toggle('prog-digit-disabled', d >= base);
    });
}

// ── Input handling ────────────────────────────────────────────────────────
function progInput(digit) {
    // digit is a string character: '0'-'9', 'A'-'F'
    const d = parseInt(digit, 16);
    if (d >= ProgrammerState.base) return;

    if (ProgrammerState.freshResult) {
        ProgrammerState.value = 0;
        ProgrammerState.freshResult = false;
    }

    const currentStr = formatInBase(ProgrammerState.value, ProgrammerState.base).replace(/^-/, '');
    const sign = ProgrammerState.value < 0 ? -1 : 1;
    const newStr = (currentStr === '0' ? '' : currentStr) + digit.toUpperCase();
    const parsed = parseInt(newStr, ProgrammerState.base);
    if (isNaN(parsed)) return;
    ProgrammerState.value = toSigned32(sign * parsed);
    renderProgrammer();
}

function progDelete() {
    if (ProgrammerState.freshResult) {
        ProgrammerState.value = 0;
        ProgrammerState.freshResult = false;
        renderProgrammer();
        return;
    }
    const str = formatInBase(ProgrammerState.value, ProgrammerState.base).replace(/^-/, '');
    if (str.length <= 1) {
        ProgrammerState.value = 0;
    } else {
        const sign = ProgrammerState.value < 0 ? -1 : 1;
        const newStr = str.slice(0, -1);
        ProgrammerState.value = toSigned32(sign * parseInt(newStr, ProgrammerState.base));
    }
    renderProgrammer();
}

function progClear() {
    ProgrammerState.value = 0;
    ProgrammerState.accumulator = null;
    ProgrammerState.pendingOp = null;
    ProgrammerState.freshResult = false;
    renderProgrammer();
}

function progNegate() {
    ProgrammerState.value = toSigned32(-ProgrammerState.value);
    renderProgrammer();
}

function progSetBase(base) {
    ProgrammerState.base = base;
    baseButtons.forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.getAttribute('data-base')) === base);
    });
    renderProgrammer();
}

// ── Bitwise operations ────────────────────────────────────────────────────
function progBinaryOp(op) {
    if (ProgrammerState.pendingOp !== null && ProgrammerState.accumulator !== null) {
        // Chain: compute current op first
        progCompute();
    }
    ProgrammerState.accumulator = ProgrammerState.value;
    ProgrammerState.pendingOp = op;
    ProgrammerState.freshResult = true;
    renderProgrammer();
}

function progCompute() {
    if (ProgrammerState.pendingOp === null || ProgrammerState.accumulator === null) return;
    const a = ProgrammerState.accumulator;
    const b = ProgrammerState.value;
    let result;
    switch (ProgrammerState.pendingOp) {
        case 'AND': result = a & b; break;
        case 'OR':  result = a | b; break;
        case 'XOR': result = a ^ b; break;
        case '<<':  result = a << b; break;
        case '>>':  result = a >> b; break;
        default: return;
    }
    ProgrammerState.value = toSigned32(result);
    ProgrammerState.accumulator = null;
    ProgrammerState.pendingOp = null;
    ProgrammerState.freshResult = true;
    renderProgrammer();
}

function progUnaryOp(op) {
    const v = ProgrammerState.value;
    let result;
    switch (op) {
        case 'NOT': result = ~v; break;
        case 'ROL': result = ((v << 1) | ((v >>> 31) & 1)); break; // rotate left
        case 'ROR': result = ((v >>> 1) | ((v & 1) << 31)); break; // rotate right
        default: return;
    }
    ProgrammerState.value = toSigned32(result);
    ProgrammerState.freshResult = true;
    renderProgrammer();
}

// ── Panel open/close ──────────────────────────────────────────────────────
function openProgPanel() {
    if (!progPanel) return;
    ProgrammerState.open = true;
    progPanel.classList.add('open');
    if (progBackdrop) progBackdrop.classList.add('visible');
    document.body.style.overflow = 'hidden';
    renderProgrammer();
}

function closeProgPanel() {
    if (!progPanel) return;
    ProgrammerState.open = false;
    progPanel.classList.remove('open');
    if (progBackdrop) progBackdrop.classList.remove('visible');
    document.body.style.overflow = '';
}

// ── Event bindings ────────────────────────────────────────────────────────
if (progToggleBtn) progToggleBtn.addEventListener('click', openProgPanel);
if (progCloseBtn)  progCloseBtn.addEventListener('click',  closeProgPanel);
if (progBackdrop)  progBackdrop.addEventListener('click',  closeProgPanel);

// Base buttons
baseButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        progSetBase(parseInt(btn.getAttribute('data-base')));
    });
});

// Pad buttons
progPadBtns.forEach(btn => {
    const digit  = btn.getAttribute('data-prog-digit');
    const action = btn.getAttribute('data-prog-action');

    if (digit !== null) {
        btn.addEventListener('click', () => progInput(digit));
        return;
    }

    if (action) {
        btn.addEventListener('click', () => {
            switch (action) {
                case 'clear':  progClear();  break;
                case 'delete': progDelete(); break;
                case 'negate': progNegate(); break;
                case 'equals': progCompute(); break;
                case 'AND':
                case 'OR':
                case 'XOR':
                case '<<':
                case '>>':
                    progBinaryOp(action); break;
                case 'NOT': progUnaryOp('NOT'); break;
                case 'ROL': progUnaryOp('ROL'); break;
                case 'ROR': progUnaryOp('ROR'); break;
            }
        });
    }
});

// Keyboard support (only when panel is open)
document.addEventListener('keydown', e => {
    if (!ProgrammerState.open) return;

    const base = ProgrammerState.base;
    const key  = e.key.toUpperCase();

    // Hex digits A-F
    if (['A','B','C','D','E','F'].includes(key) && base === 16 && !e.altKey && !e.ctrlKey) {
        e.preventDefault();
        progInput(key);
        return;
    }
    // Numeric digits 0-9
    if (/^[0-9]$/.test(key) && !e.altKey && !e.ctrlKey) {
        e.preventDefault();
        progInput(key);
        return;
    }
    if (e.key === 'Backspace') { e.preventDefault(); progDelete(); }
    if (e.key === 'Escape')    { closeProgPanel(); }
    if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); progCompute(); }
    if (e.key === '&') { e.preventDefault(); progBinaryOp('AND'); }
    if (e.key === '|') { e.preventDefault(); progBinaryOp('OR'); }
    if (e.key === '^' && base === 10) { e.preventDefault(); progBinaryOp('XOR'); }
    if (e.key === '~') { e.preventDefault(); progUnaryOp('NOT'); }
    if (e.key === '<') { e.preventDefault(); progBinaryOp('<<'); }
    if (e.key === '>') { e.preventDefault(); progBinaryOp('>>'); }
});

// Init (render once to set disabled states)
renderProgrammer();
