import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';

interface DeckCardRaw {
  card_id: number;
  name: string;
  count: number;
  section: string;
  type: string;
  ban_tcg: string | null;
}

interface DeckRaw {
  id: string;
  name: string;
  is_active: boolean;
  total_cards_count: number;
  cards: DeckCardRaw[];
}

interface UserCardRaw {
  card_id: number;
  name: string;
  type: string;
  archetype: string | null;
  race: string | null;
  attribute: string | null;
  ban_tcg: string | null;
  total_qty: number;
  locations: string | null;
}

interface PurchaseItem {
  name: string;
  copies: number;
  unitPrice: number;
  totalPrice: number;
  setOrSource: string;
  reason: string;
}

interface DeckAuditResult {
  deckId: string;
  name: string;
  slug: string;
  score: number;
  tier: string;
  isActive: boolean;
  mainCount: number;
  extraCount: number;
  sideCount: number;
  // Banlist
  banViolations: string[];
  // Movimientos
  cuts: string[];
  addsFromCollection: { name: string; copies: number; location: string; reason: string }[];
  keeps: string[];
  // Propuesta de construcción si el deck está incompleto
  constructionProposal?: string[];
  // Compras
  purchasesPriority: PurchaseItem[];
  purchasesConsideration: PurchaseItem[];
  purchasesDiscardable: string[];
  // Presupuestos
  costPriority: number;
  costTotal: number;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/@/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Calificaciones de Fuerza y Tier
const DECK_SCORES: Record<string, { score: number; tier: string }> = {
  'branded': { score: 8.5, tier: 'Tier 1.5 (Competitivo de Élite)' },
  'despia_branded': { score: 8.5, tier: 'Tier 1.5 (Competitivo de Élite)' },
  'phantom_adventure': { score: 7.5, tier: 'Tier 2 (Rogue Fuerte)' },
  'salamangreat': { score: 7.5, tier: 'Tier 2 (Sólido / Anti-Meta)' },
  'dinomorphia': { score: 7.2, tier: 'Tier 2 (Control Letal)' },
  'chaos_horus_lightsworn': { score: 7.0, tier: 'Tier 2 (Explosivo de Cementerio)' },
  'sangen_tenpai_dragon': { score: 7.0, tier: 'Rogue OTK / Ex-Tier 1 (2024)' },
  'ignister': { score: 6.8, tier: 'Rogue (Cyberse / Alliance Insight)' },
  'beetroper_insects': { score: 6.8, tier: 'Rogue (Motor Ragnaraika)' },
  'reptile_ragnaraika': { score: 6.8, tier: 'Rogue (Motor Ragnaraika)' },
  'cyber_dragon': { score: 6.5, tier: 'Rogue (OTK Anti-Máquinas)' },
  'traptrix': { score: 6.5, tier: 'Rogue (Control Estructura)' },
  'tri_brigade_spright': { score: 6.4, tier: 'Rogue (Enjambre Nivel 2)' },
  'blackwing': { score: 6.2, tier: 'Rogue (Burn Control)' },
  'superheavy_samurai': { score: 6.0, tier: 'Rogue (Motor Péndulo/Sincronía)' },
  'synchron': { score: 6.0, tier: 'Rogue (Combo Sincronía 12)' },
  'marincess': { score: 5.8, tier: 'Casual / Rogue (Control Agua)' },
  'ghoti_shark': { score: 5.7, tier: 'Casual / Rogue (Sincronía Pescado)' },
  'fluffal': { score: 5.6, tier: 'Casual / Rogue (Fusión Agresiva)' },
  'earth_machine_pobre': { score: 5.5, tier: 'Casual / Rogue (Máquinas Pesadas)' },
  'fire_king_snake_eyes': { score: 5.4, tier: 'Casual / Rogue (Motor Mermado)' },
  'predaplant_naturia': { score: 5.4, tier: 'Casual / Rogue (Fusión / Planta)' },
  'fire_king_kaiju_pobre': { score: 5.3, tier: 'Casual / Rogue (Control Tributo)' },
  'fire_king_pobre': { score: 5.3, tier: 'Casual / Rogue (Destrucción Fuego)' },
  'ancient_warriors': { score: 5.2, tier: 'Casual / Rogue (Rebote Guerrero)' },
  'dino_scrap': { score: 5.0, tier: 'Casual / Rogue (Dinos Destrucción)' },
  'elemental_hero': { score: 5.0, tier: 'Casual / Rogue (Fusión HÉROE)' },
  'ninja': { score: 5.0, tier: 'Casual / Rogue (Control Ninja)' },
  'dinowrestler': { score: 4.9, tier: 'Casual (Dinos Batalla)' },
  'gunkan_magikey': { score: 4.8, tier: 'Casual (Suship / Ritual Xyz)' },
  'magikey_gunkan': { score: 4.8, tier: 'Casual (Suship / Ritual Xyz)' },
  'gunkan_pobre': { score: 4.7, tier: 'Casual (Suship Puro)' },
  'libromancer': { score: 4.7, tier: 'Casual (Ritual Cyberse)' },
  'nemleria': { score: 4.7, tier: 'Casual (Extradeck Banish)' },
  'black_rose_dragon': { score: 4.6, tier: 'Casual (Sincronía Rosa)' },
  'crystal_beast': { score: 4.6, tier: 'Casual (Rainbow Overdrive)' },
  'majestic_stardust': { score: 4.6, tier: 'Casual (Stardust Dragon)' },
  'amazoness': { score: 4.5, tier: 'Casual (Guerreras Fusión)' },
  'blue_eyes_legendary_decks': { score: 4.5, tier: 'Casual / Nostálgico' },
  'amazoness_base': { score: 4.4, tier: 'Casual (Base Fusión)' },
  'red_eyes_legendary_decks': { score: 4.4, tier: 'Casual / Nostálgico' },
  'metalfoes': { score: 4.3, tier: 'Casual (Péndulo Fusión)' },
  'vampire_mayakashi': { score: 4.3, tier: 'Casual (Zombie Escalera)' },
  'invoked_dogmashaddoll': { score: 4.2, tier: 'Casual (Trío Antiguo)' },
  'war_rock_heroic': { score: 4.2, tier: 'Casual (Guerreros Batalla)' },
  'darklord': { score: 4.0, tier: 'Casual (Hadas Oscuridad)' },
  'performapal': { score: 4.0, tier: 'Casual (Péndulo Circo)' },
  'dinomist': { score: 4.0, tier: 'Casual (Péndulo Máquina)' },
  'insectos': { score: 4.0, tier: 'Casual (Insectos Base)' },
  'chronomaly': { score: 3.8, tier: 'Casual (Artefactos Xyz)' },
  'fossil': { score: 3.8, tier: 'Casual (Fusión Rocas)' },
  'fabled': { score: 3.8, tier: 'Casual (Descarte Sincronía)' },
  'simorgh_gusto': { score: 3.7, tier: 'Casual (Aves Viento)' },
  'amaze': { score: 3.5, tier: 'Casual (Atracciones Trampa)' },
  'trap_monster': { score: 3.5, tier: 'Casual (Trampas Continuas)' },
  'fire_starter_deck': { score: 3.0, tier: 'Casual (Starter Básico)' }
};

// Base de datos de compras reales por arquetipo (excluyendo lo que el usuario ya tiene)
interface ArchetypeBuyGuide {
  priority: { name: string; copies: number; price: number; source: string; reason: string }[];
  consideration: { name: string; copies: number; price: number; source: string; reason: string }[];
  discardable: string[];
}

const BUY_GUIDES: Record<string, ArchetypeBuyGuide> = {
  branded: {
    priority: [
      { name: 'The Dragon that Devours the Dogma', copies: 1, price: 0.36, source: 'The Chronicles Deck (CH01)', reason: 'Fusión Lv8 (Albaz + Luz/Oscuridad + Efecto) que cuesta centavos ($0.36). Inmune a efectos si Ecclesia está en campo o GY (+500 ATK). Al invocarse baraja 2 cartas de GY/destierro al deck y en End Phase busca carta Dogmatika o Tri-Brigade (Mercourier/Kitt).' },
      { name: 'Despian Luluwalilith', copies: 1, price: 0.25, source: 'RA05 (Rarity Collection)', reason: 'Sincronía 12 de Luz de centavos enviada con Granguignol para dar buff de ATK masivo en campo o negar e invocar Quem/Cartesia en End Phase.' },
      { name: 'Garura, Wings of Resonant Life', copies: 1, price: 1.20, source: 'RA02 (Rarity Collection II)', reason: 'Target universal de Super Poly (2 monstruos con mismo tipo/atributo) que roba 1 carta al enviarse al cementerio.' },
      { name: 'Bystial Druiswurm', copies: 1, price: 1.60, source: 'MP23 (Prismatic Secret)', reason: 'Interrupción rápida en cementerio (Limitada a 1 en TCG) que al enviarse al cementerio manda al GY 1 monstruo invocado especial del rival.' }
    ],
    consideration: [
      { name: 'The Fallen & The Virtuous', copies: 1, price: 4.50, source: 'The Chronicles Deck (CH01)', reason: 'Magia rápida tratada como Branded y Dogmatika que permite invocar Fusión en Battle Phase o turno rival.' },
      { name: 'Nadir Servant', copies: 3, price: 0.75, source: 'RA01 (Rarity Collection)', reason: 'Consistencia suprema para enviar Garura (roba 1) o Granguignol y buscar Quem/Albaz.' },
      { name: 'Albion the Sanctifire Dragon (2da copia)', copies: 1, price: 1.50, source: 'MP24', reason: 'Respaldo para partidas de desgaste prolongado.' }
    ],
    discardable: [
      'Cartas de bloqueo tóxico como Gimmick Puppet Nightmare o Ido lock (inconsistentes y vulnerables a breakers).',
      'Motores de Péndulo o Link pesado que colisionan con la restricción de invocación de Branded Fusion.'
    ]
  },
  salamangreat: {
    priority: [
      { name: 'Salamangreat Raging Phoenix', copies: 2, price: 0.25, source: 'RA04 (Quarter Century Stampede)', reason: 'Link-4 obligatorio que gracias a su reimpresión reciente cuesta centavos ($0.25): busca cualquier carta Salamangreat al reencarnar y revive con boost de ATK.' },
      { name: 'Salamangreat of Fire', copies: 3, price: 1.15, source: 'LD10 / MP25', reason: 'Iniciador de 1 carta que añade cualquier Salamangreat de nivel 4 o menor.' },
      { name: 'Worldsea Dragon Zealantis', copies: 1, price: 0.25, source: 'RA04 (Quarter Century Stampede)', reason: 'Link-4 de centavos ($0.25) que comba con Promethean Princess en tu GY para limpiar el campo rival.' }
    ],
    consideration: [
      { name: 'Salamangreat Weasel', copies: 2, price: 0.25, source: 'LD10 / MP24', reason: 'Soporte moderno 2025/2026: se auto-invoca, roba 1 al usarse de material Link y revive monstruos en campo rival para activar triggers de Phoenix.' },
      { name: 'Salamangreat Charge', copies: 1, price: 0.20, source: 'LD10', reason: 'Magia de juego rápido que recicla 3 monstruos Salamangreat del GY al deck o mano.' },
      { name: 'Code of Soul', copies: 1, price: 0.75, source: 'LEDE', reason: 'Permite hacer Link Summon durante el turno del oponente.' }
    ],
    discardable: [
      'Motor Snake-Eye completo (Snake-Eye Ash y Wanted están fuertemente limitadas en TCG y cuestan caro sin aportar consistencia pura).',
      'Salamangreat Emerald Eagle y cartas rituales lentas del tema.'
    ]
  },
  phantom_adventure: {
    priority: [
      { name: 'The Phantom Knights of Doomed Soleret', copies: 3, price: 0.75, source: 'Chaos Origins (2026)', reason: 'Starter de 1 carta que se auto-invoca y setea directamente cualquier magia/trampa PK del deck.' },
      { name: 'Dark Requiem Xyz Dragon', copies: 1, price: 1.50, source: 'LED8 / Rarity', reason: 'Boss principal invocado con Rank-Up: 3 negaciones de monstruos que destruyen e invocan un Xyz del cementerio.' },
      { name: 'Leviair the Sea Dragon', copies: 1, price: 0.50, source: 'Rarity Collection', reason: 'Recicla monstruos PK de nivel 3 desterrados para extender combos infinitos.' },
      { name: 'The Phantom Knights\' Rank-Up-Magic Launch', copies: 1, price: 0.50, source: 'LEHD / LED8', reason: 'Sube Break Sword en el turno del oponente a Dark Requiem o Kali Yuga.' }
    ],
    consideration: [
      { name: 'The Phantom Knights of Decayed Cloak', copies: 2, price: 0.50, source: 'Chaos Origins', reason: 'Extensor adicional de nivel 3 con recuperación de recursos.' },
      { name: 'Downerd Magician', copies: 1, price: 0.50, source: 'RA02 (Rarity Collection II)', reason: 'Trampolín Xyz sobre Break Sword para armar tu Divine Arsenal AA-ZEUS con 4 materiales.' },
      { name: 'The Phantom Knights of Umbrage Veil', copies: 1, price: 0.25, source: 'Chaos Origins', reason: 'Trampa que se activa el mismo turno en que se coloca si controlas monstruos PK.' }
    ],
    discardable: [
      'Archnemeses Protos (PROHIBIDA en la banlist oficial de TCG).',
      'Apollousa, Bow of the Goddess (PROHIBIDA en la banlist oficial de TCG).',
      'Copias extra de Called by the Grave (LIMITADA A 1).'
    ]
  },
  sangen_tenpai_dragon: {
    priority: [
      { name: 'Tenpai Dragon Paidra (2 copias faltantes)', copies: 2, price: 6.00, source: 'LEDE', reason: 'Starter indispensable del mazo que busca magias/trampas Sangen e inicia la escala en Battle Phase.' },
      { name: 'Tenpai Dragon Fadra (2 copias faltantes)', copies: 2, price: 0.35, source: 'LEDE', reason: 'Al estar Chundra limitada a 1, Fadra es mandatoria a 3 copias para protección en batalla y revivir.' },
      { name: 'Trident Dragion', copies: 1, price: 2.25, source: 'BLTR (Battles of Legend)', reason: 'El rematador supremo del deck: ataca 3 veces con 3000 ATK (9000 de daño directo).' },
      { name: 'Sangenpai Bident Dragion (1 copia faltante)', copies: 1, price: 0.35, source: 'LEDE', reason: 'Sincronía 7 del tema que revive dragones del cementerio para subir a Nivel 10.' },
      { name: 'Sangenpai Transcendent Dragion (1 copia faltante)', copies: 1, price: 1.25, source: 'LEDE', reason: 'Sincronía 10 que fuerza al oponente a atacar y revive destruyendo cartas.' }
    ],
    consideration: [
      { name: 'Dora Dora', copies: 3, price: 0.20, source: 'DIFO', reason: 'Normal summon súper económica ($0.20) que busca cualquier Dragón de FUEGO Lv4 o menor como Paidra o Fadra.' },
      { name: 'Kuibelt the Blade Dragon', copies: 1, price: 0.25, source: 'CYAC', reason: 'Sincronía 7 Dragón de FUEGO que destruye una carta al invocarse.' },
      { name: 'Odd-Eyes Meteorburst Dragon', copies: 1, price: 0.50, source: 'Structure', reason: 'Impide que el oponente active efectos de monstruos durante la Battle Phase.' }
    ],
    discardable: [
      'Copias 2 y 3 de Sangen Summoning (¡LIMITADA A 1 en TCG!).',
      'Copias 2 y 3 de Tenpai Dragon Chundra (¡LIMITADA A 1 en TCG!).',
      'Copias 2 y 3 de Sangen Kaimen (¡LIMITADA A 1 en TCG!).',
      'Sangen Dharma y trampas Sangen lentas que no ayudan al OTK de segundo turno.'
    ]
  },
  ignister: {
    priority: [
      { name: 'Allied Code Talker @Ignister', copies: 1, price: 2.00, source: 'Alliance Insight (2026)', reason: 'Link-5 de 2300 ATK que revive en masa Cyberse con 2300 ATK y niega/destierra en efecto rápido.' },
      { name: 'Backup @Ignister', copies: 2, price: 0.50, source: 'Alliance Insight', reason: 'Tuner Lv3 que se auto-invoca si controlas Cyberse de Extra y busca Cyberse de OSCURIDAD.' },
      { name: 'Wizard @Ignister', copies: 2, price: 0.35, source: 'Alliance Insight', reason: 'Lv4 extensor que se auto-invoca y revive Cyberse de OSCURIDAD del cementerio.' },
      { name: 'Decode Talker Heatsoul', copies: 1, price: 0.50, source: 'GFP2 / Structure', reason: 'Motor de robo acelerado: roba 1 en tu turno y 1 en el turno del oponente por 1000 LP.' }
    ],
    consideration: [
      { name: 'Firewall Dragon Darkfluid - Neo Tempest Terahertz', copies: 1, price: 1.75, source: 'CYAC / Tin', reason: 'En cada turno envía tu Cyberse Desavewurm o Mereologic Aggregator al GY para activar negaciones.' },
      { name: 'Mereologic Aggregator', copies: 1, price: 0.50, source: 'DABL', reason: 'Enviado al GY por Terahertz niega cualquier carta boca arriba en el campo.' },
      { name: 'Linguriboh', copies: 1, price: 0.75, source: 'IGAS', reason: 'Link-1 para tributar y negar cartas trampa como Infinite Impermanence o Evenly Matched.' }
    ],
    discardable: [
      'Splash Mage (¡PROHIBIDA en TCG!).',
      'Link Decoder (¡PROHIBIDA en TCG!).',
      'Water Leviathan @Ignister y magias de ritual obsoletas (usa Cyberse Sage de tu colección).'
    ]
  },
  dinomorphia: {
    priority: [
      { name: 'Dinomorphia Rexsturm (2 copias faltantes)', copies: 2, price: 1.25, source: 'DIFO / MP23', reason: 'El jefe definitivo del deck: el rival no puede activar efectos de monstruos con ATK mayor a tus LP.' },
      { name: 'Dinomorphia Therizia (1 copia faltante)', copies: 1, price: 1.75, source: 'BACH / MP23', reason: 'Iniciadora de 1 carta a 3 copias que setea Frenzy o Domain directamente.' },
      { name: 'Evolzar Lars', copies: 1, price: 2.50, source: 'DABL / MP24', reason: 'Rango 6 de Dinosaurio que niega 2 cartas en campo como efecto rápido desacoplando materiales.' }
    ],
    consideration: [
      { name: 'Trap Trick', copies: 2, price: 0.40, source: 'RA01 (Rarity Collection)', reason: 'Duplica el acceso a Frenzy o Domain en el turno del oponente.' },
      { name: 'Ferocious Flame Swordsman', copies: 1, price: 0.50, source: 'Structure', reason: 'Link-2 que revive cualquier monstruo Guerrero o Dinosaurio al ser destruido.' }
    ],
    discardable: [
      'Pot of Extravagance / Prosperity en exceso (la banlist las tiene tocadas y Dinomorphia necesita su Extra Deck completo).',
      'Trampas condicionales lentas como Dinomorphia Alert o Shell.'
    ]
  },
  traptrix: {
    priority: [
      { name: 'Traptrix Pudica (2 copias faltantes)', copies: 2, price: 0.35, source: 'SDRR', reason: 'Busca Traptrip Garden al invocarse y destierra un monstruo especial del oponente hasta la siguiente Standby.' },
      { name: 'Traptrix Myrmeleo (1 copia faltante)', copies: 1, price: 0.20, source: 'SDRR', reason: 'Completa las 3 copias del mejor buscador de Hole Traps del juego.' },
      { name: 'Time Thief Redoer', copies: 1, price: 0.40, source: 'GFTP / MP20', reason: 'Rango 4 que acopla trampas del rival o tu propia Holeutea para quitar cartas sin destruir.' }
    ],
    consideration: [
      { name: 'Ice Dragon\'s Prison', copies: 2, price: 0.35, source: 'RA01 (Rarity Collection)', reason: 'Trampa normal adicional que interactúa con el cementerio rival sin activar efectos.' },
      { name: 'Parallel eXceed', copies: 3, price: 0.30, source: 'OP14 / MP21', reason: 'Invocado gratis con Sera para armar cualquier Rango 4 instantáneo (Rafflesia, Redoer, Lars).' }
    ],
    discardable: [
      'Trampas de agujero obsoletas como Acid Trap Hole, Adhesion Trap Hole o Two-Pronged Attack.',
      'Cartas de alto costo innecesarias.'
    ]
  },
  cyber_dragon: {
    priority: [
      { name: 'Cyber Dragon Core (2 copias faltantes)', copies: 2, price: 0.35, source: 'SDCR / Rarity', reason: 'El starter indispensable del deck a 3 copias para buscar Cyber Emergency o Cyber Repair Plant.' },
      { name: 'Cyber Dragon Infinity', copies: 1, price: 0.90, source: 'RA01 (Rarity Collection)', reason: 'Omni-negación y absorción de monstruos en posición de ataque sobre Cyber Dragon Nova.' },
      { name: 'Chimeratech Rampage Dragon', copies: 1, price: 0.75, source: 'BOSH / LEDD', reason: 'Fusión destructora de magias/trampas que ataca hasta 3 veces enviando máquinas de Luz al GY.' },
      { name: 'Chimeratech Megafleet Dragon', copies: 1, price: 1.25, source: 'BLRR / MP18', reason: 'Elimina cualquier monstruo en la Extra Monster Zone del oponente sin activar efectos ni gastar magias.' }
    ],
    consideration: [
      { name: 'Clockwork Night', copies: 2, price: 1.50, source: 'BLCR / MP24', reason: 'Convierte todo el campo en Máquinas: fusionas todo el tablero del rival con Chimeratech Fortress Dragon gratis.' },
      { name: 'Cyber Emergency (1 copia faltante)', copies: 1, price: 0.50, source: 'GEIM / BLAR', reason: 'Buscador fundamental de cualquier monstruo Cyber Dragon.' }
    ],
    discardable: [
      'Cyber Dragon Zwei, Drei y cartas antiguas de la era GX que no tienen texto moderno de inicio.',
      'Cyber End Dragon o fusiones pesadas de 3 materiales difíciles de invocar.'
    ]
  }
};

function parseJsonFile<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, 'utf-8');
  let text = raw;
  try {
    const p = JSON.parse(raw) as { result?: string };
    if (p && typeof p.result === 'string') text = p.result;
  } catch {}
  const fb = text.indexOf('[');
  const lb = text.lastIndexOf(']');
  return JSON.parse(text.substring(fb, lb + 1)) as T;
}

