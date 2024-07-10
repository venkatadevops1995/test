import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadMisComponent } from './download-mis.component';

describe('DownloadMisComponent', () => {
  let component: DownloadMisComponent;
  let fixture: ComponentFixture<DownloadMisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DownloadMisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DownloadMisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
