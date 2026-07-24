import { Component, ChangeDetectionStrategy, input, ViewChild, ElementRef, AfterViewInit, OnDestroy, effect, ViewEncapsulation, inject, NgZone } from '@angular/core';

import { DISEASE_DATABASE } from '../../../data';
import { JournalLog } from '../storage';
import * as d3 from 'd3';

@Component({
  selector: 'app-diagnostic-chart',
  standalone: true,
  imports: [],
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './diagnostic-chart.html',
  styleUrls: ['./diagnostic-chart.scss']
})
export class DiagnosticChart implements AfterViewInit, OnDestroy {
  logs = input<JournalLog[]>([]);

  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef<HTMLDivElement>;

  private resizeObserver: ResizeObserver | null = null;
  private ngZone = inject(NgZone);

  constructor() {
    // Run chart updates whenever the logs change
    effect(() => {
      const currentLogs = this.logs();
      this.ngZone.runOutsideAngular(() => {
        this.updateChart(currentLogs);
      });
    });
  }

  ngAfterViewInit() {
    this.resizeObserver = new ResizeObserver(() => {
      this.ngZone.runOutsideAngular(() => {
        requestAnimationFrame(() => {
          this.updateChart(this.logs());
        });
      });
    });
    this.resizeObserver.observe(this.chartContainer.nativeElement);
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private updateChart(currentLogs: JournalLog[]) {
    const container = this.chartContainer.nativeElement;
    // Clear previous SVG content
    d3.select(container).selectAll('*').remove();

    if (!currentLogs || currentLogs.length === 0) {
      this.drawEmptyState(container);
      return;
    }

    // Process and sort logs chronologically
    const processedData = currentLogs
      .map(log => {
        const d = new Date(log.date);
        return {
          id: log.id,
          date: isNaN(d.getTime()) ? new Date() : d,
          dateStr: log.date,
          severity: log.severity,
          diseaseId: log.diseaseId,
          diseaseName: this.getDiseaseName(log.diseaseId),
          field: log.field
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Determine dimensions dynamically from the container
    const margin = { top: 20, right: 25, bottom: 35, left: 45 };
    const width = Math.max(100, container.clientWidth - margin.left - margin.right);
    const height = Math.max(160, container.clientHeight - margin.top - margin.bottom);

    if (width <= 10 || height <= 10) return;

    // Create main SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('overflow', 'visible')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add X/Y Scales
    const xExtent = d3.extent(processedData, d => d.date) as [Date, Date];
    
    // Fallback if there is only 1 data point or all have the exact same date
    if (xExtent[0].getTime() === xExtent[1].getTime()) {
      const oneDay = 24 * 60 * 60 * 1000;
      xExtent[0] = new Date(xExtent[0].getTime() - oneDay);
      xExtent[1] = new Date(xExtent[1].getTime() + oneDay);
    }

    const xScale = d3.scaleTime()
      .domain(xExtent)
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, 100]) // Severity percentage scale (0-100%)
      .range([height, 0]);

    // Draw grid lines first so they sit in the background
    svg.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yScale.ticks(5))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', 'rgba(255, 255, 255, 0.05)')
      .attr('stroke-width', 1);

    // X-Axis
    const xAxis = d3.axisBottom<Date>(xScale)
      .ticks(Math.min(processedData.length, 5))
      .tickFormat(d3.timeFormat('%b %d'));

    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .call(g => g.select('.domain').attr('stroke', 'rgba(255, 255, 255, 0.15)'))
      .call(g => g.selectAll('.tick line').attr('stroke', 'rgba(255, 255, 255, 0.15)'))
      .call(g => g.selectAll('.tick text')
        .attr('fill', 'rgba(255, 255, 255, 0.5)')
        .attr('font-size', '10px')
        .attr('font-family', 'var(--font-mono)')
        .attr('dy', '10px'));

    // Y-Axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => `${d}%`);

    svg.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .call(g => g.select('.domain').attr('stroke', 'rgba(255, 255, 255, 0.15)'))
      .call(g => g.selectAll('.tick line').attr('stroke', 'rgba(255, 255, 255, 0.15)'))
      .call(g => g.selectAll('.tick text')
        .attr('fill', 'rgba(255, 255, 255, 0.5)')
        .attr('font-size', '10px')
        .attr('font-family', 'var(--font-mono)')
        .attr('dx', '-5px'));

    // Create defs for filters and gradients
    const defs = svg.append('defs');

    // Glow filter for premium neon aesthetics
    const glowFilter = defs.append('filter')
      .attr('id', 'neon-glow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');

    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'blur');

    glowFilter.append('feMerge')
      .selectAll('feMergeNode')
      .data(['blur', 'SourceGraphic'])
      .enter()
      .append('feMergeNode')
      .attr('in', d => d);

    // Gradient below the line
    const areaGradient = defs.append('linearGradient')
      .attr('id', 'severity-area-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');

    areaGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', 'var(--primary)')
      .attr('stop-opacity', 0.3);

    areaGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', 'var(--primary)')
      .attr('stop-opacity', 0.0);

    // Setup generators
    const lineGenerator = d3.line<{ date: Date; severity: number }>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.severity))
      .curve(d3.curveMonotoneX);

    const areaGenerator = d3.area<{ date: Date; severity: number }>()
      .x(d => xScale(d.date))
      .y0(height)
      .y1(d => yScale(d.severity))
      .curve(d3.curveMonotoneX);

    // Draw the subtle area fill underneath
    svg.append('path')
      .datum(processedData)
      .attr('class', 'trend-area')
      .attr('d', areaGenerator)
      .attr('fill', 'url(#severity-area-grad)');

    // Draw the glowing trend line path
    const path = svg.append('path')
      .datum(processedData)
      .attr('class', 'trend-line')
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', 'var(--primary)')
      .attr('stroke-width', 2.5)
      .attr('filter', 'url(#neon-glow)');

    // Path draw-in animation
    const totalLength = path.node()?.getTotalLength() || 0;
    if (totalLength > 0) {
      path
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(1400)
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0);
    }

    // Interactive Tooltip Box
    const tooltip = d3.select(container)
      .append('div')
      .attr('class', 'chart-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('pointer-events', 'none')
      .style('background', 'rgba(10, 13, 9, 0.95)')
      .style('border', '1px solid var(--glass-border)')
      .style('padding', '8px 12px')
      .style('border-radius', '8px')
      .style('font-family', 'var(--font-sans)')
      .style('font-size', '11px')
      .style('color', '#ffffff')
      .style('box-shadow', '0 6px 20px rgba(0,0,0,0.6)')
      .style('backdrop-filter', 'blur(10px)')
      .style('z-index', '100');

    // Add interactive data point circles
    svg.selectAll('.trend-dot')
      .data(processedData)
      .enter()
      .append('circle')
      .attr('class', 'trend-dot')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.severity))
      .attr('r', 0)
      .attr('fill', '#ffffff')
      .attr('stroke', 'var(--primary)')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('transition', 'r 0.15s ease, fill 0.15s ease, stroke-width 0.15s ease')
      .transition()
      .delay((_, i) => i * 120)
      .duration(600)
      .attr('r', 5)
      .style('pointer-events', 'all');

    // Attach premium interactive hover logic to the points
    svg.selectAll('.trend-dot')
      .on('mouseover', function(event, d) {
        const data = d as { dateStr: string; diseaseName: string; field: string; severity: number };
        d3.select(this)
          .attr('r', 7)
          .attr('fill', 'var(--primary)')
          .attr('stroke-width', 2.5);
        
        tooltip.style('visibility', 'visible')
          .html(`
            <div style="font-weight: 800; color: var(--accent-gold); margin-bottom: 3px; font-family: var(--font-mono); font-size: 10px;">${data.dateStr}</div>
            <div style="font-weight: 700; font-size: 12px; margin-bottom: 4px; color: #ffffff;">${data.diseaseName}</div>
            <div style="color: var(--text-muted); font-size: 10px; margin-bottom: 4px;">Zone: <span style="color:#ffffff; font-weight:600;">${data.field}</span></div>
            <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; color: var(--primary);">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background: var(--primary); box-shadow: 0 0 8px var(--primary);"></span>
              <span>Severity Level: ${data.severity}%</span>
            </div>
          `);
      })
      .on('mousemove', function(event) {
        const containerRect = container.getBoundingClientRect();
        const xPos = event.clientX - containerRect.left + 15;
        const yPos = event.clientY - containerRect.top - 15;
        
        // Boundaries checks for tooltip placement
        const tooltipNode = tooltip.node() as HTMLDivElement;
        const tooltipWidth = tooltipNode ? tooltipNode.clientWidth : 180;
        const finalX = (xPos + tooltipWidth > containerRect.width) ? (xPos - tooltipWidth - 30) : xPos;

        tooltip
          .style('left', `${finalX}px`)
          .style('top', `${yPos}px`);
      })
      .on('mouseleave', function() {
        d3.select(this)
          .attr('r', 5)
          .attr('fill', '#ffffff')
          .attr('stroke-width', 2);
        tooltip.style('visibility', 'hidden');
      });
  }

  private drawEmptyState(container: HTMLDivElement) {
    const emptyWrapper = d3.select(container)
      .append('div')
      .attr('class', 'empty-trend-state');

    emptyWrapper.append('span')
      .attr('class', 'empty-icon')
      .text('📈');

    emptyWrapper.append('p')
      .text('Infection Trend Chart');

    emptyWrapper.append('span')
      .attr('class', 'empty-sub')
      .text('Record field observations to generate progression trend.');
  }

  private getDiseaseName(diseaseId: string): string {
    if (diseaseId === 'healthy') return 'Healthy Wheat';
    return DISEASE_DATABASE.find(d => d.id === diseaseId)?.name || 'Unknown Pathology';
  }
}
