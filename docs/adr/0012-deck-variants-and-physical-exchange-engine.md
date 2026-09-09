# ADR 0012: Sistema de Variantes de Decks, Motor Hipergeométrico y Préstamos entre Deckboxes

## Estado
**Aceptado** (Implementado en PR #12)

## Contexto
En torneos competitivos de Yu-Gi-Oh!, los jugadores rara vez juegan una baraja idéntica en cada evento: alternan entre "motores" o paquetes de soporte (ej. variante *Adventure Horus* vs *Pure Horus*, o paquetes de handtraps para ir primero vs ir segundo) sobre una base común (Core Invariable). 

Sin un sistema de variantes físicas, el jugador debía crear mazos duplicados completos en la aplicación, lo que descalibraba el inventario (duplicando virtualmente cartas físicas caras como SP Little Knight o Triple Tactics Thrust). Además, faltaba una herramienta que calculara la probabilidad exacta de robo en mano inicial (Opening Hand PMF) para validar la consistencia estadística de cada variante.

## Decisión
1. **Modelo de Variantes de Decks (`yg_deck_variants`)**:
   - Cada baraja puede tener múltiples variantes asociadas a un `deck_id` principal.
   - Cada variante registra su receta específica de Main, Extra y Side deck compartiendo la misma Deckbox base.
2. **Motor de Intercambio Físico y Clasificación de Cartas**:
   - Algoritmo que calcula el Core Invariable (cartas compartidas), cartas que salen a reserva (Reserva de Caja) y cartas entrantes requeridas.
   - Clasificación inteligente de procedencia:
     a) **Local Pool**: Cartas disponibles en la misma deckbox.
     b) **Deck Loans (Préstamos)**: Cartas físicas prestadas temporalmente desde otra baraja del usuario.
     c) **Missing / Proxy**: Cartas no poseídas físicamente que requieren proxy o compra.
3. **Motor Hipergeométrico y Simulación Monte Carlo**:
   - Módulo matemático (`hypergeometricEngine`) que calcula la probabilidad acumulada exacta ($P(X \ge k)$) y ejecuta simulaciones de 10,000 manos para medir la consistencia de starters y enablers.

## Consecuencias
- **Positivas**:
  - Cero duplicación ficticia de cartas en inventario físico.
  - Plan de sustitución física paso a paso para torneos (guía de qué cartas sacar de la deckbox y cuáles meter antes de cada ronda).
  - Diagnóstico matemático objetivo de la consistencia de cada versión de la baraja.
- **Trade-offs**:
  - Estructura de base de datos relacional más rica que requiere validaciones de integridad en borrador antes de consolidar la variante activa.

## Referencias
- PR #12: `feat/variants`
- Commits: `0b63b73`, `288fa54`, `4c9006f`, `373da17`, `c46be3d`
