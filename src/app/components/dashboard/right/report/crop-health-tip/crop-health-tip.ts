import { Component, ChangeDetectionStrategy, ViewEncapsulation, signal, inject, OnInit } from '@angular/core';
import { Icon } from '../../../../../design-system/icon/icon';
import { CropHealth, ICropHealthTip } from './crop-health';

@Component({
  selector: 'app-crop-health-tip',
  standalone: true,
  imports: [Icon],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 bg-emerald-50 rounded-2xl shadow-sm border border-emerald-100 mt-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-emerald-100 rounded-lg text-emerald-700 flex items-center justify-center">
            <app-icon size="sm">shield</app-icon>
        </div>
        <h4 class="font-sans font-medium text-lg text-emerald-900 tracking-tight">Crop Health Tip</h4>
      </div>
      @if (tip(); as data) {
        <h5 class="font-medium text-emerald-800 mb-1">{{ data.title }}</h5>
        <p class="text-sm text-emerald-700/80 leading-relaxed">{{ data.tip }}</p>
      } @else {
        <p class="text-sm text-emerald-700/60">Loading daily tip...</p>
      }
    </div>
  `
})
export class CropHealthTip implements OnInit {
  private service = inject(CropHealth);
  tip = signal<ICropHealthTip | null>({
    title: 'Optimal Irrigation Timing',
    tip: 'Schedule irrigation for early morning or late evening to minimize evaporation and reduce the risk of fungal spread.'
  });

  ngOnInit() {
    console.log('CropHealthTip component initialized');
    // For now we use the fallback above, but we can enable the service later
    // this.service.getTip().subscribe({
    //   next: data => this.tip.set(data),
    //   error: err => console.error('Failed to fetch dynamic health tip', err)
    // });
  }
}
