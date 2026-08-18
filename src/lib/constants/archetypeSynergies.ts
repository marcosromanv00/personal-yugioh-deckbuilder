/**
 * Diccionario Maestro de Sinergias Implícitas y No Nominales de Yu-Gi-Oh!
 * Mapea cartas que forman parte del núcleo o soporte fundamental de un arquetipo
 * sin necesidad de llevar el nombre en su título.
 */

export type SynergyRole = 
  | 'starter' 
  | 'extender' 
  | 'searcher' 
  | 'dump_target' 
  | 'boss' 
  | 'tech' 
  | 'floodgate_counter' 
  | 'engine'
  | 'staple_synergy';

export interface ImplicitCardSynergy {
  cardName: string;
  role: SynergyRole;
  weight: number; // 0.0 a 1.0 (relevancia de inclusión en el arquetipo)
  reason: string;
  recommendedCopies?: number;
}

export interface ArchetypeSynergyDefinition {
  archetype: string;
  description: string;
  relatedTypesOrAttributes?: string[];
  implicitCards: ImplicitCardSynergy[];
}

export const ARCHETYPE_IMPLICIT_SYNERGIES: ArchetypeSynergyDefinition[] = [
  {
    archetype: 'Beetrooper',
    description: 'Enjambre y control de monstruos Insecto, dependiente de efectos en cementerio y búsquedas cruzadas.',
    relatedTypesOrAttributes: ['Insect', 'EARTH', 'WIND'],
    implicitCards: [
      {
        cardName: 'Resonance Insect',
        role: 'searcher',
        weight: 0.98,
        reason: 'Al ser enviado al cementerio busca cualquier Insecto de Nivel 5+ sin restricción una vez por turno.',
        recommendedCopies: 3
      },
      {
        cardName: 'Gokipole',
        role: 'starter',
        weight: 0.95,
        reason: 'Al ser enviado al cementerio busca un Insecto Nivel 4 y puede destruir un monstruo rival.',
        recommendedCopies: 2
      },
      {
        cardName: 'Retaliating "C"',
        role: 'tech',
        weight: 0.90,
        reason: 'Handtrap que destierra cartas al activar magias de invocación y al enviarse al GY busca Resonance Insect o Beetroopers.',
        recommendedCopies: 2
      },
      {
        cardName: 'Heavy Cavalry of the Indestructible Insects',
        role: 'extender',
        weight: 0.85,
        reason: 'Extensor de alto impacto para invocar Insectos desde el cementerio y facilitar jugadas Link.',
        recommendedCopies: 1
      },
      {
        cardName: 'Giant Ballpark',
        role: 'starter',
        weight: 0.80,
        reason: 'Facilita la invocación masiva de Insectos normales para disparar efectos de Beetrooper.',
        recommendedCopies: 2
      },
      {
        cardName: 'Bio-Insect Armor',
        role: 'extender',
        weight: 0.82,
        reason: 'Se equipa a monstruos Insecto y actúa como extensor/tributo clave.',
        recommendedCopies: 1
      },
      {
        cardName: 'Inzektor Picofalena',
        role: 'searcher',
        weight: 0.96,
        reason: 'Monstruo Link 2 que equipa Resonance Insect directo del Deck a un monstruo en campo.',
        recommendedCopies: 1
      }
    ]
  },
  {
    archetype: 'Naturia',
    description: 'Estrategia de control de recursos basada en negación continua e interacción con monstruos EARTH y Plant/Insect.',
    relatedTypesOrAttributes: ['EARTH', 'Plant', 'Insect'],
    implicitCards: [
      {
        cardName: 'Vernusylph of the Misting Seedlings',
        role: 'engine',
        weight: 0.95,
        reason: 'Descarta y busca cualquier EARTH/Hada además de revivir monstruos Naturia del GY.',
        recommendedCopies: 3
      },
      {
        cardName: 'Keldo the Sacred Protector',
        role: 'tech',
        weight: 0.92,
        reason: 'Interrupción rápida en GY para reciclar cartas Naturia o vaciar el cementerio del rival.',
        recommendedCopies: 1
      },
      {
        cardName: 'Mudora the Sword Oracle',
        role: 'tech',
        weight: 0.92,
        reason: 'Interrupción rápida en GY y colocación de Gravekeeper\'s Trap.',
        recommendedCopies: 1
      },
      {
        cardName: 'Gravekeeper\'s Trap',
        role: 'floodgate_counter',
        weight: 0.85,
        reason: 'Búsqueda de monstruos EARTH y protección del cementerio.',
        recommendedCopies: 1
      },
      {
        cardName: 'Naturia Sacred Tree',
        role: 'searcher',
        weight: 0.98,
        reason: 'Busca cualquier carta Naturia al ser enviada al cementerio.',
        recommendedCopies: 3
      }
    ]
  },
  {
    archetype: 'Dinomorphia',
    description: 'Estrategia de pago extremo de LP y negación con trampas de contraefecto dinosauro.',
    relatedTypesOrAttributes: ['Dinosaur', 'DARK', 'Trap'],
    implicitCards: [
      {
        cardName: 'Fossil Dig',
        role: 'starter',
        weight: 0.98,
        reason: 'Busca a Dinomorphia Therizia o Diplos directamente del Deck a la mano sin costo.',
        recommendedCopies: 3
      },
      {
        cardName: 'Trap Trick',
        role: 'searcher',
        weight: 0.94,
        reason: 'Coloca Dinomorphia Domain o Frenzy directamente desde el Deck para activar en el mismo turno.',
        recommendedCopies: 3
      },
      {
        cardName: 'Ferret Flames',
        role: 'tech',
        weight: 0.90,
        reason: 'Remoción masiva no destructiva basada en la reducción crítica de LP del jugador Dinomorphia.',
        recommendedCopies: 2
      },
      {
        cardName: 'Solemn Judgment',
        role: 'staple_synergy',
        weight: 0.95,
        reason: 'Paga la mitad de tus LP para negar cualquier invocación o magia/trampa, potenciando las habilidades de Dinomorphia.',
        recommendedCopies: 3
      },
      {
        cardName: 'Solemn Strike',
        role: 'staple_synergy',
        weight: 0.88,
        reason: 'Negación de efectos de monstruos a bajo coste de LP compatible con el control de trampas.',
        recommendedCopies: 2
      },
      {
        cardName: 'Wannabee!',
        role: 'extender',
        weight: 0.86,
        reason: 'Excava 5 cartas en End Phase para colocar trampas normales de Dinomorphia.',
        recommendedCopies: 2
      }
    ]
  },
  {
    archetype: 'HERO',
    description: 'Fusiones y combos masivos de guerreros de luz y oscuridad (Elemental, Destiny, Evil, Masked, Vision HERO).',
    relatedTypesOrAttributes: ['Warrior', 'DARK', 'LIGHT', 'EARTH', 'WIND', 'FIRE', 'WATER'],
    implicitCards: [
      {
        cardName: 'A Hero Lives',
        role: 'starter',
        weight: 0.99,
        reason: 'Invoca a Elemental HERO Stratos o Shadow Mist directo del deck sin gastar la Invocación Normal.',
        recommendedCopies: 3
      },
      {
        cardName: 'Mask Change',
        role: 'searcher',
        weight: 0.98,
        reason: 'Magia de juego rápido indispensable para invocar a Masked HERO Dark Law y otros Masked Heroes.',
        recommendedCopies: 3
      },
      {
        cardName: 'Polymerization',
        role: 'extender',
        weight: 0.95,
        reason: 'Carta de fusión central buscada por Vision HERO Vyon y Elemental HERO Blazeman.',
        recommendedCopies: 1
      },
      {
        cardName: 'Fusion Destiny',
        role: 'starter',
        weight: 0.99,
        reason: 'Envía materiales directo del Deck al GY para invocar a Destiny HERO - Destroyer Phoenix Enforcer.',
        recommendedCopies: 2
      },
      {
        cardName: 'Destiny HERO - Malicious',
        role: 'extender',
        weight: 0.96,
        reason: 'Se destierra del cementerio para invocar otra copia, proporcionando material Link masivo.',
        recommendedCopies: 2
      },
      {
        cardName: 'Foolish Burial',
        role: 'starter',
        weight: 0.85,
        reason: 'Envía Shadow Mist al GY para buscar cualquier HERO o Malicious para extender.',
        recommendedCopies: 1
      },
      {
        cardName: 'Reinforcement of the Army',
        role: 'starter',
        weight: 0.98,
        reason: 'Busca cualquier monstruo HERO de Nivel 4 o menor.',
        recommendedCopies: 1
      }
    ]
  },
  {
    archetype: 'Branded',
    description: 'Fusiones continuas centradas en Fallen of Albaz y el motor Despia / Bystial.',
    relatedTypesOrAttributes: ['Dragon', 'Spellcaster', 'Fairy', 'DARK', 'LIGHT'],
    implicitCards: [
      {
        cardName: 'Fallen of Albaz',
        role: 'starter',
        weight: 1.0,
        reason: 'Corazón absoluto del arquetipo. Material de fusión obligatorio para Mirrorjade, Lubellion y Albion.',
        recommendedCopies: 3
      },
      {
        cardName: 'Aluber the Jester of Despia',
        role: 'searcher',
        weight: 0.99,
        reason: 'Busca cualquier magia o trampa "Branded" al ser invocado de modo normal o especial.',
        recommendedCopies: 3
      },
      {
        cardName: 'Springans Kitt',
        role: 'extender',
        weight: 0.90,
        reason: 'Se invoca de modo especial y recupera o busca magias/trampas Branded del cementerio o deck.',
        recommendedCopies: 1
      },
      {
        cardName: 'Blazing Cartesia, the Virtuous',
        role: 'extender',
        weight: 0.96,
        reason: 'Cantante de fusión rápida que permite fusionar en el turno de ambos jugadores.',
        recommendedCopies: 2
      },
      {
        cardName: 'Guiding Quem, the Virtuous',
        role: 'starter',
        weight: 0.97,
        reason: 'Envía a Fallen of Albaz al GY y lo revive durante las jugadas de fusión del rival.',
        recommendedCopies: 2
      },
      {
        cardName: 'Fusion Deployment',
        role: 'starter',
        weight: 0.94,
        reason: 'Invoca a Fallen of Albaz o Cartesia directamente del Deck sin usar la Invocación Normal.',
        recommendedCopies: 3
      },
      {
        cardName: 'Gold Sarcophagus',
        role: 'starter',
        weight: 0.85,
        reason: 'Destierra a Despian Tragedy para buscar a Aluber inmediatamente.',
        recommendedCopies: 1
      }
    ]
  },
  {
    archetype: 'Kashtira',
    description: 'Control de destierro masivo de cartas rivales boca abajo y bloqueo de zonas de cartas.',
    relatedTypesOrAttributes: ['Psychic', 'DARK', 'EARTH', 'FIRE', 'WIND'],
    implicitCards: [
      {
        cardName: 'Dimension Shifter',
        role: 'floodgate_counter',
        weight: 0.95,
        reason: 'Destierra todas las cartas enviadas al GY sin perjudicar el juego de Kashtira.',
        recommendedCopies: 2
      },
      {
        cardName: 'Pressured Planet Wraitsoth',
        role: 'searcher',
        weight: 0.99,
        reason: 'Magia de campo que busca cualquier monstruo Kashtira y destruye cartas en campo.',
        recommendedCopies: 1
      },
      {
        cardName: 'Infinitrack Goliath',
        role: 'extender',
        weight: 0.88,
        reason: 'Se acopla como material XYZ a Kashtira Arise-Heart para darle inmunidad a destrucción.',
        recommendedCopies: 1
      },
      {
        cardName: 'Sacred Sword of Seven Stars',
        role: 'extender',
        weight: 0.80,
        reason: 'Destierra un Kashtira de Nivel 7 de la mano o campo para robar 2 cartas.',
        recommendedCopies: 2
      },
      {
        cardName: 'Number 89: Diablosis the Mind Hacker',
        role: 'boss',
        weight: 0.92,
        reason: 'Monstruo XYZ de Rango 7 que destierra masivamente el Extra Deck y Deck rival boca abajo.',
        recommendedCopies: 1
      }
    ]
  },
  {
    archetype: 'Snake-Eye',
    description: 'Invocaciones masivas de monstruos Fuego de Nivel 1 y colocación en zonas de Magias/Trampas continuas.',
    relatedTypesOrAttributes: ['Pyro', 'FIRE'],
    implicitCards: [
      {
        cardName: 'Bonfire',
        role: 'searcher',
        weight: 0.99,
        reason: 'Busca a Snake-Eye Ash o Poplar directamente a la mano sin restricciones.',
        recommendedCopies: 3
      },
      {
        cardName: 'Original Sinful Spoils - Snake-Eye',
        role: 'starter',
        weight: 0.99,
        reason: 'Envía cualquier carta boca arriba al GY para invocar cualquier monstruo Fuego de Nivel 1 del Deck.',
        recommendedCopies: 2
      },
      {
        cardName: 'Diabellstar the Black Witch',
        role: 'starter',
        weight: 0.98,
        reason: 'Invoca de modo especial y coloca "Original Sinful Spoils" directo en campo.',
        recommendedCopies: 3
      },
      {
        cardName: 'WANTED: Seeker of Sinful Spoils',
        role: 'searcher',
        weight: 0.99,
        reason: 'Busca a Diabellstar la Bruja Negra y se recicla desde el cementerio para robar 1 carta.',
        recommendedCopies: 3
      },
      {
        cardName: 'Promethean Princess, Bestower of Flames',
        role: 'extender',
        weight: 0.98,
        reason: 'Revive monstruos de Fuego del cementerio y ofrece interrupción rápida desde el GY.',
        recommendedCopies: 1
      },
      {
        cardName: 'Amphibious Swarmship Amblowhale',
        role: 'boss',
        weight: 0.90,
        reason: 'Link 4 ideal para escalar con Promethean Princess y mantener presencia de campo.',
        recommendedCopies: 1
      }
    ]
  },
  {
    archetype: 'Tearlaments',
    description: 'Estrategia de fusiones activadas al enviar monstruos Aqua/DARK al cementerio.',
    relatedTypesOrAttributes: ['Aqua', 'DARK', 'WATER'],
    implicitCards: [
      {
        cardName: 'Kelbek the Ancient Vanguard',
        role: 'dump_target',
        weight: 0.95,
        reason: 'Envía las 5 cartas superiores de ambos decks al GY para disparar todas las fusiones Tearlaments.',
        recommendedCopies: 1
      },
      {
        cardName: 'Agido the Ancient Sentinel',
        role: 'dump_target',
        weight: 0.95,
        reason: 'Envía 5 cartas al GY acelerando el motor de fusiones.',
        recommendedCopies: 1
      },
      {
        cardName: 'Foolish Burial',
        role: 'starter',
        weight: 0.96,
        reason: 'Envía a Tearlaments Scheiren, Merrli o Havnis para activar su efecto de fusión inmediato.',
        recommendedCopies: 1
      },
      {
        cardName: 'King of the Swamp',
        role: 'extender',
        weight: 0.90,
        reason: 'Sustituto de material de fusión (sustituye a Kitkallos o Albaz) y busca Polimerización.',
        recommendedCopies: 3
      },
      {
        cardName: 'Tearlaments Kashtira',
        role: 'starter',
        weight: 0.98,
        reason: 'Extensor que destierra e intercambia cartas enviando 3 cartas superiores del Deck al GY.',
        recommendedCopies: 3
      },
      {
        cardName: 'Time Thief Redoer',
        role: 'extender',
        weight: 0.92,
        reason: 'Desacopla Tearlaments Scheiren por efecto activando su fusión en el turno rival.',
        recommendedCopies: 1
      }
    ]
  },
  {
    archetype: 'Labrynth',
    description: 'Control implacable basado en activar cartas Trampa Normales y disparar efectos de demonios.',
    relatedTypesOrAttributes: ['Fiend', 'DARK', 'Trap'],
    implicitCards: [
      {
        cardName: 'Trap Trick',
        role: 'searcher',
        weight: 0.95,
        reason: 'Coloca cualquier Trampa Normal del deck como Welcome Labrynth o Big Welcome.',
        recommendedCopies: 2
      },
      {
        cardName: 'Transaction Rollback',
        role: 'dump_target',
        weight: 0.96,
        reason: 'Copia cualquier Trampa Normal del cementerio pagando la mitad de tus LP.',
        recommendedCopies: 2
      },
      {
        cardName: 'Dimensional Barrier',
        role: 'floodgate_counter',
        weight: 0.92,
        reason: 'Trampa Normal buscable por Lady Labrynth que apaga por completo un tipo de invocación del rival.',
        recommendedCopies: 2
      },
      {
        cardName: 'Destructive Daruma Karma Cannon',
        role: 'tech',
        weight: 0.93,
        reason: 'Pone todos los monstruos boca abajo y envía los monstruos Link al GY, disparando a Lady Labrynth.',
        recommendedCopies: 2
      },
      {
        cardName: 'Compulsory Evacuation Device',
        role: 'tech',
        weight: 0.88,
        reason: 'Devuelve un monstruo a la mano disparando los efectos de Lovely Labrynth y el castillo.',
        recommendedCopies: 2
      },
      {
        cardName: 'Overroot',
        role: 'tech',
        weight: 0.85,
        reason: 'Remoción flexible e interactiva para el arquetipo de trampas.',
        recommendedCopies: 1
      }
    ]
  },
  {
    archetype: 'Floowandereeze',
    description: 'Invocaciones Normales consecutivas de aves de viento y destierro continuo sin usar el Extra Deck.',
    relatedTypesOrAttributes: ['Winged Beast', 'WIND', 'WATER'],
    implicitCards: [
      {
        cardName: 'Dimension Shifter',
        role: 'floodgate_counter',
        weight: 0.99,
        reason: 'No afecta a Floowandereeze ya que sus monstruos se destierran al salir del campo por defecto.',
        recommendedCopies: 2
      },
      {
        cardName: 'Pot of Duality',
        role: 'starter',
        weight: 0.98,
        reason: 'Excava 3 cartas sin penalización puesto que el arquetipo no invoca de modo especial.',
        recommendedCopies: 3
      },
      {
        cardName: 'Pot of Prosperity',
        role: 'starter',
        weight: 0.98,
        reason: 'Destierra cartas irrelevantes del Extra Deck para excavar hasta 6 cartas clave.',
        recommendedCopies: 1
      },
      {
        cardName: 'Mist Valley Apex Avian',
        role: 'boss',
        weight: 0.94,
        reason: 'Monstruo Bestia Alada de alto nivel que niega cualquier carta y regresa a la mano para ser reinvocado.',
        recommendedCopies: 1
      },
      {
        cardName: 'Raiza the Mega Monarch',
        role: 'boss',
        weight: 0.95,
        reason: 'Interrupción devastadora que regresa cartas del campo y GY a la parte superior del Deck.',
        recommendedCopies: 1
      },
      {
        cardName: 'Jack-in-the-Hand',
        role: 'searcher',
        weight: 0.90,
        reason: 'Muestra 3 monstruos de Nivel 1 de nombres diferentes asegurando al menos 1 starter en mano.',
        recommendedCopies: 3
      }
    ]
  },
  {
    archetype: 'Purrely',
    description: 'Alimentación e incremento de materiales XYZ a través de Magias de Juego Rápido Purrely.',
    relatedTypesOrAttributes: ['Fairy', 'Beast', 'LIGHT', 'DARK'],
    implicitCards: [
      {
        cardName: 'Stray Purrely Street',
        role: 'searcher',
        weight: 0.95,
        reason: 'Otorga inmunidad a los monstruos Purrely en el turno de invocación y acopla magias.',
        recommendedCopies: 3
      },
      {
        cardName: 'Ghostrick Dullahan',
        role: 'extender',
        weight: 0.92,
        reason: 'Monstruo XYZ de Rango 1 usado como puente para sobreponer Ghostrick Angel of Mischief.',
        recommendedCopies: 1
      },
      {
        cardName: 'Ghostrick Angel of Mischief',
        role: 'extender',
        weight: 0.92,
        reason: 'Permite buscar Ghostrick Shot y acumular materiales para Purrely Noir.',
        recommendedCopies: 1
      },
      {
        cardName: 'Xyz Encore',
        role: 'tech',
        weight: 0.88,
        reason: 'Solución no respondible contra monstruos XYZ rivales en juegos espejo o meta.',
        recommendedCopies: 2
      }
    ]
  },
  {
    archetype: 'Fire King',
    description: 'Destrucción mutua de monstruos Bestia / Bestia Alada / Demonio de Fuego para invocar jefes del cementerio.',
    relatedTypesOrAttributes: ['Beast', 'Beast-Warrior', 'Winged Beast', 'FIRE'],
    implicitCards: [
      {
        cardName: 'Bonfire',
        role: 'searcher',
        weight: 0.96,
        reason: 'Busca a Snake-Eye Poplar o Ash si se juega la variante híbrida Fire King Snake-Eye.',
        recommendedCopies: 3
      },
      {
        cardName: 'Promethean Princess, Bestower of Flames',
        role: 'extender',
        weight: 0.99,
        reason: 'Revive a Garunix o Kirin y destruye monstruos propios para activar sus efectos de cementerio.',
        recommendedCopies: 1
      },
      {
        cardName: 'Worldsea Dragon Zealantis',
        role: 'boss',
        weight: 0.92,
        reason: 'Reinicia el campo entero y permite destruir con Promethean Princess en combo directo hacia OTK.',
        recommendedCopies: 1
      }
    ]
  },
  {
    archetype: 'Tenpai Dragon',
    description: 'Sincronías agresivas de Dragones de Fuego durante la Battle Phase con inmunidad absoluta.',
    relatedTypesOrAttributes: ['Dragon', 'FIRE'],
    implicitCards: [
      {
        cardName: 'Sangen Summoning',
        role: 'starter',
        weight: 1.0,
        reason: 'Magia de campo que hace inafectados a los monstruos de Fuego durante la Main Phase 1 y busca monstruos.',
        recommendedCopies: 1
      },
      {
        cardName: 'Sangen Kaimen',
        role: 'searcher',
        weight: 0.99,
        reason: 'Magia de juego rápido que busca o invoca cualquier Dragón de Fuego durante la Battle Phase.',
        recommendedCopies: 3
      },
      {
        cardName: 'Kuibelt the Blade Dragon',
        role: 'tech',
        weight: 0.90,
        reason: 'Sincronía de Nivel 7 que destruye una carta al invocarse y prolonga la cadena de ataques.',
        recommendedCopies: 1
      },
      {
        cardName: 'Black Rose Dragon',
        role: 'tech',
        weight: 0.92,
        reason: 'Limpia todo el campo rival sin destruir tus monstruos protegidos por Sangen Summoning.',
        recommendedCopies: 1
      }
    ]
  }
];

