# Sistema de Diseño y Experiencia de Usuario: Yu-Gi-Oh! Deckbuilder & Hub de Inventario

Este documento establece las especificaciones de diseño visual, paleta de colores, tipografía, interacciones y micro-animaciones para el proyecto **personal-yugioh-deckbuilder**, asegurando una experiencia de usuario (UX) premium, gamificada, fluida e inmersiva.

---

## 1. Dirección Artística y Temática
La estética del sistema se inspira en interfaces futuristas oscuras (Cyberpunk / Tech-Fantasy / RPG Inventory UI), alineadas con la temática moderna de Yu-Gi-Oh! y plataformas competitivas de videojuegos:
- **Aspecto**: Oscuro elegante con acentos brillantes correspondientes a las rarezas de las cartas o a las advertencias de banlist.
- **Efectos**: Bordes sutiles con gradientes, efectos de cristal esmerilado (glassmorphism), sombras de neón difusas y **sistemas de partículas en Canvas/CSS** al interactuar con objetos de almacenamiento.

---

## 2. Paleta de Colores (HSL)

Diseñamos una paleta en modo oscuro de alto contraste y sofisticada para evitar colores planos aburridos.

| Rol de Color | Variable CSS | Tono / HSL | Aplicación Visual |
| :--- | :--- | :--- | :--- |
| **Fondo Principal** | `--bg-main` | `hsl(224, 25%, 6%)` | Fondo oscuro profundo con tintes azulados. |
| **Fondo Tarjetas / Paneles** | `--bg-panel` | `hsl(224, 22%, 10%)` | Contenedores de cartas, buscador, panel lateral. |
| **Bordes y Divisiones** | `--border-soft` | `hsl(224, 15%, 16%)` | Líneas divisorias y bordes de paneles. |
| **Acento Primario (Neon)** | `--accent-primary` | `hsl(263, 85%, 64%)` | Botones principales, estados de selección activos. |
| **Acento Secundario (Aqua)** | `--accent-aqua` | `hsl(180, 80%, 45%)` | Sugerencias positivas de ratios y botones de ayuda. |
| **Alerta / Prohibido** | `--color-forbidden` | `hsl(0, 84%, 60%)` | Cartas de la banlist Prohibidas (Forbidden) y errores. |
| **Limitado (1 Copia)** | `--color-limited` | `hsl(38, 92%, 50%)` | Color dorado para cartas Limitadas a 1 copia. |
| **Semi-Limitado (2)** | `--color-semi` | `hsl(210, 90%, 55%)` | Color azul brillante para cartas Semi-Limitadas. |
| **Texto Principal** | `--text-primary` | `hsl(210, 40%, 98%)` | Nombres de cartas y títulos principales. |
| **Texto Secundario** | `--text-muted` | `hsl(215, 15%, 70%)` | Descripciones de efectos, porcentajes de uso y tags. |

---

## 3. Tipografía
- **Fuente Principal (Sans-serif)**: `Outfit` (de Google Fonts) o `Inter` como respaldo. Proporciona una lectura clara y moderna ideal para estadísticas de ratios.
- **Fuente Monoespaciada**: `JetBrains Mono` para ratios, cantidades de copias en deck, porcentajes de popularidad y contadores de cartas.

---

## 4. Estructura y Vistas del Deckbuilder (Responsive)

El layout se organiza en una cuadrícula flexible de 3 columnas en pantallas grandes (laptops/desktops) y se apila verticalmente en móviles.

---

## 5. Micro-interacciones y Animaciones (Framer Motion)
- **Hover en Cartas**: Agrandamiento sutil (scale: 1.05) con un destello de borde de color según la rareza de la carta y efecto de sombra exterior brillante.
- **Transición de Páginas (Page Flip)**: Animación 3D realista al cambiar de página en carpetas (binders).
- **Indicadores Visuales de Funda (Sleeve Badges)**: Bordes resplandecientes o insignias pequeñas en las cartas para denotar `Doble Funda (Inner+Outer)`, `Funda Simple` o `Sin Funda`.

---

## 6. Sistema Visual de Almacenamiento Dinámico & Gestión de Fundas (Sleeves)

### 6.1 Registro Visual de Fundas y Protección
- **Visualización de Bordes**: Las cartas en el inventario o binder muestran el color/arte exacto de su funda o un contorno translúcido si tienen doble funda (*Inner Perfect Fit + Outer*).
- **Inspección de Ranura**: Al hacer clic en un bolsillo del binder o slot de deckbox, se abre la ficha detallada indicando marca, color, estado y recomendaciones de la funda.

### 6.2 Asistente Recomendador de Fundas (Sleeving Advisor)
1. **Reglas de Valor & Protección**: Alerta visual si una carta de rareza alta/cara no tiene doble funda.
2. **Normativa de Torneo TCG**: Verifica que el Main Deck y Side Deck usen fundas uniformes sin variaciones de tono, mientras sugiere fundas de color contrastante o Arte Oficial para el Extra Deck.
3. **Optimización de Espacio**: Identifica cartas de bajo valor en latas que no requieren fundas individuales para reducir volumen.
