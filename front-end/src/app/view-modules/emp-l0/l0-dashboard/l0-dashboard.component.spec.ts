import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { L0DashboardComponent } from './l0-dashboard.component';

describe('L0DashboardComponent', () => {
  let component: L0DashboardComponent;
  let fixture: ComponentFixture<L0DashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ L0DashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(L0DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
