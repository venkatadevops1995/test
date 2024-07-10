import { DatePipe } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
// import { DaterangepickerDirective } from 'ngx-daterangepicker-material';
// import { DaterangepickerComponent } from 'ngx-daterangepicker-material/daterangepicker.component';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { AtaiDateRangeComponent } from 'src/app/components/atai-date-range/atai-date-range.component';
import { MILLISECONDS_DAY } from 'src/app/constants/dashboard-routes';
import { FileDownloadService } from 'src/app/directives/file-download/file-download.service';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';
import { UserService } from 'src/app/services/user.service';
// import { MonthYearComponent } from '../month-year/month-year.component';
@Component({
  selector: 'app-leave-history',
  templateUrl: './leave-history.component.html',
  styleUrls: ['./leave-history.component.scss']
})
export class LeaveHistoryComponent implements OnInit {
  // the sorting criteria for the historic leave applcn list
  sortHistoricKey: 'startDate' | 'endDate' | 'empName' | null = 'startDate'
  side: boolean = true;
  sortDirection: 'asc' | 'desc' | null = 'desc'
  // sorting in the historical leaves
  sortHistoric: any = {
    empName: false,
    startDate: false,
    endDate: false
  }

  employeesOptions: Array<any> = []
  employeeSelected: { emp_id: number, emp_name: string } = null
  leaveApplicationColumns: string[] = ['serial', 'id', 'emp_name', 'startdate', 'enddate', 'day_count', 'leave_type', 'status'];
  historyLeavesFiltersApplied: boolean = false

  fromdate: any;
  todate: any;
  maxDate = new Date();

  selectedHistoryRange: any = {};
  selectedAppliedRange: any = {};
  LEAVE_DATA_HISTORY = []
  // picker: DaterangepickerComponent;
  showMessage = false;
  // @ViewChild(DaterangepickerDirective, { static: true }) pickerDirective: DaterangepickerDirective;
  @ViewChild(MatSort) sort1: MatSort;

  @ViewChild(AtaiDateRangeComponent) dateRangePicker: AtaiDateRangeComponent;

  isPageAccessable: Boolean = false;

  futureLeavesOnly: boolean = false;

  constructor(private ss: SingletonService,
    private http: HttpClientService,
    private datepipe: DatePipe,
    private fileDownload: FileDownloadService,
    private cd: ChangeDetectorRef,
    private user: UserService
  ) {

    side: this.any;
    setTimeout(() => {
      this.filteredManagers = this.managerCtrl.valueChanges
        .pipe(
          startWith(''),
          map(state => state ? this.filterManagerList(state) : this.employeesOptions.slice())
        );
    }, 300)
  }


  filterManagerList(value: string) {
    const filterValue = value.toLowerCase();

    return this.employeesOptions.filter(option => option.emp_name.toLowerCase().includes(filterValue))
    // return this.filterArray.filter(state => state.emp_name.toLowerCase().indexOf(filterValue) === 0);
  }

  managerCtrl = new FormControl();
  value; any;
  filteredManagers: Observable<any>;
  monthFrom: number = new Date().getMonth() + 1;
  yearFrom: number = new Date().getFullYear();
  employeeList: any[] = [];
  fgFilter = this.ss.fb.group({
    all: [''],
    employeeName: ['']
  })

  Ischecked: boolean = false;

