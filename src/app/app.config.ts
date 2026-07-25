import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { ApplicationConfig, ErrorHandler, importProvidersFrom, inject, isDevMode, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { GlobalErrorHandler } from './errors/global-error-handler';
import { telemetryInterceptor } from './interceptors/telemetry';
import { routes } from './app-routing';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ServiceWorkerModule } from '@angular/service-worker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { AiService } from './components/chat-bot/ai.service';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      BrowserModule, 
      FormsModule,
      MatDialogModule,
      MatSnackBarModule,
      MatSelectModule,
      ServiceWorkerModule.register('ngsw-worker.js', {
        enabled: !isDevMode(),
        registrationStrategy: 'registerWhenStable:30000'
      })
    ),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withXhr(), withInterceptors([telemetryInterceptor])),
    provideZonelessChangeDetection(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideAppInitializer(() => {
      const aiService = inject(AiService);
      aiService.init();
    })
  ]
};
