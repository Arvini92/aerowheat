import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { Symptoms } from './symptoms';

describe('Symptoms', () => {
  let component: Symptoms;
  let fixture: ComponentFixture<Symptoms>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Symptoms]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Symptoms);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('selectedSectionTitle', 'Test Title');
    fixture.componentRef.setInput('selectedSectionDesc', 'Test Desc');
    fixture.componentRef.setInput('currentSymptoms', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
