import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { Preview } from './preview';

describe('Preview', () => {
  let component: Preview;
  let fixture: ComponentFixture<Preview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Preview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Preview);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('previewImgSrc', 'test.png');
    fixture.componentRef.setInput('heatmapSpots', []);
    fixture.componentRef.setInput('isScanning', false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
