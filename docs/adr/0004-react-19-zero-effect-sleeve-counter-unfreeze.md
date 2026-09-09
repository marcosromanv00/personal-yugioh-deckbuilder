# ADR 0004: Protocolo Zero-Effect en React 19 y Desacoplamiento de Contadores de Stock

## Estado
**Aceptado** (Implementado en PR #4)

## Contexto
Durante la migración a React 19, se detectaron bucles infinitos de re-renderizado (`Maximum update depth exceeded`) y congelamiento del navegador en los modales de gestión de fundas y espacio de trabajo de colección. La causa raíz fue el uso antipatrón de `useEffect` con `useState` para sincronizar y derivar la cuenta de stock disponible en respuesta a cambios de filtros o cartas seleccionadas.

## Decisión
1. **Adopción Estricta del Protocolo "Zero-Effect"**:
   - Se prohibió categóricamente el uso de `useEffect` para calcular o sincronizar estados derivados de props o de otros estados locales.
   - Todo cálculo derivado (como contadores de fundas, stock disponible, totales de cartas y clasificaciones) se computa puramente durante la fase de renderizado mediante funciones puras o `useMemo` condicional para operaciones con matrices de alta cardinalidad.
2. **Mutaciones Atómicas en Event Handlers**:
   - Los cambios de estado relacionados se agrupan y ejecutan directamente dentro de los manejadores de eventos del usuario (`onClick`, `onChange`, `onSelect`), eliminando efectos colaterales asíncronos.

## Consecuencias
- **Positivas**:
  - Eliminación total de bucles infinitos de render y advertencias del React Compiler.
  - Interfaz reactiva a 60 FPS sin retrasos de cálculo o desincronización de UI.
  - Código predecible, determinista y sencillo de testear unitariamente.
- **Trade-offs**:
  - Requiere disciplina para no recurrir al atajo fácil de "escuchar cambios con un efecto".

## Referencias
- PR #4: `fix/sleeve-stock-counter-and-tabs-optimization`
- Commits: `6789b45`, `4f8aaf4`
