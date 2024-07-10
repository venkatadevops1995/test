import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadReportMessageComponent } from './download-report-message.component';

describe('DownloadReportMessageComponent', () => {
  let component: DownloadReportMessageComponent;
  let fixture: ComponentFixture<DownloadReportMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DownloadReportMessageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DownloadReportMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
