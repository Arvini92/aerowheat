import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ICropHealthTip {
  title: string;
  tip: string;
}

@Injectable({ providedIn: 'root' })
export class CropHealth {
  private http = inject(HttpClient);

  getTip(): Observable<ICropHealthTip> {
    return this.http.get<ICropHealthTip>('/api/crop-health-tip');
  }
}
