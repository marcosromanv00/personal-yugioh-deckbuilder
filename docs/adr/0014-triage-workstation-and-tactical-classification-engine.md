# ADR 0014: Mesa de Triaje de Colección, Reubicación Física Persistente y Motor Táctico de Clasificación

## Estado
**Aceptado** (Implementado en rama `feat/collection-triage-workstation`)

## Contexto
La gestión de cartas físicas recién adquiridas (ej. megacajas, sobres, latas o compras a granel) requería un proceso de triaje manual lento e ineficiente. El usuario carecía de una estación de trabajo ergonómica y rápida para:
1. Inspeccionar cartas individualmente con hotkeys de teclado (1-6).
2. Determinar si conservar una carta por su valor comercial, integrarla a un mazo activo, agruparla en un proyecto de mazo temático, reservarla para talleres didácticos de iniciación, o desecharla a bulk/crap.
3. Actualizar rarezas y cotizaciones en vivo consultando los sets oficiales de la API de YGOPRODeck y TCGPlayer sin discrepancias de precios.
4. Mover físicamente las cartas entre contenedores (ej. de un carril de Deckbox a un Binder o Lata de Bulk) garantizando persistencia en base de datos (`yg_user_cards`).
5. Trabajar en "Mesas Temáticas" aisladas para refinar copias y excedentes de proyectos específicos (ej. *Feedran* en Deck Dragón).

## Decisión
1. **Estación de Triaje Especializada (`/collection/triage`)**:
   - Interfaz de alto rendimiento con atajos de teclado numéricos (1 a 6, R, Ctrl+Z, flechas), tira de película (*filmstrip*) y visor de carta activa a pantalla completa.
   - Componentes modulares y desacoplados con límite estricto de menos de 190 LOC cumpliendo el Mandamiento 2.
2. **Motor Táctico de Clasificación (`triageTacticalEvaluator.ts` y `triageClassification.utils.ts`)**:
   - **Reglas Didácticas Realistas**: Permite mecánicas estándar de Yu-Gi-Oh! (invocaciones especiales sencillas, efectos de cementerio y beatsticks de buen ATK), sin descalificaciones por longitud de texto.
   - **Descarte Estricto a Bulk**: Descarta monstruos con estadísticas deficientes para su nivel, condiciones ultra-específicas/pasivas lentas (ej. *Dogu*) o bloqueos xenófobos de arquetipos sin soporte en colección.
   - **Monetización**: Prioriza venta [5] para cartas de alto valor comercial (≥ $0.50) sin utilidad en mazos activos.
3. **Reubicación Física Persistente**:
   - Las acciones asignan explícitamente `storage_location_id` y `compartment_index`, reflejando los movimientos físicos en la base de datos de Supabase.
   - Selector visual de Binder Destino [4/5] y Bulk Destino [6] en la cabecera.
4. **Mesas de Trabajo Temáticas y Filtro de Alcance**:
   - Modal de asignación temática rápida (`TriageThematicModal.tsx`) con soporte para razas, atributos, arquetipos y temas personalizados (ej. `Deck Dragón`).
   - Modo de alcance `scopeType: 'theme'` que filtra la mesa de triaje para visualizar únicamente las cartas de esa temática y refinar playsets. Al enviar copias sobrantes a bulk, la etiqueta temática se limpia automáticamente.

## Consecuencias
- **Positivas**:
  - Triaje a velocidad extrema: decenas de cartas clasificadas en minutos vía teclado.
  - Sincronización exacta entre inventario físico y digital en Supabase.
  - Cobertura completa de pruebas unitarias (10 tests passing).
  - 100% de cumplimiento con Mandamiento 2 (< 200 LOC por archivo).
- **Negativas**:
  - Requiere conexión a internet activa para consultar ediciones y precios en vivo de la API externa de YGOPRODeck / TCGPlayer.

## Referencias
- `src/components/collection/triage/`
- `src/lib/triageTacticalEvaluator.ts`
- `src/lib/triageClassification.utils.ts`
- `tests/triage-classification-engine.test.ts`
