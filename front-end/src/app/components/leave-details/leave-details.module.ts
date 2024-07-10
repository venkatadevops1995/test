import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaveDetailsComponent } from './leave-details.component';
import { StripTableModule } from '../strip-table/strip-table.module';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from '../button/button.module';
import { ModalPopupModule } from '../modal-popup/modal-popup.module';
import { MatIconModule } from '@angular/material/icon'; 
import { UseSvgModule } from '../use-svg/use-svg.module';



@NgModule({
  declarations: [LeaveDetailsComponent],
  imports: [
    CommonModule,
    StripTableModule,
    MatTableModule,
    MatInputModule,
    ReactiveFormsModule,
    ButtonModule,
    ModalPopupModule,
    MatIconModule,
    UseSvgModule
  ],
  exports: [LeaveDetailsComponent]
})
export class LeaveDetailsModule { }
