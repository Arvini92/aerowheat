import { Component, ChangeDetectionStrategy, ViewEncapsulation, input } from '@angular/core';


@Component({
  selector: 'app-probability-bar',
  standalone: true,
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full mt-2">
      <div class="flex justify-between items-center mb-1 text-xs font-mono text-slate-400">
        <span>AI Confidence</span>
        <span class="font-bold text-[#f1f5f1]">{{ score() }}%</span>
      </div>
      <div class="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
        <div class="h-full transition-all duration-500 ease-out" 
             [style.width.%]="score()" 
             [style.background-color]="getColor()"></div>
      </div>
    </div>
  `
})
export class ProbabilityBar {
  score = input.required<number>();

  getColor(): string {
    const s = this.score();
    if (s > 90) return '#10b981'; // green
    if (s > 75) return '#f59e0b'; // amber
    return '#ef4444'; // red
  }
}
