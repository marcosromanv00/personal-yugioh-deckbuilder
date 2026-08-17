-- SQL Schema Migration for Colección Ideal (Ideal Twin Environment)

CREATE TABLE IF NOT EXISTS yg_ideal_containers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    physical_storage_location_id UUID REFERENCES yg_storage_locations(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    sub_type TEXT NOT NULL,
    color_code TEXT DEFAULT '#3b82f6',
    dimensions JSONB DEFAULT '{}'::jsonb,
    capacity INT DEFAULT 0,
    grid_layout JSONB DEFAULT '{}'::jsonb,
    compartments JSONB DEFAULT '{}'::jsonb,
    render_style TEXT DEFAULT 'modern',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS yg_ideal_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    physical_user_card_id UUID REFERENCES yg_user_cards(id) ON DELETE SET NULL,
    card_id INT NOT NULL,
    ideal_container_id UUID REFERENCES yg_ideal_containers(id) ON DELETE SET NULL,
    ideal_deck_id UUID,
    ideal_deck_section TEXT,
    compartment_index INT DEFAULT 0,
    binder_page INT DEFAULT 1,
    binder_slot INT DEFAULT 1,
    rarity TEXT NOT NULL,
    condition TEXT DEFAULT 'Near Mint',
    language TEXT DEFAULT 'EN',
    quantity INT DEFAULT 1,
    status_flag TEXT DEFAULT 'collection',
    sleeve_type TEXT DEFAULT 'none',
    sleeve_brand TEXT,
    sleeve_color TEXT,
    sleeve_condition TEXT,
    is_proxy BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_grayscale_shared BOOLEAN DEFAULT FALSE,
    shared_notes TEXT,
    reorganization_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS yg_ideal_decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    physical_deck_id UUID REFERENCES yg_decks(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    archetype TEXT,
    format TEXT DEFAULT 'Advanced',
    is_variant BOOLEAN DEFAULT FALSE,
    parent_deck_id UUID,
    completeness_percentage INT DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS yg_ideal_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- 'deck_created', 'card_promoted', 'bulk_sorted', 'staple_organized'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    impact_level TEXT DEFAULT 'medium', -- 'high', 'medium', 'low'
    source_location_name TEXT,
    target_location_name TEXT,
    card_count INT DEFAULT 1,
    is_applied_to_physical BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
