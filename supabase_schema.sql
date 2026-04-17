-- 1. Terminal (Takip Listesi) Tablosu
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

-- 2. Portföy (Gerçek Varlıklar) Tablosu
CREATE TABLE IF NOT EXISTS portfolio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_name TEXT NOT NULL, -- Hesap/Banka Adı
    asset_type TEXT NOT NULL,   -- BIST, CRYPTO, COMMODITY, BANK, US
    symbol TEXT NOT NULL,       -- Varlık Sembolü veya Hesap Adı
    purchase_at DATE DEFAULT CURRENT_DATE, -- Alım Tarihi
    purchase_price DOUBLE PRECISION DEFAULT 0, -- Alım Fiyatı
    amount DOUBLE PRECISION DEFAULT 0, -- Miktar
    currency TEXT DEFAULT '₺',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access for assets" ON assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access for portfolio" ON portfolio FOR ALL USING (true) WITH CHECK (true);
