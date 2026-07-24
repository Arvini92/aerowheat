import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { GlassCard } from '../../../design-system/glass-card/glass-card';

@Component({
  selector: 'app-anatomy',
  standalone: true,
  imports: [GlassCard],
  templateUrl: './anatomy.html',
  styleUrl: './anatomy.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Anatomy {
  readonly selectedSection = input.required<string>();
  readonly selectSection = output<string>();
}
