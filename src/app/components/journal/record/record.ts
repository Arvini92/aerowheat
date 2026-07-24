import { Component, input, model, output, computed, inject, OnInit, effect } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GlassCard } from '../../../design-system/glass-card/glass-card';
import { Disease } from '../../../data';
import { ButtonComponent } from '../../../design-system/button/button';
import { SelectComponent } from '../../../design-system/select/select';
import { InputComponent } from '../../../design-system/input/input';
import { TextareaComponent } from '../../../design-system/textarea/textarea';

@Component({
  selector: 'app-record',
  standalone: true,
  imports: [ReactiveFormsModule, GlassCard, ButtonComponent, SelectComponent, InputComponent, TextareaComponent],
  templateUrl: './record.html',
  styleUrl: './record.scss',
})
export class Record implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly editingLogId = input<number | null>(null);
  readonly logField = model<string>('');
  readonly logDiseaseId = model<string>('');
  readonly logSeverity = model<number>(5);
  readonly logNotes = model<string>('');
  readonly diseases = input.required<Disease[]>();

  readonly formSubmit = output<Event>();
  readonly cancelObservation = output<void>();

  formGroup!: FormGroup;
  submitted = false;

  readonly selectOptions = computed(() => {
    const options = [
      { value: 'healthy', label: 'Healthy Wheat' }
    ];
    return [...options, ...this.diseases().map(d => ({ value: d.id, label: d.name }))];
  });

  constructor() {
    effect(() => {
      const field = this.logField();
      if (this.formGroup && this.formGroup.get('logField')?.value !== field) {
        this.formGroup.patchValue({ logField: field }, { emitEvent: false });
      }
    });

    effect(() => {
      const diseaseId = this.logDiseaseId();
      if (this.formGroup && this.formGroup.get('logDiseaseId')?.value !== diseaseId) {
        this.formGroup.patchValue({ logDiseaseId: diseaseId }, { emitEvent: false });
      }
    });

    effect(() => {
      const severity = this.logSeverity();
      if (this.formGroup && this.formGroup.get('logSeverity')?.value !== severity) {
        this.formGroup.patchValue({ logSeverity: severity }, { emitEvent: false });
      }
    });

    effect(() => {
      const notes = this.logNotes();
      if (this.formGroup && this.formGroup.get('logNotes')?.value !== notes) {
        this.formGroup.patchValue({ logNotes: notes }, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      logField: [this.logField(), Validators.required],
      logDiseaseId: [this.logDiseaseId(), Validators.required],
      logSeverity: [this.logSeverity(), [Validators.required, Validators.min(1), Validators.max(100)]],
      logNotes: [this.logNotes()]
    });

    this.formGroup.valueChanges.subscribe(value => {
      this.logField.set(value.logField);
      this.logDiseaseId.set(value.logDiseaseId);
      this.logSeverity.set(value.logSeverity);
      this.logNotes.set(value.logNotes);
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.formGroup.get(controlName);
    if (!control || !control.errors || (!control.touched && !this.submitted)) {
      return '';
    }

    if (control.errors['required']) {
      return 'This field is required';
    }
    if (control.errors['min']) {
      return `Minimum value is ${control.errors['min'].min}`;
    }
    if (control.errors['max']) {
      return `Maximum value is ${control.errors['max'].max}`;
    }

    return '';
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted = true;
    
    if (this.formGroup.valid) {
      this.formSubmit.emit(event);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  cancelEdit(): void {
    this.cancelObservation.emit();
  }
}
