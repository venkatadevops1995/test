import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageSelfLeavesComponent } from './manage-self-leaves.component';

describe('ManageLeaveComponent', () => {
  let component: ManageSelfLeavesComponent;
  let fixture: ComponentFixture<ManageSelfLeavesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageSelfLeavesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageSelfLeavesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
