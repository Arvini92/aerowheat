import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { Pathogens } from './pathogens';

describe('Pathogens', () => {
  let component: Pathogens;
  let fixture: ComponentFixture<Pathogens>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pathogens]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Pathogens);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('currentPathogens', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
