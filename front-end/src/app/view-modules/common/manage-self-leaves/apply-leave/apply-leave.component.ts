import { DatePipe } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { MatDatepicker } from '@angular/material/datepicker';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatRadioChange } from '@angular/material/radio';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { distinctUntilChanged, first, Subject, take, takeUntil } from 'rxjs';
import { slideAnimationTrigger } from 'src/app/animations/slide.animation';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';
import { PopUpComponent } from 'src/app/components/pop-up/pop-up.component';
import { AtaiBreakPoints } from 'src/app/constants/atai-breakpoints';
import { MILLISECONDS_DAY } from 'src/app/constants/dashboard-routes';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-apply-leave',
  templateUrl: './apply-leave.component.html',
  styleUrls: ['./apply-leave.component.scss'],
  animations: [slideAnimationTrigger]
})
export class ApplyLeaveComponent implements OnInit {

  // selection type in apply leaves tab (index)
  selectedIndexLeaveCategory: number = 1

  leaveReasons: Array<any> = ['Sick', 'Casual', 'Travel', 'Other'];

  leaveCategories = ["Half Day", "Single Day", "Multiple Days"];

  timesheetDiscrepancyColumns: string[] = ['date', 'project', 'posted_hours', 'modified_hours']

  leaveTypes = []

  applyForm: FormGroup;

  selectedCount = 0;

  applyFormSubmitted: boolean = false;

  destroy$: Subject<any> = new Subject();

  today = new Date()

  holidayList: any = [];

  // boolean to disable / enable the first 2 categories of category form control
  disableFirst2Categories: boolean = false

  // user gender from the jwt token
  gender: string;

  selectedEndDate: any;

  currentBalance = 0;

  leaveHours = ["FIRST", "SECOND"];

  TIMESHEET_DISCREPANCY_DATA: any = []

  @Output('event') eventEmitter: EventEmitter<any> = new EventEmitter();

  // template reference for the discrepancy data pop up
  @ViewChild('templateRefDiscrepancyData') templateRefDiscrepancyData: TemplateRef<any>

  dialogRefDiscrepancyData: MatDialogRef<any>;

  get startDateDatePicker() {
    let today = new Date();
    let defaultStartDate = new Date(this.today.getTime() - 60 * MILLISECONDS_DAY)
    let firstDayOfYear = new Date(today.getFullYear(), 0, 1)
    return (defaultStartDate.getTime() >= firstDayOfYear.getTime()) ? defaultStartDate : firstDayOfYear;
  }

