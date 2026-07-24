import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [],
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBar {
  readonly scanStatusText = input.required<string>();
  readonly scanProgress = input.required<number>();
}
