import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { Preset } from './preset';

describe('Preset', () => {
  let component: Preset;
  let fixture: ComponentFixture<Preset>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Preset]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Preset);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