  // Dateipicker
  datePickerLeaveApplcn: any = {
    startAtStartDate: this.startDateDatePicker,
    startAtEndDate: new Date(),
    endAtEndDate: new Date(),
    noOfLeaveDays: {
      'Marriage': 4,
      'Paternity': 2,
      'Paid': 180,
      'Maternity': 182
    },
    dateClass: (position: 'start' | 'end' = 'start') => {
      let that = this;
      return (date: Date) => {
        const day = (date).getDay();
        // Prevent Saturday and Sunday from being selected. 
        let startDate = (position == 'start') ? that.datePickerLeaveApplcn.startAtStartDate : that.datePickerLeaveApplcn.startAtEndDate;
        let selectedDate = this.applyForm.get(position + 'Date').value;
        startDate.setHours(0, 0, 0, 0)
        let dateClassString = "";
        if (date < startDate || (day == 0 || day == 6) || (this.checkDateisThere(date, this.holidayList))) {
          dateClassString += 'mat-calendar-body-disabled';
        } else if (date.getFullYear() != this.today.getFullYear()) {
          dateClassString += 'mat-calendar-body-disabled';
        }
        else {
          if (selectedDate) {
            if (selectedDate.getTime() == date.getTime()) {
              // dateClassString += 'mat-calendar-body-cell-selected';
            }
          }
        }
        return dateClassString;
      }
    },
    dataPickerFilterStart: (date: Date) => {
      let startDate = this.datePickerLeaveApplcn.startAtStartDate
      startDate.setHours(0, 0, 0, 0)
      if (date) {
        const day = (date).getDay();
        let leaveType = this.applyForm.get('type').value.name
        let condition = false;
        condition = !(date < startDate)
        return (condition && (day != 0 && day != 6) && (!this.checkDateisThere(date, this.holidayList))) && date.getFullYear() == this.today.getFullYear()

      }
      return true
    },
    dataPickerFilter: (position: 'start' | 'end' = 'start') => {
      return (date: Date) => {
        let startDate = (position == 'start') ? this.datePickerLeaveApplcn.startAtStartDate : this.datePickerLeaveApplcn.startAtEndDate;
        startDate.setHours(0, 0, 0, 0)
        const day = (date).getDay();
        let leaveType = this.applyForm.get('type').value.name
        let condition = false;
        if (position == 'end') {
          let endDate = this.datePickerLeaveApplcn.endAtEndDate
          condition = !(date < startDate) && !(date > endDate)
          return (condition && (day != 0 && day != 6) && (!this.checkDateisThere(date, this.holidayList))) && date.getFullYear() == this.today.getFullYear()
        } else {
          condition = !(date < startDate)
          return (condition && (day != 0 && day != 6) && (!this.checkDateisThere(date, this.holidayList))) && date.getFullYear() == this.today.getFullYear()
        }
      }
    },
    dataPickerFilterEnd: (date: Date) => {
      // console.log(date)
      let startDate = this.datePickerLeaveApplcn.startAtEndDate;
      startDate.setHours(0, 0, 0, 0)
      if (date) {
        const day = (date).getDay();
        let leaveType = this.applyForm.get('type').value.name
        let condition = false;
        let endDate = this.datePickerLeaveApplcn.endAtEndDate
        if(leaveType == 'marriage'){
          endDate = this.datePickerLeaveApplcn.addDaysToDate(startDate,4)
        }
        condition = !(date < startDate) && !(date > endDate)
        console.log(date.getDate(),condition, startDate.getDate(), endDate.getDate())
        return (condition && (day != 0 && day != 6) && (!this.checkDateisThere(date, this.holidayList))) && date.getFullYear() == this.today.getFullYear()

      }
      return true
    },
    addDaysToDate: (startDate, noOfDays, weekends = false) => {
      // no of days from the start date excluding weekends 

      let count = 0
      let endDate = startDate;
      while (count < noOfDays) {
        // (!this.holidayList.includes(JSON.stringify(date)))
        endDate = new Date(endDate.getTime() + MILLISECONDS_DAY)

        let day = endDate.getDay()
        if (((day != 0 && day != 6 && !this.checkDateisThere(endDate, this.holidayList)) || weekends)) {
          count++
        }
      }
      return endDate;
    }
  }

  @ViewChild('f') applyFormNgForm: NgForm;

  // 
  @ViewChild('refPicker2') datePickerEndDate: MatDatepicker<any>;

  // 
  @ViewChild('refPicker1') datePickerStartDate: MatDatepicker<any>;


  @ViewChild('timesheetDiscrepancyDialog') timesheetDiscrepancyPopup: ModalPopupComponent;

  specialLeaveTypeRequestsAvailable: Array<{ id: number, name: string, available: number }> = []
  IS_mobile:boolean=false;
  constructor(
    public dialog: MatDialog,
    private fb: FormBuilder,
    private http: HttpClientService,
    private ss: SingletonService,
    private user: UserService,
    private cdRef: ChangeDetectorRef,
    public datepipe: DatePipe) {

    this.gender = this.user.getDataFromToken('gender')

    this.applyForm = this.fb.group({
      "type": ['', Validators.required],
      "reason": [""],
      "category": ['', Validators.required],
      "startDate": ["", Validators.required],
      "endDate": [""],
      "half": [""],
      "startDateSecondHalf": [""],
      "endDateFirstHalf": [""],
      "invitationUpload": [null],
      "comment": ['', Validators.required]
    })

    // this.ss.responsive.observe(AtaiBreakPoints.)
    this.ss.responsive.observe(AtaiBreakPoints.XS).subscribe(val=>{ 
      this.IS_mobile=val.matches;
      })
  }

