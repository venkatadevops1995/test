import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolTipCompComponent } from './tool-tip-comp.component';

describe('ToolTipCompComponent', () => {
  let component: ToolTipCompComponent;
  let fixture: ComponentFixture<ToolTipCompComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ToolTipCompComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ToolTipCompComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
