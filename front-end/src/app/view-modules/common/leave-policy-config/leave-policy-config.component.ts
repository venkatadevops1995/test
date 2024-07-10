import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, Validators } from '@angular/forms';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';
import { isDescendant } from 'src/app/functions/isDescendent.fn';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';
import { cloneDeep, differenceBy, flatten, groupBy, toArray } from 'lodash';
import * as _ from 'lodash'
import { AtaiBreakPoints } from 'src/app/constants/atai-breakpoints';
import { fromEvent, Subject, takeUntil } from 'rxjs';

interface LeaveCredit {
    category_id?: number;
    leave_type_credits: Array<{ id: number, value: number | 'NA', type: string, status?: 0 | 1 }>
    edit?: boolean
}
interface LeaveCreditFromHttp {
    category: { id: number, name: string, status?: number };
    id: number;
    leave_credit: number;
    leave_type: { id: number, name: any, status: number };
    status: number;
}
@Component({
    selector: 'app-leave-policy-config',
    templateUrl: './leave-policy-config.component.html',
    styleUrls: ['./leave-policy-config.component.scss']
})
export class LeavePolicyConfigComponent implements OnInit {

    // subject to emit for clearing the subscriptions
    destroy$: Subject<any> = new Subject();

    // the array to hold the employee types
    employeeTypes: Array<any> = [];

    // length of active employee types 
    employeeTypesAll;

    // the array to hold the leave types and other configurations
    leaveTypes: Array<any> = []

    // data related to leave credits emptype and leave type
    // leave credits for different emp types and leave type 
    leaveCredits: { response?: Array<LeaveCreditFromHttp>, data?: Array<LeaveCredit>, inEdit?: Array<LeaveCredit>, inEditCopy?: Array<LeaveCredit>, endPointSave: string } = { data: [], inEdit: [], inEditCopy: [], endPointSave: 'leave-config' }

    // leave credits for different emp types for first month of a new hire
    leaveCreditsNewHire: { response?: any, data?: Array<LeaveCredit>, inEdit?: Array<LeaveCredit>, inEditCopy?: Array<LeaveCredit>, endPointSave: string } = { data: [], inEdit: [], inEditCopy: [], endPointSave: 'new-hire-leave-config' }

    // new hire time periods
    newHireTimePeriods: Array<any> = []

    // element ref for the grid for the emp type based leave credit leave policy config
    @ViewChild('refPolicyLeaveCredit') elEmpTypeLeaveCreditConfig: ElementRef;

    // element ref for the grid for the emp type based leave credit leave policy config
    @ViewChild('refPolicyLeaveCreditNewHire') elNewHireLeaveCreditConfig: ElementRef;

    // element ref for the grid for the emp type based leave credit leave policy config
    @ViewChild('refLeaveCreditContainer') elLeaveCreditContainer: ElementRef;

    // element ref for the grid for the emp type based leave credit leave policy config
    @ViewChild('refNewHireContainer') elNewHireContainer: ElementRef;

    // 
    translateLeaveCredit: { value: number } = { value: 0 };

    translateNewHire: { value: number } = { value: 0 };


    // is less than the XLG (1350)
    get is_LG_LT() {
        return this.ss.responsiveState[AtaiBreakPoints.LG_LT]
    };

    get leaveCreditContainer() {
        return this.elLeaveCreditContainer.nativeElement || null
    }
    get newHireContainer() {
        return this.elNewHireContainer.nativeElement || null
    }

    constructor(
        private http: HttpClientService,
        private ss: SingletonService,
    ) {
    }

    ngOnInit() {
        this.getEmployeeTypes();
        setTimeout(() => {
            this.getLeaveConfig();
            this.getLeaveConfig('leave-credit-new-hire')
        }, 1000)

        this.ss.responsive.observe([AtaiBreakPoints.LG_LT]).pipe(takeUntil(this.destroy$)).subscribe(val => {
            if (val.matches) {
                this.addHorizontalScrollAffix();
            }
        })
    }

    ngAfterViewInit() {
        this.addHorizontalScrollAffix();
    }

    ngOnDestroy() {
        this.destroy$.next(null);
        this.destroy$.complete()
    }

    
    @HostListener('keydown', ['$event'])
    onKeyDown(e: KeyboardEvent) { 
        if (e.key == '-' || e.key == 'e') {
            return false
        }
        if((<any>e.target).classList.contains('special-leaves') && e.key == '.'){
            return false;
        } 
    }

