// Standalone routing configuration — NgModule removed
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard/dashboard').then(
        (m) => m.Dashboard
      ),
  },
  {
    path: 'explorer',
    loadComponent: () =>
      import('./components/explorer/explorer').then(
        (m) => m.Explorer
      ),
  },
  {
    path: 'library',
    loadComponent: () =>
      import('./components/library/library').then(
        (m) => m.Library
      ),
  },
  {
    path: 'planner',
    loadComponent: () =>
      import('./components/planner/planner').then(
        (m) => m.Planner
      ),
  },
  {
    path: 'journal',
    loadComponent: () =>
      import('./components/journal/journal').then(
        (m) => m.Journal
      ),
  },
  { path: '**', redirectTo: 'dashboard' },
];
