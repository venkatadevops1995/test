import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable()
export class XhrProgressService {
  
  // progress download observable
  progressDownload:Subject<any> = new Subject();
  
  // progress upload observable
  progressUpload:Subject<any> = new Subject();
  
  readyState:Subject<any> = new Subject();
  
}
