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
import { AtaiDateRangeComponent } from 'src/app/components/atai-date-range/atai-date-range.component';

export interface AttendanceInterface {
  date: any;
  firstIn: any;
  lastOut: any;
  gross: any;
  net: any
}

@Component({
  selector: 'app-hr-attendence-sheet',
  templateUrl: './hr-attendance-report.component.html',
  styleUrls: ['./hr-attendance-report.component.scss']
})
export class HrAttendanceReportComponent implements OnInit {

  @ViewChild(AtaiDateRangeComponent) dateRange: AtaiDateRangeComponent;

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
  isPageAccessable: Boolean = false;
  minDateChecker= 0;
  minDate!:any;
  isSelectedEmpAll:boolean = false;
  constructor(private http: HttpClientService, public datepipe: DatePipe, private user: UserService, private ss: SingletonService) {

    this.filteredManagers = this.option.valueChanges
      .pipe(
        startWith(''),
        map(state => state ? this.filterManagerList(state) : this.EMPS?.slice())
      );
  }

  private filterManagerList(value: string) {
    const filterValue = value.toLowerCase();
    return this.EMPS.filter(option => option.emp_name.toLowerCase().includes(filterValue))
  }

  ngOnInit(): void {
    let today = new Date();
    let last30days = new Date(new Date().setDate(today.getDate() - 30));
    this.todate = last30days.getFullYear()+'-'+(last30days.getMonth()+1)+'-'+last30days.getDate();
    this.fromdate = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    this.isPageAccessable = this.user.getIsEmpAdmin() || this.user.getSubReportAccess().includes('hr-attendance-reports');
    // this.checkHrAccessForreports();
    // if (this.dateRange) {
    //   this.dateRange.setPresetValue('Last 30 Days');
    // }
    this.getAttendenceData(this.fromdate, this.todate, this.user.getEmpId());
    console.log('##################1',this.ATTENDENCE_DATA.length,this.user.getEmpId());
    this.getReporters();
  }

  ngAfterViewInit() {
    // this.checkHrAccessForreports();
    setTimeout(()=>{
      if (this.dateRange) {
        this.dateRange.setPresetValue('Last 30 Days');
      }
    })
   
  }
  // When date range selection has canceled
  onCancelDateSelection(){
    this.minDate = undefined;
    this.maxDate = new Date();
    setTimeout(()=>{
      if (this.dateRange) {
        this.dateRange.setPresetValue('Last 30 Days');
      }
    })
    this.minDateChecker = 0;
  }
  // when a date is selected in the date range
  onDateSelection(data) {
    this.fromdate = this.convertDatefmt(data.start)
    this.todate = this.convertDatefmt(data.end)
       
    // checking if the selected employee is all then giving access to download report range betweeen 30 days
    if(this.isSelectedEmpAll == true){
      let next30Days = new Date(new Date(this.fromdate).setDate(data.start.getDate() + 30));
      if(next30Days > new Date()){
        next30Days = new Date();
      }
      if(this.minDateChecker==1){
        this.maxDate = next30Days
        this.minDate = data.start;
        this.minDateChecker+=1;

      }else if(this.minDateChecker>1){
        this.minDate = undefined;
        this.maxDate = new Date();
        this.minDateChecker = 1;

      }else{
        if(this.minDateChecker!=0){
          this.maxDate = next30Days
          this.minDate = data.start;
        }
        this.minDateChecker+=1;
      }
    } 
    
    if(this.todate){
      this.getAttendenceData(this.fromdate, this.todate, this.selectedEmpId);
    }
  }

  // checkHrAccessForreports() {

  //   this.http.noLoader(true).request("get", 'reportsAccessableAdmins/').subscribe(res => {
  //     if (res.status == 200) {
  //       this.isPageAccessable = res.body;
  //       if (this.dateRange) {
  //         this.dateRange.setPresetValue('Last 30 Days');
  //       }
  //     }
  //   });
  // }

  getAttendenceData(fromdate, todate, emp_id) {
    if (emp_id === 'all') {
      this.downloadable = true
    } else if (emp_id !== undefined) {
      this.http.request("get", 'attendance/?from=' + fromdate + '&to=' + todate + '&emp_id=' + emp_id,).subscribe(res => {
        if (res.status == 200) {
          // console.log(res.body['results'])
          this.ATTENDENCE_DATA = res.body['results'];
          this.downloadable = false;
          setTimeout(()=>{
            // console.log('##################1',this.ATTENDENCE_DATA.length);
            this.showMessage = true;
          },300)
        }
      })
    }
  }

  convertDatefmt(date) {
    return this.datepipe.transform(date, 'yyyy-MM-dd');
  }


  getDownloadEndPoint() {
    if (this.selectedEmpId === 'all') {
      return 'attendance/?from=' + this.fromdate + '&to=' + this.todate + '&download=' + true + '&all_emp=true&is_hr=true'
    } else {
      return 'attendance/?from=' + this.fromdate + '&to=' + this.todate + '&download=' + true + '&emp_id=' + this.selectedEmpId
    }
  }

  selectEmp(value) {
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
    // console.log('##################3',this.ATTENDENCE_DATA.length)
  }

  clear() {
    this.option.reset();
    this.option.setValue('');
  }
  
  getReporters() {
    // let is_hr=this.user.getIsEmpAdmin();
    // if ((this.user.getRoleId() > 1) && !is_hr ) {
    //   this.EMPS = [{ 'emp_id': 'all', 'emp_name': 'ALL' }];
    // } else {
    //   this.EMPS = [];
    // }
    this.EMPS = [];
    this.http.request("get", 'users/?str=&type=hr&hierarchy_type=lower&search=all',).subscribe(res => {
      if (res.status == 200) {
        console.log("res.body:",res.body)
        this.EMPS.push({ emp_id: 'all', emp_name: 'ALL' })
        res.body['results'].forEach(element => {
          this.EMPS.push(element)
        });
 
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