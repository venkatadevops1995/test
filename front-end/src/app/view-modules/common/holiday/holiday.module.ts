import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';
import { HolidayComponent } from './holiday.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'src/app/components/button/button.module';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core'; 
import { ModalPopupModule } from 'src/app/components/modal-popup/modal-popup.module';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTableModule } from '@angular/material/table';
import { AtaiDateRangeModule } from 'src/app/components/atai-date-range/atai-date-range.module';
import { PopUpModule } from 'src/app/components/pop-up/pop-up.module';
import { MatDialogModule } from '@angular/material/dialog';
import { UseSvgModule } from 'src/app/components/use-svg/use-svg.module';
import { AffixModule } from 'src/app/directives/affix/affix.module';
import { FocusModule } from 'src/app/directives/focuseDirective/focus/focus.module';

@NgModule({
  declarations: [HolidayComponent],
  imports: [
    CommonModule,
    UseSvgModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    MatDatepickerModule,
    MatNativeDateModule, 
    ModalPopupModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatTableModule,
    MatFormFieldModule,
    AtaiDateRangeModule,
    PopUpModule,
    MatDialogModule,
    AffixModule,
    FocusModule
  ],
  providers: [DatePipe]
})
export class HolidayModule { }
