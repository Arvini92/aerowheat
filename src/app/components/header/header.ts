import { Component, ChangeDetectionStrategy, inject } from '@angular/core';

import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AppState } from '../../services/app-state';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterModule,
    MatIconModule
],
changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  protected readonly appState = inject(AppState);
}