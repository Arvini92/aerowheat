import { Component, ChangeDetectionStrategy, ViewEncapsulation, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icon } from '../../../../../design-system/icon/icon';
import { ToastService } from '@/src/app/design-system/toast/toast.service';

interface ScoutingTask {
  id: string;
  field: string;
  location: string;
  priority: 'Critical' | 'Optimal' | 'Standard' | 'Warning';
  anomaly: string;
  index: string;
  timestamp: string;
  completed: boolean;
}

@Component({
  selector: 'app-scouting-planner',
  standalone: true,
  imports: [CommonModule, Icon],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="planner-root glass-card mt-8">
      <!-- Status Header -->
      <div class="planner-status-bar">
        <div class="flex items-center gap-4">
          <div class="status-indicator">
            <span class="pulse-dot"></span>
            <span class="status-label">UAV Link: Active</span>
          </div>
          <div class="divider"></div>
          <div class="status-item">
            <app-icon size="xs" class="text-zinc-500">battery_5_bar</app-icon>
            <span>84% Power</span>
          </div>
        </div>
        
        <div class="progress-container">
          <span class="progress-label">Queue Progress</span>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="progress()"></div>
          </div>
          <span class="progress-value">{{ progress() }}%</span>
        </div>
      </div>

      <!-- Main Header -->
      <header class="main-header">
        <div class="flex items-center gap-4">
          <div class="header-icon-box">
            <app-icon size="md" class="text-emerald-400">explore</app-icon>
          </div>
          <div>
            <h3 class="header-title">Ground Truth Queue</h3>
            <p class="header-subtitle">Spectral Anomalies awaiting field verification</p>
          </div>
        </div>
        
        <div class="header-actions">
          <button class="action-btn-secondary" (click)="syncData()" [class.loading]="isSyncing()">
            <app-icon size="sm">{{ isSyncing() ? 'refresh' : 'sync' }}</app-icon>
            <span>{{ isSyncing() ? 'Syncing...' : 'Sync Data' }}</span>
          </button>
          <button class="action-btn-primary">
            <app-icon size="sm">add</app-icon>
            <span>Waypoint</span>
          </button>
        </div>
      </header>

      <!-- Task Grid -->
      <div class="task-grid">
        @for (task of tasks(); track task.id) {
          <div class="task-card" [class.is-completed]="task.completed">
            <div class="card-border" [class]="task.priority.toLowerCase()"></div>
            
            <div class="card-content">
              <div class="card-top">
                <div class="flex items-center gap-2">
                  <span class="priority-tag" [class]="task.priority.toLowerCase()">{{ task.priority }}</span>
                  <span class="task-id">{{ task.id }}</span>
                </div>
                <button (click)="toggleTask(task.id)" class="complete-toggle" [class.active]="task.completed">
                  <app-icon size="sm">{{ task.completed ? 'check_circle' : 'circle' }}</app-icon>
                </button>
              </div>

              <div class="card-body">
                <h4 class="field-title">{{ task.field }}</h4>
                <div class="coord-row">
                  <app-icon size="xs" class="text-emerald-500/40">place</app-icon>
                  <span>{{ task.location }}</span>
                </div>

                <div class="stats-box">
                  <div class="stat">
                    <span class="stat-label">Anomaly</span>
                    <span class="stat-value">{{ task.anomaly }}</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">Metric</span>
                    <span class="stat-value">{{ task.index }}</span>
                  </div>
                </div>
              </div>

              <div class="card-footer">
                <div class="time-stamp">
                  <app-icon size="xs">schedule</app-icon>
                  {{ task.timestamp }}
                </div>
                <button (click)="dispatchUav(task)" class="uav-btn" [disabled]="task.completed">
                  <span>Dispatch UAV</span>
                  <app-icon size="xs">send</app-icon>
                </button>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Insight Footer -->
      <footer class="planner-footer">
        <div class="insight-pill">
          <app-icon size="sm" class="text-amber-400">lightbulb</app-icon>
          <p>Scouting efficiency is up 12% today. Recommend starting with <b>WP-772</b> due to storm proximity.</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .planner-root {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
      background: rgba(13, 18, 30, 0.4);
      backdrop-filter: blur(24px);
      border-radius: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.08);
      font-family: var(--font-sans);
    }

    /* Status Bar */
    .planner-status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 0.75rem;
      border: 1px solid rgba(255, 255, 255, 0.04);
      flex-wrap: wrap;
      gap: 1rem;
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
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
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

    .status-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.65rem;
      color: #94a3b8;
      font-weight: 600;
    }

    .progress-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
      justify-content: flex-end;
      min-width: 200px;
    }

    .progress-label {
      font-size: 0.65rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }

    .progress-bar {
      height: 6px;
      width: 100px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--primary);
      transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
      box-shadow: 0 0 10px rgba(74, 214, 109, 0.3);
    }

    .progress-value {
      font-size: 0.75rem;
      font-weight: 800;
      color: #fff;
      font-family: var(--font-mono);
      min-width: 3ch;
    }

    /* Main Header */
    .main-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .header-icon-box {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, rgba(74, 214, 109, 0.15), rgba(74, 214, 109, 0.05));
      border: 1px solid rgba(74, 214, 109, 0.2);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: inset 0 0 12px rgba(74, 214, 109, 0.05);
    }

    .header-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: #fff;
      margin: 0;
      letter-spacing: -0.02em;
    }

    .header-subtitle {
      font-size: 0.8rem;
      color: #94a3b8;
      margin: 0.2rem 0 0;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .action-btn-primary, .action-btn-secondary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 10px;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn-primary {
      background: var(--primary);
      color: #000;
      border: none;
    }

    .action-btn-primary:hover {
      background: var(--primary-hover);
      transform: translateY(-1px);
    }

    .action-btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .action-btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .loading app-icon {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Task Grid */
    .task-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.25rem;
    }

    .task-card {
      position: relative;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 1.25rem;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
    }

    .task-card:hover {
      background: rgba(255, 255, 255, 0.06);
      transform: translateY(-3px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
      border-color: rgba(255, 255, 255, 0.1);
    }

    .task-card.is-completed {
      opacity: 0.5;
    }

    .card-border {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      opacity: 0.5;
    }

    .card-border.critical { background: #ef4444; box-shadow: 0 0 10px #ef4444; opacity: 0.8; }
    .card-border.warning { background: #f59e0b; }
    .card-border.optimal { background: var(--primary); }
    .card-border.standard { background: #64748b; }

    .card-content {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .priority-tag {
      font-size: 0.6rem;
      font-weight: 900;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 6px;
      letter-spacing: 0.05em;
    }

    .priority-tag.critical { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    .priority-tag.warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .priority-tag.optimal { background: rgba(74, 214, 109, 0.15); color: var(--primary); }
    .priority-tag.standard { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }

    .task-id {
      font-size: 0.65rem;
      font-family: var(--font-mono);
      color: #475569;
      font-weight: 700;
    }

    .complete-toggle {
      background: transparent;
      border: none;
      color: #475569;
      cursor: pointer;
      padding: 4px;
      transition: all 0.2s;
    }

    .complete-toggle:hover { color: #fff; }
    .complete-toggle.active { color: var(--primary); }

    .field-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #fff;
      margin: 0;
    }

    .coord-row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 0.25rem;
      font-family: var(--font-mono);
    }

    .stats-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .stat {
      padding: 0.75rem;
      background: rgba(0, 0, 0, 0.25);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.03);
    }

    .stat-label {
      display: block;
      font-size: 0.6rem;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      margin-bottom: 0.25rem;
    }

    .stat-value {
      font-size: 0.8rem;
      font-weight: 700;
      color: #cbd5e1;
      font-family: var(--font-mono);
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .time-stamp {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.65rem;
      color: #475569;
      font-family: var(--font-mono);
    }

    .uav-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: transparent;
      border: 1px solid rgba(74, 214, 109, 0.3);
      color: var(--primary);
      padding: 0.4rem 0.75rem;
      border-radius: 8px;
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.2s;
    }

    .uav-btn:hover:not(:disabled) {
      background: var(--primary);
      color: #000;
      border-color: var(--primary);
    }

    .uav-btn:disabled {
      opacity: 0.2;
      cursor: not-allowed;
    }

    .planner-footer {
      margin-top: 1rem;
    }

    .insight-pill {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(245, 158, 11, 0.05);
      border: 1px solid rgba(245, 158, 11, 0.12);
      border-radius: 12px;
    }

    .insight-pill p {
      margin: 0;
      font-size: 0.8rem;
      color: #94a3b8;
      line-height: 1.4;
    }

    .insight-pill b {
      color: #fff;
    }

    @media (max-width: 600px) {
      .planner-root { padding: 1rem; }
      .planner-status-bar { justify-content: center; }
      .main-header { flex-direction: column; align-items: flex-start; }
      .header-actions { width: 100%; }
      .action-btn-primary, .action-btn-secondary { flex: 1; justify-content: center; }
    }
  `]
})
export class ScoutingPlanner {
  private readonly toast = inject(ToastService);
  
  isSyncing = signal(false);

  private readonly initialTasks: ScoutingTask[] = [
    { 
      id: 'WP-772',
      field: 'Okanagan Sector 4A', 
      location: '49.25, -119.55', 
      priority: 'Critical', 
      anomaly: 'Spectral Drop', 
      index: 'NDVI -0.14',
      completed: false,
      timestamp: '14:22 UTC'
    },
    { 
      id: 'WP-812',
      field: 'Cariboo Basin Field B', 
      location: '50.55, -121.25', 
      priority: 'Optimal', 
      anomaly: 'Chlorophyll Gain', 
      index: 'RECI +0.08',
      completed: true,
      timestamp: '09:15 UTC'
    },
    { 
      id: 'WP-901',
      field: 'Fraser Valley Plot 2', 
      location: '49.12, -122.34', 
      priority: 'Warning', 
      anomaly: 'Drought Stress', 
      index: 'Moisture -12%',
      completed: false,
      timestamp: '16:05 UTC'
    },
    { 
      id: 'WP-944',
      field: 'Peace River South', 
      location: '55.72, -120.23', 
      priority: 'Standard', 
      anomaly: 'Pest Migration', 
      index: 'Thermal +2.4°C',
      completed: false,
      timestamp: '11:40 UTC'
    }
  ];

  readonly tasks = signal(this.initialTasks);
  
  readonly completedCount = computed(() => this.tasks().filter(t => t.completed).length);
  readonly progress = computed(() => Math.round((this.completedCount() / this.tasks().length) * 100));

  toggleTask(id: string) {
    this.tasks.update(ts => {
      const updated = ts.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
      const task = updated.find(t => t.id === id);
      if (task?.completed) {
        this.toast.success(`Verification waypoint ${id} finalized.`);
      }
      return updated;
    });
  }

  dispatchUav(task: ScoutingTask) {
    this.toast.info(`UAV dispatched to ${task.field}. Remote monitoring uplink established.`);
  }

  syncData() {
    this.isSyncing.set(true);
    setTimeout(() => {
      this.isSyncing.set(false);
      this.toast.info('Telemetry data synchronized with orbital platform.');
    }, 1800);
  }
}
