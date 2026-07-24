import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-upload-icon',
  standalone: true,
  template: `
    <svg viewBox="0 0 24 24" [style.width.px]="width()" [style.height.px]="height()" fill="none" stroke="#DDA15E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadIcon {
  width = input<number>(48);
  height = input<number>(48);
}
