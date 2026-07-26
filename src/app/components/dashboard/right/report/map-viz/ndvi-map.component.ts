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
          <p class="text-xs text-zinc-400 font-mono">Streaming Cloud-Optimized GeoTIFF...</p>
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
  private geoRasterLayer: any = null;
  private geoRasterData: any = null;
  private proj4Instance: any = null;
  private hoverRafId: number | null = null;

  readonly loading = signal<boolean>(true);
  readonly hoverData = signal<{ lat: number; lng: number; val: number; color: string; status: string } | null>(null);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => this.initNdviMap(), 100);
      });
    }
  }

  private async initNdviMap(): Promise<void> {
    const container = this.mapContainer.nativeElement;
    
    this.map = L.map(container, {
      zoomControl: false,
      attributionControl: false,
      maxZoom: 16,
      minZoom: 8,
      preferCanvas: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      updateWhenIdle: true
    }).addTo(this.map);

    L.control.zoom({ position: 'topright' }).addTo(this.map);

    await this.loadRealGeoTiff();

    this.map.on('mousemove', this.onMouseMove);
    this.map.on('mouseout', this.onMouseOut);
  }

  private async loadRealGeoTiff(): Promise<void> {
    if (!this.map) return;

    try {
      this.proj4Instance = (await import('proj4')).default;
      if (!(window as any).proj4) {
        (window as any).proj4 = this.proj4Instance;
      }
      this.proj4Instance.defs(
        "EPSG:3005", 
        "+proj=aea +lat_1=50 +lat_2=58.5 +lat_0=45 +lon_0=-126 +x_0=1000000 +y_0=0 +ellps=GRS80 +datum=NAD83 +units=m +no_defs"
      );

      const parseGeoraster = (await import('georaster')).default;
      const GeoRasterLayer = (await import('georaster-layer-for-leaflet')).default;

      const tiffUrl = 'http://localhost:3000/rasters/bc_ndvi_july2026_full.tif';

      const response = await fetch(tiffUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const arrayBuffer = await response.arrayBuffer();
      this.geoRasterData = await parseGeoraster(arrayBuffer);

      this.geoRasterLayer = new GeoRasterLayer({
        georaster: this.geoRasterData,
        opacity: 0.85,
        resolution: 256,
        pixelValuesToColorFn: (pixelValues: any) => {
          const ndvi = pixelValues[0];
          if (ndvi === this.geoRasterData.noDataValue || Number.isNaN(ndvi) || ndvi < -1 || ndvi > 1) {
            return null; 
          }
          return this.ndviToHex(ndvi);
        }
      });

      this.geoRasterLayer.addTo(this.map);
      this.map.fitBounds(this.geoRasterLayer.getBounds());
      
      this.ngZone.run(() => this.loading.set(false));

    } catch (err) {
      console.error('Failed to mount COG:', err);
      this.ngZone.run(() => this.loading.set(false));
    }
  }

  private onMouseMove = (e: L.LeafletMouseEvent): void => {
    if (!this.geoRasterData || !this.map || !this.proj4Instance) return;
    
    if (this.hoverRafId) cancelAnimationFrame(this.hoverRafId);
    
    this.hoverRafId = requestAnimationFrame(() => {
      try {
        // Convert Leaflet mouse lat/lng (EPSG:4326) to raster projection (EPSG:3005)
        const [x, y] = this.proj4Instance("EPSG:4326", "EPSG:3005", [e.latlng.lng, e.latlng.lat]);

        const gr = this.geoRasterData;
        // Compute column and row indices in the raster grid matrix
        const col = Math.floor((x - gr.xmin) / gr.pixelWidth);
        const row = Math.floor((gr.ymax - y) / gr.pixelHeight);

        let val: number | null = null;
        if (row >= 0 && row < gr.height && col >= 0 && col < gr.width) {
          const bandValues = gr.values?.[0];
          if (bandValues && bandValues[row]) {
            val = bandValues[row][col];
          }
        }

        this.ngZone.run(() => {
          if (val !== null && val !== undefined && !Number.isNaN(val) && val !== gr.noDataValue && val >= -1 && val <= 1) {
            this.inspectNdviValue(e.latlng.lat, e.latlng.lng, val);
          } else {
            this.hoverData.set(null);
          }
        });
      } catch (err) {
        this.ngZone.run(() => this.hoverData.set(null));
      }
    });
  };

  private onMouseOut = (): void => {
    if (this.hoverRafId) {
      cancelAnimationFrame(this.hoverRafId);
      this.hoverRafId = null;
    }
    this.ngZone.run(() => this.hoverData.set(null));
  };

  private inspectNdviValue(lat: number, lng: number, val: number): void {
    const color = this.ndviToHex(val);
    
    let status = 'Soil/Road';
    if (val > 0.70) status = 'Dense Wheat (Optimal)';
    else if (val >= 0.50) status = 'Moderate Vigor';
    else if (val >= 0.30) status = 'Early Growth';
    else if (val >= 0.15) status = 'Sparse/Weeds';

    this.hoverData.set({ lat, lng, val, color, status });
  }

  private ndviToRgb(val: number): { r: number; g: number; b: number } {
    if (val < 0.15) return { r: 166, g: 97, b: 26 }; 
    if (val < 0.3) {
      const pct = (val - 0.15) / 0.15;
      return {
        r: Math.round(223 * (1 - pct) + 245 * pct),
        g: Math.round(194 * (1 - pct) + 245 * pct),
        b: Math.round(124 * (1 - pct) + 120 * pct)
      };
    }
    if (val < 0.5) {
      const pct = (val - 0.3) / 0.2;
      return {
        r: Math.round(245 * (1 - pct) + 161 * pct),
        g: Math.round(245 * (1 - pct) + 217 * pct),
        b: Math.round(120 * (1 - pct) + 155 * pct)
      };
    }
    if (val < 0.7) {
      const pct = (val - 0.5) / 0.2;
      return {
        r: Math.round(161 * (1 - pct) + 76 * pct),
        g: Math.round(217 * (1 - pct) + 160 * pct),
        b: Math.round(155 * (1 - pct) + 80 * pct)
      };
    }
    
    const pct = Math.min(1.0, (val - 0.7) / 0.3);
    return {
      r: Math.round(76 * (1 - pct) + 1 * pct),
      g: Math.round(160 * (1 - pct) + 104 * pct),
      b: Math.round(80 * (1 - pct) + 40 * pct)
    };
  }

  private ndviToHex(val: number): string {
    const rgb = this.ndviToRgb(val);
    return '#' + [rgb.r, rgb.g, rgb.b].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  ngOnDestroy(): void {
    if (this.hoverRafId) cancelAnimationFrame(this.hoverRafId);
    
    if (this.geoRasterLayer && this.map) {
      this.geoRasterLayer.remove();
    }
    
    if (this.map) {
      this.map.off('mousemove', this.onMouseMove);
      this.map.off('mouseout', this.onMouseOut);
      this.map.remove();
      this.map = null;
    }
  }
}