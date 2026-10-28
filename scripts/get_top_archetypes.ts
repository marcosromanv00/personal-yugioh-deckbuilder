import * as fs from 'fs';

interface UserCardRaw {
  card_id: number;
  name: string;
  type: string;
  archetype: string | null;
  total_qty: number;
  locations: string | null;
}

interface DeckRaw {
  id: string;
  name: string;
  is_active: boolean;
  total_cards_count: number;
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
const cards: UserCardRaw[] = parseJsonFile<UserCardRaw[]>(userCardsJsonPath);

const registeredNames = decks.map(d => d.name.toLowerCase());

const archMap: Record<string, { qty: number; distinct: number; cards: { name: string; qty: number; loc: string }[] }> = {};
for (const c of cards) {
  if (!c.archetype) continue;
  const a = c.archetype.trim();
  if (!archMap[a]) archMap[a] = { qty: 0, distinct: 0, cards: [] };
  archMap[a].qty += c.total_qty;
  archMap[a].distinct++;
  archMap[a].cards.push({ name: c.name, qty: c.total_qty, loc: c.locations || 'Colección' });
}

const sorted = Object.entries(archMap).sort((a, b) => b[1].qty - a[1].qty);

console.log('=== TOP ARQUETIPOS EN COLECCIÓN (CANTIDAD TOTAL DE CARTAS) ===');
for (const [name, data] of sorted) {
  // Comprobar si hay deck registrado
  const isRegistered = registeredNames.some(dn => dn.includes(name.toLowerCase()) || name.toLowerCase().includes(dn));
  if (!isRegistered && data.qty >= 16) {
    console.log(`\n🔥 ${name.toUpperCase()} (NO REGISTRADO): ${data.qty} copias (${data.distinct} cartas diferentes)`);
    data.cards.forEach(c => console.log(`   - ${c.name} (x${c.qty}) [${c.loc}]`));
  }
}
