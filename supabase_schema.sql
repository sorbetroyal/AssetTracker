-- 1. Tabloları temiz bir başlangıç için siliyoruz (Dikkat: Veriler silinir!)
DROP TABLE IF EXISTS portfolio;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS assets;

-- 2. Terminal (Takip Listesi) Tablosu
CREATE TABLE assets (
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

-- 3. Hesaplar Tablosu
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    is_included BOOLEAN DEFAULT TRUE, -- Toplama dahil edilip edilmeyeceği
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Portföy Tablosu (İlişkisel & Cascade Delete)
CREATE TABLE portfolio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL,
    symbol TEXT NOT NULL,
    purchase_at DATE DEFAULT CURRENT_DATE,
    purchase_price DOUBLE PRECISION DEFAULT 0,
    amount DOUBLE PRECISION DEFAULT 0,
    currency TEXT DEFAULT '₺',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Asset Fiyat Önbelleği (Offline Scraper için)
CREATE TABLE asset_prices (
    symbol TEXT PRIMARY KEY,
    price DOUBLE PRECISION NOT NULL,
    daily_change DOUBLE PRECISION DEFAULT 0,
    source TEXT DEFAULT 'borsapy',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. RLS ve Politikalar
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access for assets" ON assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access for accounts" ON accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access for portfolio" ON portfolio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access for asset_prices" ON asset_prices FOR ALL USING (true) WITH CHECK (true);
