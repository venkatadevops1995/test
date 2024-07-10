import { Component, Inject, OnInit, TemplateRef } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-reject-leave',
  templateUrl: './confirm-reject-leave.component.html',
  styleUrls: ['./confirm-reject-leave.component.scss']
})
export class ConfirmRejectLeaveComponent implements OnInit {

  fcRejectMessage : FormControl = new FormControl('')

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { confirmMessage: string, template: TemplateRef<any> }
  ) {

  }

  ngOnInit(): void {

  }

}
