import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigGridComponent } from './config-grid.component';

describe('ConfigGridComponent', () => {
  let component: ConfigGridComponent;
  let fixture: ComponentFixture<ConfigGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfigGridComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
