# Architecture Decision Records (ADR)

Este repositorio utiliza **Architecture Decision Records (ADRs)** para registrar todas las decisiones arquitectónicas clave, sus justificaciones, alternativas evaluadas y consecuencias a lo largo del ciclo de vida del proyecto **personal-yugioh-deckbuilder**.

## Estructura de un ADR
Cada documento sigue el estándar canónico MADR / Michael Nygard:
- **Estado**: Propuesto, Aceptado, Reemplazado, Obsoleto.
- **Contexto**: Situación de partida, fuerzas en juego y restricciones técnicas.
- **Decisión**: Solución arquitectónica adoptada y detalles de implementación.
- **Consecuencias**: Beneficios obtenidos, trade-offs y responsabilidades operativas.
- **Referencias**: Enlaces a Pull Requests, commits y archivos fuente asociados.

---

## Índice Maestro de Decisiones

| ADR | Título | Estado | PR / Commit | Fecha |
| :---: | :--- | :---: | :---: | :---: |
| [0001](file:///docs/adr/0001-url-state-persistence-and-shimmer-containers.md) | Persistencia de Estado de Navegación en URL Search Params & Shimmer Skeletons | **Aceptado** | PR #1 | 2026-03 |
| [0002](file:///docs/adr/0002-sleeve-availability-engine-and-deck-allocation.md) | Motor de Disponibilidad Real de Fundas y Deducción de Cartas en Mazos Físicos | **Aceptado** | PR #2 | 2026-03 |
| [0003](file:///docs/adr/0003-multi-layer-sleeve-architecture-and-card-relocation.md) | Arquitectura de Fundas Multicapa (Inner/Standard/Outer) y Reubicación Asistida | **Aceptado** | PR #3 | 2026-03 |
| [0004](file:///docs/adr/0004-react-19-zero-effect-sleeve-counter-unfreeze.md) | Protocolo Zero-Effect en React 19 y Desacoplamiento de Contadores de Stock | **Aceptado** | PR #4 | 2026-03 |
| [0005](file:///docs/adr/0005-atomic-deck-deletion-and-card-unlinking.md) | Eliminación Segura y Atómica de Decks con Desvinculación de Cartas Físicas | **Aceptado** | PR #5 | 2026-03 |
| [0006](file:///docs/adr/0006-lazy-loading-lru-cache-and-summary-endpoint.md) | Carga Perezosa, Caché LRU en Memoria y Endpoint Ligero de Resumen de Colección | **Aceptado** | PR #6 | 2026-03 |
| [0007](file:///docs/adr/0007-physical-sync-staged-existing-model.md) | Modelo Staged/Existing para Sincronización Física y Registro en Reserva | **Aceptado** | PR #7 | 2026-03 |
| [0008](file:///docs/adr/0008-deck-workspace-reconciliation-and-drag-to-remove.md) | Conciliación de Inventario en Deck Workspace, Interacción Drag-to-Remove y Aislamiento | **Aceptado** | PR #8 | 2026-03 |
| [0009](file:///docs/adr/0009-60fps-sync-modal-and-batch-put-mutations.md) | Modal de Sincronización a 60 FPS, Sustituciones Físicas y Mutaciones Batch PUT | **Aceptado** | PR #9 | 2026-03 |
| [0010](file:///docs/adr/0010-mobile-ergonomics-44px-touch-targets.md) | Ergonomía Táctil Móvil, Touch Targets $\ge 44$px e Invariante de 3 Columnas Desktop | **Aceptado** | PR #10 | 2026-03 |
| [0011](file:///docs/adr/0011-two-column-card-detail-modal-and-sleeve-wizard.md) | Modal de Detalle de Carta en 2 Columnas y Wizard de Guardado con Modelo Take/Add | **Aceptado** | PR #11 | 2026-03 |
| [0012](file:///docs/adr/0012-deck-variants-and-physical-exchange-engine.md) | Sistema de Variantes de Decks, Motor Hipergeométrico y Préstamos entre Deckboxes | **Aceptado** | PR #12 | 2026-03 |
| [0013](file:///docs/adr/0013-clean-code-audit-surgical-decomposition.md) | Auditoría Clean Code Integral, Límite Estricto $<200$ LOC y Patrón de Fachada con Servicios | **Aceptado** | PR #13 | 2026-03 |
