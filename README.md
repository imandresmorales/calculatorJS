# 🧮 Calculadora Premium en JavaScript

Una aplicación de calculadora de alta gama desarrollada utilizando puramente **HTML, CSS (Vanilla) y JavaScript**. Presenta un increíble diseño "glassmorphism" oscuro con efectos de iluminación dinámicos y fondos estilo "Aurora Boreal".

No es solo una calculadora estándar; es una suite completa con potentes herramientas matemáticas e interactivas integradas en una interfaz de usuario asombrosamente fluida.

---

## ✨ Características Principales

### 🔢 1. Modo Estándar y Científico
*   Alternancia fluida entre la vista básica (teclado numérico extendido) y científica.
*   **Soporte total de teclado**: Escribe de manera natural usando tu teclado (Enter, Backspace, Esc, etc.).
*   Manejo avanzado de problemas matemáticos de punto flotante en JavaScript (evita errores tipo `0.1 + 0.2 = 0.30000000000000004`).

### 📐 2. Calculadora Gráfica
*   Gráfica de **hasta 8 funciones algebraicas simultáneas**.
*   Soporte con sintaxis natural de funciones (`sin(x)`, `x^2`, `sqrt(abs(x))`, etc.).
*   Navegación interactiva en Canvas puro: arrastre panorámico, zoom táctil (pinch) o con la rueda del ratón y trazado del cursor para interceptores (raíces, ejes).
*   Generación automática de tabla de valores paso a paso.

### 🧮 3. Calculadora de Matrices
*   Soporte para operaciones con matrices desde tamaños `1×1` hasta `5×5`.
*   Operaciones incluídas: `A + B`, `A - B`, `A × B`, `k · A`, `Transpuesta`, `Determinante`, `Inversa`, `Rango`, `Aⁿ`.
*   Visualización del **procedimiento paso a paso** para aprender y verificar los resultados.
*   Capacidad de copia de elementos tabulados compatible inversamente con Excel/Hojas de cálculo.

### 💱 4. Conversor Múltiple (Unidades y Monedas)
*   **Longitud**: Metros, Millas, Kilómetros, Pulgadas, Pies, Yardas.
*   **Tiempo**: Segundos, Minutos, Horas, Días, Semanas, Años.
*   **Monedas Externas en Vivo**: Usando API gratuita sin llaves paramétricas (`open.er-api.com`). Convierte instantáneamente al último valor del mercado para USD, EUR, MXN, JPY, GBP, CAD y decenas más.

### 📜 5. Historial de Operaciones
*   Registro en tiempo real con panel deslizante y soporte de cuotas para `localStorage`.
*   Limpieza total o modular de las sentencias previas.
*   Botón para revocar y pre-cargar automáticamente al display para nuevas tareas.
*   **Evicción de seguridad XSS y CSV**: Exportación global mediante `.csv` a su almacenamiento local y desinfección preventiva.

---

## 🎨 Diseño "Aurora Glass" (Premium)
- **Glassmorphism (Diseño tipo Vidrio)**: Capas desenfocadas translúcidas para efectos de profundidad y sombras suaves en escala de grises para el panel de cuerpo.
- **Neon Hover**: Animaciones "Spring CSS" al seleccionar elementos con la pulsación rebotando gentilmente, dejando iluminaciones de color a su paso en el puntero.

---

## 🚀 Cómo Empezar / Ejecución

Dado que al proyecto implementa recargas y utilidades modernas en tiempo extra, está mejor habilitado al alojarse desde su servidor web local: 

1. Sitúate en la raíz del proyecto.
2. Acciona tu servidor temporal:
   ```bash
   npx http-server -p 8080
   ```
3. Dirígete en tu navegador a `http://127.0.0.1:8080`.
4. Tambien puedes abrir el archivo index.html

---

## 🛠 Entorno de Estructura 

```
/
├── index.html           # Interfaz HTML universal y paneles emergentes
├── css/
│   └── style.css        # Hoja de estilos con variables UI y media queries
└── js/
    ├── script.js        # Core de calculo base y dom logic de la vista
    ├── history.js       # Almacenamiento seguro, inyectables de CustomEvent
    ├── grapher.js       # Motor gráfico independiente usando Canvas 2D
    └── matrices.js      # Operador Linal estructurado por eliminación gaussiana
```
