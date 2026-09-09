# ADR 0008: Conciliación de Inventario en Deck Workspace, Interacción Drag-to-Remove y Aislamiento

## Estado
**Aceptado** (Implementado en PR #8)

## Contexto
En el espacio de trabajo universal de barajas (`UniversalDeckWorkspaceModal`), arrastrar cartas fuera de la cuadrícula o desvincular copias físicas causaba estados inconsistentes si el usuario descartaba el modal sin guardar. Además, la conciliación entre cartas físicas en reserva y cartas en juego requería reglas deterministas para evitar duplicados virtuales.

## Decisión
1. **Regla Canónica Staged / Existing Inmutable**:
   - Todo cambio en el workspace opera sobre un borrador inmutable (`draftState`).
   - Las cartas "Existing" desvinculadas se mueven a una lista de reserva temporal (`stagedRemovals`), permitiendo deshacer cambios (`Undo`) sin consultar el backend.
2. **Interacción Drag-to-Remove Ergonómica**:
   - Se habilitó arrastrar una carta fuera del contenedor hacia la zona de reserva o bandeja de descarte con feedback visual táctil y auditivo.
3. **Persistencia Transaccional al Guardar**:
   - Solo al pulsar "Guardar Cambios" se emite un payload consolidador al endpoint REST, ejecutando las reubicaciones de forma atómica.

## Consecuencias
- **Positivas**:
  - Garantía absoluta de que cancelar un modal no muta la colección real del usuario.
  - Soporte completo de historial Undo/Redo local de hasta 30 acciones.
  - Experiencia táctil y fluida en arrastrar y soltar (drag & drop).
- **Trade-offs**:
  - Requiere mantener una estructura de snapshots bidireccional en memoria.

## Referencias
- PR #8: `fix/deck-workspace`
- Commits: `39e3fe6`
