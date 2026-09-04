# Tailwind CSS v4 Canónico & UI - personal-yugioh-deckbuilder

---

## 1. Cero Valores Arbitrarios (`[]`)
- No utilices medidas arbitrarias entre corchetes si tienen equivalencia oficial:
  - Cambiar `min-h-[280px]` -> `min-h-70`
  - Cambiar `max-h-[320px]` -> `max-h-80`
  - Cambiar `max-w-[200px]` -> `max-w-50`
  - Cambiar `min-h-[100px]` -> `min-h-25`
  - Cambiar `max-h-[160px]` -> `max-h-40`
- Utiliza la nueva sintaxis nativa v4: `bg-linear-to-*` en lugar de `bg-gradient-to-*`.

---

## 2. Paleta Canónica y Ergonomía
- **Paleta Oficial**: Base neutra (`zinc`/`slate`) con acentos primarios en **rojo (`red-600` / `red-500`)** y acentos secundarios (`zinc-800` / `zinc-200`).
- **Prohibición de Glassmorphism Incoherente**: Superficies sólidas y limpias (`bg-white` en claro, `bg-zinc-900`/`bg-zinc-950` en oscuro con bordes `border-zinc-200`/`border-zinc-800`).
- **Touch Targets en Móvil**: Mínimo `min-h-11` (44px) con `touch-manipulation`.
- **Invariante Desktop**: Mantener el layout de 3 columnas en pantallas grandes (`lg:`, `xl:`).
