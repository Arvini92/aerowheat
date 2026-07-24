import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { GlassCard } from '../../../design-system/glass-card/glass-card';

@Component({
  selector: 'app-charts',
  standalone: true,
  imports: [GlassCard],
  templateUrl: './charts.html',
  styleUrl: './charts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Charts {
  readonly diseaseStats = input.required<number[]>();
  readonly barColors = input.required<string[]>();
  readonly barLabels = input.required<string[]>();
  readonly lowPercent = input.required<number>();
  readonly medPercent = input.required<number>();
  readonly highPercent = input.required<number>();
}
