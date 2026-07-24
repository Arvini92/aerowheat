import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { Anatomy } from './anatomy';

describe('Anatomy', () => {
  let component: Anatomy;
  let fixture: ComponentFixture<Anatomy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Anatomy]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Anatomy);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('selectedSection', 'Test Section');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
