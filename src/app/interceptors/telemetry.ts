import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, retry, throwError, timer } from 'rxjs';
import { GlobalAlert } from '../errors/global-alert';

const TELEMETRY_ENDPOINT_PATTERN = /\/(telemetry|diagnostics|scan)(\/|$)/i;

export const telemetryInterceptor: HttpInterceptorFn = (req, next) => {
  const alerts = inject(GlobalAlert);
  const isTelemetryEndpoint = TELEMETRY_ENDPOINT_PATTERN.test(req.url);

  if (!isTelemetryEndpoint) {
    return next(req);
  }

  return next(req).pipe(
    retry({
      count: 2,
      delay: (_error, retryCount) => timer(retryCount * 1000)
    }),
    catchError((error: unknown) => {
      if (isSevereConnectivityError(error)) {
        alerts.push(
          'error',
          'Telemetry connection is unavailable. Local field data remains available.',
          'network'
        );
      }

      return throwError(() => error);
    })
  );
};

function isSevereConnectivityError(error: unknown): boolean {
  return error instanceof HttpErrorResponse && (error.status === 0 || error.status >= 500);
}
