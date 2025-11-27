
// Configurar el backend para que use WASM (WebAssembly)
// onnxruntime-web intentará usar WebGL si está disponible, pero WASM es más estable para CPU
import { InferenceSession, Tensor, env } from 'onnxruntime-web';

// Configurar la ruta de los archivos WASM locales
// Esto es CRÍTICO para evitar errores de "Unknown CPU vendor" o 404s
env.wasm.wasmPaths = '/_model/';
env.logLevel = 'error'; // Suprimir advertencias no críticas

export class CacaoModel {
  private session: InferenceSession | null = null;
  private modelPath: string = '/_model/best.onnx'; // Ruta en public

  // Clases del modelo según modelo_info.txt
  private classes: string[] = ["Fitoftora", "Monilia", "Sana"];

  constructor() { }

  async load() {
    if (this.session) return;

    try {
      // Cargar la sesión de inferencia
      // executionProviders: ['wasm'] fuerza el uso de CPU/WASM que es más compatible
      this.session = await InferenceSession.create(this.modelPath, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all'
      });
      console.log("Modelo Cacao cargado exitosamente");
    } catch (e) {
      console.error("Error cargando el modelo ONNX:", e);
      throw e;
    }
  }

  async predict(imageElement: HTMLImageElement): Promise<any[]> {
    if (!this.session) await this.load();
    if (!this.session) throw new Error("No se pudo iniciar la sesión del modelo");

    // 1. Preprocesar imagen
    const tensor = await this.preprocess(imageElement);

    // 2. Ejecutar inferencia
    // 'images' es el nombre del input layer usual en exportaciones YOLOv8/Ultralytics
    // Si falla, verificaremos el nombre real con session.inputNames
    const feeds: Record<string, Tensor> = {};
    feeds[this.session.inputNames[0]] = tensor;

    const outputMap = await this.session.run(feeds);

    // 3. Postprocesar resultados
    // La salida de YOLOv8 suele ser [1, 84, 8400] donde:
    // 84 = 4 coordenadas (xc, yc, w, h) + 80 clases (o 3 en nuestro caso)
    // En tu caso con 3 clases: [1, 4 + 3, N_anchors] -> [1, 7, 21504]    // 3. Postprocesar resultados
    const outputTensor = outputMap[this.session.outputNames[0]];

    // Necesitamos pasar las dimensiones del padding para corregir las coordenadas
    return this.postprocess(
      outputTensor.data as Float32Array,
      imageElement.width,
      imageElement.height,
      outputTensor.dims as number[],
      tensor.dims // Pasamos dims del tensor para saber el tamaño de entrada usado (1024x1024)
    );
  }

  private async preprocess(image: HTMLImageElement): Promise<Tensor> {
    const targetWidth = 1024;
    const targetHeight = 1024;

    // Crear un canvas para redimensionar la imagen con Letterbox (Padding)
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("No se pudo crear contexto 2D");

    // Llenar con gris (114, 114, 114) que es el standard de YOLO
    ctx.fillStyle = '#727272';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Calcular escala manteniendo aspect ratio
    const scale = Math.min(targetWidth / image.width, targetHeight / image.height);
    const newWidth = Math.round(image.width * scale);
    const newHeight = Math.round(image.height * scale);

    // Centrar la imagen
    const xOffset = (targetWidth - newWidth) / 2;
    const yOffset = (targetHeight - newHeight) / 2;

    ctx.drawImage(image, xOffset, yOffset, newWidth, newHeight);

    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const { data } = imageData;

    // Convertir a float32 y normalizar [0, 1]
    const float32Data = new Float32Array(3 * targetWidth * targetHeight);

    for (let i = 0; i < targetWidth * targetHeight; i++) {
      float32Data[i] = data[i * 4] / 255.0;           // R
      float32Data[i + targetWidth * targetHeight] = data[i * 4 + 1] / 255.0;   // G
      float32Data[i + 2 * targetWidth * targetHeight] = data[i * 4 + 2] / 255.0; // B
    }

    return new Tensor('float32', float32Data, [1, 3, targetHeight, targetWidth]);
  }

  private postprocess(data: Float32Array, originalWidth: number, originalHeight: number, dims: number[], inputDims?: readonly number[]): any[] {
    let numFeatures = dims[1];
    let numAnchors = dims[2];

    // Calcular parámetros de letterbox para corregir coordenadas
    const inputWidth = inputDims ? inputDims[3] : 1024;
    const inputHeight = inputDims ? inputDims[2] : 1024;

    const scale = Math.min(inputWidth / originalWidth, inputHeight / originalHeight);
    const newWidth = Math.round(originalWidth * scale);
    const newHeight = Math.round(originalHeight * scale);
    const xOffset = (inputWidth - newWidth) / 2;
    const yOffset = (inputHeight - newHeight) / 2;

    // Debug logging
    console.log(`📊 Dimensiones del modelo: [${dims.join(', ')}]`);
    console.log(`📊 Letterbox info: Scale=${scale.toFixed(4)}, Offset=[${xOffset}, ${yOffset}]`);

    // Si están invertidos, intercambiar
    let transposed = false;
    if (numFeatures > numAnchors) {
      const temp = numFeatures;
      numFeatures = numAnchors;
      numAnchors = temp;
      transposed = true;
    }

    // DIAGNÓSTICO DE SCORES
    let maxScore = -Infinity;
    // Muestrear rápido
    for (let i = 0; i < Math.min(numAnchors, 100); i++) {
      for (let c = 0; c < this.classes.length; c++) {
        let idx = transposed ? i * numFeatures + (4 + c) : (4 + c) * numAnchors + i;
        maxScore = Math.max(maxScore, data[idx]);
      }
    }

    const applySigmoid = maxScore > 1.0;
    const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

    const boxes = [];

    for (let i = 0; i < numAnchors; i++) {
      let maxScore = 0;
      let maxClass = -1;

      for (let c = 0; c < this.classes.length; c++) {
        let scoreIdx;
        if (transposed) {
          scoreIdx = i * numFeatures + (4 + c);
        } else {
          scoreIdx = (4 + c) * numAnchors + i;
        }

        const rawScore = data[scoreIdx];
        const score = applySigmoid ? sigmoid(rawScore) : rawScore;

        if (score > maxScore) {
          maxScore = score;
          maxClass = c;
        }
      }

      // Umbral de confianza (0.25)
      if (maxScore > 0.25) {
        let cx, cy, w, h;

        if (transposed) {
          cx = data[i * numFeatures + 0];
          cy = data[i * numFeatures + 1];
          w = data[i * numFeatures + 2];
          h = data[i * numFeatures + 3];
        } else {
          cx = data[0 * numAnchors + i];
          cy = data[1 * numAnchors + i];
          w = data[2 * numAnchors + i];
          h = data[3 * numAnchors + i];
        }

        // DEBUG: Ver coordenadas crudas
        console.log(`📦 RAW COORDS: cx=${cx}, cy=${cy}, w=${w}, h=${h}`);

        // CORRECCIÓN DE COORDENADAS (Letterbox -> Original)
        // Las coordenadas cx, cy, w, h vienen en escala 0-1024 (del modelo)

        // 1. Restar el offset (padding) para volver al espacio de la imagen escalada
        // Nota: w y h no se ven afectados por el offset, solo por la escala
        cx = (cx - xOffset);
        cy = (cy - yOffset);

        // 2. Escalar de vuelta al tamaño original
        cx /= scale;
        cy /= scale;
        w /= scale;
        h /= scale;

        // 3. Convertir de centro (cx, cy) a esquina superior izquierda (x1, y1)
        const x1 = cx - w / 2;
        const y1 = cy - h / 2;

        // 4. NORMALIZACIÓN FINAL (0-1)
        // Dividimos por las dimensiones originales para tener coordenadas relativas
        // Esto facilita enormemente el renderizado en CSS (left: x * 100%)
        const normX = x1 / originalWidth;
        const normY = y1 / originalHeight;
        const normW = w / originalWidth;
        const normH = h / originalHeight;

        boxes.push({
          class: this.classes[maxClass],
          confidence: maxScore,
          bbox: [
            normX, // x (0-1)
            normY, // y (0-1)
            normW, // w (0-1)
            normH  // h (0-1)
          ],
          // Ya no necesitamos pasar originalWidth/Height porque bbox es relativo
        });
      }
    }

    console.log(`🔍 Cajas antes de NMS: ${boxes.length}`);

    // 1. NMS Standard (0.45 según parámetros del entrenador)
    const nmsResult = this.nms(boxes, 0.45);
    console.log(`✅ Cajas después de NMS: ${nmsResult.length}`);

    // 2. Fusión de cajas cercanas (Box Merging)
    // Esto es necesario porque el modelo ONNX parece detectar parches en lugar de objetos completos
    const mergedResult = this.mergeBoxes(nmsResult);
    console.log(`📦 Cajas después de Fusión: ${mergedResult.length}`);

    return mergedResult;
  }

  private nms(boxes: any[], iouThreshold: number = 0.45): any[] {
    if (boxes.length === 0) return [];

    // Ordenar por confianza descendente
    boxes.sort((a, b) => b.confidence - a.confidence);

    const selected = [];
    const active = new Array(boxes.length).fill(true);

    for (let i = 0; i < boxes.length; i++) {
      if (!active[i]) continue;

      selected.push(boxes[i]);

      for (let j = i + 1; j < boxes.length; j++) {
        if (!active[j]) continue;

        const iou = this.calculateIoU(boxes[i].bbox, boxes[j].bbox);
        if (iou > iouThreshold) {
          active[j] = false;
        }
      }
    }

    return selected;
  }

  private mergeBoxes(boxes: any[]): any[] {
    if (boxes.length === 0) return [];

    // Agrupar por clase
    const byClass: Record<string, any[]> = {};
    boxes.forEach(box => {
      if (!byClass[box.class]) byClass[box.class] = [];
      byClass[box.class].push(box);
    });

    const merged = [];

    // Para cada clase, fusionar cajas que se solapan o están muy cerca
    for (const className in byClass) {
      const classBoxes = byClass[className];

      // Si hay pocas cajas, dejarlas como están
      if (classBoxes.length <= 1) {
        merged.push(...classBoxes);
        continue;
      }

      // Algoritmo simple de clustering:
      // Si una caja toca a otra, las fusionamos en una super-caja
      let clusters: any[][] = [];

      for (const box of classBoxes) {
        let addedToCluster = false;

        for (const cluster of clusters) {
          // Verificar si la caja toca alguna caja del cluster
          const touchesCluster = cluster.some(c => this.calculateIoU(box.bbox, c.bbox) > 0.01); // 0.01 = apenas tocarse

          if (touchesCluster) {
            cluster.push(box);
            addedToCluster = true;
            break;
          }
        }

        if (!addedToCluster) {
          clusters.push([box]);
        }
      }

      // Convertir cada cluster en una sola caja
      for (const cluster of clusters) {
        if (cluster.length === 1) {
          merged.push(cluster[0]);
          continue;
        }

        // Calcular límites de la super-caja
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let maxScore = 0;

        for (const box of cluster) {
          const [x, y, w, h] = box.bbox;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x + w);
          maxY = Math.max(maxY, y + h);
          maxScore = Math.max(maxScore, box.confidence);
        }

        merged.push({
          class: className,
          confidence: maxScore, // Usar la confianza más alta del grupo
          bbox: [minX, minY, maxX - minX, maxY - minY]
        });
      }
    }

    return merged;
  }

  private calculateIoU(box1: number[], box2: number[]): number {
    const [x1, y1, w1, h1] = box1;
    const [x2, y2, w2, h2] = box2;

    const xi1 = Math.max(x1, x2);
    const yi1 = Math.max(y1, y2);
    const xi2 = Math.min(x1 + w1, x2 + w2);
    const yi2 = Math.min(y1 + h1, y2 + h2);

    const interArea = Math.max(0, xi2 - xi1) * Math.max(0, yi2 - yi1);
    const box1Area = w1 * h1;
    const box2Area = w2 * h2;

    return interArea / (box1Area + box2Area - interArea);
  }
}
