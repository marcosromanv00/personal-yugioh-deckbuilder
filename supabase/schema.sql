-- Esquema de base de datos de Yu-Gi-Oh! Deckbuilder Dinámico
-- Este script define la estructura de las tablas prefijadas con yg_ para Supabase (PostgreSQL).

-- Habilitar extensión para UUIDs si no está activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. yg_cards: Base de datos maestra de cartas sincronizada con YGOPRODeck
CREATE TABLE IF NOT EXISTS yg_cards (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    "desc" TEXT,
    atk INTEGER,
    def INTEGER,
    level INTEGER,
    race VARCHAR(100),
    attribute VARCHAR(50),
    archetype VARCHAR(100),
    image_url VARCHAR(500),
    image_url_small VARCHAR(500),
    ban_master_duel VARCHAR(50) DEFAULT 'Unlimited',
    ban_tcg VARCHAR(50) DEFAULT 'Unlimited',
    ban_ocg VARCHAR(50) DEFAULT 'Unlimited',
    ban_duel_links VARCHAR(50) DEFAULT 'Unlimited',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para búsquedas rápidas por nombre, tipo y arquetipo
CREATE INDEX IF NOT EXISTS idx_yg_cards_name ON yg_cards (name);
CREATE INDEX IF NOT EXISTS idx_yg_cards_archetype ON yg_cards (archetype);
CREATE INDEX IF NOT EXISTS idx_yg_cards_type ON yg_cards (type);

-- 2. yg_card_stats: Estadísticas globales de cartas (popularidad y ratios) por formato
CREATE TABLE IF NOT EXISTS yg_card_stats (
    card_id INTEGER REFERENCES yg_cards(id) ON DELETE CASCADE,
    format VARCHAR(50) NOT NULL, -- 'Master Duel', 'TCG', 'Duel Links'
    usage_percent NUMERIC(5,2) DEFAULT 0.00, -- % de decks en el meta que la usan
    average_copies NUMERIC(3,2) DEFAULT 1.00, -- Copias promedio (ej. 2.85)
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (card_id, format)
);

-- 3. yg_archetype_breakdown: Desglose de cartas jugadas dentro de un arquetipo específico
CREATE TABLE IF NOT EXISTS yg_archetype_breakdown (
    archetype_name VARCHAR(100) NOT NULL,
    card_id INTEGER REFERENCES yg_cards(id) ON DELETE CASCADE,
    format VARCHAR(50) NOT NULL, -- 'Master Duel', 'TCG', 'Duel Links'
    usage_percent NUMERIC(5,2) DEFAULT 0.00, -- % de decks de este arquetipo que juegan esta carta
    average_copies NUMERIC(3,2) DEFAULT 1.00, -- Copias promedio
    is_main_deck BOOLEAN DEFAULT true, -- true = Main, false = Extra
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (archetype_name, card_id, format)
);

-- 4. yg_card_replacements: Tabla de reemplazos/sustitutos recomendados para cartas
CREATE TABLE IF NOT EXISTS yg_card_replacements (
    card_id INTEGER REFERENCES yg_cards(id) ON DELETE CASCADE,
    replacement_card_id INTEGER REFERENCES yg_cards(id) ON DELETE CASCADE,
    format VARCHAR(50) NOT NULL, -- 'Master Duel', 'TCG', 'Duel Links'
    similarity_score NUMERIC(4,3) DEFAULT 0.500, -- Puntuación de confianza (0.0 a 1.0)
    reason VARCHAR(255), -- Explicación del reemplazo, ej. "Mismo rol de Handtrap / Negador"
    PRIMARY KEY (card_id, replacement_card_id, format),
    CONSTRAINT chk_not_self_replacement CHECK (card_id <> replacement_card_id)
);

-- 5. yg_decks: Registro de decks creados por usuarios
CREATE TABLE IF NOT EXISTS yg_decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    format VARCHAR(50) NOT NULL, -- 'Master Duel', 'TCG', 'Duel Links'
    skill_name VARCHAR(255), -- Solo para Duel Links (ej: "A Trick up the Sleeve")
    is_public BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true, -- true = Deck Activo (físico), false = Deck Inactivo (receta)
    storage_location_id UUID REFERENCES yg_storage_locations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. yg_deck_cards: Asociación de cartas a decks de usuarios
CREATE TABLE IF NOT EXISTS yg_deck_cards (
    deck_id UUID REFERENCES yg_decks(id) ON DELETE CASCADE,
    card_id INTEGER REFERENCES yg_cards(id) ON DELETE CASCADE,
    count INTEGER NOT NULL CONSTRAINT chk_card_count CHECK (count >= 1 AND count <= 3),
    proxy_count INTEGER DEFAULT 0 CONSTRAINT chk_proxy_count CHECK (proxy_count >= 0 AND proxy_count <= 3),
    section VARCHAR(50) NOT NULL CONSTRAINT chk_deck_section CHECK (section IN ('main', 'extra', 'side', 'skill', 'extras')),
    PRIMARY KEY (deck_id, card_id, section)
);

-- 7. yg_deck_ratings: Calificaciones y feedback sobre decks compartidos
CREATE TABLE IF NOT EXISTS yg_deck_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID REFERENCES yg_decks(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CONSTRAINT chk_rating_range CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para búsquedas rápidas en decks
CREATE INDEX IF NOT EXISTS idx_yg_deck_cards_deck_id ON yg_deck_cards (deck_id);
CREATE INDEX IF NOT EXISTS idx_yg_decks_format ON yg_decks (format);

-- 8. yg_storage_locations: Especificaciones de contenedores físicos (Binders, Latas, Deckboxes, Cajas)
CREATE TABLE IF NOT EXISTS yg_storage_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CONSTRAINT chk_storage_type CHECK (type IN ('binder', 'box', 'tin', 'deckbox', 'drawer')),
    sub_type VARCHAR(50) DEFAULT 'standard',
    color_code VARCHAR(50) DEFAULT '#8b5cf6',
    dimensions JSONB DEFAULT '{"width": 0, "height": 0, "depth": 0}'::jsonb,
    capacity INTEGER NOT NULL DEFAULT 360,
    grid_layout JSONB DEFAULT '{"rows": 3, "cols": 3, "pockets_per_page": 9, "total_pages": 40}'::jsonb,
    compartments JSONB DEFAULT '{"count": 1, "names": ["Principal"]}'::jsonb,
    render_style VARCHAR(100) DEFAULT 'default_binder',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. yg_user_cards: Registro individual de cartas físicas en la colección
CREATE TABLE IF NOT EXISTS yg_user_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id INTEGER REFERENCES yg_cards(id) ON DELETE CASCADE,
    storage_location_id UUID REFERENCES yg_storage_locations(id) ON DELETE SET NULL, -- NULL = Bandeja Sin Clasificar (Unsorted Inbox)
    deck_id UUID REFERENCES yg_decks(id) ON DELETE SET NULL, -- Si la carta está asociada a un deck específico
    deck_section VARCHAR(50) CONSTRAINT chk_user_card_deck_section CHECK (deck_section IN ('main', 'extra', 'side')),
    compartment_index INTEGER DEFAULT 0,
    binder_page INTEGER,
    binder_slot INTEGER,
    rarity VARCHAR(100) DEFAULT 'Common',
    condition VARCHAR(50) DEFAULT 'Near Mint' CONSTRAINT chk_card_condition CHECK (condition IN ('Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged')),
    language VARCHAR(10) DEFAULT 'EN',
    quantity INTEGER DEFAULT 1 CONSTRAINT chk_user_card_quantity CHECK (quantity >= 1),
    status_flag VARCHAR(50) DEFAULT 'collection' CONSTRAINT chk_card_status CHECK (status_flag IN ('collection', 'trade_sale', 'bulk', 'workshop', 'in_deck', 'memory_deck')),
    sleeve_type VARCHAR(50) DEFAULT 'none' CONSTRAINT chk_sleeve_type CHECK (sleeve_type IN ('none', 'single', 'double', 'triple')),
    sleeve_brand VARCHAR(100),
    sleeve_color VARCHAR(100),
    sleeve_condition VARCHAR(50) DEFAULT 'good' CONSTRAINT chk_sleeve_condition CHECK (sleeve_condition IN ('new', 'good', 'worn', 'damaged')),
    sleeve_fit_id UUID REFERENCES yg_sleeves(id) ON DELETE SET NULL,
    sleeve_regular_id UUID REFERENCES yg_sleeves(id) ON DELETE SET NULL,
    sleeve_over_id UUID REFERENCES yg_sleeves(id) ON DELETE SET NULL,
    sleeve_inner_brand VARCHAR(100),
    sleeve_inner_color VARCHAR(100),
    sleeve_outer_brand VARCHAR(100),
    sleeve_outer_color VARCHAR(100),
    is_proxy BOOLEAN DEFAULT false,
    sale_price NUMERIC(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. yg_storage_rules: Reglas de asignación automática de cartas a contenedores
CREATE TABLE IF NOT EXISTS yg_storage_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_location_id UUID REFERENCES yg_storage_locations(id) ON DELETE CASCADE,
    rule_type VARCHAR(50) NOT NULL, -- 'rarity', 'status_flag', 'archetype', 'is_staple', 'deck_completion'
    target_value VARCHAR(255) NOT NULL,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. yg_deck_sleeve_config: Configuración y reglas de fundas para decks
CREATE TABLE IF NOT EXISTS yg_deck_sleeve_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID REFERENCES yg_decks(id) ON DELETE CASCADE,
    main_deck_sleeve_color VARCHAR(100) DEFAULT 'Matte Black',
    main_deck_sleeve_brand VARCHAR(100) DEFAULT 'Dragon Shield',
    main_deck_double_sleeved BOOLEAN DEFAULT false,
    extra_deck_sleeve_color VARCHAR(100) DEFAULT 'Matte White',
    extra_deck_sleeve_brand VARCHAR(100) DEFAULT 'Dragon Shield',
    extra_deck_double_sleeved BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. yg_wishlist: Lista de deseos y cartas faltantes
CREATE TABLE IF NOT EXISTS yg_wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id INTEGER REFERENCES yg_cards(id) ON DELETE CASCADE,
    target_quantity INTEGER DEFAULT 1,
    priority VARCHAR(50) DEFAULT 'medium' CONSTRAINT chk_wishlist_priority CHECK (priority IN ('high', 'medium', 'low')),
    max_price NUMERIC(10,2),
    deck_id UUID REFERENCES yg_decks(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para búsquedas rápidas en el inventario
CREATE INDEX IF NOT EXISTS idx_yg_user_cards_location ON yg_user_cards (storage_location_id);
CREATE INDEX IF NOT EXISTS idx_yg_user_cards_card ON yg_user_cards (card_id);
CREATE INDEX IF NOT EXISTS idx_yg_user_cards_status ON yg_user_cards (status_flag);

-- 13. yg_sleeves: Inventario físico de fundas del usuario
CREATE TABLE IF NOT EXISTS yg_sleeves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'regular' CONSTRAINT chk_sleeve_category CHECK (category IN ('fit', 'regular', 'over')),
    brand VARCHAR(100) NOT NULL DEFAULT 'Dragon Shield',
    color_pattern VARCHAR(150) NOT NULL DEFAULT 'Matte Black',
    color_hex VARCHAR(7) DEFAULT '#1a1a2e',
    size_type VARCHAR(50) NOT NULL DEFAULT 'standard' CONSTRAINT chk_sleeve_size CHECK (size_type IN ('standard', 'mini-japanese', 'european')),
    condition VARCHAR(50) NOT NULL DEFAULT 'new' CONSTRAINT chk_sleeve_inv_condition CHECK (condition IN ('new', 'good', 'worn')),
    quantity_total INTEGER NOT NULL DEFAULT 0 CONSTRAINT chk_sleeve_qty CHECK (quantity_total >= 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_yg_sleeves_brand ON yg_sleeves (brand);
CREATE INDEX IF NOT EXISTS idx_yg_sleeves_condition ON yg_sleeves (condition);
CREATE INDEX IF NOT EXISTS idx_yg_sleeves_category ON yg_sleeves (category);

-- 14. yg_deck_sleeves: Relación entre decks y fundas asignadas
CREATE TABLE IF NOT EXISTS yg_deck_sleeves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID NOT NULL REFERENCES yg_decks(id) ON DELETE CASCADE,
    sleeve_id UUID NOT NULL REFERENCES yg_sleeves(id) ON DELETE RESTRICT,
    section_type VARCHAR(50) NOT NULL,
    quantity_used INTEGER NOT NULL DEFAULT 0 CONSTRAINT chk_deck_sleeve_qty CHECK (quantity_used >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (deck_id, section_type)
);

CREATE INDEX IF NOT EXISTS idx_yg_deck_sleeves_deck ON yg_deck_sleeves (deck_id);
CREATE INDEX IF NOT EXISTS idx_yg_deck_sleeves_sleeve ON yg_deck_sleeves (sleeve_id);

-- RLS y Políticas de Acceso Público para Fundas
ALTER TABLE yg_sleeves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access sleeves" ON yg_sleeves FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE yg_deck_sleeves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access deck sleeves" ON yg_deck_sleeves FOR ALL TO public USING (true) WITH CHECK (true);

-- 15. yg_card_synergies: Sistema Experto de Inteligencia y Sinergias Implícitas
CREATE TABLE IF NOT EXISTS yg_card_synergies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    archetype VARCHAR(100) NOT NULL,
    card_id INTEGER REFERENCES yg_cards(id) ON DELETE SET NULL,
    card_name VARCHAR(255) NOT NULL,
    synergy_role VARCHAR(50) NOT NULL CONSTRAINT chk_synergy_role CHECK (synergy_role IN ('starter', 'extender', 'searcher', 'dump_target', 'boss', 'tech', 'floodgate_counter', 'engine', 'staple_synergy')),
    weight NUMERIC(4,3) DEFAULT 0.850 CONSTRAINT chk_synergy_weight CHECK (weight >= 0.0 AND weight <= 1.0),
    reason TEXT,
    source VARCHAR(50) DEFAULT 'system' CONSTRAINT chk_synergy_source CHECK (source IN ('system', 'user_feedback', 'tournament_cooccurrence', 'ai_mining')),
    user_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (archetype, card_name)
);

CREATE INDEX IF NOT EXISTS idx_yg_card_synergies_archetype ON yg_card_synergies (archetype);
CREATE INDEX IF NOT EXISTS idx_yg_card_synergies_card_name ON yg_card_synergies (card_name);
CREATE INDEX IF NOT EXISTS idx_yg_card_synergies_role ON yg_card_synergies (synergy_role);

ALTER TABLE yg_card_synergies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access card synergies" ON yg_card_synergies FOR ALL TO public USING (true) WITH CHECK (true);

-- 16. yg_card_knowledge: Base de Conocimiento Central y Cerebro del Agente
CREATE TABLE IF NOT EXISTS yg_card_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id INTEGER REFERENCES yg_cards(id) ON DELETE CASCADE,
    card_name VARCHAR(255) NOT NULL,
    market_price NUMERIC(10,2) DEFAULT 0.00,
    release_tcg DATE,
    release_ocg DATE,
    release_md DATE,
    rulings_data JSONB DEFAULT '[]'::jsonb,
    formats_stats JSONB DEFAULT '{}'::jsonb,
    is_user_verified BOOLEAN DEFAULT false,
    user_verification_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (card_name)
);

CREATE INDEX IF NOT EXISTS idx_yg_card_knowledge_card_name ON yg_card_knowledge (card_name);
CREATE INDEX IF NOT EXISTS idx_yg_card_knowledge_verified ON yg_card_knowledge (is_user_verified);

ALTER TABLE yg_card_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access card knowledge" ON yg_card_knowledge FOR ALL TO public USING (true) WITH CHECK (true);

-- 17. yg_knowledge_logs: Historial de Auditoría y Aprendizaje del Usuario
CREATE TABLE IF NOT EXISTS yg_knowledge_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id INTEGER REFERENCES yg_cards(id) ON DELETE CASCADE,
    card_name VARCHAR(255) NOT NULL,
    format VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    summary TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_yg_knowledge_logs_card_name ON yg_knowledge_logs (card_name);
CREATE INDEX IF NOT EXISTS idx_yg_knowledge_logs_created_at ON yg_knowledge_logs (created_at DESC);

ALTER TABLE yg_knowledge_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access knowledge logs" ON yg_knowledge_logs FOR ALL TO public USING (true) WITH CHECK (true);



