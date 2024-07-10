import { DatePipe } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, NgForm, Validators } from '@angular/forms'; 
import { MatDialog, MatDialogRef } from '@angular/material/dialog'; 
// import { DaterangepickerComponent, DaterangepickerDirective } from 'ngx-daterangepicker-material';
// import { start } from 'repl';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, take, takeUntil } from 'rxjs/operators';
import { slideAnimationTrigger } from 'src/app/animations/slide.animation';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';
import { LeaveApplcnStatus, MILLISECONDS_DAY } from 'src/app/constants';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';
import { UserService } from 'src/app/services/user.service';
import { FileDownloadService } from 'src/app/directives/file-download/file-download.service';
import { PopUpComponent } from 'src/app/components/pop-up/pop-up.component';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ApplyLeaveComponent } from './apply-leave/apply-leave.component';
import { AtaiDateRangeComponent } from 'src/app/components/atai-date-range/atai-date-range.component';
@Component({
    selector: 'app-manage-self-leaves',
    templateUrl: './manage-self-leaves.component.html',
    styleUrls: ['./manage-self-leaves.component.scss'],
    animations: [slideAnimationTrigger]
})
export class ManageSelfLeavesComponent implements OnInit {

    @ViewChild(AtaiDateRangeComponent) dateRangePicker: AtaiDateRangeComponent;


    appliedLeaveColumns: string[] = ['serial', 'startdate', 'enddate', 'day_count', 'leave_type', 'status', 'view'];
    historyLeaveColumns: string[] = ['serial', 'startdate', 'enddate', 'day_count', 'leave_type', 'leavestatus', 'correctionstatus', 'view'];
    leaveRequestSingleColumns: string[] = ['serial', 'date', 'session'];
    leaveReasons: Array<any> = ['Sick', 'Casual', 'Travel', 'Other'];

    selectedCount = 0;
    LEAVE_HISTORY_DATA = [];
    LEAVE_APPLICATION_DATA = [];
    LEAVE_REQUEST_SINGLE_DATA: any = [];
    TIMESHEET_DISCREPANCY_DATA: any = []

    destroy$: Subject<any> = new Subject();

    leaveApplcnStatus = LeaveApplcnStatus

    fromdate: any;
    todate: any;
    leaveErrMsg:boolean=false;
    leaveHistoryErrMsg:boolean=false;
    currentBalance = 0;

    // the min date for the calendar when opening for date selection for a holiday row in edit mode
    maxDate = new Date()

    // the maxdate for the calendar when opening for date selection for a holiday row in edit mode
    minDate = new Date(this.maxDate.getTime() - (5 * 365 * MILLISECONDS_DAY))
    // maxDate = moment().subtract(0, 'days');

    // minDate = moment().subtract(30, 'days')

    // leaveTypes = ["Paid", "Unpaid", "Marriage", "Maternity/Paternity"];
    selectedHistoryRange: any = {};
    selectedAppliedRange: any = {};


    // template reference of the apply leave mark up
    @ViewChild('templateRefApplyLeave') templateRefApplyLeave: TemplateRef<any>;

    // mat dialog reference for the leave application
    dialogRefLeaveApplication: MatDialogRef<any>;

    // leave details template reference
    @ViewChild('templateRefLeaveDetails') templateRefLeaveDetails: TemplateRef<any>;

    // @ViewChild(DaterangepickerDirective, { static: true }) pickerDirective: DaterangepickerDirective;

    // @ViewChild(DaterangepickerComponent) pickerDirective: DaterangepickerComponent;
    applied_heading = ""
    appliedCount = 0;
    // picker: DaterangepickerComponent;

    // store the leave request detail pop up request id
    leaveDetailsRequestId: { request_id: number, get_discrepancy?: boolean };

    // boolean to track if the discrepancy form is submitted after opening
    applyDiscrepancyFormSubmitted: boolean = false

    // leave discrepancy date selection and comments form
    fgDiscrepancyForm: FormGroup

    // leave discrepancy data
    leaveDiscrepancyData: any = {}

    @ViewChild('refLeaveDiscrepancyDialog') compDiscrepancyModal: ModalPopupComponent;

    @ViewChild(ApplyLeaveComponent) applyLeaveRef: ApplyLeaveComponent;

    constructor(
        public datepipe: DatePipe, 
        private http: HttpClientService,
        private ss: SingletonService, 
        public dialog: MatDialog,
        private user: UserService,
        private fileDownload: FileDownloadService
    ) {

        this.fgDiscrepancyForm = this.ss.fb.group({
            selectedDays: ["", Validators.required],
            comments: ["", Validators.required]
        }) 
    }

