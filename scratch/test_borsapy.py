import borsapy as bp
import json
from datetime import datetime

def test():
    try:
        fon = bp.Fund("GMC")
        print("Available methods on Fund object:")
        # print(dir(fon))
        
        # Test historical price if possible
        # Some versions of borsapy use different methods
        # Let's check info first
        print("Info:", fon.info)
        
    except Exception as e:
        print("Error:", str(e))

if __name__ == "__main__":
    test()
