import { Component, input, output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-radio',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioComponent),
      multi: true,
    },
  ],
  template: `
    <label
      class="app-radio"
      [class.app-radio--checked]="checked()"
      [class.app-radio--disabled]="disabled()"
      [attr.id]="labelId() || null"
    >
      <input
        type="radio"
        class="app-radio__input"
        [name]="name()"
        [value]="value()"
        [checked]="checked()"
        [disabled]="disabled()"
        [attr.aria-checked]="checked()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-labelledby]="ariaLabelledBy() || null"
        (change)="onInputChange()"
        (blur)="onTouched()"
      />
      <span class="app-radio__dot" aria-hidden="true"></span>

      @if (label() || subtitle()) {
        <div class="app-radio__content">
          @if (label()) {
            <span class="app-radio__label">{{ label() }}</span>
          }
          @if (subtitle()) {
            <span class="app-radio__subtitle">{{ subtitle() }}</span>
          }
        </div>
      }

      <!-- Fallback: arbitrary projected content (e.g. custom detail blocks) -->
      <ng-content />
    </label>
  `,
  styles: `
    :host {
      display: contents;
    }

    .app-radio {
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

    .app-radio:hover:not(.app-radio--disabled) {
      background: rgba(255, 255, 255, 0.04);
      border-color: var(--primary);
    }

    .app-radio--disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .app-radio--checked {
      border-color: rgba(74, 214, 109, 0.35);
      background: rgba(74, 214, 109, 0.04);
    }

    .app-radio__input {
      display: none;
    }

    /* The circular radio dot indicator */
    .app-radio__dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
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

    .app-radio--checked .app-radio__dot {
      background: var(--primary);
      border-color: var(--primary);
    }

    .app-radio--checked .app-radio__dot::after {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #000000;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    /* Label / subtitle text layout */
    .app-radio__content {
      display: flex;
      flex-direction: column;
    }

    .app-radio__label {
      font-size: 11px;
      font-weight: 800;
    }

    .app-radio__subtitle {
      font-size: 9px;
      color: var(--text-muted);
      margin-top: 1px;
    }
  `,
  host: {
    '[class.app-radio-host]': 'true',
  },
})
export class RadioComponent implements ControlValueAccessor {
  /** The radio group name — must match across all options in the same group. */
  name = input<string>('');

  /** The value this radio button represents. */
  value = input<string>('');

  /** The currently selected value in the group; marks this button as checked when it equals `value`. */
  groupValue = input<string>('');

  /** Convenience computed-like: whether this button is selected. */
  checked = input<boolean>(false);

  /** Primary label text displayed next to the dot. */
  label = input<string>('');

  /** Optional secondary subtitle rendered below the label. */
  subtitle = input<string>('');

  /** Disables the radio button when true. */
  disabled = input<boolean>(false);

  /** Optional `id` applied to the wrapping `<label>` element. */
  labelId = input<string>('');

  /** Accessible label for the radio when no visible label is present. */
  ariaLabel = input<string>('');

  /** `aria-labelledby` reference for the radio. */
  ariaLabelledBy = input<string>('');

  /** Emitted when this radio button is selected; carries `value()`. */
  valueChange = output<string>();

  // ControlValueAccessor ───────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onChange: (value: string) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onTouched: () => void = () => {};

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  writeValue(_: string): void {
    // Handled externally via [checked] input binding
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onInputChange(): void {
    this.valueChange.emit(this.value());
    this.onChange(this.value());
  }
}
