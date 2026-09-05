import DeckBuilder from '@/components/deckbuilder/DeckBuilder';

export const metadata = {
  title: 'Yu-Gi-Oh! Deckbuilder Dinámico',
  description: 'Construye y optimiza tus barajas de Master Duel, TCG y Duel Links con sugerencias de ratios en tiempo real y sustitución inteligente de cartas.',
};

export default function Home() {
  return (
    <main className="min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden bg-[hsl(224,25%,6%)]">
      <DeckBuilder />
    </main>
  );
}
