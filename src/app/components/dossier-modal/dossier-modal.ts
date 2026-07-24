import { Component, ChangeDetectionStrategy, ViewEncapsulation, inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Disease } from '../../data';
import { ButtonComponent } from '../../design-system/button/button';
import { Chip } from '../../design-system/chip/chip';

@Component({
  selector: 'app-dossier-modal',
  standalone: true,
  imports: [
    MatDialogModule,
    MatIconModule,
    ButtonComponent,
    Chip
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dossier-modal.html',
  styleUrls: ['./dossier-modal.scss']
})
export class DossierModal {
  readonly dialogRef = inject(MatDialogRef<DossierModal>);
  readonly dossier = inject<Disease>(MAT_DIALOG_DATA);

  closeModal() {
    this.dialogRef.close();
  }
}
