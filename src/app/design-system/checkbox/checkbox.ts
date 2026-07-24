import { Component, input, output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-checkbox',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
  template: `
    <label
      class="app-checkbox"
      [class.app-checkbox--checked]="checked()"
      [class.app-checkbox--disabled]="disabled()"
      [attr.id]="labelId()"
    >
      <input
        type="checkbox"
        class="app-checkbox__input"
        [name]="name()"
        [checked]="checked()"
        [disabled]="disabled()"
        [attr.aria-checked]="checked()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-labelledby]="ariaLabelledBy() || null"
        (change)="onInputChange($event)"
        (blur)="onTouched()"
      />
      <span class="app-checkbox__box" aria-hidden="true"></span>
      @if (label()) {
        <span class="app-checkbox__text">{{ label() }}</span>
      }
      <ng-content />
    </label>
  `,
  styles: `
    :host {
      display: contents;
    }

    .app-checkbox {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.01);
      border: 1px solid var(--glass-border-subtle);
      padding: 10px;
      border-radius: 8px;
      transition: all 0.2s ease;
      user-select: none;
    }

    .app-checkbox:hover:not(.app-checkbox--disabled) {
      background: rgba(255, 255, 255, 0.04);
      border-color: var(--primary);
    }

    .app-checkbox--disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .app-checkbox--checked {
      border-color: rgba(74, 214, 109, 0.35);
      background: rgba(74, 214, 109, 0.04);
    }

    .app-checkbox__input {
      display: none;
    }

    .app-checkbox__box {
      width: 14px;
      height: 14px;
      border-radius: 3px;
      border: 1.5px solid rgba(255, 255, 255, 0.3);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      position: relative;
      transition:
        background 0.15s ease,
        border-color 0.15s ease;
    }

    .app-checkbox--checked .app-checkbox__box {
      background: var(--primary);
      border-color: var(--primary);
    }

    .app-checkbox--checked .app-checkbox__box::after {
      content: '✓';
      color: #000000;
      font-size: 10px;
      font-weight: 900;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      line-height: 1;
    }

    .app-checkbox__text {
      font-size: 11px;
      font-weight: 700;
      color: inherit;
    }
  `,
  host: {
    '[class.app-checkbox-host]': 'true',
  },
})
export class CheckboxComponent implements ControlValueAccessor {
  /** Visible label text rendered inside the component. */
  label = input<string>('');

  /** The `name` attribute forwarded to the underlying `<input>`. */
  name = input<string>('');

  /** Whether the checkbox is checked (uncontrolled / signal-driven usage). */
  checked = input<boolean>(false);

  /** Disables the checkbox when true. */
  disabled = input<boolean>(false);

  /** Optional `id` applied to the wrapping `<label>` element. */
  labelId = input<string>('');

  /** Accessible label for the checkbox when no visible label is present. */
  ariaLabel = input<string>('');

  /** `aria-labelledby` reference for the checkbox. */
  ariaLabelledBy = input<string>('');

  /** Emitted when the checked state changes; carries the new boolean value. */
  checkedChange = output<boolean>();

  // ControlValueAccessor support ──────────────────────────────────────────────
  private cvaTouched = false;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onChange: (value: boolean) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onTouched: () => void = () => {};

  writeValue(value: boolean): void {
    // When used via ngModel / reactive forms the host can push a value in.
    // We surface this via the output so the parent can update its own signal.
    this.checkedChange.emit(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onInputChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.checkedChange.emit(checked);
    this.onChange(checked);
  }
}
