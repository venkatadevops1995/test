import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileDownloadDirective } from './file-download.directive';
import { FileDownloadService } from './file-download.service';
import { WindowReferenceService } from 'src/app/services/window-reference.service';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [FileDownloadDirective ],
  exports:[FileDownloadDirective],
  providers:[FileDownloadService ]
})
export class FileDownloadModule { }
