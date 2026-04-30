# 🧮 Calculadora Premium en JavaScript

Una aplicación de calculadora de alta gama desarrollada usando puramente **HTML, CSS (Vanilla) y JavaScript**. Presenta un increíble diseño "glassmorphism" oscuro con efectos de iluminación dinámicos y fondos estilo "Aurora Boreal".

No es solo una calculadora estándar; es una suite completa con potentes herramientas matemáticas e interactivas integradas en una interfaz de usuario asombrosamente fluida.

---

## ✨ Características Principales

### 🔢 1. Modo Estándar y Científico
- Alternancia fluida entre vista básica y científica con **animaciones escalonadas** para cada botón.
- **Soporte total de teclado**: Enter, Backspace, Esc, Alt+S, Alt+G, Alt+H, etc.
- Manejo avanzado de punto flotante (evita errores tipo `0.1 + 0.2 = 0.30000000000000004`).
- **Web Workers (#34)**: Los cálculos se ejecutan en un hilo separado, manteniendo la UI siempre fluida.

### 📈 2. Calculadora Gráfica
- Gráfica de **hasta 8 funciones algebraicas simultáneas**.
- Sintaxis natural: `sin(x)`, `x^2`, `sqrt(abs(x))`, etc.
- Navegación interactiva en Canvas: arrastre panorámico, zoom táctil y rueda del ratón.
- Generación automática de tabla de valores.

### 🔣 3. Calculadora de Matrices
- Matrices desde `1×1` hasta `5×5`.
- Operaciones: `A + B`, `A - B`, `A × B`, `k · A`, Transpuesta, Determinante, Inversa, Rango, `A⁻¹`.
- Visualización del **procedimiento paso a paso**.

### 📐 4. Conversor Múltiple (Unidades y Monedas)
- **Longitud, Tiempo, Masa, Temperatura** y más.
- **Monedas en vivo**: API gratuita (`open.er-api.com`) para USD, EUR, MXN, JPY, GBP, CAD y más.

### 📋 5. Historial de Operaciones
- Registro en tiempo real en panel deslizante.
- **IndexedDB (#33)**: Almacenamiento de alta capacidad con fallback automático a `localStorage`.
- Exportación a CSV con protección contra XSS e inyección de fórmulas (OWASP).

### 💻 6. Modo Programador
- Conversión en tiempo real entre Binario, Octal, Decimal y Hexadecimal.
- Editor de bits interactivo (toggle por bit).
- Operadores bitwise: AND, OR, XOR, NOT, shifts.

### ➗ 7. Calculadora de Fracciones
- Suma, resta, multiplicación y división de fracciones.
- Simplificación automática con algoritmo GCD.
- Visualización como fracción impropia y mixta.

### 📊 8. Estadísticas y Probabilidad
- Media, mediana, moda, varianza, desviación estándar.
- Distribuciones: normal, binomial, Poisson.

### 💰 9. Finanzas Personales
- Cálculo de interés simple, compuesto y amortización.
- Simulador de préstamos con tabla de pagos.

### 🏥 10. Calculadora de Salud
- IMC con clasificación OMS, TMB, TDEE, macros.
- Calculadora de frecuencia cardíaca objetivo.

---

## 🎨 Diseño "Aurora Glass" (Premium)
- **Glassmorphism**: Capas translúcidas con blur para efectos de profundidad.
- **Neon Hover**: Animaciones spring con iluminación de color al pasar el cursor.
- **3 Temas**: Oscuro (default), Claro, Alto Contraste (#25).
- **5 Presets de Color (#24)**: Neón, Océano, Atardecer, Hacker, Royal.
- **Editor de Temas Personalizado (#17)**: Ajusta gradientes y opacidad con controles deslizantes.

---

## ♿ Accesibilidad (a11y)
- `role`, `aria-label`, `aria-live` en todos los elementos interactivos (#22).
- Anunciador para lectores de pantalla con resultado de cada cálculo (#23).
- Estados `:focus-visible` con halo luminoso para navegación por teclado (#22).
- **Modo Alto Contraste** con bordes sólidos y sin transparencias (#25).

---

## 🔊 Experiencia de Usuario
- **Sonidos de Teclado Mecánico (#27)**: Sintetizados con Web Audio API — sin archivos externos.
- **Feedback Háptico (#26)**: `navigator.vibrate` para dispositivos móviles.
- **Gestos Táctiles (#31)**: Deslizar ← borra dígito, → limpia pantalla, ↓ cierra panel.
- **Toasts Elegantes (#30)**: Notificaciones animadas que reemplazan todos los `alert()`.
- **Easter Eggs (#36)**: Confetti animado en canvas para resultados especiales (42, 1337, 1000, etc.).
- **Modo Presentación (#39)**: Expande el display a pantalla completa, ideal para clases.
- **Modo Mini (#35)**: Vista compacta flotante para multitarea.
- **Onboarding Tour (#40)**: Recorrido guiado de 6 pasos para nuevos usuarios.
- **Internacionalización (#19)**: Tooltips en Español, Inglés y Francés.

---

## 🌐 Progressive Web App (PWA)
- **Service Worker (#37)**: Caché total de assets — funciona **sin conexión a internet** tras la primera visita.
- **Manifest.json (#37)**: Instalable como app nativa en Chrome/Edge/Android.
- **Actualización automática**: Toast informativo cuando hay una nueva versión disponible.

---

## 🗄️ Almacenamiento y Datos
- **IndexedDB (#33)**: Base de datos del navegador de alta capacidad para historial.
- **Backup/Restore (#20)**: Exporta e importa toda la configuración como JSON.
- **localStorage**: Para preferencias de tema, idioma, historial (fallback de IndexedDB).

---

## 🏗️ Arquitectura Técnica

### Estructura de Archivos
```
/
├── index.html               # Interfaz HTML y paneles emergentes
├── manifest.json            # PWA manifest (#37)
├── sw.js                    # Service Worker — soporte offline (#37)
│
├── css/
│   ├── themes.css           # Tokens de diseño: :root, light-theme, high-contrast (#28)
│   ├── style.css            # Layout, componentes, paneles, utilidades (#28)
│   └── toast.css            # Estilos del sistema de notificaciones (#28, #30)
│
└── js/
    ├── db.js                # Wrapper de IndexedDB (CalcDB) (#33)
    ├── worker-manager.js    # Gestor de Web Worker con fallback síncrono (#34)
    ├── calc-worker.js       # Web Worker: científico, aritmética, factorial, primo (#34)
    ├── toast.js             # Sistema de notificaciones emergentes (#30)
    ├── script.js            # Core de cálculo y lógica de DOM
    ├── history.js           # Historial con IndexedDB + localStorage fallback (#33)
    ├── grapher.js           # Motor gráfico en Canvas 2D
    ├── matrices.js          # Operaciones de álgebra lineal
    ├── programmer.js        # Modo programador (bases numéricas y bitwise)
    ├── fractions.js         # Calculadora de fracciones con simplificación
    ├── stats.js             # Estadística y probabilidad
    ├── favorites.js         # Sistema de cálculos favoritos
    ├── finance.js           # Cálculos financieros
    ├── equations.js         # Resolución de ecuaciones
    ├── datetime.js          # Calculadora de fechas y tiempos
    ├── health.js            # Calculadora de salud (IMC, TMB, etc.)
    ├── tips.js              # Tips y consejos matemáticos
    ├── random.js            # Generador de números aleatorios
    ├── themes.js            # Editor de temas y presets de color (#17, #24)
    ├── scratchpad.js        # Modo papel de borrador (#18)
    ├── i18n.js              # Internacionalización ES/EN/FR (#19)
    ├── backup.js            # Exportar/Importar configuración (#20)
    ├── keyboard-sounds.js   # Sonidos de teclado mecánico (Web Audio API) (#27)
    ├── gestures.js          # Gestos táctiles para móviles (#31)
    ├── easter-eggs.js       # Animaciones de recompensa y easter eggs (#36)
    └── onboarding.js        # Tour guiado para nuevos usuarios (#40)
```

### Módulos CSS (Arquitectura Modular #28)
| Archivo | Responsabilidad |
|---------|----------------|
| `css/themes.css` | Variables de color, temas claro/oscuro/alto contraste |
| `css/style.css` | Layout general, componentes, botones, paneles |
| `css/toast.css` | Estilos exclusivos del sistema de toasts |

---

## 🚀 Cómo Ejecutar

**Opción 1 — Abrir directamente (recomendado):**
```
Haz doble clic en index.html
```
No requiere servidor. Funciona offline después de la primera visita gracias al Service Worker.

**Opción 2 — Servidor local (para Service Worker completo):**
```bash
npx http-server -p 8080 -c-1
# Navega a http://127.0.0.1:8080
```

---

## ⌨️ Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `0-9`, `.` | Ingresar dígitos |
| `+`, `-`, `*`, `/` | Operadores |
| `Enter` / `=` | Calcular |
| `Backspace` | Borrar último dígito |
| `Escape` | Limpiar / Cerrar panel |
| `Alt + S` | Modo Científico |
| `Alt + G` | Calculadora Gráfica |
| `Alt + C` | Conversor de Unidades |
| `Alt + H` | Historial |
| `Alt + T` | Editor de Temas |
| `F1` | Mostrar todos los atajos |
| `1337` (teclado) | 🎉 Easter Egg secreto |

---

## 📋 Roadmap de Mejoras (40/40 Completadas)

| # | Mejora | Estado |
|---|--------|--------|
| 1-16 | Funcionalidades Core (modos, gráfica, matrices, conversor...) | ✅ |
| 17 | Editor de Temas Personalizado | ✅ |
| 18 | Modo Scratchpad (papel de borrador) | ✅ |
| 19 | Internacionalización ES/EN/FR | ✅ |
| 20 | Backup y Restauración de Configuración | ✅ |
| 21 | SEO y Open Graph Meta Tags | ✅ |
| 22 | Auditoría de Accesibilidad (a11y) | ✅ |
| 23 | Soporte para Lectores de Pantalla | ✅ |
| 24 | Presets de Temas (5 skins) | ✅ |
| 25 | Modo Alto Contraste | ✅ |
| 26 | Feedback Háptico | ✅ |
| 27 | Sonidos de Teclado Mecánico | ✅ |
| 28 | Arquitectura CSS Modular | ✅ |
| 29 | Animaciones Fluidas en Modo Científico | ✅ |
| 30 | Sistema de Notificaciones Toast | ✅ |
| 31 | Gestos Táctiles para Móviles | ✅ |
| 32 | Diseño Responsivo Extremo (Tablet/iPad) | ✅ |
| 33 | Migración a IndexedDB | ✅ |
| 34 | Web Workers para Cálculos en Hilo Separado | ✅ |
| 35 | Modo Mini (Vista Compacta Flotante) | ✅ |
| 36 | Easter Eggs y Animaciones de Recompensa | ✅ |
| 37 | PWA — Service Worker y Soporte Offline | ✅ |
| 38 | Bundling y Minificación | ⏳ Pendiente |
| 39 | Modo Presentación (Pantalla Completa) | ✅ |
| 40 | Onboarding y Recorrido Guiado | ✅ |

---

## 🛡️ Seguridad
- Todo el contenido de usuario se renderiza con `.textContent`, nunca `innerHTML` (prevención XSS).
- Los eventos entre módulos usan `CustomEvent` con `String()` explícito para evitar ejecución de datos.
- Las entradas a `localStorage` / IndexedDB pasan por validación de tipo y longitud máxima.
- CSV export protegido contra CSV Injection (OWASP) con prefijo de neutralización.
- El Service Worker solo cachea respuestas `status: 200` del mismo origen.

---

*Desarrollado con ❤️ usando HTML, CSS y JavaScript puro.*
