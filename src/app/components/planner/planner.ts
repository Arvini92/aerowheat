import { Component, ChangeDetectionStrategy, effect, ViewEncapsulation, signal, inject } from '@angular/core';

import { DISEASE_DATABASE } from '../../data';
import { AppState } from '../../services/app-state';
import { Form } from './form/form';
import { Plan } from './plan/plan';
import { ToastService } from '../../design-system/toast/toast.service';


export interface ActivePlan {
  diseaseName: string;
  scientificName?: string;
  fieldId: string;
  severity: 'mild' | 'moderate' | 'severe';
  severityPct?: string;
  variety: string;
  date: string;
  growthStage?: string;
  regimenClass?: string;
  immediate: string;
  flagLeafWarning?: string;
  chemical: string;
  chemicalBullets?: string[];
  organic: string;
  preventive: string;
  preventiveBullets?: string[];
}

@Component({
  selector: 'app-planner',
  standalone: true,
  imports: [
    Form,
    Plan
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './planner.html',
  styleUrls: ['./planner.scss']
})
export class Planner {
  private readonly appState = inject(AppState);
  private readonly toastService = inject(ToastService);

  // Form State — signals for two-way binding with form child
  diseases = DISEASE_DATABASE;
  readonly diseaseId = signal<string>('');
  readonly fieldId = signal<string>('Field Alpha-7');
  readonly severity = signal<'mild' | 'moderate' | 'severe'>('mild');
  readonly variety = signal<string>('Hard Red Winter');
  readonly notes = signal<string>('');

  // Generated Plan typed and converted to Signal
  activePlan = signal<ActivePlan | null>(null);

  constructor() {
    effect(() => {
      const dId = this.appState.plannerPresetDiseaseId();
      if (dId) {
        this.diseaseId.set(dId);
        const sev = this.appState.plannerPresetSeverity();
        if (sev) {
          this.severity.set(sev);
        }
        this.generatePlan();
        
        // Clean presets so they don't re-trigger
        this.appState.plannerPresetDiseaseId.set(null);
        this.appState.plannerPresetSeverity.set(null);
      }
    });
  }

  onDiseaseChange() {
    this.activePlan.set(null);
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.generatePlan();
  }

  generatePlan() {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    if (this.diseaseId() === 'healthy') {
      this.activePlan.set({
        diseaseName: 'Healthy Wheat',
        scientificName: 'Triticum aestivum',
        fieldId: this.fieldId(),
        severity: this.severity(),
        severityPct: '< 1% canopy affected',
        variety: this.variety(),
        date: today,
        growthStage: 'Flag Leaf Emergence / Booting (Feekes 9-10)',
        regimenClass: 'Integrated Pest Management (IPM)',
        immediate: 'Scout field edges twice weekly. Focus on low-lying, high-moisture zones.',
        flagLeafWarning: 'Maintain regular field inspection schedules during peak vegetative growth.',
        chemical: 'Chemical applications are NOT recommended at this threshold. Preserve natural predators and chemical efficacy.',
        chemicalBullets: [
          'Sprayer Parameters: Equipment maintenance and calibration check.',
          'Water Rates: Standard volume scouting setup.',
          'Resistance Management: No active chemical selection required.'
        ],
        organic: 'Apply seaweed extracts or organic compost tea to boost leaf health and natural plant defenses.',
        preventive: 'Plan crop rotation using oilseeds, pulses, or brassicas in the upcoming cycle to disrupt pathogen cycles.',
        preventiveBullets: [
          'Crop Rotation: Rotate with non-susceptible crop families (canola, legumes, pulse beans) for the next 2 cycles.',
          'Resistant Cultivars: Select cultivars showing high vigor for subsequent sowings.',
          'Tillage: Maintain soil structure and organic cover.'
        ]
      });
      this.toastService.success('Scouting plan generated.');
      return;
    }

    const match = this.diseases.find(d => d.id === this.diseaseId());
    if (!match) return;

    let sevPct = '5% - 20% area affected';
    if (this.severity() === 'mild') {
      sevPct = '< 5% area affected';
    } else if (this.severity() === 'moderate') {
      sevPct = '5% - 20% area affected';
    } else {
      sevPct = '> 20% area affected';
    }

    this.activePlan.set({
      diseaseName: match.name,
      scientificName: match.scientific || 'Puccinia triticina',
      fieldId: this.fieldId(),
      severity: this.severity(),
      severityPct: sevPct,
      variety: this.variety(),
      date: today,
      growthStage: 'Flag Leaf Emergence / Booting (Feekes 9-10)',
      regimenClass: 'Integrated Pest Management (IPM)',
      immediate: match.treatment.immediate || 'Apply a foliar triazole or strobilurin fungicide if threshold (1-2% leaf area infected) is breached on the flag leaf minus one.',
      flagLeafWarning: 'The flag leaf represents 50-60% of grain fill capacity. Protecting this tissue is critical. If fungal symptoms progress on the upper three leaves, economic injury thresholds have been breached. Prioritize application immediately.',
      chemical: `Systemic Foliar Active Ingredients: ${match.treatment.chemical}`,
      chemicalBullets: [
        'Sprayer Parameters: Target a droplet size of 200-300 microns (Medium category) with standard flat-fan nozzles at 3.0 bar pressure.',
        'Water Rates: Use a minimum carrier volume of 150-200 L/ha to achieve uniform penetration of the middle/lower canopy layers.',
        'Resistance Management: Do not apply strobilurins (QoI class) more than twice per season. Rotate chemistry with DMIs or SDHIs to protect fungicide lifespan.'
      ],
      organic: match.treatment.organic,
      preventive: match.treatment.preventive,
      preventiveBullets: [
        'Crop Rotation: Rotate with non-susceptible crop families (canola, legumes, pulse beans) for the next 2 cycles.',
        'Resistant Cultivars: Select cultivars showing high levels of resistance for subsequent autumn or spring sowings.',
        'Tillage: Incorporate crop stubble immediately after harvest to speed up mycelial decay in the soil.'
      ]
    });

    this.toastService.success(`Management Plan: ${match.name}`);
  }

  printPlan() {
    window.print();
  }
}