    // on horizontal scroll affix the employee type
    addHorizontalScrollAffix() {
        if (this.elLeaveCreditContainer) {
            fromEvent(this.elLeaveCreditContainer.nativeElement, 'scroll').pipe(takeUntil(this.destroy$)).subscribe((e) => {
                if (window.innerWidth > 1024) {
                    this.translateLeaveCredit.value = 0
                } else {
                    let target: HTMLElement = e['target'];
                    this.translateLeaveCredit.value = target.scrollLeft
                }
            })
            fromEvent(this.elNewHireContainer.nativeElement, 'scroll').pipe(takeUntil(this.destroy$)).subscribe((e) => {
                if (window.innerWidth > 1024) {
                    this.translateLeaveCredit.value = 0
                } else {
                    let target: HTMLElement = e['target'];
                    this.translateNewHire.value = target.scrollLeft
                }
            })
        }
    }
    // method to get the leave types
    getLeaveTypes() {
        this.http.request('get', 'leave/types/').subscribe(res => {
            if (res.status == 200) {
                this.leaveTypes = res.body["results"];
                // for each employee type and leave type there has to be a leave credit associated with it 
            } else {
                this.leaveTypes = []
            }
        })
    }

    // method to get the employee types
    getEmployeeTypes() {
        this.http.request('get', 'employee-type/').subscribe(res => {
            if (res.status == 200) {
                this.employeeTypesAll = res.body["results"];
                this.employeeTypes = this.employeeTypesAll.filter(item => {
                    return item.status != 0
                })
                this.getLeaveTypes();
                this.getNewHireMonthTimePeriods();
            } else {
                this.employeeTypes = []
            }
        })
    }

    // get the time periods for first month for a new hire to set the round off leave credits
    getNewHireMonthTimePeriods() {
        this.http.request('get', 'leave/config/new-hire-month-time-periods/').subscribe(res => {
            if (res.status == 200) {
                this.newHireTimePeriods = res.body["results"];
                // console.log(this.newHireTimePeriods)
            } else {
                this.newHireTimePeriods = []
            }
        })
    }

    // get the leave config from DB based on emp type and leave type or new hire
    getLeaveConfig(grid: 'leave-credit-default' | 'leave-credit-new-hire' = 'leave-credit-default') {
        let endPoint = grid == 'leave-credit-default' ? 'leave/config/leave-config/' : 'leave/config/new-hire-leave-config/';
        let leaveCredit = grid == 'leave-credit-default' ? this.leaveCredits : this.leaveCreditsNewHire;
        let leaveCreditKey = grid == 'leave-credit-default' ? 'max_leaves' : 'round_off_leave_credit'
        leaveCredit.response = [];
        leaveCredit.data = [];
        leaveCredit.inEdit = [];
        leaveCredit.inEditCopy = [];

        this.http.request('get', endPoint).subscribe(res => {
            if (res.status == 200) {
                let temp = res.body["results"];
                // console.log(temp);

                leaveCredit.response = temp;
                let x = toArray(groupBy(temp, (item) => item.category.id));
                leaveCredit.data = x.map(item => {
                    let obj: any = {};
                    obj.category_id = item[0].category.id;
                    obj.leave_type_credits = item.map(itemInner => {
                        let objInner: any = {}
                        objInner['type'] = (grid == 'leave-credit-default') ? itemInner.leave_type.name.toLowerCase() : objInner['type'] = itemInner.time_period.start_date + "-" + itemInner.time_period.end_date;
                        objInner['value'] = itemInner[leaveCreditKey] || 0;
                        objInner['id'] = itemInner['id'];
                        objInner['status'] = itemInner['status'];
                        return objInner;
                    });
                    return obj;
                })
            } else if (res.status == 204) {
                // trigger an end point to load the mapping db table with necessary leave type and emp type and leave credits as zero
            }
        })
    }

