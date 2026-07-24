import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { GlassCard } from '../../../design-system/glass-card/glass-card';
import { DocumentIcon } from '../../../design-system/icons/document-icon';
import { ActivePlan } from '../planner';
import { PrintIcon } from '../icons/print-icon';
import { ButtonComponent } from '../../../design-system/button/button';

@Component({
  selector: 'app-plan',
  standalone: true,
  imports: [GlassCard, DocumentIcon, PrintIcon, ButtonComponent],
  templateUrl: './plan.html',
  styleUrl: './plan.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Plan {
  readonly activePlan = input<ActivePlan | null>(null);

  printPlan(): void {
    window.print();
  }
}
