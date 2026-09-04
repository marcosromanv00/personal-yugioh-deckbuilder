<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Contexto del Agente y Stack Tecnológico

Este archivo documenta el stack tecnológico, las convenciones de código y la arquitectura del proyecto **personal-yugioh-deckbuilder**.

## 1. Stack Tecnológico

- **Core Framework**: Next.js App Router (React 19+) con TypeScript.
- **Base de Datos y Autenticación**: Supabase (PostgreSQL).
- **Estilos**: Tailwind CSS v4+ (configuración nativa mediante directivas CSS `@theme`, sin `tailwind.config.js`) y Shadcn UI para componentes base.
- **Animaciones**: Framer Motion para transiciones y micro-interacciones interactivas.
- **Iconografía**: Lucide React.
- **APIs Externas**:
  - **YGOPRODeck API**: Para obtener la base de datos maestra de cartas, imágenes y detalles oficiales.
  - **Scraper / API de Master Duel Meta (MDM)**: Para obtener ratios de uso, popularidad de cartas y desgloses de arquetipos.

## 2. Convenciones de Base de Datos (Supabase)

Todas las tablas del sistema utilizarán el prefijo `yg_` para diferenciar los datos del dominio de Yu-Gi-Oh! de otras tablas de configuración o autenticación de Supabase.

### Tablas Principales:
- `yg_cards`: Caché local de las cartas de Yu-Gi-Oh! (mapeado de YGOPRODeck).
- `yg_card_stats`: Popularidad global y ratios de uso de cartas por formato.
- `yg_archetype_breakdown`: Ratios de uso de cartas dentro de arquetipos específicos.
- `yg_card_replacements`: Tabla de sugerencias de reemplazo basadas en rol técnico y arquetipo.
- `yg_decks`: Decks creados por los usuarios (Master Duel, TCG, Duel Links).
- `yg_deck_cards`: Cartas que componen cada deck (Main, Extra, Side, Skill).
- `yg_deck_ratings`: Ponderaciones, votos y feedback de la comunidad sobre los decks.

## 3. Estructura de Directorios Propuesta

```text
├── .agents/                    # Directorio de habilidades y reglas del agente
│   └── agents.md               # Este archivo de configuración
├── scripts/                    # Scripts locales para scraping y sincronización de datos
│   └── scrape_mdm.ts           # Script para extraer datos de Master Duel Meta
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # Endpoints de API internos
│   │   ├── decks/              # Rutas de visualización y construcción de decks
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/             # Componentes de React reutilizables (UI, Deckbuilder)
│   │   ├── deckbuilder/        # Componentes del constructor de decks dinámico
│   │   └── ui/                 # Componentes de Shadcn UI
│   ├── lib/                    # Utilidades, clientes de API y lógica compartida
│   │   ├── supabase.ts         # Cliente de Supabase
│   │   └── ygoprodeck.ts       # Integración con la API de YGOPRODeck
│   └── types/                  # Definiciones de tipos TypeScript
```

## 4. Comandos Comunes

- `npm run dev`: Inicia el servidor de desarrollo local de Next.js.
- `npm run build`: Valida y compila la aplicación para producción.
- `npm run lint`: Ejecuta el linter de Next.js.
- `npx tsx scripts/scrape_mdm.ts`: Ejecuta el script local de scraping e inserta/actualiza datos en Supabase.

## 5. Reglas Invariantes de Desarrollo (Estrictas)

Para mantener el proyecto pulido para su venta, queda terminantemente prohibido violar las siguientes directrices:

1. **Prohibición del tipo `any`**:
   - Define siempre interfaces explícitas. Si el dato es dinámico o desconocido, usa `unknown` junto con guardas de tipo, o tipos genéricos (`Record<string, unknown>`).

2. **Sincronización Limpia de Estado (React)**:
   - **NO** actualices estados usando `useState` dentro de `useEffect` para reaccionar a cambios de otros estados locales.
   - **SÍ**: Calcula valores derivados al vuelo durante la fase de renderizado:
     ```typescript
     // BIEN:
     const activeCards = cards.filter(c => c.active);
     ```
   - **SÍ**: Actualiza múltiples estados relacionados directamente dentro de las funciones controladoras de eventos (`onClick`, `onChange`, etc.).

3. **Tailwind CSS v4 Estricto y Canónico**:
   - **NO** uses brackets arbitrarios para medidas que tienen equivalencia en la escala estándar de Tailwind (1 unidad = 4px).
     - *Ejemplos incorrectos:* `min-h-[280px]`, `max-h-[320px]`, `max-w-[200px]`, `min-h-[100px]`, `max-h-[160px]`.
     - *Ejemplos correctos:* `min-h-70`, `max-h-80`, `max-w-50`, `min-h-25`, `max-h-40`.
   - **NO** uses directivas o gradientes obsoletos en v4:
     - Cambia `bg-gradient-to-*` por `bg-linear-to-*`.

4. **Congruencia Estricta con el Tema Global de UI**:
   - **Paleta Canónica**: El sistema visual utiliza una base neutra (`zinc`/`slate`) con acentos primarios en **rojo (`red-600` / `red-500`)** y acentos secundarios neutros (`zinc-800` / `zinc-200`). Queda estrictamente prohibido introducir paletas ajenas o disonantes (ej. morados, púrpuras, rosas) a menos que correspondan a mecánicas de juego específicas (ej. cartas Fusion/Synchro).
   - **Prohibición de Glassmorphism**: No utilices fondos translúcidos con `backdrop-blur` difuminado cuando el resto de la interfaz emplee superficies sólidas y limpias (`bg-white` en claro, `bg-zinc-900`/`bg-zinc-950` en oscuro con bordes `border-zinc-200`/`border-zinc-800`).
   - **Dropdowns & Popovers Robustos (Sin Overflow Clipping)**:
     - Nunca encapsules menús desplegables flotantes dentro de contenedores con `overflow-hidden` o `overflow-x-auto` sin asegurar que el menú tenga visibilidad total (usar `overflow-visible` en filas de filtros o portales flotantes).
     - Prohibido el uso de `<select>` HTML vanilla sin estilizar en modales y paneles clave; utiliza siempre el componente unificado `PremiumDropdown`.

5. **Ergonomía Táctil y Compatibilidad Móvil Invariante**:
   - **Touch Targets ≥ 44px**: Todo botón interactivo, trigger de menú y selector en móvil debe tener una altura táctil mínima de `min-h-11` (44px) y clase `touch-manipulation`.
   - **Prevención de Ghost Clicks**: Nunca dispares acciones críticas simultáneamente en `onTouchEnd` y `onClick` sin usar un flag de interacción (`isTouchRef`) que consuma el toque y prevenga dobles ejecuciones.
   - **Grids Adaptativos**: En el constructor, la cuadrícula de cartas debe ser `grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10` para garantizar visibilidad de nombres y números.
   - **Invariante Desktop**: Queda terminantemente prohibido alterar el layout de 3 columnas de escritorio (`lg:`, `xl:`) al realizar adaptaciones móviles.

6. **Ejecución de Comandos en Terminal (PowerShell / Windows)**:
   - **Prohibición del operador `&&`**: En PowerShell de Windows, queda terminantemente prohibido encadenar comandos utilizando `&&`. Ejecuta siempre cada comando (`git add`, `git commit`, `tsc`, `lint`, `build`, etc.) de forma individual, atómica y secuencial.
