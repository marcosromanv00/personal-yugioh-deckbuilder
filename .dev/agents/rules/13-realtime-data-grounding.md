# Estándar Obligatorio de Anclaje a Datos en Vivo, APIs Oficiales y Erradicación de Alucinaciones

Este documento define el mandamiento inviolable de verificación externa en tiempo real para todos los agentes de desarrollo, asistentes de IA y motores analíticos de este proyecto.

---

## 1. El Principio de Verosimilitud Cero (Zero-Assumption Protocol)

> **"La memoria paramétrica interna del LLM no es una fuente de verdad para datos fácticos de dominio."**

Todo modelo de lenguaje sufre de desfase temporal (*knowledge cutoff*), sesgos retrospectivos y alucinaciones probabilísticas. En dominios altamente dinámicos y volátiles como Yu-Gi-Oh! (TCG/OCG/MD, cotizaciones de mercado, lanzamientos de productos, cajas/latas, sinergias y banlists oficiales), **asumir datos de memoria es una falta grave de calidad**.

---

## 2. Los 5 Mandamientos de Datos Vivos

### Mandamiento 1: Prohibición Absoluta de Memoria Paramétrica
Queda terminantemente prohibido dar por sentado:
1. **Contenidos de Productos**: Listas de cartas de latas (Mega-Tins), cajas de sobres (Core Boosters), Battles of Legend o Rarity Collections.
2. **Precios y Valoraciones**: Precios en USD/EUR, tendencias de mercado o costes de reimpresiones.
3. **Banlists y Legalidad de Formatos**: Estados de prohibición/limitación en TCG, Master Duel u OCG.
4. **Metagame Tiers y Ratios de Torneo**: Si un mazo es "Tier 1", "Tier 2" o "Rogue" en la fecha actual.

### Mandamiento 2: Consulta Obligatoria a Fuentes Vivas & Oficiales
Antes de emitir cualquier sugerencia estratégica, reporte de producto o análisis técnico, el agente o motor DEBE invocar herramientas de red (`search_web`, llamadas HTTP o APIs estructuradas) consultando exclusivamente:
- **Konami Official (`yugioh-card.com`)**: Banlists oficiales vigentes, noticias oficiales de productos, reglas maestras y rulings de torneos.
- **YGOPRODeck API (`ygoprodeck.com`)**: Base de datos de cartas, identificadores Konami (passcodes), atributos oficiales, sets de impresión y precios de referencia agregados.
- **Master Duel Meta (`masterduelmeta.com`) & Yu-Gi-Oh! Meta (`ygometa.com`)**: Listas de torneos de fin de semana, breakdowns porcentuales de cartas por arquetipo y tier lists estadísticas.
- **TCGPlayer & Cardmarket**: Precios de mercado vigentes por rareza y set específico.

### Mandamiento 3: Métrica Cuantitativa de Fuerza Obligatoria (1.0 a 10.0)
Toda evaluación comparativa de decks, sinergias o paquetes de cartas debe incluir una **Calificación de Fuerza Numérica en escala de 1.0 a 10.0** (ejemplo: *Branded Despia: 8.5/10*, *Ryzeal: 9.2/10*, *Darklord: 4.2/10*), acompañada de:
1. **Tier Actual de Torneo** (Tier 1, Tier 2, Rogue, Casual).
2. **Justificación basada en torneos recientes** (YCS, Regionales, torneos comunitarios documentados en los últimos 30 días).

### Mandamiento 4: Trazabilidad y Citas Explícitas
Toda recomendación proporcionada por la IA debe incluir o referenciar la fuente fáctica:
- *"Según la banlist TCG vigente desde [Fecha Oficial]..."*
- *"De acuerdo al breakdown de Master Duel Meta ([Fecha/Evento])..."*
- *"Con base en los datos de set reportados por YGOPRODeck para [Nombre del Set]..."*

### Mandamiento 5: Reconocimiento Explícito de Incertidumbre
Si una carta, producto o ruling es de lanzamiento reciente o no cuenta con datos indexados oficiales:
- El sistema o agente **DEBE declarar explícitamente la falta de datos oficiales**.
- Prohibido rellenar vacíos con conjeturas o efectos ficticios.

---

## 3. Integración en el Pipeline del Sistema

1. **En Desarrollo de Software (Antigravity AI)**:
   - Todo código, script o tabla de base de datos que maneje cartas o decks debe anclarse en las APIs vivas (`src/lib/ygoprodeck.ts`, scripts de sincronización).
2. **En Prompts del Sistema (`/api/ai/*`, `/api/chat/*`)**:
   - Los prompts deben exigir rigurosidad, declarar la fecha en curso real, e instruir al modelo a admitir cuando no disponga de evidencia en lugar de alucinar.
3. **Auditoría de Errores por el Usuario**:
   - Todo módulo que presente sugerencias de IA debe incorporar un mecanismo de reporte (`yg_suggestion_reports`) donde el usuario califique la precisión (1 a 5) y describa discrepancias para retroalimentar el sistema.
