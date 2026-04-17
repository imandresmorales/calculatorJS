class Calculator {
    constructor(previousOperandTextElement, currentOperandTextElement) {
        this.previousOperandTextElement = previousOperandTextElement;
        this.currentOperandTextElement = currentOperandTextElement;
        this.clear();
    }

    clear() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
    }

    delete() {
        if (this.currentOperand === '0') return;
        this.currentOperand = this.currentOperand.toString().slice(0, -1);
        if (this.currentOperand === '') this.currentOperand = '0';
    }

    appendNumber(number) {
        // Previene exceder el límite de dígitos seguros de JavaScript (aprox 15 dígitos)
        if (this.currentOperand && this.currentOperand.toString().replace('.', '').length >= 15) return;

        if (number === '.' && this.currentOperand === '') this.currentOperand = '0';
        if (number === '.' && this.currentOperand.includes('.')) return;
        
        let valToAppend = number;
        if (number === 'π') valToAppend = Math.PI.toString();
        if (number === 'e') valToAppend = Math.E.toString();
        
        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = valToAppend;
        } else if (number === 'π' || number === 'e') {
            this.currentOperand = valToAppend;
        } else {
            this.currentOperand = this.currentOperand.toString() + valToAppend.toString();
        }
    }

    chooseOperation(operation) {
        if (this.currentOperand === '' && operation !== '-') return;
        
        // Handle negative numbers if current is 0 or empty and user types '-'
        if (this.currentOperand === '0' && operation === '-') {
            this.currentOperand = '-';
            return;
        }
        
        if (this.previousOperand !== '') {
            this.compute();
        }
        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.currentOperand = '';
    }

    computeScientific(action) {
        if (this.currentOperand === '') return;
        const current = parseFloat(this.currentOperand);
        if (isNaN(current)) return;
        
        let result;
        switch (action) {
            case 'sin': result = Math.sin(current); break;
            case 'cos': result = Math.cos(current); break;
            case 'tan': result = Math.tan(current); break;
            case 'asin': result = Math.asin(current); break;
            case 'acos': result = Math.acos(current); break;
            case 'atan': result = Math.atan(current); break;
            case 'log': result = Math.log10(current); break;
            case 'ln': result = Math.log(current); break;
            case 'exp': result = Math.exp(current); break;
            case 'sqrt': result = Math.sqrt(current); break;
            case 'inv': result = 1 / current; break;
            case 'fact': 
                if (current < 0) return; // Simplified: no negative factorials
                let f = 1;
                for (let i = 2; i <= Math.floor(current); i++) f *= i;
                result = f;
                break;
            default: return;
        }
        
        this.currentOperand = (Math.round(result * 100000000) / 100000000).toString();
        this.operation = undefined;
        this.previousOperand = '';
    }

    compute() {
        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);
        
        if (isNaN(prev) || isNaN(current)) return;
        
        switch (this.operation) {
            case '+':
                computation = prev + current;
                break;
            case '-':
                computation = prev - current;
                break;
            case '×':
                computation = prev * current;
                break;
            case '÷':
                if (current === 0) {
                    alert('No se puede dividir por cero');
                    this.clear();
                    return;
                }
                computation = prev / current;
                break;
            case '%':
                computation = prev % current;
                break;
            case '^':
                computation = Math.pow(prev, current);
                break;
            default:
                return;
        }
        
        // Fix floating point precision issues
        this.currentOperand = Math.round(computation * 100000000) / 100000000;
        this.operation = undefined;
        this.previousOperand = '';
    }

    getDisplayNumber(number) {
        const stringNumber = number.toString();
        if (stringNumber === '-') return '-';
        
        const integerDigits = parseFloat(stringNumber.split('.')[0]);
        const decimalDigits = stringNumber.split('.')[1];
        
        let integerDisplay;
        if (isNaN(integerDigits)) {
            integerDisplay = '';
        } else {
            integerDisplay = integerDigits.toLocaleString('en', {
                maximumFractionDigits: 0
            });
        }
        
        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits}`;
        } else {
            return integerDisplay || '0';
        }
    }

    updateDisplay() {
        this.currentOperandTextElement.innerText = this.getDisplayNumber(this.currentOperand);
        if (this.operation != null) {
            this.previousOperandTextElement.innerText = 
                `${this.getDisplayNumber(this.previousOperand)} ${this.operation}`;
        } else {
            this.previousOperandTextElement.innerText = '';
        }

        this.fitText(this.currentOperandTextElement);
        this.fitText(this.previousOperandTextElement);
    }

    fitText(element) {
        if (!element || element.innerText === '') return;
        
        // Reset to default CSS font size
        element.style.fontSize = '';
        element.style.transform = '';
        
        const parent = element.parentElement;
        if (!parent) return;
        
        const parentWidth = parent.clientWidth - 10; // minus padding
        let fontSize = parseFloat(window.getComputedStyle(element).fontSize);
        
        while (element.scrollWidth > parentWidth && fontSize > 10) {
            fontSize -= 1;
            element.style.fontSize = fontSize + 'px';
        }
    }
}

// ── History event helpers ──────────────────────────────────────────────────
/**
 * Returns a human-readable expression string from the calculator state,
 * or null if there is no complete binary expression pending.
 */
function buildHistoryExpression() {
    const prev = calculator.previousOperand;
    const op   = calculator.operation;
    const cur  = calculator.currentOperand;
    if (prev !== '' && op && cur !== '') {
        return `${calculator.getDisplayNumber(prev)} ${op} ${calculator.getDisplayNumber(cur)}`;
    }
    return null;
}

/**
 * Dispatches a `calc-result` CustomEvent consumed by history.js.
 * Only strings are transmitted — no executable content.
 * @param {string} expression
 * @param {string} result
 */
function emitHistoryEvent(expression, result) {
    window.dispatchEvent(new CustomEvent('calc-result', {
        detail: {
            expression: String(expression),
            result:     String(result)
        }
    }));
}

// Selectors
const numberButtons = document.querySelectorAll('[data-number]');
const operationButtons = document.querySelectorAll('[data-operator]');
const equalsButton = document.querySelector('[data-action="calculate"]');
const deleteButton = document.querySelector('[data-action="delete"]');
const clearButton = document.querySelector('[data-action="clear"]');
const previousOperandTextElement = document.getElementById('previous-operand');
const currentOperandTextElement = document.getElementById('current-operand');

const calculator = new Calculator(previousOperandTextElement, currentOperandTextElement);
window.calculator = calculator;

// Event Listeners
numberButtons.forEach(button => {
    button.addEventListener('click', () => {
        calculator.appendNumber(button.dataset.number);
        calculator.updateDisplay();
    });
});

operationButtons.forEach(button => {
    button.addEventListener('click', () => {
        calculator.chooseOperation(button.dataset.operator);
        calculator.updateDisplay();
    });
});

const sciButtons = document.querySelectorAll('.btn-sci[data-action]');
sciButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (button.dataset.action === 'pow') {
            calculator.chooseOperation('^');
        } else {
            const prevVal  = calculator.currentOperand;
            const action   = button.dataset.action;
            calculator.computeScientific(action);
            const newVal   = calculator.currentOperand;
            // Emit only when there was a real computation
            if (newVal !== prevVal && !isNaN(parseFloat(newVal))) {
                emitHistoryEvent(`${action}(${prevVal})`, newVal);
            }
        }
        calculator.updateDisplay();
    });
});

equalsButton.addEventListener('click', () => {
    const expr = buildHistoryExpression();
    calculator.compute();
    if (expr) emitHistoryEvent(expr, String(calculator.currentOperand));
    calculator.updateDisplay();
});

clearButton.addEventListener('click', button => {
    calculator.clear();
    calculator.updateDisplay();
});

deleteButton.addEventListener('click', button => {
    calculator.delete();
    calculator.updateDisplay();
});

// Keyboard support
document.addEventListener('keydown', e => {
    // Advanced shortcuts
    if (e.altKey) {
        if (e.key.toLowerCase() === 's') { e.preventDefault(); document.getElementById('mode-toggle')?.click(); return; }
        if (e.key.toLowerCase() === 'g') { e.preventDefault(); document.getElementById('graph-toggle')?.click(); return; }
        if (e.key.toLowerCase() === 'c') { e.preventDefault(); document.getElementById('unit-toggle')?.click(); return; }
        if (e.key.toLowerCase() === 'h') { e.preventDefault(); document.getElementById('history-toggle')?.click(); return; }
        if (e.key.toLowerCase() === 't') { e.preventDefault(); document.getElementById('theme-toggle')?.click(); return; }
    }
    if (e.key === 'F1') {
        e.preventDefault();
        alert('Atajos de teclado:\nAlt + S : Científica\nAlt + G : Gráfica\nAlt + C : Conversor\nAlt + H : Historial\nAlt + T : Tema');
        return;
    }

    if ((e.key >= 0 && e.key <= 9) || e.key === '.') {
        calculator.appendNumber(e.key);
        calculator.updateDisplay();
    }
    if (e.key === '=' || e.key === 'Enter') {
        e.preventDefault();
        const expr = buildHistoryExpression();
        calculator.compute();
        if (expr) emitHistoryEvent(expr, String(calculator.currentOperand));
        calculator.updateDisplay();
    }
    if (e.key === 'Backspace') {
        calculator.delete();
        calculator.updateDisplay();
    }
    if (e.key === 'Escape') {
        calculator.clear();
        calculator.updateDisplay();
    }
    if (e.key === '+' || e.key === '-') {
        calculator.chooseOperation(e.key);
        calculator.updateDisplay();
    }
    if (e.key === '*' || e.key === 'x') {
        calculator.chooseOperation('×');
        calculator.updateDisplay();
    }
    if (e.key === '/') {
        e.preventDefault();
        calculator.chooseOperation('÷');
        calculator.updateDisplay();
    }
    if (e.key === '%') {
        calculator.chooseOperation('%');
        calculator.updateDisplay();
    }
});

// Theme Toggle Logic
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIconLight = document.getElementById('theme-icon-light');
const themeIconDark = document.getElementById('theme-icon-dark');

const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

const setTheme = (isDark) => {
    if (isDark) {
        document.body.classList.remove('light-theme');
        themeIconLight.style.display = 'block';
        themeIconDark.style.display = 'none';
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.add('light-theme');
        themeIconLight.style.display = 'none';
        themeIconDark.style.display = 'block';
        localStorage.setItem('theme', 'light');
    }
};

if (savedTheme === 'light') {
    setTheme(false);
} else if (savedTheme === 'dark') {
    setTheme(true);
} else {
    setTheme(prefersDark);
}

themeToggleBtn.addEventListener('click', () => {
    const isDark = !document.body.classList.contains('light-theme');
    setTheme(!isDark);
});

// Mode Toggle Logic
const modeToggleBtn = document.getElementById('mode-toggle');
if (modeToggleBtn) {
    modeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('scientific-mode');
    });
}

// Unit Converter Logic
const unitToggleBtn = document.getElementById('unit-toggle');
const unitControls = document.getElementById('unit-controls');
const convertedOutput = document.getElementById('converted-output');
const unitCategory = document.getElementById('unit-category');
const unitFrom = document.getElementById('unit-from');
const unitTo = document.getElementById('unit-to');
const currencyInfo = document.getElementById('currency-info');
const currencyRateLabel = document.getElementById('currency-rate-label');
const currencyRefreshBtn = document.getElementById('currency-refresh-btn');
let isUnitMode = false;

// ── Static conversion tables ───────────────────────────────────────────────
const lengthConversionRates = {
    'm': 1, 'km': 1000, 'cm': 0.01, 'mm': 0.001, 'in': 0.0254, 'ft': 0.3048, 'yd': 0.9144
};

const timeConversionRates = {
    'seg': 1, 'min': 60, 'hr': 3600, 'dia': 86400, 'sem': 604800, 'año': 31536000
};

const weightConversionRates = {
    'kg': 1, 'g': 0.001, 'lb': 0.453592, 'oz': 0.0283495, 'ton': 1000
};

const volumeConversionRates = {
    'l': 1, 'ml': 0.001, 'gal': 3.78541, 'm3': 1000, 'floz': 0.0295735
};

// ── Currency state ─────────────────────────────────────────────────────────
let exchangeRates = {};          // rates relative to USD
let ratesLastUpdated = null;
let ratesLoading = false;

const MAIN_CURRENCIES = [
    { code: 'USD', name: 'Dólar estadounidense' },
    { code: 'EUR', name: 'Euro' },
    { code: 'MXN', name: 'Peso mexicano' },
    { code: 'GBP', name: 'Libra esterlina' },
    { code: 'JPY', name: 'Yen japonés' },
    { code: 'CAD', name: 'Dólar canadiense' },
    { code: 'AUD', name: 'Dólar australiano' },
    { code: 'CHF', name: 'Franco suizo' },
    { code: 'CNY', name: 'Yuan chino' },
    { code: 'BRL', name: 'Real brasileño' },
    { code: 'ARS', name: 'Peso argentino' },
    { code: 'COP', name: 'Peso colombiano' },
    { code: 'CLP', name: 'Peso chileno' },
    { code: 'PEN', name: 'Sol peruano' },
    { code: 'INR', name: 'Rupia india' },
    { code: 'KRW', name: 'Won coreano' },
];

const currencyOptionsHTML = MAIN_CURRENCIES.map(c =>
    `<option value="${c.code}">${c.code} – ${c.name}</option>`
).join('');

// ── HTML snippets for unit selects ─────────────────────────────────────────
const lengthOptionsHTML = `
    <option value="m">Metros</option>
    <option value="km">Kilómetros</option>
    <option value="cm">Centímetros</option>
    <option value="mm">Milímetros</option>
    <option value="in">Pulgadas</option>
    <option value="ft">Pies</option>
    <option value="yd">Yardas</option>
