import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageTeamLeavesComponent } from './manage-team-leaves.component';

describe('ManageTeamLeavesComponent', () => {
  let component: ManageTeamLeavesComponent;
  let fixture: ComponentFixture<ManageTeamLeavesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageTeamLeavesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageTeamLeavesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
