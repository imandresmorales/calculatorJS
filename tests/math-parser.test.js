// Pruebas del evaluador seguro. Ejecutar con: node --test tests/
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { compile } = require('../js/math-parser.js');

const calc = (expr, vars) => compile(expr)(vars);
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} ≈ ${expected}`);

test('operaciones básicas y precedencia', () => {
    assert.equal(calc('2 + 3 * 4'), 14);
    assert.equal(calc('(2 + 3) * 4'), 20);
    assert.equal(calc('10 / 4'), 2.5);
    assert.equal(calc('8 - 2 - 1'), 5);
    assert.equal(calc('12 ÷ 3 × 2'), 8);
});

test('potencias y signo negativo', () => {
    assert.equal(calc('2^3^2'), 512); // asociativa a la derecha
    assert.equal(calc('-2^2'), -4); // convención matemática
    assert.equal(calc('(-2)^2'), 4);
    assert.equal(calc('2^-1'), 0.5);
    assert.equal(calc('--3'), 3);
});

test('números decimales y notación científica', () => {
    assert.equal(calc('.5 + 1.25'), 1.75);
    assert.equal(calc('1e3 + 2E-1'), 1000.2);
});

test('porcentaje', () => {
    assert.equal(calc('20%'), 0.2);
    assert.equal(calc('200 * 15%'), 30);
});

test('funciones y constantes', () => {
    close(calc('sin(pi / 2)'), 1);
    close(calc('cos(0)'), 1);
    assert.equal(calc('sqrt(16) + abs(-3)'), 7);
    assert.equal(calc('log(1000)'), 3);
    close(calc('ln(e)'), 1);
    assert.equal(calc('round(2.6) + floor(2.6) + ceil(2.1)'), 8);
    assert.equal(calc('SIN(0)'), 0);
});

test('multiplicación implícita', () => {
    assert.equal(calc('2x', { x: 5 }), 10);
    assert.equal(calc('3(x + 1)', { x: 2 }), 9);
    assert.equal(calc('(x + 1)(x - 1)', { x: 3 }), 8);
    close(calc('2pi'), 2 * Math.PI);
});

test('variables', () => {
    assert.equal(calc('x^2 / 4', { x: 4 }), 4);
    assert.equal(calc('precio * cantidad', { precio: 2.5, cantidad: 4 }), 10);
    assert.throws(() => calc('y + 1', {}), ReferenceError);
});

test('rechaza código JavaScript y entradas inválidas', () => {
    const ataques = [
        'alert(1)',
        'constructor.constructor("return this")()',
        'x; fetch("https://evil.example")',
        'Math.PI',
        '[1,2]',
        '"texto"',
        'a = 1',
        '2 +',
        '(1 + 2',
        '1 + 2)',
        '',
    ];
    for (const expr of ataques) {
        assert.throws(() => calc(expr, { x: 1 }), `debería rechazar: ${expr}`);
    }
});

test('no expone propiedades heredadas como variables', () => {
    assert.throws(() => calc('toString'), ReferenceError);
    assert.throws(() => calc('__proto__'), ReferenceError);
    assert.throws(() => calc('constructor', {}), ReferenceError);
});

test('límites de tamaño y anidamiento', () => {
    assert.throws(() => compile('1+'.repeat(300) + '1'), SyntaxError);
    assert.throws(() => compile('('.repeat(200) + '1' + ')'.repeat(200)), SyntaxError);
});

test('divisiones especiales devuelven Infinity o NaN, sin lanzar', () => {
    assert.equal(calc('1/0'), Infinity);
    assert.ok(Number.isNaN(calc('sqrt(-1)')));
});
