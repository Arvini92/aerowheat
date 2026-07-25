import { Component, ChangeDetectionStrategy, ViewEncapsulation, ElementRef, AfterViewInit, ViewChild, OnDestroy, inject, NgZone, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icon } from '../../../../../design-system/icon/icon';
import * as d3 from 'd3';
import { ToastService } from '@/src/app/design-system/toast/toast.service';

interface DataPoint {
  date: Date;
  ndvi: number;
  reci: number;
  moisture: number;
}

type IndexType = 'NDVI' | 'RECI' | 'Moisture';

@Component({
  selector: 'app-trend-chart',
  standalone: true,
  imports: [CommonModule, Icon],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="trend-root glass-card mt-6">
      <!-- Header Controls -->
      <header class="trend-header">
        <div class="flex items-center gap-4">
          <div class="trend-icon-box">
            <app-icon size="md" class="text-emerald-400">monitoring</app-icon>
          </div>
          <div>
            <h3 class="trend-title">Biosphere Telemetry</h3>
            <p class="trend-subtitle">30-day multi-spectral analytical trends</p>
          </div>
        </div>

        <div class="index-selector">
          @for (type of indexTypes; track type) {
            <button 
              (click)="setActiveIndex(type)" 
              class="selector-tab"
              [class.active]="activeIndex() === type"
            >
              {{ type }}
            </button>
          }
        </div>
      </header>

      <!-- Main Chart Area -->
      <div class="chart-wrapper">
        <div class="chart-stats-grid">
          <div class="stat-card">
            <span class="stat-label">Current {{ activeIndex() }}</span>
            <span class="stat-value" [class.text-emerald-400]="isPositiveTrend()">
              {{ currentVal() | number:'1.2-3' }}
              <app-icon size="xs" class="ml-1">{{ isPositiveTrend() ? 'trending_up' : 'trending_down' }}</app-icon>
            </span>
          </div>
          <div class="stat-card">
            <span class="stat-label">30D Peak</span>
            <span class="stat-value text-white">{{ peakVal() | number:'1.2-3' }}</span>
          </div>
          <div class="stat-card hidden sm:flex">
            <span class="stat-label">Signal Stability</span>
            <span class="stat-value text-zinc-400">98.2%</span>
          </div>
        </div>

        <!-- SVG Chart Container -->
        <div #chartContainer class="relative h-48 w-full mt-4">
          @if (isUpdating()) {
            <div class="chart-loading-overlay">
              <div class="spinner"></div>
            </div>
          }
        </div>
      </div>

      <!-- Footer Info -->
      <footer class="trend-footer">
        <div class="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
          <app-icon size="xs">satellite</app-icon>
          <span>Sensor: Sentinel-2B Orbital Platform</span>
        </div>
        <div class="flex items-center gap-4">
          <div class="legend-item">
            <span class="legend-dot bg-emerald-500"></span>
            <span class="legend-text">Active Index</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot border border-dashed border-white/20"></span>
            <span class="legend-text">Historical Baseline</span>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .trend-root {
      padding: 1.25rem;
      background: rgba(13, 18, 30, 0.4);
      backdrop-filter: blur(24px);
      border-radius: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .trend-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .trend-icon-box {
      width: 40px;
      height: 40px;
      background: rgba(74, 214, 109, 0.1);
      border: 1px solid rgba(74, 214, 109, 0.2);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .trend-title {
      font-size: 1rem;
      font-weight: 800;
      color: #fff;
      margin: 0;
      letter-spacing: -0.01em;
    }

    .trend-subtitle {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0.1rem 0 0;
    }

    .index-selector {
      display: flex;
      background: rgba(0, 0, 0, 0.2);
      padding: 3px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .selector-tab {
      padding: 4px 12px;
      font-size: 0.7rem;
      font-weight: 800;
      color: #64748b;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      background: transparent;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .selector-tab.active {
      background: rgba(255, 255, 255, 0.08);
      color: var(--primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .chart-wrapper {
      background: rgba(0, 0, 0, 0.15);
      border-radius: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.03);
      padding: 1rem;
    }

    .chart-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-label {
      font-size: 0.6rem;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-value {
      font-size: 1.1rem;
      font-weight: 800;
      font-family: var(--font-mono);
      display: flex;
      align-items: center;
    }

    /* D3 Styling */
    ::ng-deep .trend-axis text {
      fill: rgba(255, 255, 255, 0.4);
      font-size: 8px;
      font-family: var(--font-mono);
      font-weight: 600;
    }

    ::ng-deep .trend-axis path, ::ng-deep .trend-axis line {
      stroke: rgba(255, 255, 255, 0.08);
    }

    ::ng-deep .chart-grid-line line {
      stroke: rgba(255, 255, 255, 0.04);
      stroke-dasharray: 2, 2;
    }

    ::ng-deep .trend-tooltip {
      position: absolute;
      background: rgba(13, 18, 30, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 8px 12px;
      pointer-events: none;
      z-index: 100;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(8px);
      font-family: var(--font-sans);
    }

    .trend-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.5rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .legend-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .legend-text {
      font-size: 0.65rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }

    .chart-loading-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(13, 18, 30, 0.4);
      z-index: 10;
      border-radius: 0.5rem;
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid rgba(74, 214, 109, 0.2);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 600px) {
      .trend-header { flex-direction: column; align-items: flex-start; }
      .index-selector { width: 100%; }
      .selector-tab { flex: 1; }
    }
  `]
})
export class TrendChart implements AfterViewInit, OnDestroy {
  @ViewChild('chartContainer') chartContainer!: ElementRef;
  
  private ngZone = inject(NgZone);
  private toast = inject(ToastService);
  private resizeObserver: ResizeObserver | null = null;
  
  readonly indexTypes: IndexType[] = ['NDVI', 'RECI', 'Moisture'];
  readonly activeIndex = signal<IndexType>('NDVI');
  readonly isUpdating = signal(false);

  private data: DataPoint[] = [];

  readonly currentVal = computed(() => {
    const last = this.data[this.data.length - 1];
    return last ? this.getVal(last) : 0;
  });

  readonly peakVal = computed(() => {
    return Math.max(...this.data.map(d => this.getVal(d)));
  });

  readonly isPositiveTrend = computed(() => {
    if (this.data.length < 5) return true;
    const last = this.getVal(this.data[this.data.length - 1]);
    const prev = this.getVal(this.data[this.data.length - 5]);
    return last >= prev;
  });

  constructor() {
    this.data = this.generateMockData();
  }

  ngAfterViewInit() {
    this.setupResizeObserver();
    // Initial chart creation after a small delay to ensure container size
    setTimeout(() => this.createChart(), 100);
  }

  ngOnDestroy() {
    if (this.resizeObserver) this.resizeObserver.disconnect();
    this.clearChart();
  }

  setActiveIndex(type: IndexType) {
    if (this.activeIndex() === type) return;
    
    this.isUpdating.set(true);
    this.activeIndex.set(type);
    this.toast.info(`Switching telemetry view to ${type} index...`);
    
    setTimeout(() => {
      this.createChart();
      this.isUpdating.set(false);
    }, 400);
  }

  private getVal(d: DataPoint): number {
    switch (this.activeIndex()) {
      case 'NDVI': return d.ndvi;
      case 'RECI': return d.reci;
      case 'Moisture': return d.moisture;
    }
  }

  private setupResizeObserver() {
    this.resizeObserver = new ResizeObserver(() => {
      this.ngZone.runOutsideAngular(() => {
        requestAnimationFrame(() => this.createChart());
      });
    });
    this.resizeObserver.observe(this.chartContainer.nativeElement);
  }

  private clearChart() {
    if (this.chartContainer?.nativeElement) {
      d3.select(this.chartContainer.nativeElement).selectAll('*').remove();
    }
  }

  private createChart() {
    this.clearChart();
    
    const element = this.chartContainer.nativeElement;
    const containerWidth = element.offsetWidth || 300;
    const containerHeight = element.offsetHeight || 192;

    const margin = { top: 10, right: 10, bottom: 25, left: 35 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    if (width <= 0 || height <= 0) return;

    const svg = d3.select(element)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .style('display', 'block');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Gradients
    const defs = svg.append('defs');
    const areaGrad = defs.append('linearGradient').attr('id', 'area-grad').attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
    areaGrad.append('stop').attr('offset', '0%').attr('stop-color', '#4AD66D').attr('stop-opacity', 0.25);
    areaGrad.append('stop').attr('offset', '100%').attr('stop-color', '#4AD66D').attr('stop-opacity', 0);

    const x = d3.scaleTime()
      .domain(d3.extent(this.data, d => d.date) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([
        Math.min(...this.data.map(d => this.getVal(d))) * 0.95,
        Math.max(...this.data.map(d => this.getVal(d))) * 1.05
      ])
      .range([height, 0]);

    // Grid
    g.append('g').attr('class', 'chart-grid-line').call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(() => ''));

    // Axes
    g.append('g').attr('class', 'trend-axis').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x).ticks(5).tickFormat((d) => d3.timeFormat('%d %b')(d as Date)));
    g.append('g').attr('class', 'trend-axis').call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('.2f')));

    // Path generators
    const area = d3.area<DataPoint>().x(d => x(d.date)).y0(height).y1(d => y(this.getVal(d))).curve(d3.curveMonotoneX);
    const line = d3.line<DataPoint>().x(d => x(d.date)).y(d => y(this.getVal(d))).curve(d3.curveMonotoneX);

    g.append('path').datum(this.data).attr('fill', 'url(#area-grad)').attr('d', area);
    g.append('path').datum(this.data).attr('fill', 'none').attr('stroke', '#4AD66D').attr('stroke-width', 2.5).attr('d', line);

    // Interaction
    const tooltip = d3.select(element).append('div').attr('class', 'trend-tooltip').style('opacity', 0);
    const focus = g.append('g').style('display', 'none');
    focus.append('circle').attr('r', 5).attr('fill', '#4AD66D').attr('stroke', '#0a0d09').attr('stroke-width', 2);
    focus.append('line').attr('stroke', 'rgba(255,255,255,0.1)').attr('stroke-dasharray', '3,3').attr('y1', 0).attr('y2', height);

    const bisect = d3.bisector<DataPoint, Date>(d => d.date).left;

    g.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'transparent')
      .style('pointer-events', 'all')
      .on('mouseover', () => { focus.style('display', null); tooltip.style('opacity', 1); })
      .on('mouseout', () => { focus.style('display', 'none'); tooltip.style('opacity', 0); })
      .on('mousemove', (event) => {
        const mouseX = d3.pointer(event)[0];
        const dateAtMouse = x.invert(mouseX);
        const i = bisect(this.data, dateAtMouse, 1);
        const d0 = this.data[i - 1];
        const d1 = this.data[i];
        if (!d0) return;
        const d = !d1 || (dateAtMouse.getTime() - d0.date.getTime() < d1.date.getTime() - dateAtMouse.getTime()) ? d0 : d1;
        const val = this.getVal(d);

        focus.attr('transform', `translate(${x(d.date)},${y(val)})`);
        focus.select('line').attr('y1', height - y(val)).attr('y2', 0);
        
        tooltip.html(`
          <div style="font-size: 9px; font-weight: 900; color: #475569; text-transform: uppercase;">${d3.timeFormat('%B %d, %Y')(d.date)}</div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 4px;">
            <span style="font-size: 10px; font-weight: 700; color: #94a3b8;">${this.activeIndex()}:</span>
            <span style="font-size: 12px; font-family: monospace; font-weight: 900; color: #4ade80;">${val.toFixed(3)}</span>
          </div>
        `)
        .style('left', `${x(d.date) + margin.left + 15}px`)
        .style('top', `${y(val) + margin.top - 20}px`);
      });
  }

  private generateMockData(): DataPoint[] {
    const data: DataPoint[] = [];
    const now = new Date();
    let currentNdvi = 0.68;
    let currentReci = 1.2;
    let currentMoist = 45;

    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      
      currentNdvi = Math.max(0.4, Math.min(0.9, currentNdvi + (Math.random() - 0.48) * 0.05));
      currentReci = Math.max(0.8, Math.min(2.0, currentReci + (Math.random() - 0.49) * 0.1));
      currentMoist = Math.max(20, Math.min(80, currentMoist + (Math.random() - 0.5) * 5));
      
      data.push({ date, ndvi: currentNdvi, reci: currentReci, moisture: currentMoist });
    }
    return data;
  }
}
