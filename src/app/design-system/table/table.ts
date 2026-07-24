import {
  Component,
  Directive,
  TemplateRef,
  inject,
  contentChildren,
  computed,
  input,
  ViewEncapsulation,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';

export interface TableColumnDefinition {
  key: string;
  label: string;
  headerClass?: string;
  cellClass?: string;
}

@Directive({
  selector: '[appTableCell]',
})
export class TableCellDirective {
  /** The name of the column this cell template should be used for. */
  readonly columnName = input.required<string>({ alias: 'appTableCell' });
  readonly templateRef = inject(TemplateRef);
}

@Component({
  selector: 'app-table',
  imports: [CommonModule, MatTableModule],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-wrapper" [attr.id]="id() ? id() + '-wrapper' : null">
      <table mat-table [dataSource]="data()" class="app-mat-table" [attr.id]="id() || null">
        @for (col of columns(); track col.key) {
          <ng-container [matColumnDef]="col.key">
            <th
              mat-header-cell
              *matHeaderCellDef
              [class]="col.headerClass || ''"
              [attr.id]="id() ? id() + '-th-' + col.key : null"
            >
              {{ col.label }}
            </th>
            <td
              mat-cell
              *matCellDef="let element"
              [class]="col.cellClass || ''"
              [attr.id]="id() && element.id ? id() + '-td-' + col.key + '-' + element.id : null"
            >
              @if (templatesMap()[col.key]; as template) {
                <ng-container
                  *ngTemplateOutlet="template; context: { $implicit: element, value: element[col.key] }"
                ></ng-container>
              } @else {
                {{ element[col.key] }}
              }
            </td>
          </ng-container>
        }

        <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
        <tr
          mat-row
          *matRowDef="let row; columns: displayedColumns()"
          [attr.id]="id() && row.id ? id() + '-row-' + row.id : null"
        ></tr>
      </table>
    </div>
  `,
  styles: `
    app-table {
      display: block;
      width: 100%;
      box-sizing: border-box;
    }

    app-table .table-wrapper {
      overflow-x: auto;
      width: 100%;
    }

    app-table table.mat-mdc-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      background: transparent !important;
    }

    app-table .mat-mdc-header-cell {
      padding: 8px 12px !important;
      font-size: 9px !important;
      font-weight: 800 !important;
      text-transform: uppercase !important;
      color: var(--text-muted) !important;
      border-bottom: 1.5px solid var(--glass-border) !important;
      letter-spacing: 0.05em !important;
      font-family: var(--font-sans) !important;
      background: transparent !important;
    }

    app-table .mat-mdc-cell {
      padding: 8px 12px !important;
      font-size: 11px !important;
      border-bottom: 1px solid var(--glass-border-subtle) !important;
      color: rgba(255, 255, 255, 0.85) !important;
      font-family: var(--font-sans) !important;
      background: transparent !important;
    }

    app-table .mat-mdc-row {
      background: transparent !important;
      transition: background-color 0.2s ease;
    }

    app-table .mat-mdc-row:hover {
      background: rgba(255, 255, 255, 0.015) !important;
    }

    app-table .mat-mdc-row:hover .mat-mdc-cell {
      background: rgba(255, 255, 255, 0.015) !important;
    }

    app-table .mat-mdc-header-row {
      background: transparent !important;
    }

    app-table .actions-column {
      text-align: right !important;
    }

    app-table .action-btn-group {
      display: inline-flex;
      gap: 4px;
    }
  `,
  host: {
    '[class.app-table-host]': 'true',
    '[style.position]': '"relative"',
  },
})
export class TableComponent {
  /** Unique ID for tracking. */
  readonly id = input<string>('');

  /** Table dataset. */
  readonly data = input.required<unknown[]>();

  /** Column configuration definitions. */
  readonly columns = input.required<TableColumnDefinition[]>();

  /** Retrieve cell templates defined in content projection. */
  private readonly cellDirectives = contentChildren(TableCellDirective);

  /** Map dynamic column keys to projected templates. */
  protected readonly templatesMap = computed(() => {
    const map: Record<string, TemplateRef<unknown>> = {};
    for (const dir of this.cellDirectives()) {
      map[dir.columnName()] = dir.templateRef;
    }
    return map;
  });

  /** Ordered list of displayed columns. */
  protected readonly displayedColumns = computed(() => this.columns().map(c => c.key));
}
