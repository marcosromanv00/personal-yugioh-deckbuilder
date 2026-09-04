# Contexto del Agente y Stack Técnico: personal-yugioh-deckbuilder

Este archivo documenta el stack tecnológico exacto, comandos, convenciones de código y arquitectura del proyecto **personal-yugioh-deckbuilder**.

---

## 1. Stack Tecnológico y Versiones Exactas

- **Core Framework**: Next.js `16.3.0` (App Router) con React `19.2.8` y React DOM `19.2.8`.
- **Lenguaje**: TypeScript `^5` (Modo estricto, sin `any`).
- **Estilos**: Tailwind CSS `^4.0.0` (con `@tailwindcss/postcss` ^4 y configuración nativa `@theme` en CSS).
- **Base de Datos**: Supabase (`@supabase/supabase-js` `^2.112.2`) con PostgreSQL y RLS al 100%.
- **Validación en Runtime**: Zod `^4.4.3`.
- **UI & Iconos**: Shadcn UI (Radix), Lucide React `^1.31.0`.
- **Animaciones**: Framer Motion `^13.1.0`.
- **IA & OCR**: `@ai-sdk/google` `^4.0.44`, `ai` `^7.0.66`, `tesseract.js` `^7.0.0`.
- **Linter & Build**: ESLint `^9` (`eslint-config-next: 16.3.0` en `eslint.config.mjs`).

---

## 2. Comandos de Ejecución

- `npm run dev`: Servidor de desarrollo Next.js en `http://localhost:3000`.
- `npm run build`: Compilación de producción (Guardarraíl obligatorio).
- `npm run lint`: Verificación estática de ESLint (Guardarraíl obligatorio).
- `npm run sync-meta`: Script `tsx scripts/scrape_mdm.ts` para sincronizar metadatos de Master Duel Meta.

---

## 3. Arquitectura de Directorios

```text
personal-yugioh-deckbuilder/
├── .dev/
│   ├── agents/
│   │   ├── rules/              # Reglas activas instanciadas de este proyecto
│   │   ├── artifacts/          # Planes locales y logs de sesión (git-ignored)
│   │   └── agents.md           # Este documento de contexto técnico
│   └── design/                 # Documento de diseño visual de producto
├── scripts/                    # Scripts TypeScript ejecutados con tsx
├── src/
│   ├── app/                    # Rutas de App Router (Server Components por defecto)
│   ├── components/
│   │   ├── deckbuilder/        # Componentes modulares del constructor
│   │   └── ui/                 # Componentes base atómicos
│   ├── lib/                    # Clientes de Supabase y servicios
│   └── types/                  # Definiciones de TypeScript y Zod
└── supabase/                   # Migraciones SQL y políticas de RLS
```

---

## 4. Reglas Invariantes del Proyecto

1. **Protocolo Zero-Effect**: Cero `useState` dentro de `useEffect` para derivar estado de cartas o filtros; usar cálculos en render.
2. **Cero Clases Arbitrarias**: Usar escala canónica Tailwind (`min-h-70`, `max-h-80`, `bg-linear-to-*`).
3. **Prefijo de Base de Datos `yg_`**: Todas las tablas de Yu-Gi-Oh! usan el prefijo `yg_` con RLS habilitado.
4. **Ergonomía Móvil**: Touch targets ≥ 44px (`min-h-11`) con `touch-manipulation` y prevención de ghost clicks con `isTouchRef`.
5. **Invariante Desktop**: Mantener las 3 columnas en pantallas grandes (`lg:`, `xl:`).
