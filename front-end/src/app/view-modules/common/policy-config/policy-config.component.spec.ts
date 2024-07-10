import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PolicyConfigComponent } from './policy-config.component';

describe('PolicyConfigComponent', () => {
  let component: PolicyConfigComponent;
  let fixture: ComponentFixture<PolicyConfigComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PolicyConfigComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PolicyConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