    // on clicking the grid . edit, save etc 
    onClickLeaveCreditGrid(e: Event, grid = 'leave-credit-default') {
        let target = e.target
        let tempTarget: any = target;

        let leaveCredits: any = (grid == 'leave-credit-default') ? this.leaveCredits.data : this.leaveCreditsNewHire.data;
        let leaveCreditsInEdit: any = (grid == 'leave-credit-default') ? this.leaveCredits.inEdit : this.leaveCreditsNewHire.inEdit;
        let leaveCreditsInEditCopy: any = (grid == 'leave-credit-default') ? this.leaveCredits.inEditCopy : this.leaveCreditsNewHire.inEditCopy;
        let elWrapper = (grid == 'leave-credit-default') ? this.elEmpTypeLeaveCreditConfig.nativeElement : this.elNewHireLeaveCreditConfig.nativeElement;

        while (isDescendant(elWrapper, tempTarget)) {
            let classList = tempTarget.classList;
            if (classList.contains('policy-grid-edit-icon')) {
                // edit button is clicked
                // get the order data attribute
                let orderEmpType = tempTarget.getAttribute('data-index');
                let leaveConfigObj = leaveCredits[orderEmpType];
                leaveConfigObj.edit = true;
                leaveCreditsInEdit.push(leaveConfigObj);
                leaveCreditsInEditCopy.push(cloneDeep(leaveConfigObj))
            } else if (classList.contains('policy-grid-save-button')) {
                let orderEmpType = tempTarget.getAttribute('data-index');
                let leaveConfigObj = leaveCredits[orderEmpType];
                // check if any of the fields is empty or invalid and show error message if any
                let hasErrors = false
                let leaveTypeCredits = leaveConfigObj.leave_type_credits;
                leaveTypeCredits.forEach((item) => {
                    if(!item.value && item.value != 0){
                        hasErrors = true;
                    }
                });
                if(hasErrors){
                    this.ss.statusMessage.showStatusMessage(false,"The leave credit fields cannot be empty");
                }else{
                    this.saveLeaveConfig(leaveConfigObj, grid);
                }
            } else if (classList.contains('policy-grid-close-icon')) {
                let orderEmpType = tempTarget.getAttribute('data-index');
                let leaveConfigObj = leaveCredits[orderEmpType];
                this.resetEmpTypeRows('cancel-single', grid, leaveConfigObj.category_id)
            } else if (classList.contains('policy-grid-save-all')) {
                this.saveLeaveConfig(leaveCreditsInEdit, grid);
            }
            tempTarget = tempTarget.parentNode;
        }
    }

    // save the default leave credits policy based on the leave credits in edit
    saveLeaveConfig(leaveConfig: LeaveCredit | Array<LeaveCredit> | 'all', grid) {
        let saveAll = true;
        if (!(leaveConfig instanceof Array)) {
            saveAll = false;
            leaveConfig = [(<LeaveCredit>leaveConfig)];
        }
        let leaveCredits, leaveCreditsToUpdate, leaveCreditsAfterEdit, leaveCreditsBeforeEdit, empTypeIds;

        leaveCredits = (grid == 'leave-credit-default') ? this.leaveCredits : this.leaveCreditsNewHire;

        // get the leave credit array with the current employee type id
        empTypeIds = (<Array<LeaveCredit>>leaveConfig).map(item => item.category_id);

        leaveCreditsAfterEdit = [];
        (<Array<LeaveCredit>>leaveConfig).forEach(item => {
            if (empTypeIds.indexOf(item.category_id) != -1) {
                leaveCreditsAfterEdit.push(item.leave_type_credits);
            }
        })
        leaveCreditsAfterEdit = flatten(leaveCreditsAfterEdit)
        leaveCreditsBeforeEdit = [];
        (<Array<LeaveCredit>>leaveCredits.inEditCopy).forEach(item => {
            if (empTypeIds.indexOf(item.category_id) != -1) {
                leaveCreditsBeforeEdit.push(item.leave_type_credits);
            }
        })
        leaveCreditsBeforeEdit = flatten(leaveCreditsBeforeEdit)

        // take diff only to update the changed columns
        leaveCreditsToUpdate = leaveCreditsAfterEdit.filter((item, index) => {
            return (item.value != leaveCreditsBeforeEdit[index].value)
        })

        leaveCreditsToUpdate = leaveCreditsToUpdate.map((item: any) => {
            let itemClone = cloneDeep(item);
            let leaveCreditKey = grid == 'leave-credit-default' ? 'max_leaves' : 'round_off_leave_credit';
            // update the new leave credit value
            itemClone[leaveCreditKey] = itemClone.value
            delete itemClone.value;
            delete itemClone.type;
            return itemClone
        })

        if (leaveCreditsToUpdate.length > 0) {
            let endPoint = grid == "leave-credit-default" ? 'leave/config/leave-config/' : 'leave/config/new-hire-leave-config/'
            this.http.request('patch', endPoint, "", leaveCreditsToUpdate).subscribe((res) => {
                // console.log(res)
                if (res.status == 200) {
                    // remove the leave credits from the leavecredits in edit and edit copy and show the success message
                    this.ss.statusMessage.showStatusMessage(true, 'Leave config saved successfully')
                    this.resetEmpTypeRows(saveAll ? 'save-all' : 'save-single', grid, ((<Array<LeaveCredit>>leaveConfig)[0]).category_id)
                    this.getLeaveConfig(grid)
                } else {
                    // retain the leavecredits in edit and edit copy and show the error message
                    if (res.status == 422 || res.status == 400) {
                        if(res['error'][0]['max_leaves']){
                            let message = res['error'][0]['max_leaves'][0]
                            this.ss.statusMessage.showStatusMessage(false, message)
                        }else{
                            this.ss.statusMessage.showStatusMessage(false, 'Something wrong with the data sent')
                        }                       
                    } else if (res.status == 404) {
                        this.ss.statusMessage.showStatusMessage(false, 'Some of the leave credits are not found.')
                    }
                    else {
                        this.ss.statusMessage.showStatusMessage(false, 'Something went wrong')
                    }
                }
            })
        } else {
            this.ss.statusMessage.showStatusMessage(false, 'No changes to update')
        }
    }

