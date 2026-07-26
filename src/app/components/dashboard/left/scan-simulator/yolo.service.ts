import { Injectable, signal } from '@angular/core';
import * as ort from 'onnxruntime-web';

export interface YoloDetection {
  label: string;
  score: number;
  box: { xmin: number; ymin: number; xmax: number; ymax: number };
}

// Matching your exact Roboflow data.yaml index order
const CLASS_NAMES = [
  'healthy',  // Index 0
  'rust',     // Index 1
  'septoria'  // Index 2
];

const CACHE_NAME = 'onnx-assets-cache-v1';
const MODEL_URL = '/models/YOLO26s/best.onnx';
const WASM_URL = '/assets/wasm/ort-wasm-simd-threaded.jsep.wasm';

ort.env.logLevel = 'error';

@Injectable({
  providedIn: 'root'
})
export class YoloService {
  private session: ort.InferenceSession | undefined;
  private loadPromise: Promise<void> | null = null;
  isLoading = signal(false);

  private async getCachedResource(url: string): Promise<Response> {
    if ('caches' in window) {
      const cache = await caches.open(CACHE_NAME);
      let response = await cache.match(url);

      if (!response) {
        response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response.clone());
        } else {
          throw new Error(`Failed to fetch ${url}`);
        }
      }
      return response;
    }
    return await fetch(url);
  }

  async loadModel(): Promise<void> {
    if (this.session) return;
    if (this.loadPromise) return this.loadPromise;

    this.isLoading.set(true);

    this.loadPromise = (async () => {
      let originalFetch: typeof window.fetch | null = null;
      try {
        await this.getCachedResource(WASM_URL);

        originalFetch = window.fetch;
        window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
          const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
          
          if (urlStr.includes('ort-wasm-simd-threaded.jsep.wasm')) {
            return await this.getCachedResource(WASM_URL);
          }
          return originalFetch!(input, init);
        };

        ort.env.wasm.wasmPaths = '/assets/wasm/';

        const options: ort.InferenceSession.SessionOptions = {
          executionProviders: ['webgpu', 'wasm'],
          graphOptimizationLevel: 'all',
          logSeverityLevel: 3,
          logVerbosityLevel: 0
        };

        const modelResponse = await this.getCachedResource(MODEL_URL);
        const modelBuffer = await modelResponse.arrayBuffer();

        this.session = await ort.InferenceSession.create(
          new Uint8Array(modelBuffer), 
          options
        );
      } catch (err) {
        console.error('YOLO model session initialization failed:', err);
        this.loadPromise = null;
        throw err;
      } finally {
        if (originalFetch) {
          window.fetch = originalFetch;
        }
        this.isLoading.set(false);
      }
    })();

    return this.loadPromise;
  }

  async runInference(imageData: Float32Array): Promise<YoloDetection[]> {
    if (!this.session) {
      await this.loadModel();
    }

    if (!this.session) return [];

    const tensor = new ort.Tensor('float32', imageData, [1, 3, 640, 640]);
    const inputName = this.session.inputNames[0];
    const feeds = { [inputName]: tensor };

    const results = await this.session.run(feeds);
    const outputName = this.session.outputNames[0];
    const outputTensor = results[outputName];

    return this.postProcessYOLO(outputTensor.data as Float32Array, outputTensor.dims as number[]);
  }

  private postProcessYOLO(data: Float32Array, dims: number[], scoreThreshold = 0.25): YoloDetection[] {
    // 1. END-TO-END MODEL OUTPUT FORMAT: [1, 300, 6]
    if (dims.length === 3 && dims[2] === 6) {
      return this.processEndToEnd(data, dims[1], scoreThreshold);
    }

    // 2. STANDARD RAW YOLO OUTPUT FORMAT: [1, 7, 8400] or [1, 8400, 7]
    return this.processRawYOLO(data, dims, scoreThreshold);
  }

  private processEndToEnd(data: Float32Array, numDetections: number, scoreThreshold: number): YoloDetection[] {
    const detections: YoloDetection[] = [];

    for (let i = 0; i < numDetections; i++) {
      const offset = i * 6;
      const score = data[offset + 4];

      if (score >= scoreThreshold) {
        const x1 = data[offset + 0];
        const y1 = data[offset + 1];
        const x2 = data[offset + 2];
        const y2 = data[offset + 3];
        const classId = Math.round(data[offset + 5]);

        detections.push({
          label: CLASS_NAMES[classId] || 'disease',
          score: score,
          box: {
            xmin: Math.max(0, Math.min(1, x1 / 640.0)),
            ymin: Math.max(0, Math.min(1, y1 / 640.0)),
            xmax: Math.max(0, Math.min(1, x2 / 640.0)),
            ymax: Math.max(0, Math.min(1, y2 / 640.0))
          }
        });
      }
    }
    return detections;
  }

  private processRawYOLO(data: Float32Array, dims: number[], scoreThreshold: number): YoloDetection[] {
    const numClasses = CLASS_NAMES.length; // 3
    let numAnchors = 8400;
    let channels = 4 + numClasses; // 7

    // Handle transposition if dims are [1, 7, 8400]
    const isTransposed = dims[1] === channels;
    if (isTransposed) {
      numAnchors = dims[2];
    } else {
      numAnchors = dims[1];
    }

    const rawBoxes: { xmin: number; ymin: number; xmax: number; ymax: number; score: number; classId: number }[] = [];

    for (let i = 0; i < numAnchors; i++) {
      let cx: number, cy: number, w: number, h: number;
      let maxScore = -1;
      let bestClassId = -1;

      if (isTransposed) {
        // Data format: [1, 7, 8400]
        cx = data[0 * numAnchors + i];
        cy = data[1 * numAnchors + i];
        w  = data[2 * numAnchors + i];
        h  = data[3 * numAnchors + i];

        for (let c = 0; c < numClasses; c++) {
          const classScore = data[(4 + c) * numAnchors + i];
          if (classScore > maxScore) {
            maxScore = classScore;
            bestClassId = c;
          }
        }
      } else {
        // Data format: [1, 8400, 7]
        const offset = i * channels;
        cx = data[offset + 0];
        cy = data[offset + 1];
        w  = data[offset + 2];
        h  = data[offset + 3];

        for (let c = 0; c < numClasses; c++) {
          const classScore = data[offset + 4 + c];
          if (classScore > maxScore) {
            maxScore = classScore;
            bestClassId = c;
          }
        }
      }

      if (maxScore >= scoreThreshold) {
        // Convert Center [cx, cy, w, h] -> Corner [xmin, ymin, xmax, ymax]
        const xmin = Math.max(0, Math.min(1, (cx - w / 2) / 640.0));
        const ymin = Math.max(0, Math.min(1, (cy - h / 2) / 640.0));
        const xmax = Math.max(0, Math.min(1, (cx + w / 2) / 640.0));
        const ymax = Math.max(0, Math.min(1, (cy + h / 2) / 640.0));

        rawBoxes.push({ xmin, ymin, xmax, ymax, score: maxScore, classId: bestClassId });
      }
    }

    // Apply Non-Maximum Suppression (NMS)
    const nmsBoxes = this.applyNMS(rawBoxes, 0.45);

    return nmsBoxes.map(b => ({
      label: CLASS_NAMES[b.classId] || 'disease',
      score: b.score,
      box: { xmin: b.xmin, ymin: b.ymin, xmax: b.xmax, ymax: b.ymax }
    }));
  }

  private applyNMS(boxes: { xmin: number; ymin: number; xmax: number; ymax: number; score: number; classId: number }[], iouThreshold: number) {
    boxes.sort((a, b) => b.score - a.score);
    const selected: typeof boxes = [];
    const active = new Array(boxes.length).fill(true);

    for (let i = 0; i < boxes.length; i++) {
      if (!active[i]) continue;
      const boxA = boxes[i];
      selected.push(boxA);

      for (let j = i + 1; j < boxes.length; j++) {
        if (!active[j]) continue;
        const boxB = boxes[j];

        if (boxA.classId === boxB.classId) {
          const iou = this.calculateIoU(boxA, boxB);
          if (iou >= iouThreshold) {
            active[j] = false;
          }
        }
      }
    }
    return selected;
  }

  private calculateIoU(boxA: any, boxB: any): number {
    const x1 = Math.max(boxA.xmin, boxB.xmin);
    const y1 = Math.max(boxA.ymin, boxB.ymin);
    const x2 = Math.min(boxA.xmax, boxB.xmax);
    const y2 = Math.min(boxA.ymax, boxB.ymax);

    const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const areaA = (boxA.xmax - boxA.xmin) * (boxA.ymax - boxA.ymin);
    const areaB = (boxB.xmax - boxB.xmin) * (boxB.ymax - boxB.ymin);

    return intersection / (areaA + areaB - intersection);
  }
}