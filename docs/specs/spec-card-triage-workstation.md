# Especificación Técnica & Funcional: Mesa de Clasificación & Triaje de Cartas (SDD)

**ID**: `SPEC-CARD-TRIAGE-WORKSTATION-001`  
**Estado**: Aprobado por el Usuario (Fase 1 completada tras `/grill-me`)  
**Fecha**: 2026-10-28  
**Autor**: Antigravity AI & Marcos Román Valverde  
**Módulo**: `Collection Triage & Physical Sorting Desk`  
**Ruta Principal**: `/collection/triage`

---

## 1. Contexto, Problema y Visión General

### 1.1 Problema
Al abrir productos masivos físicos (ej. latas *Mega-Tin 2024 Dueling Mirrors*, cajas de sobres o lotes de cambio), el usuario enfrenta entre 50 y 300 cartas físicas que necesita clasificar una por una. El proceso manual es lento, requiere consultar múltiples fuentes externas para saber precios de mercado (TCGPlayer), recordar qué mazos propios necesitan copias y determinar el destino de cada carta:
1. Si debe guardarse en **Binder de Colección** por su valor o rareza.
2. Si entra como pieza directa o tech en un **Mazo Registrado Activo**.
3. Si aporta a una **Incubadora Temática** (ej. lote de *Reptiles*, *Pyro*, *Ciberso*, *Zombies*) que acumula cartas para futuros proyectos.
4. Si califica como **Ensalada Didáctica para Talleres** (`workshop`): cartas con efectos genéricos, sencillos y comprensibles para principiantes (ej. *Tour Guide* invocando vainillas, removedores simples).
5. Si debe destinarse a **Venta / Trade** (`trade_sale`) con precio asignado.
6. Si es **Bulk / Descarte** (`bulk`) para la caja de comunes sin uso inmediato.