  ngOnInit(): void {
    // this.checkHrAccessForreports();
    this.isPageAccessable = this.user.getIsEmpAdmin();
    this.getEmployees();
    this.Ischecked = false;
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.setPickerToLast30Days();
    })
  }

  setPickerToLast30Days() {
    this.dateRangePicker.setPresetValue("Last 30 Days");
  }

  onDateSelect(date) {
    this.selectedHistoryRange["startDate"] = date.start;
    this.selectedHistoryRange["endDate"] = date.end;
    let fgValue: any = this.managerCtrl.value
    this.getLeaveApplications(true, fgValue)
  }


  onClickFutureLeavesOnly(data: MatCheckboxChange) {
    this.futureLeavesOnly = data.checked;
  }

  onSubmitResolvedLeaveFilter(e) {
    // console.log("Checked:", e.checked)
    let isFutureLeave = false
    if (this.Ischecked) {
      isFutureLeave = true
    } else {
      isFutureLeave = false
    }
    let fgValue: any = this.managerCtrl.value
    // console.log(fgValue, e);

    this.getLeaveApplications(true, fgValue, isFutureLeave)
    // let isRangeSelected = (this.pickerDirective.value.startDate && this.pickerDirective.value.endDate)

  }

  getEmployees() {
    let params = new HttpParams({
      fromObject: {
        str: '',
        type: 'hr',
        hierarchy_type: 'lower',
        search: 'all'
      }
    })
    this.http.request('get', 'users/', params).subscribe((res) => {
      if (res.status == 200) {
        this.employeesOptions = []
        this.employeesOptions.push({ emp_id: 'all', emp_name: 'ALL' })
        res.body['results'].forEach(element => {
          this.employeesOptions.push(element)
        });
        this.employeeList = [...this.employeesOptions]
        // console.log(this.employeesOptions);

      }
    })
  }

  clear() {
    this.managerCtrl.reset();
    this.managerCtrl.setValue('');
    this.getLeaveApplications(true, this.managerCtrl.value)
  }

  onSelectEmployee(employee: MatAutocompleteSelectedEvent) {

    this.employeeSelected = this.managerCtrl.value;
    let fgValue = this.managerCtrl.value;
    if (fgValue == 'ALL' || fgValue) {
      this.getLeaveApplications(true, fgValue)
    } else {
      this.LEAVE_DATA_HISTORY = []
    }
  }

  //  on clciking the export excel sheet of the resolved leave applications
  onClickExportResolved() {
    let mapping = {
      empName: 'emp_name',
      emp_id: 'emp_id',
      startDate: 'startdate',
      endDate: 'enddate'
    }
    let future_leave = 'false'
    if (this.Ischecked) {
      future_leave = 'true'
    }
    let dp = this.dateRangePicker.value
    // get the sorting
    let params = new HttpParams({
      fromObject: {
        is_manager: 'true',
        is_history: 'true',
        filter: 'history',
        is_hr: 'true',
        is_future_leave: future_leave,
        emp_name: (this.managerCtrl.value) || "",
        emp_id: String(this.employeeSelected?.emp_id) || "",
        sort_key: mapping[this.sortHistoricKey] || '',
        sort_dir: this.sortDirection || ''
      }
    })
    let url = 'export-resolved'
    // this.historyLeavesFiltersApplied =  true  
    params = params.append('start_date', this.datepipe.transform(dp.start, 'yyyy-MM-ddT00:00:00'))
    params = params.append('end_date', this.datepipe.transform(dp.end, 'yyyy-MM-ddT00:00:00'))
    params = params.append('export', true.toString());
    url = 'monthlycycleleavereport'
    if (!this.side) {
      params = params.append('month', this.monthFrom.toString());
      params = params.append('year', this.yearFrom.toString());
      params = params.append('cyclewise', true.toString());
      params = params.append('export', true.toString());
      url = 'monthlycycleleavereport'
    }
    this.http.noLoader(true).showProgress('download').request('get', 'leave/' + url + '/', params, "", {}, {
      responseType: 'blob',
      progress: 'download'
    }).subscribe(res => {
      if (res.status == 200) {
        let fileName = this.fileDownload.getFileName(res)
        this.fileDownload.download(res.body, fileName, res.headers.get('Content-Type'))
        // console.log('exported')

      } else if (res.status == 204) {
        this.ss.statusMessage.showStatusMessage(false, 'No rows available for the current filter criteria')
      }
    })
  }

  // get all leave application with pagination
  getLeaveApplications(isHistory: boolean = false, emp_name?, isFutureLeave: boolean = false) {
    let empName: any;
    if (emp_name) {
      empName = emp_name
    }
    else {
      empName = 'emp_name'
    }
    let mapping = {
      empName: empName,
      startDate: 'startdate',
      endDate: 'enddate'
    }
    let data;

    // let dp: any = this.pickerDirective.value
    let dp = this.dateRangePicker.value

    if (isHistory) {
      data = this.LEAVE_DATA_HISTORY = []
    } else {
      // data = this.LEAVE_DATA_PENDING = []
    }

    // get the sorting
    let params = new HttpParams()

    params = params.append('is_manager', 'true')

    params = params.append('filter', (!isHistory) ? 'pending' : 'history')

    if (isHistory) {
      // console.log(emp_name);

      // this.historyLeavesFiltersApplied =  true

      if (emp_name == "ALL") {
        empName = ''
      }
      else {
        empName = emp_name || ""
      }
      params = params.append('emp_name', empName)
      params = params.append('sort_key', mapping[this.sortHistoricKey] || '')
      params = params.append('sort_dir', this.sortDirection || '')
      params = params.append('is_hr', 'true')

      // params = params.append('filter', 'history')
      params = params.append('is_future_leave', isFutureLeave ? 'true' : 'false')
    }


    if (dp && dp.start && dp.end) { 
      params = params.append('start_date', this.datepipe.transform(dp.start, 'yyyy-MM-ddT00:00:00'))
      params = params.append('end_date', this.datepipe.transform(dp.end, 'yyyy-MM-ddT00:00:00'))
    }

    if (this.side) {
      this.http.request('get', 'leave/monthlycycleleavereport/', params).subscribe(res => {
        if (res.status == 200) {
          res.body["results"].forEach(element => {
            data.push(element)
          })
          this.showMessage = true
        } else if (res.status == 204) {

        } else {
          this.ss.statusMessage.showStatusMessage(false, "Something went wrong")
        }
        if (isHistory) {
          this.historyLeavesFiltersApplied = true
        }
      })
    } else {
      let param = new HttpParams();
      if (this.managerCtrl.value == "ALL" || this.managerCtrl.value == undefined || this.managerCtrl.value == "") {
      } else {
        param = param.append('emp_name', this.managerCtrl.value);
      }
      param = param.append("month", `${this.monthFrom}`);
      param = param.append("year", `${this.yearFrom}`);
      this.http.request('get', `leave/monthlycycleleavereport/`, param).subscribe(res => {
        if (res.status == 200) {
          res.body.forEach(element => {
            data.push(element)
          })
          this.showMessage = true
        } else if (res.status == 204) {

        } else {
          this.ss.statusMessage.showStatusMessage(false, "Something went wrong")
        }
        if (isHistory) {
          this.historyLeavesFiltersApplied = true
        }
      })
    }
  }

  // checkHrAccessForreports() {

  //   this.http.noLoader(true).request("get", 'reportsAccessableAdmins/').subscribe(res => {
  //     if (res.status == 200) {
  //       this.isPageAccessable = res.body;
  //     }

  //   });
  // }

  convertDatefmt(date) {
    return this.datepipe.transform(date, 'yyyy-MM-dd');
  }

  onClickSort(column: 'empName' | 'startDate' | 'endDate') {
    this.sortHistoric[column] = this.sortHistoric[column] == false ? 'desc' : this.sortHistoric[column] == 'desc' ? 'asc' : this.sortHistoric[column] == 'asc' ? false : 'desc'
    for (const key in this.sortHistoric) {
      if (Object.prototype.hasOwnProperty.call(this.sortHistoric, key)) {
        if (key != column) {
          this.sortHistoric[key] = false
        } else {
          if (this.sortHistoric[column]) {
            this.sortHistoricKey = column
            this.sortDirection = this.sortHistoric[column]
          } else {
            this.sortHistoricKey = null
            this.sortDirection = null
          }
        }
      }
    }
    this.getLeaveApplications(true)
  }

  getSide(er) {
    this.side = er;
    this.getLeaveApplications(true);
  }


  // getTrigger(er) {
  //   this.yearFrom = er.year;
  //   this.monthFrom = er.month;
  //   if (er) {
  //     if (this.yearFrom)
  //       this.getLeaveApplications(true);
  //   }
  // }


  onFutureLeaveClick(event) {

    // console.log("Ischecked is ::::", event);
    this.Ischecked = event.checked;
    this.fromdate = this.convertDatefmt('');
    this.todate = this.convertDatefmt('');
    // if (event.checked) {
    //   this.fromdate = this.convertDatefmt('');
    //   this.todate = this.convertDatefmt('');
    //   // this.dateRangePicker.setPresetValue("Last 30 Days");
    //   // this.fromdate = this.dateRangePicker.value.start;
    //   // this.todate = this.dateRangePicker.value.end;
    //   // this.fromdate = this.convertDatefmt(this.ranges['This Month'][0])
    //   // this.todate = this.convertDatefmt(this.ranges['This Month'][1])
    //   // this.selected["endDate"] = this.ranges['This Month'][1];
    // } else {
    //   this.fromdate = this.convertDatefmt('');
    //   this.todate = this.convertDatefmt('');
    // }
    this.onSubmitResolvedLeaveFilter(event)
  }
  ngAfterContentChecked(): void {
    this.cd.detectChanges();
  }
}
