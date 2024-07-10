import { Component, OnInit, Inject, TemplateRef, HostBinding } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { AtaiBreakPoints } from 'src/app/constants/atai-breakpoints';
import { SingletonService } from 'src/app/services/singleton.service';

type ConfirmPopUpData = {
  heading: string, confirmMessage?: string,
  hideFooterButtons?: boolean, showCloseButton?: boolean,
  maxWidth?: any, template?: TemplateRef<any>, width: any, minWidth: any, onlyForAlert?: boolean,
  showTextbox?: boolean, placeholderTextField?: any, Cancel: string, Proceed: string
}

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent implements OnInit {

  // default settings data for the pop up
  defaultData: ConfirmPopUpData = {
    heading: 'Confirm',
    confirmMessage: 'Are you sure you want to continue ?',
    hideFooterButtons: false,
    maxWidth: '420px',
    template: null,
    minWidth: 'auto',
    width: '80vw',
    showTextbox: false,
    placeholderTextField: 'Enter comments',
    Cancel: 'Cancel',
    Proceed: 'Proceed'
  }

  destroy$: Subject<any> = new Subject();

  /* merged data passed with default data */
  dataMerged: ConfirmPopUpData = this.defaultData;

  fcText: FormControl = new FormControl('')

  get is_XMD_LT() {
    return this.ss.responsiveState[AtaiBreakPoints.XMD_LT];
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmPopUpData,
    private ss: SingletonService
  ) {
    this.dataMerged = { ...this.defaultData, ...data }
  }

  ngOnInit(): void {

  }

  @HostBinding('style.max-width') get maxWidth() {
    return this.dataMerged.maxWidth;
  }

  @HostBinding('style.width') get width() {
    return this.dataMerged.width;
  }

}
