import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
import borsapy as bp
from datetime import datetime, timezone
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
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Başlatılıyor: Supabase üzerinden portföy fonları aranıyor...")
    
    fund_symbols = set()
    
    # 1. Portfolio tablosunu sorgula (asset_type = TEFAS veya BEFAS)
    try:
        res_portfolio = supabase.table('portfolio').select('symbol, asset_type').in_('asset_type', ['TEFAS', 'BEFAS']).execute()
        for item in res_portfolio.data:
            fund_symbols.add(item['symbol'].strip().upper())
            print(f"Portföyden eklendi: {item['symbol']}")
    except Exception as e:
        print(f"Portfolio fetch error: {e}")
        
    # 2. Assets tablosunu sorgula (type = TEFAS veya BEFAS)
    try:
        res_assets = supabase.table('assets').select('symbol, type').in_('type', ['TEFAS', 'BEFAS']).execute()
        for item in res_assets.data:
            fund_symbols.add(item['symbol'].strip().upper())
            print(f"Takip listesinden eklendi: {item['symbol']}")
    except Exception as e:
        print(f"Assets fetch error: {e}")
        
    if not fund_symbols:
        print("Supabase veritabanınızda TEFAS veya BEFAS fon kaydı bulunamadı!")
        return
        
    print(f"[{len(fund_symbols)}] adet farklı fon saptandı: {', '.join(fund_symbols)}")
    
    successful_updates = 0
    # UTC ISO format (Supabase için en güvenlisi)
    now = datetime.now(timezone.utc).isoformat()

    for symbol in fund_symbols:
        print(f"İşleniyor: {symbol}...", end="\r")
        data = get_fund_price_from_borsapy(symbol)
        if data and data['price'] > 0:
            upsert_data = {
                "symbol": symbol,
                "price": data['price'],
                "daily_change": data['daily_change'],
                "source": "borsapy_local",
                "updated_at": now
            }
            try:
                res = supabase.table('asset_prices').upsert(upsert_data).execute()
                print(f"[OK] {symbol}: {data['price']} TL (%{data['daily_change']})")
                successful_updates += 1
            except Exception as e:
                print(f"[FAIL] {symbol} Supabase Hatası: {e}")
        else:
            print(f"[ERROR] {symbol} verisi çekilemedi.")
                
        time.sleep(0.4)

    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] İşlem Tamamlandı! {successful_updates}/{len(fund_symbols)} fon güncellendi.")

if __name__ == "__main__":
    sync_asset_prices()
