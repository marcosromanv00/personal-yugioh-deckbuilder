# ADR 0007: Modelo Staged/Existing para Sincronización Física y Registro en Reserva

## Estado
**Aceptado** (Implementado en PR #7)

## Contexto
Al construir un mazo virtual en el Deckbuilder, la lista teórica puede contener copias de cartas que:
1. Ya existen en la colección física y están actualmente asignadas al mazo.
2. Ya existen en la colección física pero están en una caja, binder o en otro mazo (requieren reubicación).
3. No existen físicamente en la colección (faltantes o proxies requeridas).

Cuando el usuario intentaba sincronizar el mazo digital con su colección física, el sistema anterior no distinguía entre cartas ya registradas y cartas añadidas virtualmente que necesitaban ser asignadas o adquiridas.

## Decisión
1. **Separación Conceptual Staged vs Existing**:
   - **Existing**: Cartas físicas registradas en base de datos (`id` de `yg_user_cards`) que ya pertenecen al mazo.
   - **Staged**: Cartas teóricas presentes en la receta del mazo que aún no tienen una copia física vinculada en memoria.
2. **Sistema de Conciliación en Reserva**:
   - Se diseñó un algoritmo de cruce que busca copias disponibles en la colección física del usuario y sugiere emparejamientos inteligentes, clasificando las no encontradas como candidatos a proxy o lista de deseos (wishlist).
3. **UX del Modal de Sincronización Física**:
   - Visualización clara en dos columnas con indicadores de estado físico, procedencia de contenedor y estado de fundas.

## Consecuencias
- **Positivas**:
  - Trazabilidad exacta de qué cartas físicas reales componen cada mazo.
  - Generación automática de listas de compra o de cartas faltantes para torneos.
- **Trade-offs**:
  - Mayor complejidad de estado transitorio en el frontend antes del guardado definitivo.

## Referencias
- PR #7: `feat/inventory`
- Commits: `df44019`
