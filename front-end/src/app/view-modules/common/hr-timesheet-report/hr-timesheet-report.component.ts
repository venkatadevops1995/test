import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
// import { DaterangepickerDirective } from 'ngx-daterangepicker-material';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { AtaiDateRangeComponent, SelectionPresetTypes } from 'src/app/components/atai-date-range/atai-date-range.component';
import { MILLISECONDS_DAY } from 'src/app/constants/dashboard-routes';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-hr-timesheet-report',
  templateUrl: './hr-timesheet-report.component.html',
  styleUrls: ['./hr-timesheet-report.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HrTimesheetReportComponent implements OnInit {

  @ViewChild(AtaiDateRangeComponent) dateRange: AtaiDateRangeComponent;

  fromdate: any;
  downloadable = false;
  date4;
  EMPS: any[];
  option = new FormControl('');
  filteredManagers: Observable<any>;
  isPageAccessable: Boolean = false;
  ;
  // @ViewChild(DaterangepickerDirective, { static: true }) pickerDirective: DaterangepickerDirective;
  todate: any;
  maxDate: any = new Date();
  datePickerPresets: SelectionPresetTypes = ['Last 30 Days', 'Last Month', 'This Month']
  selected: any = {};
  message: any;
  availableDate: any;
  selectedEmpId: any;
  value: any;
  constructor(private http: HttpClientService, public datepipe: DatePipe, private user: UserService, private ss: SingletonService, private cdRef: ChangeDetectorRef) {
    this.filteredManagers = this.option.valueChanges
      .pipe(
        startWith(''),
        map(state => state ? this.filterManagerList(state) : this.EMPS.slice())
      );


  }
  private filterManagerList(value) {
    const filterValue = value.toLowerCase();
    return this.EMPS.filter(option => option.emp_name.toLowerCase().includes(filterValue))
  }


  // when a date is selected in the date range
  onDateSelection(data) {
    // console.log(data)
    this.fromdate = this.convertDatefmt(data.start)
    this.todate = this.convertDatefmt(data.end)
  }

  open(e) {
    // this.pickerDirective.open(e);
  }

  ngOnInit(): void {

    // this.getAttendenceData(this.fromdate, this.todate, this.user.getEmpId());
    this.getReporters();
    this.getStatus();
    this.isPageAccessable = this.user.getIsEmpAdmin();
    // if (this.dateRange) {
    //   this.dateRange.setPresetValue('Last 30 Days');
    // }
    // console.log('&&&&&&&&&&&&&&&',this.dateRange)
  }

  ngAfterViewInit() {

    // this.checkHrAccessForreports();
    setTimeout(()=>{
      if (this.dateRange) {
        this.dateRange.setPresetValue('Last 30 Days');
      }
    })
  }

  // checkHrAccessForreports() {
  // this.http.noLoader(true).request("get", 'reportsAccessableAdmins/').subscribe(res => {
  //   if (res.status == 200) {
  //     this.isPageAccessable = res.body;
  //     this.cdRef.detectChanges()
  //     if (this.isPageAccessable) {
  //       this.dateRange.maxDate = this.maxDate;
  //       this.dateRange.setPresetValue('Last 30 Days');
  //     }
  //   }
 // });

  // }

  getStatus() {
    this.http.request("get", 'reportdatesavailability/',).subscribe(res => {
      if (res.status == 200) {
        this.message = res.body.msg.msg;
        let days = this.calculateDiff(this.datepipe.transform(res.body.availbledate, 'yyyy-MM-dd'));

        // set the max date
        this.maxDate = new Date(this.maxDate.getTime() - (days * MILLISECONDS_DAY));
        this.maxDate.setHours(0, 0, 0, 0)
        if (this.dateRange) {
          this.dateRange.maxDate = this.maxDate;
          this.dateRange.setPresetValue('Last 30 Days');
        }
      }
    })
  }

  calculateDiff(sentDate) {
    var date1: any = new Date(sentDate);
    var date2: any = new Date();
    var diffDays: any = Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  convertDatefmt(date) {
    return this.datepipe.transform(date, 'yyyy-MM-dd');
  }

  getDownloadEndPoint() {
    if(this.dateRange){
      let dp = this.dateRange.value;   
      this.fromdate =  this.datepipe.transform(dp.start, 'yyyy-MM-dd')
      this.todate = this.datepipe.transform(dp.end, 'yyyy-MM-dd');
    }

    if (this.selectedEmpId === 'all') {
      return 'report/?from=' + this.fromdate + '&to=' + this.todate + '&download=' + true + '&emp_id=' + this.user.getEmpId() + '&all_emp=true&is_hr=true'
    } else {
      return 'report/?from=' + this.fromdate + '&to=' + this.todate + '&download=' + true + '&emp_id=' + this.selectedEmpId
    }
  }

  selectEmp(value) {
    this.selectedEmpId = this.EMPS.filter(x => {
      if (x.emp_name == value) {
        return x['emp_id'];
      }
    });
    // this.getAttendenceData(this.fromdate, this.todate, this.option.value)
    this.selectedEmpId = this.selectedEmpId[0]['emp_id']
  }

  clear() {
    this.option.reset();
    this.option.setValue('');
  }

  getReporters() {
    // let is_hr=this.user.getIsEmpAdmin();
    // console.log('>>>>>>>>>>>',is_hr)
    // if (this.user.getRoleId() > 1) {
    //   this.EMPS = [{ 'emp_id': 'all', 'emp_name': 'ALL' }];
    //   console.log('***************', this.EMPS)
    // } else {
    //   this.EMPS = [];
    // }
    this.EMPS = [];
    this.http.request("get", 'users/?str=&type=hr&hierarchy_type=lower&search=all',).subscribe(res => {
      if (res.status == 200) {
        this.EMPS.push({ emp_id: 'all', emp_name: 'ALL' })
        res.body['results'].forEach(element => {
          this.EMPS.push(element)
        });

        // this.EMPS.push({
        //   'email': res.body['results']['email'],
        //   'emp_id': res.body['results']['emp_id'],
        //   'emp_name': res.body['results']['emp_name']
        // })
        // res.body['results']['reporters'].forEach(each => {
        //   if (each['emp_id'] !== res.body['results']['emp_id']) {
        //     this.EMPS.push(each);
        //   }
        // })

        this.EMPS.forEach(element => {
          if (element.emp_id == this.user.getEmpId()) {
            let emp_name = element.emp_name;
            // console.log(emp_name);

            this.option.setValue(emp_name);
            this.selectEmp(emp_name)
          }
        });
      }
    })

  }
}