### 1.2 Solución
Una estación de trabajo dedicada en [`/collection/triage`](file:///c:/Users/marco/OneDrive/Desktop/Proyectos/2-%20Activos/3-%20Otros/personal-yugioh-deckbuilder/src/app/collection/triage/page.tsx), tipo **Mesa de Clasificación**, con:
- **Selector de Alcance en 3 Niveles**: Toda la Colección, Contenedor específico o Carril individual; con filtro opcional de *"Solo pendientes de clasificar"*.
- **Flujo Secuencial Focalizado**: Carta actual en grande con efecto legible, tira visual de la cola con progreso y panel contextual.
- **Selector de Ediciones & Rarezas Oficiales con Precios TCGPlayer por Set**: Consulta en tiempo real a YGOPRODeck (`card_sets`) con badges de alto valor (`> $3.00` o secretas/coleccionista).
- **Diagnóstico Tripartito Automático**:
  - *Competitivo/Serio*: Matches con mazos activos y detección de staples del meta.
  - *Incubadora Temática*: Agrupación por arquetipo o tipo/atributo con conteo de cartas acumuladas en colección.
  - *Ensalada Didáctica*: Heurística de efectos genéricos sin textos densos ni restricciones de arquetipo.
- **Persistencia en Tiempo Real con Undo (`Ctrl + Z`)**: Mutaciones inmediatas en Supabase con historial para deshacer.
- **Mapeo Físico Inteligente**: Actualiza el estado de inmediato y sugiere moverla físicamente si hay un contenedor/binder predeterminado.
- **Atajos Numéricos Ergonómicos (1 a 6, R, Flechas, Ctrl+Z)** y botones táctiles $\ge 44\text{px}$.

---

## 2. Contratos de Datos y Esquemas Zod

### 2.1 Esquema de Alcance y Filtros de Entrada (`TriageScopeConfig`)

```typescript
import { z } from 'zod';

export const triageScopeSchema = z.object({
  scopeType: z.enum(['all', 'location', 'compartment']),
  locationId: z.string().uuid().nullable().optional(),
  compartmentIndex: z.number().int().min(0).nullable().optional(),
  onlyUnclassified: z.boolean().default(true),
  sortOrder: z.enum(['physical', 'rarity_desc', 'name_asc']).default('physical'),
});

export type TriageScopeConfig = z.infer<typeof triageScopeSchema>;
```

### 2.2 Esquema de Destino y Mutación de Carta (`TriageCardActionPayload`)

```typescript
export const triageDestinationActionSchema = z.object({
  userCardId: z.string().uuid(),
  destinationType: z.enum([
    'active_deck',      // Opción 1: Asignar a mazo registrado
    'thematic_pool',    // Opción 2: Proyecto temático / incubadora
    'workshop_salad',   // Opción 3: Ensalada didáctica para talleres
    'collection_binder',// Opción 4: Carpeta / Binder de valor
    'trade_sale',       // Opción 5: Venta / Intercambio
    'bulk_discard',     // Opción 6: Bulk / Caja común
  ]),
  // Parámetros específicos según el destino
  deckId: z.string().uuid().nullable().optional(),
  deckSection: z.enum(['main', 'extra', 'side']).nullable().optional(),
  themeTag: z.string().trim().max(100).nullable().optional(),
  targetLocationId: z.string().uuid().nullable().optional(),
  targetCompartmentIndex: z.number().int().min(0).nullable().optional(),
  // Modificaciones de rareza y valor
  rarity: z.string().trim().min(1).max(100),
  salePrice: z.number().min(0).nullable().optional(),
  condition: z.enum(['Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged']).default('Near Mint'),
});

export type TriageCardActionPayload = z.infer<typeof triageDestinationActionSchema>;
```

### 2.3 Contrato de Variantes de Impresión / Rareza (`CardSetOption`)

```typescript
export interface CardSetPrinting {
  setName: string;
  setCode: string;
  setRarity: string;
  setRarityCode: string;
  setPrice: number; // Precio de mercado TCGPlayer para este set específico
}

export interface CardSetPrintingsResponse {
  cardId: number;
  name: string;
  defaultRarity: string;
  highValueWarning: boolean;
  printings: CardSetPrinting[];
  marketPriceTcg: number;
  marketPriceCardmarket: number;
}
```

### 2.4 Contrato de Diagnóstico Tripartito (`TriageDiagnosis`)

```typescript
export interface TriageCompetitiveMatch {
  deckId: string;
  deckName: string;
  section: 'main' | 'extra' | 'side';
  neededCopies: number;
  currentInDeck: number;
  format: string;
}

export interface TriageThematicIncubator {
  themeName: string; // ej. "Reptil", "Pyro", "Branded", "Ciberso"
  themeCategory: 'archetype' | 'race' | 'attribute';
  totalCardsInCollection: number;
  uniqueCardsInCollection: number;
  hasEnoughForCore: boolean; // >= 15 cartas acumuladas
}

export interface TriageWorkshopHeuristic {
  isCandidateForWorkshop: boolean;
  score: number; // 0 - 100
  reasons: string[]; // ej. "Texto breve (< 120 caracteres)", "Invocador genérico de nivel bajo"
}

export interface TriageDiagnosis {
  cardId: number;
  userCardId: string;
  isStaple: boolean;
  stapleTier: 'Tier 1' | 'Tier 2' | null;
  competitiveMatches: TriageCompetitiveMatch[];
  thematicIncubators: TriageThematicIncubator[];
  workshopHeuristic: TriageWorkshopHeuristic;
  playsetCount: number; // Copias totales en inventario físico
  isSurplus: boolean;
  suggestedPrimaryAction: 'active_deck' | 'thematic_pool' | 'workshop_salad' | 'collection_binder' | 'trade_sale' | 'bulk_discard';
}
```

---

## 3. Heurística de Ensalada Didáctica para Talleres (`workshop`)

Una carta se considera candidata prioritaria para taller/ensalada didáctica si cumple los siguientes criterios puros evaluados en render:

1. **Longitud de Texto de Efecto Reducida**: `desc.length <= 250` caracteres (evita "muros de texto" incomprensibles para alumnos o aprendices).
2. **Ausencia de Restricciones Estrictas de Arquetipo**: No contiene cláusulas restrictivas como *"for the rest of this turn, you cannot Special Summon monsters, except..."* o cláusulas xenófobas de arquetipo específico.
3. **Efectos Genéricos Reconocidos**:
   - Monstruo Normal (Vainilla): Excelente para aprender niveles, ataque/defensa y tributos básicos.
   - Reclutadores / Extensores Genéricos: Cartas que invocan o buscan por tipo/atributo/nivel amplio (ej. *Tour Guide from the Underworld*, *Sangan*, *Witch of the Black Forest*, *Giant Rat*).
   - Removedores / Control Universal: *Raigeki*, *Dark Hole*, *Mystical Space Typhoon*, *Book of Moon*, *Compulsory Evacuation Device*.
   - Monstruos con efectos simples de 1 sola oración (Flip effects básicos, destrucción en batalla, robo de 1 carta).

---

## 4. Arquitectura Modular de Componentes (Límite < 200 LOC)

Para dar cumplimiento estricto al **Mandamiento 2** (Clean Code & Modularidad) y **Mandamiento 3** (Protocolo Zero-Effect React 19):

```text
src/
├── app/
│   └── collection/
│       └── triage/
│           └── page.tsx                         # Ruta principal y contenedor de página (< 150 LOC)
├── components/
│   └── collection/
│       └── triage/
│           ├── TriageWorkstation.tsx             # Orquestador del layout de triaje (< 180 LOC)
│           ├── TriageHeaderScopeSelector.tsx     # Selector jerárquico de origen/alcance (< 160 LOC)
│           ├── TriageQueueFilmstrip.tsx          # Tira visual de cola de cartas y progreso (< 140 LOC)
│           ├── TriageActiveCardViewer.tsx        # Visualizador de carta activa en gran tamaño (< 170 LOC)
│           ├── TriageRarityPricingModal.tsx      # Modal / Popover selector de ediciones y rarezas (< 180 LOC)
│           ├── TriageDiagnosticPanel.tsx         # Panel del diagnóstico tripartito (< 190 LOC)
│           ├── TriageActionButtonBar.tsx         # Botonera de acciones rápidas (1 a 6) (< 160 LOC)
│           ├── TriagePhysicalMovePrompt.tsx      # Diálogo sutil de confirmación de movimiento físico (< 130 LOC)
│           ├── hooks/
│           │   ├── useTriageState.ts             # Estado general de navegación, cola y selección (< 190 LOC)
│           │   ├── useTriageKeyboardShortcuts.ts # Listener de atajos de teclado con prevención de inputs (< 110 LOC)
│           │   └── useTriageCardMutations.ts     # Mutaciones en tiempo real y pila de Undo (< 160 LOC)
│           ├── triage.utils.ts                   # Funciones puras de ordenamiento y filtrado (< 150 LOC)
│           └── triageClassification.utils.ts     # Algoritmo de diagnóstico tripartito y ensalada didáctica (< 180 LOC)
```

---

## 5. Endpoints de API

### 5.1 `GET /api/cards/[id]/sets`
- **Descripción**: Obtiene la lista completa de sets, rarezas oficiales y precios de mercado para una carta dada utilizando la caché de YGOPRODeck.
- **Respuesta**:
  ```json
  {
    "card_id": 10000,
    "name": "Tour Guide From the Underworld",
    "printings": [
      {
        "setName": "2024 Mega-Tin Dueling Mirrors",
        "setCode": "MP24-EN012",
        "setRarity": "Prismatic Secret Rare",
        "setRarityCode": "PScR",
        "setPrice": 2.45
      }
    ]
  }
  ```

### 5.2 Mutación en `POST /api/collection/cards` (Extensión de acciones Triage)
- Se utiliza el endpoint existente optimizado para actualizar simultáneamente `rarity`, `status_flag`, `deck_id`, `deck_section`, `sale_price`, `storage_location_id` y `compartment_index` en una única transacción atómica.

---

## 6. Casos Borde y Manejo de Errores

| Caso Borde | Comportamiento Esperado |
| :--- | :--- |
| **Cola Vacía o Contenedor sin Cartas** | Pantalla de estado vacío con ilustración amigable, botón para cambiar alcance o agregar cartas a la bandeja sin clasificar. |
| **Pérdida de Conexión a Internet** | Indicador visual de desconexión; las mutaciones fallidas detienen el avance de la cola y permiten reintentar sin perder la carta en edición. |
| **Deshacer (`Ctrl+Z`) en la Primera Carta** | Botón de Undo deshabilitado y notificación sutil (toast) *"No hay acciones previas para deshacer"*. |
| **Fallo en API de TCGPlayer / YGOPRODeck** | Fallback seguro a los datos de rareza existentes en `yg_user_cards` con precio estimado base (`$0.25`). |
| **Input de Texto Activo** | Si el usuario está escribiendo un precio o nota, los atajos de teclado numéricos (1-6) se desactivan para no disparar acciones accidentales. |

---

## 7. Criterios de Aceptación Given-When-Then (Gherkin)

### Escenario 1: Navegación y Clasificación Rápida a Mazo
- **Given** que el usuario selecciona el carril *"Carril 1: Mega-Tin 2024"* con 40 cartas en la Mesa de Triaje.
- **When** se presenta la carta *"Ash Blossom & Joyous Spring"* y el usuario presiona la tecla `1`.
- **Then** el sistema asigna la carta al mazo activo que la requiere en `yg_user_cards`, la marca con `status_flag = 'in_deck'`, actualiza el contador de progreso y avanza a la siguiente carta sin recargar la página.

### Escenario 2: Deshacer Inmediato con `Ctrl + Z`
- **Given** que el usuario clasificó una carta por error como `bulk` presionando `6`.
- **When** presiona `Ctrl + Z` o el botón *"Deshacer"*.
- **Then** el sistema restaura el estado anterior de la carta en la base de datos, retrocede la cola a la carta revertida y muestra una confirmación flotante.

### Escenario 3: Cambio de Rareza y Detección de Precio
- **Given** que la carta en pantalla tiene rareza *"Common"*, pero proviene físicamente de la Mega-Lata como *"Prismatic Secret Rare"*.
- **When** el usuario abre el selector de rareza (tecla `R`) y elige *"MP24 - Prismatic Secret Rare"*.
- **Then** la rareza se actualiza inmediatamente a *"Prismatic Secret Rare"*, el valor de mercado refleja el precio específico del set y se enciende el borde dorado si supera el umbral de alto valor.

### Escenario 4: Detección de Ensalada Didáctica para Talleres
- **Given** que se evalúa una carta con efecto simple de 1 línea sin xenofobia de arquetipo.
- **When** se renderiza el panel de diagnóstico tripartito.
- **Then** la tarjeta *"Ensalada Didáctica"* aparece resaltada con badge verde y tecla de acceso rápido `3` recomendada.

### Escenario 5: Alerta Visible Exterior de Disparidad de Rareza
- **Given** que la carta activa tiene impresiones físicas con diferencia sustancial de costo (ej. base $0.22 vs impresión cara de $15.00 o rareza de coleccionista).
- **When** el usuario observa la carta activa desde la estación de triaje sin abrir el modal.
- **Then** el sistema presenta un banner de advertencia visual destacado con el rango de precios ($min a $max), destacando la necesidad de verificar la rareza física antes de clasificarla, y en el botón de rareza muestra el rango con icono de atención.
- **And** si la carta tiene precios uniformes en todas sus ediciones (< $0.50 de diferencia), muestra una confirmación sutil de "Precio Uniforme" para que el usuario no dude.

### Escenario 6: Selección de Texto, Click Scroll y Apertura en Nueva Ventana
- **Given** que el usuario desea copiar el nombre o descripción del efecto de una carta, o investigar sus cotizaciones externas.
- **When** selecciona texto con el cursor del ratón y presiona Ctrl+C, o hace middle-click en los enlaces a YGOPRODeck/TCGPlayer o en la imagen.
- **Then** el texto es seleccionado y copiado sin bloqueos de `select-none`, y el enlace se abre en segundo plano en una nueva pestaña sin interrumpir la sesión de triaje, permitiendo además el autoscroll con botón central en los contenedores desplazables.

### Escenario 7: Filtro Canónico "Solo Pendientes" y Persistencia de Clasificación
- **Given** un carril o contenedor con cartas clasificadas (con etiquetas temáticas `[Tema: ...]`, asignadas a mazo, taller o venta) y cartas vírgenes sin clasificar.
- **When** el usuario activa el filtro *"Solo pendientes"*.
- **Then** el sistema evalúa `isCardPendingTriage` y muestra exclusivamente las cartas sin clasificar/etiquetar, erradicando pantallas en blanco.
- **And** al clasificar una carta, ésta adquiere su marca/etiqueta persistente, garantizando que al recargar la página la cola muestre únicamente las pendientes reales y el cursor inicial se posicione en la primera carta no clasificada.

### Escenario 8: Veredicto Táctico Profundo, Calificación 1-10 y Modal de Desacuerdo/Aprendizaje
- **Given** una carta activa evaluada en la mesa de triaje.
- **Then** el veredicto táctico presenta una **Calificación Numérica de Fuerza en escala de 1.0 a 10.0** (Regla 7 de AGENTS.md), su rol táctico específico (ej. *Extender*, *Starter*, *Brick Pesado*) y un razonamiento de juego real.
- **When** el usuario no concuerda con la recomendación del sistema y presiona el botón *"No estoy de acuerdo con este veredicto"*.
- **Then** se abre el modal de auditoría permitiéndole seleccionar el destino correcto (1 a 6), justificar su criterio técnico y calificar la sugerencia (1-5 estrellas).
- **And** el sistema registra el reporte en `yg_suggestion_reports` (Regla 8 de AGENTS.md), aplica la acción del usuario en `yg_user_cards` con memoria táctica y avanza la cola sin fricción.


