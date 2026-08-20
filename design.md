# Sistema de Diseño y Experiencia de Usuario: Yu-Gi-Oh! Deckbuilder & Hub Analítico (Estilo Exordio)

Este documento establece la guía maestra de diseño visual, sistema de componentes, temas (Light Tech / Dark Carbón) y arquitectura de interfaz para la suite analítica y el ecosistema de IA del proyecto **personal-yugioh-deckbuilder**, fuertemente inspirado en la estética de transmisión competitiva y análisis de decks de **El Exordio del Duelista**.

---

## 1. Filosofía y Dirección Artística Unificada

El rediseño transforma toda la aplicación en un **centro de mando eSports / Broadcast Analítico de Yu-Gi-Oh!**, combinando interfaces tácticas, tarjetas holográficas, dashboards de estadísticas multidimensionales y asistentes cognitivos de IA.

- **Estilo Visual**: Broadcast Tournament UI con tipografía `Outfit` + `JetBrains Mono`.
- **Estructura de Información en 1 Sola Fila Limpia**:
  - **Identidad & Formato**: Logo `EX` + Nombre de Deck editable + Selector de Formato compacto `[ TCG | MD | DL ]`.
  - **Navegación Segmentada**: `[ 🛠️ Taller | 📊 Análisis Exordio | 📈 Meta | 📦 Colección ]`.
  - **Acciones Clave & Tema**: Botón destacado `🤖 IA Copilot` + Menú desplegable `📁 Deck` + Conmutador de Entorno Ideal + Toggle de Tema `☀️ / 🌙`.

---

## 2. Sistema de Tokens y Paleta de Colores Global (Light Tech & Dark Carbón)

### Modo Oscuro (Dark Carbón - Default)
- **Fondo Principal**: `#09090b` (Negro Carbón)
- **Fondo Paneles / Tarjetas / Modales**: `#18181b` (Grafito / Zinc 900)
- **Bordes Tácticos**: `#27272a` (Zinc 800)
- **Acento Primario Exordio**: `#dc2626` / `#ef4444` (Rojo Carmesí de Transmisión)
- **Acento Oro / Boss Card**: `#f59e0b` (Dorado Holográfico)
- **Acento Cyan / Sinergia**: `#06b6d4`
- **Acento Éxito / Win Rate**: `#10b981`
- **Texto Principal**: `#f4f4f5` (Zinc 100)
- **Texto Secundario**: `#71717a` (Zinc 500)

### Modo Claro (Light Tech)
- **Fondo Principal**: `#f8fafc` (Blanco Tecnológico)
- **Fondo Paneles / Tarjetas / Modales**: `#ffffff` (Blanco Puro)
- **Bordes Tácticos**: `#e2e8f0` (Zinc 200)
- **Acento Primario Exordio**: `#dc2626` (Rojo Carmesí de Transmisión)
- **Acento Oro / Boss Card**: `#d97706`
- **Acento Cyan / Sinergia**: `#0891b2`
- **Acento Éxito / Win Rate**: `#059669`
- **Texto Principal**: `#09090b` (Negro Carbón)
- **Texto Secundario**: `#64748b` (Zinc 500)

---

## 3. Guía Estricta para Nuevas Funcionalidades y Ambiente "Colección Ideal"

### Prohibición de Paletas Ajenas (Anti-Pastel Purple / Anti-Lavanda)
Queda estrictamente prohibida la introducción de tonos púrpuras, lavanda, morados o degradados neón pastel fuera del esquema de color oficial. **Todas las funcionalidades nuevas deben alinearse al 100% con la paleta Exordio (Rojo Carmesí `#dc2626`, Negro Carbón `#09090b`, Zinc Neutro y Acentuación Dorado `#f59e0b` / Cyan `#06b6d4`)**.

### Especificaciones para el Ambiente Colección Ideal (Ideal Twin Sandbox)
1. **Conmutador de Entorno (EnvironmentSwitcher)**:
   - Botón minimalista de solo icono (`Sparkles` / `Wand2`).
   - *Estado Inactivo*: Estilo idéntico al toggle de tema (`bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800`).
   - *Estado Activo (Modo Ideal)*: Estilo Carmesí/Dorado Táctico Exordio (`bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30 ring-2 ring-red-500/40` o borde dorado táctico `border-amber-500/80 text-amber-500 dark:text-amber-400 bg-amber-500/10`), indicando la activación del gemelo digital de forma limpia y nítida.
2. **Botón de Reporte Permanente**:
   - Icono `ClipboardList` integrado perfectamente en la botonera de acciones del header con los mismos estilos tácticos de los botones del sistema (`bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-xl`).
