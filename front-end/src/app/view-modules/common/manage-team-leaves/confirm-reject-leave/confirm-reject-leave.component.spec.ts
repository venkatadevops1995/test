import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmRejectLeaveComponent } from './confirm-reject-leave.component';

describe('ConfirmRejectLeaveComponent', () => {
  let component: ConfirmRejectLeaveComponent;
  let fixture: ComponentFixture<ConfirmRejectLeaveComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfirmRejectLeaveComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmRejectLeaveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
