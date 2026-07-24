import { Injectable } from '@angular/core';
import * as ort from 'onnxruntime-web';

export interface YoloDetection {
  label: string;
  score: number;
  box: { xmin: number; ymin: number; xmax: number; ymax: number };
}

// Adjusted 3-class mapping matching dataset index order (0, 1, 2)
const CLASS_NAMES = [
  'healthy',
  'rust',
  'septoria'
];

@Injectable({
  providedIn: 'root'
})
export class YoloService {
  private session: ort.InferenceSession | undefined;

  async loadModel() {
    ort.env.wasm.wasmPaths = '/assets/wasm/';
    this.session = await ort.InferenceSession.create('/models/YOLO26s/best.onnx');
  }

  async runInference(imageData: Float32Array): Promise<YoloDetection[]> {
    if (!this.session) await this.loadModel();

    const tensor = new ort.Tensor('float32', imageData, [1, 3, 640, 640]);
    const feeds = { [this.session!.inputNames[0]]: tensor };
    const results = await this.session!.run(feeds);

    const outputTensor = results[this.session!.outputNames[0]];
    return this.postProcessYOLO(outputTensor.data as Float32Array, outputTensor.dims as number[]);
  }

  private postProcessYOLO(data: Float32Array, dims: number[], scoreThreshold = 0.20): YoloDetection[] {
    const detections: YoloDetection[] = [];
    const numDetections = dims[1] || 300; // 300
    const numFeatures = dims[2] || 6;    // 6: [xmin, ymin, xmax, ymax, score, class_id]

    let highestScore = 0;

    for (let i = 0; i < numDetections; i++) {
      const offset = i * numFeatures;

      const x1 = data[offset + 0];
      const y1 = data[offset + 1];
      const x2 = data[offset + 2];
      const y2 = data[offset + 3];
      const score = data[offset + 4];
      const classId = Math.round(data[offset + 5]);

      if (score > highestScore) highestScore = score;

      if (score >= scoreThreshold) {
        // Scale pixel values (0-640) directly to normalized [0, 1] range
        const xmin = Math.max(0, Math.min(1, x1 / 640.0));
        const ymin = Math.max(0, Math.min(1, y1 / 640.0));
        const xmax = Math.max(0, Math.min(1, x2 / 640.0));
        const ymax = Math.max(0, Math.min(1, y2 / 640.0));

        detections.push({
          label: CLASS_NAMES[classId] || 'disease',
          score: score,
          box: { xmin, ymin, xmax, ymax }
        });
      }
    }

    return detections;
  }
}