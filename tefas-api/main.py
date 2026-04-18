from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import borsapy as bp
from typing import Optional
import uvicorn

app = FastAPI(title="TEFAS Price API")

# Netlify ve lokali kabul et
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


def get_fund_price(symbol: str) -> dict:
    try:
        fon = bp.Fund(symbol)
        info = fon.info
        return {
            "symbol": symbol,
            "price": float(info.get("price", 0)),
            "changePercent": float(info.get("daily_return", 0)),
            "name": info.get("name", symbol),
            "source": "borsapy",
            "error": None,
        }
    except Exception as e:
        return {
            "symbol": symbol,
            "price": 0,
            "changePercent": 0,
            "name": symbol,
            "source": "borsapy",
            "error": str(e),
        }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/prices")
def get_prices(symbols: str = Query(..., description="Comma-separated fund symbols")):
    """Birden fazla fon fiyatı döner. Örnek: /prices?symbols=MAC,GSY,ATA"""
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    return [get_fund_price(s) for s in symbol_list]


@app.get("/price")
def get_price(symbol: str = Query(...), date: Optional[str] = Query(None)):
    """Tek fon fiyatı. date=YYYY-MM-DD ile tarihe göre fiyat alınabilir."""
    try:
        fon = bp.Fund(symbol.upper())
        if date:
            import pandas as pd
            hist = fon.history(start=date, period="5d")
            if not hist.empty:
                valid = hist[hist.index <= date]
                price = float(valid.iloc[-1]["Price"]) if not valid.empty else float(hist.iloc[0]["Price"])
            else:
                price = 0.0
            return {"symbol": symbol.upper(), "price": price, "source": "borsapy"}
        info = fon.info
        return {
            "symbol": symbol.upper(),
            "price": float(info.get("price", 0)),
            "changePercent": float(info.get("daily_return", 0)),
            "name": info.get("name", symbol),
            "source": "borsapy",
        }
    except Exception as e:
        return {"symbol": symbol.upper(), "price": 0, "error": str(e)}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
