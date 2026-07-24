import { Component, output } from '@angular/core';
import { input } from '@angular/core';
import { MatButton } from '@angular/material/button';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'reset' | 'nav' | 'preset' | 'action-icon' | 'toast-close' | 'modal-close';
type ButtonSize = 'default' | 'icon' | 'full-width';
type ButtonPresetVariant = 'healthy' | 'rust' | 'stem' | 'mildew' | 'blight';
type ButtonActionVariant = 'edit' | 'delete';

@Component({
  selector: 'app-button',
  imports: [MatButton],
  template: `
    <button
      mat-button
      [type]="type()"
      [class]="getButtonClasses()"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel()"
      [attr.id]="id()"
      (click)="btnClick.emit($event)"
    >
      <ng-content />
    </button>
  `,
  host: {
    '[class.full-width]': 'size() === "full-width"',
    '[class]': '"btn-host"',
  },
  styles: `
    :host {
      display: inline-flex;
    }

    .btn-host {
      display: inline-flex;
    }

    button {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      font-family: var(--font-sans) !important;
      font-size: 10px !important;
      font-weight: 800 !important;
      padding: 6px 12px !important;
      border-radius: 8px !important;
      cursor: pointer !important;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
      border: none !important;
      outline: none !important;
      text-transform: uppercase !important;
      letter-spacing: 0.05em !important;
      background: transparent !important;
      color: inherit !important;
      box-shadow: none !important;
      line-height: normal !important;
      height: auto !important;
      min-width: unset !important;
      border-radius: 8px !important;
    }

    button.mat-mdc-button {
      padding: 6px 12px !important;
    }

    button ::ng-deep .mdc-button__label {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      width: 100% !important;
      text-align: center !important;
      font-family: var(--font-sans) !important;
      font-size: 10px !important;
      font-weight: 800 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.05em !important;
    }

    button:disabled {
      opacity: 0.5 !important;
      cursor: not-allowed !important;
    }

    button:focus-visible {
      outline: 2px solid var(--primary) !important;
      outline-offset: 2px !important;
    }

    /* Primary Button */
    .btn-primary {
      background: var(--primary) !important;
      color: #000000 !important;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--primary-hover) !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 12px rgba(74, 214, 109, 0.3) !important;
    }

    /* Secondary Button */
    .btn-secondary {
      background: rgba(255, 255, 255, 0.05) !important;
      color: #ffffff !important;
      border: 1px solid var(--glass-border) !important;
    }

    .btn-secondary:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1) !important;
    }

    /* Success Button */
    .btn-success {
      background: var(--primary) !important;
      color: #000000 !important;
    }

    .btn-success:hover:not(:disabled) {
      background: var(--primary-hover) !important;
    }

    /* Reset Button */
    .btn-reset {
      background: transparent !important;
      color: var(--text-muted) !important;
      border: 1.5px dashed var(--glass-border) !important;
    }

    .btn-reset:hover:not(:disabled) {
      border-color: var(--primary) !important;
      color: #ffffff !important;
    }

    /* Navigation Button */
    .btn-nav {
      background: transparent !important;
      border: none !important;
      color: rgba(255, 255, 255, 0.6) !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      padding: 6px 14px !important;
      border-radius: 9999px !important;
      display: flex !important;
      align-items: center !important;
      gap: 6px !important;
    }

    .btn-nav:hover:not(:disabled) {
      color: #ffffff !important;
    }

    .btn-nav.active,
    :host(.active) .btn-nav {
      background: var(--primary) !important;
      color: #000000 !important;
      box-shadow: 0 2px 8px rgba(74, 214, 109, 0.2) !important;
    }

    /* Preset Button */
    .btn-preset {
      background: rgba(255, 255, 255, 0.03) !important;
      border: 1px solid var(--glass-border) !important;
      color: rgba(255, 255, 255, 0.7) !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      padding: 8px 4px !important;
      border-radius: 8px !important;
      font-family: var(--font-sans) !important;
      min-width: 160px !important;
    }

    .btn-preset ::ng-deep .mdc-button__label {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 4px !important;
      width: 100% !important;
    }

    .btn-preset ::ng-deep .preset-thumb {
      width: 40px !important;
      height: 40px !important;
      border-radius: 6px !important;
      background-size: cover !important;
      background-position: center !important;
      background-repeat: no-repeat !important;
    }

    .btn-preset ::ng-deep span {
      font-size: 11px !important;
      font-weight: 600 !important;
    }

    .btn-preset:hover:not(:disabled) {
      border-color: #ffffff !important;
      color: #ffffff !important;
      background: rgba(255, 255, 255, 0.07) !important;
    }

    .btn-preset:active:not(:disabled) {
      transform: translateY(1px) !important;
    }

    .btn-preset.preset-healthy:hover:not(:disabled) {
      border-color: var(--primary) !important;
      color: var(--primary) !important;
      background: rgba(74, 214, 109, 0.06) !important;
    }

    .btn-preset.preset-rust:hover:not(:disabled) {
      border-color: var(--accent-gold) !important;
      color: var(--accent-gold) !important;
      background: rgba(221, 161, 94, 0.06) !important;
    }

    .btn-preset.preset-stem:hover:not(:disabled) {
      border-color: var(--color-danger) !important;
      color: var(--color-danger) !important;
      background: rgba(231, 111, 81, 0.06) !important;
    }

    .btn-preset.preset-mildew:hover:not(:disabled) {
      border-color: var(--color-info) !important;
      color: var(--color-info) !important;
      background: rgba(90, 159, 212, 0.06) !important;
    }

    .btn-preset.preset-blight:hover:not(:disabled) {
      border-color: var(--accent-gold) !important;
      color: var(--accent-gold) !important;
      background: rgba(221, 161, 94, 0.06) !important;
    }

    /* Action Icon Button */
    .btn-action-icon {
      background: transparent !important;
      border: none !important;
      outline: none !important;
      cursor: pointer !important;
      width: 22px !important;
      height: 22px !important;
      border-radius: 4px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      color: var(--text-dim) !important;
      font-size: 9px !important;
      font-weight: 800 !important;
      padding: 4px 8px !important;
    }

    .btn-action-icon.action-edit:hover:not(:disabled) {
      background: rgba(90, 159, 212, 0.12) !important;
      color: var(--color-info) !important;
    }

    .btn-action-icon.action-delete:hover:not(:disabled) {
      background: rgba(231, 111, 81, 0.12) !important;
      color: var(--color-danger) !important;
    }

    /* Toast Close Button */
    .btn-toast-close {
      background: transparent !important;
      border: none !important;
      outline: none !important;
      color: var(--text-dim) !important;
      cursor: pointer !important;
      padding: 4px !important;
      border-radius: 6px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    .btn-toast-close:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.05) !important;
      color: #ffffff !important;
    }

    /* Modal Close Button */
    .btn-modal-close {
      background: transparent !important;
      border: none !important;
      outline: none !important;
      color: var(--text-muted) !important;
      cursor: pointer !important;
      font-size: 1.5rem !important;
      font-weight: 300 !important;
      padding: 8px !important;
      border-radius: 4px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: color 0.2s !important;
      line-height: 1 !important;
    }

    .btn-modal-close:hover:not(:disabled) {
      color: #ffffff !important;
    }

    /* Size Variants */
    .btn-icon {
      font-size: 9px !important;
      font-weight: 800 !important;
      padding: 4px 8px !important;
      border-radius: 4px !important;
    }

    .btn-full-width {
      width: 100% !important;
    }
  `,

})
export class ButtonComponent {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('default');
  presetVariant = input<ButtonPresetVariant>();
  actionVariant = input<ButtonActionVariant>();
  disabled = input(false);
  type = input<'button' | 'submit' | 'reset'>('button');
  ariaLabel = input('');
  id = input('');
  active = input(false);

  getButtonClasses(): string {
    const classes: string[] = ['btn'];

    // Add variant class
    switch (this.variant()) {
      case 'primary':
        classes.push('btn-primary');
        break;
      case 'secondary':
        classes.push('btn-secondary');
        break;
      case 'success':
        classes.push('btn-success');
        break;
      case 'reset':
        classes.push('btn-reset');
        break;
      case 'nav':
        classes.push('btn-nav');
        break;
      case 'preset':
        classes.push('btn-preset');
        if (this.presetVariant()) {
          classes.push(`preset-${this.presetVariant()}`);
        }
        break;
      case 'action-icon':
        classes.push('btn-action-icon');
        if (this.actionVariant()) {
          classes.push(`action-${this.actionVariant()}`);
        }
        break;
      case 'toast-close':
        classes.push('btn-toast-close');
        break;
      case 'modal-close':
        classes.push('btn-modal-close');
        break;
    }

    // Add size class
    switch (this.size()) {
      case 'icon':
        classes.push('btn-icon');
        break;
      case 'full-width':
        classes.push('btn-full-width');
        break;
    }

    // Add active state for nav buttons
    if (this.active()) {
      classes.push('active');
    }

    return classes.join(' ');
  }

  btnClick = output<Event>();
}