import { Component, ChangeDetectionStrategy, input, ViewChild, ElementRef } from '@angular/core';

import { HeatmapSpot } from '../scan-simulator';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [],
  templateUrl: './preview.html',
  styleUrl: './preview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Preview {
  readonly previewImgSrc = input.required<string>();
  readonly heatmapSpots = input.required<HeatmapSpot[]>();
  readonly isScanning = input.required<boolean>();

  @ViewChild('previewImageElement') imageElement!: ElementRef<HTMLImageElement>;
}
