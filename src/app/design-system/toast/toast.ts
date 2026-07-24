import { Component, ChangeDetectionStrategy, ViewEncapsulation, inject } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { ButtonComponent } from '../button/button';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [
    MatIconModule,
    ButtonComponent
],
  templateUrl: './toast.html',
  styleUrls: ['./toast.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Toast {
  readonly data = inject(MAT_SNACK_BAR_DATA);
  readonly snackBarRef = inject(MatSnackBarRef);
}
