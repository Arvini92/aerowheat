import {
  Component,
  ViewEncapsulation,
  forwardRef,
  input,
  output,
  signal,
  ElementRef,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

type InputType = 'text' | 'number' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'date';

@Component({
  selector: 'app-input',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (iconLeft()) {
      <span class="app-input__icon-left" aria-hidden="true">
        <ng-content select="[slot=icon-left]" />
      </span>
    }
    <input
      #inputEl
      class="app-input__field"
      [class.app-input__field--has-icon-left]="iconLeft()"
      [class.app-input__field--error]="error()"
      [type]="type()"
      [id]="id() || null"
      [name]="name() || null"
      [placeholder]="placeholder()"
      [disabled]="isDisabled()"
      [required]="required()"
      [attr.min]="min() !== null ? min() : null"
      [attr.max]="max() !== null ? max() : null"
      [attr.step]="step() !== null ? step() : null"
      [attr.maxlength]="maxlength() !== null ? maxlength() : null"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-labelledby]="ariaLabelledBy() || null"
      [attr.autocomplete]="autocomplete() || null"
      [value]="internalValue()"
      (input)="onNativeInput($event)"
      (blur)="onBlur()"
      (focus)="focused.emit($event)"
      (keydown)="keydownEvent.emit($event)"
    />
    @if (error()) {
      <div class="app-input__error" role="alert">{{ error() }}</div>
    }
  `,
  styles: `
    app-input {
      display: block;
      width: 100%;
      box-sizing: border-box;
      position: relative;
    }

    .app-input__icon-left {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-dim);
      pointer-events: none;
      display: flex;
      align-items: center;
      z-index: 1;
    }

    .app-input__field {
      display: block;
      width: 100%;
      box-sizing: border-box;
      min-height: 40px;
      height: 40px;
      padding: 0 12px;
      line-height: 40px;

      background: rgba(0, 0, 0, 0.45);
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      font-family: var(--font-sans);
      font-size: 12px;
      color: var(--text-primary);
      outline: none;
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        background 0.2s ease;
    }

    .app-input__field--error {
      border-color: var(--color-danger, #ff4444) !important;
    }

    .app-input__error {
      color: var(--color-danger, #ff4444);
      font-size: 10px;
      margin-top: 4px;
      padding-left: 4px;
    }

    /* Icon offset for inputs with a left icon */
    .app-input__field--has-icon-left {
      padding-left: 36px;
    }

    /* Hide native number spinners so background stays dark */
    .app-input__field[type='number']::-webkit-outer-spin-button,
    .app-input__field[type='number']::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    .app-input__field[type='number'] {
      -moz-appearance: textfield;
    }

    .app-input__field::placeholder {
      color: var(--text-dim);
      font-size: 11px;
    }

    .app-input__field:hover:not(:disabled) {
      border-color: rgba(255, 255, 255, 0.22);
    }

    .app-input__field:focus {
      border-color: var(--primary);
      background: rgba(0, 0, 0, 0.55);
      box-shadow: 0 0 0 3px rgba(74, 214, 109, 0.10);
    }

    .app-input__field:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
  host: {
    '[class.app-input-host]': 'true',
    '[style.position]': '"relative"',
  },
})
export class InputComponent implements ControlValueAccessor {
  /** HTML input type attribute. */
  type = input<InputType>('text');

  /** Forwarded to the native `id` attribute — links to a `<label for="">`. */
  id = input<string>('');

  /** Forwarded to the native `name` attribute. */
  name = input<string>('');

  /** Placeholder text shown when the field is empty. */
  placeholder = input<string>('');

  /** Whether the field is required. */
  required = input<boolean>(false);

  /** `min` for number inputs. */
  min = input<number | null>(null);

  /** `max` for number inputs. */
  max = input<number | null>(null);

  /** `step` for number inputs. */
  step = input<number | null>(null);

  /** `maxlength` for text inputs. */
  maxlength = input<number | null>(null);

  /** Shows a left-icon slot and offsets the input text accordingly. */
  iconLeft = input<boolean>(false);

  /** Accessible label — forwarded as `aria-label`. */
  ariaLabel = input<string>('');

  /** `aria-labelledby` reference. */
  ariaLabelledBy = input<string>('');

  /** `autocomplete` attribute value. */
  autocomplete = input<string>('');

  /** Error message to display. */
  error = input<string>('');

  // Events ──────────────────────────────────────────────────────────────────
  /** Emitted on every value change with the new string value. */
  valueChange = output<string>();

  /** Emitted when the input receives focus. */
  focused = output<FocusEvent>();

  /** Emitted when the input loses focus. */
  blurred = output<FocusEvent>();

  /** Emitted on keydown. */
  keydownEvent = output<KeyboardEvent>();

  // Internal state ──────────────────────────────────────────────────────────
  protected internalValue = signal<string | number>('');
  protected isDisabled = signal<boolean>(false);

  protected inputEl = viewChild<ElementRef<HTMLInputElement>>('inputEl');

  // ControlValueAccessor ────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChangeFn: (value: string | number) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouchedFn: () => void = () => {};

  writeValue(value: string | number): void {
    this.internalValue.set(value ?? '');
  }

  registerOnChange(fn: (value: string | number) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  protected onNativeInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const raw = el.value;
    const value = this.type() === 'number' && raw !== '' ? +raw : raw;
    this.internalValue.set(value);
    this.onChangeFn(value);
    this.valueChange.emit(raw);
  }

  protected onBlur(): void {
    this.onTouchedFn();
  }

  /** Programmatically focus the native input. */
  focus(): void {
    this.inputEl()?.nativeElement.focus();
  }
}
