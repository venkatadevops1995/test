import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { L2DashboardComponent } from './l2-dashboard.component';

describe('L2DashboardComponent', () => {
  let component: L2DashboardComponent;
  let fixture: ComponentFixture<L2DashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ L2DashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(L2DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