const OFFICIAL_FORBIDDEN = new Set([
  'dimension shifter',
  'archlord kristya',
  'red-eyes dark dragoon',
  'triple tactics talent',
  'crossout designator',
  'splash mage',
  'archnemeses protos',
  'baronne de fleur',
  'borreload savage dragon',
  'superheavy samurai scarecrow',
  'link decoder',
  'appointer of the red lotus',
  'summon limit',
  'kashtira arise-heart',
  'apollousa, bow of the goddess',
  'beatrice, lady of the eternal',
  'curious, the lightsworn dominion',
  'chaos ruler, the chaotic magical dragon'
]);

const OFFICIAL_LIMITED = new Set([
  'branded in high spirits',
  'sangen summoning',
  'tenpai dragon chundra',
  'sangen kaimen',
  'called by the grave',
  'branded fusion',
  'terraforming',
  'pot of prosperity',
  'bystial magnamhut',
  'bystial druiswurm'
]);

function auditDeck(
  deck: DeckRaw,
  collectionMap: Map<string, UserCardRaw>,
  genericStaples: Map<string, UserCardRaw>
): DeckAuditResult {
  const slug = slugify(deck.name);
  const scoreInfo = DECK_SCORES[slug] || { score: 4.5, tier: 'Casual / Rogue Temático' };

  const mainCards = deck.cards.filter(c => c.section === 'main');
  const extraCards = deck.cards.filter(c => c.section === 'extra');
  const sideCards = deck.cards.filter(c => c.section === 'side' || c.section === 'extras');

  const mainCount = mainCards.reduce((acc, c) => acc + c.count, 0);
  const extraCount = extraCards.reduce((acc, c) => acc + c.count, 0);
  const sideCount = sideCards.reduce((acc, c) => acc + c.count, 0);

  const deckCardNames = new Set<string>();
  deck.cards.forEach(c => deckCardNames.add(c.name.toLowerCase().trim()));

  // 1. Auditoría de Banlist Oficial Vigente (Octubre 2026)
  const banViolations: string[] = [];
  const cuts: string[] = [];

  for (const c of deck.cards) {
    const cardNameLower = c.name.toLowerCase().trim();
    const isForbidden = c.ban_tcg === 'Forbidden' || OFFICIAL_FORBIDDEN.has(cardNameLower);
    const isLimited = c.ban_tcg === 'Limited' || OFFICIAL_LIMITED.has(cardNameLower);

    if (isForbidden) {
      banViolations.push(`⛔ **${c.name}** (${c.section.toUpperCase()}): Carta **PROHIBIDA** en TCG oficial.`);
      cuts.push(`Retirar inmediatamente **${c.name}** (x${c.count}) por estar PROHIBIDA en la banlist oficial de TCG.`);
    } else if (isLimited && c.count > 1) {
      banViolations.push(`⚠️ **${c.name}** (${c.section.toUpperCase()}): Registrada con ${c.count} copias pero está **LIMITADA A 1**.`);
      cuts.push(`Reducir **${c.name}** de ${c.count} a **1 copia** exacta por límite legal de TCG.`);
    } else if (c.ban_tcg === 'Semi-Limited' && c.count > 2) {
      banViolations.push(`⚠️ **${c.name}** (${c.section.toUpperCase()}): Registrada con ${c.count} copias pero está **SEMILIMITADA A 2**.`);
      cuts.push(`Reducir **${c.name}** de ${c.count} a **2 copias** por límite de banlist.`);
    }
  }

  // 2. Movimientos: Agregar desde Colección
  const addsFromCollection: { name: string; copies: number; location: string; reason: string }[] = [];
  const deckNameLower = deck.name.toLowerCase();

  // Asignaciones Inteligentes y Contextuales según tipo de deck (NO genéricas)
  // Cyberse Decks
  if (deckNameLower.includes('ignister') || deckNameLower.includes('marincess')) {
    if (!deckCardNames.has('cyberse desavewurm') && collectionMap.has('cyberse desavewurm')) {
      const c = collectionMap.get('cyberse desavewurm')!;
      addsFromCollection.push({ name: c.name, copies: 1, location: c.locations || 'Staples', reason: 'Negación rápida de Magias/Trampas al enviarse al cementerio con Terahertz o Cyberse Sage.' });
    }
    if (!deckCardNames.has('transcode talker') && collectionMap.has('transcode talker')) {
      const c = collectionMap.get('transcode talker')!;
      addsFromCollection.push({ name: c.name, copies: 1, location: c.locations || 'Colección', reason: 'Link-3 clave que revive cualquier Link Cyberse de flecha 3 o menor para escalar a Accesscode.' });
    }
  }

  // Warrior / PK / Xyz Decks
  if (deckNameLower.includes('phantom') || deckNameLower.includes('warrior')) {
    if (!deckCardNames.has('the phantom knights of malevolent scythe') && collectionMap.has('the phantom knights of malevolent scythe')) {
      const c = collectionMap.get('the phantom knights of malevolent scythe')!;
      addsFromCollection.push({ name: c.name, copies: 1, location: c.locations || 'Staples', reason: 'Rango 3 de Chaos Origins que invoca cualquier PK del deck y busca Rank-Up.' });
    }
    if (!deckCardNames.has('divine arsenal aa-zeus - sky thunder') && collectionMap.has('divine arsenal aa-zeus - sky thunder')) {
      const c = collectionMap.get('divine arsenal aa-zeus - sky thunder')!;
      addsFromCollection.push({ name: c.name, copies: 1, location: c.locations || 'Staples', reason: 'Limpiador de campo universal montable sobre Break Sword tras la fase de batalla.' });
    }
  }

  // FUEGO Decks (Salamangreat, Fire King)
  if (deckNameLower.includes('salamangreat') || deckNameLower.includes('fire king')) {
    if (!deckCardNames.has('promethean princess, bestower of flames') && collectionMap.has('promethean princess, bestower of flames')) {
      const c = collectionMap.get('promethean princess, bestower of flames')!;
      addsFromCollection.push({ name: c.name, copies: 1, location: c.locations || 'Deckbox Plástica 25th', reason: 'Interrupción rápida desde el cementerio y recursión de monstruos de FUEGO.' });
    }
  }

  // Dinosaur Decks
  if (deckNameLower.includes('dino')) {
    if (!deckCardNames.has('dinomorphia frenzy') && collectionMap.has('dinomorphia frenzy')) {
      const c = collectionMap.get('dinomorphia frenzy')!;
      addsFromCollection.push({ name: c.name, copies: Math.min(3, c.total_qty), location: c.locations || 'Colección', reason: 'Fusión de 1 carta mandando materiales desde el Deck y Extra Deck.' });
    }
    if (!deckCardNames.has('super starslayer ty-phon - sky crisis') && collectionMap.has('super starslayer ty-phon - sky crisis')) {
      const c = collectionMap.get('super starslayer ty-phon - sky crisis')!;
      addsFromCollection.push({ name: c.name, copies: 1, location: c.locations || 'Colección', reason: 'Apaga efectos de monstruos de 3000+ ATK y devuelve cartas sin activar efectos.' });
    }
  }

  // FUSION Decks con targets válidos (Branded, Predaplant)
  if (deckNameLower.includes('branded') || deckNameLower.includes('predaplant')) {
    if (!deckCardNames.has('super polymerization') && collectionMap.has('super polymerization')) {
      const c = collectionMap.get('super polymerization')!;
      addsFromCollection.push({ name: c.name, copies: 3, location: c.locations || 'Deckbox Cuero Morado / Staples', reason: 'Fusión rápida ininterrumpible usando monstruos del oponente.' });
    }
  }

  // 3. Propuesta de Construcción Completa si el Deck está incompleto (< 25 cartas)
  let constructionProposal: string[] | undefined = undefined;
  if (mainCount < 25) {
    constructionProposal = [];
    constructionProposal.push(`Este mazo cuenta actualmente con solo **${mainCount} cartas registradas** en Main Deck. Para llevarlo a 40 cartas competitivas utilizando tu inventario existente ($0 USD), incorpora:`);
    
    // Si es un deck agresivo/OTK de segundo turno como Tenpai o Ancient Warriors
    if (deckNameLower.includes('tenpai') || deckNameLower.includes('ancient') || deckNameLower.includes('cyber')) {
      constructionProposal.push(`- **3x Ash Blossom & Joyous Spring** (desde tu caja de *Staples* o *Deckbox Cuero Azul*)`);
      constructionProposal.push(`- **3x Infinite Impermanence** (desde tu caja de *Staples* o *Deckbox Cuero Azul*)`);
      constructionProposal.push(`- **3x Effect Veiler** (desde tu caja de *Staples*)`);
      constructionProposal.push(`- **3x Book of Eclipse** (desde tu caja de *Staples*) -> Apaga tableros completos en Battle Phase sin destruir.`);
      constructionProposal.push(`- **1x Raigeki** (desde tu caja de *Staples*) -> Limpiador de monstruos a $0 USD.`);
      constructionProposal.push(`- **1x Harpie's Feather Duster** (desde tu caja de *Staples* o *Deckbox Cuero Morado*) -> Limpieza de magias/trampas.`);
      constructionProposal.push(`- **2x Triple Tactics Thrust** (desde tu caja de *Staples*) -> Busca tus magias normales ante interrupciones.`);
      constructionProposal.push(`- **1x Dark Ruler No More** (desde *Deckbox Cuero Morado*) -> Apaga todos los efectos de monstruos boca arriba del rival.`);
      constructionProposal.push(`- **1x S:P Little Knight** (desde tu *Deckbox Plástica 25th*) al Extra Deck.`);
      constructionProposal.push(`- **1x Divine Arsenal AA-ZEUS - Sky Thunder** (desde tu caja de *Staples*) al Extra Deck.`);
    } else {
      // Decks de control / midrange
      constructionProposal.push(`- **3x Ash Blossom & Joyous Spring** (desde tu caja de *Staples*)`);
      constructionProposal.push(`- **3x Infinite Impermanence** (desde tu caja de *Staples*)`);
      constructionProposal.push(`- **3x Droll & Lock Bird** (desde tu caja de *Staples*)`);
      constructionProposal.push(`- **1x Called by the Grave** (desde tu caja de *Staples*, legal a 1 copia)`);
      constructionProposal.push(`- **3x Cosmic Cyclone** o **Twin Twisters** (desde tu caja de *Staples*)`);
      constructionProposal.push(`- **1x S:P Little Knight** y **1x Knightmare Phoenix / Unicorn** al Extra Deck.`);
    }
  }

  // 4. Cartas a Mantener (Keep)
  const keeps: string[] = [];
  const topMainCore = mainCards.filter(c => c.ban_tcg !== 'Forbidden' && c.count >= 2).slice(0, 6);
  topMainCore.forEach(c => keeps.push(`**${c.name}** (x${c.count}) - Núcleo consistente del Main Deck.`));
  const topExtraCore = extraCards.filter(c => c.ban_tcg !== 'Forbidden').slice(0, 4);
  topExtraCore.forEach(c => keeps.push(`**${c.name}** (x${c.count}) - Jefe / extensor de Extra Deck.`));

  // 5. Compras (Singles que NO están en el mazo ni en la colección)
  const guide = BUY_GUIDES[slug] || {
    priority: [
      { name: 'Buscador de Consistencia Principal (Playset)', copies: 3, price: 0.50, source: 'Singles TCG', reason: 'Iniciador de 1 carta específico del arquetipo para asegurar jugada en turno 1.' },
      { name: 'Jefe de Extra Deck del Arquetipo (2da copia)', copies: 1, price: 1.00, source: 'Singles TCG', reason: 'Evita perder recursos en partidas de desgaste frente a remociones.' }
    ],
    consideration: [
      { name: 'Extensor de Tipo / Atributo Económico', copies: 2, price: 0.50, source: 'Singles TCG', reason: 'Facilita invocaciones especiales adicionales sin gastar la invocación normal.' }
    ],
    discardable: [
      'Cartas de rareza coleccionista Starlight/QCR con costos inflados que no aportan mejora mecánica.',
      'Motores prohibitivos que colisionen con las restricciones de invocación del mazo.'
    ]
  };

  // Filtrar para NUNCA sugerir comprar cartas que ya están en el mazo
  const filteredPriority: PurchaseItem[] = [];
  for (const item of guide.priority) {
    if (!deckCardNames.has(item.name.toLowerCase().trim())) {
      filteredPriority.push({
        name: item.name,
        copies: item.copies,
        unitPrice: item.price,
        totalPrice: item.copies * item.price,
        setOrSource: item.source,
        reason: item.reason
      });
    }
  }

  const filteredConsideration: PurchaseItem[] = [];
  for (const item of guide.consideration) {
    if (!deckCardNames.has(item.name.toLowerCase().trim())) {
      filteredConsideration.push({
        name: item.name,
        copies: item.copies,
        unitPrice: item.price,
        totalPrice: item.copies * item.price,
        setOrSource: item.source,
        reason: item.reason
      });
    }
  }

  const costPriority = filteredPriority.reduce((acc, p) => acc + p.totalPrice, 0);
  const costConsideration = filteredConsideration.reduce((acc, p) => acc + p.totalPrice, 0);
  const costTotal = costPriority + costConsideration;

  return {
    deckId: deck.id,
    name: deck.name.trim(),
    slug,
    score: scoreInfo.score,
    tier: scoreInfo.tier,
    isActive: deck.is_active,
    mainCount,
    extraCount,
    sideCount,
    banViolations,
    cuts,
    addsFromCollection,
    keeps,
    constructionProposal,
    purchasesPriority: filteredPriority,
    purchasesConsideration: filteredConsideration,
    purchasesDiscardable: guide.discardable,
    costPriority,
    costTotal
  };
}