3. **Modales y Diálogos (`IdealReportModal`, `IdealSyncLoaderModal`, `PhysicalStagingAssistantModal`)**:
   - Tarjetas y contenedores en `bg-white dark:bg-zinc-900`, bordes `border-zinc-200 dark:border-zinc-800`.
   - Botones de acción principal en **Rojo Carmesí Exordio** (`bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider shadow-md shadow-red-600/25`).
   - Badges e insignias en Tonos Exordio:
     - Decks & Variantes: Rojo Carmesí (`bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30`).
     - Binders & Rarezas: Dorado (`bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30`).
     - Bulk & Motores: Cyan (`bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30`).
4. **Cartas Compartidas en Blanco y Negro**:
   - Filtro `grayscale contrast-125 opacity-75` con borde zinc nítido e insignia negra/zinc `🔄 COMPARTIDA` sin elementos lavanda.

---

## 4. Las 5 Diapositivas de Transmisión (Exordio Hub)

1. **Slide 1: Radar Heptagonal & Deck Stats**:
   - 7 Ejes vectoriales: *Attack, Control, Consistency, Board Breaking, Versatility, Resilience, Recovery*.
2. **Slide 2: Key Cards Role Matrix**:
   - Clasificación táctica: *Main Starters, Key Cards, Main Beaters, Main Defenders*.
3. **Slide 3: Threat Cards Matrix & Danger Levels**:
   - Alertas *Danger Level (1/4 a 4/4)* clasificadas por *Handtraps*, *Board Breakers* y *Floodgates*.
4. **Slide 4: Testing Data & KPIs**:
   - Anillos circulares de *Win Ratio %*, *Dead Hands (x/10)* y *OTK (x/10)* basados en simulación Monte Carlo.
5. **Slide 5: Decklist Broadcast**:
   - Vista de transmisión con cálculo de *Non-Engine (20+)* y viabilidad *Going 1st / 2nd*.

---

## 5. Suite de Inteligencia Artificial (Gemini 3.1 Flash Lite)

- **AI Copilot Modal Unificado**:
  - **Sintetizador**: Construcción desde cero, optimización por colección física, sintonización con meta oficial y optimizador de presupuesto.
  - **Juez de Duelo en Vivo**: Chat contextualizado para manos iniciales y resolución de cadenas.
- **Modelos Oficiales**: `gemini-3.1-flash-lite-preview` (predeterminado), `gemini-3-flash`, `gemini-2.5-flash`.

---

## 6. Estándares y Patrones de Diseño Móvil (Mobile-First Ergonomics & UI/UX)

Para garantizar una experiencia móvil fluida con tasas de satisfacción > 95%:

1. **Ergonomía Táctil y Targets Mínimos (≥ 44px)**:
   - Todo elemento interactivo accesible con pulgar (botones de acción, triggers de dropdowns, selectores de pestañas) debe contar con una altura mínima de `min-h-11` (44px) en móvil (`min-h-11 sm:min-h-9`) y clase `touch-manipulation`.
   - Controles numéricos y botones de edición rápida deben ser generosos (`w-10 h-10` en móvil) para evitar pulsaciones erróneas.

2. **Mitigación de Ghost Clicks en Dispositivos Táctiles**:
   - En componentes con interacción dual (click y toque como `TouchableCard`), registrar y consumir el flag `isTouchRef` en `onTouchEnd` para evitar la doble invocación por el evento sintético `onClick` disparado subsecuentemente por WebKit/Blink.

3. **Cuadrículas Responsivas de Cartas**:
   - **DeckBuilder**: `grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10` (evita cartas invisibles de 48px).
   - **Buscador**: `grid-cols-3 sm:grid-cols-4` en modo grid para legibilidad de nombres e insignias.

4. **Navegación Móvil y Hojas Inferiores (*Bottom Sheets*)**:
   - Barra de navegación inferior fija (`MobileNav`) con acentos Exordio (`red-600`) e indicador activo.
   - Opciones agrupadas por categoría funcional en el "Centro de Operaciones" (`MobileBottomSheet`): *Gestión de Baraja*, *Análisis & Táctica* y *Colección Física*.
   - Barras de pestañas horizontales deslizantes con `overflow-x-auto scrollbar-none` en Colección.

5. **Modales con Viewport Seguro**:
   - Modales en móvil deben usar `max-h-[92dvh] overflow-y-auto` con padding adaptado para respetar barras de estado y teclados virtuales.
