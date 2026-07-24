
import { Component, inject, input } from '@angular/core';
import { Icon } from '../../../design-system/icon/icon';
import { CommonModule } from '@angular/common';
import { GlassCard } from '../../../design-system/glass-card/glass-card';
import { AppState } from '../../../services/app-state';
import { ButtonComponent } from '../../../design-system/button/button';
import { Chip } from '../../../design-system/chip/chip';

interface Disease {
  id: string;
  type: string;
  name: string;
  scientific: string;
  desc: string;
  anatomy: string[];
}

@Component({
  selector: 'app-library-card',
  standalone: true,
  imports: [CommonModule, Icon, GlassCard, ButtonComponent, Chip],
  templateUrl: './library-card.html',
  styleUrl: './library-card.scss',
})
export class LibraryCard {
  readonly d = input.required<Disease>();
  private readonly appState = inject(AppState);

  openDossier(id: string): void {
    this.appState.openDossier(id);
  }
}
