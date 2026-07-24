import { Component, ViewEncapsulation, signal, computed, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Disease, DISEASE_DATABASE } from '../../data';
import { AppState } from '../../services/app-state';
import { LibraryCard } from './library-card/library-card';
import { SelectComponent } from '../../design-system/select/select';
import { InputComponent } from '../../design-system/input/input';
import { Icon } from '../../design-system/icon/icon';

@Component({
  selector: 'app-library',
  imports: [
    FormsModule,
    LibraryCard,
    SelectComponent,
    InputComponent,
    Icon
  ],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './library.html',
  styleUrls: ['./library.scss']
})
export class Library {
  private readonly appState = inject(AppState);
  // Database reference
  diseases = DISEASE_DATABASE;

  // Filtering & Search state using Signals under the hood for ngModel dual-binding
  private _librarySearchText = signal('');
  get librarySearchText(): string { return this._librarySearchText(); }
  set librarySearchText(val: string) { this._librarySearchText.set(val); }

  private _libraryFilterAnatomy = signal('all');
  get libraryFilterAnatomy(): string { return this._libraryFilterAnatomy(); }
  set libraryFilterAnatomy(val: string) { this._libraryFilterAnatomy.set(val); }

  private _libraryFilterType = signal('all');
  get libraryFilterType(): string { return this._libraryFilterType(); }
  set libraryFilterType(val: string) { this._libraryFilterType.set(val); }



  filteredDiseases = computed<Disease[]>(() => {
    const searchText = this._librarySearchText();
    const filterAnatomy = this.libraryFilterAnatomy;
    const filterType = this.libraryFilterType;

    return this.diseases.filter(d => {
      const matchSearchText = !searchText ||
        d.name.toLowerCase().includes(searchText.toLowerCase()) ||
        d.scientific.toLowerCase().includes(searchText.toLowerCase()) ||
        d.desc.toLowerCase().includes(searchText.toLowerCase()) ||
        d.symptoms.some(s => s.toLowerCase().includes(searchText.toLowerCase()));

      const matchAnatomy = filterAnatomy === 'all' || d.anatomy.includes(filterAnatomy);
      const matchType = filterType === 'all' || d.type === filterType;

      return matchSearchText && matchAnatomy && matchType;
    });
  });

  readonly anatomyOptions = computed(() => [
    { value: 'all', label: 'All Anatomy Sections' },
    { value: 'head', label: 'Spike/Head' },
    { value: 'leaves', label: 'Leaves' },
    { value: 'stem', label: 'Stem' },
    { value: 'roots', label: 'Roots' }
  ]);

  readonly typeOptions = computed(() => [
    { value: 'all', label: 'All Pathogen Types' },
    { value: 'fungal', label: 'Fungal' },
    { value: 'viral', label: 'Viral' },
    { value: 'bacterial', label: 'Bacterial' }
  ]);

  onAnatomyChange(value: string): void {
    this._libraryFilterAnatomy.set(value);
  }

  onTypeChange(value: string): void {
    this._libraryFilterType.set(value);
  }

  openDossier(diseaseId: string) {
    this.appState.openDossier(diseaseId);
  }
}
