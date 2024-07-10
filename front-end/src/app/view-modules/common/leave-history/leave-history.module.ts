import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaveHistoryComponent } from './leave-history.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete'; 
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FileDownloadModule } from 'src/app/directives/file-download/file-download.module'; 
import { MatTableModule } from '@angular/material/table'; 
import { MatDatepickerModule } from '@angular/material/datepicker';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { MatSortModule } from '@angular/material/sort';
import { ShowTableModule } from '../show-table/show-table.module';
import { AtaiDateRangeModule } from 'src/app/components/atai-date-range/atai-date-range.module';
import { UseSvgModule } from 'src/app/components/use-svg/use-svg.module';
import { MatCheckbox, MatCheckboxModule , MatCheckboxChange ,MatCheckboxClickAction } from '@angular/material/checkbox';
import { FocusModule } from 'src/app/directives/focuseDirective/focus/focus.module';
import { TableAffixModule } from 'src/app/directives/table-affix/table-affix.module';



@NgModule({
  declarations: [LeaveHistoryComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    UseSvgModule, 
    MatInputModule,
    FileDownloadModule,
    MatTableModule, 
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatSlideToggleModule,
    MatSortModule,
    ShowTableModule,
    AtaiDateRangeModule,
    MatCheckboxModule,
    FocusModule,
    TableAffixModule

  ]
})
export class LeaveHistoryModule { }
