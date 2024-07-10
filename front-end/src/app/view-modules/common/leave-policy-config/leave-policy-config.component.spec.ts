import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LeavePolicyConfigComponent } from './leave-policy-config.component';

describe('LeavePolicyConfigComponent', () => {
  let component: LeavePolicyConfigComponent;
  let fixture: ComponentFixture<LeavePolicyConfigComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LeavePolicyConfigComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LeavePolicyConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

// on load the emp types and leave types and the time periods of the new hire round off config should be populated as per the backend values or stub values
// load a leave type config with one of the emp type and leave types table value having status 0. It should show NA in the value cell and should not be editable
// 