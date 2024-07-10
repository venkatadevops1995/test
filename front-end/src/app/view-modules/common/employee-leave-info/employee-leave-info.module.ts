import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeLeaveInfoComponent } from './employee-leave-info.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field'; 
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { ButtonModule } from 'src/app/components/button/button.module';
import { ModalPopupModule } from 'src/app/components/modal-popup/modal-popup.module';
import { FileDownloadModule } from 'src/app/directives/file-download/file-download.module'; 
import { TooltipModule } from 'src/app/directives/tooltip/tooltip.module';
import { UseSvgModule } from 'src/app/components/use-svg/use-svg.module';
import { TableAffixModule } from 'src/app/directives/table-affix/table-affix.module';
import { FocusModule } from 'src/app/directives/focuseDirective/focus/focus.module';



@NgModule({
  declarations: [EmployeeLeaveInfoComponent],
  imports: [
    CommonModule,
    CommonModule,
    MatTableModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    ButtonModule,
    MatSelectModule,
    ModalPopupModule,
    MatCheckboxModule, 
    MatDividerModule,
    UseSvgModule,
    FileDownloadModule,
    TooltipModule,
    MatAutocompleteModule,
    TableAffixModule,
    FocusModule
  ],
  exports:[EmployeeLeaveInfoComponent]
})
export class EmployeeLeaveInfoModule { }
