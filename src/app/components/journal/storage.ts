import { Injectable } from '@angular/core';

export interface JournalLog {
  id: number;
  date: string;
  field: string;
  diseaseId: string;
  severity: number;
  notes: string;
}

@Injectable({ providedIn: 'root' })
export class Storage {
  private STORAGE_KEY = 'wheat_disease_logs';

  saveLogs(logs: JournalLog[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
  }

  loadLogs(): JournalLog[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
}
