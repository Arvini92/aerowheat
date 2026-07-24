import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WeatherData {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    relative_humidity_2m_mean: number[];
  };
}

@Injectable({ providedIn: 'root' })
export class Weather {
  private http = inject(HttpClient);

  getForecast(lat: number, lng: number): Observable<WeatherData> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean&timezone=auto&forecast_days=7`;
    return this.http.get<WeatherData>(url);
  }
}
