import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { Record } from './record';

describe('RecordComponent', () => {
  let component: Record;
  let fixture: ComponentFixture<Record>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Record]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Record);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('diseases', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
