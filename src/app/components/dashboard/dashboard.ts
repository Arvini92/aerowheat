import { Component, ChangeDetectionStrategy, ViewEncapsulation, signal, ViewChild, ElementRef, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { DISEASE_DATABASE } from '../../services/data';
import { jsPDF } from 'jspdf';
import { ScanResult } from './left/scan-simulator/scan-simulator';
import { AppState } from '../../services/app-state';
import { Left } from './left/left';
import { Right } from './right/right';
import { ToastService } from '../../design-system/toast/toast.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    Left,
    Right
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard {
  private readonly appState = inject(AppState);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly elementRef = inject(ElementRef);

  // Query child components to trigger reset on them
  @ViewChild(Left) left!: Left;
  @ViewChild(Right) right!: Right;

  // Active Scan/Diagnosis results shared with the report card
  currentScanResult = signal<ScanResult | null>({
    id: 'leaf_rust',
    name: 'Leaf Rust',
    scientific: 'Puccinia triticina',
    type: 'fungal',
    severity: 'Moderate',
    symptoms: [
      'Small round orange-brown pustules on leaf surfaces',
      'Pustules rub off easily, leaving a rusty powder on fingers',
      'Yellow halos (chlorosis) surrounding older pustules',
      'Premature leaf drying (necrosis) in severe infections'
    ],
    treatment: {
      immediate: 'Apply a foliar triazole or strobilurin fungicide if threshold is breached on the flag leaf minus one.',
      chemical: 'Foliar Fungicides: Triazoles (Tebuconazole, Propiconazole) or Strobilurins (Pyraclostrobin). Apply at flag leaf emergence.',
      organic: 'Ensure wide spacing and apply copper-based organic fungicides or bio-fungicides containing Bacillus subtilis as early-season preventatives.',
      preventive: 'Plant leaf-rust-resistant wheat cultivars. Eliminate volunteer wheat crop ("green bridges") before planting.'
    }
  });
  scanConfidence = signal<number>(92);

  chartColor = computed(() => {
    const res = this.currentScanResult();
    if (!res || res.id === 'healthy') return '#10b981'; // green
    if (res.severity === 'High') return '#ef4444'; // red
    return '#f59e0b'; // gold
  });

  async exportToPDF() {
    const result = this.currentScanResult();
    const confidence = this.scanConfidence();

    this.toastService.info('Generating PDF report...');

    try {
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // Header Banner (Dark Forest Green)
      pdf.setFillColor(15, 32, 24);
      pdf.rect(0, 0, pageWidth, 28, 'F');

      // Header Title
      pdf.setTextColor(74, 214, 109); // #4ad66d primary green
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AeroWheat Agronomic Intelligence', margin, 12);

      pdf.setTextColor(200, 220, 210);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('AI-Powered Crop Diagnostics & Field Health Report', margin, 18);

      pdf.setTextColor(140, 160, 150);
      pdf.setFontSize(8);
      const dateStr = new Date().toLocaleString();
      pdf.text(`Generated: ${dateStr}`, pageWidth - margin - 55, 18);

      y = 36;

      // Section 1: Primary Diagnosis Card
      pdf.setFillColor(245, 248, 246);
      pdf.setDrawColor(220, 230, 225);
      pdf.roundedRect(margin, y, contentWidth, 38, 3, 3, 'FD');

      // Card Header
      pdf.setTextColor(10, 15, 12);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PRIMARY DIAGNOSIS', margin + 6, y + 8);

      const diseaseName = result?.name || 'Wheat Health Scan';
      const scientificName = result?.scientific || 'Triticum aestivum';
      const severity = result?.severity || 'Low';
      const pathogenType = result?.type || 'None';

      pdf.setFontSize(15);
      pdf.setFont('helvetica', 'bold');
      if (severity === 'High') {
        pdf.setTextColor(220, 38, 38); // red
      } else if (severity === 'Moderate') {
        pdf.setTextColor(217, 119, 6); // amber
      } else {
        pdf.setTextColor(16, 185, 129); // green
      }
      pdf.text(diseaseName, margin + 6, y + 17);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(100, 110, 105);
      pdf.text(scientificName, margin + 6, y + 23);

      // Key Metrics Row
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 40, 35);
      pdf.text(`AI Confidence: ${confidence}%`, margin + 6, y + 32);
      pdf.text(`Severity Risk: ${severity}`, margin + 60, y + 32);
      pdf.text(`Pathogen: ${pathogenType}`, margin + 115, y + 32);

      y += 46;

      // Section 2: Identified Symptoms & Markers
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 32, 24);
      pdf.text('Identified Symptoms & Visual Markers', margin, y);
      y += 3;

      pdf.setLineWidth(0.5);
      pdf.setDrawColor(74, 214, 109);
      pdf.line(margin, y, margin + 45, y);
      y += 6;

      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(40, 50, 45);

      const symptoms = result?.symptoms || ['No critical symptoms detected. Plant exhibits healthy canopy structure.'];
      symptoms.forEach(s => {
        pdf.setFillColor(74, 214, 109);
        pdf.circle(margin + 3, y - 1.2, 1, 'F');
        const lines = pdf.splitTextToSize(s, contentWidth - 10);
        pdf.text(lines, margin + 8, y);
        y += lines.length * 5 + 2;
      });

      y += 6;

      // Section 3: Recommended Treatment Protocol
      if (result?.treatment) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(15, 32, 24);
        pdf.text('Agronomic Treatment Protocol', margin, y);
        y += 3;

        pdf.setLineWidth(0.5);
        pdf.setDrawColor(74, 214, 109);
        pdf.line(margin, y, margin + 45, y);
        y += 7;

        const protocols = [
          { label: 'Immediate Cultural Action', text: result.treatment.immediate, color: [220, 38, 38] },
          { label: 'Chemical Option (Fungicides)', text: result.treatment.chemical, color: [37, 99, 235] },
          { label: 'Organic / Biological Control', text: result.treatment.organic, color: [16, 185, 129] },
          { label: 'Long-term Prevention', text: result.treatment.preventive, color: [147, 51, 234] }
        ];

        protocols.forEach(p => {
          if (y > pageHeight - 35) {
            pdf.addPage();
            y = margin;
          }

          pdf.setFillColor(248, 250, 249);
          pdf.setDrawColor(225, 235, 230);

          const textLines = pdf.splitTextToSize(p.text, contentWidth - 16);
          const boxHeight = Math.max(16, textLines.length * 4.5 + 9);

          pdf.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');

          // Accent bar on left
          pdf.setFillColor(p.color[0], p.color[1], p.color[2]);
          pdf.rect(margin, y, 2.5, boxHeight, 'F');

          pdf.setFontSize(8.5);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(p.color[0], p.color[1], p.color[2]);
          pdf.text(p.label.toUpperCase(), margin + 6, y + 6);

          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(40, 50, 45);
          pdf.text(textLines, margin + 6, y + 11);

          y += boxHeight + 4;
        });
      }

      // ==========================================
      // PAGE 2: Vector Field Activity & Microclimate Analytics
      // ==========================================
      pdf.addPage();
      y = margin;

      // Header Banner Page 2 (Dark Forest Green)
      pdf.setFillColor(15, 32, 24);
      pdf.rect(0, 0, pageWidth, 28, 'F');

      pdf.setTextColor(74, 214, 109); // #4ad66d primary green
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AeroWheat Field Analytics & Microclimate', margin, 12);

      pdf.setTextColor(200, 220, 210);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('30-Day Vegetation Index (NDVI) & Environmental Risk Trends', margin, 18);

      pdf.setTextColor(140, 160, 150);
      pdf.setFontSize(8);
      pdf.text('Field Block: North Quadrant B', pageWidth - margin - 55, 18);

      y = 36;

      // Section 1: Crop Health & Index Trends Card
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 32, 24);
      pdf.text('30-Day Crop Health & Vegetation Index Trends (NDVI)', margin, y);
      y += 3;

      pdf.setLineWidth(0.5);
      pdf.setDrawColor(74, 214, 109);
      pdf.line(margin, y, margin + 55, y);
      y += 7;

      // NDVI Metrics Badges Container Box
      pdf.setFillColor(245, 248, 246);
      pdf.setDrawColor(220, 230, 225);
      pdf.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

      // Metric 1: Peak NDVI
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 115, 105);
      pdf.text('PEAK NDVI', margin + 8, y + 6);
      pdf.setFontSize(11);
      pdf.setTextColor(16, 185, 129); // green
      pdf.text('0.84 Max', margin + 8, y + 13);

      // Metric 2: Mean NDVI
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 115, 105);
      pdf.text('MEAN NDVI', margin + 65, y + 6);
      pdf.setFontSize(11);
      pdf.setTextColor(30, 40, 35);
      pdf.text('0.71 Avg', margin + 65, y + 13);

      // Metric 3: Stability
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 115, 105);
      pdf.text('CANOPY STABILITY', margin + 125, y + 6);
      pdf.setFontSize(11);
      pdf.setTextColor(16, 185, 129);
      pdf.text('94.2%', margin + 125, y + 13);

      y += 24;

      // Chart Box Rendering (Vector NDVI Chart)
      const chartWidth = contentWidth;
      const chartHeight = 52;
      const chartX = margin;
      const chartY = y;

      pdf.setFillColor(252, 254, 253);
      pdf.setDrawColor(220, 230, 225);
      pdf.roundedRect(chartX, chartY, chartWidth, chartHeight, 3, 3, 'FD');

      // Chart Title & Legend
      pdf.setFontSize(8.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(40, 50, 45);
      pdf.text('NDVI TRAJECTORY (JUN 23 - JUL 21)', chartX + 6, chartY + 7);

      // Legend dot
      pdf.setFillColor(74, 214, 109);
      pdf.circle(chartX + chartWidth - 38, chartY + 6, 1.2, 'F');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 110, 105);
      pdf.text('Vegetation Index', chartX + chartWidth - 34, chartY + 7);

      // Chart Plotting Area inside Box
      const plotX = chartX + 16;
      const plotY = chartY + 12;
      const plotW = chartWidth - 22;
      const plotH = chartHeight - 20;

      // Grid lines & Y-Axis labels (0.40 to 0.90)
      const yTicks = [
        { val: 0.90, label: '0.90' },
        { val: 0.80, label: '0.80' },
        { val: 0.70, label: '0.70' },
        { val: 0.60, label: '0.60' },
        { val: 0.50, label: '0.50' },
        { val: 0.40, label: '0.40' }
      ];

      pdf.setLineWidth(0.15);
      pdf.setDrawColor(225, 235, 230);
      pdf.setFontSize(7);
      pdf.setTextColor(140, 150, 145);

      yTicks.forEach(tick => {
        const tickY = plotY + plotH - ((tick.val - 0.40) / (0.90 - 0.40)) * plotH;
        pdf.text(tick.label, chartX + 4, tickY + 1);
        pdf.line(plotX, tickY, plotX + plotW, tickY);
      });

      // Threshold line at 0.70 (Optimal threshold)
      const threshY = plotY + plotH - ((0.70 - 0.40) / 0.50) * plotH;
      pdf.setLineWidth(0.3);
      pdf.setDrawColor(16, 185, 129);
      pdf.line(plotX, threshY, plotX + plotW, threshY);

      // Sample 11 NDVI Data Points across 30 days
      const dataPoints = [
        { day: 'Jun 23', val: 0.72 },
        { day: 'Jun 26', val: 0.75 },
        { day: 'Jun 29', val: 0.78 },
        { day: 'Jul 02', val: 0.82 },
        { day: 'Jul 05', val: 0.84 },
        { day: 'Jul 08', val: 0.81 },
        { day: 'Jul 11', val: 0.76 },
        { day: 'Jul 14', val: 0.71 },
        { day: 'Jul 17', val: 0.69 },
        { day: 'Jul 19', val: 0.72 },
        { day: 'Jul 21', val: 0.74 }
      ];

      // Draw vector trend curve
      pdf.setLineWidth(1.2);
      pdf.setDrawColor(16, 185, 129); // emerald green

      const coords = dataPoints.map((dp, i) => {
        const cx = plotX + (i / (dataPoints.length - 1)) * plotW;
        const cy = plotY + plotH - ((dp.val - 0.40) / 0.50) * plotH;
        return { cx, cy, dp };
      });

      for (let i = 0; i < coords.length - 1; i++) {
        pdf.line(coords[i].cx, coords[i].cy, coords[i + 1].cx, coords[i + 1].cy);
      }

      // Draw data point dots & X-axis labels
      coords.forEach((pt, i) => {
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(16, 185, 129);
        pdf.setLineWidth(0.6);
        pdf.circle(pt.cx, pt.cy, 1.2, 'FD');

        if (i % 2 === 0 || i === coords.length - 1) {
          pdf.setFontSize(6.5);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(120, 130, 125);
          pdf.text(pt.dp.day, pt.cx - 3, plotY + plotH + 5);
        }
      });

      y += chartHeight + 10;

      // Section 2: Microclimate & Environmental Risk Assessment
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 32, 24);
      pdf.text('Microclimate & Environmental Risk Assessment', margin, y);
      y += 3;

      pdf.setLineWidth(0.5);
      pdf.setDrawColor(74, 214, 109);
      pdf.line(margin, y, margin + 55, y);
      y += 7;

      // 4 Environmental Metrics Cards in a 2x2 grid
      const cardW = (contentWidth - 6) / 2;
      const cardH = 18;

      const envMetrics = [
        { title: 'TEMPERATURE', value: '24.5°C', detail: 'Optimal fungal germination window (20-26°C)' },
        { title: 'RELATIVE HUMIDITY', value: '78.2%', detail: 'High humidity (>75%) accelerates spore spread' },
        { title: 'CANOPY WETNESS', value: '7.4 Hours', detail: 'Extended leaf surface dew retention' },
        { title: 'WIND SPEED & DRIFT', value: '11.8 km/h', detail: 'Ideal window for targeted chemical application' }
      ];

      envMetrics.forEach((m, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const mx = margin + col * (cardW + 6);
        const my = y + row * (cardH + 4);

        pdf.setFillColor(248, 250, 249);
        pdf.setDrawColor(225, 235, 230);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(mx, my, cardW, cardH, 2, 2, 'FD');

        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(100, 115, 105);
        pdf.text(m.title, mx + 5, my + 5);

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(15, 32, 24);
        pdf.text(m.value, mx + 5, my + 11);

        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(110, 120, 115);
        const detailLines = pdf.splitTextToSize(m.detail, cardW - 10);
        pdf.text(detailLines[0], mx + 5, my + 15);
      });

      y += (cardH + 4) * 2 + 6;

      // Risk Advisory Banner Box
      pdf.setFillColor(254, 243, 199); // light amber/yellow
      pdf.setDrawColor(245, 158, 11);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

      pdf.setFontSize(8.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(180, 83, 9); // amber 700
      pdf.text('AGRONOMIC RISK ADVISORY', margin + 6, y + 6);

      pdf.setFontSize(8.5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(120, 53, 15);
      const advText = 'Elevated canopy moisture and warm temperatures favor pathogen incubation. Immediate field scouting and preventative chemical or biological treatment is strongly advised to prevent yield penalty.';
      const advLines = pdf.splitTextToSize(advText, contentWidth - 12);
      pdf.text(advLines, margin + 6, y + 11);

      y += 24;

      // Section 3: Next Steps & Field Action Items
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 32, 24);
      pdf.text('Next Steps & Field Scouting Action Items', margin, y);
      y += 3;

      pdf.setLineWidth(0.5);
      pdf.setDrawColor(74, 214, 109);
      pdf.line(margin, y, margin + 55, y);
      y += 7;

      const actions = [
        'Perform ground-truth sampling in 10 randomized 1m² quadrats across Flag Leaf areas.',
        'Verify spray equipment nozzle pressure and water volume (150-200 L/ha) for uniform canopy penetration.',
        'Log follow-up scan in AeroWheat within 72 hours post-treatment to verify lesion arrest.'
      ];

      actions.forEach((act) => {
        pdf.setFillColor(74, 214, 109);
        pdf.circle(margin + 3, y - 1.2, 1, 'F');

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(40, 50, 45);

        const actLines = pdf.splitTextToSize(act, contentWidth - 10);
        pdf.text(actLines, margin + 8, y);
        y += actLines.length * 4.5 + 2;
      });

      // Add page footers
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setDrawColor(210, 220, 215);
        pdf.setLineWidth(0.3);
        pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(120, 135, 125);
        pdf.text('AeroWheat AI Scouting Platform • Field Diagnostic Report', margin, pageHeight - 6);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 6);
      }

      const fileName = `AeroWheat_Report_${diseaseName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      pdf.save(fileName);
      this.toastService.success('PDF report exported successfully!');
    } catch (err) {
      console.error('Failed to export PDF:', err);
      this.toastService.error('Failed to generate PDF. Please try again.');
    }
  }

  onScanComplete(event: { result: ScanResult; confidence: number }) {
    this.currentScanResult.set(event.result);
    this.scanConfidence.set(event.confidence);
  }

  onWizardDiagnosis(event: { diseaseId: string; anatomy: string[]; symptoms: string[]; weather: string; cropStage: string }) {
    const match = DISEASE_DATABASE.find(d => d.id === event.diseaseId);
    let finalResult: ScanResult;

    if (event.diseaseId === 'healthy' || !match) {
      finalResult = {
        id: 'healthy',
        name: 'Healthy Wheat',
        scientific: 'Triticum aestivum',
        type: 'None',
        severity: 'Low',
        symptoms: ['No visible spots or rust pustules', 'Rich green leaves and golden ears', 'Vigorous stem and root structures'],
        treatment: {
          immediate: 'No immediate chemical actions needed. Maintain scouting schedules.',
          chemical: 'None recommended.',
          organic: 'Maintain organic fertilizer balances.',
          preventive: 'Continue crop rotation planning.'
        }
      };
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
    }

    this.currentScanResult.set(finalResult);
    this.scanConfidence.set(finalResult.id === 'healthy' ? 99 : Math.floor(Math.random() * 12) + 85);
    this.toastService.success(`AI Diagnosis: ${finalResult.name}`);
  }

  resetScanner() {
    this.currentScanResult.set(null);
    this.left?.scanner?.reset();
    this.right?.wizard?.reset();
  }

  transferScanToLog() {
    const result = this.currentScanResult();
    if (result) {
      this.appState.journalPreset.set({
        diseaseId: result.id,
        field: 'Scanned Field',
        severity: result.severity === 'High' ? 40 : 15,
        notes: `Auto-diagnosed via AI scan. Symptoms match: ${result.symptoms.slice(0, 2).join(', ')}`
      });
      this.router.navigate(['/journal']);
    }
  }

  transferScanToPlanner() {
    const result = this.currentScanResult();
    if (result) {
      this.appState.plannerPresetDiseaseId.set(result.id);
      this.appState.plannerPresetSeverity.set(result.severity === 'High' ? 'severe' : 'moderate');
      this.router.navigate(['/planner']);
    }
  }

  openDossier(diseaseId: string) {
    this.appState.openDossier(diseaseId);
  }
}
