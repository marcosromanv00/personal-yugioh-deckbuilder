# Calidad & Pirámide de Pruebas Linus Torvalds - personal-yugioh-deckbuilder

---

## 1. Verificación Estática Obligatoria Pre-Entrega
Antes de dar por cerrada cualquier tarea o proponer cambios:
```bash
# Comprobación de tipos TypeScript
npx tsc --noEmit

# Linter de Next.js
npm run lint

# Compilación de producción
npm run build
```

---

## 2. Pruebas Unitarias de Lógica de Barajas
- Funciones de cálculo de límites de Main Deck (40-60 cartas), Extra Deck (máx 15 cartas) y ratios de arquetipo deben contar con pruebas unitarias deterministas.
- Cero regresiones ("Never break userspace"): Si un cambio rompe el filtrado por arquetipo o la búsqueda por texto, debe corregirse de raíz antes de entregar.
