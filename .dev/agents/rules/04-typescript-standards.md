# TypeScript Estricto & Tipado Supabase - personal-yugioh-deckbuilder

---

## 1. Tolerancia Cero con `any`
- Prohibido `any` y `as any` en toda la aplicación.
- Interfaces explícitas para cartas (`YgoCard`), barajas (`YgoDeck`), ratios y respuestas de YGOPRODeck / MasterDuelMeta.
- Si el dato es dinámico, usar `unknown` + parsing con Zod schemas.

---

## 2. Tipado Nativo de Base de Datos
- Todas las consultas a Supabase deben estar tipadas con la interfaz de base de datos (`Database['public']['Tables']['yg_...']`).
- Prohibido duplicar interfaces manuales desincronizadas.
