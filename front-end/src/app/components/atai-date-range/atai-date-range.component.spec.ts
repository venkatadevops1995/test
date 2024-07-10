import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtaiDateRangeComponent } from './atai-date-range.component';

describe('AtaiDateRangeComponent', () => {
  let component: AtaiDateRangeComponent;
  let fixture: ComponentFixture<AtaiDateRangeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AtaiDateRangeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AtaiDateRangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
