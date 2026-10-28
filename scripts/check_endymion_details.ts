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

const userCardsJsonPath = 'C:/Users/marco/.gemini/antigravity-ide/brain/7b516ad8-645a-4bcd-8e46-bef02de374a6/.system_generated/steps/342/output.txt';
const userCards: UserCardRaw[] = parseJsonFile<UserCardRaw[]>(userCardsJsonPath);

console.log('=== BÚSQUEDA PROFUNDA: ENDYMION, MYTHICAL BEAST & SPELL COUNTERS ===');

const matches = userCards.filter(c => {
  const n = c.name.toLowerCase();
  const a = (c.archetype || '').toLowerCase();
  return (
    n.includes('endymion') ||
    n.includes('mythical beast') ||
    a.includes('endymion') ||
    a.includes('mythical beast') ||
    n === 'servant of endymion' ||
    n === 'magister of endymion' ||
    n === 'reflection of endymion' ||
    n.includes('spell power mastery') ||
    n.includes('spell power grasp') ||
    n.includes('citadel of endymion') ||
    n.includes('selene, queen of the master magicians') ||
    n.includes('magical abductor') ||
    n.includes('crowley, the first grimoire') ||
    n.includes('crowley, the magistus') ||
    n.includes('spellbook of secrets') ||
    n.includes('spellbook of knowledge')
  );
});

console.log(`Coincidencias encontradas: ${matches.length}`);
for (const m of matches) {
  console.log(`- ${m.name} | Cantidad: ${m.total_qty} | Tipo: ${m.type} | Arquetipo: ${m.archetype || 'N/A'} | Ubicación: ${m.locations || 'Colección General'}`);
}
