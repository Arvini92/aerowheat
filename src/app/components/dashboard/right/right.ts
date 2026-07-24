import { Component, ChangeDetectionStrategy, input, output, ViewChild } from '@angular/core';
import { GlassCard } from '../../../design-system/glass-card/glass-card';
import { Report } from './report/report';
import { ScanResult } from '../left/scan-simulator/scan-simulator';
import { SymptomWizard } from './symptom-wizard/symptom-wizard';

@Component({
  selector: 'app-right',
  standalone: true,
  imports: [GlassCard, SymptomWizard, Report],
  templateUrl: './right.html',
  styleUrl: './right.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Right {
  @ViewChild(SymptomWizard) wizard!: SymptomWizard;

  readonly currentScanResult = input<ScanResult | null>(null);
  readonly scanConfidence = input<number>(0);
  readonly chartColor = input<string>('#10b981');

  readonly wizardDiagnosis = output<{
    diseaseId: string;
    anatomy: string[];
    symptoms: string[];
    weather: string;
    cropStage: string;
  }>();

  readonly exportPDF = output<void>();
  readonly transferScanToLog = output<void>();
  readonly transferScanToPlanner = output<void>();
  readonly openDossier = output<string>();
  readonly resetScanner = output<void>();

  onWizardDiagnosis(event: {
    diseaseId: string;
    anatomy: string[];
    symptoms: string[];
    weather: string;
    cropStage: string;
  }) {
    this.wizardDiagnosis.emit(event);
  }
}
