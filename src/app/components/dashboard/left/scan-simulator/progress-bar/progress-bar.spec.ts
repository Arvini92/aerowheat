import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ProgressBar } from './progress-bar';

describe('ProgressBar', () => {
  let component: ProgressBar;
  let fixture: ComponentFixture<ProgressBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressBar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProgressBar);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('scanStatusText', 'Scanning...');
    fixture.componentRef.setInput('scanProgress', 50);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
