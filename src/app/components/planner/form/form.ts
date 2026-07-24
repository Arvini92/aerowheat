import { Component, input, model, output, computed, ChangeDetectionStrategy, inject, OnInit, effect } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GlassCard } from '../../../design-system/glass-card/glass-card';
import { Disease } from '../../../data';
import { ButtonComponent } from '../../../design-system/button/button';
import { SelectComponent } from '../../../design-system/select/select';
import { InputComponent } from '../../../design-system/input/input';
import { TextareaComponent } from '../../../design-system/textarea/textarea';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [ReactiveFormsModule, GlassCard, ButtonComponent, SelectComponent, InputComponent, TextareaComponent],
  templateUrl: './form.html',
  styleUrl: './form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Form implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly diseaseId = model<string>('');
  readonly fieldId = model<string>('');
  readonly severity = model<'mild' | 'moderate' | 'severe'>('mild');
  readonly variety = model<string>('');
  readonly notes = model<string>('');

  readonly diseases = input.required<Disease[]>();

  readonly diseaseChange = output<void>();
  readonly formSubmit = output<Event>();

  formGroup!: FormGroup;
  submitted = false;

  readonly selectOptions = computed(() => {
    const options = [
      { value: 'healthy', label: 'Healthy Wheat (Scouting Plan)' }
    ];
    return [...options, ...this.diseases().map(d => ({ value: d.id, label: d.name }))];
  });

  readonly severityOptions = computed(() => [
    { value: 'mild' as const, label: 'Mild (<5% crop surface)' },
    { value: 'moderate' as const, label: 'Moderate (5-20% crop surface)' },
    { value: 'severe' as const, label: 'Severe (>20% infestation)' }
  ]);

  constructor() {
    // Sync external model signal changes to form group
    effect(() => {
      const disease = this.diseaseId();
      if (this.formGroup && this.formGroup.get('diseaseId')?.value !== disease) {
        this.formGroup.patchValue({ diseaseId: disease }, { emitEvent: false });
      }
    });

    effect(() => {
      const field = this.fieldId();
      if (this.formGroup && this.formGroup.get('fieldId')?.value !== field) {
        this.formGroup.patchValue({ fieldId: field }, { emitEvent: false });
      }
    });

    effect(() => {
      const variety = this.variety();
      if (this.formGroup && this.formGroup.get('variety')?.value !== variety) {
        this.formGroup.patchValue({ variety: variety }, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      diseaseId: [this.diseaseId(), Validators.required],
      fieldId: [this.fieldId(), Validators.required],
      severity: [this.severity(), Validators.required],
      variety: [this.variety(), Validators.required],
      notes: [this.notes()]
    });

    // Sync form changes back to model signals
    this.formGroup.valueChanges.subscribe(value => {
      this.diseaseId.set(value.diseaseId);
      this.fieldId.set(value.fieldId);
      this.severity.set(value.severity);
      this.variety.set(value.variety);
      this.notes.set(value.notes);
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

    return '';
  }

  onDiseaseChange(): void {
    this.diseaseChange.emit();
  }

  onSeverityChange(value: string): void {
    this.severity.set(value as 'mild' | 'moderate' | 'severe');
    this.formGroup.patchValue({ severity: value });
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
}
