import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { L1DashboardComponent } from './l1-dashboard.component';

describe('L1DashboardComponent', () => {
  let component: L1DashboardComponent;
  let fixture: ComponentFixture<L1DashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ L1DashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(L1DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
