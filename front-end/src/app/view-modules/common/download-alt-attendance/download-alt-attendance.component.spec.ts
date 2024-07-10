import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadAltAttendanceComponent } from './download-alt-attendance.component';

describe('DownloadAltAttendanceComponent', () => {
  let component: DownloadAltAttendanceComponent;
  let fixture: ComponentFixture<DownloadAltAttendanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DownloadAltAttendanceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DownloadAltAttendanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
