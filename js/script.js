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

// Selectors
const numberButtons = document.querySelectorAll('[data-number]');
const operationButtons = document.querySelectorAll('[data-operator]');
const equalsButton = document.querySelector('[data-action="calculate"]');
const deleteButton = document.querySelector('[data-action="delete"]');
const clearButton = document.querySelector('[data-action="clear"]');
const previousOperandTextElement = document.getElementById('previous-operand');
const currentOperandTextElement = document.getElementById('current-operand');

const calculator = new Calculator(previousOperandTextElement, currentOperandTextElement);

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
            calculator.computeScientific(button.dataset.action);
        }
        calculator.updateDisplay();
    });
});

equalsButton.addEventListener('click', button => {
    calculator.compute();
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
    if ((e.key >= 0 && e.key <= 9) || e.key === '.') {
        calculator.appendNumber(e.key);
        calculator.updateDisplay();
    }
    if (e.key === '=' || e.key === 'Enter') {
        e.preventDefault();
        calculator.compute();
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
const unitFrom = document.getElementById('unit-from');
const unitTo = document.getElementById('unit-to');
let isUnitMode = false;

const lengthConversionRates = {
    'm': 1,
    'km': 1000,
    'cm': 0.01,
    'mm': 0.001,
    'in': 0.0254,
    'ft': 0.3048
};

function updateUnitConversion() {
    if (!isUnitMode) return;
    const val = parseFloat(calculator.currentOperand);
    if (isNaN(val)) {
        convertedOutput.innerText = '0 ' + unitFrom.value + ' = 0 ' + unitTo.value;
        convertedOutput.style.fontSize = '';
        convertedOutput.style.transform = '';
        return;
    }
    const inMeters = val * lengthConversionRates[unitFrom.value];
    const converted = inMeters / lengthConversionRates[unitTo.value];
    let result = Math.round(converted * 100000000) / 100000000;
    
    // Mostramos la unidad original y la convertida para evitar confusión
    convertedOutput.innerText = val + ' ' + unitFrom.value + ' = ' + result + ' ' + unitTo.value;

    calculator.fitText(convertedOutput);
}

const originalUpdateDisplay = calculator.updateDisplay.bind(calculator);
calculator.updateDisplay = function() {
    originalUpdateDisplay();
    updateUnitConversion();
}

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
            previousOperandTextElement.style.display = 'block';
        }
        updateUnitConversion();
    });
}

if (unitFrom && unitTo) {
    unitFrom.addEventListener('change', updateUnitConversion);
    unitTo.addEventListener('change', updateUnitConversion);
}
