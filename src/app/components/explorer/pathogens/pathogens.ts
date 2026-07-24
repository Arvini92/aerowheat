import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { GlassCard } from '../../../design-system/glass-card/glass-card';
import { Disease } from '../../../data';
import { Chip } from '../../../design-system/chip/chip';

@Component({
  selector: 'app-pathogens',
  standalone: true,
  imports: [GlassCard, Chip],
  templateUrl: './pathogens.html',
  styleUrl: './pathogens.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pathogens {
  readonly currentPathogens = input.required<Disease[]>();
  readonly openDossier = output<string>();
}
