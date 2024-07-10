import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PreSignInComponent } from './pre-sign-in.component';

describe('PreSignInComponent', () => {
  let component: PreSignInComponent;
  let fixture: ComponentFixture<PreSignInComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PreSignInComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreSignInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
