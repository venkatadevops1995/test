import { HttpParams } from '@angular/common/http';
import { Component, Inject, Input, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AtaiBreakPoints } from 'src/app/constants/atai-breakpoints';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';

@Component({
  selector: 'app-employee-profile-details',
  templateUrl: './employee-profile-details.component.html',
  styleUrls: ['./employee-profile-details.component.scss']
})
export class EmployeeProfileDetailsComponent implements OnInit {
  Is_match:boolean=false;
  showToolTip: boolean = false;
  constructor(private http: HttpClientService,private ss:SingletonService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<any>) {
      this.ss.responsive.observe([AtaiBreakPoints.SM,AtaiBreakPoints.XS]).subscribe(val=>{ 
        this.Is_match=val.matches;
        })
  }

  onCopy() {
    this.showToolTip = true;
    // console.log(this.showToolTip)
    setTimeout(() => {
      this.showToolTip = false;
    }, 1000)
  }

  onClickClose() {
    // 
    this.dialogRef.close()
  }

  ngOnInit(): void {
  }
  ngOnChanges() {
  }

}
