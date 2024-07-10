import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EmpL0Component } from './emp-l0.component';

describe('EmpL0Component', () => {
  let component: EmpL0Component;
  let fixture: ComponentFixture<EmpL0Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EmpL0Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmpL0Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
