import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AttendenceSheetComponent } from './attendence-sheet.component';
import { MatTableModule } from '@angular/material/table';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; 
import { MatInputModule } from '@angular/material/input';
import { FileDownloadModule } from 'src/app/directives/file-download/file-download.module';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete'; 
import { TooltipModule } from 'src/app/directives/tooltip/tooltip.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AtaiDateRangeModule } from 'src/app/components/atai-date-range/atai-date-range.module'; 
import { ToolTipModule } from 'src/app/directives/tool-tip/tool-tip.module';
import { UseSvgModule } from 'src/app/components/use-svg/use-svg.module';
import { AffixModule } from 'src/app/directives/affix/affix.module';
import { TableAffixModule } from 'src/app/directives/table-affix/table-affix.module';
import { FocusModule } from 'src/app/directives/focuseDirective/focus/focus.module';


@NgModule({
  declarations: [AttendenceSheetComponent],
  bootstrap:    [AttendenceSheetComponent],
  imports: [
    CommonModule,
    MatTableModule,
    MatInputModule,
    FormsModule,
    FocusModule,
 
    // NgxDaterangepickerMd.forRoot(),
    MatFormFieldModule,
    FileDownloadModule,
    MatInputModule,
    FormsModule,
    MatSelectModule,
    MatAutocompleteModule, 
    UseSvgModule,
    ReactiveFormsModule, 
    AtaiDateRangeModule,
    ToolTipModule,
    TooltipModule,
    TableAffixModule
  ]
})
export class AttendenceSheetModule { }
