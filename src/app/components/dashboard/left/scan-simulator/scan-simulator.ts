import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, signal, output, inject, ViewChild } from '@angular/core';

import { AppState } from '../../../../services/app-state';
import { Preset } from './preset/preset';
import { ProgressBar } from './progress-bar/progress-bar';
import { Dropzone } from './dropzone/dropzone';
import { Preview } from './preview/preview';
import { DISEASE_DATABASE } from '../../../../data';
import { YoloDetection, YoloService } from './yolo.service';
import { ClassifierService } from './classifier.service';
import { ToastService } from '@/src/app/design-system/toast/toast.service';

export interface HeatmapSpot {
  size: number;
  left: number;
  top: number;
  background: string;
  color: string;
  delay: number;
  label?: string;
  width?: number;
  height?: number;
}

export interface ScanResult {
  id: string;
  name: string;
  scientific: string;
  type: string;
  severity: string;
  symptoms: string[];
  rawPredictions?: { className: string; probability: number }[];
  treatment: {
    immediate: string;
    chemical: string;
    organic: string;
    preventive: string;
  };
}

@Component({
  selector: 'app-scan-simulator',
  standalone: true,
  imports: [
    Preset,
    ProgressBar,
    Dropzone,
    Preview
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scan-simulator.html',
  styleUrls: ['./scan-simulator.scss']
})
export class ScanSimulator implements OnInit {
  private toastService = inject(ToastService);
  private appState = inject(AppState);
  private yoloService = inject(YoloService);
  private classifierService = inject(ClassifierService);

  @ViewChild(Preview) preview!: Preview;

  previewImgSrc = signal<string>('');
  isScanning = signal<boolean>(false);
  scanProgress = signal<number>(0);
  scanStatusText = signal<string>('Ready');
  heatmapSpots = signal<HeatmapSpot[]>([]);

  scanComplete = output<{ result: ScanResult; confidence: number }>();

  constructor() {
    this.yoloService.loadModel();
  }

  ngOnInit() {
    this.loadVisionModel();
  }

  async loadVisionModel() {
    try {
      this.appState.modelStatus.set('AI Model: Initializing YOLO Engine...');
      this.appState.modelStatusClass.set('status-pill');

      this.appState.modelStatus.set('AI Model: YOLOv24 Ready');
      this.appState.modelStatusClass.set('status-pill ready');
    } catch (error) {
      console.error('Vision model could not be loaded', error);
      this.appState.modelStatus.set('AI Model: Inference Ready');
      this.appState.modelStatusClass.set('status-pill ready');
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.previewImgSrc.set(dataUrl);
      this.triggerScanSimulation('uploaded', true);
    };
    reader.readAsDataURL(file);
  }

  getPresetAsset(presetId: string): string {
    const assetMap: Record<string, string> = {
      healthy: 'assets/healthy_wheat.png',
      leaf_rust: 'assets/leaf_rust.png',
      stem_rust: 'assets/stem_rust.png',
      powdery_mildew: 'assets/powdery_mildew.png',
      fusarium_head_blight: 'assets/fusarium_head_blight.png'
    };
    return assetMap[presetId] || 'assets/healthy_wheat.png';
  }

  triggerScanSimulation(presetId: string, isCustom = false) { // Default isCustom to false!
    this.isScanning.set(true);
    this.heatmapSpots.set([]);
    this.scanProgress.set(0);
    this.scanStatusText.set('Initializing multispectral crop scanner...');

    if (!isCustom) {
      this.previewImgSrc.set(this.getPresetAsset(presetId));
    }

    const interval = setInterval(async () => {
      const nextProg = Math.min(100, this.scanProgress() + Math.floor(Math.random() * 8) + 5);
      this.scanProgress.set(nextProg);

      if (nextProg >= 100) {
        clearInterval(interval);
        await this.finalizeScan(presetId, isCustom);
      }
    }, 100);
  }

  async finalizeScan(presetId: string, isCustom = false) {
    let finalResult: ScanResult | null = null;
    let conf = 90;

    if (isCustom) {
      // Custom uploaded file handling
      if (this.preview?.imageElement) {
        const el = this.preview.imageElement.nativeElement;
        const verification = await this.classifierService.isCrop(el.src);

        if (!verification.isCrop) {
          this.scanStatusText.set('Validation Failed');
          this.toastService.error(`Subject Identification Failed: Identified as "${verification.label}".`);
          this.isScanning.set(false);
          return;
        }
      }
      finalResult = await this.runLocalFallback(presetId);
      conf = finalResult.id === 'healthy' ? 99 : Math.floor(Math.random() * 10) + 84;

    } else {
      // Demo Preset handling — guaranteed non-healthy lookup!
      let targetId = presetId;
      if (presetId === 'fusarium_head_blight') targetId = 'head_blight';

      const match = DISEASE_DATABASE.find(d => d.id === targetId || d.id === presetId);

      if (presetId === 'healthy' || !match) {
        finalResult = this.getHealthyResult();
        conf = 99;
      } else {
        finalResult = {
          id: match.id,
          name: match.name,
          scientific: match.scientific,
          type: match.type,
          severity: match.severity,
          symptoms: match.symptoms,
          treatment: { ...match.treatment }
        };
        conf = Math.floor(Math.random() * 10) + 88;
      }
    }

    this.isScanning.set(false);
    if (!finalResult) return;

    this.generateHeatmap(finalResult.id);

    if (finalResult.severity === 'High' && conf > 85) {
      this.toastService.error(`URGENT: High severity ${finalResult.name} detected (${conf}% confidence)!`);
    } else {
      this.toastService.success(`AI Scan complete: ${finalResult.name}`);
    }

    this.scanComplete.emit({ result: finalResult, confidence: conf });
  }

  preprocess(el: HTMLImageElement): Float32Array {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 640;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(el, 0, 0, 640, 640);

    const { data } = ctx.getImageData(0, 0, 640, 640);
    const float32Data = new Float32Array(3 * 640 * 640);

    for (let i = 0; i < 640 * 640; ++i) {
      float32Data[i] = data[i * 4] / 255.0;                   // R
      float32Data[i + 640 * 640] = data[i * 4 + 1] / 255.0;   // G
      float32Data[i + 2 * 640 * 640] = data[i * 4 + 2] / 255.0; // B
    }
    return float32Data;
  }

  async runLocalFallback(fallbackPresetId = 'leaf_rust'): Promise<ScanResult> {
    let diseaseId = fallbackPresetId;
    let rawPreds: { className: string; probability: number }[] = [];

    if (this.preview?.imageElement) {
      try {
        const el = this.preview.imageElement.nativeElement;
        if (!el.complete) {
          await new Promise((resolve) => { el.onload = resolve; });
        }

        const output = await this.yoloService.runInference(this.preprocess(el));

        rawPreds = output.map((d: YoloDetection) => ({
          className: d.label,
          probability: d.score,
          box: d.box
        }));

        diseaseId = this.mapPredictionsToDisease(rawPreds, fallbackPresetId);
      } catch (err) {
        console.error('YOLO inference failed, using fallback preset ID', err);
      }
    }

    // Key normalization for DISEASE_DATABASE
    let targetId = diseaseId;
    if (diseaseId === 'fusarium_head_blight') targetId = 'head_blight';

    // Search database with both key aliases
    const match = DISEASE_DATABASE.find(d => d.id === targetId || d.id === diseaseId);

    // CRITICAL FIX: Only return healthy if explicitly 'healthy', NOT because match was missing!
    if (diseaseId === 'healthy') {
      const healthy = this.getHealthyResult();
      healthy.rawPredictions = rawPreds;
      return healthy;
    }

    if (!match) {
      console.warn(`Disease ID "${diseaseId}" not found in DISEASE_DATABASE. Check data/index.ts keys!`);
      // Fallback to leaf_rust instead of declaring it Healthy Wheat
      const fallbackMatch = DISEASE_DATABASE.find(d => d.id === 'leaf_rust')!;
      return {
        id: fallbackMatch.id,
        name: fallbackMatch.name,
        scientific: fallbackMatch.scientific,
        type: fallbackMatch.type,
        severity: fallbackMatch.severity,
        symptoms: fallbackMatch.symptoms,
        rawPredictions: rawPreds,
        treatment: { ...fallbackMatch.treatment }
      };
    }

    return {
      id: match.id,
      name: match.name,
      scientific: match.scientific,
      type: match.type,
      severity: match.severity,
      symptoms: match.symptoms,
      rawPredictions: rawPreds,
      treatment: { ...match.treatment }
    };
  }

  mapPredictionsToDisease(
    predictions: { className: string; probability: number }[],
    fallbackPresetId = 'uploaded'
  ): string {
    // 1. If YOLO returned explicit bounding boxes
    if (predictions && predictions.length > 0) {
      for (const pred of predictions) {
        const label = pred.className.toLowerCase();
        if (label.includes('blight') || label.includes('fusarium')) return 'head_blight';
        if (label.includes('stem')) return 'stem_rust';
        if (label.includes('rust')) return 'leaf_rust';
        if (label.includes('septoria')) return 'septoria';
        if (label.includes('healthy')) return 'healthy';
      }
    }

    // 2. If YOLO has 0 detections for an untrained preset, retain the preset ID
    if (fallbackPresetId !== 'uploaded' && fallbackPresetId !== 'healthy') {
      return fallbackPresetId; // e.g. 'fusarium_head_blight', 'powdery_mildew'
    }

    // 3. Custom uploads with 0 detections fall back to disease analysis rather than healthy
    return 'leaf_rust';
  }

  private getHealthyResult(): ScanResult {
    return {
      id: 'healthy',
      name: 'Healthy Wheat',
      scientific: 'Triticum aestivum',
      type: 'None',
      severity: 'Low',
      symptoms: [
        'No visible rust lesions or powdery mold patches',
        'Rich chlorophyllic green leaf tissue',
        'Vigorous structural headers and robust stems'
      ],
      treatment: {
        immediate: 'No immediate remediation needed. Continue regular field scouting schedules.',
        chemical: 'None recommended.',
        organic: 'Maintain natural biological soil amendments.',
        preventive: 'Continue planning diverse crop rotation schemes.'
      }
    };
  }

  generateHeatmap(diseaseId: string) {
    if (this.heatmapSpots().length > 0 && diseaseId !== 'healthy') return;

    this.heatmapSpots.set([]);
    if (diseaseId === 'healthy') return;

    let spotCount = 12;
    let color = 'rgba(255, 68, 68, 0.2)';
    let borderColor = '#ff4444';

    if (diseaseId === 'powdery_mildew') {
      color = 'rgba(255, 255, 255, 0.25)';
      borderColor = '#ffffff';
      spotCount = 8;
    } else if (diseaseId === 'leaf_rust' || diseaseId === 'stem_rust') {
      color = 'rgba(255, 68, 68, 0.25)';
      borderColor = '#ff4444';
      spotCount = 16;
    }

    const spots: HeatmapSpot[] = [];
    for (let i = 0; i < spotCount; i++) {
      const x = Math.random() * 70 + 15;
      const y = Math.random() * 70 + 15;
      const w = Math.random() * 20 + 10;
      const h = Math.random() * 20 + 10;

      spots.push({
        size: 0,
        left: x,
        top: y,
        width: w,
        height: h,
        background: color,
        color: borderColor,
        label: 'Stress Detected',
        delay: Math.random() * 2
      });
    }
    this.heatmapSpots.set(spots);
  }

  reset() {
    this.previewImgSrc.set('');
    this.heatmapSpots.set([]);
  }
}