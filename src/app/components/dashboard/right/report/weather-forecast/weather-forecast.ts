import { Component, ChangeDetectionStrategy, ViewEncapsulation, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icon } from '../../../../../design-system/icon/icon';
import { Weather, WeatherData } from './weather';
import { ToastService } from '@/src/app/design-system/toast/toast.service';

@Component({
  selector: 'app-weather-forecast',
  standalone: true,
  imports: [CommonModule, Icon],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="weather-root glass-card mt-6">
      <!-- Weather System Status -->
      <div class="weather-status-bar">
        <div class="flex items-center gap-3">
          <div class="status-indicator">
            <span class="pulse-dot"></span>
            <span class="status-label">Station Sync: Active</span>
          </div>
          <div class="divider"></div>
          <span class="text-[9px] font-mono text-zinc-500">LAT: 49.2°N | LON: 119.5°W</span>
        </div>
        <button (click)="refresh()" class="refresh-btn" [class.spinning]="loading()">
          <app-icon size="xs">refresh</app-icon>
        </button>
      </div>

      <!-- Main Header -->
      <header class="main-header">
        <div class="flex items-center gap-4">
          <div class="header-icon-box">
            <app-icon size="md" class="text-amber-400">wb_sunny</app-icon>
          </div>
          <div>
            <h3 class="header-title">Meteorological Outlook</h3>
            <p class="header-subtitle">Local precision climate tracking</p>
          </div>
        </div>
      </header>

      @if (loading()) {
        <div class="loading-state h-48 flex flex-col items-center justify-center gap-3">
          <div class="spinner"></div>
          <span class="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Polling Orbital Data...</span>
        </div>
      } @else if (error()) {
        <div class="error-state p-8 text-center">
          <app-icon class="text-rose-500 mb-2" size="lg">cloud_off</app-icon>
          <p class="text-xs text-rose-400 font-bold uppercase tracking-wider">Sync Error: Link Terminated</p>
          <button (click)="refresh()" class="mt-4 px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold rounded-lg hover:bg-rose-500/20 transition-all">
            RESTABLISH LINK
          </button>
        </div>
      } @else if (forecast()) {
        <!-- Today's Highlight -->
        <div class="today-highlight">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-6">
              <div class="main-temp-box">
                <span class="main-temp">{{ forecast()!.daily.temperature_2m_max[0] | number:'1.0-0' }}°</span>
                <span class="main-condition">{{ getWeatherLabel(forecast()!.daily.temperature_2m_max[0], forecast()!.daily.precipitation_sum[0]) }}</span>
              </div>
              <div class="h-12 w-px bg-white/5"></div>
              <div class="main-stats">
                <div class="main-stat">
                  <app-icon size="xs" class="text-zinc-500">water_drop</app-icon>
                  <div class="flex flex-col">
                    <span class="stat-label">Humidity</span>
                    <span class="stat-value">{{ forecast()!.daily.relative_humidity_2m_mean[0] | number:'1.0-0' }}%</span>
                  </div>
                </div>
                <div class="main-stat">
                  <app-icon size="xs" class="text-zinc-500">umbrella</app-icon>
                  <div class="flex flex-col">
                    <span class="stat-label">Precip</span>
                    <span class="stat-value">{{ forecast()!.daily.precipitation_sum[0] }}mm</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="today-icon">
              <app-icon size="xl" class="text-amber-400 animate-pulse-slow">{{ getWeatherIcon(forecast()!.daily.temperature_2m_max[0], forecast()!.daily.precipitation_sum[0]) }}</app-icon>
            </div>
          </div>
        </div>

        <!-- Weekly Grid -->
        <div class="weekly-grid">
          @for (day of forecast()!.daily.time.slice(1); track day; let i = $index) {
            @let idx = i + 1;
            @let maxTemp = forecast()!.daily.temperature_2m_max[idx];
            @let minTemp = forecast()!.daily.temperature_2m_min[idx];
            @let precip = forecast()!.daily.precipitation_sum[idx];
            
            <div class="forecast-card group" [class.has-rain]="precip > 0.5">
              <span class="day-name">{{ day | date:'EEE' }}</span>
              <div class="card-icon">
                <app-icon size="sm" [class]="precip > 0.5 ? 'text-blue-400' : 'text-amber-300'">{{ getWeatherIcon(maxTemp, precip) }}</app-icon>
              </div>
              <div class="temp-row">
                <span class="max-t">{{ maxTemp | number:'1.0-0' }}°</span>
                <span class="min-t">{{ minTemp | number:'1.0-0' }}°</span>
              </div>
              @if (precip > 0) {
                <span class="precip-val">
                  <app-icon size="xs">water_drop</app-icon>
                  {{ precip | number:'1.1-1' }}
                </span>
              }
            </div>
          }
        </div>
      }

      <!-- Footer Info -->
      <footer class="weather-footer">
        <div class="insight-pill">
          <app-icon size="xs" class="text-emerald-400">info</app-icon>
          <p>Next precipitation window expected in <span class="text-white font-bold">42 hours</span>. Monitor low-lying basins.</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .weather-root {
      padding: 1.5rem;
      background: rgba(13, 18, 30, 0.4);
      backdrop-filter: blur(24px);
      border-radius: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* Status Bar */
    .weather-status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.6rem 1rem;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 0.75rem;
      border: 1px solid rgba(255, 255, 255, 0.04);
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .pulse-dot {
      width: 6px;
      height: 6px;
      background: var(--primary);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--primary);
      animation: weather-pulse 2s infinite;
    }

    @keyframes weather-pulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(1.2); }
      100% { opacity: 1; transform: scale(1); }
    }

    .status-label {
      font-size: 0.65rem;
      font-weight: 800;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .divider {
      width: 1px;
      height: 12px;
      background: rgba(255, 255, 255, 0.1);
    }

    .refresh-btn {
      background: transparent;
      border: none;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s;
      padding: 4px;
      display: flex;
      align-items: center;
    }

    .refresh-btn:hover { color: #fff; }
    .refresh-btn.spinning app-icon { animation: spin 1s linear infinite; }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* Main Header */
    .main-header {
      display: flex;
      align-items: center;
    }

    .header-icon-box {
      width: 44px;
      height: 44px;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-title {
      font-size: 1rem;
      font-weight: 800;
      color: #fff;
      margin: 0;
      letter-spacing: -0.01em;
    }

    .header-subtitle {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0.1rem 0 0;
    }

    /* Today Highlight */
    .today-highlight {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01));
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 1.25rem;
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
    }

    .today-highlight::before {
      content: '';
      position: absolute;
      top: -20%;
      right: -10%;
      width: 150px;
      height: 150px;
      background: radial-gradient(circle, rgba(245, 158, 11, 0.1), transparent 70%);
      pointer-events: none;
    }

    .main-temp-box {
      display: flex;
      flex-direction: column;
    }

    .main-temp {
      font-size: 2.5rem;
      font-weight: 900;
      color: #fff;
      line-height: 1;
      font-family: var(--font-mono);
      letter-spacing: -0.04em;
    }

    .main-condition {
      font-size: 0.8rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 0.25rem;
    }

    .main-stats {
      display: flex;
      gap: 1.5rem;
    }

    .main-stat {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .stat-label {
      font-size: 0.55rem;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
    }

    .stat-value {
      font-size: 0.9rem;
      font-weight: 800;
      color: #cbd5e1;
      font-family: var(--font-mono);
    }

    .animate-pulse-slow {
      animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.05); }
    }

    /* Weekly Grid */
    .weekly-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 0.5rem;
    }

    .forecast-card {
      padding: 0.75rem 0.5rem;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }

    .forecast-card:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
    }

    .day-name {
      font-size: 0.65rem;
      font-weight: 900;
      color: #64748b;
      text-transform: uppercase;
    }

    .temp-row {
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
    }

    .max-t {
      font-size: 0.8rem;
      font-weight: 800;
      color: #f1f5f9;
    }

    .min-t {
      font-size: 0.65rem;
      font-weight: 700;
      color: #475569;
    }

    .precip-val {
      display: flex;
      align-items: center;
      gap: 0.2rem;
      font-size: 0.6rem;
      font-weight: 800;
      color: #60a5fa;
      font-family: var(--font-mono);
    }

    /* Footer */
    .insight-pill {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: rgba(16, 185, 129, 0.05);
      border: 1px solid rgba(16, 185, 129, 0.1);
      border-radius: 10px;
    }

    .insight-pill p {
      margin: 0;
      font-size: 0.75rem;
      color: #94a3b8;
      line-height: 1.4;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @media (max-width: 500px) {
      .weekly-grid { grid-template-columns: repeat(3, 1fr); }
      .today-highlight .flex { flex-direction: column; align-items: flex-start; gap: 1rem; }
      .today-icon { position: absolute; top: 1.5rem; right: 1.5rem; }
    }
  `]
})
export class WeatherForecast implements OnInit {
  private weather = inject(Weather);
  private toast = inject(ToastService);
  
  forecast = signal<WeatherData | null>(null);
  loading = signal<boolean>(true);
  error = signal<boolean>(false);

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.loading.set(true);
    this.error.set(false);
    
    // Simulate slight delay for "tech" feel
    setTimeout(() => {
      this.weather.getForecast(49.2, -119.5).subscribe({
        next: (data) => {
          this.forecast.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
          this.toast.error('Meteorological uplink failed. Check system connectivity.');
        }
      });
    }, 600);
  }

  getWeatherIcon(temp: number, precip: number): string {
    if (precip > 2.0) return 'rainy';
    if (precip > 0.1) return 'cloudy_snowing';
    if (temp > 24) return 'wb_sunny';
    if (temp < 10) return 'ac_unit';
    return 'partly_sunny';
  }

  getWeatherLabel(temp: number, precip: number): string {
    if (precip > 2.0) return 'Heavy Rainfall';
    if (precip > 0.1) return 'Scattered Showers';
    if (temp > 24) return 'Clear / Optimal';
    if (temp < 10) return 'Thermal Minimum';
    return 'Partly Cloudy';
  }
}
