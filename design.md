# Sistema de Diseño y Experiencia de Usuario: Yu-Gi-Oh! Deckbuilder & Hub Analítico (Estilo Exordio)

Este documento establece la guía maestra de diseño visual, sistema de componentes, temas (Light Tech / Dark Carbón) y arquitectura de interfaz para la suite analítica y el ecosistema de IA del proyecto **personal-yugioh-deckbuilder**, fuertemente inspirado en la estética de transmisión competitiva y análisis de decks de **El Exordio del Duelista**.

---

## 1. Filosofía y Dirección Artística Unificada

El rediseño transforma toda la aplicación en un **centro de mando eSports / Broadcast Analítico de Yu-Gi-Oh!**, combinando interfaces tácticas, tarjetas holográficas, dashboards de estadísticas multidimensionales y asistentes cognitivos de IA.

- **Estilo Visual**: Broadcast Tournament UI con tipografía `Outfit` + `JetBrains Mono`.
- **Estructura de Información en 1 Sola Fila Limpia**:
  - **Identidad & Formato**: Logo `EX` + Nombre de Deck editable + Selector de Formato compacto `[ TCG | MD | DL ]`.
  - **Navegación Segmentada**: `[ 🛠️ Taller | 📊 Análisis Exordio | 📈 Meta | 📦 Colección ]`.
  - **Acciones Clave & Tema**: Botón destacado `🤖 IA Copilot` + Menú desplegable `📁 Deck` (Guardar, Cargar, Importar YDK, Exportar YDK, Limpiar, Sincronizar) + Toggle de Tema `☀️ / 🌙`.

---

## 2. Sistema de Tokens y Paleta de Colores Global (Light Tech & Dark Carbón)

### Modo Oscuro (Dark Carbón - Default)
- **Fondo Principal**: `#09090b` (Negro Carbón)
- **Fondo Paneles / Tarjetas**: `#18181b` (Grafito / Zinc 900)
- **Bordes Tácticos**: `#27272a` (Zinc 800)
- **Acento Primario Exordio**: `#dc2626` / `#ef4444` (Rojo Carmesí de Transmisión)
- **Acento Oro / Boss Card**: `#f59e0b` (Dorado Holográfico)
- **Acento Cyan / Sinergia**: `#06b6d4`
- **Acento Éxito / Win Rate**: `#10b981`
- **Texto Principal**: `#f4f4f5` (Zinc 100)
- **Texto Secundario**: `#71717a` (Zinc 500)

### Modo Claro (Light Tech)
- **Fondo Principal**: `#f8fafc` (Blanco Tecnológico)
- **Fondo Paneles / Tarjetas**: `#ffffff` (Blanco Puro)
- **Bordes Tácticos**: `#e2e8f0` (Zinc 200)
- **Acento Primario Exordio**: `#dc2626` (Rojo Carmesí de Transmisión)
- **Acento Oro / Boss Card**: `#d97706`
- **Acento Cyan / Sinergia**: `#0891b2`
- **Acento Éxito / Win Rate**: `#059669`
- **Texto Principal**: `#09090b` (Negro Carbón)
- **Texto Secundario**: `#64748b` (Zinc 500)

---

## 3. Las 5 Diapositivas de Transmisión (Exordio Hub)

1. **Slide 1: Radar Heptagonal & Deck Stats**:
   - 7 Ejes vectoriales: *Attack, Control, Consistency, Board Breaking, Versatility, Resilience, Recovery*.
   - Barras de estadísticas y desglose de stamina por fases (*Early, Mid, Long Game, GY Recycle*).
2. **Slide 2: Key Cards Role Matrix**:
   - Clasificación táctica: *Main Starters, Key Cards, Main Beaters, Main Defenders*.
   - Showcase holográfico de la *Best Card*.
3. **Slide 3: Threat Cards Matrix & Danger Levels**:
   - Alertas *Danger Level (1/4 a 4/4)* clasificadas por *Handtraps*, *Board Breakers* y *Floodgates*.
4. **Slide 4: Testing Data & KPIs**:
   - Anillos circulares de *Win Ratio %*, *Dead Hands (x/10)* y *OTK (x/10)* basados en simulación Monte Carlo.
   - Comparativa de cartas más y menos jugadas.
5. **Slide 5: Decklist Broadcast**:
   - Vista de transmisión con cálculo de *Non-Engine (20+)* y viabilidad *Going 1st / 2nd*.

---

## 4. Suite de Inteligencia Artificial (Gemini 3.1 Flash Lite)

- **AI Copilot Modal Unificado**:
  - **Sintetizador**: Construcción desde cero, optimización por colección física, sintonización con meta oficial de Agosto 2026 y optimizador de presupuesto.
  - **Juez de Duelo en Vivo**: Chat contextualizado para manos iniciales, resolución de cadenas y mitigación de handtraps.
- **Modelos Oficiales**: `gemini-3.1-flash-lite-preview` (predeterminado), `gemini-3-flash`, `gemini-2.5-flash`, `gemini-2.5-flash-lite`.
