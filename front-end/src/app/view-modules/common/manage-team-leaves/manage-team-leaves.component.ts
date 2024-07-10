import { DatePipe } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { Component, ElementRef, HostListener, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { debounceTime, map, startWith, take, takeUntil } from 'rxjs/operators';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import { isDescendant } from 'src/app/functions/isDescendent.fn';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service'; 
// import { DaterangepickerComponent, DaterangepickerDirective } from 'ngx-daterangepicker-material';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';

import { LeaveApplcnStatus } from 'src/app/constants'
import { Observable, Subject } from 'rxjs';
import { MatAutocomplete, MatAutocompleteModule, MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { FileDownloadService } from 'src/app/directives/file-download/file-download.service';
import { AtaiDateRangeComponent } from 'src/app/components/atai-date-range/atai-date-range.component';
import { MILLISECONDS_DAY } from 'src/app/constants/dashboard-routes';
import { PopUpComponent } from 'src/app/components/pop-up/pop-up.component';

@Component({
    selector: 'app-manage-team-leaves',
    templateUrl: './manage-team-leaves.component.html',
    styleUrls: ['./manage-team-leaves.component.scss']
})
export class ManageTeamLeavesComponent implements OnInit {

    @ViewChild(AtaiDateRangeComponent) dateRangePicker: AtaiDateRangeComponent;

    // the leave application status in the db column
    leaveApplicationStatuses: Array<any> = ['Approved', 'Rejected', 'Cancelled']

    destroy$: Subject<any> = new Subject();

    // 
    leaveRequestSingleColumns: string[] = ['serial', 'date', 'session'];

    leaveApplcnStatus = LeaveApplcnStatus

    // form group for filter
    fgFilter: FormGroup;
    // Rahul change(fixing the error msg on load for leave req,timesheet correction,leave correction)*********
    leaveReqErrMsg=false
    leavecorrErrMsg=false;
    timesheetErrMsg=false;
    //********************************************************************************************************* 
    // manager comments form control in the leave details pop up
    fcManagerComments: FormControl = new FormControl("", Validators.required)

    // pending leave application data
    LEAVE_DATA_PENDING = [];

    // history leave application data
    LEAVE_DATA_HISTORY = [];

    // history leave application data
    LEAVE_DATA_DISCREPANCY = [];

    // leave application table columns
    leaveApplicationColumns: string[] = ['serial', 'staff_no', 'employee', 'startdate', 'enddate', 'day_count', 'leave_type', 'status', 'view'];

    // leave request single data
    LEAVE_REQUEST_SINGLE_DATA: any = [];

    // store the leave request detail pop up request id
    leaveDetailsRequestId: { request_id: number, get_discrepancy?: boolean, get_history?: boolean };

    TIMESHEET_DISCREPANCY = [];

    // sorting in the historical leaves
    sortHistoric: any = {
        empName: false,
        startDate: false,
        endDate: false
    }

    // the sorting criteria for the historic leave applcn list
    sortHistoricKey: 'startDate' | 'endDate' | 'empName' | null = 'startDate'

    sortDirection: 'asc' | 'desc' | null = 'desc'

    fromdate: any;
    todate: any;
    maxDate = new Date();

    selectedHistoryRange: any = {};
    selectedAppliedRange: any = {};
    // picker: DaterangepickerComponent;
    // @ViewChild(DaterangepickerDirective, { static: true }) pickerDirective: DaterangepickerDirective;

    @ViewChild('showAppliedLeaveDialog') templateLeaveDetails: TemplateRef<any>;

    @ViewChild('refTableWrap') elTableWrap: ElementRef;

    @ViewChild('timesheetDiscrepancyDialog') templateTimesheetDiscrepancy: TemplateRef<any>;

    // dialog reference time sheet discrepancy 
    dialogRefTimesheetDiscrepancy: MatDialogRef<any>;

    // dialog reference time sheet discrepancy 
    dialogRefLeaveDetails: MatDialogRef<any>;

    // employees options
    employeesOptions: Array<any> = []

    employeeSelected: { emp_id: number, emp_name: string } = null

    historyLeavesFiltersApplied: boolean = false

    employeeName = new FormControl();

    value; any;
    filteredValues: any;

    // form group for search form
    fgSearch: FormGroup;

    //filter for Dashboard
    filterArray = [];

    managerCtrl = new FormControl();

    filteredManagers: Observable<any>;
    employeeList: any[] = [];
    showMessage = false
    constructor(
        public datepipe: DatePipe,
        private ss: SingletonService,
        private http: HttpClientService,
        private dialog: MatDialog,
        private el: ElementRef,
        private fileDownload: FileDownloadService
    ) {
        this.fgFilter = this.ss.fb.group({
            all: [''],
            employeeName: ['']
        })
setTimeout(()=>{
        this.filteredManagers = this.managerCtrl.valueChanges
            .pipe(
                startWith(''),
                map(state => state ? this.filterManagerList(state) : this.employeesOptions.slice())
            );
        },200)
    }

    filterManagerList(value: string) {
        const filterValue = value.toLowerCase();
        return this.employeesOptions.filter(option => option.emp_name.toLowerCase().includes(filterValue))

        // return this.filterArray.filter(state => state.emp_name.toLowerCase().indexOf(filterValue) === 0);
    }

    clear() {
        // console.log('::::::::::',this.employeesOptions)
        this.managerCtrl.reset();
        this.managerCtrl.setValue('');
    }

    ngOnInit(): void {

        this.getEmployees();
        // this.fgFilter.get('all').valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
        //     let fcEmpName = this.fgFilter.get('employeeName');
        //     this.employeeSelected = null
        //     fcEmpName.reset()
        //     val ? fcEmpName.disable() : fcEmpName.enable()
        // })
        // this.employeeName.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {

        //         // this.getEmployees(val)
        //         this.employeesOptions = this.filterValues(val);
        // })
        // this.getEmployees();
    }

    filterValues(search: string) {
        return this.employeesOptions.filter(value =>
            value.emp_name.toLowerCase().indexOf(search.toLowerCase()) === 0);
    }

    onDateSelect(date) {
        this.selectedHistoryRange["startDate"] = date.start;
        this.selectedHistoryRange["endDate"] = date.last;
        this.fromdate = date.start
        this.todate = date.start
        let fgValue: any = this.managerCtrl.value
        // console.log(fgValue);
        if (fgValue == 'ALL' || fgValue) {
            this.getLeaveApplications(true, fgValue)
            this.showMessage = true

        } else {
            this.LEAVE_DATA_HISTORY = []
        }
    }


    ngAfterViewInit() {
        setTimeout(() => {
            // this.pickerDirective.clear()
            this.setPickerToLast30Days()
            this.getLeaveApplications()
            this.getLeaveDiscrepancies()
            this.getTimesheetDiscrepancies()
        }, 100)
       
    }

    ngOnDestroy() {
        this.destroy$.next(null)
        this.destroy$.complete()
    }

    setPickerToLast30Days() {
        this.dateRangePicker.setPresetValue('Last 30 Days');
        // this.pickerDirective.writeValue(this.selectedHistoryRange)
    }

    // display function for auto complete to filter options
    displayFn(item) {
        return item && item.emp_name ? item.emp_name : '';
    }

    // on selecting an employee in auto complete
    onSelectEmployee(employee: MatAutocompleteSelectedEvent) {
        this.employeeSelected = this.managerCtrl.value;
    }

    // on submitting the resolved leaves filter form
    onSubmitResolvedLeaveFilter(e) {
        let fgValue: any = this.managerCtrl.value
        // console.log(fgValue, e);

        // let isRangeSelected = (this.pickerDirective.value.startDate && this.pickerDirective.value.endDate)
        if (fgValue == 'ALL' || fgValue) {
            this.getLeaveApplications(true, fgValue)
            this.showMessage = true

        } else {
            this.LEAVE_DATA_HISTORY = []
        }

    }

    // get employees based on the string entered in auto complete
    getEmployees() {
        let params = new HttpParams({
            fromObject: {
                str: '',
                type: 'hierarchy',
                hierarchy_type: 'lower'
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

    // on clicking the sort arrows in the historic data tables
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
        let fgValue: any = this.managerCtrl.value
        if (fgValue == 'ALL' || fgValue) {
            this.getLeaveApplications(true, fgValue)
        }
    }

    convertDatefmt(date) {
        return this.datepipe.transform(date, 'yyyy-MM-dd');
    }

    openLeaveDetailsDialog() {
        this.dialogRefLeaveDetails = this.dialog.open(PopUpComponent, {
            data: {
                template: this.templateLeaveDetails,
                hideFooterButtons: true,
                showCloseButtons: true,
                heading: 'Leave Request Details',
                maxWidth: '800px',
               
            },
           
            restoreFocus:true
        })
    }

    // click event handler on the whole table. event delegation.
    @HostListener('click', ['$event'])
    onClickHost(e: MouseEvent) {
        let target = e.target
        let tempTarget: any = target;
        while (isDescendant(this.el.nativeElement, tempTarget)) {
            let classList = tempTarget.classList
            if (classList.contains('approve-request') || classList.contains('reject-request')) {
                let requestId = Number(tempTarget.getAttribute('data-request-id'));
                let approveReject = classList.contains('approve-request') ? 'approve' : 'reject'
                let isDiscrepancy = classList.contains('discrepancy')
                let dialogRef = this.dialog.open(ConfirmDialogComponent, {
                    panelClass: 'confirm-popup',
                    data: {
                        confirmMessage: 'Are you sure you want to ' + approveReject.toUpperCase() + ' this leave ' + (isDiscrepancy ? 'correction ' : '') + 'request ?',
                        showTextbox: approveReject != 'approve'
                    },
                    restoreFocus:true
                })
                // resolve the leave application
                dialogRef.afterClosed().pipe(take(1)).subscribe((result) => {
                    if (result) {
                        console.log(tempTarget.getAttribute('data-request-id'))
                        if (approveReject == 'approve') {
                            this.onClickResolveLeaveApplcn(this.leaveApplcnStatus.Approved, requestId, "", isDiscrepancy)
                        } else {
                            this.onClickResolveLeaveApplcn(this.leaveApplcnStatus.Rejected, requestId, result.text, isDiscrepancy)
                        }
                    }
                })
            } else if (classList.contains('view-leave-details')) {
                let id = tempTarget.getAttribute("data-id")
                this.leaveDetailsRequestId = { request_id: Number(id) }
                this.openLeaveDetailsDialog()
            } else if (classList.contains('view-leave-details-history')) {
                let id = tempTarget.getAttribute("data-id")
                this.leaveDetailsRequestId = { request_id: Number(id), get_history: true }
                this.openLeaveDetailsDialog()
            } else if (classList.contains('view-leave-discrepancy-details')) {
                let id = tempTarget.getAttribute("data-id")
                this.leaveDetailsRequestId = { request_id: Number(id), get_discrepancy: true, get_history: true }
                this.openLeaveDetailsDialog()
            }
            tempTarget = tempTarget.parentNode
        }
    }

    // get all leave application with pagination
    getLeaveApplications(isHistory: boolean = false, emp_name?) {
        let empName: any;
        if (emp_name) {
            empName = emp_name
        }
        else {
            empName = 'emp_name'
        }
        let mapping = {
            empName: 'emp_name',
            startDate: 'startdate',
            endDate: 'enddate'
        }
        let data;
        // let dp: any = this.pickerDirective.value
        let dp = this.dateRangePicker.value
        if (isHistory) {
            data = this.LEAVE_DATA_HISTORY = []
        } else {
            data = this.LEAVE_DATA_PENDING = []
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
        }
        if (dp && dp.start && dp.end) { 
            params = params.append('start_date', this.datepipe.transform(dp.start, 'yyyy-MM-ddT00:00:00'))
            params = params.append('end_date', this.datepipe.transform(dp.end, 'yyyy-MM-ddT00:00:00'))
        }
        this.http.request('get', 'leave/request/', params).subscribe(res => {
            this.leaveReqErrMsg=true;
            if (res.status == 200) {
                console.log("---------------------", isHistory ? 'HISTORY' : 'PENDING', res.body["results"]);
                res.body["results"].forEach(element => {
                    data.push(element)
                })
            } else if (res.status == 204) {

            } else {
                this.ss.statusMessage.showStatusMessage(false, "Something went wrong")
            }
            if (isHistory) {
                this.historyLeavesFiltersApplied = true
            }
        })
    }

    // get leave discrepancies
    getLeaveDiscrepancies() {
        this.http.request('get', 'leave/discrepancy/').subscribe((res) => {
            this.leavecorrErrMsg=true;
            if (res.status == 200) {
                // console.log(res.body)
                this.LEAVE_DATA_DISCREPANCY = res.body['results']
            } else if (res.status == 204) {
                this.LEAVE_DATA_DISCREPANCY = []
            } else {
                this.LEAVE_DATA_DISCREPANCY = []
                this.ss.statusMessage.showStatusMessage(false, 'Something went wrong')
            }
        })
    }

    // on clicking the approve / reject button to resolve a leave application
    onClickResolveLeaveApplcn(status: number, request_id: any, manager_comments: string, is_discrepancy?: boolean) {
        let requestBody = {
            id: request_id,
            resolution: status,
            manager_comments: manager_comments,
            is_discrepancy: !!is_discrepancy + ''
        }
        // console.log(requestBody)
        this.http.request('post', 'leave/resolve/', "", requestBody).subscribe((res) => {
            if (res.status == 200) {
                // console.log(res)
                this.ss.statusMessage.showStatusMessage(true, "Leave resolved successfully")
                if (!is_discrepancy) {
                    this.getLeaveApplications()
                } else {
                    this.getLeaveDiscrepancies();
                }
                // this.getLeaveApplications(true)
            } else {
                if (res.status == 412) {
                    this.ss.statusMessage.showStatusMessage(false, res.error['message'])
                    this.getLeaveApplications()
                } else {
                    this.ss.statusMessage.showStatusMessage(false, "Something went wrong")
                }
            }
        })
    }

    //  on clciking the export excel sheet of the resolved leave applications
    onClickExportResolved() {
        let mapping = {
            empName: 'emp_name',
            emp_id: 'emp_id',
            startDate: 'startdate',
            endDate: 'enddate'
        }
        // let dp: any = this.pickerDirective.value
        let dp = this.dateRangePicker.value
        // get the sorting
        let params = new HttpParams({
            fromObject: {
                is_manager: 'true',
                is_history: 'true',
                filter: 'history',
                emp_name: (this.managerCtrl.value) || "",
                emp_id: String(this.employeeSelected?.emp_id) || "",
                sort_key: mapping[this.sortHistoricKey] || '',
                sort_dir: this.sortDirection || ''
            }
        })

        // this.historyLeavesFiltersApplied =  true 
        if (dp && dp.start && dp.end) { 
            params = params.append('start_date', this.datepipe.transform(dp.start, 'yyyy-MM-ddT00:00:00'))
            params = params.append('end_date', this.datepipe.transform(dp.end, 'yyyy-MM-ddT00:00:00'))
        }
        this.http.noLoader(true).showProgress('download').request('get', 'leave/export-resolved/', params, "", {}, {
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
    // get timeheet discrepancies
    getTimesheetDiscrepancies() {
        this.http.request('get', 'timesheet-discrepancy/').subscribe((res) => {
            this.timesheetErrMsg=true
            if (res.status == 200) {
                // console.log(res.body)
                this.TIMESHEET_DISCREPANCY = res.body['results']
            } else if (res.status == 204) {
                this.TIMESHEET_DISCREPANCY = []
            } else {
                this.TIMESHEET_DISCREPANCY = []
                this.ss.statusMessage.showStatusMessage(false, 'Something went wrong')
            }
        })
    }

    LEAVE_REQ_TIMESHEET_DISCREPANCY = []
    timesheetDiscrepancyColumns: string[] = ['date', 'project', 'posted_hours', 'modified_hours']
    timesheetDiscrepancyId = ""
    getResTimesheetDiscrepancies(id) {
        // console.log('-------------->>>>>>>>>',id);
        // console.log('@@@@@@@@@@@@@@@',this.LEAVE_DATA_HISTORY);
        this.timesheetDiscrepancyId = id
        this.http.request('get', 'timesheet-discrepancy/' + id + "/").subscribe((res) => {
            if (res.status == 200) {
                // console.log(res.body)
                this.LEAVE_REQ_TIMESHEET_DISCREPANCY = res.body['results']
                // this.timesheetDiscrepancyPopup.open()
                this.dialogRefTimesheetDiscrepancy = this.dialog.open(PopUpComponent, {
                    data: {
                        template: this.templateTimesheetDiscrepancy,
                        hideFooterButtons: true,
                        showCloseButton: true,
                        maxWidth: '700px',
                        heading:'Timesheet Correction'
                    },
                    restoreFocus:true
                })
            } else if (res.status == 204) {
                this.LEAVE_REQ_TIMESHEET_DISCREPANCY = []
            } else {
                this.LEAVE_REQ_TIMESHEET_DISCREPANCY = []
                this.ss.statusMessage.showStatusMessage(false, 'Something went wrong')
            }
        })
    }

    approveTimesheetDiscrepancies(id) {
        this.http.request('put', 'timesheet-discrepancy/' + id + "/").subscribe((res) => {
            if (res.status == 201) {
                // console.log(res.body)
                this.ss.statusMessage.showStatusMessage(true, "Successfully approved timesheet discrepancy")
                this.timesheetDiscrepancyId = ""
                // this.timesheetDiscrepancyPopup.close()
                this.dialogRefTimesheetDiscrepancy.close()
                this.LEAVE_REQ_TIMESHEET_DISCREPANCY = []
                this.getTimesheetDiscrepancies()
            } else {

                this.ss.statusMessage.showStatusMessage(false, 'Something went wrong')
            }
        })
    }
   
}
