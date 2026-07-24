import { Component, input, computed, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-icon',
  imports: [MatIconModule],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-icon 
      [style.width]="sizePx()" 
      [style.height]="sizePx()" 
      [style.fontSize]="sizePx()"
      [style.lineHeight]="sizePx()"
      [class]="customClass()"
      aria-hidden="true"
    >
      <ng-content></ng-content>
    </mat-icon>
  `,
  styles: [`
    app-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      vertical-align: middle;
    }
    .mat-icon {
      margin: 0 !important;
    }
  `]
})
export class Icon {
  /** The icon name from Material Icons library */
  name = input<string>('');
  
  /** Size preset: sm (14px), md (18px), lg (24px) or numeric value in px */
  size = input<string | number>('md');
  
  /** Additional custom classes */
  customClass = input<string>('');

  protected readonly sizePx = computed(() => {
    const s = this.size();
    if (s === 'xs') return '12px';
    if (s === 'sm') return '14px';
    if (s === 'md') return '18px';
    if (s === 'lg') return '24px';
    if (s === 'xl') return '32px';
    return typeof s === 'number' ? `${s}px` : s;
  });
}
