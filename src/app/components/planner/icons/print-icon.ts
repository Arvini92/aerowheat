import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-print-icon',
  standalone: true,
  template: `
    <svg viewBox="0 0 24 24" [style.width.px]="width()" [style.height.px]="height()" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrintIcon {
  width = input<number>(14);
  height = input<number>(14);
}
