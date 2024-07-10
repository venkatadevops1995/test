import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DownloadReportMessageComponent } from './download-report-message.component';
import { UseSvgModule } from '../use-svg/use-svg.module';



@NgModule({
  declarations: [
    DownloadReportMessageComponent
  ],
  imports: [
    CommonModule,
    UseSvgModule
  ],
  exports:[DownloadReportMessageComponent]
})
export class DownloadReportMessageModule { }