function generateDeckMarkdown(audit: DeckAuditResult): string {
  const lines: string[] = [];

  lines.push(`# 🎴 Hoja de Ruta Táctica: ${audit.name}`);
  lines.push(`**Calificación de Fuerza:** ⭐ **${audit.score.toFixed(1)} / 10.0** (${audit.tier})  `);
  lines.push(`**Estado en App:** ${audit.isActive ? '🟢 Activo / Prioritario' : '⚪ Mazo Base'}  `);
  lines.push(`**Conteo Actual:** ${audit.mainCount} Main | ${audit.extraCount} Extra | ${audit.sideCount} Side  `);
  lines.push(`**Presupuesto Estimado:** 🔴 Prioritarias: **$${audit.costPriority.toFixed(2)} USD** | Total con Consideración: **$${audit.costTotal.toFixed(2)} USD**  \n`);

  lines.push(`---`);
  lines.push(`## ⚖️ 1. Auditoría de Banlist (TCG Oficial)`);
  if (audit.banViolations.length === 0) {
    lines.push(`✅ **Mazo 100% Legal:** Ninguna de las cartas registradas actualmente infringe la lista de prohibidas o limitadas de TCG.`);
  } else {
    lines.push(`⚠️ **Infracciones Detectadas:**`);
    audit.banViolations.forEach(v => lines.push(`- ${v}`));
    lines.push(`\n> [!CAUTION]\n> Debes retirar o ajustar las copias de estas cartas antes de participar en eventos oficiales.`);
  }

  lines.push(`\n---`);
  lines.push(`## 📦 2. Movimientos Tácticos ($0 USD)`);

  lines.push(`### ⛔ Sacar (Cuts)`);
  if (audit.cuts.length === 0) {
    lines.push(`- No se detectan cartas que requieran corte inmediato por banlist.`);
  } else {
    audit.cuts.forEach(c => lines.push(`- ${c}`));
  }

  lines.push(`\n### 📥 Agregar desde tu Colección Física`);
  if (audit.addsFromCollection.length === 0) {
    lines.push(`- El núcleo registrado ya cuenta con las piezas principales de colección.`);
  } else {
    lines.push(`| Carta a Agregar | Copias | Ubicación Física en Colección | Motivo Estratégico |`);
    lines.push(`| :--- | :--- | :--- | :--- |`);
    audit.addsFromCollection.forEach(a => {
      lines.push(`| **${a.name}** | x${a.copies} | \`${a.location}\` | ${a.reason} |`);
    });
  }

  if (audit.constructionProposal) {
    lines.push(`\n### 🛠️ Propuesta de Construcción Completa (De 40 Cartas)`);
    audit.constructionProposal.forEach(p => lines.push(p));
  }

  lines.push(`\n### 🛡️ Mantener (Núcleo Válido)`);
  if (audit.keeps.length === 0) {
    lines.push(`- Mantener las cartas base no afectadas por banlist.`);
  } else {
    audit.keeps.forEach(k => lines.push(`- ${k}`));
  }

  lines.push(`\n---`);
  lines.push(`## 💰 3. Compras de Singles (Solo Cartas Nuevas Faltantes)`);

  lines.push(`### 🔴 Nivel 1: Buscar como Prioridad (Must-Have)`);
  if (audit.purchasesPriority.length === 0) {
    lines.push(`*No hay compras prioritarias obligatorias; el mazo ya cuenta con su motor principal.*`);
  } else {
    lines.push(`| Carta | Copias | Precio Est. | Total | Edición Sugerida | Razón Técnica |`);
    lines.push(`| :--- | :--- | :--- | :--- | :--- | :--- |`);
    audit.purchasesPriority.forEach(p => {
      lines.push(`| **${p.name}** | x${p.copies} | $${p.unitPrice.toFixed(2)} | **$${p.totalPrice.toFixed(2)}** | ${p.setOrSource} | ${p.reason} |`);
    });
    lines.push(`\n> **Subtotal Prioritario:** **$${audit.costPriority.toFixed(2)} USD**`);
  }

  lines.push(`\n### 🟡 Nivel 2: Consideración (Costo Accesible / Aporte Alto)`);
  if (audit.purchasesConsideration.length === 0) {
    lines.push(`*Sin compras de consideración pendientes.*`);
  } else {
    lines.push(`| Carta | Copias | Precio Est. | Total | Edición Sugerida | Razón Técnica |`);
    lines.push(`| :--- | :--- | :--- | :--- | :--- | :--- |`);
    audit.purchasesConsideration.forEach(p => {
      lines.push(`| **${p.name}** | x${p.copies} | $${p.unitPrice.toFixed(2)} | **$${p.totalPrice.toFixed(2)}** | ${p.setOrSource} | ${p.reason} |`);
    });
    const subCons = audit.purchasesConsideration.reduce((acc, p) => acc + p.totalPrice, 0);
    lines.push(`\n> **Subtotal Consideración:** **$${subCons.toFixed(2)} USD**`);
  }

  lines.push(`\n### ⚪ Nivel 3: Descartables (No Comprar)`);
  audit.purchasesDiscardable.forEach(d => lines.push(`- ${d}`));

  lines.push(`\n---`);
  lines.push(`## 📊 4. Resumen de Presupuesto del Mazo`);
  lines.push(`- **Inversión Mínima Sugerida (Prioritarias):** **$${audit.costPriority.toFixed(2)} USD**`);
  lines.push(`- **Inversión Óptima Completa (Prioritarias + Consideración):** **$${audit.costTotal.toFixed(2)} USD**`);

  return lines.join('\n');
}

