import {
  Component,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  signal,
  computed,
  ViewEncapsulation,
  NgZone,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

export interface FarmField {
  id: string;
  name: string;
  districtId: string;
  districtName: string;
  crop: string;
  acreage: number;
  ndvi: number;
  ndre: number;
  moisture: number;
  status: 'Optimal' | 'Warning' | 'High Risk';
  issue: string;
  recommendation: string;
  lat: number;
  lng: number;
  polygon: [number, number][];
  isPivot?: boolean;
}

export interface DistrictOverview {
  id: string;
  name: string;
  cropType: string;
  avgNdvi: number;
  fieldsCount: number;
  alertCount: number;
  center: [number, number];
}

const DISTRICT_LIST: DistrictOverview[] = [
  { id: 'peace-river', name: 'Peace River Grain Belt', cropType: 'Hard Red Spring Wheat', avgNdvi: 0.74, fieldsCount: 124, alertCount: 3, center: [56.242, -120.850] },
  { id: 'okanagan', name: 'Okanagan Valley', cropType: 'Soft White Winter Wheat', avgNdvi: 0.65, fieldsCount: 85, alertCount: 2, center: [49.882, -119.495] },
  { id: 'fraser-valley', name: 'Fraser Valley Delta', cropType: 'Organic Soft Red Wheat', avgNdvi: 0.81, fieldsCount: 142, alertCount: 1, center: [49.052, -122.305] },
  { id: 'vancouver-island', name: 'Vancouver Island', cropType: 'Heritage Specialty Wheat', avgNdvi: 0.72, fieldsCount: 68, alertCount: 1, center: [48.582, -123.405] },
];

const FARM_FIELDS: FarmField[] = [
  {
    id: 'f-101',
    name: 'Pivot Field #1A (North Sector)',
    districtId: 'peace-river',
    districtName: 'Peace River Grain Belt',
    crop: 'Hard Red Spring Wheat',
    acreage: 160,
    ndvi: 0.82,
    ndre: 0.71,
    moisture: 72,
    status: 'Optimal',
    issue: 'Uniform canopy density. Vigorous chlorophyll absorption detected.',
    recommendation: 'Maintain standard irrigation schedule. Routine satellite sweep in 5 days.',
    lat: 56.245,
    lng: -120.855,
    isPivot: true,
    polygon: [
      [56.248, -120.860], [56.248, -120.850], [56.242, -120.850], [56.242, -120.860]
    ]
  },
  {
    id: 'f-102',
    name: 'Sector #2B (East Margin)',
    districtId: 'peace-river',
    districtName: 'Peace River Grain Belt',
    crop: 'Hard Red Spring Wheat',
    acreage: 120,
    ndvi: 0.38,
    ndre: 0.31,
    moisture: 42,
    status: 'High Risk',
    issue: 'Severe Stripe Rust (Puccinia striiformis) spot with canopy chlorosis.',
    recommendation: 'Urgent: Apply targeted triazole fungicide (Tebuconazole 250 EC) within 24-48 hrs.',
    lat: 56.248,
    lng: -120.838,
    polygon: [
      [56.252, -120.845], [56.252, -120.830], [56.244, -120.830], [56.244, -120.845]
    ]
  },
  {
    id: 'f-103',
    name: 'Pivot Field #3C (South Sector)',
    districtId: 'peace-river',
    districtName: 'Peace River Grain Belt',
    crop: 'Durum Wheat',
    acreage: 145,
    ndvi: 0.62,
    ndre: 0.54,
    moisture: 55,
    status: 'Warning',
    issue: 'Moderate nitrogen depletion observed along southwestern irrigation line.',
    recommendation: 'Apply liquid UAN fertigation boost during next pivot cycle.',
    lat: 56.236,
    lng: -120.862,
    isPivot: true,
    polygon: [
      [56.240, -120.870], [56.240, -120.855], [56.232, -120.855], [56.232, -120.870]
    ]
  },
  {
    id: 'f-201',
    name: 'Okanagan Field #402',
    districtId: 'okanagan',
    districtName: 'Okanagan Valley',
    crop: 'Soft White Winter Wheat',
    acreage: 95,
    ndvi: 0.45,
    ndre: 0.40,
    moisture: 38,
    status: 'Warning',
    issue: 'Canopy water deficit due to high ambient temperature (31°C).',
    recommendation: 'Increase variable-rate irrigation volume by +15% overnight.',
    lat: 49.882,
    lng: -119.495,
    polygon: [
      [49.886, -119.502], [49.886, -119.488], [49.878, -119.488], [49.878, -119.502]
    ]
  },
  {
    id: 'f-301',
    name: 'Fraser Delta Plot #12',
    districtId: 'fraser-valley',
    districtName: 'Fraser Valley Delta',
    crop: 'Organic Soft Red Wheat',
    acreage: 110,
    ndvi: 0.85,
    ndre: 0.78,
    moisture: 84,
    status: 'Optimal',
    issue: 'High leaf area index. Optimal soil moisture and organic nitrogen.',
    recommendation: 'No chemical intervention needed. Organic certified status verified.',
    lat: 49.052,
    lng: -122.305,
    polygon: [
      [49.056, -122.312], [49.056, -122.298], [49.048, -122.298], [49.048, -122.312]
    ]
  },
  {
    id: 'f-401',
    name: 'Saanich Heritage Plot',
    districtId: 'vancouver-island',
    districtName: 'Vancouver Island',
    crop: 'Heritage Specialty Wheat',
    acreage: 75,
    ndvi: 0.58,
    ndre: 0.49,
    moisture: 79,
    status: 'Warning',
    issue: 'High relative humidity causing localized Septoria tritici leaf spot.',
    recommendation: 'Apply bio-fungicide copper spray on perimeter rows.',
    lat: 48.582,
    lng: -123.405,
    polygon: [
      [48.586, -123.412], [48.586, -123.398], [48.578, -123.398], [48.578, -123.412]
    ]
  }
];

import { Icon } from '../../../../../design-system/icon/icon';

@Component({
  selector: 'app-map-viz',
  standalone: true,
  imports: [CommonModule, FormsModule, Icon],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="gis-map-card" id="gis-map-card-wrapper">
      
      <!-- Top Control Header -->
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2" id="gis-header-bar">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-500/20">
            <app-icon size="sm" class="text-emerald-400">map</app-icon>
          </div>
          <div>
            <h4 class="font-sans font-bold text-xs text-white leading-none tracking-wide">Interactive Farm Satellite & Field GIS Map</h4>
            <p class="text-[10px] text-zinc-400 leading-tight mt-0.5">High-Resolution Multi-Spectrum Satellite Telemetry</p>
          </div>
        </div>

        <!-- Spectrum Index Tabs -->
        <div class="flex items-center gap-1 bg-slate-900/90 border border-white/10 p-0.5 rounded-lg" id="spectrum-switcher-tabs">
          <button 
            class="spec-btn" 
            [class.active]="activeSpectrum() === 'ndvi'" 
            (click)="setSpectrum('ndvi')"
            title="Normalized Difference Vegetation Index"
            id="tab-spec-ndvi"
          >
            NDVI
          </button>
          <button 
            class="spec-btn" 
            [class.active]="activeSpectrum() === 'ndre'" 
            (click)="setSpectrum('ndre')"
            title="Red-Edge Chlorophyll Index"
            id="tab-spec-ndre"
          >
            NDRE
          </button>
          <button 
            class="spec-btn" 
            [class.active]="activeSpectrum() === 'moisture'" 
            (click)="setSpectrum('moisture')"
            title="Canopy Water Stress Index"
            id="tab-spec-moisture"
          >
            Water
          </button>
          <button 
            class="spec-btn" 
            [class.active]="activeSpectrum() === 'disease'" 
            (click)="setSpectrum('disease')"
            title="Pathogen Infection Risk Map"
            id="tab-spec-disease"
          >
            Risk
          </button>
        </div>
      </div>

      <!-- District Quick Filter Chips -->
      <div class="flex items-center justify-between gap-1 mb-2 overflow-x-auto pb-0.5" id="district-filter-chips">
        <div class="flex items-center gap-1">
          <button 
            class="dist-chip" 
            [class.active]="selectedDistrictId() === 'all'" 
            (click)="filterDistrict('all')"
            id="chip-district-all"
          >
            All Districts
          </button>
          @for (d of districts; track d.id) {
            <button 
              class="dist-chip" 
              [class.active]="selectedDistrictId() === d.id" 
              (click)="filterDistrict(d.id)"
              id="chip-district-{{ d.id }}"
            >
              {{ d.name }}
            </button>
          }
        </div>

        <!-- Stressed Filter Toggle -->
        <button 
          class="alert-filter-btn flex items-center gap-1 flex-shrink-0" 
          [class.active]="onlyAlerts()" 
          (click)="toggleOnlyAlerts()"
          id="btn-toggle-only-alerts"
        >
          <span class="w-2 h-2 rounded-full" [class.bg-rose-500]="onlyAlerts()" [class.bg-zinc-500]="!onlyAlerts()"></span>
          <span>Alert Plots Only</span>
        </button>
      </div>

      <!-- MAP CONTAINER (300px height for rich visualization) -->
      <div class="map-viewport relative bg-slate-950 border border-white/10 rounded-lg overflow-hidden mb-2" id="map-viewport-container">
        
        <!-- Satellite / Basemap Switcher Floating Overlay -->
        <div class="absolute top-2 right-2 z-20 flex items-center gap-1 bg-slate-900/90 backdrop-blur border border-white/10 rounded p-1 text-[10px]" id="map-basemap-toggle-box">
          <button 
            class="map-sub-btn" 
            [class.active]="basemap() === 'satellite'" 
            (click)="setBasemap('satellite')"
            id="btn-bm-satellite"
          >
            Satellite
          </button>
          <button 
            class="map-sub-btn" 
            [class.active]="basemap() === 'street'" 
            (click)="setBasemap('street')"
            id="btn-bm-street"
          >
            Terrain
          </button>
          <button 
            class="map-sub-btn" 
            [class.active]="basemap() === 'dark'" 
            (click)="setBasemap('dark')"
            id="btn-bm-dark"
          >
            GIS Dark
          </button>
        </div>

        <!-- Reset Zoom Button -->
        @if (selectedField()) {
          <div class="absolute top-2 left-2 z-20" id="reset-field-zoom-box">
            <button class="reset-chip flex items-center gap-1 text-[10px]" (click)="resetFieldSelection()" id="btn-reset-field-selection">
              <app-icon size="xs">arrow_back</app-icon>
              <span>Fit Overview</span>
            </button>
          </div>
        }

        <!-- Leaflet Canvas Element -->
        <div class="w-full h-[300px] min-h-[280px] relative z-10" id="map-canvas-host">
          <div #mapContainer class="w-full h-full min-h-[280px] block relative z-10" id="leaflet-map-element-box"></div>
        </div>

        <!-- Legend Ribbon -->
        <div class="map-legend-ribbon px-2 py-1.5 bg-slate-950/95 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-zinc-400 z-20" id="map-legend-ribbon">
          <div class="flex items-center gap-1.5">
            <span class="text-zinc-500">Active Spectrum Overlay:</span>
            <span class="text-emerald-400 font-bold uppercase">{{ activeSpectrum() }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Optimal (&ge;0.70)</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Warning (0.50-0.69)</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span> High Risk (&lt;0.50)</span>
          </div>
        </div>
      </div>

      <!-- SELECTED FIELD DETAIL CARD -->
      @if (selectedField(); as field) {
        <div class="field-inspector-card bg-slate-900/90 border border-emerald-500/40 rounded-lg p-2.5 flex flex-col gap-2" id="field-inspector-panel">
          <div class="flex items-center justify-between border-b border-white/10 pb-1.5">
            <div>
              <div class="flex items-center gap-1.5">
                <span class="status-badge-sm" [class.red]="field.status === 'High Risk'" [class.yellow]="field.status === 'Warning'" [class.green]="field.status === 'Optimal'">
                  {{ field.status }}
                </span>
                <span class="text-[10px] font-mono text-zinc-400">{{ field.districtName }}</span>
              </div>
              <h5 class="text-white font-bold text-xs mt-0.5" id="inspector-field-name">{{ field.name }}</h5>
            </div>

            <button class="text-zinc-400 hover:text-white p-1" (click)="resetFieldSelection()" title="Deselect field" id="btn-close-field-inspector">
              <app-icon size="sm">close</app-icon>
            </button>
          </div>

          <!-- Telemetry Grid -->
          <div class="grid grid-cols-4 gap-1.5" id="inspector-telemetry-grid">
            <div class="telemetry-cell">
              <span class="lbl">Crop Type</span>
              <span class="val text-amber-300 truncate">{{ field.crop }}</span>
            </div>
            <div class="telemetry-cell">
              <span class="lbl">NDVI Vigor</span>
              <span class="val" [class.text-emerald-400]="field.ndvi >= 0.7" [class.text-amber-400]="field.ndvi >= 0.5 && field.ndvi < 0.7" [class.text-rose-400]="field.ndvi < 0.5">
                {{ field.ndvi.toFixed(2) }}
              </span>
            </div>
            <div class="telemetry-cell">
              <span class="lbl">NDRE Red-Edge</span>
              <span class="val text-blue-400">{{ field.ndre.toFixed(2) }}</span>
            </div>
            <div class="telemetry-cell">
              <span class="lbl">Soil Moisture</span>
              <span class="val text-cyan-400">{{ field.moisture }}%</span>
            </div>
          </div>

          <!-- Observation & Prescription -->
          <div class="bg-slate-950/80 rounded border border-white/5 p-2 text-[10.5px]" id="inspector-prescription-box">
            <div class="text-zinc-300 font-medium mb-1 flex items-center gap-1">
              <app-icon size="xs" class="text-emerald-400">info</app-icon>
              <span>{{ field.issue }}</span>
            </div>
            <div class="text-emerald-400 font-semibold text-[10px] uppercase font-mono">Prescription:</div>
            <p class="text-zinc-200 text-[10.5px] leading-snug mt-0.5">{{ field.recommendation }}</p>
          </div>
        </div>
      } @else {
        <!-- Quick Select Prompt Bar -->
        <div class="bg-slate-900/60 border border-white/5 rounded-lg p-2 flex items-center justify-between text-[10.5px] text-zinc-400" id="prompt-select-field-bar">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Click any farm plot or circular pivot on the map to inspect satellite spectral metrics.</span>
          </div>
          <span class="font-mono text-[9.5px] text-zinc-500">{{ activeFields().length }} Active Plots</span>
        </div>
      }

    </div>
  `,
  styles: `
    app-map-viz {
      display: block;
      width: 100%;
      box-sizing: border-box;
    }

    .gis-map-card {
      background: rgba(15, 23, 42, 0.85) !important;
      backdrop-filter: blur(12px) !important;
      -webkit-backdrop-filter: blur(12px) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      border-radius: 12px;
      padding: 10px;
    }

    .leaflet-container {
      width: 100% !important;
      height: 100% !important;
      min-height: 280px !important;
      background: #090d16 !important;
      font-family: inherit !important;
    }

    /* Spectrum Buttons */
    .spec-btn {
      background: transparent;
      border: none;
      color: #9ca3af;
      padding: 2px 7px;
      font-size: 9.5px;
      font-family: monospace;
      font-weight: 600;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .spec-btn:hover {
      color: #ffffff;
    }

    .spec-btn.active {
      background: rgba(16, 185, 129, 0.25);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.4);
    }

    /* District Chips */
    .dist-chip {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 1.5px 7px;
      font-size: 9.5px;
      font-family: monospace;
      color: #9ca3af;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }

    .dist-chip:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .dist-chip.active {
      background: rgba(16, 185, 129, 0.18);
      border-color: rgba(16, 185, 129, 0.4);
      color: #10b981;
      font-weight: 600;
    }

    /* Alert Filter Button */
    .alert-filter-btn {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 1.5px 7px;
      font-size: 9.5px;
      font-family: monospace;
      color: #9ca3af;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .alert-filter-btn.active {
      background: rgba(244, 63, 94, 0.15);
      border-color: rgba(244, 63, 94, 0.4);
      color: #fb7185;
      font-weight: 600;
    }

    /* Map Sub Controls */
    .map-sub-btn {
      background: transparent;
      border: none;
      color: #9ca3af;
      padding: 1px 6px;
      border-radius: 3px;
      cursor: pointer;
    }

    .map-sub-btn.active {
      background: rgba(16, 185, 129, 0.3);
      color: #10b981;
      font-weight: 600;
    }

    .reset-chip {
      background: rgba(0, 0, 0, 0.85);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #10b981;
      padding: 2px 6px;
      border-radius: 5px;
      cursor: pointer;
      backdrop-filter: blur(4px);
    }

    /* Status Badges */
    .status-badge-sm {
      font-size: 8.5px;
      font-family: monospace;
      font-weight: 700;
      text-transform: uppercase;
      padding: 1px 5px;
      border-radius: 4px;
    }

    .status-badge-sm.green {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .status-badge-sm.yellow {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .status-badge-sm.red {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .telemetry-cell {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 5px;
      padding: 3px 5px;
      display: flex;
      flex-direction: column;
    }

    .telemetry-cell .lbl {
      font-size: 8px;
      font-family: monospace;
      color: #9ca3af;
      text-transform: uppercase;
    }

    .telemetry-cell .val {
      font-size: 10px;
      font-weight: 700;
      margin-top: 1px;
    }

    /* Tooltip styling */
    .farm-field-tooltip {
      background: #090d16 !important;
      border: 1px solid rgba(16, 185, 129, 0.5) !important;
      border-radius: 6px !important;
      color: #ffffff !important;
      font-family: monospace !important;
      font-size: 10px !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.6) !important;
      padding: 4px 8px !important;
    }

    .field-pin-pulse {
      width: 12px;
      height: 12px;
      background: #10b981;
      border: 2px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 8px #10b981;
    }

    .field-pin-pulse.alert {
      background: #ef4444;
      box-shadow: 0 0 10px #ef4444;
    }
  `,
})
export class MapViz implements AfterViewInit, OnDestroy {
  private readonly ngZone = inject(NgZone);

  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  // Component Signals
  readonly districts = DISTRICT_LIST;
  readonly selectedDistrictId = signal<string>('all');
  readonly activeSpectrum = signal<'ndvi' | 'ndre' | 'moisture' | 'disease'>('ndvi');
  readonly selectedField = signal<FarmField | null>(null);
  readonly onlyAlerts = signal<boolean>(false);
  readonly basemap = signal<'satellite' | 'street' | 'dark'>('satellite');

  // Filtered active fields
  readonly activeFields = computed(() => {
    let list = FARM_FIELDS;
    const dist = this.selectedDistrictId();
    if (dist !== 'all') {
      list = list.filter(f => f.districtId === dist);
    }
    if (this.onlyAlerts()) {
      list = list.filter(f => f.status !== 'Optimal');
    }
    return list;
  });

  // Leaflet references
  private map: L.Map | null = null;
  private tileLayer: L.TileLayer | null = null;
  private labelsLayer: L.TileLayer | null = null;
  private fieldsGroup: L.LayerGroup = L.layerGroup();
  private resizeObserver: ResizeObserver | null = null;

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.initMap();
      }, 50);
    });
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    if (this.map) {
      this.map.off();
      this.map.remove();
      this.map = null;
    }
  }

  private initMap() {
    if (!this.mapContainer?.nativeElement) return;

    // Default center on Peace River Grain Belt [56.242, -120.850] zoom level 12 for high-res field plot view
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [56.242, -120.850],
      zoom: 12,
      minZoom: 3,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
      trackResize: true
    });

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    this.applyBasemap(this.basemap());
    this.fieldsGroup.addTo(this.map);

    this.renderFieldPlots();

    requestAnimationFrame(() => {
      this.map?.invalidateSize();
    });

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 200);

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 600);

    this.setupResizeObserver();
  }

  private applyBasemap(mode: 'satellite' | 'street' | 'dark') {
    if (!this.map) return;
    if (this.tileLayer) {
      this.map.removeLayer(this.tileLayer);
      this.tileLayer = null;
    }
    if (this.labelsLayer) {
      this.map.removeLayer(this.labelsLayer);
      this.labelsLayer = null;
    }

    if (mode === 'satellite') {
      this.tileLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, attribution: 'Esri World Imagery' }
      );
      this.labelsLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      );
      this.labelsLayer.addTo(this.map);
    } else if (mode === 'street') {
      this.tileLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { maxZoom: 19, subdomains: 'abcd', attribution: 'CartoDB Voyager' }
      );
    } else {
      this.tileLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { maxZoom: 19, subdomains: 'abcd', attribution: 'CartoDB Dark' }
      );
    }

    this.tileLayer.addTo(this.map);
  }

  setBasemap(mode: 'satellite' | 'street' | 'dark') {
    this.basemap.set(mode);
    this.applyBasemap(mode);
  }

  setSpectrum(spectrum: 'ndvi' | 'ndre' | 'moisture' | 'disease') {
    this.activeSpectrum.set(spectrum);
    this.renderFieldPlots();
  }

  filterDistrict(districtId: string) {
    this.selectedDistrictId.set(districtId);
    this.selectedField.set(null);
    this.renderFieldPlots();
    this.fitMapToActiveFields();
  }

  toggleOnlyAlerts() {
    this.onlyAlerts.update(v => !v);
    this.renderFieldPlots();
    this.fitMapToActiveFields();
  }

  private getFieldColor(field: FarmField, spectrum: string): { fill: string; stroke: string } {
    if (spectrum === 'disease') {
      if (field.status === 'High Risk') return { fill: '#ef4444', stroke: '#f87171' };
      if (field.status === 'Warning') return { fill: '#f59e0b', stroke: '#fbbf24' };
      return { fill: '#10b981', stroke: '#34d399' };
    }

    if (spectrum === 'moisture') {
      if (field.moisture < 50) return { fill: '#ef4444', stroke: '#f87171' };
      if (field.moisture < 70) return { fill: '#f59e0b', stroke: '#fbbf24' };
      return { fill: '#3b82f6', stroke: '#60a5fa' };
    }

    // NDVI / NDRE
    const val = spectrum === 'ndre' ? field.ndre : field.ndvi;
    if (val >= 0.70) return { fill: '#22c55e', stroke: '#4ade80' };
    if (val >= 0.50) return { fill: '#f59e0b', stroke: '#fbbf24' };
    return { fill: '#ef4444', stroke: '#f87171' };
  }

  private renderFieldPlots() {
    this.fieldsGroup.clearLayers();

    const spectrum = this.activeSpectrum();
    const activeList = this.activeFields();
    const selField = this.selectedField();

    activeList.forEach(field => {
      const colors = this.getFieldColor(field, spectrum);
      const isSelected = selField?.id === field.id;

      let layer: L.Layer;

      if (field.isPivot) {
        // Render circular pivot field
        layer = L.circle([field.lat, field.lng], {
          radius: 450,
          fillColor: colors.fill,
          fillOpacity: isSelected ? 0.65 : 0.45,
          color: isSelected ? '#ffffff' : colors.stroke,
          weight: isSelected ? 3 : 1.8,
        });
      } else {
        // Render polygon field
        const latLngs = field.polygon.map(p => L.latLng(p[0], p[1]));
        layer = L.polygon(latLngs, {
          fillColor: colors.fill,
          fillOpacity: isSelected ? 0.65 : 0.45,
          color: isSelected ? '#ffffff' : colors.stroke,
          weight: isSelected ? 3 : 1.8,
        });
      }

      // Tooltip
      layer.bindTooltip(`
        <div class="farm-field-tooltip">
          <div class="font-bold text-white">${field.name}</div>
          <div class="text-[9.5px] text-amber-300">${field.crop} (${field.acreage} ac)</div>
          <div class="text-[9.5px] mt-0.5">
            NDVI: <strong class="text-emerald-400">${field.ndvi.toFixed(2)}</strong> |
            Moisture: <strong class="text-blue-400">${field.moisture}%</strong>
          </div>
        </div>
      `, { sticky: true });

      // Click event
      layer.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        this.ngZone.run(() => {
          this.selectField(field);
        });
      });

      this.fieldsGroup.addLayer(layer);

      // Add sensor pin marker in center
      const pinClass = field.status === 'High Risk' ? 'field-pin-pulse alert' : 'field-pin-pulse';
      const pinIcon = L.divIcon({
        className: 'custom-pin',
        html: `<div class="${pinClass}" title="${field.name}"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });

      const pinMarker = L.marker([field.lat, field.lng], { icon: pinIcon });
      pinMarker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        this.ngZone.run(() => {
          this.selectField(field);
        });
      });

      this.fieldsGroup.addLayer(pinMarker);
    });
  }

  selectField(field: FarmField) {
    this.selectedField.set(field);
    this.renderFieldPlots();

    if (this.map) {
      this.map.flyTo([field.lat, field.lng], 14, {
        duration: 0.8
      });
    }
  }

  resetFieldSelection() {
    this.selectedField.set(null);
    this.renderFieldPlots();
    this.fitMapToActiveFields();
  }

  private fitMapToActiveFields() {
    if (!this.map) return;
    const activeList = this.activeFields();
    if (activeList.length === 0) {
      this.map.flyTo([56.242, -120.850], 10);
      return;
    }

    const bounds = L.latLngBounds(activeList.map(f => L.latLng(f.lat, f.lng)));
    if (bounds.isValid()) {
      this.map.flyToBounds(bounds, {
        padding: [20, 20],
        maxZoom: 13,
        duration: 0.8
      });
    }
  }

  private setupResizeObserver() {
    if (!this.mapContainer?.nativeElement) return;
    let frameId: number | null = null;
    this.resizeObserver = new ResizeObserver(() => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      });
    });
    this.resizeObserver.observe(this.mapContainer.nativeElement);
  }
}
