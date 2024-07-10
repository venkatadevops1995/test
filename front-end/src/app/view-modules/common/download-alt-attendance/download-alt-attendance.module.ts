import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DownloadAltAttendanceComponent } from './download-alt-attendance.component';
import { MatTableModule } from '@angular/material/table';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { FileDownloadModule } from 'src/app/directives/file-download/file-download.module';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete'; 
import { TooltipModule } from 'src/app/directives/tooltip/tooltip.module';
import { MatCheckbox, MatCheckboxModule , MatCheckboxChange ,MatCheckboxClickAction } from '@angular/material/checkbox';
import { ButtonModule } from 'src/app/components/button/button.module';
import { AtaiDateRangeModule } from 'src/app/components/atai-date-range/atai-date-range.module';
import { UseSvgModule } from 'src/app/components/use-svg/use-svg.module';
import { FocusModule } from 'src/app/directives/focuseDirective/focus/focus.module';



@NgModule({
  declarations: [DownloadAltAttendanceComponent],
  bootstrap:    [DownloadAltAttendanceComponent],
  imports: [
    CommonModule,
    MatTableModule,
    MatInputModule,
    FormsModule,
    FileDownloadModule,
    MatInputModule,
    FormsModule,
    MatSelectModule,
    MatAutocompleteModule, 
    UseSvgModule,
    ReactiveFormsModule,
    TooltipModule,
    MatCheckboxModule,
    ButtonModule,
    AtaiDateRangeModule,
    FocusModule
  ]
})
export class DownloadAltAttendanceModule { }
