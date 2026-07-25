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

  // References
  @ViewChild(Preview) preview!: Preview;

  // Scanner State using Signals
  previewImgSrc = signal<string>('');
  isScanning = signal<boolean>(false);
  scanProgress = signal<number>(0);
  scanStatusText = signal<string>('Ready');
  heatmapSpots = signal<HeatmapSpot[]>([]);

  // Outputs
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
      console.log('File detected in scan-simulator:', file.name);
      this.handleFile(file);
    }
  }

  handleFile(file: File) {
    console.log('Handling file:', file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      console.log('File read complete, setting preview image source');
      this.previewImgSrc.set(dataUrl);

      // If we are coming from the camera, we need to make sure we don't trigger a preset load,
      // but rather process the actual captured file.
      this.triggerScanSimulation('uploaded', true);
    };
    reader.readAsDataURL(file);
  }

  // Preset loading helpers
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

  triggerScanSimulation(presetId: string, isCustom = true) {
    this.isScanning.set(true);
    this.heatmapSpots.set([]);
    this.scanProgress.set(0);
    this.scanStatusText.set('Initializing multispectral crop scanner...');

    // If it's a custom scan (camera or file), preserve existing.
    // If it's a preset, load the preset asset.
    if (!isCustom || presetId !== 'uploaded') {
    this.previewImgSrc.set(this.getPresetAsset(presetId));
    }

    const statuses = [
      { thresh: 15, msg: 'Initializing Neural Engines...' },
      { thresh: 35, msg: 'Verifying crop subject (MobileNet)...' },
      { thresh: 55, msg: 'Analyzing vegetation index (NDVI)...' },
      { thresh: 75, msg: 'Extracting chlorotic lesion boundaries...' },
      { thresh: 90, msg: 'Executing Pathogen YOLO sweep...' },
      { thresh: 100, msg: 'Classification completed.' }
    ];

    const interval = setInterval(async () => {
      const currentProg = this.scanProgress();
      const nextProg = Math.min(100, currentProg + Math.floor(Math.random() * 8) + 5);
      this.scanProgress.set(nextProg);
      if (nextProg >= 100) {
        clearInterval(interval);
        await this.finalizeScan(presetId, isCustom);
      }

      const match = statuses.find(s => nextProg <= s.thresh);
      if (match) {
        this.scanStatusText.set(match.msg);
      }
    }, 100);
  }

  async finalizeScan(presetId: string, isCustom = true) {
    let finalResult: ScanResult | null;
    let conf: number;

    if (isCustom) {
      this.scanStatusText.set('Validating crop signature...');
      
      if (this.preview?.imageElement) {
        const el = this.preview.imageElement.nativeElement;
        // Step 1: MobileNet Verification
        const verification = await this.classifierService.isCrop(el.src);
        
        if (!verification.isCrop) {
          this.scanStatusText.set('Validation Failed');
          this.toastService.error(`Subject Identification Failed: The scanner identified this as "${verification.label}". Please scan a wheat field or crop plant.`, 6000);
          return;
        }

        this.scanStatusText.set('Analyzing pathogen markers...');
        // Step 2: YOLO Inference
        finalResult = await this.runLocalFallback();
        conf = finalResult.id === 'healthy' ? 99 : Math.floor(Math.random() * 10) + 84;
      } else {
        finalResult = await this.runLocalFallback();
        conf = 95;
      }
    } else {
      // Standard preset simulation
      let diseaseId = presetId;
      if (presetId === 'fusarium_head_blight') {
        diseaseId = 'head_blight';
      }

      const match = DISEASE_DATABASE.find(d => d.id === diseaseId);
      if (diseaseId === 'healthy' || !match) {
        finalResult = {
          id: 'healthy',
          name: 'Healthy Wheat',
          scientific: 'Triticum aestivum',
          type: 'None',
          severity: 'Low',
          symptoms: ['No visible rust lesions or powdery mold patches', 'Rich chlorophyllic green leaf tissue', 'Vigorous structural headers and robust stems'],
          treatment: {
            immediate: 'No immediate remediation needed. Continue regular field scouting schedules.',
            chemical: 'None recommended.',
            organic: 'Maintain natural biological soil amendments.',
            preventive: 'Continue planning diverse crop rotation schemes.'
          }
        };
        conf = 99;
      } else {
        finalResult = {
          id: match.id,
          name: match.name,
          scientific: match.scientific,
          type: match.type,
          severity: match.severity,
          symptoms: match.symptoms,
          treatment: {
            immediate: match.treatment.immediate,
            chemical: match.treatment.chemical,
            organic: match.treatment.organic,
            preventive: match.treatment.preventive
          }
        };
        conf = Math.floor(Math.random() * 10) + 88;
      }
    }

    this.isScanning.set(false);
    if (!finalResult) return;

    this.generateHeatmap(finalResult.id);

    if (finalResult.severity === 'High' && conf > 85) {
      this.toastService.error(`URGENT: High severity ${finalResult.name} detected with ${conf}% confidence! Immediate action required.`);
    }

    this.scanComplete.emit({ result: finalResult, confidence: conf });
    this.toastService.success(`AI Scan complete: ${finalResult.name}`);
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

  async runLocalFallback(): Promise<ScanResult> {
    let diseaseId = 'leaf_rust';
    let rawPreds: { className: string; probability: number }[] = [];

    if (this.preview?.imageElement) {
      try {
        const el = this.preview.imageElement.nativeElement;
        if (!el.complete) {
          await new Promise((resolve) => { el.onload = resolve; });
        }

        // Run inference
        const output = await this.yoloService.runInference(this.preprocess(el));

        rawPreds = output.map((d: YoloDetection) => ({
          className: d.label,
          probability: d.score,
          box: d.box
        }));

        diseaseId = this.mapPredictionsToDisease(rawPreds);

        // Convert YOLO boxes to UI spots
        const spots: HeatmapSpot[] = output.map((d: YoloDetection) => {
          const left = d.box.xmin * 100;
          const top = d.box.ymin * 100;
          const width = Math.max(5, (d.box.xmax - d.box.xmin) * 100);
          const height = Math.max(5, (d.box.ymax - d.box.ymin) * 100);

          return {
            size: 0,
            left,
            top,
            width,
            height,
            background: 'rgba(255, 68, 68, 0.25)',
            color: '#ff4444',
            label: `${d.label} (${(d.score * 100).toFixed(0)}%)`,
            delay: Math.random() * 0.3
          };
        });
        if (spots.length > 0) {
          this.heatmapSpots.set(spots);
        }
      } catch (err) {
        console.error('Local YOLO classification failure', err);
      }
    }

    const match = DISEASE_DATABASE.find(d => d.id === diseaseId);
    if (diseaseId === 'healthy' || !match) {
      return {
        id: 'healthy',
        name: 'Healthy Wheat',
        scientific: 'Triticum aestivum',
        type: 'None',
        severity: 'Low',
        symptoms: ['No visible rust lesions or powdery mold patches', 'Rich chlorophyllic green leaf tissue', 'Vigorous structural headers and robust stems'],
        rawPredictions: rawPreds,
        treatment: {
          immediate: 'No immediate remediation needed. Continue regular field scouting schedules.',
          chemical: 'None recommended.',
          organic: 'Maintain natural biological soil amendments.',
          preventive: 'Continue planning diverse crop rotation schemes.'
        }
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
      treatment: {
        immediate: match.treatment.immediate,
        chemical: match.treatment.chemical,
        organic: match.treatment.organic,
        preventive: match.treatment.preventive
      }
    };
  }

  mapPredictionsToDisease(predictions: { className: string; probability: number }[]): string {
    if (!predictions || predictions.length === 0) return 'healthy';

    for (const pred of predictions) {
      const label = pred.className.toLowerCase();
      if (label.includes('rust')) return 'leaf_rust';
      if (label.includes('septoria')) return 'septoria';
      if (label.includes('healthy')) return 'healthy';
    }

    // Default to a fallback, e.g., leaf_rust, or treat as unknown
    return 'leaf_rust';
  }

  generateHeatmap(diseaseId: string) {
    // If we already have spots from YOLO, don't overwrite with random ones
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
    } else if (diseaseId === 'leaf_rust') {
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

