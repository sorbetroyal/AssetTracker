import borsapy as bp
import inspect

def doc():
    try:
        fon = bp.Fund("GMC")
        print("--- history docstring ---")
        print(fon.history.__doc__)
        
        print("\n--- performance docstring ---")
        print(fon.performance.__doc__)
        
    except Exception as e:
        print("Error:", str(e))

if __name__ == "__main__":
    doc()
