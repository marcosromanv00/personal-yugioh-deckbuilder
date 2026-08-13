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
