import { DatePipe } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { ChangeDetectorRef, Component, Input, OnInit, SimpleChange, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { LeaveDiscrepancyStatus } from 'src/app/constants';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';
import { ModalPopupComponent } from '../modal-popup/modal-popup.component';

@Component({
    selector: 'app-leave-details',
    templateUrl: './leave-details.component.html',
    styleUrls: ['./leave-details.component.scss']
})
export class LeaveDetailsComponent {

    // leave day columns
    leaveDayColumns: string[] = ['serial', 'date', 'session'];

    // the current image in zoom when the leave type is a marriage leave
    currentImageInZoom: string = ""

    // the leave detail data
    @Input() data: any = {}

    // leave detail type
    @Input() type: 'self' | 'team' = 'self'

    // request id passed as input
    @Input() requestId: { request_id: number, get_discrepancy?: boolean, get_history?: boolean };

    // no of leaves in last n days
    leavesInLastNDays = {
        days: 60,
        leaveCount: 'NA'
    }

    // the leave balance of this employee
    leaveBalance: number;

    // form control for the last n days leaves
    fcLastNDays: FormControl = new FormControl(60)

    lastNDaysValue = 60
    // : FormControl = new FormControl()

    leaveDiscrepancyStatus = LeaveDiscrepancyStatus

    // view the child modal pop up component
    @ViewChild('refModal') modal: ModalPopupComponent
    historyFlag: boolean = true;

    constructor(public datepipe: DatePipe,
        private cdRef: ChangeDetectorRef,
        private http: HttpClientService,
        private ss: SingletonService
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        // console.log('CHANGES', changes)
        this.leavesInLastNDays.leaveCount = 'NA'
        this.leaveBalance = null;
        this.lastNDaysValue = 60;

        let dataChange: SimpleChange = changes['data']
        let requestIdChange: SimpleChange = changes['requestId']
        if (dataChange && dataChange.currentValue) {
            this.processInputData(dataChange.currentValue)
        } else if (requestIdChange && requestIdChange.currentValue) {
            // this.getLeaveRequestDetails(this.requestId)
        }

    }

    ngOnInit() {
        this.getLeaveRequestDetails(this.requestId)
    }

    // to open the modal
    open() {
        this.modal.open()
    }

    onCloseModal(e) {
        setTimeout(() => {
            this.requestId = null
            this.data = {}
        }, 300)

    }

    convertDatefmt(date) {
        return this.datepipe.transform(date, 'yyyy-MM-dd');
    }

    // convert the input data into component required data structure
    processInputData(dataInput) {
        let leavePeriod
        let data = dataInput
        if (data) {
            try {
                let day_leave_type = data.leaves[0]?.day_leave_type
                let day_leave_type_end = data.leaves[data.leaves.length - 1]?.day_leave_type
                if (data.startdate == data.enddate) {
                    leavePeriod = this.datepipe.transform(data.startdate, 'yyyy-MM-dd')
                    leavePeriod += (data.day_count == 0.5 ? ' ( HALF DAY - ' : ' ( ')
                    leavePeriod += day_leave_type + (day_leave_type == 'FULL' ? ' DAY' : '') + ' )'
                } else {
                    let secondHalfFirstDay = day_leave_type == 'FULL' ? '' : '  ( HALF DAY - ' + day_leave_type + ' )';
                    let firstHalfLastDay = day_leave_type_end == 'FULL' ? '' : '  ( HALF DAY - ' + day_leave_type_end + ' )';
                    leavePeriod = this.datepipe.transform(data.startdate, 'yyyy-MM-dd') + secondHalfFirstDay + ' to ' + this.datepipe.transform(data.enddate, 'yyyy-MM-dd') + firstHalfLastDay
                }
                leavePeriod = leavePeriod.replace(/_/g, ' ')
            }
            catch (error) {
                leavePeriod = ""
            }

            data['requestDetails'] = { 'LeavePeriod': leavePeriod ,
                 'EmployeeName': data.emp_name , 
                 'AppliedOn': this.datepipe.transform(data.created, 'yyyy-MM-dd') ,
                 'LeaveType': data.leave_type_name == 'Paid' ? ' General' : data.leave_type_name ,
                 'TotalDays': data.day_count ,
                 'Status': data.discrepancy_raised && !(data.status == 6 && data.status == 7) ? 'Correction Raised' : data.req_status ,
                //   'Leave Reason': data.leave_reason ,
                 'LeaveDescription': data.emp_comments ,
                //   'Leaves in last 60 days': data.no_of_leaves_in_last_n_days },
        }
        this.leaveBalance = data.leave_balance
        this.leavesInLastNDays.leaveCount = data.no_of_leaves_in_last_n_days

        // only for paid leaves show the leave reason
        if (data.leave_type_name == 'Paid') {
            data['requestDetails']['LeaveReason']= data.leave_reason != 'null' ? data.leave_reason : 'Not Specified'
        }
        // for pending leaves do not show manager comments
        if (data.req_status == 'Rejected') {
            data['requestDetails']['ManagerComments']= data.manager_comments 
        }

        if (this.requestId.get_discrepancy && data.leave_discrepancy_details) {
            let ldd = data.leave_discrepancy_details
            data['discrepancyDetails'] = {
                  'Status':this.leaveDiscrepancyStatus[ldd.status] ,
                  'RaisedOn':this.datepipe.transform(ldd.created, 'yyyy-MM-dd') ,
                  'EmployeeComments':ldd.emp_comments ,
            }
        }
        if (this.requestId.get_history) {
            this.historyFlag = false;
        }
        else {
            this.historyFlag = true;
        }
        if (data.leaves_previous && data.leaves_previous.length > 0) {
            data.leaves_previous.forEach(leave => {
                this.processInputData(leave)
            });
        }
    } else {
    data = {}
}
    }

// get leave details of a single leave application
getLeaveRequestDetails(request_id) {
    this.fcLastNDays.setValue(this.leavesInLastNDays.days);
    if (request_id) {
        this.data = {}
        let params = new HttpParams()
        params = params.append('is_manager', (this.type == 'team') + '')
        params = params.append('leaves_in_last_n_days', this.leavesInLastNDays.days + '')
        if (this.requestId.get_discrepancy) {
            params = params.append('get_discrepancy', true + '')
        }
        this.http.request('get', 'leave/request/' + request_id.request_id + '/', params).subscribe(res => {
            if (res.status == 200) {
                this.data = res.body['results']
                this.processInputData(this.data)
                this.cdRef.detectChanges()
            } else if (res.status == 404) {
                this.ss.statusMessage.showStatusMessage(false, "Leave request not found")
            } else {
                this.ss.statusMessage.showStatusMessage(false, "Something went wrong")
            }
        })
    }
}

// get the number of leaves in the last n days
onClickGetLeavesInLastNDays() {
    // 
    this.lastNDaysValue = this.fcLastNDays.value
    let params = new HttpParams({
        fromObject: {
            emp_id: this.data.emp || this.data.emp_id,
            no_of_days: this.lastNDaysValue + ''
        }
    })
    this.http.request('get', 'leave/get-leaves-in-last-n-days/', params).subscribe((res) => {
        if (res.status == 200) {
            this.leavesInLastNDays.leaveCount = res.body['results']
        } else {
            this.leavesInLastNDays.leaveCount = "NA"
            if (res.error.results.no_of_days) {
                this.ss.statusMessage.showStatusMessage(false, res.error.results.no_of_days[0])
            }
        }
    })
}
}
