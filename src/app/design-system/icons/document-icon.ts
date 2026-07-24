import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-document-icon',
  standalone: true,
  template: `
    <svg viewBox="0 0 24 24" [style.width.px]="width()" [style.height.px]="height()" fill="none" stroke="currentColor" [attr.stroke-width]="strokeWidth()" [style]="style()">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentIcon {
  width = input<number>(60);
  height = input<number>(60);
  strokeWidth = input<number>(1.5);
  style = input<string>('');
}
