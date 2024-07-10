import { ModalPopupModule } from './../../../components/modal-popup/modal-popup.module';
import { ButtonModule } from './../../../components/button/button.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApproveTimesheetsComponent } from './approve-timesheets.component';
import {MatPaginatorModule} from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select'; 
import { FileDownloadModule } from 'src/app/directives/file-download/file-download.module';
import { TimeSheetModule } from '../time-sheet/time-sheet.module';
import { PopUpModule } from 'src/app/components/pop-up/pop-up.module';
import {  MatDialogModule } from '@angular/material/dialog'; 
import { StylePaginatorModule } from 'src/app/directives/style-paginator/style-paginator.module';
import { UseSvgModule } from 'src/app/components/use-svg/use-svg.module';
import { FocusModule } from 'src/app/directives/focuseDirective/focus/focus.module';



@NgModule({
  declarations: [ApproveTimesheetsComponent],
  imports: [
    CommonModule,
    ButtonModule,
    MatPaginatorModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
    ModalPopupModule,
    MatSelectModule,
    UseSvgModule,
    FileDownloadModule,
    TimeSheetModule,
    PopUpModule,
    MatDialogModule, 
    StylePaginatorModule,
    FocusModule
  ]
})
export class ApproveTimesheetsModule { }
