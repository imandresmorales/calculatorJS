/**
 * matrices.js — Calculadora de Matrices
 *
 * Buenas prácticas aplicadas:
 *  • IIFE — módulo aislado, sin contaminación del scope global.
 *  • Toda renderización de datos de usuario usa textContent, nunca innerHTML.
 *  • Validación estricta de dimensiones antes de cada operación.
 *  • Algoritmos numéricos con tolerancia épsilon para evitar falsos positivos.
 *  • Exponenciación binaria para potencias de matrices (O(log n) multiplicaciones).
 *  • Gauss-Jordan con pivoteo parcial para mayor estabilidad numérica.
 *  • Expansión de cofactores para determinantes (hasta 5×5).
 *  • Los Object URLs de descarga se revocan tras el uso.
 */

(function () {
    'use strict';

    // ── Constantes ────────────────────────────────────────────────────────────
    const MIN_DIM  = 1;
    const MAX_DIM  = 5;
    const EPSILON  = 1e-9;      // Tolerancia para valores cercanos a cero
    const MAX_RAND = 9;         // Rango de relleno aleatorio: −MAX_RAND … MAX_RAND

    // ── Estado ────────────────────────────────────────────────────────────────
    let rowsA = 2, colsA = 2;
    let rowsB = 2, colsB = 2;
    let selectedOp = 'add';
    let lastResult  = null;     // Matriz resultado — para la función copiar

    // ── Refs DOM ──────────────────────────────────────────────────────────────
    const panel    = document.getElementById('matrix-panel');
    const backdrop = document.getElementById('matrix-backdrop');
    const openBtn  = document.getElementById('matrix-toggle');
    const closeBtn = document.getElementById('matrix-close');

    const gridA = document.getElementById('mat-a-grid');
    const gridB = document.getElementById('mat-b-grid');

    const selAR = document.getElementById('mat-a-rows');
    const selAC = document.getElementById('mat-a-cols');
    const selBR = document.getElementById('mat-b-rows');
    const selBC = document.getElementById('mat-b-cols');

    const blockB      = document.getElementById('mat-block-b');
    const scalarRow   = document.getElementById('mat-scalar-row');
    const powerRow    = document.getElementById('mat-power-row');
    const scalarInput = document.getElementById('mat-scalar-input');
    const powerInput  = document.getElementById('mat-power-input');

    const calcBtn  = document.getElementById('mat-calc-btn');
    const swapBtn  = document.getElementById('mat-swap-btn');
    const copyBtn  = document.getElementById('mat-copy-btn');

    const resultEl = document.getElementById('mat-result');
    const stepsEl  = document.getElementById('mat-steps');

    // Salida anticipada si el panel no existe en el DOM
    if (!panel || !gridA) return;

    // ──────────────────────────────────────────────────────────────────────────
    // SECCIÓN 1: Selectores de dimensión
    // ──────────────────────────────────────────────────────────────────────────

    function buildDimSelect(sel, current) {
        sel.innerHTML = '';
        for (let i = MIN_DIM; i <= MAX_DIM; i++) {
            const opt = document.createElement('option');
            opt.value       = i;
            opt.textContent = i;
            if (i === current) opt.selected = true;
            sel.appendChild(opt);
        }
    }

    buildDimSelect(selAR, rowsA);
    buildDimSelect(selAC, colsA);
    buildDimSelect(selBR, rowsB);
    buildDimSelect(selBC, colsB);

    selAR.addEventListener('change', () => { rowsA = +selAR.value; renderGrid(gridA, rowsA, colsA); });
    selAC.addEventListener('change', () => { colsA = +selAC.value; renderGrid(gridA, rowsA, colsA); });
    selBR.addEventListener('change', () => { rowsB = +selBR.value; renderGrid(gridB, rowsB, colsB); });
    selBC.addEventListener('change', () => { colsB = +selBC.value; renderGrid(gridB, rowsB, colsB); });

    // ──────────────────────────────────────────────────────────────────────────
    // SECCIÓN 2: Renderizado y lectura de cuadrículas
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Construye la cuadrícula de inputs para una matriz.
     * @param {HTMLElement} container - div contenedor
     * @param {number} rows
     * @param {number} cols
     * @param {number[][]|null} values - valores iniciales opcionales
     */
    function renderGrid(container, rows, cols, values = null) {
        container.innerHTML = '';
        container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const inp = document.createElement('input');
                inp.type      = 'number';
                inp.className = 'matrix-cell';
                inp.step      = 'any';
                inp.value     = (values && values[r]?.[c] !== undefined) ? values[r][c] : 0;
                inp.dataset.row = r;
                inp.dataset.col = c;
                inp.setAttribute('aria-label', `Fila ${r + 1}, columna ${c + 1}`);

                // Seleccionar contenido al enfocar (edición rápida)
                inp.addEventListener('focus', () => inp.select());

                // Navegación con teclas de flecha
                inp.addEventListener('keydown', e => handleCellKey(e, container, r, c, rows, cols));

                container.appendChild(inp);
            }
        }
    }

    /**
     * Navegación flechas: arriba/abajo/izquierda/derecha entre celdas.
     */
    function handleCellKey(e, container, r, c, rows, cols) {
        let nr = r, nc = c;
        if (e.key === 'ArrowUp')    { nr = Math.max(0, r - 1); }
        else if (e.key === 'ArrowDown')  { nr = Math.min(rows - 1, r + 1); }
        else if (e.key === 'ArrowLeft')  { nc = Math.max(0, c - 1); }
        else if (e.key === 'ArrowRight') { nc = Math.min(cols - 1, c + 1); }
        else if (e.key === 'Enter')      { calcBtn.click(); return; }
        else return;

        e.preventDefault();
        const target = container.querySelector(`[data-row="${nr}"][data-col="${nc}"]`);
        target?.focus();
    }

    /**
     * Lee los valores de una cuadrícula y los devuelve como matriz 2D de números.
     * Valores no numéricos se tratan como 0.
     */
    function readGrid(container, rows, cols) {
        const m = [];
        for (let r = 0; r < rows; r++) {
            m[r] = [];
            for (let c = 0; c < cols; c++) {
                const inp = container.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                const v   = parseFloat(inp?.value ?? 0);
                m[r][c]   = isFinite(v) ? v : 0;
            }
        }
        return m;
    }

    // Render inicial
    renderGrid(gridA, rowsA, colsA);
    renderGrid(gridB, rowsB, colsB);

    // ──────────────────────────────────────────────────────────────────────────
    // SECCIÓN 3: Botones de presets (Rand, Identidad, Ceros)
    // ──────────────────────────────────────────────────────────────────────────

    function fillRandom(grid, rows, cols) {
        grid.querySelectorAll('.matrix-cell').forEach(inp => {
            inp.value = Math.floor(Math.random() * (2 * MAX_RAND + 1)) - MAX_RAND;
        });
    }

    function fillZeros(grid) {
        grid.querySelectorAll('.matrix-cell').forEach(inp => { inp.value = 0; });
    }

    function fillIdentity(grid, rows, cols) {
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const inp = grid.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                if (inp) inp.value = r === c ? 1 : 0;
            }
        }
    }

    document.getElementById('mat-a-rand')?.addEventListener('click', () => fillRandom(gridA, rowsA, colsA));
    document.getElementById('mat-a-iden')?.addEventListener('click', () => fillIdentity(gridA, rowsA, colsA));
    document.getElementById('mat-a-zero')?.addEventListener('click', () => fillZeros(gridA));
    document.getElementById('mat-b-rand')?.addEventListener('click', () => fillRandom(gridB, rowsB, colsB));
    document.getElementById('mat-b-iden')?.addEventListener('click', () => fillIdentity(gridB, rowsB, colsB));
    document.getElementById('mat-b-zero')?.addEventListener('click', () => fillZeros(gridB));

    // ──────────────────────────────────────────────────────────────────────────
    // SECCIÓN 4: Selector de operación
    // ──────────────────────────────────────────────────────────────────────────

    const UNARY_OPS = new Set(['transpose', 'det', 'inv', 'rank', 'scalar', 'power']);

    document.querySelectorAll('.mat-op-btn[data-op]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mat-op-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedOp = btn.dataset.op;
            updateOpUI();
        });
    });

    function updateOpUI() {
        const unary = UNARY_OPS.has(selectedOp);
        blockB.style.opacity       = unary ? '0.35' : '1';
        blockB.style.pointerEvents = unary ? 'none' : 'auto';
        scalarRow.style.display    = selectedOp === 'scalar' ? 'flex' : 'none';
        powerRow.style.display     = selectedOp === 'power'  ? 'flex' : 'none';
    }
    updateOpUI();

    // ──────────────────────────────────────────────────────────────────────────
    // SECCIÓN 5: Álgebra lineal (algoritmos puros — sin efectos secundarios)
    // ──────────────────────────────────────────────────────────────────────────

    /** Copia profunda de una matriz 2D. */
    function deepCopy(m) { return m.map(r => [...r]); }

    /** Redondea valores cercanos a 0 para eliminar ruido de punto flotante. */
    function clean(v) {
        if (Math.abs(v) < EPSILON) return 0;
        return parseFloat(v.toPrecision(10));
    }

    function matAdd(a, b) {
        return a.map((row, i) => row.map((v, j) => v + b[i][j]));
    }

    function matSub(a, b) {
        return a.map((row, i) => row.map((v, j) => v - b[i][j]));
    }

    /** Multiplicación matricial estándar. Devuelve null si dimensiones incompatibles. */
    function matMul(a, b) {
        const ra = a.length, ca = a[0].length, rb = b.length, cb = b[0].length;
        if (ca !== rb) return null;
        const res = Array.from({ length: ra }, () => new Array(cb).fill(0));
        for (let i = 0; i < ra; i++)
            for (let k = 0; k < ca; k++)
                if (a[i][k] !== 0)               // optimización: saltar ceros
                    for (let j = 0; j < cb; j++)
                        res[i][j] += a[i][k] * b[k][j];
        return res;
    }

    function matScalar(a, k) {
        return a.map(row => row.map(v => v * k));
    }

    function matTranspose(a) {
        const rows = a.length, cols = a[0].length;
        return Array.from({ length: cols }, (_, j) =>
            Array.from({ length: rows }, (_, i) => a[i][j])
        );
    }

    /** Submatriz eliminando la fila `row` y columna `col`. */
    function subMatrix(m, row, col) {
        return m
            .filter((_, i) => i !== row)
            .map(r => r.filter((_, j) => j !== col));
    }

    /**
     * Determinante por expansión de cofactores (Laplace).
     * Complejidad O(n!) — adecuado para ≤ 5×5.
     * @param {number[][]} m - matriz cuadrada
     * @returns {number|null}
     */
    function matDet(m) {
        const n = m.length;
        if (n !== m[0].length) return null;
        if (n === 1) return m[0][0];
        if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
        let d = 0;
        for (let j = 0; j < n; j++) {
            if (m[0][j] === 0) continue; // optimización
            d += (j % 2 === 0 ? 1 : -1) * m[0][j] * matDet(subMatrix(m, 0, j));
        }
        return d;
    }

    /**
     * Inversa por Gauss-Jordan con pivoteo parcial.
     * @param {number[][]} m - matriz cuadrada
     * @returns {number[][]|null} - inversa, o null si es singular
     */
    function matInverse(m) {
        const n = m.length;
        if (n !== m[0].length) return null;

        // Construir matriz aumentada [A | I]
        const aug = m.map((row, i) => [
            ...row.map(v => v),
            ...Array.from({ length: n }, (_, j) => i === j ? 1 : 0)
        ]);

        // Eliminación Gauss-Jordan con pivoteo parcial
        for (let col = 0; col < n; col++) {
            // Encontrar fila con el mayor valor absoluto en esta columna (pivote)
            let maxRow = col;
            for (let r = col + 1; r < n; r++) {
                if (Math.abs(aug[r][col]) > Math.abs(aug[maxRow][col])) maxRow = r;
            }
            [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]]; // intercambio

            if (Math.abs(aug[col][col]) < EPSILON) return null; // matriz singular

            const pivot = aug[col][col];
            for (let j = 0; j < 2 * n; j++) aug[col][j] /= pivot;

            // Eliminar el resto de filas
            for (let r = 0; r < n; r++) {
                if (r === col) continue;
                const factor = aug[r][col];
                if (factor === 0) continue;
                for (let j = 0; j < 2 * n; j++) aug[r][j] -= factor * aug[col][j];
            }
        }

        return aug.map(row => row.slice(n));
    }

    /**
     * Rango de una matriz mediante eliminación gaussiana con pivoteo parcial.
     */
    function matRank(m) {
        const rows = m.length, cols = m[0].length;
        const mat  = deepCopy(m);
        let rank = 0, pivotRow = 0;

        for (let col = 0; col < cols && pivotRow < rows; col++) {
            let found = -1;
            for (let r = pivotRow; r < rows; r++) {
                if (Math.abs(mat[r][col]) > EPSILON) { found = r; break; }
            }
            if (found === -1) continue;

            [mat[pivotRow], mat[found]] = [mat[found], mat[pivotRow]];
            const pv = mat[pivotRow][col];
            for (let j = col; j < cols; j++) mat[pivotRow][j] /= pv;

            for (let r = 0; r < rows; r++) {
                if (r === pivotRow) continue;
                const f = mat[r][col];
                if (Math.abs(f) < EPSILON) continue;
                for (let j = col; j < cols; j++) mat[r][j] -= f * mat[pivotRow][j];
            }
            rank++;
            pivotRow++;
        }
        return rank;
    }

    /**
     * Potencia de matriz usando exponenciación binaria: O(n³ · log k).
     * @param {number[][]} m - matriz cuadrada
     * @param {number} exp - exponente entero no negativo
     * @returns {number[][]|null}
     */
    function matPower(m, exp) {
        const n = m.length;
        if (n !== m[0].length) return null;
        if (exp < 0 || exp > 20) return null;

        // n^0 = Identidad
        if (exp === 0) {
            return Array.from({ length: n }, (_, i) =>
                Array.from({ length: n }, (_, j) => i === j ? 1 : 0)
            );
        }

        let result = null;
        let base   = deepCopy(m);
        let e      = exp;

        while (e > 0) {
            if (e % 2 === 1) {
                result = result ? matMul(result, base) : deepCopy(base);
            }
            base = matMul(base, base);
            e    = Math.floor(e / 2);
        }
        return result;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // SECCIÓN 6: Formateo de números
    // ──────────────────────────────────────────────────────────────────────────

    function fmt(v) {
        if (!isFinite(v) || isNaN(v)) return '∞';
        const c = clean(v);
        if (c === 0) return '0';
        if (Number.isInteger(c)) return String(c);
        // Hasta 5 decimales significativos, sin ceros trailing
        return parseFloat(c.toPrecision(6)).toString();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // SECCIÓN 7: Generación de pasos (contenido legible — no datos de usuario)
    // ──────────────────────────────────────────────────────────────────────────

    /** Genera líneas de procedimiento. Todas son strings de nuestro código (seguro con textContent). */
    function generateSteps(op, a, b, result) {
        const ra = a.length, ca = a[0].length;

        switch (op) {
            case 'add':
            case 'sub': {
                const sym = op === 'add' ? '+' : '−';
                const lines = [`Operación: ${op === 'add' ? 'suma' : 'resta'} elemento a elemento`, ''];
                const limit = Math.min(ra, 3);
                const climit = Math.min(ca, 3);
                for (let i = 0; i < limit; i++) {
                    for (let j = 0; j < climit; j++) {
                        const av = fmt(a[i][j]), bv = fmt(b[i][j]);
                        const rv = fmt(clean(op === 'add' ? a[i][j]+b[i][j] : a[i][j]-b[i][j]));
                        lines.push(`  C[${i+1},${j+1}] = ${av} ${sym} ${bv} = ${rv}`);
                    }
                }
                if (ra > 3 || ca > 3) lines.push('  ...');
                return lines;
            }
            case 'mul': {
                const rb = b.length, cb = b[0].length;
                const lines = [
                    `Multiplicación: A(${ra}×${ca}) × B(${rb}×${cb}) = C(${ra}×${cb})`,
                    `Regla: C[i,j] = Σ A[i,k]·B[k,j]  para k = 1…${ca}`, ''
                ];
                const rlimit = Math.min(ra, 2), climit = Math.min(cb, 2);
                for (let i = 0; i < rlimit; i++) {
                    for (let j = 0; j < climit; j++) {
                        const terms = a[i].map((v, k) => `${fmt(v)}·${fmt(b[k][j])}`).join(' + ');
                        const rv    = fmt(clean(a[i].reduce((s, v, k) => s + v * b[k][j], 0)));
                        lines.push(`  C[${i+1},${j+1}] = ${terms} = ${rv}`);
                    }
                }
                if (ra > 2 || cb > 2) lines.push('  ...');
                return lines;
            }
            case 'scalar': {
                const k = parseFloat(scalarInput.value) || 0;
                return [
                    `Multiplicación escalar: k = ${fmt(k)}`,
                    '',
                    `Cada elemento de A se multiplica por ${fmt(k)}.`,
                    `B[i,j] = ${fmt(k)} · A[i,j]`
                ];
            }
            case 'transpose':
                return [
                    `Transpuesta: A(${ra}×${ca}) → Aᵀ(${ca}×${ra})`,
                    '',
                    `Aᵀ[j, i] = A[i, j]`,
                    `Se intercambian filas y columnas.`
                ];
            case 'det': {
                const n = ra;
                if (n === 1) return [`det(A) = ${fmt(a[0][0])}`];
                if (n === 2) {
                    const d = clean(matDet(a));
                    return [
                        `Determinante 2×2 (regla de Sarrus):`,
                        `  det(A) = a·d − b·c`,
                        `         = ${fmt(a[0][0])}·${fmt(a[1][1])} − ${fmt(a[0][1])}·${fmt(a[1][0])}`,
                        `         = ${fmt(clean(a[0][0]*a[1][1]))} − ${fmt(clean(a[0][1]*a[1][0]))}`,
                        `         = ${fmt(d)}`
                    ];
                }
                // n ≥ 3: mostrar expansión de la primera fila
                const lines = [
                    `Determinante ${n}×${n} — Expansión de cofactores (1.ª fila):`, ''
                ];
                let expr = '  det(A) = ';
                for (let j = 0; j < n; j++) {
                    const sign = j % 2 === 0 ? '+' : '−';
                    const cof  = clean(matDet(subMatrix(a, 0, j)));
                    expr += `${sign} ${fmt(a[0][j])}·(${fmt(cof)}) `;
                    lines.push(expr.trimEnd());
                    expr = '          ';
                }
                lines.push('', `  = ${fmt(clean(matDet(a)))}`);
                return lines;
            }
            case 'inv': {
                const d = clean(matDet(a));
                return [
                    `Inversa — Método Gauss-Jordan:`,
                    '',
                    `1. Construir matriz aumentada [A | I]`,
                    `2. Aplicar operaciones elementales de fila`,
                    `   hasta transformar la parte izquierda en I`,
                    `3. La parte derecha resultante es A⁻¹`,
                    '',
                    `det(A) = ${fmt(d)} ≠ 0  ✓  (la inversa existe)`
                ];
            }
            case 'rank': {
                const r = matRank(a);
                return [
                    `Rango — Eliminación gaussiana (RREF):`,
                    '',
                    `El rango es el número de filas pivote`,
                    `en la forma escalonada reducida por filas.`,
                    '',
                    `rk(A) = ${r}  (de ${Math.min(ra, ca)} posible${Math.min(ra, ca) > 1 ? 's' : ''})`
                ];
            }
            case 'power': {
                const exp = parseInt(powerInput.value) || 0;
                return [
                    `Potencia de matriz: A^${exp}`,
                    '',
                    `Algoritmo: Exponenciación binaria.`,
                    `Complejidad: O(n³ · log ${exp}) multiplicaciones matriciales.`,
                    exp === 0 ? '' : `A^${exp} = A × A × … (${exp} veces)`,
                    exp === 0 ? `A^0 = I  (matriz identidad por definición)` : ''
                ].filter(l => l !== undefined);
            }
            default:
                return [];
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // SECCIÓN 8: Renderizado de resultados (seguro con textContent)
    // ──────────────────────────────────────────────────────────────────────────

    function showError(msg) {
        resultEl.innerHTML = '';
        const div = document.createElement('div');
        div.className   = 'mat-error-msg';
        div.textContent = msg;       // Mensaje de nuestro código — seguro
        resultEl.appendChild(div);
        stepsEl.innerHTML = '';
        lastResult = null;
    }

    function renderScalarResult(label, value) {
        resultEl.innerHTML = '';

        const wrap  = document.createElement('div');
        wrap.className = 'mat-scalar-result';

        const lbl = document.createElement('span');
        lbl.className   = 'mat-scalar-label';
        lbl.textContent = label;

        const val = document.createElement('span');
        val.className   = 'mat-scalar-value';
        val.textContent = fmt(clean(value));

        wrap.appendChild(lbl);
        wrap.appendChild(val);
        resultEl.appendChild(wrap);

        lastResult = [[value]];
    }

    function renderMatrixResult(mat) {
        resultEl.innerHTML = '';
        if (!mat?.length) return;

        const rows = mat.length, cols = mat[0].length;

        // Wrapper con brackets
        const wrap = document.createElement('div');
        wrap.className = 'mat-result-wrap';

        const bL = document.createElement('div');
        bL.className = 'mat-bracket mat-bracket-l';
        bL.setAttribute('aria-hidden', 'true');

        const grid = document.createElement('div');
        grid.className = 'mat-result-grid';
        grid.style.gridTemplateColumns = `repeat(${cols}, max-content)`;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = document.createElement('div');
                cell.className   = 'mat-result-cell';
                cell.textContent = fmt(clean(mat[r][c]));  // textContent — seguro
                grid.appendChild(cell);
            }
        }

        const bR = document.createElement('div');
        bR.className = 'mat-bracket mat-bracket-r';
        bR.setAttribute('aria-hidden', 'true');

        wrap.appendChild(bL);
        wrap.appendChild(grid);
        wrap.appendChild(bR);
        resultEl.appendChild(wrap);

        // Dimensiones debajo
        const info = document.createElement('div');
        info.className   = 'mat-result-info';
        info.textContent = `${rows} × ${cols}`;
        resultEl.appendChild(info);

        lastResult = mat;
    }

    function renderSteps(lines) {
        stepsEl.innerHTML = '';
        lines.forEach(line => {
            const div = document.createElement('div');
            div.className   = (line === '') ? 'mat-step-gap' : 'mat-step-line';
            div.textContent = line;     // Texto de nuestro código — seguro
            stepsEl.appendChild(div);
        });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // SECCIÓN 9: Motor de cálculo principal
    // ──────────────────────────────────────────────────────────────────────────

    function compute() {
        const a = readGrid(gridA, rowsA, colsA);
        const b = readGrid(gridB, rowsB, colsB);

        // Limpiar resultado anterior
        lastResult = null;

        try {
            let result, steps;

            switch (selectedOp) {
                case 'add': {
                    if (rowsA !== rowsB || colsA !== colsB) {
                        return showError(`La suma requiere matrices del mismo tamaño. A es ${rowsA}×${colsA} y B es ${rowsB}×${colsB}.`);
                    }
                    result = matAdd(a, b);
                    steps  = generateSteps('add', a, b, result);
                    break;
                }
                case 'sub': {
                    if (rowsA !== rowsB || colsA !== colsB) {
                        return showError(`La resta requiere matrices del mismo tamaño. A es ${rowsA}×${colsA} y B es ${rowsB}×${colsB}.`);
                    }
                    result = matSub(a, b);
                    steps  = generateSteps('sub', a, b, result);
                    break;
                }
                case 'mul': {
                    if (colsA !== rowsB) {
                        return showError(`Para A × B, las columnas de A (${colsA}) deben coincidir con las filas de B (${rowsB}).`);
                    }
                    result = matMul(a, b);
                    steps  = generateSteps('mul', a, b, result);
                    break;
                }
                case 'scalar': {
                    const k = parseFloat(scalarInput.value);
                    if (!isFinite(k)) return showError('Introduce un escalar k válido.');
                    result = matScalar(a, k);
                    steps  = generateSteps('scalar', a, null, result);
                    break;
                }
                case 'transpose': {
                    result = matTranspose(a);
                    steps  = generateSteps('transpose', a, null, result);
                    break;
                }
                case 'det': {
                    if (rowsA !== colsA) return showError(`El determinante requiere una matriz cuadrada. A es ${rowsA}×${colsA}.`);
                    const d = matDet(a);
                    steps   = generateSteps('det', a, null, null);
                    renderSteps(steps);
                    return renderScalarResult('det(A) =', d);
                }
                case 'inv': {
                    if (rowsA !== colsA) return showError(`La inversa requiere una matriz cuadrada. A es ${rowsA}×${colsA}.`);
                    const inv = matInverse(a);
                    if (!inv) return showError('La matriz es singular (det = 0) y no tiene inversa.');
                    result = inv;
                    steps  = generateSteps('inv', a, null, result);
                    break;
                }
                case 'rank': {
                    const rk = matRank(a);
                    steps    = generateSteps('rank', a, null, null);
                    renderSteps(steps);
                    return renderScalarResult('rk(A) =', rk);
                }
                case 'power': {
                    if (rowsA !== colsA) return showError(`La potencia requiere una matriz cuadrada. A es ${rowsA}×${colsA}.`);
                    const exp = parseInt(powerInput.value);
                    if (!isFinite(exp) || exp < 0 || exp > 20) return showError('El exponente n debe ser un entero entre 0 y 20.');
                    result = matPower(a, exp);
                    steps  = generateSteps('power', a, null, result);
                    break;
                }
                default:
                    return;
            }

            if (!result) return showError('No se pudo calcular el resultado.');
            renderMatrixResult(result);
            renderSteps(steps);

        } catch (err) {
            showError('Ocurrió un error inesperado en el cálculo.');
            console.error('[Matrices]', err);
        }
    }

    calcBtn?.addEventListener('click', compute);

    // ──────────────────────────────────────────────────────────────────────────
    // SECCIÓN 10: Intercambiar A ↔ B
    // ──────────────────────────────────────────────────────────────────────────

    swapBtn?.addEventListener('click', () => {
        const vA = readGrid(gridA, rowsA, colsA);
        const vB = readGrid(gridB, rowsB, colsB);

        [rowsA, rowsB] = [rowsB, rowsA];
        [colsA, colsB] = [colsB, colsA];

        selAR.value = rowsA; selAC.value = colsA;
        selBR.value = rowsB; selBC.value = colsB;

        renderGrid(gridA, rowsA, colsA, vB);
        renderGrid(gridB, rowsB, colsB, vA);
    });

    // ──────────────────────────────────────────────────────────────────────────
    // SECCIÓN 11: Copiar resultado (compatible con Excel — separado por tabulaciones)
    // ──────────────────────────────────────────────────────────────────────────

    copyBtn?.addEventListener('click', async () => {
        if (!lastResult) return;

        const text = lastResult
            .map(row => row.map(v => fmt(clean(v))).join('\t'))
            .join('\n');

        try {
            await navigator.clipboard.writeText(text);
        } catch {
            // Fallback para navegadores sin Clipboard API
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:absolute;left:-9999px;top:-9999px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }

        const orig = copyBtn.textContent;
        copyBtn.textContent = '✓ Copiado';
        setTimeout(() => { copyBtn.textContent = orig; }, 1500);
    });

    // ──────────────────────────────────────────────────────────────────────────
    // SECCIÓN 12: Panel abrir / cerrar
    // ──────────────────────────────────────────────────────────────────────────

    function openPanel() {
        panel.classList.add('open');
        panel.setAttribute('aria-hidden', 'false');
        backdrop.classList.add('visible');
        document.body.style.overflow = 'hidden';
        closeBtn?.focus();
    }

    function closePanel() {
        panel.classList.remove('open');
        panel.setAttribute('aria-hidden', 'true');
        backdrop.classList.remove('visible');
        document.body.style.overflow = '';
        openBtn?.focus();
    }

    openBtn?.addEventListener('click',  openPanel);
    closeBtn?.addEventListener('click', closePanel);
    backdrop?.addEventListener('click', closePanel);

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && panel.classList.contains('open')) {
            e.stopPropagation();
            closePanel();
        }
    });

})();
