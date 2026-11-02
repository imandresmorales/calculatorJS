/**
 * math-parser.js — Evaluador de expresiones matemáticas seguro.
 *
 * Reemplaza el uso de eval o new Function sobre texto del usuario:
 * la expresión se convierte en tokens, luego en un árbol (AST) y se evalúa
 * recorriéndolo. Nunca se ejecuta código JavaScript arbitrario.
 *
 * Soporta:
 *   - Números: 2, 3.14, .5, 1e-3
 *   - Operadores: + - * / ^ (potencia), % (porcentaje: 20% = 0.2)
 *   - Paréntesis y multiplicación implícita: 2x, 3(x+1), (x+1)(x-1), 2pi
 *   - Funciones: sin cos tan asin acos atan sqrt abs log (base 10) ln exp floor ceil round
 *   - Constantes: pi, e
 *   - Variables pasadas al evaluar: compile('x^2')({ x: 3 }) → 9
 *
 * Uso en el navegador: window.MathParser.compile(expr)
 * Uso en Node (pruebas): require('./math-parser.js').compile(expr)
 */
(function (root) {
    'use strict';

    const MAX_LENGTH = 500;
    const MAX_DEPTH = 100;

    const FUNCTIONS = Object.freeze({
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan,
        asin: Math.asin,
        acos: Math.acos,
        atan: Math.atan,
        sqrt: Math.sqrt,
        abs: Math.abs,
        log: Math.log10,
        ln: Math.log,
        exp: Math.exp,
        floor: Math.floor,
        ceil: Math.ceil,
        round: Math.round,
    });

    const CONSTANTS = Object.freeze({
        pi: Math.PI,
        e: Math.E,
    });

    const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

    /* ── Tokenizador ──────────────────────────────────────────────────────── */
    function tokenize(input) {
        const tokens = [];
        let i = 0;

        while (i < input.length) {
            const ch = input[i];

            if (/\s/.test(ch)) {
                i++;
                continue;
            }

            const numberMatch = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(input.slice(i));
            if (numberMatch) {
                tokens.push({ type: 'number', value: parseFloat(numberMatch[0]) });
                i += numberMatch[0].length;
                continue;
            }

            const identMatch = /^[a-zA-Z_][a-zA-Z0-9_]*/.exec(input.slice(i));
            if (identMatch) {
                tokens.push({ type: 'ident', value: identMatch[0] });
                i += identMatch[0].length;
                continue;
            }

            if ('+-*/^%()'.includes(ch)) {
                tokens.push({ type: 'op', value: ch });
                i++;
                continue;
            }

            // Se aceptan también los símbolos × y ÷ que muestra la calculadora
            if (ch === '×') { tokens.push({ type: 'op', value: '*' }); i++; continue; }
            if (ch === '÷') { tokens.push({ type: 'op', value: '/' }); i++; continue; }

            throw new SyntaxError(`Carácter no válido: "${ch}"`);
        }

        return tokens;
    }

    /* ── Parser (descenso recursivo) ──────────────────────────────────────── */
    // expression := term (('+' | '-') term)*
    // term       := unary (('*' | '/' | implícita) unary)*
    // unary      := ('-' | '+') unary | power
    // power      := postfix ('^' unary)?          (asociativa a la derecha)
    // postfix    := primary '%'*
    // primary    := number | ident | ident '(' expression ')' | '(' expression ')'
    function parse(tokens) {
        let pos = 0;
        let depth = 0;

        const peek = () => tokens[pos];
        const isOp = (value) => peek() && peek().type === 'op' && peek().value === value;
        const expectOp = (value) => {
            if (!isOp(value)) throw new SyntaxError(`Se esperaba "${value}"`);
            pos++;
        };
        const enter = () => {
            if (++depth > MAX_DEPTH) throw new SyntaxError('Expresión demasiado anidada');
        };
        const leave = () => { depth--; };

        function expression() {
            enter();
            let node = term();
            while (isOp('+') || isOp('-')) {
                const op = tokens[pos++].value;
                node = { type: 'binary', op, left: node, right: term() };
            }
            leave();
            return node;
        }

        function startsOperand(token) {
            return token && (token.type === 'number' || token.type === 'ident' || (token.type === 'op' && token.value === '('));
        }

        function term() {
            let node = unary();
            for (;;) {
                if (isOp('*') || isOp('/')) {
                    const op = tokens[pos++].value;
                    node = { type: 'binary', op, left: node, right: unary() };
                } else if (startsOperand(peek())) {
                    // Multiplicación implícita: 2x, 3(x+1), (a)(b)
                    node = { type: 'binary', op: '*', left: node, right: unary() };
                } else {
                    return node;
                }
            }
        }

        function unary() {
            if (isOp('-') || isOp('+')) {
                const op = tokens[pos++].value;
                enter();
                const operand = unary();
                leave();
                return op === '-' ? { type: 'negate', operand } : operand;
            }
            return power();
        }

        function power() {
            const base = postfix();
            if (isOp('^')) {
                pos++;
                enter();
                const exponent = unary();
                leave();
                return { type: 'binary', op: '^', left: base, right: exponent };
            }
            return base;
        }

        function postfix() {
            let node = primary();
            while (isOp('%')) {
                pos++;
                node = { type: 'percent', operand: node };
            }
            return node;
        }

        function primary() {
            const token = peek();
            if (!token) throw new SyntaxError('Expresión incompleta');

            if (token.type === 'number') {
                pos++;
                return { type: 'number', value: token.value };
            }

            if (token.type === 'ident') {
                pos++;
                const name = token.value;
                const lower = name.toLowerCase();
                if (hasOwn(FUNCTIONS, lower) && isOp('(')) {
                    pos++;
                    const arg = expression();
                    expectOp(')');
                    return { type: 'call', name: lower, arg };
                }
                return { type: 'ident', name };
            }

            if (isOp('(')) {
                pos++;
                const node = expression();
                expectOp(')');
                return node;
            }

            throw new SyntaxError(`Símbolo inesperado: "${token.value}"`);
        }

        const ast = expression();
        if (pos < tokens.length) {
            throw new SyntaxError(`Símbolo inesperado: "${tokens[pos].value}"`);
        }
        return ast;
    }

    /* ── Evaluación ───────────────────────────────────────────────────────── */
    function evaluate(node, vars) {
        switch (node.type) {
            case 'number':
                return node.value;
            case 'ident': {
                if (hasOwn(vars, node.name)) return Number(vars[node.name]);
                const lower = node.name.toLowerCase();
                if (hasOwn(CONSTANTS, lower)) return CONSTANTS[lower];
                throw new ReferenceError(`Variable no definida: "${node.name}"`);
            }
            case 'negate':
                return -evaluate(node.operand, vars);
            case 'percent':
                return evaluate(node.operand, vars) / 100;
            case 'call':
                return FUNCTIONS[node.name](evaluate(node.arg, vars));
            case 'binary': {
                const a = evaluate(node.left, vars);
                const b = evaluate(node.right, vars);
                switch (node.op) {
                    case '+': return a + b;
                    case '-': return a - b;
                    case '*': return a * b;
                    case '/': return a / b;
                    case '^': return Math.pow(a, b);
                }
            }
        }
        throw new SyntaxError('Expresión no válida');
    }

    /**
     * Compila una expresión y devuelve una función (vars) => número.
     * Lanza SyntaxError si la expresión no es válida.
     */
    function compile(expr) {
        if (typeof expr !== 'string') throw new TypeError('La expresión debe ser un texto');
        const source = expr.trim();
        if (source === '') throw new SyntaxError('Expresión vacía');
        if (source.length > MAX_LENGTH) throw new SyntaxError('Expresión demasiado larga');

        const ast = parse(tokenize(source));
        return (vars = {}) => evaluate(ast, vars);
    }

    const api = Object.freeze({ compile, FUNCTIONS: Object.keys(FUNCTIONS) });

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        root.MathParser = api;
    }
})(typeof self !== 'undefined' ? self : this);
