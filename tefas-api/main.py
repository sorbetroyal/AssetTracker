from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import uvicorn
from curl_cffi import requests
import datetime

app = FastAPI(title="TEFAS API WAF Bypass (curl_cffi)")

# Netlify, Vercel ve lokal alanları kabul et
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

def fetch_tefas_price(symbol: str) -> dict:
    url = "https://www.tefas.gov.tr/api/DB/GetAllFundAnalyzeData"
    data = {"dil": "TR", "fonkod": symbol.upper()}
    headers = {
        "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
        "Accept": "application/json, text/plain, */*",
        "Origin": "https://www.tefas.gov.tr",
        "Referer": "https://www.tefas.gov.tr/FonAnaliz.aspx",
    }
    
    try:
        # impersonate kullanarak CloudFront / WAF bot kontrolünü atlatıyoruz!
        res = requests.post(url, data=data, headers=headers, impersonate="chrome120", timeout=15)
        
        if "text/html" in res.headers.get("content-type", ""):
            return {"symbol": symbol, "price": 0, "changePercent": 0, "name": symbol, "source": "curl_cffi", "error": "WAF Blocked"}
            
        json_data = res.json()
        if not json_data or not json_data.get("fundInfo"):
            return {"symbol": symbol, "price": 0, "changePercent": 0, "name": symbol, "source": "curl_cffi", "error": "Not Found"}
            
        info = json_data["fundInfo"][0]
        return {
            "symbol": symbol.upper(),
            "price": float(info.get("SONFIYAT", 0) or 0),
            "changePercent": float(info.get("GUNLUKGETIRI", 0) or 0),
            "name": info.get("FONUNVAN", symbol),
            "source": "curl_cffi",
            "error": None,
        }
    except Exception as e:
        return {"symbol": symbol, "price": 0, "changePercent": 0, "name": symbol, "source": "curl_cffi", "error": str(e)}

@app.get("/health")
def health():
    return {"status": "ok_curl_cffi"}

@app.get("/prices")
def get_prices(symbols: str = Query(..., description="Comma-separated fund symbols")):
    """Birden fazla fon fiyatı döner. Örnek: /prices?symbols=MAC,GSY,ATA"""
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    return [fetch_tefas_price(s) for s in symbol_list]

@app.get("/price")
def get_price(symbol: str = Query(...), date: Optional[str] = Query(None)):
    """Tek fon bilgisi ya da tarihe göre fiyat bilgisi çeker."""
    if date:
        try:
            target = datetime.datetime.strptime(date, "%Y-%m-%d")
            # Tarihsel veriyi 7 gün geriden alıyoruz ki hafta sonlarını telafi edelim
            start = target - datetime.timedelta(days=7)
            end = target + datetime.timedelta(days=1)
            
            url = "https://www.tefas.gov.tr/api/DB/BindHistoryInfo"
            data = {
                "fontip": "YAT", "sfontur": "", "fonkod": symbol.upper(), "fongrup": "",
                "bastarih": start.strftime("%d.%m.%Y"),
                "bittarih": end.strftime("%d.%m.%Y"),
                "fonturkod": "", "fonunvantip": "", "kurucukod": "",
            }
            headers = {
                "Accept": "application/json, text/javascript, */*; q=0.01",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "Origin": "https://www.tefas.gov.tr",
                "Referer": "https://www.tefas.gov.tr/TarihselVeriler.aspx",
                "X-Requested-With": "XMLHttpRequest",
            }
            
            res = requests.post(url, data=data, headers=headers, impersonate="chrome120", timeout=20)
            
            if "text/html" in res.headers.get("content-type", ""):
                 return {"symbol": symbol.upper(), "price": 0, "source": "curl_cffi", "error": "WAF Blocked"}
                 
            json_data = res.json()
            items = json_data.get("data", [])
            valid_items = []
            
            for item in items:
                try:
                    ts = int(item.get("TARIH", 0)) / 1000
                    item_dt = datetime.datetime.fromtimestamp(ts)
                    if item_dt.date() <= target.date():
                        valid_items.append(item)
                except:
                    pass
                    
            if valid_items:
                # Sort ascending by date implicitly guaranteed by API but let's be sure we're getting the last one
                last_price = float(valid_items[-1].get("FIYAT", 0))
                return {"symbol": symbol.upper(), "price": last_price, "source": "curl_cffi"}
            else:
                 if items:
                     return {"symbol": symbol.upper(), "price": float(items[0].get("FIYAT", 0)), "source": "curl_cffi"}
                 return {"symbol": symbol.upper(), "price": 0, "source": "curl_cffi", "error": "No data in range"}

        except Exception as e:
            return {"symbol": symbol.upper(), "price": 0, "error": str(e)}

    return fetch_tefas_price(symbol.upper())

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
