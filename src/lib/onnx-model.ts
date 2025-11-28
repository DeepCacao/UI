
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

  async predict(imageElement: HTMLImageElement, nmsThreshold: number = 0.60): Promise<any[]> {
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
      tensor.dims, // Pasamos dims del tensor para saber el tamaño de entrada usado (1024x1024)
      nmsThreshold
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

  private postprocess(data: Float32Array, originalWidth: number, originalHeight: number, dims: number[], inputDims?: readonly number[], nmsThreshold: number = 0.60): any[] {
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

      // Umbral de confianza base muy bajo para permitir que el slider de la UI decida
      if (maxScore > 0.01) {
        let cx, cy, w, h, angle;

        if (transposed) {
          cx = data[i * numFeatures + 0];
          cy = data[i * numFeatures + 1];
          w = data[i * numFeatures + 2];
          h = data[i * numFeatures + 3];
          angle = data[i * numFeatures + 7];
        } else {
          cx = data[0 * numAnchors + i];
          cy = data[1 * numAnchors + i];
          w = data[2 * numAnchors + i];
          h = data[3 * numAnchors + i];
          angle = data[7 * numAnchors + i];
        }

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
        // Esto es para el BBOX standard (AABB) usado en NMS
        const x1 = cx - w / 2;
        const y1 = cy - h / 2;

        // 4. NORMALIZACIÓN FINAL (0-1)
        // Dividimos por las dimensiones originales para tener coordenadas relativas
        const normX = x1 / originalWidth;
        const normY = y1 / originalHeight;
        const normW = w / originalWidth;
        const normH = h / originalHeight;

        // Calcular centro normalizado para OBB
        const normCX = cx / originalWidth;
        const normCY = cy / originalHeight;

        const box = {
          class: this.classes[maxClass],
          confidence: maxScore,
          bbox: [
            normX, // x (0-1) - Top Left (Unrotated)
            normY, // y (0-1) - Top Left (Unrotated)
            normW, // w (0-1)
            normH  // h (0-1)
          ],
          obb: {
            cx: normCX,
            cy: normCY,
            w: normW,
            h: normH,
            rotation: angle
          }
        };

        boxes.push(box);
      }
    }


    // 1. NMS Standard (usando el threshold dinámico)
    // Al usar AABB en objetos rotados, el solapamiento es mayor al real.
    // Subimos el umbral para evitar suprimir vecinos legítimos.
    const nmsResult = this.nms(boxes, nmsThreshold);
    console.log(`✅ Cajas después de NMS: ${nmsResult.length}`);

    // 2. Fusión de cajas cercanas (Box Merging)
    const mergedResult = this.mergeBoxes(nmsResult);
    console.log(`📦 Cajas después de Fusión: ${mergedResult.length}`);

    return mergedResult;
  }

  private nms(boxes: any[], iouThreshold: number = 0.60): any[] {
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

        // ERROR CORREGIDO: Pasar el objeto completo 'boxes[i]' y 'boxes[j]' 
        // para que calculateIoU pueda acceder a la propiedad .obb
        const iou = this.calculateIoU(boxes[i], boxes[j]);

        // NMS Class-Specific:
        // Solo suprimir si son de la misma clase Y se solapan significativamente.
        // Si son clases diferentes, permitimos el solapamiento (podrían ser dos objetos distintos cercanos)
        // A MENOS que el solapamiento sea casi total (> 0.90), en cuyo caso asumimos que es el mismo objeto con doble detección

        const sameClass = boxes[i].class === boxes[j].class;

        if (sameClass && iou > iouThreshold) {
          active[j] = false; // Suprimir duplicado de misma clase
          // console.log(`⚠️ NMS Same-Class suprimido: ${boxes[j].class} (Conf: ${boxes[j].confidence.toFixed(2)}) por (Conf: ${boxes[i].confidence.toFixed(2)}) - IoU: ${iou.toFixed(2)}`);
        } else if (!sameClass && iou > 0.90) {
          active[j] = false; // Suprimir duplicado de distinta clase (muy probable error del modelo)
          console.log(`⚠️ NMS Cross-Class suprimido: ${boxes[j].class} (${boxes[j].confidence.toFixed(2)}) vs ${boxes[i].class} (${boxes[i].confidence.toFixed(2)}) - IoU: ${iou.toFixed(2)}`);
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

        // En lugar de crear una super-caja AABB (que pierde la rotación),
        // seleccionamos la caja con mayor confianza del cluster como representante.
        // Esto mantiene la propiedad OBB correcta.

        let bestBox = cluster[0];
        for (let k = 1; k < cluster.length; k++) {
          if (cluster[k].confidence > bestBox.confidence) {
            bestBox = cluster[k];
          }
        }

        merged.push(bestBox);
      }
    }

    return merged;
  }

  private calculateIoU(box1: any, box2: any): number {
    // Si tenemos información OBB, usamos Polígonos para calcular IoU real
    if (box1.obb && box2.obb) {
      return this.calculatePolygonIoU(box1.obb, box2.obb);
    }

    // Fallback a AABB estándar si no hay OBB
    const b1 = box1.bbox ? box1.bbox : box1;
    const b2 = box2.bbox ? box2.bbox : box2;

    const [x1, y1, w1, h1] = b1;
    const [x2, y2, w2, h2] = b2;

    const xi1 = Math.max(x1, x2);
    const yi1 = Math.max(y1, y2);
    const xi2 = Math.min(x1 + w1, x2 + w2);
    const yi2 = Math.min(y1 + h1, y2 + h2);

    const interArea = Math.max(0, xi2 - xi1) * Math.max(0, yi2 - yi1);
    const box1Area = w1 * h1;
    const box2Area = w2 * h2;

    return interArea / (box1Area + box2Area - interArea + 1e-6);
  }

  private calculatePolygonIoU(obb1: any, obb2: any): number {
    // Convertir OBB (cx, cy, w, h, rot) a vértices de polígono
    const poly1 = this.getPolygonVertices(obb1);
    const poly2 = this.getPolygonVertices(obb2);

    // Calcular área de intersección exacta usando Sutherland-Hodgman
    const intersectionArea = this.getIntersectionArea(poly1, poly2);

    if (intersectionArea <= 0) return 0;

    const area1 = obb1.w * obb1.h;
    const area2 = obb2.w * obb2.h;

    const unionArea = area1 + area2 - intersectionArea;

    return intersectionArea / (unionArea + 1e-6);
  }

  private getPolygonVertices(obb: any): { x: number, y: number }[] {
    const { cx, cy, w, h, rotation } = obb;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    // Mitades de ancho y alto
    const hw = w / 2;
    const hh = h / 2;

    // Vértices relativos al centro (antes de rotar)
    // Orden horario: TL, TR, BR, BL (asumiendo sistema de coordenadas de pantalla Y hacia abajo)
    const corners = [
      { x: -hw, y: -hh },
      { x: hw, y: -hh },
      { x: hw, y: hh },
      { x: -hw, y: hh }
    ];

    // Rotar y trasladar
    return corners.map(p => ({
      x: cx + (p.x * cos - p.y * sin),
      y: cy + (p.x * sin + p.y * cos)
    }));
  }

  // Algoritmo de Sutherland-Hodgman para intersección de polígonos convexos
  private getIntersectionArea(poly1: { x: number, y: number }[], poly2: { x: number, y: number }[]): number {
    let outputList = poly1;

    // Recortar poly1 contra cada borde de poly2
    for (let i = 0; i < poly2.length; i++) {
      const edgeStart = poly2[i];
      const edgeEnd = poly2[(i + 1) % poly2.length];

      const inputList = outputList;
      outputList = [];

      if (inputList.length === 0) break;

      let s = inputList[inputList.length - 1];

      for (const e of inputList) {
        if (this.isInside(edgeStart, edgeEnd, e)) {
          if (!this.isInside(edgeStart, edgeEnd, s)) {
            outputList.push(this.computeIntersection(edgeStart, edgeEnd, s, e));
          }
          outputList.push(e);
        } else if (this.isInside(edgeStart, edgeEnd, s)) {
          outputList.push(this.computeIntersection(edgeStart, edgeEnd, s, e));
        }
        s = e;
      }
    }

    return this.getPolygonArea(outputList);
  }

  // Verifica si el punto p está "adentro" del borde definido por edgeStart->edgeEnd
  // "Adentro" significa a la derecha del vector borde (asumiendo orden horario y coordenadas de pantalla)
  private isInside(edgeStart: { x: number, y: number }, edgeEnd: { x: number, y: number }, p: { x: number, y: number }): boolean {
    return (edgeEnd.x - edgeStart.x) * (p.y - edgeStart.y) - (edgeEnd.y - edgeStart.y) * (p.x - edgeStart.x) >= 0;
  }

  private computeIntersection(p1: { x: number, y: number }, p2: { x: number, y: number }, p3: { x: number, y: number }, p4: { x: number, y: number }): { x: number, y: number } {
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const x3 = p3.x, y3 = p3.y;
    const x4 = p4.x, y4 = p4.y;

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

    if (Math.abs(denom) < 1e-6) return { x: 0, y: 0 }; // Paralelas (no debería ocurrir en clipping normal)

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;

    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1)
    };
  }

  private getPolygonArea(poly: { x: number, y: number }[]): number {
    let area = 0;
    for (let i = 0; i < poly.length; i++) {
      const j = (i + 1) % poly.length;
      area += poly[i].x * poly[j].y;
      area -= poly[j].x * poly[i].y;
    }
    return Math.abs(area) / 2;
  }
}
