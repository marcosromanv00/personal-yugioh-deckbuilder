# ADR 0002: Motor de Disponibilidad Real de Fundas y Deducción de Cartas en Mazos Físicos

## Estado
**Aceptado** (Implementado en PR #2)

## Contexto
El inventario de fundas (sleeves) reportaba inicialmente el stock nominal total adquirido por el usuario. Sin embargo, en el juego físico real de Yu-Gi-Oh!, las fundas que ya están enfundando cartas en barajas armadas no están disponibles para ser asignadas a nuevos proyectos o cartas de reserva sin desencamisarlas primero. Esto provocaba que el usuario creyera tener existencias libres de fundas cuando en realidad estaban comprometidas en sus mazos de torneo.

## Decisión
1. **Deducción Dinámica de Stock Comprometido**:
   - Se diseñó un motor de auditoría (`calculateRealSleeveAvailability`) que evalúa en tiempo real todas las cartas asignadas a mazos (`deck_id !== null`).
   - Por cada paquete o lote de fundas (`yg_sleeves`), se calcula:
     $$\text{Stock Libre} = \text{Stock Total} - \sum \text{Cartas Asignadas con esa Funda}$$
2. **Auditoría y Filtrado**:
   - Se introdujeron filtros de disponibilidad en el inventario de fundas (`Disponibles`, `En Uso`, `Agotadas`).
   - Se habilitó un modal de inspección individual de cartas asociadas a cada modelo de funda.

## Consecuencias
- **Positivas**:
  - Precisión milimétrica en el inventario físico para torneos.
  - Advertencias tempranas cuando un mazo intenta consumir más fundas de las disponibles en inventario.
- **Trade-offs**:
  - Requiere recorrer las cartas de colección asociadas a fundas en memoria o derivar los totales mediante joins eficientes en PostgreSQL.

## Referencias
- PR #2: `feature/collection-sleeves-and-deck-audit`
- Commits: `ef1eee8`, `41ed9ae`
