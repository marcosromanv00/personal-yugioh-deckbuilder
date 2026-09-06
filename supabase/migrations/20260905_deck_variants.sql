-- Migración: Sistema de Variantes de Decks
-- Prefijo yg_* conforme a las reglas multi-tenancy del proyecto

CREATE TABLE IF NOT EXISTS yg_deck_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID NOT NULL REFERENCES yg_decks(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT chk_variant_name_not_empty CHECK (char_length(trim(name)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_yg_deck_variants_deck_id ON yg_deck_variants (deck_id);
CREATE INDEX IF NOT EXISTS idx_yg_deck_variants_active ON yg_deck_variants (deck_id, is_active);

ALTER TABLE yg_deck_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access deck variants" ON yg_deck_variants FOR ALL TO public USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS yg_deck_variant_cards (
    variant_id UUID NOT NULL REFERENCES yg_deck_variants(id) ON DELETE CASCADE,
    card_id INTEGER NOT NULL REFERENCES yg_cards(id) ON DELETE CASCADE,
    count INTEGER NOT NULL CONSTRAINT chk_variant_card_count CHECK (count >= 1 AND count <= 3),
    proxy_count INTEGER DEFAULT 0 CONSTRAINT chk_variant_proxy_count CHECK (proxy_count >= 0 AND proxy_count <= 3),
    section VARCHAR(50) NOT NULL CONSTRAINT chk_variant_card_section CHECK (section IN ('main', 'extra', 'side', 'extras')),
    PRIMARY KEY (variant_id, card_id, section)
);

CREATE INDEX IF NOT EXISTS idx_yg_deck_variant_cards_variant ON yg_deck_variant_cards (variant_id);

ALTER TABLE yg_deck_variant_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access deck variant cards" ON yg_deck_variant_cards FOR ALL TO public USING (true) WITH CHECK (true);
