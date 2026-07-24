import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-search-icon',
  standalone: true,
  template: `
    <svg [class]="className()" viewBox="0 0 24 24" [style.width.px]="width()" [style.height.px]="height()" fill="none" stroke="currentColor" stroke-width="2.5">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchIcon {
  width = input<number>(16);
  height = input<number>(16);
  className = input<string>('');
}