  ngOnInit(): void {
    this.disableFirst2Categories = false;
    this.getHolidays();
    this.disableHalfDayCheckBoxes()
    this.getCurrentLeaveBalance();
    this.getLeaveRequestsAvailability();
    this.getLeaveConfig()

    // TODO: merge the value changes of the form. currently as the change detector is continuously firing in this compnent it is handled this way
    this.applyForm.get('startDate').valueChanges.pipe(takeUntil(this.destroy$), distinctUntilChanged()).subscribe((val) => {
      if (val) {
        this.applyForm.get('startDateSecondHalf').enable()
      }
      this.chosenDate()
      let fcEndDate = this.applyForm.get('endDate');
      this.applyForm.get('endDateFirstHalf').reset()
      this.applyForm.get('startDateSecondHalf').reset()
      if (this.applyForm.get('category').value == 'Multiple Days') {
        fcEndDate.setValidators([Validators.required])
      } else {
        fcEndDate.clearValidators();
      }
      if (this.datePickerStartDate) {
        this.datePickerStartDate.startAt = val
      }
      fcEndDate.updateValueAndValidity();
    });

    this.applyForm.get('category').valueChanges.pipe(takeUntil(this.destroy$), distinctUntilChanged()).subscribe((val) => {
      this.disableHalfDayCheckBoxes()
      this.restDates()
      this.chosenDate()
      if (this.datePickerStartDate) {
        this.datePickerStartDate.startAt = this.today
      }
    })

    this.applyForm.get('endDate').valueChanges.pipe(takeUntil(this.destroy$), distinctUntilChanged()).subscribe((val) => {
      if (val) {
        this.applyForm.get('endDateFirstHalf').enable()
      }
      this.chosenDate()
    })
    this.applyForm.get('half').valueChanges.pipe(takeUntil(this.destroy$)).subscribe((val) => {
      this.chosenDate()
    })
    this.applyForm.get('startDateSecondHalf').valueChanges.pipe(takeUntil(this.destroy$)).subscribe((val) => {
      this.chosenDate()
    })
    this.applyForm.get('endDateFirstHalf').valueChanges.pipe(takeUntil(this.destroy$)).subscribe((val) => {
      this.chosenDate()
    })
    this.applyForm.get('type').valueChanges.pipe(takeUntil(this.destroy$)).subscribe((val) => {
      this.applyForm.get('startDate').reset();
      this.applyForm.get('endDate').reset();
      this.applyForm.get('reason').reset();
      this.applyForm.get('startDateSecondHalf').disable();
      this.applyForm.get('startDateSecondHalf').setValue(false);
      this.applyForm.get('endDateFirstHalf').disable();
      this.applyForm.get('endDateFirstHalf').setValue(false);
      this.applyForm.get('invitationUpload').reset();

      this.selectedCount = 0
      let category = this.applyForm.get('category')
      if (val) {
        if (val.name == 'Marriage' || val.name == 'Paternity' || val.name == 'Maternity') {
          category.setValue('Multiple Days')
          this.selectedIndexLeaveCategory = 2
          // category.disable()
          this.disableFirst2Categories = true
          this.applyForm.get('reason').disable()
          // this.applyForm.get('reason').clearValidators()
        } else {
          category.setValue("")
          this.selectedIndexLeaveCategory = 1
          category.setValue('Single Day')
          this.disableFirst2Categories = false
          category.markAsUntouched()
          category.markAsPristine()
          this.applyForm.get('reason').enable()
          // this.applyForm.get('reason').setValidators(Validators.required)
        }
        this.applyForm.get('invitationUpload').clearValidators()
        this.applyForm.get('invitationUpload').setValidators(val.name == "Marriage" ? [Validators.required] : [])
        this.applyForm.get('invitationUpload').updateValueAndValidity()
      }
    })
    this.openApplyPopUp()
  }

  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete();
  }



  getHolidays() {
    let emp_id = this.user.getEmpId()
    let params = new HttpParams()
    params = params.append('emp_id', emp_id)

    this.http.request('get', 'holiday/', params).subscribe((res) => {
      if (res.status == 200) {
        // console.log(res)
        res.body.forEach(element => {
          let d = new Date(element.holiday_date)
          d.setHours(0, 0, 0, 0);
          this.holidayList.push(d)
        });

      }
    })
  }

  /* selected tab change in apply leave . no of days selection */
  onChangeSelectedTab(data: MatTabChangeEvent) {
    this.selectedIndexLeaveCategory = data.index;
    this.applyForm.get('category').setValue(this.leaveCategories[data.index])

    let fcStartDate = this.applyForm.get('startDate');
    let fcEndDate = this.applyForm.get('endDate');
    let halfDay = this.applyForm.get('half')
    fcStartDate.markAsUntouched()
    fcStartDate.reset()
    fcEndDate.markAsUntouched()
    fcEndDate.reset()
    this.applyForm.get('endDateFirstHalf').reset()
    this.applyForm.get('startDateSecondHalf').reset()

    if (data.tab.textLabel != this.leaveCategories[0]) {
      this.applyForm.get('half').reset()
      halfDay.clearValidators()
    } else {
      halfDay.setValidators([Validators.required])
      this.applyForm.get('half').setValue(this.leaveHours[0])
    }
    halfDay.updateValueAndValidity()
  }

  // on closing the leave application modal form
  closeApplyForm() {
    this.applyFormNgForm.resetForm()
    this.applyFormSubmitted = false;
    this.selectedIndexLeaveCategory = 1;
    this.applyForm.get('category').setValue(this.leaveCategories[this.selectedIndexLeaveCategory])
    this.eventEmitter.emit({ type: 'cancel', data: null })
  }


  getTimesheetDiscrepancy() {
    this.applyFormSubmitted = true
    if (this.applyForm.valid) {
      var param = new HttpParams();
      let f = this.applyForm.value


      param.append("start_date", this.datepipe.transform(f.startDate, 'yyyy-MM-dd'));
      if (f.category == 'Multiple Days') {
        param = param.append("start_date", this.datepipe.transform(f.startDate, 'yyyy-MM-dd'));
        param = param.append("end_date", this.datepipe.transform(f.endDate, 'yyyy-MM-dd'));
        // console.log(f.category)


        param = param.append("start_date_second_half", f.startDateSecondHalf || "");

        param = param.append("end_date_first_half", f.endDateFirstHalf || "");

      } else if (f.category == 'Single Day' || f.category == "Half Day") {
        // for single and half day requests set the end date same as start date
        param = param.append("start_date", this.datepipe.transform(f.startDate, 'yyyy-MM-dd'));
        param = param.append("end_date", this.datepipe.transform(f.startDate, 'yyyy-MM-dd'));
        if (f.category == "Half Day") {
          param = param.append("start_date_second_half", 'true');

        }
      }

      this.http.request('get', 'get-submitted-timesheet/', param).subscribe(res => {
        if (res.status == 200) {

          if (res.body["results"].length > 0) {
            // console.log("-----------ts dis----------------", res.body["results"])
            this.TIMESHEET_DISCREPANCY_DATA = res.body["results"]
            // this.timesheetDiscrepancyPopup.open()
            this.dialogRefDiscrepancyData = this.dialog.open(PopUpComponent, {
              data: {
                template: this.templateRefDiscrepancyData,
                heading: 'Submitted timesheet',
                showCloseButton: true,
                hideFooterButtons: true,
                maxWidth: '800px',
                minWidth:'300px'
              },
              restoreFocus:true
            })
          }
          else {
            this.onSubmitApplyForm()
          }

        }
      })

    } else {
      console.log("-------------------------", this.applyForm);
      // var formControls = this.applyForm.controls
      (<any>Object).values(this.applyForm.controls).forEach(e => {
        e.markAsTouched();

        // console.log("================================================", e);

      })

    }

  }



  checkDateisThere(d, l) {
    for (let i = 0; i < l.length; i++) {
      if (l[i].getTime() == d.getTime()) {
        return true;
      }
    }
    return false;
  }

  disableHalfDayCheckBoxes() {

    this.applyForm.get('startDateSecondHalf').disable()
    this.applyForm.get('endDateFirstHalf').disable()
  }

  restDates() {

    this.applyForm.get('startDate').reset()
    this.applyForm.get('endDate').reset()

    this.applyForm.get('startDate').markAsPristine()
    this.applyForm.get('endDate').markAsPristine()
    this.applyForm.get('startDate').markAsUntouched()
    this.applyForm.get('endDate').markAsUntouched()
  }

  getCurrentLeaveBalance() {
    this.http.request('get', 'leave/balance/').subscribe(res => {
      if (res.status == 200) {
        this.currentBalance = res.body["results"][0]["outstanding_leave_bal"];
      }
    })
  }

  openApplyPopUp() {
    this.applyForm.reset({ "daterange": { value: '', disabled: true } });
    this.leaveTypes = []
    this.http.request('get', 'leave/types/').subscribe(res => {
      if (res.status == 200) {

        let valToSet = null

        res.body["results"].forEach(element => {
          if (element.name == 'Maternity') {
            if (this.gender == "Female") {
              this.leaveTypes.push(element);
            }
          } else if (element.name == 'Paternity') {
            if (this.gender == "Male") {
              this.leaveTypes.push(element);
            }
          } else {
            if (element.name == 'Paid') {
              valToSet = element;
            }
            this.leaveTypes.push(element);
          }
        });

        this.applyForm.reset()
        this.applyForm.markAsUntouched()
        this.applyForm.markAsPristine()
        this.applyFormSubmitted = false;
        this.applyForm.get('type').setValue(valToSet);
        this.applyForm.get('category').setValue('Single Day');
      }
      else {
        alert(JSON.stringify(res))
        this.ss.statusMessage.showStatusMessage(false, "Could not get the leave types")
      }
    })

  }

  // get leave config
  getLeaveConfig() {
    let category = this.user.getDataFromToken('category');
    // let categorySlug = category.replace(' ','-').toLowerCase()
    let params = new HttpParams()
    params = params.append('category', category)

    this.http.request('get', 'leave/config/category/', params).subscribe((res) => {
      if (res.status == 200) {
        // console.log(res)
        let leaveCredits = res.body['results']
        let obj = {}
        leaveCredits.forEach(item => {
          obj[item.leave_type_name] = item.leave_type_name == 'Paid' ? 180 : item.leave_credits
        });
        this.datePickerLeaveApplcn.noOfLeaveDays = obj
      }
    })
  }

  onClose() {
    this.applyFormNgForm.resetForm()
    this.applyFormSubmitted = false;
    this.selectedIndexLeaveCategory = 1;
    this.applyForm.get('category').setValue(this.leaveCategories[this.selectedIndexLeaveCategory])
  }

  chosenDate() {
    let f = this.applyForm.controls;
    let startDate = f.startDate.value
    let startDateValue
    if (startDate) {
      startDateValue = new Date(startDate.getTime())
      startDateValue.setHours(0, 0, 0, 0)
    }
    if (f.category.value == 'Half Day') {
      this.selectedCount = (f.startDate.valid && f.half.valid) ? 0.5 : 0
    } else if (f.category.value == 'Single Day') {
      this.selectedCount = (f.startDate.valid) ? 1 : 0
    } else if (f.category.value == 'Multiple Days') {
      if (f.startDate.value && f.endDate.value) {
        f.endDate.value.setHours(0, 0, 0, 0)
        let diff = 0
        // let diff=Math.floor((Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())) - Date.UTC(start_dt.getFullYear(), start_dt.getMonth(), start_dt.getDate()))/(1000 * 60 * 60 * 24);
        while (startDateValue <= f.endDate.value) {
          if ((startDateValue.getDay() != 0) && (startDateValue.getDay() != 6) && !this.checkDateisThere(startDateValue, this.holidayList) || this.applyForm.value.type.name == 'Maternity') {
            diff++;
          }
          startDateValue = new Date(startDateValue.getTime() + MILLISECONDS_DAY)
          startDateValue.setHours(0, 0, 0, 0)
        }
        this.selectedCount = diff;

      } else {
        this.selectedCount = 0
      }
      if (f.startDateSecondHalf.value) {
        this.selectedCount -= 0.5
      }
      if (f.endDateFirstHalf.value) {
        this.selectedCount -= 0.5
      }

    } else if (f.category.value == 'Single Day') {
      this.selectedCount = (f.startDate.value) ? 1 : 0
    }
    this.selectedCount = Math.abs( this.selectedCount)
    this.cdRef.detectChanges();
  }

  onChangeStartDate(e) {
    let addDaysToDate = this.datePickerLeaveApplcn.addDaysToDate;
    let dateSelected = e.value;
    let endDateTimeStamp = addDaysToDate(dateSelected, 1);
    this.datePickerLeaveApplcn.startAtEndDate = new Date(endDateTimeStamp)
    let leaveType = this.applyForm.get('type').value.name
    let noOfLeaveDays = this.datePickerLeaveApplcn.noOfLeaveDays[leaveType] || 4;
    let fcEndDate = this.applyForm.get('endDate');
    this.datePickerLeaveApplcn.endAtEndDate = addDaysToDate(dateSelected, noOfLeaveDays - 1, leaveType == 'Maternity')
    if(noOfLeaveDays > 0){
      if (leaveType == 'Maternity' || leaveType == 'Paternity' || leaveType == 'Marriage') {
        this.selectedEndDate = this.datePickerLeaveApplcn.endAtEndDate;
        fcEndDate.setValue(this.selectedEndDate);
        this.applyForm.updateValueAndValidity();
      }
      else {
        fcEndDate.reset();
      }
    }else{ 
      fcEndDate.reset();
    }

  }

  // set the opened date for start date in leave application
  onOpenStartDateDatePicker() {
    // console.log('on open start date')
    // this.datePickerStartDate.startAt = this.applyForm.value.endDate || new Date()
  }

  // set the open date for end date in leave application
  onOpenEndDateDatePicker() {
    this.datePickerEndDate.startAt = this.applyForm.value.endDate || this.datePickerLeaveApplcn.startAtEndDate;
  }

  // get the leave requests available for the current user for special leave types
  getLeaveRequestsAvailability() {
    this.http.request('get', 'leave/special-leave-requests-available/').subscribe((res) => {
      if (res.status == 200) {
        this.specialLeaveTypeRequestsAvailable = res.body['results']
        // console.log(this.specialLeaveTypeRequestsAvailable);

      } else {
        this.specialLeaveTypeRequestsAvailable = []
      }
    })
  }

  onSubmitApplyForm() {

    // this.applyFormSubmitted = true;

    let sendRequest = () => {
      let fd = new FormData();
      let f = this.applyForm.value
      fd.append("day_leave_type", f.category);
      fd.append("leave_type", f.type.id);
      // fd.append('invitation_file', )
      if (f.invitationUpload && f.invitationUpload.length > 0) {
        f.invitationUpload.forEach(file => {
          fd.append('invitation_files', file)
        });
      }
      if (f.category == "Half Day") {
        fd.append("hour", f.half);
      } else {
        fd.append("hour", "");
      }
      fd.append("startdate", this.datepipe.transform(f.startDate, 'yyyy-MM-ddT00:00:00'));
      if (f.category == 'Multiple Days') {
        fd.append("enddate", this.datepipe.transform(f.endDate, 'yyyy-MM-ddT00:00:00'));
      } else if (f.category == 'Single Day' || f.category == "Half Day") {
        // for single and half day requests set the end date same as start date
        fd.append("enddate", this.datepipe.transform(f.startDate, 'yyyy-MM-ddT00:00:00'));
      } else {
        fd.append("enddate", "");
      }
      fd.append("leave_reason", f.reason);
      fd.append("emp_comments", f.comment);
      fd.append("start_date_second_half", f.startDateSecondHalf || "");
      fd.append("end_date_first_half", f.endDateFirstHalf || "");
      // console.log("----------------------ffffffffff-------------------");
      this.TIMESHEET_DISCREPANCY_DATA.forEach(el => {
        fd.append("time_tracker_id", el.id);
        fd.append('modified_work_minutes', (parseInt(el.modified_work_minutes.split(":")[0], 10) * 60 + parseInt(el.modified_work_minutes.split(":")[1], 10)).toString());
        console.log("-----------------------------------------", (parseInt(el.modified_work_minutes.split(":")[0], 10) * 60 + parseInt(el.modified_work_minutes.split(":")[1], 10)).toString());

      })
      this.http.request('post', 'leave/request/', '', fd).subscribe(res => {
        if (res.status == 200) {
          this.ss.statusMessage.showStatusMessage(true, "leave application has been submitted successfully")
          if (this.dialogRefDiscrepancyData) {
            this.dialogRefDiscrepancyData.close();
          }
          this.closeApplyForm();
          this.getCurrentLeaveBalance();
          // this.getAppliedLeaves();
          // this.getLeaveHistory();
          this.eventEmitter.emit({ type: 'submitted', data: null })
          this.TIMESHEET_DISCREPANCY_DATA = []

        } else {
          if (res.status == 406) {
            // max no of messages
            this.ss.statusMessage.showStatusMessage(false, res.error.message)
          }
          else if (res.status == 408) {
            let dates = res.error.results;
            dates = dates.map((item) => this.datepipe.transform(item, 'dd/MM/yyyy'))
            // this.ss.statusMessage.showStatusMessage(false, res.error.message)
            let dialogRef = this.dialog.open(ConfirmDialogComponent, {
              panelClass: 'confirm-popup',
              data: {

                confirmMessage: res.error.message,
                onlyForAlert: true
              },
              restoreFocus:true
            })
          }
          else if (res.status == 409) {
            let dates = res.error.results;
            dates = dates.map((item) => this.datepipe.transform(item, 'dd/MM/yyyy'))
            this.ss.statusMessage.showStatusMessage(false, "The requested date(s) " + dates.join(", ") + " " + (dates.length == 1 ? "has" : "have") + " conflict with another request")
          }else if(res.status == 400 && res?.error?.results?.hasOwnProperty('emp_comments')) {
            let errMsg = 'Purpose of leave field allow maximum 1000 character.';
            this.ss.statusMessage.showStatusMessage(false, errMsg)

          }
          else {
            this.ss.statusMessage.showStatusMessage(false, "Something went wrong")
          }
        }
      })
    }
    if (this.applyForm.valid) {

      if (this.currentBalance - this.selectedCount < 0 && this.applyForm.get('type').value == 'Paid') {
        this.ss.takeConfirmation(this, 'The no of leaves remaining after deduction is negative. Extra leave days will be UNPAID leaves. Confirm to proceed.', sendRequest, ['test'])
      } else {
        let leaveType = this.applyForm.value.type.name
        if (leaveType == 'Paid') {
          sendRequest()
        } else {
          // take a confirmation if the leave request remainng for that leave type is zero
          let leaveRequestRemaining = this.specialLeaveTypeRequestsAvailable.filter(item => item.name == leaveType)[0].available
          if (leaveRequestRemaining <= 0) {
            this.ss.takeConfirmation(this, 'You do not have leave requests remaining for this leave type. Do you want to proceed ?', sendRequest, [])
          } else {
            sendRequest()
          }
        }
      }
    }
  }

}
