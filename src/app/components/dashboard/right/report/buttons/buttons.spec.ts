import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { Buttons } from './buttons';

describe('Buttons', () => {
  let component: Buttons;
  let fixture: ComponentFixture<Buttons>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Buttons]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Buttons);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('currentScanResult', null);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
