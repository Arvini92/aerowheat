import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, computed } from '@angular/core';
import { Icon } from '../../../../../design-system/icon/icon';
import { ScanResult } from '../../../left/scan-simulator/scan-simulator';

@Component({
  selector: 'app-treatment-timeline',
  standalone: true,
  imports: [Icon],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-lg">
      <h4 class="font-sans font-extrabold text-xs text-slate-400 uppercase tracking-wider mb-5">Suggested Treatment Timeline</h4>
      <div class="relative flex flex-col gap-6">
        <!-- Vertical Timeline Connector -->
        <div class="absolute left-[15px] top-4 bottom-4 w-[2px] bg-white/10"></div>
        
        @for (step of timelineSteps(); track step.label) {
          <div class="relative flex gap-4 items-start">
            <!-- Icon Bullet -->
            <div class="w-8 h-8 rounded-full bg-[#121612] border border-white/10 flex items-center justify-center shrink-0 z-10 text-base shadow-lg overflow-hidden">
               <app-icon size="sm" [class]="step.color">{{ step.icon }}</app-icon>
            </div>
            
            <!-- Content Card -->
            <div class="flex-grow min-w-0">
              <div class="flex items-center justify-between gap-2">
                <span class="font-bold text-sm text-[#f1f5f1] tracking-tight">{{ step.label }}</span>
                <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 shrink-0">
                  {{ step.time }}
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-1 leading-relaxed">{{ step.desc }}</p>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class TreatmentTimeline {
  scanResult = input.required<ScanResult>();

  timelineSteps = computed(() => {
    const res = this.scanResult();
    if (!res) return [];
    if (res.id === 'healthy') {
        return [{ label: 'Monitoring', desc: 'Continue regular field scouting', time: 'Ongoing', icon: 'visibility', color: 'text-emerald-400' }];
    }
    
    return [
      { label: 'Immediate Action', desc: res.treatment.immediate, time: 'Today', icon: 'warning', color: 'text-amber-400' },
      { label: 'Chemical Control', desc: res.treatment.chemical, time: '3-5 Days', icon: 'science', color: 'text-blue-400' },
      { label: 'Organic Alternatives', desc: res.treatment.organic, time: '5-7 Days', icon: 'eco', color: 'text-emerald-400' },
      { label: 'Preventive Measures', desc: res.treatment.preventive, time: 'Next Cycle', icon: 'shield', color: 'text-zinc-400' }
    ];
  });
}
