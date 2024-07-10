import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EmpL3Component } from './emp-l3.component';

describe('EmpL3Component', () => {
  let component: EmpL3Component;
  let fixture: ComponentFixture<EmpL3Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EmpL3Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmpL3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
