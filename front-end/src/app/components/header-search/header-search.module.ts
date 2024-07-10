import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderSearchComponent } from './header-search.component';
import { StripTableModule } from '../strip-table/strip-table.module';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from '../button/button.module';
import { ModalPopupModule } from '../modal-popup/modal-popup.module';
import { MatIconModule } from '@angular/material/icon';
import { EmployeeProfileDetailsModule } from '../employee-profile-details/employee-profile-details.module';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogModule } from '@angular/material/dialog'; 
import { UseSvgModule } from '../use-svg/use-svg.module';



@NgModule({
  declarations: [HeaderSearchComponent],
  imports: [
    CommonModule,
    StripTableModule,
    MatTableModule,
    MatInputModule,
    ReactiveFormsModule,
    ButtonModule,
    // ModalPopupModule,
    EmployeeProfileDetailsModule,
    MatIconModule,
    MatAutocompleteModule,
    MatDialogModule,
    UseSvgModule
  ],
  exports: [HeaderSearchComponent]
})
export class HeaderSearchModule { }
