# ADR 0010: Ergonomía Táctil Móvil, Touch Targets ≥ 44px e Invariante de 3 Columnas Desktop

## Estado
**Aceptado** (Implementado en PR #10)

## Contexto
En dispositivos móviles y pantallas táctiles (smartphones y tablets), múltiples elementos interactivos (botones de acción, selectores de rareza, triggers de dropdowns y controles de chat) tenían alturas inferiores a 36px, causando pulsaciones erróneas y frustración de usuario. Asimismo, adaptaciones previas habían comprometido inadvertidamente la cuadrícula de 3 columnas de escritorio del Deckbuilder.

## Decisión
1. **Regla de Ergonomía Táctil Inviolable (Touch Targets ≥ 44px)**:
   - Todo botón interactivo, trigger de menú flotante y selector en vista móvil debe cumplir una altura y anchura táctil mínima de `min-h-11` (44px) y `min-w-11`, acompañado de la clase `touch-manipulation` para anular el retardo de 300ms del tap en navegadores móviles.
2. **Invariante de 3 Columnas en Escritorio**:
   - Se estableció como invariante arquitectónica estricta que ninguna optimización móvil puede modificar la disposición canónica de 3 columnas (`Buscador` • `Cuadrícula de Deck` • `Inspector Táctico`) en pantallas medianas y grandes (`lg:`, `xl:`).
3. **Prevención de Ghost Clicks**:
   - Implementación de banderas de toque (`isTouchRef`) para evitar que navegadores móviles disparen dobles eventos en `onTouchEnd` y `onClick`.

## Consecuencias
- **Positivas**:
  - Cumplimiento estricto de las directrices WCAG 2.1 AA y Apple Human Interface Guidelines.
  - Usabilidad perfecta en teléfonos móviles sin comprometer la productividad de pantalla ancha.
- **Trade-offs**:
  - Requiere mayor cuidado en paddings y layouts compactos en pantallas de 360px a 400px.

## Referencias
- PR #10: `feat/mobile-responsiveness-ux-audit`
- Commits: `f3d4472`, `42f55e7`, `3254191`
