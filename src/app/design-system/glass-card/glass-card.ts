import { NgClass } from '@angular/common';
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-glass-card',
  standalone: true,
  imports: [MatCardModule, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './glass-card.html',
  styleUrl: './glass-card.scss',
})
export class GlassCard {
  readonly extraClass = input<string>('');
  readonly id = input<string>();
  readonly clicked = output<Event>();
}