    ngOnInit(): void {
        this.getLeaveHistory()
        this.getCurrentLeaveBalance();
        // this.fromdate = this.convertDatefmt(this.ranges['Last 30 Days'][0])
        // this.todate = this.convertDatefmt(this.ranges['Last 30 Days'][1])
        this.getAppliedLeaves();
        // this.selectedHistoryRange["startDate"] = this.ranges['Last 30 Days'][0];
        // this.selectedHistoryRange["endDate"] = this.ranges['Last 30 Days'][1];
        this.selectedHistoryRange["startDate"] = null;
        this.selectedHistoryRange["endDate"] = null;
    } 

    ngOnDestroy() {
        this.destroy$.next(null)
        this.destroy$.complete();
    }

    getCurrentLeaveBalance() {
        this.http.request('get', 'leave/balance/').subscribe(res => {
            if (res.status == 200) {
                this.currentBalance = res.body["results"][0]["outstanding_leave_bal"];
            }
        })
    }

    convertDatefmt(date) {
        return this.datepipe.transform(date, 'yyyy-MM-dd');
    }

    openApplyPopUp() {
        // this.applyLeavePopup.open();
        this.dialogRefLeaveApplication = this.dialog.open(PopUpComponent, {
            panelClass: 'apply-leave',
            data: {
                template: this.templateRefApplyLeave,
                hideFooterButtons: true,
                showCloseButton: true,
                heading: 'Apply Leave',
                maxWidth: '900px'
            },
            restoreFocus:true
        });

        this.dialogRefLeaveApplication.afterClosed().pipe(take(1)).subscribe(() => {
            this.applyLeaveRef.onClose()
        });
    }

    // on clicking the raise discrepancy button
    onClickRaiseDiscrepancy(e, data) {
        // 
        let dialogRef = this.dialog.open(ConfirmDialogComponent, {
            panelClass: 'confirm-popup',
            data: {
                confirmMessage: 'Are you sure you want to raise correction ?',
                showTextbox: true,
                placeholderTextField: 'Enter correction comments'
            },
            restoreFocus:true
        })

        // 
        dialogRef.afterClosed().pipe(take(1)).subscribe((result) => {
            if (result) {
                // STEP: send request to save the leave discrepancy
                let requestBody = { emp_comments: result.text }
                let params = new HttpParams({
                    fromObject: {
                        leave_request_id: data.id
                    }
                })
                this.http.request('post', 'leave/discrepancy/', params, requestBody).subscribe(res => {
                    let status = res.status
                    if (status == 200) {
                        this.leaveDiscrepancyData = res.body['results']
                        this.ss.statusMessage.showStatusMessage(true, res.body['message'])
                        this.getLeaveHistory()
                    } else {
                        this.ss.statusMessage.showStatusMessage(false, res.error['message'])
                    }
                });
            }
        })
    }

    openLeaveDetails() {
        this.dialog.open(PopUpComponent, {
            panelClass: 'leave-details',
            data: {
                hideFooterButtons: true,
                showCloseButton: true,
                heading: 'Leave Request Details',
                maxWidth: '700px',
                template: this.templateRefLeaveDetails
            },
            restoreFocus:true
        })
    }

    eventHandlerApplyLeave(data: { type: any, data: any }) {
        if (data.type == 'submitted') {
            this.getAppliedLeaves();
            this.getLeaveHistory();
            this.getCurrentLeaveBalance();
        } else if (data.type == 'cancel') {
            this.dialogRefLeaveApplication.close()
        }
    }

