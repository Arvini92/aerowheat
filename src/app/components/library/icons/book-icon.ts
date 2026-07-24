import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-book-icon',
  standalone: true,
  template: `
    <svg viewBox="0 0 24 24" [style.width.px]="width()" [style.height.px]="height()" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookIcon {
  width = input<number>(14);
  height = input<number>(14);
}
