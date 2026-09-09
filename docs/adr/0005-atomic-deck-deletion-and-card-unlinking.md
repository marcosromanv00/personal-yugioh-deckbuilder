# ADR 0005: Eliminación Segura y Atómica de Decks con Desvinculación de Cartas Físicas

## Estado
**Aceptado** (Implementado en PR #5)

## Contexto
Al eliminar una baraja (`yg_decks`), existía el riesgo crítico de eliminar en cascada (o dejar en estado huérfano) las cartas físicas del usuario asociadas a ese mazo (`yg_user_cards`). En el mundo real, cuando un jugador desarma o borra una lista de deck, sus cartas físicas no desaparecen: regresan a sus cajas de almacenamiento o a la bandeja sin clasificar (Inbox).

## Decisión
1. **Desvinculación Atómica en Backend (`DELETE /api/decks/[id]`)**:
   - Antes de suprimir el registro del mazo en `yg_decks`, se ejecuta una transacción atómica que:
     a) Desvincula todas las cartas físicas asociadas: `UPDATE yg_user_cards SET deck_id = NULL WHERE deck_id = $1`.
     b) Si la carta no tenía un contenedor físico asignado (`storage_location_id IS NULL`), se preserva en el Inbox del usuario.
     c) Desvincula o reubica las variantes secundarias y registros de historial.
     d) Elimina el registro del mazo.
2. **Modal de Confirmación Defensivo (`ConfirmDialog`)**:
   - Se diseñó un modal de confirmación con advertencia explícita del número exacto de cartas físicas que serán devueltas a la colección libre.

## Consecuencias
- **Positivas**:
  - Cero pérdida de datos o desvinculación accidental de cartas físicas costosas.
  - Integridad referencial estricta garantizada a nivel transaccional en PostgreSQL.
- **Trade-offs**:
  - Requiere llamadas coordinadas y control de errores riguroso ante fallos parciales de red.

## Referencias
- PR #5: `feat/deck-deletion-options`
- Commits: `f6b2192`, `359b1dc`, `0862dae`
