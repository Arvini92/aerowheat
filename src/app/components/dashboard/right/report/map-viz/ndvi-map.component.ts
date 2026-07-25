import { Component, OnInit, OnDestroy, ElementRef, ViewChild, inject, NgZone, PLATFORM_ID, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-ndvi-map',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full h-full bg-slate-950 flex flex-col" id="ndvi-map-container">
      <!-- Loading State -->
      @if (loading()) {
        <div class="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm" id="ndvi-loading">
          <div class="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3"></div>
          <p class="text-xs text-zinc-400 font-mono">Initializing NDVI Raster Layers...</p>
        </div>
      }

      <!-- Interactive Map Frame -->
      <div #mapContainer class="w-full h-full flex-grow relative z-10" id="ndvi-leaflet-map"></div>

      <!-- Hover Info Floating Badge -->
      @if (hoverData()) {
        <div class="absolute bottom-12 left-3 z-20 bg-slate-900/95 border border-white/10 px-2.5 py-1.5 rounded shadow-lg text-[10px] font-mono text-zinc-300 pointer-events-none flex flex-col gap-0.5" id="ndvi-hover-badge">
          <div class="text-zinc-500">Coordinate Inspector</div>
          <div>Lat: <span class="text-zinc-300">{{ hoverData()?.lat?.toFixed(5) }}</span></div>
          <div>Lng: <span class="text-zinc-300">{{ hoverData()?.lng?.toFixed(5) }}</span></div>
          <div class="mt-1 pt-1 border-t border-white/5 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full" [style.backgroundColor]="hoverData()?.color"></span>
            <span class="text-white font-bold">NDVI: {{ hoverData()?.val?.toFixed(2) }}</span>
            <span class="text-[9px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{{ hoverData()?.status }}</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class NdviMapComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  private map: L.Map | null = null;
  private canvasLayer: L.GridLayer | null = null;

  readonly loading = signal<boolean>(true);
  readonly hoverData = signal<{ lat: number; lng: number; val: number; color: string; status: string } | null>(null);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => {
          this.initNdviMap();
        }, 100);
      });
    }
  }

  private initNdviMap(): void {
    const container = this.mapContainer.nativeElement;
    
    // Centered around Southern BC Wheat Basin (same coordinates as standard map)
    const centerLat = 49.15;
    const centerLng = -122.05;

    this.map = L.map(container, {
      center: [centerLat, centerLng],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
      maxZoom: 16,
      minZoom: 10
    });

    // Add high-contrast dark GIS basemap
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    }).addTo(this.map);

    // Add standard zoom control at top-right
    L.control.zoom({ position: 'topright' }).addTo(this.map);

    // Render detailed custom NDVI Grid Layer on a Canvas
    this.createNdviCanvasLayer();

    // Register interactive mouse/move handlers to inspect raster values
    this.map.on('mousemove', (e: L.LeafletMouseEvent) => {
      this.ngZone.run(() => {
        this.inspectNdviValue(e.latlng.lat, e.latlng.lng);
      });
    });

    this.map.on('mouseout', () => {
      this.ngZone.run(() => {
        this.hoverData.set(null);
      });
    });

    // Set loading finished
    this.ngZone.run(() => {
      this.loading.set(false);
    });
  }

  private createNdviCanvasLayer(): void {
    if (!this.map) return;

    const NdviCanvasClass = L.GridLayer.extend({
      createTile: (coords: L.Coords) => {
        const tile = document.createElement('canvas');
        const size = 256;
        tile.width = size;
        tile.height = size;

        const ctx = tile.getContext('2d');
        if (!ctx) return tile;

        // Generate synthetic but realistic micro-NDVI noise patterns based on coordinates
        // This simulates actual crop vigor variance across fields
        const imgData = ctx.createImageData(size, size);
        const data = imgData.data;

        const tileLatMin = this.tile2lat(coords.y, coords.z);
        const tileLatMax = this.tile2lat(coords.y + 1, coords.z);
        const tileLngMin = this.tile2lon(coords.x, coords.z);
        const tileLngMax = this.tile2lon(coords.x + 1, coords.z);

        const latDiff = tileLatMax - tileLatMin;
        const lngDiff = tileLngMax - tileLngMin;

        for (let y = 0; y < size; y += 4) {
          const pixelLat = tileLatMin + (y / size) * latDiff;
          for (let x = 0; x < size; x += 4) {
            const pixelLng = tileLngMin + (x / size) * lngDiff;

            // Compute realistic multi-frequency noise representing farm land vs soil vs forest
            const ndviVal = this.getNdviValueAt(pixelLat, pixelLng);
            const color = this.ndviToRgb(ndviVal);

            // Fill 4x4 block for performance
            for (let dy = 0; dy < 4; dy++) {
              if (y + dy >= size) break;
              for (let dx = 0; dx < 4; dx++) {
                if (x + dx >= size) break;
                const idx = ((y + dy) * size + (x + dx)) * 4;
                data[idx] = color.r;     // R
                data[idx + 1] = color.g; // G
                data[idx + 2] = color.b; // B
                data[idx + 3] = 160;     // Semi-transparent opacity (0.6)
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        return tile;
      }
    });

    this.canvasLayer = new (NdviCanvasClass as new () => L.GridLayer)();
    if (this.canvasLayer) {
      this.canvasLayer.addTo(this.map);
    }
  }

  private tile2lat(y: number, z: number): number {
    const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  }

  private tile2lon(x: number, z: number): number {
    return (x / Math.pow(2, z)) * 360 - 180;
  }

  // Pure mathematical functions to calculate extremely realistic NDVI patterns
  private getNdviValueAt(lat: number, lng: number): number {
    // Southern BC basin coordinates: ~49.15 Lat, ~-122.05 Lng
    // Define a realistic bounding region for agriculture
    const distToCenter = Math.sqrt(Math.pow(lat - 49.15, 2) + Math.pow(lng - (-122.05), 2));
    
    // Outside the basin is mostly soil/urban/forest
    if (distToCenter > 0.15) {
      // Background NDVI (forest / mountains has ~0.35, urban has ~0.15)
      const noise = Math.sin(lat * 800) * Math.cos(lng * 800) * 0.1;
      return Math.max(0.12, 0.3 + noise);
    }

    // Grid simulation representing farm structures, plots, and access roads
    const gridX = Math.floor(lng * 300);
    const gridY = Math.floor(lat * 300);
    const plotHash = Math.abs(Math.sin(gridX * 12.9898 + gridY * 78.233) * 43758.5453) % 1.0;

    // Simulate farm roads / dividers where NDVI drops below 0.2
    const insideGridX = (lng * 300) % 1;
    const insideGridY = (lat * 300) % 1;
    if (insideGridX < 0.08 || insideGridY < 0.08) {
      return 0.18 + Math.random() * 0.04; // Soil / Road
    }

    // Determine Plot Base Health
    let baseHealth: number;
    if (plotHash > 0.7) {
      baseHealth = 0.82;      // Healthy wheat fields (NDVI ~0.8)
    } else if (plotHash > 0.4) {
      baseHealth = 0.65; // Normal crop vigor
    } else if (plotHash > 0.25) {
      baseHealth = 0.48; // Moderate water stress / early weed
    } else {
      baseHealth = 0.32;                     // Severely dry / tilled soil
    }

    // Add organic intra-field variation (micro-gradients)
    const microNoise = Math.sin(lat * 2000) * Math.cos(lng * 2000) * 0.06;
    const finalNdvi = baseHealth + microNoise;

    // Clamp between -0.1 and 1.0
    return Math.max(-0.1, Math.min(1.0, finalNdvi));
  }

  private ndviToRgb(val: number): { r: number; g: number; b: number } {
    // NDVI Colormap scale (standard vegetation index coloring):
    // < 0.1: Water / Snow / Road -> Yellow-White / Gray
    // 0.1 - 0.3: Bare Soil -> Light Yellow / Beige
    // 0.3 - 0.5: Sparse vegetation -> Light Green / Yellowish Green
    // 0.5 - 0.7: Moderate canopy -> Medium Green
    // >= 0.7: High dense canopy / Healthy wheat -> Deep Emerald Green

    if (val < 0.15) {
      return { r: 166, g: 97, b: 26 }; // Rich soil brown
    } else if (val < 0.3) {
      // Blend Soil to Sparse (Beige/Yellow to Light Green)
      const pct = (val - 0.15) / 0.15;
      return {
        r: Math.round(223 * (1 - pct) + 245 * pct),
        g: Math.round(194 * (1 - pct) + 245 * pct),
        b: Math.round(124 * (1 - pct) + 120 * pct)
      };
    } else if (val < 0.5) {
      // Light Green
      const pct = (val - 0.3) / 0.2;
      return {
        r: Math.round(245 * (1 - pct) + 161 * pct),
        g: Math.round(245 * (1 - pct) + 217 * pct),
        b: Math.round(120 * (1 - pct) + 155 * pct)
      };
    } else if (val < 0.7) {
      // Medium Forest Green
      const pct = (val - 0.5) / 0.2;
      return {
        r: Math.round(161 * (1 - pct) + 76 * pct),
        g: Math.round(217 * (1 - pct) + 160 * pct),
        b: Math.round(155 * (1 - pct) + 80 * pct)
      };
    } else {
      // Deep Emerald Green
      const pct = Math.min(1.0, (val - 0.7) / 0.3);
      return {
        r: Math.round(76 * (1 - pct) + 1 * pct),
        g: Math.round(160 * (1 - pct) + 104 * pct),
        b: Math.round(80 * (1 - pct) + 40 * pct)
      };
    }
  }

  private ndviToHex(val: number): string {
    const rgb = this.ndviToRgb(val);
    return '#' + [rgb.r, rgb.g, rgb.b].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  private inspectNdviValue(lat: number, lng: number): void {
    const val = this.getNdviValueAt(lat, lng);
    const color = this.ndviToHex(val);
    
    let status = 'Soil/Road';
    if (val > 0.70) status = 'Dense Wheat (Optimal)';
    else if (val >= 0.50) status = 'Moderate Vigor';
    else if (val >= 0.30) status = 'Early Growth';
    else if (val >= 0.15) status = 'Sparse/Weeds';

    this.hoverData.set({ lat, lng, val, color, status });
  }

  ngOnDestroy(): void {
    if (this.canvasLayer && this.map) {
      this.canvasLayer.remove();
    }
    if (this.map) {
      this.map.off();
      this.map.remove();
      this.map = null;
    }
  }
}
