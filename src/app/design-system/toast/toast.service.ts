import { inject, Injectable, signal } from '@angular/core';
import { Toast } from './toast';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';

export interface IToast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'danger' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private _toast = signal<IToast | null>(null);
  private readonly snackBar = inject(MatSnackBar);
  private snackBarRef: MatSnackBarRef<Toast> | undefined;
  toast = this._toast.asReadonly();

  show(message: string, type: IToast['type'] = 'success', duration = 4000) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: IToast = { id, message, type };

    this._toast.update(() => newToast);

    this.snackBarRef = this.snackBar.openFromComponent(Toast, {
      duration,
      data: { message, type },
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: ['glassmorphic-snackbar-panel', type]
    });
  }

  success(message: string, duration = 4000) {
    this.show(message, 'success', duration);
  }

  info(message: string, duration = 4000) {
    this.show(message, 'info', duration);
  }

  warning(message: string, duration = 4000) {
    this.show(message, 'warning', duration);
  }

  error(message: string, duration = 4000) {
    this.show(message, 'error', duration);
  }

  danger(message: string, duration = 4000) {
    this.show(message, 'danger', duration);
  }

  dismiss() {
    this.snackBarRef?.dismiss();
  }
}
