import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendenceSheetComponent } from './attendence-sheet.component';

describe('AttendenceSheetComponent', () => {
  let component: AttendenceSheetComponent;
  let fixture: ComponentFixture<AttendenceSheetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AttendenceSheetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendenceSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
