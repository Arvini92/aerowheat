You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.
## TypeScript Best Practices
- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain
## Angular Best Practices
- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.
## Accessibility Requirements
- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.
### Components
- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Prefer inline templates for small components
- Prefer Signal Forms (`@angular/forms/signals`) for new forms. They are stable in Angular v22+ and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms, prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.
## State Management
- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead
## Templates
- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.
## Services
- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection
- Styles: Component-scoped SCSS adhering to the glassmorphic design system defined in global styles.
- Performance: Strict cleanup of subscriptions via `DestroyRef` and TensorFlow.js tensors via `tf.tidy()`.

---

## Output Standards for Agent Execution
- Never generate truncated placeholder blocks or use code ellipsis comments (`// ... code here`).
- Every component template file must be written completely out using clean native HTML structures and structural control flow blocks.
- Verify that every component declaration exports a fully verified TypeScript standalone class configuration profile.

# Angular 22 Professional Architecture & Implementation Handbook

This document establishes the definitive production development standards for engineering applications using Angular 22. All autonomous coding agents, technical leads, and automated code generation pipelines must strictly comply with these architectural patterns to maintain system scalability, security, and peak runtime performance.

---

## 1. Project Directory & Naming Standards (Flat Architecture Style)

Angular 22 fully embraces a streamlined, modular **Flat File Naming Architecture**. Traditional file extensions like `.component.ts`, `.service.ts`, and `.directive.ts` are deprecated. Code assets are now named directly after their exact semantic purpose, dramatically flattening directory nesting profiles.

### Directory Structural Layout
src/
├── main.ts
├── app.config.ts
├── app.routes.ts
├── diagnostic/
│   ├── diagnostic.ts          <-- Unified Component File (No .component.ts)
│   ├── diagnostic.html
│   ├── diagnostic.css
│   └── inference.ts           <-- Unified Service File (No .service.ts)
└── shared/
├── ui/
│   ├── pill-badge.ts
│   └── glass-card.ts
└── utils/
└── tensor-format.ts


### File Naming Conventions
* **Components:** Class tokens must match direct semantic PascalCase naming conventions, while files use kebab-case. Example: `DiagnosticPanel` resides in `diagnostic-panel.ts`.
* **Templates & Styles:** Structural companion assets must match the exact naming identity of the parent script file. Example: `diagnostic-panel.html` and `diagnostic-panel.css`.

---

## 2. Component Design & Native Zoneless Strategy

### Selectorless and OnPush Architecture
Every component generated must operate with native compilation flags (`standalone: true`) and explicitly leverage `ChangeDetectionStrategy.OnPush`. Components serving as routable view-panes or modal layout steps should be implemented as **selectorless components** to minimize DOM processing overhead.

### Bootstrap Infrastructure
Applications must bypass legacy `zone.js` runtime tracking configurations entirely inside `app.config.ts` to achieve higher frame rates, lower memory footprints, and zero-overhead change loops.

