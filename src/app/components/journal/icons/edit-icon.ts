import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-edit-icon',
  standalone: true,
  template: `
    <svg viewBox="0 0 24 24" [style.width.px]="width()" [style.height.px]="height()" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M12 20h9"/>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditIcon {
  width = input<number>(12);
  height = input<number>(12);
}
