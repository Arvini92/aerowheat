import { Component, ChangeDetectionStrategy, ViewEncapsulation, signal, computed, inject } from '@angular/core';

import { DISEASE_DATABASE } from '../../data';
import { AppState } from '../../services/app-state';
import { Anatomy } from './anatomy/anatomy';
import { Symptoms } from './symptoms/symptoms';
import { Pathogens } from './pathogens/pathogens';

@Component({
  selector: 'app-explorer',
  standalone: true,
  imports: [
    Anatomy,
    Symptoms,
    Pathogens
],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './explorer.html',
  styleUrls: ['./explorer.scss']
})
export class Explorer {
  private readonly appState = inject(AppState);
  selectedSection = signal<string>('leaves');

  selectedSectionTitle = computed(() => {
    const titles: Record<string, string> = {
      head: 'Spike / Head / Grain',
      leaves: 'Leaves & Foliage',
      stem: 'Stem / Straw / Culm',
      roots: 'Roots / Crown / Seedling Base'
    };
    return titles[this.selectedSection()] || 'Leaves & Foliage';
  });

  selectedSectionDesc = computed(() => {
    const descs: Record<string, string> = {
      head: 'The reproductive structure of the wheat plant. Pathogens here directly reduce grain yields, damage kernel quality, and can produce hazardous mycotoxins.',
      leaves: 'The primary site for photosynthesis. Foliar leaf pathogens reduce the green photosynthetic area, causing premature senescence and shrinking grain fill capacity.',
      stem: 'Provides structural support and transports water and nutrients. Stem lesions disrupt transport channels, causing lodging (falling over) and total plant collapse.',
      roots: 'The anchor system absorbing essential water and nutrients. Subterranean root rot pathogens restrict hydration, leading to stunting, early whiteheads, or sudden death.'
    };
    return descs[this.selectedSection()] || '';
  });

  currentSymptoms = computed(() => {
    const sympts: Record<string, { text: string; detail: string }[]> = {
      head: [
        { text: 'Premature Bleaching', detail: 'Spikelets or entire heads turn light tan/white while the rest of the crop is green.' },
        { text: 'Black Sooty Dust', detail: 'Kernels are replaced with powdery dark spore masses that blow away in the wind.' },
        { text: 'Pink or Orange Mold', detail: 'Visible wet fungal spores on spikelet glumes, often after prolonged rainfall.' },
        { text: 'Shriveled kernels', detail: 'Lightweight grains with chalky white or pinkish discoloration.' }
      ],
      leaves: [
        { text: 'Rust Pustules', detail: 'Small orange, red, or yellow powdery spots containing fungal spores.' },
        { text: 'Lens-shaped Spots', detail: 'Tan lesions with yellow borders and dark centers dotted with black pycnidia.' },
        { text: 'White Powdery Patches', detail: 'Fluffy white to gray cobweb-like mycelial growth on leaf surfaces.' },
        { text: 'Yellow Stripes', detail: 'Linear yellow/orange pustule stripes aligned between leaf veins.' }
      ],
      stem: [
        { text: 'Elongated Dark Pustules', detail: 'Brick-red powdery lesions that tear through the epidermal stem layers.' },
        { text: 'Stem Blackening', detail: 'Severe dark discoloration rising from the soil line up the first few nodes.' },
        { text: 'Straw Lodging', detail: 'Structural weakening causing the straw to crack and bend under gravity.' }
      ],
      roots: [
        { text: 'Coal-Black Rot', detail: 'The lower stem and roots turn shiny, coal-black and brittle.' },
        { text: 'Dry Crown Rot', detail: 'Chocolate-brown discoloration of the crown roots and leaf sheath bases.' },
        { text: 'Stunted Growth Patches', detail: 'Circular or irregular field patches showing severely stunted, pale plants.' }
      ]
    };
    return sympts[this.selectedSection()] || [];
  });

  currentPathogens = computed(() => {
    return DISEASE_DATABASE.filter(d => d.anatomy.includes(this.selectedSection()));
  });

  selectSection(section: string) {
    this.selectedSection.set(section);
  }

  openDossier(diseaseId: string) {
    this.appState.openDossier(diseaseId);
  }
}
