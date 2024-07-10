import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
// import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { FileDownloadModule } from 'src/app/directives/file-download/file-download.module';
import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';
import { TooltipModule } from 'src/app/directives/tooltip/tooltip.module';
import { HrTimesheetReportComponent } from './hr-timesheet-report.component';
import { AtaiDateRangeModule } from 'src/app/components/atai-date-range/atai-date-range.module';
import { UseSvgModule } from 'src/app/components/use-svg/use-svg.module';
import { DownloadReportMessageModule } from 'src/app/components/download-report-message/download-report-message.module';
import { FocusModule } from 'src/app/directives/focuseDirective/focus/focus.module';



@NgModule({
  declarations: [HrTimesheetReportComponent],
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
    ReactiveFormsModule,
    TooltipModule,
    AtaiDateRangeModule,
    UseSvgModule,
    DownloadReportMessageModule,
    FocusModule
  ]
})
export class HrTimesheetReportModule { }
