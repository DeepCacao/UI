from ultralytics import YOLO
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, "model", "best.pt")

try:
    model = YOLO(model_path)
    print("Model loaded successfully.")
    print("--- Model Names (Classes) ---")
    print(model.names)
    print("\n--- Model Info ---")
    # Try to print some info about the model
    print(f"Task: {model.task}")
    
    # Check for arguments if available in overrides or similar
    if hasattr(model, 'overrides'):
        print("\n--- Model Overrides (Training Config) ---")
        print(model.overrides)
        
except Exception as e:
    print(f"Error loading model: {e}")
