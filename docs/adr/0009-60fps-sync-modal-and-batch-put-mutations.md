# ADR 0009: Modal de Sincronización a 60 FPS, Sustituciones Físicas y Mutaciones Batch PUT

## Estado
**Aceptado** (Implementado en PR #9)

## Contexto
El modal de sincronización física de mazos presentaba caídas de fotogramas (jank) al renderizar listas largas con cientos de cartas y fundas individuales. Además, al sustituir una carta registrada por otra variante física (por ejemplo, cambiar una copia común por una Secret Rare), el sistema requería múltiples llamadas HTTP individuales secuenciales, generando condiciones de carrera si alguna fallaba a mitad del proceso.

## Decisión
1. **Optimización de Renderizado a 60 FPS**:
   - Filas de tabla completamente clickeables con targets optimizados.
   - Virtualización ligera y memoización estricta de componentes de fila (`SyncCardRowItem`).
   - Prevención de re-renders masivos aislando los estados de hover y selección.
2. **Sustituciones Directas de Cartas Registradas**:
   - Soporte para intercambiar copias físicas asignadas preservando las fundas asignadas al slot del mazo.
3. **Mutaciones Atómicas en Lote (`PUT /api/decks/[id]/sync`)**:
   - Se diseñó un contrato de API en lote que procesa reubicaciones, asignaciones de fundas y desvinculaciones en una única transacción de base de datos (`atomic batch PUT`).

## Consecuencias
- **Positivas**:
  - Desplazamiento fluido y sin tirones a 60 cuadros por segundo.
  - Cero estados inconsistentes en base de datos gracias a la mutación atómica en bloque.
  - Flexibilidad para sustituir rarezas en barajas armadas con un solo clic.
- **Trade-offs**:
  - Mayor carga en el endpoint de sincronización para validar y ejecutar el grafo de cambios.

## Referencias
- PR #9: `feat/sync-modal-sleeves-perf-substitutions`
- Commits: `40cdccf`, `b6dcf26`, `c63bdd1`
