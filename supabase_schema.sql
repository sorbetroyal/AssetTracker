-- Supabase SQL Editor'da çalıştırın

-- 1. Tabloyu oluşturun
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    strategy TEXT NOT NULL,
    entry_price DOUBLE PRECISION NOT NULL,
    target_price DOUBLE PRECISION NOT NULL,
    currency TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Row Level Security (RLS) Ayarları (Opsiyonel ama önerilir)
-- Şimdilik testi kolaylaştırmak için herkesin okuma ve yazma yapmasına izin veriyoruz.
-- Canlıya geçerken bunu kullanıcı bazlı (auth.uid()) yapmalısınız.

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access" ON assets
    FOR ALL
    USING (true)
    WITH CHECK (true);
