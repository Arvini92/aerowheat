import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { Charts } from './charts';

describe('Charts', () => {
  let component: Charts;
  let fixture: ComponentFixture<Charts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Charts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Charts);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('diseaseStats', [10, 20, 30, 40, 50]);
    fixture.componentRef.setInput('barColors', ['#000', '#111', '#222', '#333', '#444']);
    fixture.componentRef.setInput('barLabels', ['A', 'B', 'C', 'D', 'E']);
    fixture.componentRef.setInput('lowPercent', 10);
    fixture.componentRef.setInput('medPercent', 20);
    fixture.componentRef.setInput('highPercent', 30);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