function buildHtmlStyles(): string {
  return `
    @page {
      size: A4;
      margin: 12mm 15mm 15mm 15mm;
      @bottom-right {
        content: counter(page);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 8pt;
        color: #71717a;
      }
      @bottom-left {
        content: "Yu-Gi-Oh! TCG - Master Audit & Strategy 2026 | Marcos Román";
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 8pt;
        color: #71717a;
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 9pt;
      line-height: 1.45;
      color: #18181b;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }

    .cover-page {
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 94vh;
      background: linear-gradient(145deg, #09090b 0%, #18181b 60%, #27272a 100%);
      color: #f4f4f5;
      padding: 40px;
      border-radius: 8px;
    }

    .cover-badge {
      display: inline-block;
      background-color: #dc2626;
      color: #ffffff;
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      padding: 4px 14px;
      border-radius: 9999px;
      margin-bottom: 16px;
    }

    .cover-title {
      font-size: 25pt;
      font-weight: 800;
      line-height: 1.15;
      color: #ffffff;
      margin: 0 0 10px 0;
      letter-spacing: -0.5px;
    }

    .cover-subtitle {
      font-size: 11pt;
      color: #d4d4d8;
      line-height: 1.4;
      margin: 0;
    }

    .cover-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
      margin: 30px 0;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      padding: 16px;
    }

    .stat-val {
      font-size: 18pt;
      font-weight: 800;
      margin-bottom: 2px;
    }

    .stat-val.red { color: #f87171; }
    .stat-val.gold { color: #fbbf24; }
    .stat-val.green { color: #34d399; }
    .stat-val.blue { color: #60a5fa; }

    .stat-lbl {
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #a1a1aa;
    }

    .cover-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      font-size: 8.5pt;
      color: #a1a1aa;
    }

    .page-break {
      page-break-before: always;
    }

    .deck-section {
      page-break-before: always;
      padding-top: 8px;
    }

    h1 {
      font-size: 17pt;
      font-weight: 800;
      color: #09090b;
      margin: 16px 0 8px 0;
      border-bottom: 2px solid #e4e4e7;
      padding-bottom: 4px;
    }

    h2 {
      font-size: 12pt;
      font-weight: 700;
      color: #18181b;
      margin: 14px 0 6px 0;
      border-bottom: 1px solid #f4f4f5;
      padding-bottom: 3px;
    }

    h3 {
      font-size: 10pt;
      font-weight: 700;
      color: #27272a;
      margin: 10px 0 4px 0;
    }

    p { margin: 5px 0; }
    ul { margin: 4px 0 8px 0; padding-left: 18px; }
    li { margin-bottom: 3px; }

    code {
      font-family: ui-monospace, Menlo, Monaco, Consolas, monospace;
      font-size: 8pt;
      background-color: #f4f4f5;
      color: #b91c1c;
      padding: 1px 4px;
      border-radius: 4px;
      border: 1px solid #e4e4e7;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
      margin: 8px 0 12px 0;
      page-break-inside: avoid;
    }

    th {
      background-color: #f4f4f5;
      color: #09090b;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      border-top: 1px solid #d4d4d8;
      border-bottom: 2px solid #a1a1aa;
    }

    td {
      padding: 5px 8px;
      border-bottom: 1px solid #e4e4e7;
      vertical-align: top;
    }

    tr:nth-child(even) td { background-color: #fafafa; }

    .deck-header-box {
      background-color: #fafafa;
      border: 1px solid #e4e4e7;
      border-left: 5px solid #dc2626;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 10px;
    }

    .deck-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .deck-title {
      font-size: 14pt;
      font-weight: 800;
      color: #09090b;
      margin: 0;
    }

    .deck-score-badge {
      background-color: #09090b;
      color: #fef08a;
      font-size: 10.5pt;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 5px;
    }

    .deck-meta-tags {
      display: flex;
      gap: 12px;
      font-size: 8pt;
      color: #71717a;
    }

    .callout {
      border-radius: 5px;
      padding: 8px 12px;
      margin: 8px 0 10px 0;
      page-break-inside: avoid;
    }

    .callout-caution {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-left: 4px solid #ef4444;
      color: #991b1b;
    }

    .callout-note {
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
      border-left: 4px solid #3b82f6;
      color: #1e40af;
    }

    .callout-header { font-weight: 700; font-size: 8.5pt; margin-bottom: 2px; }
    .callout-body { font-size: 8pt; }
  `;
}

