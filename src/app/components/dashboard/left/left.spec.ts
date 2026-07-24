import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { Left } from './left';

describe('Left', () => {
  let component: Left;
  let fixture: ComponentFixture<Left>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Left]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Left);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
