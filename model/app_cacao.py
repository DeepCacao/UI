import gradio as gr
from ultralytics import YOLO
import cv2
import numpy as np
from pathlib import Path
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cargar el modelo una vez al inicio (más eficiente)
try:
    MODELO = YOLO('resultados/yolo11m_cacao_obb_seguro/weights/best.pt')
    logger.info("✅ Modelo YOLOv11 OBB cargado correctamente")
except Exception as e:
    logger.error(f"❌ Error cargando el modelo: {e}")
    MODELO = None

def predecir_enfermedad(imagen):
    """
    Recibe una imagen y retorna la imagen con las detecciones OBB
    """
    if MODELO is None:
        return imagen, "❌ Error: Modelo no disponible"
    
    if imagen is None:
        return None, "❌ Error: Imagen no válida"
    
    try:
        # Realizar predicción con configuración OBB
        resultados = MODELO.predict(
            source=imagen,
            conf=0.25,      # Confidence threshold
            iou=0.45,       # NMS IoU threshold  
            imgsz=1024,     # Tamaño de inferencia
            save=False,     # No guardar automáticamente
            verbose=False   # Reducir logs
        )
        
        # Obtener el primer resultado
        resultado = resultados[0]
        
        # 🎯 CORRECCIÓN: Verificar detecciones OBB
        if hasattr(resultado, 'obb') and resultado.obb is not None:
            # Usar detecciones OBB
            cajas_obb = resultado.obb
            num_detecciones = len(cajas_obb)
        elif hasattr(resultado, 'boxes') and resultado.boxes is not None:
            # Usar detecciones estándar como fallback
            cajas_obb = resultado.boxes
            num_detecciones = len(cajas_obb)
        else:
            num_detecciones = 0
        
        # Renderizar imagen con detecciones
        imagen_con_detecciones = resultado.plot()
        
        if num_detecciones > 0:
            # Obtener información de las detecciones
            if hasattr(resultado, 'obb'):
                clases = resultado.obb.cls.cpu().numpy()
                confianzas = resultado.obb.conf.cpu().numpy()
            else:
                clases = resultado.boxes.cls.cpu().numpy()
                confianzas = resultado.boxes.conf.cpu().numpy()
            
            # Mapeo de clases
            nombres_clases = {0: "Fitoftora", 1: "Monilia", 2: "Sana"}
            
            # Contar detecciones por clase
            conteo = {"Fitoftora": 0, "Monilia": 0, "Sana": 0}
            confianzas_promedio = {"Fitoftora": [], "Monilia": [], "Sana": []}
            
            for clase_idx, confianza in zip(clases, confianzas):
                nombre_clase = nombres_clases.get(int(clase_idx), "Desconocido")
                if nombre_clase in conteo:
                    conteo[nombre_clase] += 1
                    confianzas_promedio[nombre_clase].append(confianza)
            
            # Generar reporte detallado
            reporte = "🔍 **DETECCIONES ENCONTRADAS:**\n\n"
            for enfermedad, cantidad in conteo.items():
                if cantidad > 0:
                    conf_prom = np.mean(confianzas_promedio[enfermedad]) if confianzas_promedio[enfermedad] else 0
                    reporte += f"✅ **{enfermedad}**: {cantidad} detección(es) (conf: {conf_prom:.2f})\n"
            
            reporte += f"\n**Total de detecciones**: {num_detecciones}"
            reporte += f"\n**Tipo de detección**: {'OBB (Cajas Orientadas)' if hasattr(resultado, 'obb') else 'Standard'}"
            
        else:
            reporte = "🔍 **RESULTADO**: No se detectaron enfermedades en la imagen."
        
        return imagen_con_detecciones, reporte
        
    except Exception as e:
        logger.error(f"Error en predicción: {e}")
        return imagen, f"❌ **Error en la predicción**: {str(e)}"

def crear_interfaz():
    """Crea y configura la interfaz de Gradio"""
    
    with gr.Blocks(theme=gr.themes.Soft(), title="Detector de Enfermedades en Cacao") as interfaz:
        
        gr.Markdown(
        """
        # 🍫 Detector de Enfermedades en Mazorcas de Cacao
        ### Sistema de clasificación: Fitoftora, Monilia y Sana
        
        **Modelo YOLOv11 OBB entrenado** - Detecta enfermedades usando cajas delimitadoras orientadas (OBB)
        """)
        
        with gr.Row():
            with gr.Column():
                entrada_imagen = gr.Image(
                    type="numpy",
                    label="📤 Subir imagen de mazorca de cacao",
                    sources=["upload"],
                    height=300
                )
                
                boton_predecir = gr.Button("🔍 Analizar Imagen", variant="primary", size="lg")
            
            with gr.Column():
                salida_imagen = gr.Image(
                    type="numpy",
                    label="🎯 Resultado de la detección",
                    height=300
                )
                
                salida_texto = gr.Textbox(
                    label="📊 Información de detección",
                    lines=5,
                    max_lines=8
                )
        
        # Ejemplos de prueba
        with gr.Accordion("🧪 Ejemplos para probar", open=False):
            gr.Markdown("""
            **Puedes usar estas imágenes de ejemplo o subir tus propias fotos:**
            - Imágenes con mazorcas individuales funcionan mejor
            - Buena iluminación y enfoque mejoran la precisión
            - El modelo detecta: **Fitoftora**, **Monilia** y **Sana**
            """)
        
        # Conectar el botón
        boton_predecir.click(
            fn=predecir_enfermedad,
            inputs=entrada_imagen,
            outputs=[salida_imagen, salida_texto]
        )
        
        # Información del modelo
        gr.Markdown(
        """
        ---
        **ℹ️ Información técnica:** 
        - Modelo: YOLOv11 Medium OBB
        - Precisión (mAP50): 77.75%
        - Clases: Fitoftora, Monilia, Sana  
        - Tipo: Oriented Bounding Boxes (OBB)
        - Entrenado con: 1,482 imágenes balanceadas
        """)
    
    return interfaz

def main():
    """Función principal para ejecutar la aplicación"""
    print("🚀 Iniciando aplicación de detección de enfermedades en cacao...")
    
    if MODELO is None:
        print("❌ No se pudo cargar el modelo. Verifica la ruta:")
        print("   resultados/yolo11m_cacao_obb_seguro/weights/best.pt")
        return
    
    # Verificar que el modelo soporta OBB
    print(f"✅ Modelo cargado: {MODELO.__class__.__name__}")
    print("🎯 Configuración OBB activada")
    
    # Crear y ejecutar la interfaz
    interfaz = crear_interfaz()
    interfaz.launch(
        server_name="localhost",
        server_port=7860,
        share=False,
        show_error=True
    )

if __name__ == "__main__":
    main()