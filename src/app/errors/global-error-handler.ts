import { ErrorHandler, Injectable, inject } from '@angular/core';
import { GlobalAlert } from './global-alert';

@Injectable()
export class GlobalErrorHandler extends ErrorHandler {
  private readonly alerts = inject(GlobalAlert);

  override handleError(error: unknown): void {
    this.alerts.push('error', this.getMessage(error), 'runtime');
  }

  private getMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'An unexpected application error was contained.';
  }
}
