import { Component, ChangeDetectionStrategy, ViewEncapsulation, ViewChild, ElementRef, signal, inject, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-camera-scanner',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="glass-card mt-6" id="camera-scanner-wrapper">
      <!-- Card Header -->
      <div class="card-header pb-3 flex items-center justify-between" id="scanner-header">
        <h3 class="flex items-center gap-2 text-white font-medium text-sm">
          <svg class="w-4 h-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Crop Pathology Scanner
        </h3>
        <span class="text-[9px] text-zinc-400 font-mono tracking-wider uppercase">Field Scan Utility</span>
      </div>

      <!-- Unified Dropzone Element -->
      <div 
        id="dropzone"
        class="relative w-full aspect-[16/10] min-h-[220px] rounded-xl border-2 transition-all duration-300 overflow-hidden flex flex-col items-center justify-center bg-black/40 group cursor-pointer"
        [class.border-primary]="isDragging() || isCameraActive()"
        [class.border-dashed]="!isCameraActive() && !capturedImage()"
        [class.border-zinc-800]="!isDragging() && !isCameraActive() && !capturedImage()"
        [class.bg-emerald-950/10]="isDragging()"
        [class.hover:border-primary/40]="!isCameraActive() && !capturedImage()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="!isCameraActive() && !capturedImage() && triggerFileInput()"
        (keydown.enter)="!isCameraActive() && !capturedImage() && triggerFileInput()"
        (keydown.space)="!isCameraActive() && !capturedImage() && triggerFileInput()"
        role="button"
        tabindex="0"
      >
        <!-- Hidden Input File -->
        <input 
          type="file" 
          #fileInput 
          accept="image/*" 
          class="hidden" 
          (change)="onFileSelected($event)"
        />

        <!-- Hidden Canvas for Capture -->
        <canvas #canvas class="hidden"></canvas>

        <!-- STATE 1: Idle (No camera, no image) -->
        @if (!isCameraActive() && !capturedImage()) {
          <div class="dropzone-content flex flex-col items-center text-center p-6 gap-3 select-none">
            <!-- Glowing icon stack -->
            <div class="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5 group-hover:bg-primary/20 transition-all duration-300">
              <svg class="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>

            <div class="flex flex-col gap-1">
              <h4 class="font-sans font-semibold text-sm text-white transition-colors group-hover:text-primary">Drag & Drop Crop Photo</h4>
              <p class="text-[11px] text-zinc-400">Supports JPG, PNG formats for smart pathology classification</p>
            </div>

            <div class="flex items-center gap-3 w-full max-w-[200px] my-1">
              <div class="h-[1px] bg-zinc-800 flex-grow"></div>
              <span class="text-[8px] text-zinc-500 font-mono uppercase tracking-wider">or</span>
              <div class="h-[1px] bg-zinc-800 flex-grow"></div>
            </div>

            <!-- Camera Activation Trigger -->
            <button 
              type="button" 
              class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-primary/40 hover:bg-zinc-800 text-xs text-zinc-300 hover:text-white transition-all duration-200 shadow-md"
              (click)="startCamera($event)"
            >
              <svg class="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
              Use Live Device Camera
            </button>
          </div>
        }

        <!-- STATE 2: Camera Viewfinder Active -->
        @if (isCameraActive()) {
          <div class="absolute inset-0 w-full h-full flex flex-col justify-between bg-black">
            <video 
              #video 
              class="w-full h-full object-cover" 
              autoplay 
              playsinline
              muted
            ></video>

            <!-- Scanning line overlay effect -->
            <div class="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-scan z-10"></div>
            <div class="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-black/50 pointer-events-none"></div>

            <!-- Camera controls overlay -->
            <div class="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black via-black/90 to-transparent flex items-center justify-between gap-4 z-20">
              <button 
                type="button"
                class="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-900 text-[10px] text-zinc-400 hover:text-white border border-zinc-800 transition-all font-mono"
                (click)="stopCamera($event)"
              >
                Cancel
              </button>

              <!-- Beautiful shutter trigger -->
              <button 
                type="button"
                class="w-12 h-12 rounded-full bg-white hover:bg-zinc-100 flex items-center justify-center shadow-lg transition-all active:scale-95 border-4 border-primary/20 hover:border-primary/40"
                (click)="capture($event)"
                title="Capture Photo"
              >
                <div class="w-6 h-6 rounded-full bg-zinc-950 flex items-center justify-center">
                  <div class="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                </div>
              </button>

              <span class="text-[9px] font-mono text-primary uppercase tracking-widest animate-pulse">LIVE VIEW</span>
            </div>
          </div>
        }

        <!-- STATE 3: Image Selected / Captured Preview -->
        @if (capturedImage()) {
          <div class="absolute inset-0 w-full h-full flex flex-col justify-between bg-zinc-950">
            <img 
              [src]="capturedImage()" 
              alt="Field crop preview" 
              class="w-full h-full object-cover" 
            />

            <!-- Top controls (Clear button) -->
            <div class="absolute top-3 right-3 flex items-center gap-2 z-20">
              <button 
                type="button"
                class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/80 hover:bg-black text-[10px] text-zinc-300 hover:text-white border border-white/10 hover:border-white/20 transition-all font-mono"
                (click)="clearImage($event)"
              >
                <svg class="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear Photo
              </button>
            </div>

            <!-- Analysis ready banner -->
            <div class="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black via-black/85 to-transparent z-10 flex items-center justify-between border-t border-white/5">
              <div class="flex items-center gap-1.5">
                <svg class="w-4 h-4 text-primary animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-[9px] font-mono text-zinc-300 uppercase tracking-wider font-semibold">Image Ready for Pathology sweep</span>
              </div>
              <span class="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">ANALYSIS_READY</span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    #camera-scanner-wrapper {
      background: var(--bg-dark-card);
      border: 1px solid var(--glass-border);
      border-radius: 16px;
      padding: 16px;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }

    @keyframes scan-animation {
      0% { top: 0%; }
      50% { top: 100%; }
      100% { top: 0%; }
    }

    .animate-scan {
      animation: scan-animation 3s linear infinite;
    }
  `]
})
export class CameraScanner implements OnDestroy {
  @ViewChild('video') video?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  private ngZone = inject(NgZone);

  isDragging = signal(false);
  isCameraActive = signal(false);
  capturedImage = signal<string | null>(null);

  ngOnDestroy() {
    this.stopCamera();
  }

  // Drag and Drop support
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  // Trigger click on input file
  triggerFileInput() {
    this.fileInput?.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  private handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.capturedImage.set(e.target?.result as string);
      this.isCameraActive.set(false);
    };
    reader.readAsDataURL(file);
  }

  // Camera operations
  async startCamera(event?: Event) {
    if (event) {
      event.stopPropagation(); // Stop click from propagating to dropzone (which triggers file input)
    }

    this.capturedImage.set(null);
    this.isCameraActive.set(true);

    // Give a microtask for ViewChild of video to render
    setTimeout(async () => {
      try {
        if (!this.video) {
          throw new Error('Video element not found');
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
        this.video.nativeElement.srcObject = stream;
      } catch (err) {
        console.error('Camera access failed:', err);
        this.isCameraActive.set(false);
      }
    }, 50);
  }

  stopCamera(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (this.video?.nativeElement?.srcObject) {
      const stream = this.video.nativeElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      this.video.nativeElement.srcObject = null;
    }
    this.isCameraActive.set(false);
  }

  capture(event: Event) {
    event.stopPropagation();
    if (!this.video || !this.canvas) return;

    const video = this.video.nativeElement;
    const canvas = this.canvas.nativeElement;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      this.capturedImage.set(canvas.toDataURL('image/png'));
    }

    this.stopCamera();
  }

  clearImage(event: Event) {
    event.stopPropagation();
    this.capturedImage.set(null);
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }
}
