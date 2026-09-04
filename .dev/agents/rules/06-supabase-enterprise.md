# Supabase Enterprise & Seguridad RLS - personal-yugioh-deckbuilder

---

## 1. Tablas y Convención `yg_`
Todas las tablas del dominio utilizan el prefijo `yg_`:
- `yg_cards`: Catálogo base de cartas de Yu-Gi-Oh!.
- `yg_decks`: Barajas creadas por usuarios.
- `yg_deck_cards`: Composición detallada de barajas.
- `yg_card_stats`, `yg_archetype_breakdown`, `yg_card_replacements`.

---

## 2. 100% RLS Obligatorio
- Toda tabla `yg_*` debe tener RLS habilitado.
- Barajas públicas legibles por cualquiera; inserción/edición/borrado estrictamente limitado a `auth.uid() = user_id`.
- Utilizar `@supabase/ssr` con cliente de servidor para Server Components / Server Actions y cliente de navegador en Client Components.
- Prohibido exponer `SUPABASE_SERVICE_ROLE_KEY` en el cliente.
