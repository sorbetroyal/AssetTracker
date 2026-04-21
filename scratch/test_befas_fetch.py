import borsapy as bp
import json

symbols = ['AVR', 'AEI', 'GEV', 'VER', 'GFH']

for s in symbols:
    try:
        fon = bp.Fund(s)
        info = fon.info
        print(f"Symbol: {s}")
        print(f"Price: {info.get('price')}")
        print(f"Daily Return: {info.get('daily_return')}")
        print("-" * 20)
    except Exception as e:
        print(f"Error for {s}: {e}")
