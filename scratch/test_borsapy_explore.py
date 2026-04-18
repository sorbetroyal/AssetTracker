import borsapy as bp
import json
from datetime import datetime

def explore():
    symbol = "GMC"
    try:
        fon = bp.Fund(symbol)
        print(f"--- Exploring {symbol} ---")
        methods = [m for m in dir(fon) if not m.startswith('_')]
        print("Methods:", methods)
        
        # Test common historical methods
        # 1. history
        try:
            h = fon.history(start_date="2024-01-01", end_date="2024-01-10")
            print("History Method Success!")
        except:
            print("History Method Failed")
            
        # 2. get_data
        try:
            h = fon.get_data("2024-01-01")
            print("Get_data Method Success!")
        except:
            print("Get_data Method Failed")

        print("Current Info:", fon.info)
        
    except Exception as e:
        print("Error:", str(e))

if __name__ == "__main__":
    explore()
