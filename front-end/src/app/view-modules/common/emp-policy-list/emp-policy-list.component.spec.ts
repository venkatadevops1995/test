import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EmpPolicyListComponent } from './emp-policy-list.component';

describe('EmpPolicyListComponent', () => {
  let component: EmpPolicyListComponent;
  let fixture: ComponentFixture<EmpPolicyListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EmpPolicyListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmpPolicyListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
