# Protocolo Spec-Driven Development (SDD) - personal-yugioh-deckbuilder

Este proyecto implementa el estándar obligatorio de desarrollo guiado por especificaciones (**Spec-Driven Development**).

---

## 1. Filosofía Fundamental
> **La Especificación (`spec.md`) es el código fuente real.**  
> El código generado (TypeScript, Next.js, Supabase) es solo el compilado derivado por el agente.

Queda estrictamente prohibido implementar features o refactorizaciones complejas de barajas/filtros/scraping sin una especificación previa aprobada.

---

## 2. Las 3 Fases Formales

1. **Fase 1: Especificación (`spec.md`)**:
   - Redactar en `.dev/specs/` o en el artefacto de sesión.
   - Definir interfaces de cartas/decks, esquemas Zod, casos de arquetipos vacíos, límites de Extra Deck (15 cartas) y criterios de aceptación Given-When-Then.
2. **Fase 2: Plan Técnico Quirúrgico (`implementation_plan.md`)**:
   - Detallar archivos exactos a modificar, evitando tocar componentes que funcionan bien.
3. **Fase 3: TDD, Verificación & Commit**:
   - Pruebas de lógica de cálculo de ratios -> Implementación -> `tsc` + `lint` + `build` -> Commit atómico.
