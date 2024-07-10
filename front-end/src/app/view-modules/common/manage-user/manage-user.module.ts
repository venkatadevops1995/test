import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {  ManageUserComponent } from './manage-user.component';
import {  MatTableModule } from '@angular/material/table';
import {MatDialogModule} from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ButtonModule } from 'src/app/components/button/button.module';
import { MatSelectModule } from '@angular/material/select';
import { ModalPopupModule } from 'src/app/components/modal-popup/modal-popup.module';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatIconModule} from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';
import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';
import { FileDownloadModule } from 'src/app/directives/file-download/file-download.module';
// import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { TooltipModule } from 'src/app/directives/tooltip/tooltip.module';
import { FileUploadModule } from 'src/app/components/input-file/input-file.module';
import { AddUserComponent } from './add-user/add-user.component';
import { EditUserComponent } from './edit-user/edit-user.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AtaiDateRangeModule } from 'src/app/components/atai-date-range/atai-date-range.module';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { ConfirmDialogModule } from 'src/app/components/confirm-dialog/confirm-dialog.module';
import {MatRadioModule} from '@angular/material/radio';
import { UseSvgModule } from 'src/app/components/use-svg/use-svg.module';
import { TableAffixModule } from 'src/app/directives/table-affix/table-affix.module';
import { FocusModule } from 'src/app/directives/focuseDirective/focus/focus.module';
import { NumericModule } from 'src/app/directives/numeric/numeric.module';

  // If required extend other NativeDateAdapter methods.
@NgModule({
  declarations: [ManageUserComponent, AddUserComponent, EditUserComponent,],
  imports: [
    CommonModule,
    MatTableModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    ButtonModule,
    MatSelectModule,
    ModalPopupModule,
    MatCheckboxModule,
    UseSvgModule,
    MatDividerModule,
    SvgIconModule,
    FileDownloadModule,
    TooltipModule,
    FileUploadModule,
    MatAutocompleteModule,
    AtaiDateRangeModule,
    MatDatepickerModule,
    MatDialogModule,
    ConfirmDialogModule,
    MatRadioModule,
    TableAffixModule,
    FocusModule,
    NumericModule
    // NgxDaterangepickerMd.forRoot()
  ]
})
export class ManageUserModule { }
