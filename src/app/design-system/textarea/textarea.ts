import {
  Component,
  ViewEncapsulation,
  forwardRef,
  input,
  output,
  signal,
  computed,
  ElementRef,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-textarea',
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true,
    },
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <mat-form-field class="app-textarea-form-field" appearance="outline">
      @if (label()) {
        <mat-label>{{ label() }}</mat-label>
      }
      <textarea
        matInput
        #textareaEl
        [id]="id() || ''"
        [name]="name() || ''"
        [placeholder]="placeholder()"
        [rows]="rows()"
        [disabled]="isEffectivelyDisabled()"
        [required]="required()"
        [attr.maxlength]="maxlength() !== null ? maxlength() : null"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-labelledby]="ariaLabelledBy() || null"
        [value]="internalValue()"
        (input)="onNativeInput($event)"
        (blur)="onBlur()"
        (focus)="focused.emit($event)"
        (keydown)="keydownEvent.emit($event)"
      ></textarea>
      @if (hint()) {
        <mat-hint>{{ hint() }}</mat-hint>
      }
      @if (error()) {
        <mat-error>{{ error() }}</mat-error>
      }
    </mat-form-field>
  `,
  styles: `
    app-textarea {
      display: block;
      width: 100%;
      box-sizing: border-box;
    }

    app-textarea .app-textarea-form-field {
      width: 100%;
      display: block;
    }

    /* Style the custom form-field wrapper matching glassmorphism and high density */
    app-textarea .mat-mdc-text-field-wrapper {
      padding: 0 12px !important;
      background: rgba(0, 0, 0, 0.5) !important;
      border-radius: 8px !important;
      transition: background-color 0.2s ease;
    }

    app-textarea .mat-mdc-text-field-wrapper:hover {
      background: rgba(0, 0, 0, 0.55) !important;
    }

    /* Override standard outlined borders to be subtle glass borders */
    app-textarea .mdc-notched-outline__leading,
    app-textarea .mdc-notched-outline__notch,
    app-textarea .mdc-notched-outline__trailing {
      border-color: var(--glass-border) !important;
      border-width: 1px !important;
      transition: border-color 0.2s ease;
    }

    /* Outer border hover effect */
    app-textarea .mat-mdc-form-field:hover .mdc-notched-outline__leading,
    app-textarea .mat-mdc-form-field:hover .mdc-notched-outline__notch,
    app-textarea .mat-mdc-form-field:hover .mdc-notched-outline__trailing {
      border-color: rgba(255, 255, 255, 0.22) !important;
    }

    /* Focus border color override matching primary green */
    app-textarea .mdc-text-field--focused .mdc-notched-outline__leading,
    app-textarea .mdc-text-field--focused .mdc-notched-outline__notch,
    app-textarea .mdc-text-field--focused .mdc-notched-outline__trailing {
      border-color: var(--primary) !important;
      border-width: 1px !important;
    }

    /* Textarea element alignment, colors, typography */
    app-textarea textarea.mat-mdc-input-element {
      color: #ffffff !important;
      font-family: var(--font-sans) !important;
      font-size: 11px !important;
      line-height: 1.5 !important;
      caret-color: var(--primary) !important;
      resize: vertical !important;
      min-height: 50px;
      padding: 8px 0 !important;
      margin: 0 !important;
    }

    app-textarea textarea.mat-mdc-input-element::placeholder {
      color: var(--text-dim) !important;
      font-size: 11px !important;
    }

    /* Label text formatting and coloring */
    app-textarea .mdc-floating-label {
      color: var(--text-muted) !important;
      font-family: var(--font-sans) !important;
      font-size: 11px !important;
    }

    /* Focus label color matching primary chlorophyll green */
    app-textarea .mdc-text-field--focused .mdc-floating-label {
      color: var(--primary) !important;
    }

    /* Disabled state aesthetics */
    app-textarea .mdc-text-field--disabled {
      opacity: 0.5 !important;
      cursor: not-allowed !important;
    }
    
    app-textarea .mdc-text-field--disabled textarea.mat-mdc-input-element {
      cursor: not-allowed !important;
    }

    /* Error and Hint spacing */
    app-textarea .mat-mdc-form-field-subscript-wrapper {
      padding: 0 4px !important;
      font-size: 10px !important;
      margin-top: 4px !important;
    }

    app-textarea .mat-mdc-form-field-hint {
      color: var(--text-dim) !important;
    }

    app-textarea .mat-mdc-form-field-error {
      color: var(--color-danger) !important;
    }
  `,
  host: {
    '[class.app-textarea-host]': 'true',
    '[style.position]': '"relative"',
  },
})
export class TextareaComponent implements ControlValueAccessor {
  /** Forwarded to the native `id` attribute. */
  id = input<string>('');

  /** Forwarded to the native `name` attribute. */
  name = input<string>('');

  /** Text label displayed inside the form field structure. */
  label = input<string>('');

  /** Placeholder text displayed when empty. */
  placeholder = input<string>('');

  /** Standard text rows size. */
  rows = input<number>(3);

  /** Whether the field is required. */
  required = input<boolean>(false);

  /** Character count limit. */
  maxlength = input<number | null>(null);

  /** Optional hint text displayed below the textarea. */
  hint = input<string>('');

  /** Optional custom error text. */
  error = input<string>('');

  /** Whether the component is disabled. */
  disabled = input<boolean>(false);

  /** Accessible label. */
  ariaLabel = input<string>('');

  /** `aria-labelledby` element link. */
  ariaLabelledBy = input<string>('');

  // Events ──────────────────────────────────────────────────────────────────
  /** Emitted on value change with the updated string. */
  valueChange = output<string>();

  /** Emitted on textarea focus. */
  focused = output<FocusEvent>();

  /** Emitted on textarea blur. */
  blurred = output<FocusEvent>();

  /** Emitted on keydown event. */
  keydownEvent = output<KeyboardEvent>();

  // Internal state ──────────────────────────────────────────────────────────
  protected internalValue = signal<string>('');
  protected isDisabled = signal<boolean>(false);

  protected isEffectivelyDisabled = computed(() => this.disabled() || this.isDisabled());

  protected textareaEl = viewChild<ElementRef<HTMLTextAreaElement>>('textareaEl');

  // ControlValueAccessor ────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChangeFn: (value: string) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouchedFn: () => void = () => {};

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

  protected onNativeInput(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    const value = el.value;
    this.internalValue.set(value);
    this.onChangeFn(value);
    this.valueChange.emit(value);
  }

  protected onBlur(): void {
    this.onTouchedFn();
    this.blurred.emit({} as FocusEvent);
  }

  /** Programmatically focus the native textarea. */
  focus(): void {
    this.textareaEl()?.nativeElement.focus();
  }
}
