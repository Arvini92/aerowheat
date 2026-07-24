import { Injectable, signal, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DISEASE_DATABASE } from '../data';
import { DossierModal } from '../components/dossier-modal/dossier-modal';

@Injectable({
  providedIn: 'root'
})
export class AppState {
  private readonly dialog = inject(MatDialog);

  // Model status
  readonly modelStatus = signal<string>('Loading AI vision model...');
  readonly modelStatusClass = signal<string>('status-pill');

  // Inter-component presets
  readonly journalPreset = signal<{ diseaseId: string; field: string; severity: number; notes: string } | null>(null);
  readonly plannerPresetDiseaseId = signal<string | null>(null);
  readonly plannerPresetSeverity = signal<'mild' | 'moderate' | 'severe' | null>(null);

  openDossier(diseaseId: string) {
    const match = DISEASE_DATABASE.find(d => d.id === diseaseId);
    if (match) {
      this.dialog.open(DossierModal, {
        data: match,
        panelClass: 'glassmorphic-dialog-panel'
      });
    }
  }
}
