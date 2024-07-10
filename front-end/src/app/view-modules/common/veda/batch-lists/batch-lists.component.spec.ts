import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatchListsComponent } from './batch-lists.component';

describe('BatchListsComponent', () => {
  let component: BatchListsComponent;
  let fixture: ComponentFixture<BatchListsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BatchListsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BatchListsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
