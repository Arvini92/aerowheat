import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { ButtonComponent } from '../../../../../design-system/button/button';

@Component({
  selector: 'app-preset',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './preset.html',
  styleUrl: './preset.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Preset {
  readonly isScanning = input<boolean>(false);
  readonly presetSelected = output<string>();

  triggerScanSimulation(presetId: string): void {
    this.presetSelected.emit(presetId);
  }
}
