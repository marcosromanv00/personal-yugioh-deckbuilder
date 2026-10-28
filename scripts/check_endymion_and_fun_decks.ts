import * as fs from 'fs';

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

interface DeckRaw {
  id: string;
  name: string;
  is_active: boolean;
  total_cards_count: number;
  cards: { name: string; count: number }[];
}

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

const decksJsonPath = 'C:/Users/marco/.gemini/antigravity-ide/brain/7b516ad8-645a-4bcd-8e46-bef02de374a6/.system_generated/steps/340/output.txt';
const userCardsJsonPath = 'C:/Users/marco/.gemini/antigravity-ide/brain/7b516ad8-645a-4bcd-8e46-bef02de374a6/.system_generated/steps/342/output.txt';

const decks: DeckRaw[] = parseJsonFile<DeckRaw[]>(decksJsonPath);
const userCards: UserCardRaw[] = parseJsonFile<UserCardRaw[]>(userCardsJsonPath);

console.log('=====================================================');
console.log('1. REVISIÓN EXHAUSTIVA DE ENDYMION / SPELL COUNTERS');
console.log('=====================================================');

const endymionCards = userCards.filter(c => {
  const n = c.name.toLowerCase();
  const a = (c.archetype || '').toLowerCase();
  return (
    n.includes('endymion') ||
    n.includes('mythical beast') ||
    n.includes('spell power') ||
    n.includes('spellbook') ||
    n.includes('selene') ||
    a.includes('endymion') ||
    a.includes('mythical beast') ||
    a.includes('spellbook') ||
    n.includes('servant of endymion') ||
    n.includes('magister of endymion') ||
    n.includes('reflection of endymion') ||
    n.includes('citadel of endymion') ||
    n.includes('abductor') ||
    n.includes('jackal')
  );
});

console.log(`Cartas encontradas en colección: ${endymionCards.length} referencias`);
let totalEndymionCopies = 0;
for (const c of endymionCards) {
  totalEndymionCopies += c.total_qty;
  console.log(`- ${c.name} (x${c.total_qty}) [${c.type}] [Ubicación: ${c.locations || 'Colección General'}]`);
}
console.log(`Total copias físicas: ${totalEndymionCopies}`);

console.log('\n=====================================================');
console.log('2. TOP ARQUETIPOS NO REGISTRADOS EN COLECCIÓN (>= 8 COPIAS)');
console.log('=====================================================');

const archetypeMap: Record<string, { totalQty: number; uniqueCards: number; cards: { name: string; qty: number }[] }> = {};

for (const c of userCards) {
  if (!c.archetype) continue;
  const arch = c.archetype.trim();
  if (!archetypeMap[arch]) {
    archetypeMap[arch] = { totalQty: 0, uniqueCards: 0, cards: [] };
  }
  archetypeMap[arch].totalQty += c.total_qty;
  archetypeMap[arch].uniqueCards += 1;
  archetypeMap[arch].cards.push({ name: c.name, qty: c.total_qty });
}

const registeredKeywords = [
  'branded', 'despia', 'phantom', 'adventure', 'salamangreat', 'dinomorphia',
  'chaos', 'horus', 'lightsworn', 'sangen', 'tenpai', 'ignister', 'beetroper',
  'insect', 'reptile', 'ragnaraika', 'cyber dragon', 'traptrix', 'tri-brigade',
  'spright', 'blackwing', 'superheavy samurai', 'synchron', 'marincess', 'ghoti',
  'shark', 'fluffal', 'earth machine', 'fire king', 'snake-eye', 'kaiju',
  'predaplant', 'naturia', 'ancient warriors', 'dino', 'scrap', 'elemental hero',
  'hero', 'ninja', 'dinowrestler', 'gunkan', 'suship', 'magikey', 'libromancer',
  'nemleria', 'black rose', 'rose dragon', 'crystal beast', 'stardust',
  'amazoness', 'blue-eyes', 'red-eyes', 'metalfoes', 'vampire', 'mayakashi',
  'invoked', 'dogmatika', 'shaddoll', 'war rock', 'heroic', 'darklord',
  'performapal', 'dinomist', 'chronomaly', 'fossil', 'fabled', 'simorgh',
  'gusto', 'amaze', 'amazement', 'trap monster'
];

const unregisteredList: { arch: string; totalQty: number; uniqueCards: number; cards: { name: string; qty: number }[] }[] = [];

for (const [arch, data] of Object.entries(archetypeMap)) {
  const archLower = arch.toLowerCase();
  const isMatch = registeredKeywords.some(kw => archLower.includes(kw) || kw.includes(archLower));
  if (!isMatch && data.totalQty >= 8) {
    unregisteredList.push({ arch, ...data });
  }
}

unregisteredList.sort((a, b) => b.totalQty - a.totalQty);

for (const u of unregisteredList) {
  console.log(`\n📦 Arquetipo: ${u.arch} | Total: ${u.totalQty} copias (${u.uniqueCards} cartas)`);
  console.log(`   Detalle: ${u.cards.map(c => `${c.name} (x${c.qty})`).join(', ')}`);
}
