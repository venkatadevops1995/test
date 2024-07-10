import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { L3DashboardComponent } from './l3-dashboard.component';

describe('L3DashboardComponent', () => {
  let component: L3DashboardComponent;
  let fixture: ComponentFixture<L3DashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ L3DashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(L3DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