`;

const timeOptionsHTML = `
    <option value="seg">Segundos</option>
    <option value="min">Minutos</option>
    <option value="hr">Horas</option>
    <option value="dia">Días</option>
    <option value="sem">Semanas</option>
    <option value="año">Años</option>
`;

const weightOptionsHTML = `
    <option value="kg">Kilogramos</option>
    <option value="g">Gramos</option>
    <option value="lb">Libras</option>
    <option value="oz">Onzas</option>
    <option value="ton">Toneladas</option>
`;

const volumeOptionsHTML = `
    <option value="l">Litros</option>
    <option value="ml">Mililitros</option>
    <option value="gal">Galones</option>
    <option value="m3">Metros Cúbicos</option>
    <option value="floz">Onzas Líquidas</option>
`;

const temperatureOptionsHTML = `
    <option value="c">Celsius (°C)</option>
    <option value="f">Fahrenheit (°F)</option>
    <option value="k">Kelvin (K)</option>
`;

// ── Fetch exchange rates (open.er-api.com – free, no key needed) ───────────
async function fetchExchangeRates() {
    if (ratesLoading) return;
    ratesLoading = true;
    currencyRateLabel.textContent = '⏳ Actualizando tasas…';
    currencyRefreshBtn.style.animation = 'spin 1s linear infinite';

    try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (data.result !== 'success') throw new Error('API error');

        exchangeRates = data.rates;
        ratesLastUpdated = new Date(data.time_last_update_utc);
        showRateLabel();
        updateUnitConversion();
    } catch (err) {
        currencyRateLabel.textContent = '⚠️ Sin conexión – tasas no disponibles';
        console.warn('Currency API error:', err);
    } finally {
        ratesLoading = false;
        currencyRefreshBtn.style.animation = '';
    }
}

function showRateLabel() {
    if (!ratesLastUpdated) return;
    const from = unitFrom.value;
    const to   = unitTo.value;
    if (!exchangeRates[from] || !exchangeRates[to]) return;

    // rate of 'from' relative to 'to'
    const rateUSD_from = exchangeRates[from];
    const rateUSD_to   = exchangeRates[to];
    const rate = rateUSD_to / rateUSD_from;

    const formatted = rate >= 0.01
        ? rate.toLocaleString('es', { maximumFractionDigits: 4 })
        : rate.toExponential(4);

    currencyRateLabel.textContent = `1 ${from} = ${formatted} ${to}`;
}

// ── Category change ────────────────────────────────────────────────────────
if (unitCategory) {
    unitCategory.addEventListener('change', () => {
        const cat = unitCategory.value;
        if (cat === 'length') {
            unitFrom.innerHTML = lengthOptionsHTML;
            unitTo.innerHTML   = lengthOptionsHTML;
            unitFrom.value = 'm';
            unitTo.value   = 'cm';
            currencyInfo.style.display = 'none';
        } else if (cat === 'time') {
            unitFrom.innerHTML = timeOptionsHTML;
            unitTo.innerHTML   = timeOptionsHTML;
            unitFrom.value = 'hr';
            unitTo.value   = 'min';
            currencyInfo.style.display = 'none';
        } else if (cat === 'weight') {
            unitFrom.innerHTML = weightOptionsHTML;
            unitTo.innerHTML   = weightOptionsHTML;
            unitFrom.value = 'kg';
            unitTo.value   = 'lb';
            currencyInfo.style.display = 'none';
        } else if (cat === 'volume') {
            unitFrom.innerHTML = volumeOptionsHTML;
            unitTo.innerHTML   = volumeOptionsHTML;
            unitFrom.value = 'l';
            unitTo.value   = 'gal';
            currencyInfo.style.display = 'none';
        } else if (cat === 'temperature') {
            unitFrom.innerHTML = temperatureOptionsHTML;
            unitTo.innerHTML   = temperatureOptionsHTML;
            unitFrom.value = 'c';
            unitTo.value   = 'f';
            currencyInfo.style.display = 'none';
        } else if (cat === 'currency') {
            unitFrom.innerHTML = currencyOptionsHTML;
            unitTo.innerHTML   = currencyOptionsHTML;
            unitFrom.value = 'USD';
            unitTo.value   = 'MXN';
            currencyInfo.style.display = 'flex';
            if (Object.keys(exchangeRates).length === 0) {
                fetchExchangeRates();
            } else {
                showRateLabel();
            }
        }
        updateUnitConversion();
    });
}

// ── Core conversion ────────────────────────────────────────────────────────
function updateUnitConversion() {
    if (!isUnitMode) return;
    const val = parseFloat(calculator.currentOperand);
    const cat = unitCategory ? unitCategory.value : 'length';

    if (isNaN(val)) {
        convertedOutput.innerText = '— ' + unitTo.value;
        return;
    }

    let result;

    if (cat === 'currency') {
        if (!exchangeRates[unitFrom.value] || !exchangeRates[unitTo.value]) {
            convertedOutput.innerText = '…';
            return;
        }
        // Both rates are relative to USD
        const inUSD = val / exchangeRates[unitFrom.value];
        result = inUSD * exchangeRates[unitTo.value];
        // Update label too
        showRateLabel();
    } else if (cat === 'temperature') {
        let inCelsius = val;
        // Convert to Celsius first
        if (unitFrom.value === 'f') inCelsius = (val - 32) * 5/9;
        else if (unitFrom.value === 'k') inCelsius = val - 273.15;
        
        // Convert from Celsius to Target
        if (unitTo.value === 'c') result = inCelsius;
        else if (unitTo.value === 'f') result = (inCelsius * 9/5) + 32;
        else if (unitTo.value === 'k') result = inCelsius + 273.15;
    } else {
        const rates = cat === 'time' ? timeConversionRates : 
                      cat === 'weight' ? weightConversionRates :
                      cat === 'volume' ? volumeConversionRates :
                      lengthConversionRates;
        const inBase = val * rates[unitFrom.value];
        result = inBase / rates[unitTo.value];
    }

    result = Math.round(result * 100000000) / 100000000;
    convertedOutput.innerText = result.toLocaleString('es', { maximumFractionDigits: 8 }) + ' ' + unitTo.value;
    calculator.fitText(convertedOutput);
}

const originalUpdateDisplay = calculator.updateDisplay.bind(calculator);
calculator.updateDisplay = function() {
    originalUpdateDisplay();
    updateUnitConversion();
};

if (unitToggleBtn) {
    unitToggleBtn.addEventListener('click', () => {
        isUnitMode = !isUnitMode;
        if (isUnitMode) {
            unitControls.style.display = 'flex';
            convertedOutput.style.display = 'block';
            previousOperandTextElement.style.display = 'none';
        } else {
            unitControls.style.display = 'none';
            convertedOutput.style.display = 'none';
            currencyInfo.style.display   = 'none';
            previousOperandTextElement.style.display = 'block';
        }
        updateUnitConversion();
    });
}

if (unitFrom && unitTo) {
    unitFrom.addEventListener('change', () => {
        if (unitCategory && unitCategory.value === 'currency') showRateLabel();
        updateUnitConversion();
    });
    unitTo.addEventListener('change', () => {
        if (unitCategory && unitCategory.value === 'currency') showRateLabel();
        updateUnitConversion();
    });
}

const swapUnitsBtn = document.getElementById('swap-units-btn');
if (swapUnitsBtn) {
    swapUnitsBtn.addEventListener('click', () => {
        const temp = unitFrom.value;
        unitFrom.value = unitTo.value;
        unitTo.value = temp;
        if (unitCategory && unitCategory.value === 'currency') showRateLabel();
        updateUnitConversion();
    });
}

if (currencyRefreshBtn) {
    currencyRefreshBtn.addEventListener('click', fetchExchangeRates);
}

// ── Graph toggle ───────────────────────────────────────────────────────────
const graphToggleBtn = document.getElementById('graph-toggle');
const graphPanel     = document.getElementById('graph-panel');
const graphBackdrop  = document.getElementById('graph-backdrop');
const graphCloseBtn  = document.getElementById('graph-close');

function openGraphPanel() {
    graphPanel.classList.add('open');
    graphBackdrop.classList.add('visible');
    document.body.style.overflow = 'hidden';
    // Let grapher.js know it should (re)size the canvas
    window.dispatchEvent(new Event('graph-panel-opened'));
}

function closeGraphPanel() {
    graphPanel.classList.remove('open');
    graphBackdrop.classList.remove('visible');
    document.body.style.overflow = '';
}

if (graphToggleBtn) graphToggleBtn.addEventListener('click', openGraphPanel);
if (graphCloseBtn)  graphCloseBtn.addEventListener('click',  closeGraphPanel);
if (graphBackdrop)  graphBackdrop.addEventListener('click',  closeGraphPanel);
