import { FileSizePipe } from './file-size.pipe';

import { NgModule } from '@angular/core';
import { FileUploadComponent } from './input-file.component';
import { ReactiveFormsModule, NgForm, FormGroupDirective } from '@angular/forms';
import { CommonModule } from '@angular/common'; 
import { UseSvgModule } from '../use-svg/use-svg.module';

@NgModule({
  declarations: [
    FileUploadComponent, FileSizePipe
  ],
  imports: [ReactiveFormsModule, CommonModule, UseSvgModule],
  exports: [FileUploadComponent, FileSizePipe],
  providers: [
    { provide: NgForm, useClass: NgForm },
    { provide: FormGroupDirective, useClass: FormGroupDirective }
  ]
})
export class FileUploadModule { }
