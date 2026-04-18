import sys
import json
import borsapy as bp
from datetime import datetime

def fetch_funds(symbols, target_date=None):
    results = []
    for symbol in symbols:
        try:
            fon = bp.Fund(symbol)
            
            # Varsayılan değerler
            info = fon.info
            price = float(info.get('price', 0))
            change = float(info.get('daily_return', 0))
            name = info.get('name', symbol)
            
            # Eğer geçmiş tarih istenmişse tarihsel fiyat çek
            if target_date:
                try:
                    # Seçilen tarihin 5 gün öncesine kadar bak (hafta sonu/tatil durumları için)
                    # TEFAS verileri iş günlerinde oluşur.
                    start_dt = datetime.strptime(target_date, "%Y-%m-%d")
                    # Biraz geniş bir aralık alalım ki o günü kapsasın
                    hist = fon.history(start=target_date, period="5d")
                    
                    if not hist.empty:
                        # Index (tarih) üzerinden hedef tarihe en yakın ve öncesindeki son veriyi al
                        # Önce hedef tarihten büyük olanları temizle (eğer varsa)
                        valid_dates = hist[hist.index <= target_date]
                        if not valid_dates.empty:
                            price = float(valid_dates.iloc[-1]['Price'])
                        else:
                            # Eğer o tarihten önce veri yoksa en eski mevcut veriyi al
                            price = float(hist.iloc[0]['Price'])
                except Exception as e:
                    print(f"History fetch error for {symbol}: {e}", file=sys.stderr)
            
            results.append({
                "symbol": symbol,
                "price": price,
                "changePercent": change,
                "name": name,
                "source": "borsapy"
            })
        except Exception as e:
            results.append({
                "symbol": symbol,
                "error": str(e),
                "price": 0,
                "changePercent": 0
            })
    return results

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps([]))
        sys.exit(0)
    
    symbols_list = sys.argv[1].split(',')
    target_date = sys.argv[2] if len(sys.argv) > 2 else None
    
    final_data = fetch_funds(symbols_list, target_date)
    print(json.dumps(final_data))
