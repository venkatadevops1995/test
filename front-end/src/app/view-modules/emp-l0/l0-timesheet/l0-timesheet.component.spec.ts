import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { L0TimesheetComponent } from './l0-timesheet.component';

describe('L0TimesheetComponent', () => {
  let component: L0TimesheetComponent;
  let fixture: ComponentFixture<L0TimesheetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ L0TimesheetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(L0TimesheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
