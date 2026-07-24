import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { Buttons } from './buttons/buttons';
import { CircularChart } from './circular-chart/circular-chart';
import { TreatmentTimeline } from './treatment-timeline/treatment-timeline';
import { TrendChart } from './trend-chart/trend-chart';
import { WeatherForecast } from './weather-forecast/weather-forecast';
import { CropHealthTip } from './crop-health-tip/crop-health-tip';
import { ScoutingPlanner } from './scouting-planner/scouting-planner';
import { ScanResult } from '../../left/scan-simulator/scan-simulator';
import { MapViz } from './map-viz/map-viz';
@Component({
  selector: 'app-report',
  standalone: true,
  imports: [
    Buttons,
    CircularChart,
    TreatmentTimeline,
    TrendChart,
    MapViz,
    WeatherForecast,
    CropHealthTip,
    ScoutingPlanner,
  ],
  templateUrl: './report.html',
  styleUrl: './report.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Report {
  readonly currentScanResult = input.required<ScanResult | null>();
  readonly scanConfidence = input.required<number>();
  readonly chartColor = input.required<string>();

  readonly exportPDF = output<void>();
  readonly transferScanToLog = output<void>();
  readonly transferScanToPlanner = output<void>();
  readonly openDossier = output<string>();
  readonly resetScanner = output<void>();

  readonly printDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  readonly printReportId = Math.floor(100000 + Math.random() * 900000).toString();
}
