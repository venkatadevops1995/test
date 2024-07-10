import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EmpL1Component } from './emp-l1.component';

describe('EmpL1Component', () => {
  let component: EmpL1Component;
  let fixture: ComponentFixture<EmpL1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EmpL1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmpL1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
