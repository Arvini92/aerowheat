import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { ScanResult } from '../../../left/scan-simulator/scan-simulator';
import { ButtonComponent } from '../../../../../design-system/button/button';

@Component({
  selector: 'app-buttons',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Buttons {
  readonly currentScanResult = input.required<ScanResult | null>();

  readonly exportPDF = output<void>();
  readonly transferScanToLog = output<void>();
  readonly transferScanToPlanner = output<void>();
  readonly openDossier = output<string>();
  readonly resetScanner = output<void>();

  onExportToPDF(): void {
    this.exportPDF.emit();
  }

  onTransferScanToLog(): void {
    this.transferScanToLog.emit();
  }

  onTransferScanToPlanner(): void {
    this.transferScanToPlanner.emit();
  }

  onOpenDossier(id: string): void {
    this.openDossier.emit(id);
  }

  onResetScanner(): void {
    this.resetScanner.emit();
  }

  onPrintReport(): void {
    window.print();
  }
}

