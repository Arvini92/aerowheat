import { Component, input, output, ViewEncapsulation, forwardRef, signal } from '@angular/core';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';

@Component({
  selector: 'app-select',
  imports: [MatSelect, MatOption, CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <mat-select
      [id]="id()"
      [class]="getSelectClasses()"
      [class.custom-select--error]="error()"
      panelClass="custom-select-panel"
      [ngModel]="internalValue()"
      (ngModelChange)="onInternalValueChange($event)"
      [disabled]="isDisabled()"
      [placeholder]="placeholder()"
      [required]="required()"
      (selectionChange)="onSelectionChange($event)"
      (blur)="onBlur()"
    >
      @if (showPlaceholder()) {
      <mat-option value="" disabled>{{ placeholder() }}</mat-option>
      }
      @for (option of options(); track option.value) {
      <mat-option [value]="option.value">{{ option.label }}</mat-option>
      }
    </mat-select>
    @if (error()) {
      <div class="custom-select__error" role="alert">{{ error() }}</div>
    }
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }

    app-select mat-select {
      display: block !important;
      width: 100% !important;
      box-sizing: border-box !important;
      background: rgba(0, 0, 0, 0.5) !important;
      border: 1px solid var(--glass-border) !important;
      border-radius: 8px !important;
      /* Match custom-input height: 40px = padding + line-height */
      min-height: 40px !important;
      height: 40px !important;
      padding: 0 10px !important;
      font-family: var(--font-sans) !important;
      color: #ffffff !important;
      outline: none !important;
      font-size: 11px !important;
      cursor: pointer !important;
      transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
    }

    app-select mat-select.custom-select--error {
      border-color: var(--color-danger, #ff4444) !important;
    }

    .custom-select__error {
      color: var(--color-danger, #ff4444);
      font-size: 10px;
      margin-top: 4px;
      padding-left: 4px;
    }

    app-select mat-select:hover {
      border-color: #ffffff !important;
    }

    app-select mat-select:hover .mat-mdc-select-arrow {
      color: #ffffff !important;
    }

    app-select mat-select:focus {
      border-color: var(--primary) !important;
    }

    app-select mat-select:focus .mat-mdc-select-arrow {
      color: var(--primary) !important;
    }

    app-select mat-select .mat-mdc-select-trigger {
      display: flex !important;
      align-items: center !important;
      height: 100% !important;
      min-height: unset !important;
      padding: 0 !important;
    }

    app-select mat-select .mat-mdc-select-value {
      font-family: var(--font-sans) !important;
      font-size: 11px !important;
      color: #ffffff !important;
      padding: 0 !important;
    }

    app-select mat-select .mat-mdc-select-value-text {
      font-family: var(--font-sans) !important;
      font-size: 11px !important;
      color: #ffffff !important;
    }

    app-select mat-select .mat-mdc-select-placeholder {
      color: #a1a1aa !important;
    }

    app-select mat-select .mat-mdc-select-arrow-wrapper {
      background: transparent !important;
      background-color: transparent !important;
    }

    app-select mat-select .mat-mdc-select-arrow {
      color: var(--text-muted) !important;
      fill: currentColor !important;
      background: transparent !important;
      background-color: transparent !important;
      transition: color 0.2s ease !important;
    }

    app-select mat-select.mat-mdc-select-disabled {
      opacity: 0.5 !important;
      cursor: not-allowed !important;
    }

    /* Panel styling */
    .custom-select-panel {
      background: var(--bg-dark-core) !important;
      border: 1px solid var(--glass-border) !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
      padding: 4px 0 !important;
    }

    .custom-select-panel mat-option {
      background-color: var(--bg-dark-core) !important;
      color: #ffffff !important;
      font-family: var(--font-sans) !important;
      font-size: 11px !important;
      min-height: 36px !important;
    }

    .custom-select-panel mat-option.mat-mdc-option:hover {
      background: rgba(74, 214, 109, 0.1) !important;
    }

    .custom-select-panel mat-option.mat-mdc-option-selected {
      background: rgba(74, 214, 109, 0.2) !important;
      color: var(--primary) !important;
    }

    .custom-select-panel mat-option.mat-mdc-option-disabled {
      color: #a1a1aa !important;
      opacity: 1 !important;
    }
  `,
  host: {
    '[class.full-width]': 'fullWidth()',
  }
})
export class SelectComponent implements ControlValueAccessor {
  options = input<{ value: string; label: string }[]>([]);
  ngValue = input<string>('');
  placeholder = input<string>('Select an option');
  id = input<string>('');
  disabled = input(false);
  required = input(false);
  fullWidth = input(true);
  showPlaceholder = input(true);
  error = input<string>('');

  valueChange = output<string>();
  selectionChanged = output<MatSelectChange>();

  protected internalValue = signal<string>('');
  protected isDisabled = signal<boolean>(false);

  // ControlValueAccessor ────────────────────────────────────────────────────
  private onChangeFn: (value: string) => void = () => void 0;
  private onTouchedFn: () => void = () => void 0;

  writeValue(value: string): void {
    this.internalValue.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  getSelectClasses(): string {
    return 'custom-select';
  }

  onInternalValueChange(newValue: string): void {
    this.internalValue.set(newValue);
    this.onChangeFn(newValue);
    this.valueChange.emit(newValue);
  }

  onSelectionChange(event: MatSelectChange): void {
    this.selectionChanged.emit(event);
  }

  onBlur(): void {
    this.onTouchedFn();
  }

  onValueChange(newValue: string): void {
    this.valueChange.emit(newValue);
  }
}