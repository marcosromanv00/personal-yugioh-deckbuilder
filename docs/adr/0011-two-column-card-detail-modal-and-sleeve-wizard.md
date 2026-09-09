# ADR 0011: Modal de Detalle de Carta en 2 Columnas y Wizard de Guardado con Modelo Take/Add

## Estado
**Aceptado** (Implementado en PR #11)

## Contexto
El modal de detalle de carta física en el inventario era previamente una ventana estrecha con scroll vertical continuo donde se mezclaban datos estáticos de la carta (nombre, tipo, texto, arquetipo) con atributos físicos mutables (cantidad, rareza, estado, funda, contenedor). Paralelamente, el flujo de guardado de un nuevo mazo en el Deckbuilder no ofrecía control sobre de dónde procedían las fundas para el mazo (si se tomaban del stock existente libre o si se agregaba un paquete nuevo recién comprado).

## Decisión
1. **Rediseño del Modal de Detalle en 2 Columnas**:
   - **Columna Izquierda (Visual / Datos YGOPRODeck)**: Arte de alta resolución, stats oficiales, nivel/rango, atributos, arquetipo y descripción oficial no editable.
   - **Columna Derecha (Atributos Físicos de Colección)**: Controles ergonómicos para modificar contenedor físico, rareza estándar, condición física, idioma, funda multicapa, flag de venta/trade y notas de procedencia.
2. **Wizard de Guardado de Deck con Modelo Take/Add de Fundas**:
   - Flujo guiado en 3 pasos:
     1. Metadatos de la baraja (nombre, formato, etiquetas).
     2. Asignación de caja de almacenamiento (Deckbox o contenedor libre).
     3. Asignación de fundas con selector explícito entre modo `Take` (consumir existencias libres calculadas) o modo `Add` (registrar paquetes nuevos adquiridos).
3. **Optimización de Posicionamiento de Dropdowns**:
   - Algoritmo en `PremiumDropdown` que detecta la distancia al borde inferior de la ventana y despliega hacia arriba (`flip-to-top`) cuando el espacio vertical es inferior a 220px, previniendo recortes por overflow.

## Consecuencias
- **Positivas**:
  - Máxima legibilidad y separación clara entre datos de catálogo y copias físicas de usuario.
  - Gestión exacta y sin fricciones del consumo de fundas al armar mazos de torneo.
  - Dropdowns flotantes con `z-index` de alta prioridad que nunca quedan tapados por filas inferiores.
- **Trade-offs**:
  - Requiere mayor espacio en pantalla para modales en 2 columnas (adaptándose a 1 columna en móviles).

## Referencias
- PR #11: `feat/ux`
- Commits: `975def0`, `1da7b63`, `0f51ac9`, `0b78953`, `c0a102a`
