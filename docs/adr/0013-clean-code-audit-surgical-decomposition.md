# ADR 0013: Auditoría Clean Code Integral, Límite Estricto <200 LOC y Patrón de Fachada con Servicios

## Estado
**Aceptado** (Implementado en PR #13)

## Contexto
El crecimiento continuado de la aplicación provocó la acumulación de megacomponentes y megahooks monolíticos con más de 1,000 líneas de código cada uno:
1. `useDeckBuilderState.ts` (2,330 LOC)
2. `useDeckWorkspaceState.ts` (1,642 LOC)
3. `SearchPanel.tsx` (1,282 LOC)
4. `CardCodeScannerModal.tsx` (1,250 LOC)
5. `ValuationTab.tsx` (1,111 LOC)
6. `ManualCardAdderModal.tsx` (1,099 LOC)

Estos archivos violaban el Mandamiento 2 de la Constitución de Desarrollo (Clean Code & Uncle Bob: ningún archivo/componente debe superar 200 líneas de código), dificultaban la mantenibilidad, generaban renderizados innecesarios y hacían inviables las pruebas unitarias aisladas.

## Decisión
1. **Límite Estricto de 200 LOC (Meta de Diseño ≤ 185 LOC)**:
   - Se estableció como invariante de ingeniería que ningún módulo, componente, servicio o hook resultante de la refactorización superara las 200 líneas de código.
2. **Patrón de Fachada Progresiva (Progressive Facade Pattern)**:
   - Los archivos de entrada principales se mantuvieron como Fachadas Orquestadoras delgadas ($\le 185$ LOC) que conservan el 100% de los contratos públicos de tipos y firmas de retorno. Esto garantizó **cero regresiones** en los componentes consumidores sin alterar un solo call site.
3. **Desacoplamiento de la Capa de Servicios REST (`services/*.api.ts`)**:
   - Todas las llamadas `fetch` a endpoints de API internos se extrajeron a módulos puros tipados, aislando el código de red de la lógica de presentación y estado.
4. **Subdivisión por Subdominios de Alta Cohesión**:
   - Se particionó cada megahook y megacomponente en sub-hooks y subcomponentes atómicos especializados (búsqueda, filtros, mutaciones, drag & drop, selección múltiple, análisis, vistas de cuadrícula/lista).
5. **Pureza React 19 y Tipado Estricto (Zero-Any, Zero-Effect)**:
   - Eliminación de `useEffect` con `useState` para sincronización de estados derivados.
   - Tipos explícitos para todas las respuestas y parámetros.

## Consecuencias
- **Positivas**:
  - Reducción del 100% de los megacomponentes a módulos de menos de 185 líneas.
  - Tasa de aprobación del 100% en las 16 suites de pruebas unitarias (56 tests).
  - Cero errores en el compilador de TypeScript (`npx tsc --noEmit`).
  - Modularidad extrema: cada componente puede ser testeado, mantenido y extendido de forma aislada.
- **Trade-offs**:
  - Aumento en el número total de archivos en la estructura del proyecto, compensado con una organización rigurosa en subdirectorios temáticos (`search/`, `valuation/`, `manual-adder/`, `scanner/`, `hooks/`, `services/`).

## Referencias
- PR #13: `refactor(clean-code): auditoria integral y reduccion estricta bajo 200 lineas`
- Archivos refactorizados: `useDeckBuilderState.ts`, `useDeckWorkspaceState.ts`, `SearchPanel.tsx`, `CardCodeScannerModal.tsx`, `ValuationTab.tsx`, `ManualCardAdderModal.tsx`
