import { Component, ChangeDetectionStrategy, effect, signal, computed, ViewEncapsulation, inject } from '@angular/core';

import { DISEASE_DATABASE } from '../../data';
import { DiagnosticChart } from './diagnostic-chart/diagnostic-chart';
import { JournalLog, Storage } from './storage';
import { AppState } from '../../services/app-state';
import { Record } from './record/record';
import { Charts } from './charts/charts';
import { Logs } from './logs/logs';
import { ToastService } from '../../design-system/toast/toast.service';
@Component({
  selector: 'app-journal',
  standalone: true,
  imports: [
    DiagnosticChart,
    Record,
    Charts,
    Logs
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './journal.html',
  styleUrls: ['./journal.scss']
})
export class Journal {
  private readonly appState = inject(AppState);
  private readonly toastService = inject(ToastService);

  // Database list
  diseases = DISEASE_DATABASE;

  // Signal Logs State
  private storage = inject(Storage);
  private _logs = signal<JournalLog[]>(this.storage.loadLogs());

  logs = this._logs.asReadonly();

  // Form Fields State — signals for two-way binding with record child
  readonly logField = signal<string>('');
  readonly logDiseaseId = signal<string>('');
  readonly logSeverity = signal<number>(5);
  readonly logNotes = signal<string>('');
  editingLogId: number | null = null;

  // Analytics Computations using Signals
  barLabels = ['Rusts', 'Blights', 'Mildew', 'Roots'];
  barColors = ['var(--accent-gold)', 'var(--color-danger)', 'var(--color-info)', 'var(--primary)'];

  analytics = computed(() => {
    const currentLogs = this._logs();
    if (currentLogs.length === 0) {
      return {
        diseaseStats: [0, 0, 0, 0],
        lowPercent: 0,
        medPercent: 0,
        highPercent: 0
      };
    }

    let rustCount = 0;
    let blightCount = 0;
    let mildewCount = 0;
    let rootCount = 0;

    let lowCount = 0;
    let medCount = 0;
    let highCount = 0;

    currentLogs.forEach(log => {
      // Pathology frequencies
      if (log.diseaseId.includes('rust')) {
        rustCount++;
      } else if (log.diseaseId.includes('blight') || log.diseaseId.includes('septoria')) {
        blightCount++;
      } else if (log.diseaseId.includes('mildew')) {
        mildewCount++;
      } else if (log.diseaseId.includes('take_all') || log.diseaseId.includes('smut')) {
        rootCount++;
      }

      // Severity levels
      if (log.severity < 15) {
        lowCount++;
      } else if (log.severity < 35) {
        medCount++;
      } else {
        highCount++;
      }
    });

    const total = currentLogs.length;
    return {
      diseaseStats: [rustCount, blightCount, mildewCount, rootCount],
      lowPercent: Math.round((lowCount / total) * 100),
      medPercent: Math.round((medCount / total) * 100),
      highPercent: Math.round((highCount / total) * 100)
    };
  });

  diseaseStats = computed(() => this.analytics().diseaseStats);
  lowPercent = computed(() => this.analytics().lowPercent);
  medPercent = computed(() => this.analytics().medPercent);
  highPercent = computed(() => this.analytics().highPercent);

  constructor() {
    effect(() => {
      this.storage.saveLogs(this._logs());
    });
    
    effect(() => {
      const ext = this.appState.journalPreset();
      if (ext) {
        this.logField.set(ext.field);
        this.logDiseaseId.set(ext.diseaseId);
        this.logSeverity.set(ext.severity);
        this.logNotes.set(ext.notes);
        this.addOrUpdateLogEntry();
        
        // Clean presets so they don't re-trigger
        this.appState.journalPreset.set(null);
      }
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (!this.logField() || !this.logDiseaseId() || !this.logSeverity()) {
      alert('Please fill out all required fields to record an observation.');
      return;
    }
    this.addOrUpdateLogEntry();
  }

  addOrUpdateLogEntry() {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    if (this.editingLogId !== null) {
      const idToEdit = this.editingLogId;
      // Update existing
      this._logs.update(current => current.map(log => {
        if (log.id === idToEdit) {
          return {
            ...log,
            field: this.logField(),
            diseaseId: this.logDiseaseId(),
            severity: this.logSeverity(),
            notes: this.logNotes()
          };
        }
        return log;
      }));
      this.toastService.success('Journal observation updated.');
      this.editingLogId = null;
    } else {
      // Create new
      const currentLogs = this._logs();
      const nextId = currentLogs.length > 0 ? Math.max(...currentLogs.map(l => l.id)) + 1 : 1;
      const newLog: JournalLog = {
        id: nextId,
        date: today,
        field: this.logField(),
        diseaseId: this.logDiseaseId(),
        severity: this.logSeverity(),
        notes: this.logNotes()
      };
      this._logs.update(current => [newLog, ...current]);
      this.toastService.success('Observation saved to journal.');
    }

    this.resetForm();
  }

  editLog(log: JournalLog) {
    this.editingLogId = log.id;
    this.logField.set(log.field);
    this.logDiseaseId.set(log.diseaseId);
    this.logSeverity.set(log.severity);
    this.logNotes.set(log.notes);
  }

  cancelEdit() {
    this.editingLogId = null;
    this.resetForm();
  }

  deleteLog(id: number) {
    this._logs.update(current => current.filter(l => l.id !== id));
    this.toastService.success('Observation deleted.');
  }

  clearAllLogs() {
    this._logs.set([]);
    this.toastService.success('All journal observations cleared.');
  }

  resetForm() {
    this.logField.set('');
    this.logDiseaseId.set('');
    this.logSeverity.set(5);
    this.logNotes.set('');
  }
}
