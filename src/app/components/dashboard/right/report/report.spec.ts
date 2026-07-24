import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { Report } from './report';

describe('Report', () => {
  let component: Report;
  let fixture: ComponentFixture<Report>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Report],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Report);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('currentScanResult', null);
    fixture.componentRef.setInput('scanConfidence', 85);
    fixture.componentRef.setInput('chartColor', '#000');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
