/**
 * Motor de Combos, Árboles de Decisión y Líneas de Juego de Yu-Gi-Oh!
 * Modela secuencias de combo (1-card, 2-card), estados de tablero y mitigación de interrupciones.
 */

export interface ComboStep {
  stepNumber: number;
  action: string;
  cardName: string;
  sourceZone: 'hand' | 'deck' | 'gy' | 'field' | 'extra_deck' | 'banished';
  targetZone: 'hand' | 'deck' | 'gy' | 'field' | 'extra_deck' | 'banished';
  details?: string;
}

export interface DecisionBranch {
  trigger: string; // Ej: "Oponente activa Ash Blossom en el efecto de búsqueda"
  branchName: string;
  alternativeSteps: ComboStep[];
  resultingEndboard: string;
  resilienceScore: number; // 1-5
}

export interface ComboPlaybookItem {
  id: string;
  title: string;
  archetype: string;
  comboType: '1-card' | '2-card' | 'going_second_breaker' | 'recovery';
  requiredCards: string[];
  endboardDescription: string;
  interruptionTolerance: 'low' | 'medium' | 'high';
  steps: ComboStep[];
  decisionBranches: DecisionBranch[];
}

/**
 * Base de datos curada de patrones de combo universales y de arquetipos meta (vigente a Agosto 2026).
 */
export const SAMPLE_COMBO_PLAYBOOKS: ComboPlaybookItem[] = [
  {
    id: 'snake_eye_ash_1_card',
    title: 'Snake-Eye Ash (1-Card Combo Completo)',
    archetype: 'Snake-Eye',
    comboType: '1-card',
    requiredCards: ['Snake-Eye Ash'],
    endboardDescription: 'Promethean Princess en GY + Flamberge Dragon + Apollousa / IP Masquerena + 3 interrupciones',
    interruptionTolerance: 'high',
    steps: [
      {
        stepNumber: 1,
        action: 'Normal Summon',
        cardName: 'Snake-Eye Ash',
        sourceZone: 'hand',
        targetZone: 'field',
        details: 'Activar efecto de Ash al ser Invocado de Modo Normal para buscar a Snake-Eye Poplar.',
      },
      {
        stepNumber: 2,
        action: 'Special Summon',
        cardName: 'Snake-Eye Poplar',
        sourceZone: 'hand',
        targetZone: 'field',
        details: 'Activar efecto en mano al ser añadido: Invocarse Especial y buscar Original Sinful Spoils - Snake-Eye.',
      },
      {
        stepNumber: 3,
        action: 'Link Summon',
        cardName: 'Linkuriboh',
        sourceZone: 'extra_deck',
        targetZone: 'field',
        details: 'Usar Poplar como material. Activar efecto de Poplar en GY para colocarse en la Zona de Magias/Trampas como Mágica Continua.',
      },
      {
        stepNumber: 4,
        action: 'Activate Spell',
        cardName: 'Original Sinful Spoils - Snake-Eye',
        sourceZone: 'hand',
        targetZone: 'gy',
        details: 'Enviar Poplar continuo al GY para Invocar Especial a Snake-Eyes Flamberge Dragon desde el Deck.',
      },
      {
        stepNumber: 5,
        action: 'Link Summon',
        cardName: 'Promethean Princess, Bestower of Flames',
        sourceZone: 'extra_deck',
        targetZone: 'field',
        details: 'Usar Ash + Flamberge Dragon. Efecto de Flamberge en GY revive 2 monstruos Nivel 1 (Ash + Poplar).',
      },
    ],
    decisionBranches: [
      {
        trigger: 'Oponente activa Ash Blossom en el efecto inicial de Snake-Eye Ash',
        branchName: 'Extensión mediante Bonfire o WANTED / Diabellstar',
        alternativeSteps: [
          {
            stepNumber: 1,
            action: 'Activate Quick-Play Spell',
            cardName: 'WANTED: Seeker of Sinful Spoils',
            sourceZone: 'hand',
            targetZone: 'gy',
            details: 'Buscar a Diabellstar the Black Witch, invocarla enviando 1 carta de mano/campo, y buscar Original Sinful Spoils.',
          },
        ],
        resultingEndboard: 'Flamberge Dragon + IP Masquerena + 2 interrupciones',
        resilienceScore: 4,
      },
      {
        trigger: 'Oponente activa Nibiru después de la 5ta Invocación Especial',
        branchName: 'Recuperación por efecto de GY de Flamberge Dragon / Princess',
        alternativeSteps: [
          {
            stepNumber: 1,
            action: 'Trigger in GY',
            cardName: 'Snake-Eyes Flamberge Dragon',
            sourceZone: 'gy',
            targetZone: 'field',
            details: 'Flamberge activa efecto obligatorio/opcional al ser enviado al GY por Nibiru, reviviendo 2 cuerpos Nivel 1.',
          },
        ],
        resultingEndboard: 'IP Masquerena + Princess en GY + Nibiru Token protegido',
        resilienceScore: 3,
      },
    ],
  },
];
