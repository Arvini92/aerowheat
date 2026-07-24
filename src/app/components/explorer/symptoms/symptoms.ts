import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { GlassCard } from '../../../design-system/glass-card/glass-card';
import { CheckCircleIcon } from '../icons/check-circle-icon';

@Component({
  selector: 'app-symptoms',
  standalone: true,
  imports: [GlassCard, CheckCircleIcon],
  templateUrl: './symptoms.html',
  styleUrl: './symptoms.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Symptoms {
  readonly selectedSectionTitle = input.required<string>();
  readonly selectedSectionDesc = input.required<string>();
  readonly currentSymptoms = input.required<{ text: string; detail: string }[]>();
}