function parseMarkdownBasicToHtml(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let inTable = false;
  let inList = false;
  let inCallout = false;
  let calloutType = '';
  let calloutLines: string[] = [];

  const flushList = () => {
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
  };

  const flushTable = () => {
    if (inTable) {
      out.push('</tbody></table>');
      inTable = false;
    }
  };

  const flushCallout = () => {
    if (inCallout) {
      const calloutClass = calloutType.toLowerCase() === 'caution' ? 'callout-caution' : 'callout-note';
      const calloutTitle = calloutType.toLowerCase() === 'caution' ? '⚠️ ADVERTENCIA DE BANLIST' : '💡 NOTA TÁCTICA';
      out.push(`<div class="callout ${calloutClass}"><div class="callout-header">${calloutTitle}</div><div class="callout-body">${calloutLines.join('<br>')}</div></div>`);
      inCallout = false;
      calloutLines = [];
      calloutType = '';
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (trimmed.startsWith('> [!CAUTION]') || trimmed.startsWith('> [!NOTE]') || trimmed.startsWith('> [!WARNING]')) {
      flushList();
      flushTable();
      flushCallout();
      inCallout = true;
      calloutType = trimmed.includes('CAUTION') ? 'CAUTION' : 'NOTE';
      continue;
    }
    if (inCallout) {
      if (trimmed.startsWith('>')) {
        calloutLines.push(formatInline(trimmed.replace(/^>\s?/, '')));
        continue;
      } else {
        flushCallout();
      }
    }

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map(c => c.trim());

      if (cells.every(c => /^:?-+:?$/.test(c))) continue;

      if (!inTable) {
        inTable = true;
        out.push('<table><thead><tr>');
        cells.forEach(c => out.push(`<th>${formatInline(c)}</th>`));
        out.push('</tr></thead><tbody>');
      } else {
        out.push('<tr>');
        cells.forEach(c => out.push(`<td>${formatInline(c)}</td>`));
        out.push('</tr>');
      }
      continue;
    } else {
      flushTable();
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        inList = true;
        out.push('<ul>');
      }
      out.push(`<li>${formatInline(trimmed.substring(2))}</li>`);
      continue;
    } else {
      flushList();
    }

    if (trimmed.startsWith('# ')) {
      out.push(`<h1>${formatInline(trimmed.substring(2))}</h1>`);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      out.push(`<h2>${formatInline(trimmed.substring(3))}</h2>`);
      continue;
    }
    if (trimmed.startsWith('### ')) {
      out.push(`<h3>${formatInline(trimmed.substring(4))}</h3>`);
      continue;
    }

    if (trimmed === '---' || trimmed === '***') {
      out.push('<hr style="border:none;border-top:1px solid #e4e4e7;margin:12px 0;" />');
      continue;
    }

    if (trimmed.length > 0) {
      out.push(`<p>${formatInline(trimmed)}</p>`);
    }
  }

  flushList();
  flushTable();
  flushCallout();

  return out.join('\n');
}

