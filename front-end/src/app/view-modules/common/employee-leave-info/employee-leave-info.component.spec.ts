import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeLeaveInfoComponent } from './employee-leave-info.component';

describe('EmployeeLeaveInfoComponent', () => {
  let component: EmployeeLeaveInfoComponent;
  let fixture: ComponentFixture<EmployeeLeaveInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EmployeeLeaveInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmployeeLeaveInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