    // on clicking the save all button of leave credits based on employee type
    resetEmpTypeRows(action: 'save-all' | 'save-single' | 'cancel-all' | 'cancel-single' = 'save-all', grid = 'leave-credit-default', empTypeId?: number, singleId?: number) {

        // reset an array of emp type rows to values before editing
        let resetEditProperties = (grid = 'leave-credit-default') => {
            if ((grid == 'leave-credit-default')) {
                this.leaveCredits.inEdit = []
                this.leaveCredits.inEditCopy = [];
            } else {
                this.leaveCreditsNewHire.inEdit = []
                this.leaveCreditsNewHire.inEditCopy = [];
            }
        }

        let leaveCreditsInEdit = (grid == 'leave-credit-default') ? this.leaveCredits.inEdit : this.leaveCreditsNewHire.inEdit;
        let leaveCreditsInEditCopy = (grid == 'leave-credit-default') ? this.leaveCredits.inEditCopy : this.leaveCreditsNewHire.inEditCopy;
        if (action == 'cancel-all') {
            leaveCreditsInEdit.forEach((item) => {
                item.edit = false;
                let originalValueCopy = leaveCreditsInEditCopy.filter((itemCopy) => item.category_id == itemCopy.category_id)[0];
                item.leave_type_credits = cloneDeep(originalValueCopy.leave_type_credits);
            })
            resetEditProperties(grid);
        } else if (action == 'save-all') {
            // as the values are already saved in backend we will refetch
            leaveCreditsInEdit.forEach((item) => { item.edit = false })
            resetEditProperties(grid);
        } else if (action == 'cancel-single' || action == 'save-single') {
            let indexToRemove;
            let originalValueCopy;
            leaveCreditsInEdit.forEach((item, index) => {
                if (item.category_id == empTypeId) {
                    indexToRemove = index;
                    item.edit = false;
                    // reset values to prev if cancel
                    if (action == 'cancel-single') {
                        originalValueCopy = leaveCreditsInEditCopy.filter((itemCopy) => item.category_id == itemCopy.category_id)[0];
                        item.leave_type_credits = cloneDeep(originalValueCopy.leave_type_credits);
                    }
                }
            })
            if (originalValueCopy) {
                let removeIndexCopy = leaveCreditsInEditCopy.indexOf(originalValueCopy);
                leaveCreditsInEditCopy.splice(removeIndexCopy, 1)
            }
            leaveCreditsInEdit.splice(indexToRemove, 1)
        }
    }
}



// handle the bakcend rquest when out of entry id is sent for update of leave credits
// handle the backend when the id is not sent in the request for atlest one leave credit object
// handle the serializer when extra data is fed in request
// dicuss with team when the new employee type or leave type of time period is entered we should update the database tables of category_leave_type and timeperiod_category for adding corresponding entries pertaining to the leave type or time period 