    // onClickCancelLeaveApplication
    onClickCancelLeaveApplication(e: MouseEvent, data) {
        let target = e.target;
        let dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                confirmMessage: "Are you sure you want to cancel leave application ?",
                Cancel:'No',
                Proceed:'Yes'
            },
            restoreFocus:true,
            panelClass: 'confirm-popup'
        })
        dialogRef.afterClosed().pipe(take(1)).subscribe((result) => {
            if (result) {
                // send the http request to cancel the leave request
                this.http.request('delete', "leave/request/" + data.id).subscribe(res => {
                    if (res.status == 200) {
                        this.getAppliedLeaves()
                        this.getCurrentLeaveBalance()
                        this.getLeaveHistory()
                        this.ss.statusMessage.showStatusMessage(true, 'Leave cancelled successfully')
                    } else if (res.status == 404) {
                        this.ss.statusMessage.showStatusMessage(false, "The leave application does not exist")
                    } else if (res.status == 412) {
                        this.ss.statusMessage.showStatusMessage(false, res.error['message'])
                    } else if (res.status == 409) {
                        this.ss.statusMessage.showStatusMessage(false, "Database error. Could not delete the leave application")
                    } else {
                        this.ss.statusMessage.showStatusMessage(false, "Something went wrong")
                    }
                })
            }
        })
    }

    getLeaveHistory(selectedRange?: any) {
        // if (selectedRange["startDate"] == null || selectedRange["endDate"] == null)
        //   return

        // console.log("-------------------", selectedRange, selectedRange["startDate"]._d, selectedRange["endDate"]._d);
        let history = [];
        this.LEAVE_HISTORY_DATA = []
        let params = new HttpParams()
        params = params.append('filter', 'history')
        if (selectedRange && selectedRange['start'] && selectedRange['end']) {
            let dp = selectedRange
            params = params.append('start_date', this.datepipe.transform(dp['start'], 'yyyy-MM-ddT00:00:00'))
            params = params.append('end_date', this.datepipe.transform(dp['end'], 'yyyy-MM-ddT00:00:00'))
        }
        this.http.request('get', 'leave/request/', params).subscribe(res => {
            this.leaveHistoryErrMsg=true;   
            if (res.status == 200) {
                // console.log("---------------------", res.body["results"]);
                res.body["results"].forEach(element => {
                    this.LEAVE_HISTORY_DATA.push(element)
                })
            } else if (res.status == 204) {

            }else if(res.status['results']===true){
                this.leaveHistoryErrMsg=false;
            }
            else {
                this.ss.statusMessage.showStatusMessage(false, "Something went wrong")
            }
        })
    }

    getAppliedLeaves() {
        this.LEAVE_APPLICATION_DATA = [];
        let params = new HttpParams()
        params = params.append('filter', 'pending')
        this.http.request('get', "leave/request/", params).subscribe(res => {
            this.leaveErrMsg=true
            // console.log("applied leaves", res);
            if (res.status == 200) {
                res.body["results"].forEach(element => {
                    // console.log("each ", element);
                    let today = new Date()
                    today.setHours(0, 0, 0, 0)
                    let startDate = new Date(element.startdate)
                    let endDate = new Date(element.enddate)
                    let isInProgress = (today >= startDate && today <= endDate)
                    element.isInProgress = isInProgress
                    // console.log(isInProgress, startDate, endDate, today);
                    this.LEAVE_APPLICATION_DATA.push(element)
                });
                this.appliedCount = this.LEAVE_APPLICATION_DATA.length;
            }else if(res.status['results']===true){
                this.leaveErrMsg=false;
            }
        })
        // this.LEAVE_APPLICATION_DATA = [...this.LEAVE_APPLICATION_TEST_DATA];
        // this.appliedCount = this.LEAVE_APPLICATION_DATA.length;
    }




    // getTimesheetDiscrepancy() {
    //     if (this.applyForm.valid) {
    //         var param = new HttpParams();
    //         let f = this.applyForm.value


    //         param.append("start_date", this.datepipe.transform(f.startDate, 'yyyy-MM-dd'));
    //         if (f.category == 'Multiple Days') {
    //             param = param.append("start_date", this.datepipe.transform(f.startDate, 'yyyy-MM-dd'));
    //             param = param.append("end_date", this.datepipe.transform(f.endDate, 'yyyy-MM-dd'));
    //             console.log(f.category)


    //             param = param.append("start_date_second_half", f.startDateSecondHalf || "");

    //             param = param.append("end_date_first_half", f.endDateFirstHalf || "");

    //         } else if (f.category == 'Single Day' || f.category == "Half Day") {
    //             // for single and half day requests set the end date same as start date
    //             param = param.append("start_date", this.datepipe.transform(f.startDate, 'yyyy-MM-dd'));
    //             param = param.append("end_date", this.datepipe.transform(f.startDate, 'yyyy-MM-dd'));
    //             if (f.category == "Half Day") {
    //                 param = param.append("start_date_second_half", 'true');

    //             }
    //         }

    //         this.http.request('get', 'get-submitted-timesheet/', param).subscribe(res => {
    //             if (res.status == 200) {

    //                 if (res.body["results"].length > 0) {
    //                     console.log("-----------ts dis----------------", res.body["results"])
    //                     this.TIMESHEET_DISCREPANCY_DATA = res.body["results"]
    //                     this.timesheetDiscrepancyPopup.open()
    //                 }
    //                 else {
    //                     this.onSubmitApplyForm()
    //                 }

    //             }
    //         })

    //     } else {
    //         console.log("-------------------------", this.applyForm);
    //         // var formControls = this.applyForm.controls
    //         (<any>Object).values(this.applyForm.controls).forEach(e => {
    //             e.markAsTouched();

    //             console.log("================================================", e);

    //         })

    //     }

    // }



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
                emp_id: String(this.user.getEmpId()) || "",
                filter: 'history',
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

}
