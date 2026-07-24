import { Component, ChangeDetectionStrategy, ViewChild, output } from '@angular/core';
import { GlassCard } from '../../../design-system/glass-card/glass-card';
import { ScanSimulator, ScanResult } from './scan-simulator/scan-simulator';

@Component({
  selector: 'app-left',
  standalone: true,
  imports: [GlassCard, ScanSimulator],
  templateUrl: './left.html',
  styleUrl: './left.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Left {
  @ViewChild(ScanSimulator) scanner!: ScanSimulator;

  readonly scanComplete = output<{ result: ScanResult; confidence: number }>();

  onScanComplete(event: { result: ScanResult; confidence: number }) {
    this.scanComplete.emit(event);
  }
}
