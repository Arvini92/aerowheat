import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-trash-icon',
  standalone: true,
  template: `
    <svg viewBox="0 0 24 24" [style.width.px]="width()" [style.height.px]="height()" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      @if (showDetails()) {
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
      }
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrashIcon {
  width = input<number>(14);
  height = input<number>(14);
  showDetails = input<boolean>(true);
}
