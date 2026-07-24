import { Component, ViewEncapsulation, signal, output, computed } from '@angular/core';

import { DISEASE_DATABASE, SYMPTOMS_BY_ANATOMY } from '../../../../services/data';
import { ButtonComponent } from '../../../../design-system/button/button';
import { CheckboxComponent } from '../../../../design-system/checkbox/checkbox';
import { RadioComponent } from '../../../../design-system/radio/radio';

@Component({
  selector: 'app-symptom-wizard',
  imports: [
    ButtonComponent,
    CheckboxComponent,
    RadioComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './symptom-wizard.html',
  styleUrls: ['./symptom-wizard.scss']
})
export class SymptomWizard {
  // Wizard State using signals
  wizardStep = signal<number>(1);
  
  wizardAnatomy = signal<Record<string, boolean>>({
    head: false,
    leaves: false,
    stem: false,
    roots: false
  });

  wizardSymptoms = signal<Record<string, boolean>>({});
  wizardWeather = signal<string>('humid_warm');
  wizardStage = signal<string>('flag_leaf');

  // Outputs
  diagnosisTriggered = output<{
    diseaseId: string;
    anatomy: string[];
    symptoms: string[];
    weather: string;
    cropStage: string;
  }>();

  // Derived state for the symptoms checklist depending on chosen anatomy
  wizardSymptomsOptions = computed(() => {
    let list: { id: string; text: string }[] = [];
    const anatomy = this.wizardAnatomy();
    const activeAnatomies = Object.keys(anatomy).filter(k => anatomy[k]);
    
    if (activeAnatomies.length === 0) {
      // Fallback if none selected
      return [
        ...SYMPTOMS_BY_ANATOMY['head'].slice(0, 2),
        ...SYMPTOMS_BY_ANATOMY['leaves'].slice(0, 3),
        ...SYMPTOMS_BY_ANATOMY['stem'].slice(0, 2)
      ];
    }
    
    activeAnatomies.forEach(part => {
      if (SYMPTOMS_BY_ANATOMY[part]) {
        list = [...list, ...SYMPTOMS_BY_ANATOMY[part]];
      }
    });
    return list;
  });

  wizardNext() {
    const current = this.wizardStep();
    if (current === 1) {
      const selectedAnatomyCount = Object.values(this.wizardAnatomy()).filter(v => v).length;
      if (selectedAnatomyCount === 0) {
        alert('Please select at least one affected plant section to continue.');
        return;
      }
      this.wizardStep.set(2);
    } else if (current === 2) {
      const selectedSymptomCount = Object.values(this.wizardSymptoms()).filter(v => v).length;
      if (selectedSymptomCount === 0) {
        alert('Please select at least one physical symptom checklist item to continue.');
        return;
      }
      this.wizardStep.set(3);
    } else if (current === 3) {
      this.wizardStep.set(4);
    } else if (current === 4) {
      this.evaluateDiagnostics();
    }
  }

  wizardPrev() {
    const current = this.wizardStep();
    if (current > 1) {
      this.wizardStep.set(current - 1);
    }
  }

  reset() {
    this.wizardStep.set(1);
    this.wizardAnatomy.set({ head: false, leaves: false, stem: false, roots: false });
    this.wizardSymptoms.set({});
    this.wizardWeather.set('humid_warm');
    this.wizardStage.set('flag_leaf');
  }

  toggleAnatomy(key: string) {
    this.wizardAnatomy.update(current => ({
      ...current,
      [key]: !current[key]
    }));
  }

  toggleSymptom(key: string) {
    this.wizardSymptoms.update(current => ({
      ...current,
      [key]: !current[key]
    }));
  }

  evaluateDiagnostics() {
    const anatomyKeys = Object.keys(this.wizardAnatomy()).filter(k => this.wizardAnatomy()[k]);
    const symptomKeys = Object.keys(this.wizardSymptoms()).filter(k => this.wizardSymptoms()[k]);

    let bestDiseaseId = 'healthy';
    let maxScore = -1;

    DISEASE_DATABASE.forEach(disease => {
      let score = 0;
      disease.anatomy.forEach(part => {
        if (anatomyKeys.includes(part)) score += 2;
      });

      let matchCount = 0;
      if (disease.id === 'leaf_rust') {
        if (symptomKeys.includes('orange_pustules_round')) matchCount++;
        if (symptomKeys.includes('yellow_halos_chlorosis')) matchCount++;
        if (symptomKeys.includes('leaf_drying_necrosis')) matchCount++;
      } else if (disease.id === 'stem_rust') {
        if (symptomKeys.includes('red_pustules_elongated')) matchCount++;
        if (symptomKeys.includes('black_pustules_fall')) matchCount++;
        if (symptomKeys.includes('weakened_stems_lodging')) matchCount++;
      } else if (disease.id === 'stripe_rust') {
        if (symptomKeys.includes('yellow_pustules_stripes')) matchCount++;
        if (symptomKeys.includes('stripe_glumes')) matchCount++;
      } else if (disease.id === 'powdery_mildew') {
        if (symptomKeys.includes('white_fluffy_patches')) matchCount++;
        if (symptomKeys.includes('leaf_drying_necrosis')) matchCount++;
      } else if (disease.id === 'septoria') {
        if (symptomKeys.includes('lens_lesions_spots')) matchCount++;
        if (symptomKeys.includes('yellow_halos_chlorosis')) matchCount++;
      } else if (disease.id === 'head_blight') {
        if (symptomKeys.includes('bleached_spikelets')) matchCount++;
        if (symptomKeys.includes('pink_spores')) matchCount++;
        if (symptomKeys.includes('shriveled_grains')) matchCount++;
      } else if (disease.id === 'loose_smut') {
        if (symptomKeys.includes('black_spores_dust')) matchCount++;
      } else if (disease.id === 'take_all') {
        if (symptomKeys.includes('black_rotted_roots')) matchCount++;
        if (symptomKeys.includes('whiteheads_no_grain')) matchCount++;
        if (symptomKeys.includes('stunted_patchy_growth')) matchCount++;
        if (symptomKeys.includes('stem_black_base')) matchCount++;
      }
      score += (matchCount * 4);

      const weather = this.wizardWeather();
      const stage = this.wizardStage();

      if (disease.id === 'leaf_rust' && weather === 'humid_warm') score += 3;
      if (disease.id === 'stem_rust' && weather === 'humid_warm') score += 3;
      if (disease.id === 'stripe_rust' && weather === 'humid_cool') score += 3;
      if (disease.id === 'powdery_mildew' && weather === 'humid_cool') score += 3;
      if (disease.id === 'septoria' && weather === 'humid_cool') score += 3;
      if (disease.id === 'head_blight' && weather === 'humid_warm') score += 3;
      if (disease.id === 'take_all' && weather === 'wet_soil') score += 3;

      if (disease.id === 'leaf_rust' && (stage === 'flag_leaf' || stage === 'flowering')) score += 3;
      if (disease.id === 'stem_rust' && (stage === 'flag_leaf' || stage === 'flowering' || stage === 'ripening')) score += 3;
      if (disease.id === 'stripe_rust' && (stage === 'jointing' || stage === 'flag_leaf')) score += 3;
      if (disease.id === 'powdery_mildew' && (stage === 'seedling' || stage === 'jointing' || stage === 'flag_leaf')) score += 3;
      if (disease.id === 'septoria' && (stage === 'jointing' || stage === 'flag_leaf' || stage === 'flowering')) score += 3;
      if (disease.id === 'head_blight' && stage === 'flowering') score += 5;
      if (disease.id === 'loose_smut' && stage === 'flowering') score += 3;
      if (disease.id === 'take_all' && (stage === 'seedling' || stage === 'ripening')) score += 3;

      if (score > maxScore) {
        maxScore = score;
        bestDiseaseId = disease.id;
      }
    });

    this.diagnosisTriggered.emit({
      diseaseId: bestDiseaseId,
      anatomy: anatomyKeys,
      symptoms: symptomKeys,
      weather: this.wizardWeather(),
      cropStage: this.wizardStage()
    });
  }
}
