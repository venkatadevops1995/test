import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StripTableComponent } from './strip-table.component';

describe('StripTableComponent', () => {
  let component: StripTableComponent;
  let fixture: ComponentFixture<StripTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StripTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StripTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
