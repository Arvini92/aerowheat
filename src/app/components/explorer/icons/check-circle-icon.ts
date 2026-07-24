import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-check-circle-icon',
  standalone: true,
  template: `
    <svg viewBox="0 0 24 24" [style.width.px]="width()" [style.height.px]="height()" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckCircleIcon {
  width = input<number>(16);
  height = input<number>(16);
}
