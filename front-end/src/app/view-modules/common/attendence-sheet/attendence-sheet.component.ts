import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClientService } from 'src/app/services/http-client.service';
import { HttpParams } from '@angular/common/http';
import { DatePipe } from '@angular/common'; 
// import { DaterangepickerDirective } from 'ngx-daterangepicker-material';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UserService } from 'src/app/services/user.service';
import { TooltipDirective } from 'src/app/directives/tooltip/tooltip.directive';
import { SingletonService } from 'src/app/services/singleton.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { AtaiDateRangeComponent, SelectionPresetTypes } from 'src/app/components/atai-date-range/atai-date-range.component';
import { DateRange } from '@angular/material/datepicker';
import { MILLISECONDS_DAY } from 'src/app/constants/dashboard-routes';

export interface AttendanceInterface {
  date: any;
  firstIn: any;
  lastOut: any;
  gross: any;
  net: any
}

@Component({
  selector: 'app-attendence-sheet',
  templateUrl: './attendence-sheet.component.html',
  styleUrls: ['./attendence-sheet.component.scss']
})
export class AttendenceSheetComponent implements OnInit {

  @ViewChild(AtaiDateRangeComponent) dateRangePicker: AtaiDateRangeComponent;
  fromdate: any;
  downloadable = false;
  showMessage = false;
  date4;
  EMPS: any[];
  option = new FormControl('');
  // @ViewChild(DaterangepickerDirective, { static: true }) pickerDirective: DaterangepickerDirective;
  todate: any;
  ATTENDENCE_DATA: AttendanceInterface[] = [];
  displayedColumns: string[] = ['date', 'firstIn', 'lastOut', 'gross', 'net', 'posted'];
  dataSource = this.ATTENDENCE_DATA;
  maxDate = new Date();
  selected: any = {};
  selectedEmpId: any;
  value: any;
  filteredManagers: Observable<any>;
  minDateChecker= 0;
  minDate!:any;
  isSelectedEmpAll:boolean = false;
  constructor(private http: HttpClientService, public datepipe: DatePipe, private user: UserService, private ss: SingletonService) {
    this.filteredManagers = this.option.valueChanges
  
      .pipe(
        startWith(''),
        map(state => state ? this.filterManagerList(state) : this.EMPS ? this.EMPS.slice() : [])
      );
    
  }

  private filterManagerList(value: string) {
    const filterValue = value.toLowerCase();
    return this.EMPS.filter(option => option.emp_name.toLowerCase().includes(filterValue))
    // return this.filterArray.filter(state => state.emp_name.toLowerCase().indexOf(filterValue) === 0);
  }

  open(e) {
    // this.pickerDirective.open(e);
  }
  ngOnInit(): void {
    // this.option.setValue(this.user.getEmpId());

  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.dateRangePicker.setPresetValue('Last 30 Days')
      // this.getAttendenceData(this.fromdate, this.todate, this.user.getEmpId());
      this.getReporters();
    },100)
  }

   // When date range selection has canceled
   onCancelDateSelection(){
    this.minDate = undefined;
    this.maxDate = new Date();
    setTimeout(()=>{
      if (this.dateRangePicker) {
        this.dateRangePicker.setPresetValue('Last 30 Days');
      }
    })
    this.minDateChecker = 0;
  }
  onDateSelection(val: DateRange<any>) {
    // console.log(val)
    // this.fromdate = val.start;
    this.fromdate = this.convertDatefmt(val.start)
    this.todate = this.convertDatefmt(val.end);
    // this.getAttendenceData(this.fromdate, this.todate, this.user.getEmpId());
    // checking if the selected employee is all then giving access to download report range betweeen 30 days
    if(this.isSelectedEmpAll == true){
      let next30Days = new Date(new Date(this.fromdate).setDate(val.start.getDate() + 30));
      
      if(next30Days > new Date()){
        next30Days = new Date();
      }
      if(this.minDateChecker==1){
        this.maxDate = next30Days
        this.minDate = val.start;
        this.minDateChecker+=1;

      }else if(this.minDateChecker>1){
        this.minDate = undefined;
        this.maxDate = new Date();
        this.minDateChecker = 1;

      }else{
        if(this.minDateChecker!=0){
          this.maxDate = next30Days
          this.minDate = val.start;
        }
        this.minDateChecker+=1;
      }
    } 
    
    if(this.todate){
      this.getAttendenceData(this.fromdate, this.todate, this.selectedEmpId);
    }
  }

  getAttendenceData(fromdate, todate, emp_id) {
    if (emp_id === 'all') {
      // this.http.request("get",'attendance/?from='+this.fromdate+'&to='+this.todate+'&all_emp=true').subscribe(res=>{
      //   if (res.status == 200) {
      //     console.log(res.body['results'])
      //      this.ATTENDENCE_DATA = []; 
      //      this.downloadable = res.body['results']['downloadable'];
      //      }
      //    })
      this.downloadable = true
    } else if (emp_id !== undefined) {
      // console.log(':::::::::::::::',emp_id)
      this.http.request("get", 'attendance/?from=' + fromdate + '&to=' + todate + '&emp_id=' + emp_id,).subscribe(res => {
        if (res.status == 200) {
          // console.log(res.body['results'])
          this.ATTENDENCE_DATA = res.body['results'];
          this.downloadable = false;
          this.showMessage = true;
        }
      })
    }
  }

  convertDatefmt(date) {
    return this.datepipe.transform(date, 'yyyy-MM-dd');
  }
  getDownloadEndPoint() {
    if (this.selectedEmpId === 'all') {
      return 'attendance/?from=' + this.fromdate + '&to=' + this.todate + '&download=' + true + '&all_emp=true'
    } else {
      return 'attendance/?from=' + this.fromdate + '&to=' + this.todate + '&download=' + true + '&emp_id=' + this.selectedEmpId
    }
  }

  selectEmp(value) {
    if(this.EMPS){
    this.selectedEmpId = this.EMPS.filter(x => {
      if (x.emp_name == value) {
        return x['emp_id'];
      }
    });
    this.selectedEmpId = this.selectedEmpId[0]['emp_id']
    if(this.selectedEmpId === 'all'){
      this.isSelectedEmpAll = true;
      this.onCancelDateSelection();
    }else{
      this.isSelectedEmpAll = false;
    }
    this.getAttendenceData(this.fromdate, this.todate, this.selectedEmpId)
  }
  }

  clear() {
    this.option.reset();
    this.option.setValue('');
  }
  // selectEmp(){
  //   this.getAttendenceData(this.fromdate,this.todate,this.option.value)
  // }
  getReporters() {
    if (this.user.getRoleId() > 1) {
      this.EMPS = [{ 'emp_id': 'all', 'emp_name': 'ALL' }];
    } else {
      this.EMPS = [];
    }
    this.http.request("get", 'mgr-reporters/?indirect=true',).subscribe(res => {
      if (res.status == 200) {
        this.EMPS.push({
          'email': res.body['results']['email'],
          'emp_id': res.body['results']['emp_id'],
          'emp_name': res.body['results']['emp_name']
        })
        res.body['results']['reporters'].forEach(each => {
          if (each['emp_id'] !== res.body['results']['emp_id']) {
            this.EMPS.push(each);
          }
          // console.log(this.EMPS, "-------------------------")
        })
        this.EMPS.forEach(element => {
          if (element.emp_id == this.user.getEmpId()) {
            let emp_name = element.emp_name;
            // console.log(emp_name);

            this.selectEmp(emp_name);
            this.option.setValue(emp_name);
          }
        });
      }
    })
  }
}