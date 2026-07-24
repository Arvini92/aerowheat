import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { GlassCard } from '../../../design-system/glass-card/glass-card';
import { JournalLog } from '../storage';
import { TrashIcon } from '../icons/trash-icon';
import { EditIcon } from '../icons/edit-icon';
import { DocumentIcon } from '../../../design-system/icons/document-icon';
import { DISEASE_DATABASE } from '../../../data';
import { ButtonComponent } from '../../../design-system/button/button';
import { TableComponent, TableCellDirective, TableColumnDefinition } from '../../../design-system/table/table';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [
    GlassCard,
    TrashIcon,
    EditIcon,
    DocumentIcon,
    ButtonComponent,
    TableComponent,
    TableCellDirective,
  ],
  templateUrl: './logs.html',
  styleUrl: './logs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Logs {
  readonly logs = input.required<JournalLog[]>();

  readonly clearAll = output<void>();
  readonly edit = output<JournalLog>();
  readonly delete = output<number>();

  readonly columns: TableColumnDefinition[] = [
    { key: 'date', label: 'Date' },
    { key: 'field', label: 'Field Zone' },
    { key: 'diseaseId', label: 'Diagnosis' },
    { key: 'severity', label: 'Severity' },
    { key: 'actions', label: 'Actions', headerClass: 'actions-column', cellClass: 'actions-column' },
  ];

  getDiseaseName(diseaseId: string): string {
    if (diseaseId === 'healthy') return 'Healthy Wheat';
    return DISEASE_DATABASE.find(d => d.id === diseaseId)?.name || 'Unknown Pathology';
  }

  getSeverityLabel(sev: number): string {
    if (sev < 15) return 'Low';
    if (sev < 35) return 'Medium';
    return 'High';
  }

  clearAllLogs(): void {
    this.clearAll.emit();
  }

  editLog(log: JournalLog): void {
    this.edit.emit(log);
  }

  deleteLog(id: number): void {
    this.delete.emit(id);
  }
}
