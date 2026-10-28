-- Migración: yg_suggestion_reports
-- Permite al usuario reportar y calificar sugerencias/respuestas de la IA o motores analíticos (Escala 1 al 5 + descripción del error)

CREATE TABLE IF NOT EXISTS yg_suggestion_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id VARCHAR(100),
    source VARCHAR(50) NOT NULL CONSTRAINT chk_report_source CHECK (source IN (
        'global_chat', 
        'deck_assistant', 
        'deck_diagnostics', 
        'collection_suggestions', 
        'duel_copilot', 
        'combo_advisor', 
        'general'
    )),
    suggestion_id VARCHAR(100),
    rating SMALLINT NOT NULL CONSTRAINT chk_report_rating CHECK (rating >= 1 AND rating <= 5),
    error_description TEXT NOT NULL,
    context_data JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'pending' CONSTRAINT chk_report_status CHECK (status IN ('pending', 'reviewed', 'resolved'))
);

CREATE INDEX IF NOT EXISTS idx_yg_suggestion_reports_source ON yg_suggestion_reports (source);
CREATE INDEX IF NOT EXISTS idx_yg_suggestion_reports_rating ON yg_suggestion_reports (rating);
CREATE INDEX IF NOT EXISTS idx_yg_suggestion_reports_created_at ON yg_suggestion_reports (created_at DESC);

-- Habilitar RLS
ALTER TABLE yg_suggestion_reports ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Public insert suggestion reports" ON yg_suggestion_reports 
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Public select suggestion reports" ON yg_suggestion_reports 
    FOR SELECT TO public USING (true);
