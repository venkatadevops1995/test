import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BatchListsComponent } from './batch-lists/batch-lists.component';
import { AttendanceReportComponent } from './attendance-report/attendance-report.component';
import { ButtonModule } from "../../../components/button/button.module";
import { TimeSheetModule } from "../time-sheet/time-sheet.module";
import {MatTableModule} from '@angular/material/table';
import { UseSvgModule } from 'src/app/components/use-svg/use-svg.module';
import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';
import { TooltipModule } from 'src/app/directives/tooltip/tooltip.module';
import {MatFormFieldModule} from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatDialogModule} from '@angular/material/dialog';
import {MatRadioModule} from '@angular/material/radio';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { AtaiDateRangeModule } from 'src/app/components/atai-date-range/atai-date-range.module';
import { FileDownloadModule } from 'src/app/directives/file-download/file-download.module';
import { FileUploadModule } from 'src/app/components/input-file/input-file.module';

@NgModule({
    declarations: [
        BatchListsComponent,
        AttendanceReportComponent
    ],
    exports: [
        BatchListsComponent,
        AttendanceReportComponent
    ],
    imports: [
        CommonModule,
        ButtonModule,
        TimeSheetModule,
        MatTableModule,
        UseSvgModule,
        SvgIconModule,
        TooltipModule,
        MatFormFieldModule,
        FormsModule,
        MatInputModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatRadioModule,
        MatSlideToggleModule,
        AtaiDateRangeModule,
        FileDownloadModule,
        FileUploadModule,
    ]
})
export class VedaModule { }
