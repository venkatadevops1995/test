import { DatePipe } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { AtaiDateRangeComponent, SelectionPresetTypes } from 'src/app/components/atai-date-range/atai-date-range.component';
import { PopUpComponent } from 'src/app/components/pop-up/pop-up.component';
import { FileDownloadService } from 'src/app/directives/file-download/file-download.service';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-attendance-report',
  templateUrl: './attendance-report.component.html',
  styleUrls: ['./attendance-report.component.scss']
})
export class AttendanceReportComponent implements OnInit {

  @ViewChild(AtaiDateRangeComponent) dateRange: AtaiDateRangeComponent;
  @ViewChild('studentFormResetRef') studentFormResetRef:NgForm
  @ViewChild("uploadBatchListSheetPopUp") uploadBatchListSheetPopUp : TemplateRef<any>;

  studentsListFormGroup!:FormGroup;
  batchListFileUploadFormGroup!:FormGroup

  batchName!:string;
  batchId!:number;
  dataSource: MatTableDataSource<any>;
  maxDate = new Date();
  redirectRoute:string = ''
  startDate!:any;
  endDate!:any;
  displayedColumns = ["serial_number", "student_name","hid"];
  datePickerPresets: SelectionPresetTypes = ['Last 30 Days', 'Last Month', 'This Month']
  show_error:boolean = false
  error_response = []
  constructor(private route:Router,public datepipe: DatePipe, private dialog : MatDialog, private fileDownload: FileDownloadService, private formBuilder:FormBuilder,private httpClient:HttpClientService, private user:UserService, private ss:SingletonService) {
    let batchData =  this.route.getCurrentNavigation().extras.state
    this.batchName = batchData?.batch_name
    this.batchId = batchData?.id
    console.log(batchData);
    
    this.redirectRoute = this.user.getDashboardRoute().replace('dashboard','');
    this.dataSource = new MatTableDataSource();

    this.batchListFileUploadFormGroup = this.formBuilder.group({
      batchListFileFormControl:['',Validators.required],
    })

    this.studentsListFormGroup = this.formBuilder.group({
      studentNameFormControl:['', [Validators.required, Validators.pattern(/^[a-zA-Z]+(?:\s[a-zA-Z]+)+$/)]],
      deviceIDFormControl:['',[Validators.required, Validators.pattern(/^\d{6}$/)]]
    })
  }

  ngOnInit(): void {
    this.getAttendanceReport()
  }

  ngAfterViewInit() {

    setTimeout(()=>{
      if (this.dateRange) {
        this.dateRange.setPresetValue('Last 30 Days');
      }
    })
  }

  backToBackList(){
    this.route.navigateByUrl(`${this.redirectRoute}veda-batch-list`);
  }
  getAttendanceReport(){
    let url = 'student/'
    let params = new HttpParams();
    params = params.append('batch_name', this.batchName)
    this.httpClient.request('get',url ,params).subscribe((res)=>{
      console.log(res);
      if (res.status == 200){
        this.dataSource.data = res?.body?.results;
      }else if(res.status == 204){
        this.dataSource.data = [];
      }else if(res.status == 400){
        this.ss.statusMessage.showStatusMessage(false, res?.error?.message);
        this.dataSource.data = [];
      }else{
        this.ss.statusMessage.showStatusMessage(false, res?.error?.message);
        this.dataSource.data = [];
      }
    })
  }

  addStudent(){
    let url = 'student/'
    let payload = {
      batch_name:this.batchName,
      student_name:this.studentsListFormGroup.get('studentNameFormControl').value,
      device_id:this.studentsListFormGroup.get('deviceIDFormControl').value
    }

    this.httpClient.request('post', url, '', payload).subscribe((res)=>{
      console.log(res);
      if (res.status == 201) {
        this.ss.statusMessage.showStatusMessage(true, "Student has been added successfully");
        this.studentsListFormGroup.reset();
        this.studentFormResetRef.resetForm()
        this.getAttendanceReport();
      } else if (res.status == 406) {
        this.ss.statusMessage.showStatusMessage(false, res?.error?.message);
      } else if (res.status == 409) {
        this.ss.statusMessage.showStatusMessage(false, res?.error?.message);
      }
    })
   
  }

  onDateSelection(data) {
    this.startDate = this.convertDataFormate(data.start)
    this.endDate = this.convertDataFormate(data.end)

    console.log(this.startDate, this.endDate);
    
  }
  convertDataFormate(date) {
    return this.datepipe.transform(date, 'yyyy-MM-dd');
  }

  downloadStudentAttendanceReport() {
    
    if(this.dateRange){
      let dp = this.dateRange.value;   
      this.startDate =  this.datepipe.transform(dp.start, 'yyyy-MM-dd')
      this.endDate = this.datepipe.transform(dp.end, 'yyyy-MM-dd');
    }
    
    let url = 'student/attendance/';
    let params = new HttpParams();
    params = params.append('batch_name',this.batchName);
    params = params.append('start_date',this.startDate);
    params = params.append('end_date', this.endDate);
 
    this.httpClient.noLoader(true).showProgress('download').request('get', url, params, "", {}, {responseType: 'blob',progress: 'download'}).subscribe((res) => {
      if (res.status == 200) {
        let fileName = this.fileDownload.getFileName(res)
        this.fileDownload.download(res.body, fileName, res.headers.get('Content-Type'))
        console.log('exported')

      } else if (res.status == 204) {
        console.log(res);
        this.ss.statusMessage.showStatusMessage(false, 'No rows available for the current filter criteria')
      }
    })

  }

  openStudentSheetUploaderPopUp(){
    this.dialog.open(PopUpComponent, {
      data: {
        heading: `Upload Student List Sheet`,
        template:this.uploadBatchListSheetPopUp,
        maxWidth:'70vw',
        minWidth:'280px',
        hideFooterButtons: true,
        showCloseButton: true,
        padding_horizontal:false,
        padding_vertical:false,
        mb_30:false
      },
      autoFocus: false,
      restoreFocus:true
    })
  }

  uploadBatchListSheet(){
    this.error_response = []
    this.show_error= false
    let data = new FormData();
    let url = `export_student/${this.batchId}`
    data.append("file",this.batchListFileUploadFormGroup.controls.batchListFileFormControl.value)
 
    this.httpClient.request('post', url, '',data ).subscribe(res => {
      console.log(res);
      
      if (res.status == 201) {
        this.ss.statusMessage.showStatusMessage(true, "Batch list sheet have been imported successfully");
        this.batchListFileUploadFormGroup.reset()
        this.getAttendanceReport();
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
        let error_message;
        Object.keys(res.error["results"][0]).forEach(ele => {
          error_message = res.error["results"][0][ele];
        })
        this.ss.statusMessage.showStatusMessage(false, error_message);
        this.show_error= true
      }
    })
    
  }

  downloadBatchListSheet(){
    let url = `export_student/${this.batchId}`
    this.httpClient.noLoader(true).showProgress('download').request('get', url, null, "", {}, {responseType: 'blob',progress: 'download'}).subscribe((res) => {
      if (res.status == 200) {
        let fileName = this.fileDownload.getFileName(res)
        this.fileDownload.download(res.body, fileName, res.headers.get('Content-Type'))
        console.log('exported')

      } else if (res.status == 400) {
        console.log(res);
        this.ss.statusMessage.showStatusMessage(false, res?.error?.message);
      }
    })
  }

}
