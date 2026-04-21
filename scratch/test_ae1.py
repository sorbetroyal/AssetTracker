import borsapy as bp
import json

symbols = ['AE1', 'AEI']

for s in symbols:
    try:
        fon = bp.Fund(s)
        info = fon.info
        print(f"Symbol: {s}")
        print(f"Price: {info.get('price')}")
        print("-" * 20)
    except Exception as e:
        print(f"Error for {s}: {e}")
