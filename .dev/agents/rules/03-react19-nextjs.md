# React 19 & Next.js App Router: Protocolo Zero-Effect - personal-yugioh-deckbuilder

---

## 1. Protocolo Zero-Effect Inviolable
- **PROHIBIDO**: `useEffect` con `useState` para sincronizar filtros de cartas, conteo de barajas o selección de arquetipos.
- **SÍ**: Cálculos derivados puros en render (`const filteredCards = useMemo(...)`).
- **SÍ**: Resetear formulario de edición de deck pasando `key={deckId}`.
- **SÍ**: Mutaciones mediante Server Actions o handlers (`onClick`).
- **SÍ**: `useEffect` exclusivamente para listeners de teclado (atajos para añadir cartas), drag-and-drop del DOM o suscripciones Supabase Realtime.

---

## 2. Server Components por Defecto
- Páginas maestras (`page.tsx`) deben ser Server Components.
- Confinar `'use client'` estrictamente a los componentes interactivos de manipulación de barajas.
- **Prevención de Desajustes de Hidratación**: No leer `localStorage` en SSR; hidratar tras `isMounted`.