```typescript
// app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Activates native runtime zoneless change detection
    provideZoneChangeDetection({ eventCoprocessing: false }),
    provideRouter(appRoutes)
  ]
};
Component Implementation Blueprint
TypeScript
// diagnostic.ts
import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Inference } from './inference';

@Component({
  selector: 'app-diagnostic', // Omit this line completely if treating as a routable page/view
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diagnostic.html',
  styleUrls: ['./diagnostic.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Diagnostic {
  // Functional context injection pattern
  private readonly inferenceEngine = inject(Inference);

  // Read-only state initialization using the modern Signals API
  readonly analysisStatus = signal<string>('Engine Initializing...');
  readonly confidenceScore = signal<number>(0);
  
  // Computed reactive states
  readonly isHighConfidence = computed(() => this.confidenceScore() >= 90);

  protected runAnalysis(tensorData: Float32Array): void {
    this.analysisStatus.set('Processing matrix convolutions...');
    const result = this.inferenceEngine.predict(tensorData);
    this.confidenceScore.set(result.score);
    this.analysisStatus.set(`Analysis complete. Mode: ${result.label}`);
  }
}
3. Advanced Reactivity & Stable Signal Pipelines
All reactive state variations must be tracked strictly using Signal primitives. RxJS streams must be reserved exclusively for heavy asynchronous event coordination, WebSockets, or multi-stream buffering transformations.

Inputs, Outputs, and Two-Way Bindings
Traditional class decorators (@Input, @Output, @ViewChild) are legacy patterns. Code systems must strictly implement functional state APIs:

TypeScript
import { Component, input, output, model, effect } from '@angular/core';

@Component({
  selector: 'app-vision-frame',
  template: `<div>Frame Layer</div>`
})
export class VisionFrame {
  // Immutable required inputs
  readonly imageDimensions = input.required<{ width: number; height: number }>();
  
  // Two-way signal binding
  readonly boundingBoxThreshold = model<number>(0.25);
  
  // Modern output emission channel
  readonly onDetectionCommitted = output<{ label: string; score: number }>();

  constructor() {
    // Structural state synchronization effect
    effect(() => {
      console.log(`Current inference sensitivity target: ${this.boundingBoxThreshold()}`);
    });
  }
}
Asynchronous Data Operations: The resource Primitive
For data fetching tasks, utilize the native resource() or rxResource() hooks to isolate lifecycle states, prevent trace race-conditions, and drop unnecessary loading-state boilerplate.

TypeScript
import { Component, signal, resource } from '@angular/core';

@Component({
  selector: 'app-disease-database',
  template: `
    @if (diseaseQuery.isLoading()) { <p>Syncing global disease registry...</p> }
    @else if (diseaseQuery.value()) { 
      <div>Record found: {{ diseaseQuery.value()?.description }}</div> 
    }
  `
})
export class DiseaseDatabase {
  readonly selectedClassId = signal<string>('rust');

  // Resource API handles caching, cancellation, and execution state automatically
  readonly diseaseQuery = resource({
    request: () => ({ id: this.selectedClassId() }),
    loader: async ({ request, abortSignal }) => {
      const response = await fetch(`/api/diagnostics/registry/${request.id}`, { signal: abortSignal });
      if (!response.ok) throw new Error('Network error during resource retrieval');
      return response.json();
    }
  });
}
4. Modern Template Syntax & Conditional Controls
Strict Block Syntax Execution
Never allow the implementation of legacy structural directives (*ngIf, *ngFor, or ngSwitch). Always write native, optimized template block structures to eliminate runtime container scaling overhead.

HTML
@if (analysisStatus()) {
  <div class="hud-banner">{{ analysisStatus() }}</div>
} @else {
  <div class="hud-banner default">System Standby</div>
}

<div class="matrix-grid">
  @for (zone of detectionZones(); track zone.id) {
    <div class="bounding-box-overlay" [style.color]="zone.color">
      <span>{{ zone.label }}</span>
    </div>
  } @empty {
    <div class="empty-state-notice">No pathogens or structural anomalies found.</div>
  }
</div>
Deferred View Loading Strategy (@defer)
To maximize Largest Contentful Paint (LCP) scores over mobile layouts, configure precise lazy-loading boundaries using structural placeholders:

HTML
@defer (on viewport; prefetch on idle) {
  <app-heavy-tensor-visualizer [matrix]="activeTensorLayers()" />
} @placeholder (minimum 250ms) {
  <div class="shimmer-placeholder">Preparing GPU data rendering layers...</div>
} @loading {
  <div class="loading-spinner">Streaming client binaries...</div>
} @error {
  <div class="alert-banner">Failed to dynamically instantiate visualization container.</div>
}
5. Stable Signal Forms Implementation
Angular 22 introduces completely stable Signal-driven Forms, mapping input value modifications and validation events instantly onto streamable signals.

TypeScript
// form-panel.ts
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-panel',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="configForm" (ngSubmit)="saveConfig()">
      <input formControlName="threshold" [class.invalid]="configForm.controls.threshold.invalid" />
      <button type="submit" [disabled]="configForm.invalid">Commit Weights</button>
    </form>
  `
})
export class FormPanel {
  readonly configForm = new FormGroup({
    threshold: new FormControl<number>(0.25, { nonNullable: true }),
    modelName: new FormControl<string>('YOLO26-Alpha', { nonNullable: true })
  });

  protected saveConfig(): void {
    if (this.configForm.valid) {
      const payload = this.configForm.getRawValue();
      console.log('Form parameters successfully committed:', payload);
    }
  }
}
6. Functional Injection & Decoupled Security Protocols
Cleaner Dependency Allocation
Replace standard class constructor logic with the modern inject() pattern. This strategy decouples object setups, simplifies interface extension patterns, and removes explicit super-call configurations during unit testing mocks.

TypeScript
// functional-auth.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { UserSession } from '../shared/services/user-session';

export const telemetryGuard = () => {
  const session = inject(UserSession);
  const router = inject(Router);

  if (session.hasTelemetryAuthorization()) {
    return true;
  }
  
  router.navigate(['/security/gatekeeper']);
  return false;
};
XSS Protection & Client Safe DOM Workflows
Sanitization Protection: When programmatically drawing to structural canvas frames or feeding raw video buffers into the template layers, route metrics through the native DomSanitizer to eliminate cross-site scripting vulnerabilities.

Direct DOM Guardrail: Do not access or manipulate raw global objects like document or native node fields. Always encapsulate interaction logic within Angular view bindings or use the Renderer2 injection token to guarantee total server-side rendering (SSR) runtime safety.

7. Testing Strategy (Vitest Infrastructure)
Angular 22 test workflows run natively on Vitest, deprecating legacy configurations like Karma and Protractor entirely.

TypeScript
// diagnostic.spec.ts
import { TestBed } from '@angular/core/testing';
import { Diagnostic } from './diagnostic';

describe('Diagnostic Standalone Unit Specs', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Diagnostic],
    }).compileComponents();
  });

  it('should cascade reactive state changes across signal tracking trees', () => {
    const fixture = TestBed.createComponent(Diagnostic);
    const component = fixture.componentInstance;

    // Mutate state parameters directly via signal primitives
    component.confidenceScore.set(94);
    
    // Evaluates the state graph and executes reactive effects synchronously
    TestBed.tick();

    expect(component.isHighConfidence()).toBe(true);
  });
});