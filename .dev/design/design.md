# Sistema de Diseño y Experiencia de Usuario: Yu-Gi-Oh! DeckLab (Estilo Exordio)

Este documento establece la guía maestra de diseño visual, sistema de componentes, temas (Light Tech / Dark Carbón) y arquitectura de interfaz para la suite analítica y el ecosistema de IA del proyecto **personal-yugioh-deckbuilder**, fuertemente inspirado en la estética de transmisión competitiva y análisis de decks de **El Exordio del Duelista**.

---

## 1. Filosofía y Dirección Artística Unificada

El rediseño transforma toda la aplicación en un **centro de mando eSports / Broadcast Analítico de Yu-Gi-Oh!**, combinando interfaces tácticas, tarjetas holográficas, dashboards de estadísticas multidimensionales y asistentes cognitivos de IA.

- **Estilo Visual**: Broadcast Tournament UI con tipografía `Outfit` + `JetBrains Mono`.
- **Estructura de Información en 1 Sola Fila Limpia**:
  - **Identidad & Formato**: Logo `EX` + Nombre de Deck editable + Selector de Formato compacto `[ TCG | MD | DL ]`.
  - **Navegación Segmentada**: `[ 🛠️ Taller | 📊 Análisis Exordio | 📈 Meta | 📦 Colección | 📜 Reglas ]`.
  - **Acciones Clave & Tema**: Botón destacado `🤖 IA Copilot` + Conmutador de Entorno Ideal + Toggle de Tema `☀️ / 🌙`.

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

## 3. Módulos de "Mis Contenedores" y "Mis Decks"

### A. Menú Lateral (Sidebar)
- **Inventario Físico**:
  - Almacenamiento (Contenedores)
  - Mis Decks (Barajas Físicas)
  - Mis Fundas (Sleeves)
  - Colección Completa
- **Inteligencia & Análisis**:
  - Sugerencias (badge dinámico)
  - Costos & Valor
  - Favoritas
- **Indicadores Activos**: Base neutra con acento carmesí `red-600` activo y borde lateral izquierdo.

### B. Barra de Herramientas Utilitaria & Popover de Filtros
- **Orden de Botones**: `[ Grid | List ]` $\rightarrow$ `Organizar (Sparkles)` $\rightarrow$ `Filtros (Popover)` $\rightarrow$ `Refrescar (RotateCcw)` $\rightarrow$ `+ Nuevo (Plus)`.
- **Filtros de Contenedores**:
  - Tipo: Carpetas (Binders), Deckboxes, Cajas (Boxes), Latas (Tins).
  - Estado: Con espacio libre, Llenos (100%), Vacíos (0%), Con barajas.
  - Orden: Nombre A-Z, Mayor Capacidad, Mayor Ocupación %.

### C. Tarjetas Minimalistas y Vista de Lista
- **Grid Card**: Encabezado limpio con icono temático, indicador sutil de color, barra de progreso integrada con porcentaje numérico en una sola línea (`61 / 180 slots • 34%`), chips compactos de decks y acciones rápidas al pasar el cursor.
- **List Row**: Fila horizontal de alta densidad informativa con barra de progreso estilizada y acciones directas.
- **Decks Panel Lateral**: Buscador rápido integrado (`searchQuery`) y píldoras de filtrado instantáneo (`Todos`, `Sin guardar`, `Activos`).

### D. Experiencia de Carga con Skeletons Shimmer
- Skeletons animados con efecto degradado shimmer para eliminar *layout shift*.
- Skeletons específicos para barra superior, grid/lista de contenedores, tarjetas de barajas y panel lateral.
