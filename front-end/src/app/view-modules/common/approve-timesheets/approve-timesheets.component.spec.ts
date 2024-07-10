import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ApproveTimesheetsComponent } from './approve-timesheets.component';

describe('ApproveTimesheetsComponent', () => {
  let component: ApproveTimesheetsComponent;
  let fixture: ComponentFixture<ApproveTimesheetsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ApproveTimesheetsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApproveTimesheetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
