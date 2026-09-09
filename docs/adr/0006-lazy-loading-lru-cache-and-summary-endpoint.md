# ADR 0006: Carga Perezosa, Caché LRU en Memoria y Endpoint Ligero de Resumen de Colección

## Estado
**Aceptado** (Implementado en PR #6)

## Contexto
A medida que las colecciones físicas de los usuarios crecían a miles de cartas, cargar el array completo de cartas físicas (`yg_user_cards`) con todos sus metadatos e imágenes en cada cambio de vista degradaba severamente el tiempo de respuesta inicial (TTFB > 1.8s, payloads JSON > 4MB). Además, la vista de resumen ejecutivo solo requería KPIs agregados, no la lista completa de ítems.

## Decisión
1. **Endpoint Ligero `/api/collection/summary`**:
   - Se diseñó un endpoint que ejecuta agregaciones directamente en la base de datos PostgreSQL, retornando únicamente métricas consolidadas (total de cartas, cartas únicas, desglose por rareza y contenedor) con un payload inferior a 5KB.
2. **Caché LRU en Memoria**:
   - Se implementó un almacenamiento de caché LRU (Least Recently Used) en memoria del cliente para evitar peticiones duplicadas al alternar entre pestañas.
3. **Carga Perezosa (Lazy Loading) y Prefetching Optimista**:
   - Las cartas completas de un contenedor o mazo solo se solicitan por demanda cuando el usuario interactúa explícitamente con dicho contenedor.
   - Se introdujo prefetching optimista en segundo plano al hacer hover sobre los contenedores principales.

## Consecuencias
- **Positivas**:
  - Reducción del tiempo de carga inicial de la página de colección en más de un 80% (de ~1.8s a < 250ms).
  - Reducción del 90% en transferencia de datos de red en sesiones típicas.
  - Skeletons contextuales instantáneos que mantienen la UI responsiva.
- **Trade-offs**:
  - Necesidad de invalidar la caché local cuando se ejecutan mutaciones (añadir, mover o eliminar cartas).

## Referencias
- PR #6: `feat/collection-perf-lazy-skeletons`
- Commits: `bd99f25`, `2b590ee`, `5d065f1`