// Helper Functions

/**
 * Obtiene la lista de sinergias implícitas para un arquetipo dado.
 */
export function getImplicitSynergiesForArchetype(archetype: string): ImplicitCardSynergy[] {
  if (!archetype) return [];
  const normalized = archetype.trim().toLowerCase();
  const match = ARCHETYPE_IMPLICIT_SYNERGIES.find(
    (a) => a.archetype.toLowerCase() === normalized
  );
  return match ? match.implicitCards : [];
}

/**
 * Encuentra a qué arquetipos pertenece una carta por sinergia implícita.
 */
export function getArchetypesForCard(cardName: string): { archetype: string; role: SynergyRole; weight: number; reason: string }[] {
  if (!cardName) return [];
  const normalized = cardName.trim().toLowerCase();
  const results: { archetype: string; role: SynergyRole; weight: number; reason: string }[] = [];

  ARCHETYPE_IMPLICIT_SYNERGIES.forEach((item) => {
    const cardMatch = item.implicitCards.find(
      (c) => c.cardName.toLowerCase() === normalized
    );
    if (cardMatch) {
      results.push({
        archetype: item.archetype,
        role: cardMatch.role,
        weight: cardMatch.weight,
        reason: cardMatch.reason
      });
    }
  });

  return results;
}

/**
 * Calcula el puntaje de afinidad o sinergia entre una carta y un arquetipo específico.
 */
export function calculateSynergyScore(archetype: string, cardName: string): number {
  if (!archetype || !cardName) return 0;
  const synergies = getImplicitSynergiesForArchetype(archetype);
  const match = synergies.find(
    (c) => c.cardName.toLowerCase() === cardName.trim().toLowerCase()
  );
  return match ? match.weight : 0;
}
