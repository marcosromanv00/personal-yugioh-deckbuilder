# Clean Code & Modularidad - personal-yugioh-deckbuilder

Este proyecto implementa los principios de **Robert C. Martin (Uncle Bob)** y modularidad estricta para evitar componentes monolíticos en el constructor de decks.

---

## 1. Límites Estrictos de Tamaño
- **Máximo 200 líneas** por componente o archivo de lógica.
- Si un componente de Deckbuilder, Drawer de filtros o Modal de importación supera las 200 líneas, descompónlo inmediatamente en:
  1. `use[Feature].ts`: Custom hook con la reactividad y selección de cartas.
  2. `[feature].utils.ts`: Funciones puras de cálculo de ratios (Monstruos/Magias/Trampas), ordenamiento por ATK/DEF o filtrado por Arquetipo.
  3. Subcomponentes atómicos: Encabezado, Grid de slots, Estadísticas y Acciones.

---

## 2. Regla del Boy Scout
Al trabajar en cualquier sección del Deckbuilder, limpia código legacy:
- Erradica casts `as any`.
- Simplifica interfaces redundantes.
- Extrae funciones de filtrado duplicadas.
