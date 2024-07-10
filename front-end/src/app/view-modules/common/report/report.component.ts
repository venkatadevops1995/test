import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms'; 
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { AtaiDateRangeComponent, SelectionPresetTypes } from 'src/app/components/atai-date-range/atai-date-range.component';
import { MILLISECONDS_DAY } from 'src/app/constants/dashboard-routes';
import { HttpClientService } from 'src/app/services/http-client.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit {

  @ViewChild(AtaiDateRangeComponent) dateRange: AtaiDateRangeComponent;

  fromdate: any;
  downloadable = false;
  date4;
  EMPS: any[];
  option = new FormControl('');
  filteredManagers: Observable<any>;;
  todate: any;
  maxDate: Date = new Date();
  
  datePickerPresets: SelectionPresetTypes = ['Last 30 Days', 'Last Month', 'This Month']
  selected: any = {};
  message: any;
  availableDate: any;
  selectedEmpId: any;
  value: any;

  constructor(private http: HttpClientService, public datepipe: DatePipe, private user: UserService, private cdRef: ChangeDetectorRef) {
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

  ngOnInit(): void {

    // this.fromdate = this.convertDatefmt(this.ranges['Last 30 Days'][0])
    // this.todate = this.convertDatefmt(this.ranges['Last 30 Days'][1])
    // this.selected["startDate"] = this.ranges['Last 30 Days'][0];
    // this.selected["endDate"] = this.ranges['Last 30 Days'][1];

    // this.getAttendenceData(this.fromdate, this.todate, this.user.getEmpId());
    this.getReporters();
    this.getStatus();

  }

  ngAfterViewInit() {

  }

  // when a date is selected in the date range
  onDateSelection(data) {
    this.fromdate = this.convertDatefmt(data.start)
    this.todate = this.convertDatefmt(data.end)
    this.cdRef.detectChanges()
  }

  //  getAttendenceData(fromdate, todate, emp_id) {
  //   if (emp_id === 'all') {
  //      this.http.request("get", 'attendance/?from=' + this.fromdate + '&to=' + this.todate + '&all_emp=true').subscribe(res => {
  //        if (res.status == 200) {
  //          this.downloadable = res.body['results']['downloadable'];
  //        }
  //      })
  //    } else {
  //      this.http.request("get", 'attendance/?from=' + fromdate + '&to=' + todate + '&emp_id=' + emp_id,).subscribe(res => {
  //        if (res.status == 200) {
  //          console.log(res.body['results'])
  //          this.downloadable = false;
  //        }
  //      })
  //    }
  // }

  getStatus() {
    this.http.request("get", 'reportdatesavailability/',).subscribe(res => {
      if (res.status == 200) {

        this.message = res.body.msg.msg;
        let days = this.calculateDiff(this.datepipe.transform(res.body.availbledate, 'yyyy-MM-dd')); 
        
        // set the max date
        this.maxDate = new Date(this.maxDate.getTime() - (days * MILLISECONDS_DAY));
        this.maxDate.setHours(0,0,0,0)
        this.dateRange.maxDate = this.maxDate;
        this.dateRange.setPresetValue('Last 30 Days');

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
    console.log(date);

    return this.datepipe.transform(date, 'yyyy-MM-dd');
  }
  updateRange(event) {
    if (event.startDate) {
      this.fromdate = this.convertDatefmt(event.startDate._d);
    }
    if (event.endDate) {

      this.todate = this.convertDatefmt(event.endDate._d);
    }
    console.log(this.fromdate, this.todate)

    // this.getAttendenceData(this.fromdate, this.todate, this.option.value)

  }
  getDownloadEndPoint() {
    if (this.selectedEmpId === 'all') {
      return 'report/?from=' + this.fromdate + '&to=' + this.todate + '&download=' + true + '&emp_id=' + this.user.getEmpId() + '&all_emp=true'
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
        })

        this.EMPS.forEach(element => {
          if (element.emp_id == this.user.getEmpId()) {
            let emp_name = element.emp_name;
            console.log(emp_name);

            this.option.setValue(emp_name);
            this.selectEmp(emp_name)
          }
        });
      }
    })

  }
}
