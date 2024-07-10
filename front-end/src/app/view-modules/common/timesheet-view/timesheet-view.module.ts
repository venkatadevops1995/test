import { TimeSheetService } from './../time-sheet/time-sheet.service';
import { ModalPopupModule } from './../../../components/modal-popup/modal-popup.module';
import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';
import { ButtonModule } from './../../../components/button/button.module';
import { ReactiveFormsModule } from '@angular/forms';
import { TimeSheetModule } from './../time-sheet/time-sheet.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimesheetViewComponent } from './timesheet-view.component';
import { MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogModule } from 'src/app/components/confirm-dialog/confirm-dialog.module';
import { MatIconModule } from '@angular/material/icon';
import { UseSvgModule } from 'src/app/components/use-svg/use-svg.module';

import {A11yModule} from '@angular/cdk/a11y';
import { FocusModule } from 'src/app/directives/focuseDirective/focus/focus.module';

@NgModule({
  declarations: [TimesheetViewComponent],
  imports: [
    CommonModule,
    TimeSheetModule,
    ReactiveFormsModule,
    ButtonModule, 
    ModalPopupModule,
    MatDialogModule,
    ConfirmDialogModule ,
    UseSvgModule,
    A11yModule,
    FocusModule
  ],
  exports:[
    TimesheetViewComponent
  ]

})
export class TimesheetViewModule { }
