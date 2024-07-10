import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HrTimesheetReportComponent } from './hr-timesheet-report.component';

describe('HrTimesheetReportComponent', () => {
  let component: HrTimesheetReportComponent;
  let fixture: ComponentFixture<HrTimesheetReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HrTimesheetReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HrTimesheetReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
