# ADR 0003: Arquitectura de Fundas Multicapa (Inner/Standard/Outer) y Reubicación Asistida

## Estado
**Aceptado** (Implementado en PR #3)

## Contexto
Los jugadores competitivos de TCG y coleccionistas utilizan con frecuencia sistemas de protección doble o triple (Double Sleeving / Triple Sleeving):
- **Inner Sleeves**: Fundas ajustadas (Perfect Fit) transparentes que protegen contra polvo y humedad.
- **Standard Sleeves**: Fundas de tamaño estándar japonés (Japanese Size) con dorso opaco mate o artístico (ej. Dragon Shield Japanese Matte, KMC).
- **Outer Sleeves**: Fundas transparentes exteriores (Over-sleeves / Character Guards) que protegen el arte de la funda estándar en torneos.

El modelo de datos previo solo permitía una única funda por carta, impidiendo modelar la realidad del coleccionismo físico. Además, trasladar una carta de un mazo a otro o a un contenedor físico requería una confirmación inteligente para evitar desarmar mazos accidentalmente.

## Decisión
1. **Esquema de Base de Datos Multicapa**:
   - Se extendió la tabla `yg_user_cards` para soportar identificadores y tipos independientes: `inner_sleeve_id`, `sleeve_id` (standard), y `outer_sleeve_id`.
   - Se tiparon en TypeScript las categorías de fundas correspondientes.
2. **Reubicación Inteligente de Cartas con Confirmación**:
   - Al mover una carta física que ya forma parte de un mazo a otra ubicación (otro mazo o contenedor de almacenamiento), el sistema detecta el conflicto y presenta un modal de confirmación inteligente (`Smart Card Relocation Modal`), notificando al usuario del impacto en el mazo origen.

## Consecuencias
- **Positivas**:
  - Modelado 1:1 de la realidad física de los jugadores de torneos y coleccionistas.
  - Inventario independiente para fundas inner, standard y outer.
  - Protección activa contra la desarticulación involuntaria de barajas competitivas.
- **Trade-offs**:
  - Mayor complejidad en las consultas de inserción y actualización en base de datos.

## Referencias
- PR #3: `feature/multi-layer-sleeves-and-card-relocation`
- Commits: `547cea6`, `3632d7a`, `dab8c27`
