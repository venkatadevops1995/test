import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportExportLeaveComponent } from './import-export-leave.component';

describe('ImportExportLeaveComponent', () => {
  let component: ImportExportLeaveComponent;
  let fixture: ComponentFixture<ImportExportLeaveComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImportExportLeaveComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportExportLeaveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
