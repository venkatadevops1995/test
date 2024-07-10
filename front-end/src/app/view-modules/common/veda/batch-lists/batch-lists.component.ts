import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import {MatDialog, MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';
import { HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import { take } from 'rxjs/internal/operators/take';

export interface IBatchData {
  batch_name: string;
}

@Component({
  selector: 'app-batch-lists',
  templateUrl: './batch-lists.component.html',
  styleUrls: ['./batch-lists.component.scss']
})
export class BatchListsComponent implements OnInit {

  @ViewChild('addBatchResetFormRef') addBatchResetFormRef:NgForm
  @ViewChild('updateBatch', { static: true }) updateBatch: TemplateRef<any>;
  batchListsForm!:FormGroup;
  updateBatchListFormGroup!:FormGroup
  quickLinkStatus:string = '';
  displayedColumns = ["serial_number", "batch_name","status","action"];
  dataSource: MatTableDataSource<IBatchData>;
  

  constructor(private formBuilder : FormBuilder,private user:UserService, private cdr: ChangeDetectorRef, private dialog : MatDialog,private httpClient:HttpClientService,
    private dialogRef: MatDialogRef<any>, private ss:SingletonService, private router : Router) {
    const batches:IBatchData[] = [];
    this.dataSource = new MatTableDataSource();

    this.updateBatchListFormGroup = this.formBuilder.group({
      batchName:['',Validators.required],
      batchStatus:['',Validators.required]
    })

    this.batchListsForm = this.formBuilder.group({
      batchNameFormControl:['',[Validators.required,Validators.pattern(/^[A-Za-z0-9_]+$/)]]
    })

  }
  
  ngOnInit(): void {
    this.fetchBatchList('all');
  }

  // Getting updated batch lists
  fetchBatchList(status:String){
 
    let url = 'student/batch';
    let params = new HttpParams();
    
    if(status === 'active'){
      params = params.append('status', 1);
      this.quickLinkStatus = 'active'
    }else if(status === 'inactive'){
      params = params.append('status', 0);
      this.quickLinkStatus = 'inactive'
    }else{
      this.quickLinkStatus = 'all'
    }
    this.httpClient.request('get', url, params).subscribe((res:any)=>{
      if(res.status == 200){
        this.dataSource.data = res?.body?.results?.batches
      }else if(res.status == 204){
        this.dataSource.data = []
      }else {
        this.ss.statusMessage.showStatusMessage(false, res?.error?.message);
        console.log(res);
      }
    })
  }
  
  // New Batch creation
  addNewBatch(){

    let url = 'student/batch/';
    const payload = {
      batch_name:this.batchListsForm.get('batchNameFormControl')?.value
    }
    this.httpClient.request('post',url,'',payload).subscribe(res => {
      console.log(res);
      if (res.status == 201) {
        this.ss.statusMessage.showStatusMessage(true, "Batch has been created successfully");
        this.fetchBatchList(this.quickLinkStatus)
        this.batchListsForm.reset();
        this.addBatchResetFormRef.resetForm();
      }else if (res.status == 406) {
        this.ss.statusMessage.showStatusMessage(false, res?.error?.message);
      } else if (res.status == 409) {
        this.ss.statusMessage.showStatusMessage(false, res?.error?.message);
      }
    })
    
  }
  
  showBatchDetails(element:any){
    let redirectRoute = this.user.getDashboardRoute().replace('dashboard','');
    this.router.navigate([`${redirectRoute}/veda-attendance-report`], {state:element});
  }

  updateBatchListStatus(element){
       
    let url = 'student/batch/';
    let payload = {
      batch_name:element?.batch_name,
      status:( element?.status=== 1) ? 0 : 1,
    }
  
    this.httpClient.request('PUT',url,null, payload).subscribe((res)=>{
      console.log(res);
        if (res.status == 200) {
          this.ss.statusMessage.showStatusMessage(true, res?.body?.message);
        } else if (res.status == 409) {
          console.log(res.error);
          this.ss.statusMessage.showStatusMessage(false, res?.error?.message);
        } else if (res.status == 406) {
          this.ss.statusMessage.showStatusMessage(false, res?.error?.message);
        }else{
          this.ss.statusMessage.showStatusMessage(false, res?.error?.message);
        }
        this.fetchBatchList(this.quickLinkStatus);
    })
  }

  changeBatchStatus(event, element) {
    event.preventDefault();
    event.stopPropagation();

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      panelClass: 'confirm-remove-project',
      backdropClass: 'cdk-overlay-darker-backdrop',
      data: {
        confirmMessage: `Are you sure want to ${element?.status=== 1?`Deactivate this batch`:`Activate this batch`}`
      },
      restoreFocus: true
    })
    
    dialogRef.afterClosed().pipe(take(1)).subscribe(data => {
      if (data) { 
        // if confirmation true then update the batch status
        this.updateBatchListStatus(element);
      }else{
        return;
      }
    })
    
  }
}
