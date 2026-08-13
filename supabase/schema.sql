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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. yg_deck_cards: Asociación de cartas a decks de usuarios
CREATE TABLE IF NOT EXISTS yg_deck_cards (
    deck_id UUID REFERENCES yg_decks(id) ON DELETE CASCADE,
    card_id INTEGER REFERENCES yg_cards(id) ON DELETE CASCADE,
    count INTEGER NOT NULL CONSTRAINT chk_card_count CHECK (count >= 1 AND count <= 3),
    section VARCHAR(50) NOT NULL CONSTRAINT chk_deck_section CHECK (section IN ('main', 'extra', 'side', 'skill')),
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

