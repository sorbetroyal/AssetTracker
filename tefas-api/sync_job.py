import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
import borsapy as bp
from datetime import datetime
import time

# Root directory içindeki .env.local dosyasını bul ve yükle
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(root_dir, '.env.local')

if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)
else:
    print(f"CRITICAL: .env.local file not found at {env_path}")
    sys.exit(1)

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    print("CRITICAL: Supabase credentials not found in .env.local")
    sys.exit(1)

supabase: Client = create_client(url, key)

def get_fund_price_from_borsapy(symbol: str) -> dict:
    try:
        fon = bp.Fund(symbol)
        info = fon.info
        return {
            "symbol": symbol,
            "price": float(info.get("price", 0)),
            "daily_change": float(info.get("daily_return", 0)),
            "source": "borsapy",
        }
    except Exception as e:
        print(f"[{symbol}] cekerken hata: {str(e)}")
        return None

def sync_asset_prices():
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Baslatiliyor: Supabase uzerinden portfoy fonlari araniyor...")
    
    fund_symbols = set()
    
    # 1. Portfolio tablosunu sorgula (asset_type = TEFAS veya BEFAS)
    try:
        res_portfolio = supabase.table('portfolio').select('symbol, asset_type').in_('asset_type', ['TEFAS', 'BEFAS']).execute()
        for item in res_portfolio.data:
            fund_symbols.add(item['symbol'].strip().upper())
    except Exception as e:
        print(f"Portfolio fetch error: {e}")
        
    # 2. Assets tablosunu sorgula (type = TEFAS veya BEFAS)
    try:
        res_assets = supabase.table('assets').select('symbol, type').in_('type', ['TEFAS', 'BEFAS']).execute()
        for item in res_assets.data:
            fund_symbols.add(item['symbol'].strip().upper())
    except Exception as e:
        print(f"Assets fetch error: {e}")
        
    if not fund_symbols:
        print("Supabase veritabaninizda TEFAS veya BEFAS fon kaydi bulunamadi! (Portfoy veya Takip bos)")
        return
        
    print(f"[{len(fund_symbols)}] adet farkli TEFAS/BEFAS fonu saptandi: {', '.join(fund_symbols)}")
    print("Fiyatlar TEFAS (borsapy) uzerinden guncelleniyor...")
    
    successful_updates = 0
    now = datetime.now().isoformat()

    for symbol in fund_symbols:
        data = get_fund_price_from_borsapy(symbol)
        if data and data['price'] > 0:
            upsert_data = {
                "symbol": symbol,
                "price": data['price'],
                "daily_change": data['daily_change'],
                "source": data['source'],
                "updated_at": now
            }
            try:
                # Upsert islemi: Varsa guncelle, yoksa ekle
                res = supabase.table('asset_prices').upsert(upsert_data).execute()
                print(f"[OK] {symbol} -> {data['price']} TL (%{data['daily_change']})")
                successful_updates += 1
            except Exception as e:
                print(f"[FAIL] {symbol} Supabase Update Error: {e}")
                
        # API siniri asmamak veya ban yememek icin minimal uyku beklemesi
        time.sleep(0.5)

    print(f"[{datetime.now().strftime('%H:%M:%S')}] Islem Tamamlandi! {successful_updates}/{len(fund_symbols)} fon veritabanina yazildi.")

if __name__ == "__main__":
    sync_asset_prices()
