import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AtaiBreakPoints } from 'src/app/constants/atai-breakpoints';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-import-export-leave',
  templateUrl: './import-export-leave.component.html',
  styleUrls: ['./import-export-leave.component.scss']
})
export class ImportExportLeaveComponent implements OnInit {


  get is_MD_LT(){
    return this.ss.responsiveState[AtaiBreakPoints.MD_LT]
  }

  constructor(public dialog: MatDialog,
    private ss: SingletonService,
    private http: HttpClientService,
    private fb: FormBuilder,
    private datepipe: DatePipe,
    private user: UserService) { }
    
  fileUpdateForm = this.fb.group({
    'file':['',Validators.required],
    'password':[]
  })
  show_error:boolean = false
  error_response = []
  ngOnInit(): void {
  }
  uploadLeaveExcel(){
    this.error_response = []
    this.show_error= false
    var data = new FormData();
    data.append("file",this.fileUpdateForm.controls.file.value)

    this.http.request('post', 'leave/config/export-emp-leave/', '',data ).subscribe(res => {

      if (res.status == 201) {
        this.ss.statusMessage.showStatusMessage(true, "Leaves have been imported successfully");
        this.fileUpdateForm.reset()
      } else if(res.status==417){
        this.ss.statusMessage.showStatusMessage(false, res.error.results);
      }else if(res.status==422){
        this.ss.statusMessage.showStatusMessage(false, "Something went wrong");
      }else {
        this.error_response = res.error.results;
        if(res.error.results.hasOwnProperty('missing_columns')){
          this.ss.statusMessage.showStatusMessage(false, "Missing columns in excel: "+res.error.results.missing_columns.toString());
          return
        }
        this.ss.statusMessage.showStatusMessage(false, "Issue while importing leaves");
        this.show_error= true
        
      }
    })
    
  }

}
