import { Component, HostBinding, Inject, OnInit, Optional, Self, TemplateRef } from '@angular/core';
import { MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, take, takeUntil } from 'rxjs';
import { AtaiBreakPoints } from 'src/app/constants/atai-breakpoints';
import { SingletonService } from 'src/app/services/singleton.service';


type PopUpData = { heading?: any, hideFooterButtons?: boolean, showCloseButton?: boolean, maxWidth?: any, template?: TemplateRef<any>, minWidth: any, padding_horizontal?: boolean, padding_vertical?: boolean, vertical_scroll: boolean, mb_30: boolean }

@Component({
  selector: 'app-pop-up',
  templateUrl: './pop-up.component.html',
  styleUrls: ['./pop-up.component.scss']
})
export class PopUpComponent implements OnInit { 

  // default settings data for the pop up
  defaultData: PopUpData = {
    heading: 'Heading',
    hideFooterButtons: false,
    showCloseButton: true,
    maxWidth: '600px',
    template: null,
    minWidth: '200px',
    padding_horizontal: true,
    padding_vertical: true,
    vertical_scroll: true,
    mb_30: true
  }

  /* merged data passed with default data */
  dataMerged: PopUpData = this.defaultData;

  // is medium resolutin in responsive resolutions
  get is_MD(){
    return this.ss.responsiveState[AtaiBreakPoints.MD];
  }


  // Rename the property to whatever you want it to be
  dialogConfig: MatDialogConfig;

  constructor(@Inject(MAT_DIALOG_DATA) public data: PopUpData, @Inject(MatDialogRef) public dialogRef, private ss: SingletonService) { 
    this.dataMerged = { ...this.defaultData, ...data } 
  }

  ngOnInit(): void {
    console.dir(`Dialog config: ${this.dialogConfig}`);
  }
 

  @HostBinding('style.max-width') get maxWidth() {
    return this.dataMerged.maxWidth;
  }

  @HostBinding('style.min-width') get minWidth() {
    return this.dataMerged.minWidth;
  }

}
