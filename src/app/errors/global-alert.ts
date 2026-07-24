import { Injectable, computed, signal } from '@angular/core';

export type AlertStatus = 'info' | 'warning' | 'error' | 'success';

export interface IGlobalAlert {
  id: number;
  status: AlertStatus;
  message: string;
  timestamp: string;
  source?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GlobalAlert {
  private readonly alertsSignal = signal<IGlobalAlert[]>([]);
  private nextId = 1;

  readonly alerts = this.alertsSignal.asReadonly();
  readonly latest = computed(() => this.alertsSignal().at(-1) ?? null);

  push(status: AlertStatus, message: string, source?: string): void {
    const alert: IGlobalAlert = {
      id: this.nextId++,
      status,
      message,
      source,
      timestamp: new Date().toISOString()
    };

    this.alertsSignal.update((alerts) => [...alerts.slice(-9), alert]);
  }

  dismiss(id: number): void {
    this.alertsSignal.update((alerts) => alerts.filter((alert) => alert.id !== id));
  }

  clear(): void {
    this.alertsSignal.set([]);
  }
}
