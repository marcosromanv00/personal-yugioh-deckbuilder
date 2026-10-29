# ADR 0015: Selector Dinámico de Mazos, Auto-Detección de Secciones y Visibilidad Inmediata de Cartas Bulk

## Estado
**Aceptado** (Implementado en rama `feat/triage-deck-selector-bulk-access`)

## Contexto
Durante el flujo de triaje de cartas físicas (`/collection/triage`), los usuarios reportaron dos limitaciones críticas de usabilidad:
1. **Falta de visibilidad directa de cartas en Bulk**: Al enviar cartas a descarte a granel (`status_flag = 'bulk'`), estas desaparecían del flujo pendiente, pero el usuario carecía de un acceso visual directo e intuitivo para revisar, auditar o reclasificar las cartas ya enviadas a Bulk sin tener que ajustar múltiples filtros manuales.
2. **Restricción en la asignación a mazos**: La acción "Mazo [1]" solo permitía asignar copias si el motor heurístico había detectado un *competitive match* previo. Si no existía coincidencia automática o el usuario deseaba enviar la carta a un mazo específico o a una sección particular (Main, Extra o Side Deck), el sistema no ofrecía una vía interactiva para seleccionarlo.

## Decisión
1. **Selector Dinámico de Mazo y Sección (`TriageDeckSelectorModal.tsx`)**:
   - Se implementó un modal interactivo que permite al usuario buscar y seleccionar cualquiera de sus mazos registrados en la colección.
   - **Auto-detección Inteligente de Sección**: Se analiza el tipo de carta (`card_details.type`). Si corresponde a un monstruo de Fusión, Sincronía, XYZ o Link, el modal preselecciona automáticamente **Extra Deck**; de lo contrario, preselecciona **Main Deck**, permitiendo además alternar manualmente a **Side Deck** con controles táctiles optimizados (touch targets ≥ 44px).
   - Se integró el disparador tanto desde el panel de diagnóstico ("Elegir Mazo" / "Elegir otro mazo manualmente...") como desde el botón de acción rápida `Mazo [1]` o la tecla `1` cuando no existe coincidencia automática.

2. **Visibilidad y Auditoría de Bulk (`scopeType: 'bulk'`)**:
   - En `/collection/triage`: Se amplió el esquema de alcance (`triageScopeSchema`) con el valor `'bulk'`. Al seleccionar este alcance, la mesa de triaje muestra exclusivamente las cartas en bulk (sin filtrarlas por "Solo pendientes"), con conteo en tiempo real (`bulkCardsCount`) y un botón de acceso directo `Ver ({count})` en la cabecera.
   - En `/collection`: Se incorporó en la pestaña de colección un toggle rápido de un clic (`📦 Bulk`) junto a los filtros avanzados para alternar instantáneamente la vista de cartas en bulk.

3. **Arquitectura Limpia & Modularidad (`TriageModalsPortal.tsx`)**:
   - Para cumplir rigurosamente el Mandamiento 2 de la Constitución (< 200 LOC por archivo), se desacoplaron todos los modales auxiliares de triaje (Rareza, Temática, Desacuerdo, Precios y Selector de Mazo) hacia `TriageModalsPortal.tsx`.
   - `TriageWorkstation.tsx` se redujo a menos de 195 LOC.

## Consecuencias
- **Positivas**:
  - Control total sobre la asignación de cartas a cualquier mazo y sección en tiempo real.
  - Cero fricción para auditar cartas en bulk en toda la plataforma.
  - 100% de cumplimiento con las reglas de Clean Code (< 200 LOC), React 19 Zero-Effect y TypeScript Zero-Any.
  - Cobertura de pruebas unitarias ampliada (77 tests pasando).

## Referencias
- `src/components/collection/triage/components/TriageDeckSelectorModal.tsx`
- `src/components/collection/triage/components/TriageModalsPortal.tsx`
- `src/components/collection/triage/TriageWorkstation.tsx`
- `src/components/collection/triage/TriageHeaderScopeSelector.tsx`
- `src/components/collection/components/CollectionCardsTab.tsx`
- `tests/triage-classification-engine.test.ts`
