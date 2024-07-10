import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EmpL2Component } from './emp-l2.component';

describe('EmpL2Component', () => {
  let component: EmpL2Component;
  let fixture: ComponentFixture<EmpL2Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EmpL2Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmpL2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
