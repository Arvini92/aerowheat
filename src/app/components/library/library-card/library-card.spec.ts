import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { LibraryCard } from './library-card';

describe('LibraryCard', () => {
  let component: LibraryCard;
  let fixture: ComponentFixture<LibraryCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibraryCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LibraryCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('d', { id: '1', name: 'Test', type: 'Test', scientific: 'Test', desc: 'Test', anatomy: [] });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
