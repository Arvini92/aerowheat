import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, computed } from '@angular/core';

@Component({
  selector: 'app-circular-chart',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 36 36" class="circular-chart w-full h-full">
      <path class="circle-bg"
        d="M18 2.0845 a 15.9 15.9 0 0 1 0 31.831 a 15.9 15.9 0 0 1 0 -31.831"
        stroke="rgba(255, 255, 255, 0.08)"
        stroke-width="3"
        fill="none"
      />
      <path class="circle"
        [style.stroke]="color()"
        [attr.stroke-dasharray]="strokeDashArray()"
        d="M18 2.0845 a 15.9 15.9 0 0 1 0 31.831 a 15.9 15.9 0 0 1 0 -31.831"
        stroke-width="3"
        stroke-linecap="round"
        fill="none"
        class="transition-all duration-500 ease-out"
      />
      <text x="18" y="20.5" class="percentage text-[8px] font-mono font-extrabold fill-[#f1f5f1] text-center" text-anchor="middle">
        {{ percentage() }}%
      </text>
    </svg>
  `,
  styles: [`
    .circular-chart {
      display: block;
    }
  `]
})
export class CircularChart {
  percentage = input.required<number>();
  color = input<string>('#10b981');

  strokeDashArray = computed(() => `${this.percentage()}, 100`);
}