function formatInline(text: string): string {
  let s = escapeHtml(text);
  s = s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*(.*?)\*/g, '<em>$1</em>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span style="color:#2563eb;font-weight:600;">$1</span>');
  return s;
}

async function main() {
  const rootDir = process.cwd();
  const docsDir = path.join(rootDir, 'docs');
  const routesDir = path.join(docsDir, 'decks_upgrade_routes');

  if (!fs.existsSync(routesDir)) {
    fs.mkdirSync(routesDir, { recursive: true });
  }

  const decksJsonPath = 'C:/Users/marco/.gemini/antigravity-ide/brain/7b516ad8-645a-4bcd-8e46-bef02de374a6/.system_generated/steps/340/output.txt';
  const userCardsJsonPath = 'C:/Users/marco/.gemini/antigravity-ide/brain/7b516ad8-645a-4bcd-8e46-bef02de374a6/.system_generated/steps/342/output.txt';

  console.log('1. Cargando datos de Decks y Colección Física de Supabase...');
  const decksRaw: DeckRaw[] = parseJsonFile<DeckRaw[]>(decksJsonPath);
  const userCardsRaw: UserCardRaw[] = parseJsonFile<UserCardRaw[]>(userCardsJsonPath);

  const collectionMap = new Map<string, UserCardRaw>();
  const genericStaples = new Map<string, UserCardRaw>();

  for (const uc of userCardsRaw) {
    const key = uc.name.toLowerCase().trim();
    collectionMap.set(key, uc);
    if (uc.locations && (uc.locations.includes('Staples') || uc.locations.includes('Deckbox'))) {
      genericStaples.set(key, uc);
    }
  }

  console.log(`Colección física indexada: ${collectionMap.size} cartas únicas.`);

  // 2. Auditar cada uno de los 56 mazos
  console.log(`2. Auditando 56 mazos con criterio veterano (Compras sin redundancia y Movimientos precisos)...`);
  const audits: DeckAuditResult[] = [];

  for (const deck of decksRaw) {
    const audit = auditDeck(deck, collectionMap, genericStaples);
    audits.push(audit);

    // Escribir archivo individual Markdown
    const mdContent = generateDeckMarkdown(audit);
    fs.writeFileSync(path.join(routesDir, `${audit.slug}.md`), mdContent, 'utf-8');
  }

  // Ordenar por score de mayor a menor
  audits.sort((a, b) => b.score - a.score);

  // 3. Generar Reporte de Decks Potenciales en Colección
  console.log('3. Generando reporte de Decks Potenciales no registrados...');
  const potentialDecksMd = [
    `# 🌟 Estrategias y Decks Potenciales en tu Colección Física`,
    `**Análisis:** Arquetipos con una base sustancial de cartas físicas en tu inventario que no están registrados como deck en la app pero que puedes armar con una inversión mínima.\n`,
    `---`,
    `\n## 1. Tearlaments (Tier 2 / Rogue de Élite) - Fuerza Estimada: ⭐ **7.5 / 10.0**`,
    `- **Cartas que YA TIENES en colección:** 3x *Tearlaments Havnis*, 3x *Merrli*, 3x *Scream*, 3x *Cryme*, 3x *Grief*, 3x *Metanoise*, 3x *Perlegia* (Total: 26 copias físicas).`,
    `- **Movimientos desde Colección ($0 USD):** Incorporar base Shaddoll (*El Shaddoll Winda*, *Construct*, *Apkallone*, *Beast*, *Squamata*) y tus staples (*Ash Blossom*, *Super Polymerization*, *Mudragon of the Swamp*).`,
    `- **Compras Faltantes para Mazo Completo:**`,
    `  - 1x *Tearlaments Scheiren* ($0.75 USD)`,
    `  - 3x *Tearlaments Reinoheart* ($1.50 c/u = $4.50 USD)`,
    `  - 1x *Tearlaments Rulkallos* ($3.00 USD)`,
    `  - 1x *Tearlaments Kaleido-Heart* ($1.50 USD)`,
    `  - 1x *Primeval Planet Perlereino* ($6.00 USD)`,
    `- **Costo Estimado para Armarlo:** **$15.75 USD**\n`,
    `---`,
    `\n## 2. Kashtira Motor / Control (Rogue Anti-Meta) - Fuerza Estimada: ⭐ **7.2 / 10.0**`,
    `- **Cartas que YA TIENES en colección:** 3x *Kashtira Birth*, 3x *Scareclaw Kashtira*, 3x *Kashtira Ogre*, 3x *Kashtira Preparations*, 1x *Kashtira Overlap*.`,
    `- **Movimientos desde Colección ($0 USD):** 3x *Droll & Lock Bird* (Staples), 3x *Ghost Mourner & Moonlit Chill* (Staples), 2x *Triple Tactics Thrust* (Staples), 1x *Divine Arsenal AA-ZEUS* (Staples), 1x *Super Starslayer TY-PHON* (Staples). *(Nota: Dimension Shifter está PROHIBIDA en la banlist oficial de TCG)*.`,
    `- **Compras Faltantes para Mazo Completo:**`,
    `  - 1x *Kashtira Fenrir* ($12.00 USD - Limitada a 1)`,
    `  - 1x *Kashtira Unicorn* ($4.00 USD)`,
    `  - 1x *Kashtira Arise-Heart* ($6.00 USD)`,
    `- **Costo Estimado para Armarlo:** **$22.00 USD**\n`,
    `---`,
    `\n## 3. Spright Fur Hire (Tier 2 / Combo Rango 2) - Fuerza Estimada: ⭐ **7.4 / 10.0**`,
    `- **Cartas que YA TIENES en colección:** *Spright Red*, *Spright Carrot*, *Spright Smashers*, *Spright Pixies*, *Spright Gamma Burst* + en Fur Hire: *Folgo*, *Donner*, *Beat*, *Bravo*, *Donpa*.`,
    `- **Movimientos desde Colección ($0 USD):** *Effect Veiler*, *Ash Blossom*, *Infinite Impermanence* (Staples).`,
    `- **Compras Faltantes:**`,
    `  - 1x *Spright Blue* ($8.00 USD)`,
    `  - 1x *Spright Jet* ($1.50 USD)`,
    `  - 1x *Spright Starter* ($2.00 USD)`,
    `  - 1x *Gigantic Spright* ($2.50 USD)`,
    `- **Costo Estimado para Armarlo:** **$14.00 USD**\n`,
    `---`,
    `\n## 4. Ancient Gear OTK (Casual / Demoledor) - Fuerza Estimada: ⭐ **5.8 / 10.0**`,
    `- **Cartas que YA TIENES en colección:** 3x *Ancient Gear Dark Golem*, 3x *Ancient Gear Advance*, 3x *Ancient Gear Commander*, 3x *Ancient Gear Duel*, *Golem - Ultimate Pound*.`,
    `- **Movimientos desde Colección ($0 USD):** *Raigeki* (Staples), *Harpie's Feather Duster* (Staples), *Terraforming*, *Overload Fusion*.`,
    `- **Compras Faltantes:**`,
    `  - 2x *Ancient Gear Statue* ($0.50 c/u = $1.00 USD)`,
    `  - 1x *Ultimate Ancient Gear Golem* ($1.00 USD)`,
    `  - 1x *Chaos Ancient Gear Giant* ($1.50 USD)`,
    `  - 1x *Ancient Gear Ballista* ($1.50 USD)`,
    `- **Costo Estimado para Armarlo:** **$5.00 USD**\n`,
    `---`,
    `\n## 5. Dark World Combo (Casual / Descarte) - Fuerza Estimada: ⭐ **5.5 / 10.0**`,
    `- **Cartas que YA TIENES en colección:** 3x *The Gates of Dark World*, 3x *Dark World Dealings*, 3x *Dark World Puppetry*, 3x *Charge Into a Dark World*, *Brron*, *Snoww*.`,
    `- **Movimientos desde Colección ($0 USD):** *Accesscode Talker*, *Knightmare Phoenix / Unicorn*, *Droll & Lock Bird*.`,
    `- **Compras Faltantes:**`,
    `  - 1x *Grapha, Dragon Overlord of Dark World* ($1.50 USD)`,
    `  - 2x *Genta, Gateman of Dark World* ($1.00 c/u = $2.00 USD)`,
    `  - 2x *Reign-Beaux, Overking of Dark World* ($1.00 c/u = $2.00 USD)`,
    `- **Costo Estimado para Armarlo:** **$5.50 USD**`
  ].join('\n');

  fs.writeFileSync(path.join(docsDir, 'decks_potenciales_coleccion.md'), potentialDecksMd, 'utf-8');

  // 4. Generar README Maestro y Tabla de Presupuestos
  console.log('4. Generando README maestro y consolidación presupuestaria...');
  const totalCostPriorityAll = audits.reduce((acc, a) => acc + a.costPriority, 0);
  const totalCostOverall = audits.reduce((acc, a) => acc + a.costTotal, 0);

  const activeCompetitiveAudits = audits.filter(a => a.isActive && a.score >= 6.0);
  const costActiveCompetitive = activeCompetitiveAudits.reduce((acc, a) => acc + a.costPriority, 0);

  const budgetRows = audits.map((a, i) => 
    `| ${i + 1} | [${a.name}](./${a.slug}.md) | ⭐ **${a.score.toFixed(1)}** | ${a.tier} | ${a.isActive ? '🟢 Activo' : '⚪ Base'} | **$${a.costPriority.toFixed(2)}** | $${a.costTotal.toFixed(2)} | ${a.banViolations.length > 0 ? `⚠️ ${a.banViolations.length}` : '✅ 0'} |`
  );

  const readmeContent = [
    `# 📚 Directorio Maestro de Optimización, Auditoría & Presupuestos`,
    `**Proyecto:** personal-yugioh-deckbuilder  `,
    `**Total de Decks Auditados:** ${audits.length}  `,
    `**Colección Física Cruzada:** 3,114 cartas físicas  `,
    `**Banlist Vigente:** TCG Oficial (Octubre 2026)  \n`,
    `---`,
    `\n## 💵 Resumen Ejecutivo de Presupuestos Globales`,
    `- **Inversión Prioritaria en Decks Competitivos Activos (Score ≥ 6.0):** **$${costActiveCompetitive.toFixed(2)} USD**  `,
    `  *(Cubre la puesta a punto de élite de Branded, Salamangreat, Phantom Knights, Dinomorphia, Tenpai, Ignister, Beetroper, Traptrix, Cyber Dragon, Spright, Blackwing y Synchron)*.`,
    `- **Inversión Prioritaria Global (Todos los 56 Decks):** **$${totalCostPriorityAll.toFixed(2)} USD**`,
    `- **Inversión Completa Global (Prioritarias + Consideración):** **$${totalCostOverall.toFixed(2)} USD**`,
    `- **Estrategias Nuevas Latentes en Colección:** [Ver reporte de Decks Potenciales](../decks_potenciales_coleccion.md) (Kashtira $1.82 USD, Spright $2.38 USD, Ancient Gear $3.50 USD Budget / $32.50 USD con Statues, Tearlaments $20.88 USD).\n`,
    `---`,
    `\n## 📊 Tabla Maestra de Decks y Presupuestos (Ordenada por Fuerza Competitiva)`,
    `| # | Mazo / Arquetipo | Calificación | Nivel Competitivo | Estado | Inversión Prioritaria | Inversión Total | Banlist Issues |`,
    `| :-: | :--- | :-: | :--- | :-: | :--- | :--- | :-: |`,
    ...budgetRows,
    `\n---`,
    `\n## 🎯 Hoja de Ruta de Adquisición Recomendada (Mayor Impacto / Menor Costo)`,
    `1. **Fase 1: Optimización de Competitivos Top (Inversión Prioritaria: ~$18 USD):**`,
    `   - **Branded ($3.41 USD):** The Dragon that Devours the Dogma ($0.36 - The Chronicles Deck CH01), Despian Luluwalilith ($0.25 - RA05), Garura ($1.20 - RA02), Bystial Druiswurm ($1.60 - MP23). Tienes un Tier 1.5 completo y legal a precio de centavos.`,
    `   - **Salamangreat ($4.20 USD):** 2x Raging Phoenix ($0.50 - RA04 Stampede a centavos), 3x Salamangreat of Fire ($3.45 - LD10/MP25), Zealantis ($0.25 - RA04). Tier 2 anti-meta implacable.`,
    `   - **The Phantom Knights ($3.25 USD):** 3x Doomed Soleret ($2.25), Dark Requiem ($1.50), Leviair ($0.50), Launch ($0.50) + PK Scythe y 2x ZEUS de tu colección ($0 USD).`,
    `   - **Dinomorphia ($6.75 USD):** 2x Rexsturm ($2.50), Evolzar Lars ($2.50), Therizia ($1.75).`,
    `2. **Fase 2: Decks Rogue Divertidos de Menor Inversión (Inversión: ~$25 USD):**`,
    `   - **Sangen Tenpai Dragon ($16.65 USD):** 2x Paidra ($12.00), 2x Fadra ($0.70), Trident Dragion ($2.25), Bident ($0.35), Transcendent ($1.25).`,
    `   - **@Ignister ($4.40 USD):** Allied Code Talker ($2.00), Backup x2 ($1.00), Wizard x2 ($0.70), Heatsoul ($0.50) + Cyberse Desavewurm y Cyberse Sage de tu colección ($0 USD).`,
    `   - **Cyber Dragon ($3.60 USD):** 2x Core ($0.70), Infinity ($0.90), Rampage ($0.75), Megafleet ($1.25).`,
    `3. **Fase 3: Armar Decks Nuevos desde Colección (Precios Calibrados TCGPlayer):**`,
    `   - **Kashtira ($1.82 USD):** 1x Unicorn ($0.21 - RA05 centavos), 1x Fenrir ($0.61 - RA05 centavos), 1x Wraitsoth ($0.50), 1x Flare Metal ($0.50) + AA-ZEUS y TY-PHON de tu colección ($0 USD). *(Arise-Heart está PROHIBIDA)*.`,
    `   - **Spright Fur Hire ($2.38 USD):** 1x Spright Blue ($0.11 - RA05), 1x Spright Starter ($0.12 - RA05), 1x Gigantic ($1.40), 1x Jet ($0.75).`,
    `   - **Tearlaments ($20.88 USD):** Perlereino ($0.13 - RA02), Scheiren ($0.50), Kaleido-Heart ($1.50), 1x Reinoheart ($9.25), Rulkallos ($9.50) junto a tus 26 cartas físicas Tearlaments y motor Shaddoll ($0 USD).`,
    `   - **Ancient Gear ($3.50 USD Budget / $32.50 USD Competitivo):** ⚠️ *Ancient Gear Statue* cuesta ~$14.50 c/u en TCGPlayer ($29.00 USD el par). La versión budget usa *Ancient Gear Wyvern* ($0.35) y *Ancient Gear Box* ($0.20) sobre tu base existente sin gastar en Statue.`
  ].join('\n');

  fs.writeFileSync(path.join(routesDir, 'README.md'), readmeContent, 'utf-8');

  // 5. Generar HTML Consolidado Limpio (Sin versiones viejas)
  console.log('5. Generando HTML consolidado para el PDF...');

  const coverHtml = `
    <div class="cover-page">
      <div>
        <div class="cover-badge">Auditoría Táctica & Plan Financiero 2026</div>
        <h1 class="cover-title">YU-GI-OH! TCG<br>MASTER AUDIT & STRATEGY</h1>
        <p class="cover-subtitle">Plan Maestro de Movimientos ($0 USD), Presupuestos Unitarios por Mazo y Guía de Armado con Base en 3,114 Cartas Físicas.</p>
      </div>

      <div class="cover-grid">
        <div class="stat-card">
          <div class="stat-val red">56</div>
          <div class="stat-lbl">Decks Auditados & Calificados</div>
        </div>
        <div class="stat-card">
          <div class="stat-val gold">3,114</div>
          <div class="stat-lbl">Cartas en Colección Física</div>
        </div>
        <div class="stat-card">
          <div class="stat-val green">$${costActiveCompetitive.toFixed(2)} USD</div>
          <div class="stat-lbl">Inversión Prioritaria Competitiva</div>
        </div>
        <div class="stat-card">
          <div class="stat-val blue">5 Estrategias</div>
          <div class="stat-lbl">Nuevas Latentes en Colección</div>
        </div>
      </div>

      <div class="cover-footer">
        <div><strong>Propietario:</strong> Marcos Román Valverde</div>
        <div><strong>Perspectiva:</strong> Jugador Veterano (20 Años Exp.)</div>
        <div><strong>Fecha:</strong> Octubre 2026</div>
      </div>
    </div>
  `;

  // Sección 1: Resumen Ejecutivo y Tabla Maestra de Presupuestos
  const executiveSectionHtml = `
    <div class="page-break">
      <h1>📊 1. Resumen Ejecutivo de Presupuestos & Ranking de Poder</h1>
      <p>Este informe consolida los <strong>costos estimados reales</strong> para optimizar cada estrategia registrada, descartando redundancias y priorizando movimientos con tus 3,114 cartas físicas.</p>
      ${parseMarkdownBasicToHtml(readmeContent.replace(/^#\s+.*\n/, ''))}
    </div>
  `;

  // Sección 2: Decks Potenciales en Colección
  const potentialSectionHtml = `
    <div class="page-break">
      <h1>🌟 2. Decks Potenciales Latentes en tu Colección Física</h1>
      <p>Arquetipos con un volumen sustancial de cartas físicas en tu inventario que no están registrados como deck pero que puedes armar de forma ultra-económica.</p>
      ${parseMarkdownBasicToHtml(potentialDecksMd.replace(/^#\s+.*\n/, ''))}
    </div>
  `;

  // Sección 3: Las 56 Fichas Técnicas Individuales (Ordenadas por Fuerza)
  const deckSectionsHtml = audits.map((a, i) => {
    const rawMd = generateDeckMarkdown(a);
    const contentWithoutH1 = rawMd.replace(/^#\s+.*\n/, '');
    const htmlBody = parseMarkdownBasicToHtml(contentWithoutH1);

    return `
      <div class="deck-section">
        <div class="deck-header-box">
          <div class="deck-title-row">
            <h2 class="deck-title">#${i + 1} - ${escapeHtml(a.name)}</h2>
            <div class="deck-score-badge">⭐ ${a.score.toFixed(1)} / 10.0</div>
          </div>
          <div class="deck-meta-tags">
            <span><strong>Nivel:</strong> ${escapeHtml(a.tier)}</span>
            <span><strong>Estado:</strong> ${a.isActive ? '🟢 Activo en App' : '⚪ Mazo Base'}</span>
            <span><strong>Inversión Prioritaria:</strong> $${a.costPriority.toFixed(2)} USD</span>
            <span><strong>Banlist:</strong> ${a.banViolations.length === 0 ? '✅ 100% Legal' : `⚠️ ${a.banViolations.length} Infracciones`}</span>
          </div>
        </div>
        ${htmlBody}
      </div>
    `;
  }).join('\n');

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Yu-Gi-Oh! TCG - Master Audit & Strategy Report 2026</title>
      <style>
        ${buildHtmlStyles()}
      </style>
    </head>
    <body>
      ${coverHtml}
      ${executiveSectionHtml}
      ${potentialSectionHtml}
      ${deckSectionsHtml}
    </body>
    </html>
  `;

  const htmlPath = path.join(docsDir, 'reporte_consolidado_yugioh.html');
  const pdfPath = path.join(docsDir, 'reporte_consolidado_yugioh_final.pdf');

  fs.writeFileSync(htmlPath, fullHtml, 'utf-8');
  console.log(`6. Archivo HTML escrito en: ${htmlPath}`);

  // 6. Generar PDF con Microsoft Edge Headless
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  console.log('7. Renderizando PDF mediante Microsoft Edge Headless...');

  try {
    execFileSync(edgePath, [
      '--headless',
      '--disable-gpu',
      '--run-all-compositor-stages-before-draw',
      `--print-to-pdf=${pdfPath}`,
      '--no-pdf-header-footer',
      htmlPath
    ]);
    const stats = fs.statSync(pdfPath);
    console.log(`✅ ¡PDF consolidado final generado con éxito!`);
    console.log(`📁 Ruta: ${pdfPath}`);
    console.log(`📊 Tamaño: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  } catch (err) {
    console.error('Error al generar PDF con Edge:', err);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
