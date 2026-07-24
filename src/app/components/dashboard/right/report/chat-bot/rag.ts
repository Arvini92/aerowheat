import { Disease, DISEASE_DATABASE } from '../../../../../data';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Rag {
  searchDisease(query: string): Disease[] {
    const q = query.toLowerCase();
    return DISEASE_DATABASE.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.desc.toLowerCase().includes(q) ||
      d.symptoms.some(s => s.toLowerCase().includes(q))
    );
  }
}
