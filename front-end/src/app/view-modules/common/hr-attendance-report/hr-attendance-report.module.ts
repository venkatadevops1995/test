import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HrAttendanceReportComponent } from './hr-attendance-report.component';
import { MatTableModule } from '@angular/material/table';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { MatInputModule } from '@angular/material/input';
import { FileDownloadModule } from 'src/app/directives/file-download/file-download.module';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';
// import { TooltipModule } from 'src/app/directives/tooltip/tooltip.module';
import { AtaiDateRangeModule } from 'src/app/components/atai-date-range/atai-date-range.module';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TooltipModule } from 'src/app/directives/tooltip/tooltip.module';
import { UseSvgModule } from 'src/app/components/use-svg/use-svg.module';
import { TableAffixModule } from 'src/app/directives/table-affix/table-affix.module';
import { FocusModule } from 'src/app/directives/focuseDirective/focus/focus.module';


@NgModule({
  declarations: [HrAttendanceReportComponent],
  bootstrap:    [HrAttendanceReportComponent],
  imports: [
    CommonModule,
    MatTableModule,
    MatInputModule,
    FormsModule,
    // NgxDaterangepickerMd.forRoot(),
    FileDownloadModule,
    MatInputModule,
    FormsModule,
    MatSelectModule,
    MatAutocompleteModule, 
    UseSvgModule,
    ReactiveFormsModule,
    TooltipModule,
    AtaiDateRangeModule,
    TableAffixModule,
    FocusModule
  ]
})
export class HrAttendenceReportModule { }
