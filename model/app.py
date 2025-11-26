import gradio as gr
from ultralytics import YOLO
from PIL import Image
import json
import os
import numpy as np
import numpy.random._pcg64
from numpy.random._pcg64 import PCG64 as OriginalPCG64

# Subclass PCG64 to handle state loading issues
class PatchedPCG64(OriginalPCG64):
    def __setstate__(self, state):
        try:
            super().__setstate__(state)
        except Exception as e:
            print(f"PatchedPCG64: Error in super().__setstate__: {e}")
            print("PatchedPCG64: Ignoring state and continuing with initialized state.")

# Apply patch
print("Patching numpy.random._pcg64.PCG64 with PatchedPCG64...")
numpy.random._pcg64.PCG64 = PatchedPCG64

# Load the model
# Get the directory where this script is located
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, "best.pt")

try:
    # Initialize the model
    model = YOLO(model_path)
    print(f"Model loaded successfully from {model_path}")
    print(f"Model task: {model.task}")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

def predict(image):
    """
    Function to process the image and return predictions with annotated image.
    Handles both OBB (Oriented Bounding Boxes) and standard boxes.
    """
    if model is None:
        return None, {"error": "Model failed to load"}
    
    if image is None:
        return None, {"error": "No image provided"}

    try:
        # Run inference using parameters from training environment
        results = model.predict(
            source=image,
            conf=0.25,      # Confidence threshold
            iou=0.45,       # NMS IoU threshold
            imgsz=1024,     # Inference size
            save=False,
            verbose=False
        )
        
        # Process results
        output = []
        result = results[0] # We only process one image
        
        # Generate annotated image
        # plot() returns a numpy array in BGR
        im_array = result.plot() 
        # Convert BGR to RGB
        im_rgb = im_array[..., ::-1]
        # Convert to PIL Image
        annotated_image = Image.fromarray(im_rgb)
        
        # Determine detection type (OBB vs Standard)
        if hasattr(result, 'obb') and result.obb is not None:
            # Handle OBB detections
            detections = result.obb
            det_type = "OBB"
        elif hasattr(result, 'boxes') and result.boxes is not None:
            # Fallback to standard boxes
            detections = result.boxes
            det_type = "Standard"
        else:
            detections = []
            det_type = "None"

        if len(detections) > 0:
            for i in range(len(detections)):
                cls_id = int(detections.cls[i])
                
                # Explicit class mapping from training script
                class_mapping = {0: "Fitoftora", 1: "Monilia", 2: "Sana"}
                cls_name = class_mapping.get(cls_id, model.names[cls_id] if model.names else str(cls_id))
                
                conf = float(detections.conf[i])
                
                output.append({
                    "type": "detection",
                    "detection_type": det_type,
                    "class": cls_name,
                    "confidence": round(conf, 4)
                })

        # Always return the annotated image, even if no detections
        if not output:
            return annotated_image, {"message": "No detections found", "predictions": [], "info": "Model ran successfully but found nothing."}

        return annotated_image, {"predictions": output}

    except Exception as e:
        print(f"Prediction Error: {e}")
        return None, {"error": str(e)}

# Create the Gradio Interface
demo = gr.Interface(
    fn=predict,
    inputs=gr.Image(type="pil"),
    outputs=[gr.Image(type="pil", label="Annotated Image"), gr.JSON(label="Detections")],
    title="Cacao Disease Detection (YOLO11 OBB)",
    description="Upload an image to detect Moniliophthora & Phytophthora."
)

if __name__ == "__main__":
    # Launch the server
    demo.launch(server_name="0.0.0.0", server_port=7860, show_error=True, allowed_paths=["."])
