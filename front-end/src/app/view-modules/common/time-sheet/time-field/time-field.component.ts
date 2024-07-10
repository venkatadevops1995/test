import { TimeSheetService } from './../time-sheet.service';
import { DOCUMENT } from '@angular/common';
import { ControlValueAccessor, NgControl, AbstractControl, FormControl } from '@angular/forms';
import { Component, OnInit, HostListener, ViewChild, ElementRef, Optional, Self, Input, HostBinding, ChangeDetectionStrategy, ChangeDetectorRef, Renderer2, Inject, ViewEncapsulation } from '@angular/core';
import { isDescendant } from 'src/app/functions/isDescendent.fn';

@Component({
  selector: 'app-time-field',
  templateUrl: './time-field.component.html',
  styleUrls: ['./time-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class TimeFieldComponent implements OnInit, ControlValueAccessor {

  upDownKeyPressed: boolean = false;

  // should the input and drop down be disabled or enabled
  @Input() disabled: boolean = false;

  // should the input and drop down be editable or not without color changes like in disabled
  @Input() editable: boolean = true;

  // ref to the input field in the time fields
  @ViewChild('input') elInput: ElementRef;

  // input to know the index of the time field in the week
  @Input() index: number = undefined;

  // mins dropdown values 
  minsDdValues = ['00', '15', '30', '45'];

  // the mins value that is active or selected
  minsActive = this.minsDdValues[0];

  // hours entered in the input field
  hours: string | number = 0;

  // holder for initialValue
  initialValue = {
    h: 0,
    m: 0
  }

  // full value of the time duration entered
  value: any = { h: this.hours, m: this.minsActive };

  // reference to the active mins element
  @ViewChild('refMinsActive') elMinsActive: ElementRef;

  // boolean template token to show or hide the drop down of mins
  showDropDown: boolean = false;

  // boolean template token to show or hide the error for invalid number for hours
  showErrorHours: boolean = false

  // boolean template token to show or hide the error for total hours more than 24
  showErrorTotal: boolean = false;

  showErrorWeekend: boolean = false;

  // errot type when the error is total error to show the arrow at the appropriate position
  errorTotalType: 'minutes' | 'hours';

  // the mins option that is in focus
  inFocusMinIndex = 0;

  //current form control. helpful in validating and accessing form control  Even when it is not assigned a formcontrol we are using a dummy control
  control: AbstractControl;

  showErrorVacation: boolean = false;

  showErrorHoliday: boolean = false;

  showErrorHalfVacation: boolean = false;

  constructor(
    @Optional() @Self() public ngControl: NgControl,
    private cd: ChangeDetectorRef,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document,
    private tsService: TimeSheetService,
    private el: ElementRef
  ) {

    if (ngControl) {
      // set the value accessor to the current component instance
      ngControl.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    // set the control to the ngControl
    this.control = (this.ngControl) ? this.ngControl.control : new FormControl();
  }

  ngAfterViewInit() {
    this.document.addEventListener('focusin', this, true);
    this.document.addEventListener('focusout', this, true)
    this.document.addEventListener('keyup', this, { passive: false })
    this.document.addEventListener('keydown', this, { passive: false })
  }

  ngOnDestroy() {
    this.document.removeEventListener('focusin', this, true);
    this.document.removeEventListener('focusout', this, true)
    this.document.removeEventListener('keyup', this, { passive: false });
    this.document.removeEventListener('keydown', this, { passive: false });
  }


  // bind the disabled state with class empty
  @HostBinding('class.empty') get isDisabled() { return this.disabled; }

  // bind the disabled state with class not-editable 
  @HostBinding('class.not-editable') get isNotEditable() { return !this.editable; }


  // event listener on document to check if active mins is clicked
  @HostListener("document:click", ['$event'])
  onClickDocument(e: Event) {
    let target: any = e.target;
    let idx = this.index;
    let isSunday = idx == 1;
    let isSaturday = idx == 0;
    let isTarget = target == this.elMinsActive.nativeElement || target == this.elInput.nativeElement;
    if ((isSaturday || isSunday) && (isTarget) && !this.disabled) {
      let dayTotalTime = this.tsService.totalArray[idx];
      if ((isSaturday && !this.tsService.saturdayAlert)) {
        if (dayTotalTime.h == 0 && dayTotalTime.m == 0) {
          this.tsService.saturdayAlert = true;
          this.showError('weekend')
        }
      }
      if ((isSunday && !this.tsService.sundayAlert)) {
        if (dayTotalTime.h == 0 && dayTotalTime.m == 0) {
          this.tsService.sundayAlert = true;
          this.showError('weekend')
        }
      }
    }
    if (target == this.elMinsActive.nativeElement) {
      this.showDropDown = true;
    } else if (isDescendant(this.elMinsActive.nativeElement, target) && target.classList.contains('mins__item')) {
      let prevMins = this.value.m;
      this.minsActive = target.getAttribute("data-min");
      let dayTotalTime = this.tsService.totalArray[this.index];
      let tempMinsActive = this.minsActive == "00" ? 0 : parseInt(this.minsActive, 10);
      // let tempTime = 
      let totalMinsActive = dayTotalTime.m + tempMinsActive - prevMins;
      if ((dayTotalTime.h == 24 && (tempMinsActive - prevMins) > 0) || (dayTotalTime.h == 23 && totalMinsActive >= 60 && totalMinsActive % 60 > 0)) {
        // set total hour error and set minutes to 00
        this.minsActive = "00";
        this.errorTotalType = 'minutes';
        this.showError('total');
      }
      if ((this.tsService.vacationArray[this.index] == 5) && (tempMinsActive > 0) && (
        (dayTotalTime.h > 10) ||
        ((dayTotalTime.h == 10) && (totalMinsActive > 0)) ||
        ((dayTotalTime.h == 9) && (totalMinsActive > 60))
      )
      ) {
        this.errorTotalType = 'minutes';
        this.showError('halfVacation');
      }
      if ((this.tsService.vacationArray[this.index] == 8) && (tempMinsActive > 0) && (
        (dayTotalTime.h > 8) ||
        (totalMinsActive > 0)
      )
      ) {

        this.errorTotalType = 'minutes';
        this.showError('vacation');
      }
      if ((this.tsService.holidayArray[this.index] == 8) && (tempMinsActive > 0) && (
        (dayTotalTime.h > 8) ||
        (totalMinsActive > 0)
      )
      ) {

        this.errorTotalType = 'minutes';
        this.showError('holiday');
      }
      this.value = this.getValue();
      this.propagateChange(this.value);
      this.closeMinsDropDown()
    } else if (target == this.elInput.nativeElement) {
      this.elInput.nativeElement.select()
      this.closeMinsDropDown()
    } else {
      this.closeMinsDropDown()
    }
  }

  closeMinsDropDown() {
    this.showDropDown = false;
    this.upDownKeyPressed = false;
    this.inFocusMinIndex = undefined
  }

  // on change event on the document
  @HostListener("document:change", ['$event'])
  onChangeDocument(e: Event) {
    let target: any = e.target;
    if (target == this.elInput.nativeElement) {
      let prevHours: any = this.value.h || 0;
      this.hours = parseInt(target.value, 10);
      if (this.hours >= 0 && this.hours <= 24) {
        // if total time is more than 24 hours
        let dayTotalTime = this.tsService.totalArray[this.index];

        if ((dayTotalTime.h + this.hours - prevHours) > 24 || ((dayTotalTime.h + this.hours - prevHours) == 24 && (dayTotalTime.m > 0))) {
          this.hours = 0;
          this.renderer.setProperty(this.elInput.nativeElement, 'value', this.hours)
          this.errorTotalType = 'hours';
          this.showError("total")
        }
        this.value = this.getValue();
        this.propagateChange(this.value);
      } else {
        this.hours = 0;
        this.renderer.setProperty(this.elInput.nativeElement, 'value', this.hours)
        this.value = this.getValue();
        this.propagateChange(this.value);
        this.showError("hour")
      }
      if ((this.hours) > 0 && this.tsService.holidayArray[this.index] > 0) {
        this.errorTotalType = 'hours';
        this.showError("holiday");
      }
      if (this.tsService.vacationArray[this.index] == 8) {
        let dayTotalTime = this.tsService.totalArray[this.index];
        if ((this.hours) > 0 && (dayTotalTime.h + this.hours - prevHours) > 8 || ((dayTotalTime.h + this.hours - prevHours) == 8 && (dayTotalTime.m > 0))) {
          this.errorTotalType = 'hours';
          this.showError("vacation");
        }
      }
      if (this.tsService.vacationArray[this.index] == 5) {
        let dayTotalTime = this.tsService.totalArray[this.index];

        if ((this.hours) > 0 && (dayTotalTime.h + this.hours - prevHours) > 10 ||
          ((dayTotalTime.h + this.hours - prevHours) == 10 && (dayTotalTime.m > 0))) {
          this.errorTotalType = 'hours';
          this.showError("halfVacation");
        }
      }
    }
  }

  // NOTE: do not change the name of the method
  // name is mandatory to be "handleEvent" as the event listener is expecting this method while passing the this as the function to execute on event
  handleEvent(e: Event) {
    let target = e.target;
    if (target == this.elMinsActive.nativeElement) {
      switch (event.type) {
        case 'focusin':
          this.showDropDown = true;
          this.cd.detectChanges();
          break;
        case 'focusout':
          this.closeMinsDropDown()
          this.cd.detectChanges();
          break;
        case 'keyup':
          if (e['keyCode'] == 13) {
            let prevMins = this.value.m;
            this.minsActive = this.inFocusMinIndex == undefined ? this.minsActive : this.minsDdValues[this.inFocusMinIndex];
            let dayTotalTime = this.tsService.totalArray[this.index];
            let tempMinsActive = this.minsActive == "00" ? 0 : parseInt(this.minsActive, 10);
            let totalMinsActive = dayTotalTime.m + tempMinsActive - prevMins;
            if ((dayTotalTime.h == 24 && (tempMinsActive - prevMins) > 0)) {
              // set total hour error and set minutes to 00
              this.minsActive = "00";
              this.errorTotalType = 'minutes';
              this.showError('total');
            }
            if ((this.tsService.vacationArray[this.index] == 5) && (tempMinsActive > 0) && (
              (dayTotalTime.h > 10) ||
              ((dayTotalTime.h == 10) && (totalMinsActive > 0)) ||
              ((dayTotalTime.h == 9) && (totalMinsActive > 60))
            )
            ) {

              this.errorTotalType = 'minutes';
              this.showError('halfVacation');
            }
            if ((this.tsService.vacationArray[this.index] == 8) && (tempMinsActive > 0) && (
              (dayTotalTime.h > 8) ||
              (totalMinsActive > 0)
            )
            ) {
              this.errorTotalType = 'minutes';
              this.showError('vacation');
            }
            if ((this.tsService.holidayArray[this.index] == 8) && (tempMinsActive > 0) && ((dayTotalTime.h > 8) || (totalMinsActive > 0))) {
              this.errorTotalType = 'minutes';
              this.showError('holiday');
            }
            this.value = this.getValue();
            this.closeMinsDropDown()
            this.propagateChange(this.value);
            this.cd.detectChanges();
          } else if (e['keyCode'] == 38) {
            e.stopPropagation()
            e.preventDefault();
            this.upDownKeyPressed = true;
            // this.showDropDown = false;
            if (this.inFocusMinIndex != 0) {
              this.inFocusMinIndex--;
            } else {
              this.inFocusMinIndex = this.minsDdValues.length - 1
            }
            if (isNaN(this.inFocusMinIndex)) {
              this.inFocusMinIndex = this.minsDdValues.length - 1
            }
            console.log(this.inFocusMinIndex)
            this.cd.detectChanges();
            return false;
          } else if (e['keyCode'] == 40) {
            e.stopPropagation()
            e.preventDefault();
            this.upDownKeyPressed = true;
            // this.showDropDown = false;
            if (this.inFocusMinIndex != this.minsDdValues.length - 1) {
              this.inFocusMinIndex++;
            } else {
              this.inFocusMinIndex = 0
            }
            if (isNaN(this.inFocusMinIndex)) {
              this.inFocusMinIndex = 0
            }
            this.cd.detectChanges();
            return false;
          }
          break;
        case 'keydown':
          if ([32, 37, 38, 39, 40].indexOf(event['keyCode']) > -1) {
            e.preventDefault();
          }
          break;

      }

    } else if (target == this.elInput.nativeElement) {
      this.upDownKeyPressed = false;
      if (event.type == 'keydown') {
        let invalidKeys = [69, 190, 32];
        if (invalidKeys.indexOf(e['keyCode']) != -1) {
          e.preventDefault();
          return false;
        }
      }
    }
    return true
  }



  // method to get the value of the field form control
  getValue() {
    if (!this.value) {
      return { h: this.hours, m: this.minsActive == "00" ? 0 : parseInt(this.minsActive, 10) };
    } else {
      this.value.h = this.hours;
      this.value.m = this.minsActive == "00" ? 0 : parseInt(this.minsActive, 10);
      return this.value;
    }
  }

  showError(type: "hour" | "total" | "holiday" | "vacation" | "halfVacation" | "weekend") {
    if (type == "hour") {
      this.showErrorHours = true;
      setTimeout(() => {
        this.showErrorHours = false;
        this.cd.detectChanges();
      }, 3000)
    } else if (type == "total") {
      this.showErrorTotal = true;
      setTimeout(() => {
        this.showErrorTotal = false;
        this.cd.detectChanges();
      }, 3000)
    } else if (type == "weekend") {
      this.errorTotalType = "hours"
      this.showErrorWeekend = true;
      setTimeout(() => {
        this.showErrorWeekend = false;
        this.cd.detectChanges();
      }, 1000)
    } else if (type == "holiday") {
      this.showErrorHoliday = true;
      setTimeout(() => {
        this.showErrorHoliday = false;
        this.cd.detectChanges();
      }, 3000)
    } else if (type == "vacation") {
      this.showErrorVacation = true;
      setTimeout(() => {
        this.showErrorVacation = false;
        this.cd.detectChanges();
      }, 3000)
    } else if (type == "halfVacation") {
      this.showErrorHalfVacation = true;
      setTimeout(() => {
        this.showErrorHalfVacation = false;
        this.cd.detectChanges();
      }, 3000)
    }
  }

  //propagate changes into the form
  propagateChange = (_: any) => { }

  //From ControlValueAccessor interface. Refer to angular.io for more info
  writeValue(value: any) {
    if (value) {
      this.hours = value.h || 0;
      this.minsActive = value.m || this.minsDdValues[0];
      this.value = this.getValue();
    } else {
      this.hours = 0;
      this.minsActive = this.minsDdValues[0];
      this.value = {
        h: this.hours,
        m: this.minsActive == "00" ? 0 : parseInt(this.minsActive, 10)
      }
    }
    if (this.elInput) {
      this.renderer.setAttribute(this.elInput.nativeElement, "value", this.hours + "")
    } else {
      setTimeout(() => {
        this.writeValue(value)
      }, 10)
    }
    this.cd.detectChanges();
    // console.log(value,this.hours,this.minsActive)
  }

  //From ControlValueAccessor interface. Refer to angular.io for more info
  registerOnChange(fn: any) {
    this.propagateChange = fn;
  }

  registerOnDisabledChange(fn: any) {

  }

  _applyFormState;

  //From ControlValueAccessor interface. Refer to angular.io for more info
  registerOnTouched(fn: any) {

  }

}
