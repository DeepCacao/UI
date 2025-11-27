# Parámetros del Modelo ONNX para Detección de Enfermedades en Cacao

## 📊 Información Detectada del Modelo Actual

### Estructura del Modelo
- **Formato**: ONNX (exportado desde YOLOv11 OBB)
- **Dimensiones de salida**: `[1, 8, 21504]`
  - `1` = batch size
  - `8` = features (4 coords + 3 clases + 1 ángulo OBB)
  - `21504` = anchors/detecciones posibles
- **Tamaño de entrada**: `1024x1024 píxeles`
- **Clases**: 3 (Fitoftora, Monilia, Sana)

### Estructura de Features (8 dimensiones)
```
[0] = cx (centro x)
[1] = cy (centro y)
[2] = w  (ancho)
[3] = h  (alto)
[4] = score_Fitoftora   (logit, requiere sigmoid)
[5] = score_Monilia     (logit, requiere sigmoid)
[6] = score_Sana        (logit, requiere sigmoid)
[7] = angle             (ángulo para OBB, no usado actualmente)
```

## ⚙️ Parámetros de Inferencia Actuales

### Pre-procesamiento
- **Redimensionamiento**: 1024x1024 (mantener aspect ratio o stretch?)
- **Normalización**: Dividir por 255.0 (rango [0, 1])
- **Formato de color**: RGB
- **Orden de canales**: NCHW (Batch, Channels, Height, Width)

### Post-procesamiento
- **Activación de scores**: Sigmoid (los scores vienen en formato logit)
- **Umbral de confianza**: `0.5` (actualmente, ajustable)
- **NMS IoU Threshold**: `0.1` (super agresivo, ajustable)

## 🚨 PROBLEMAS ACTUALES

### Problema Principal: Demasiadas Detecciones Duplicadas
**Síntoma**: Miles de cajas solapadas en una sola mazorca

**Posibles causas**:
1. ❓ **Formato de coordenadas incorrecto**
   - ¿Las coordenadas son absolutas (0-1024) o normalizadas (0-1)?
   - ¿Las coordenadas necesitan ser multiplicadas por el tamaño de la imagen?

2. ❓ **Anchors no procesados correctamente**
   - YOLO normalmente usa anchors predefinidos que se suman a las predicciones
   - ¿El modelo exportado a ONNX ya incluye los anchors en las coordenadas?

3. ❓ **Formato OBB vs Standard**
   - ¿Las coordenadas son para cajas orientadas (con ángulo)?
   - ¿O son cajas estándar (axis-aligned)?

## 📋 INFORMACIÓN NECESARIA DE TU AMIGO

Por favor pregúntale:

### 1. Parámetros de Entrenamiento
```python
# ¿Cuáles fueron estos parámetros al entrenar?
conf_threshold = ?        # Umbral de confianza usado
iou_threshold = ?         # Umbral de IoU para NMS
imgsz = ?                # Tamaño de imagen (1024 confirmado)
```

### 2. Formato de Exportación ONNX
```python
# ¿Cómo se exportó el modelo?
# Ejemplo:
model.export(
    format='onnx',
    imgsz=1024,
    simplify=True,  # ¿Está simplificado?
    dynamic=False,
    # ... otros parámetros
)
```

### 3. Script de Validación en Python
Si puede compartir el código que usó para **validar** el modelo .onnx después de exportarlo, sería ideal. Algo como:

```python
import onnxruntime as ort
import cv2
import numpy as np

session = ort.InferenceSession("best.onnx")

# ¿Cómo preprocesa la imagen?
img = cv2.imread("test.jpg")
# ... preprocesamiento

# ¿Cómo ejecuta la inferencia?
outputs = session.run(None, {session.get_inputs()[0].name: img})

# ¿Cómo parsea las salidas?
# ... código de postprocesamiento
```

### 4. Métricas de Rendimiento Esperadas
- ¿Cuál es el **mAP** del modelo?
- ¿Cuál es la **precisión** y **recall** esperados?
- ¿Cuántas detecciones por imagen son **normales**? (1-3? 5-10?)

## 🔧 SOLUCIONES POSIBLES

### Opción A: Usar el Modelo .pt Directamente
Si el modelo `.pt` funciona bien en Python, podríamos:
1. Crear un endpoint API simple en FastAPI/Flask
2. Exponer solo una ruta `/predict` que reciba la imagen
3. Llamar a ese endpoint desde Next.js

**Ventajas**: Usa código que ya funciona
**Desventajas**: Necesita servidor Python corriendo

### Opción B: Re-exportar el Modelo Correctamente
Si el problema es la exportación ONNX:
1. Re-exportar con parámetros específicos
2. Verificar que funcione en Python primero (`onnxruntime`)
3. Luego integrarlo en el navegador

### Opción C: Usar Ultralytics API
Ultralytics ofrece una API cloud que podría servirnos para la demo:
- https://docs.ultralytics.com/hub/

## 📞 PREGUNTAS CLAVE PARA TU AMIGO

1. **¿El modelo .onnx funciona correctamente cuando lo pruebas en Python con onnxruntime?**
2. **¿Puedes compartir el código de validación/prueba del .onnx?**
3. **¿Las coordenadas en la salida están en píxeles (0-1024) o normalizadas (0-1)?**
4. **¿Qué parámetros de conf/iou usaste al entrenar y validar?**
5. **¿Prefieres que usemos el .pt con un servidor Python o arreglamos el .onnx?**

---

**Archivo creado**: 2025-11-27
**Para**: Demo en 4 días
**Estado**: Modelo carga correctamente, pero post-procesamiento necesita ajustes
