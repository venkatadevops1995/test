import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImportExportLeaveComponent } from './import-export-leave.component';
import { FileDownloadModule } from 'src/app/directives/file-download/file-download.module';
import { FileUploadModule } from 'src/app/components/input-file/input-file.module';
import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';
import { ButtonModule } from 'src/app/components/button/button.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UseSvgModule } from 'src/app/components/use-svg/use-svg.module';
import { FocusModule } from 'src/app/directives/focuseDirective/focus/focus.module';



@NgModule({
  declarations: [ImportExportLeaveComponent],
  imports: [
    CommonModule,
    UseSvgModule,
    FileDownloadModule,
    FileUploadModule,
    ButtonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    FocusModule
  ]
})
export class ImportExportLeaveModule { }
