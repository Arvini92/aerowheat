import { Component, ChangeDetectionStrategy, output, ViewChild, ElementRef, signal, inject, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { ButtonComponent } from '@/src/app/design-system/button/button';
@Component({
  selector: 'app-dropzone',
  standalone: true,
  imports: [CommonModule, MatTooltipModule, MatIconModule, ButtonComponent],
  templateUrl: './dropzone.html',
  styleUrl: './dropzone.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dropzone implements OnDestroy {
  readonly fileSelected = output<Event>();

  @ViewChild('video', { static: false }) video?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas', { static: false }) canvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  private ngZone = inject(NgZone);

  isDragging = signal(false);
  isCameraActive = signal(false);
  capturedImage = signal<string | null>(null);

  ngOnDestroy() {
    this.stopCamera();
  }

  onFileSelected(event: Event): void {
    this.fileSelected.emit(event);
    // Also handle internal state if needed
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

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
      this.fileSelected.emit({ target: { files: files } } as unknown as Event);
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

  async startCamera(event?: Event) {
    if (event) event.stopPropagation();

    this.capturedImage.set(null);
    this.isCameraActive.set(true);

    setTimeout(async () => {
      try {
        if (!this.video) throw new Error('Video element not found');
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
    if (event) event.stopPropagation();
    if (this.video?.nativeElement?.srcObject) {
      const stream = this.video.nativeElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      this.video.nativeElement.srcObject = null;
    }
    this.isCameraActive.set(false);
  }

  capture(event: Event) {
    event.stopPropagation();
    console.log('Capture triggered', { video: this.video, canvas: this.canvas });

    if (!this.video || !this.canvas) {
      console.error('Video or Canvas element is missing', { video: this.video, canvas: this.canvas });
      return;
    }

    const video = this.video.nativeElement;
    const canvas = this.canvas.nativeElement;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      this.capturedImage.set(dataUrl);

      // Update preview directly for immediate visual feedback
      this.fileSelected.emit({ target: { files: [this.dataURItoFile(dataUrl, 'camera-capture.png')] } } as unknown as Event);
    }
    this.stopCamera();
  }

  private dataURItoFile(dataURI: string, filename: string): File {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    return new File([new Blob([ia], { type: mimeString })], filename, { type: mimeString, lastModified: Date.now() });
  }
}
