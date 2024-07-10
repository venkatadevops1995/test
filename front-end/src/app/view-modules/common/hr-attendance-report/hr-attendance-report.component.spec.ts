import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HrAttendanceReportComponent } from './hr-attendance-report.component';

describe('HrAttendanceReportComponent', () => {
  let component: HrAttendanceReportComponent;
  let fixture: ComponentFixture<HrAttendanceReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HrAttendanceReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HrAttendanceReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
