import { DatePipe, WeekDay } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, QueryList, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { DateRange } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { from, fromEvent, Observable, Subject, Subscription, take, takeUntil } from 'rxjs';
import { AtaiDateRangeComponent } from 'src/app/components/atai-date-range/atai-date-range.component';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';
import { PopUpComponent } from 'src/app/components/pop-up/pop-up.component';
import { isDescendant } from 'src/app/functions/isDescendent.fn';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';
import { UserService } from 'src/app/services/user.service';
import * as _ from 'lodash'
import { AtaiBreakPoints } from 'src/app/constants/atai-breakpoints';

export function YearVd(year: String): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    var res = false;
    // console.log(control.value)
    if ((control.value['start_date'] != null) && (control.value['start_date'] != undefined) && (control.value['end_date'] != null) && (control.value['end_date'] != undefined)) {
      var start_yr = control.value['start_date'].split("-").reverse().join("-").split('-')[2];
      var end_yr = control.value['end_date'].split("-").reverse().join("-").split('-')[2];
      res = ((start_yr == year) && end_yr == year)
    }
    return res ? null : { invalidYear: true }
  }
}

export function atleastOne(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    var res = false;
    if (control.value.length > 0) {
      res = true;
    }
    return res ? null : { atleastOne: true }

  }
}
export function notWeekend(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    var error = null;
    if (control.value['start_date'] != null) {
      let dateStartDate = new Date(control.value['start_date']);
      if (dateStartDate.getDay() == 6 || dateStartDate.getDay() == 0) {
        error = true
      }
    }
    if (control.value['end_date'] != null) {
      let dateEndDate = new Date(control.value['end_date']);
      if (dateEndDate.getDay() == 6 || dateEndDate.getDay() == 0) {
        error = true
      }
    }
    return error ? { 'notWeekend': true } : null;
  }
}

export function UniqueText(fa: FormArray, selected_index: number): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    var res = false;
    for (let i = 0; i < fa['controls'].length; i++) {
      if (i != selected_index) {
        // console.log("-------------showOptionIndex ", selected_index)
        console.log("--------", i, selected_index, fa['controls'][i]['controls'].des.value)
      }
    };
    return res ? null : { uniqueTextError: true }
  }
}

@Component({
  selector: 'app-holiday',
  templateUrl: './holiday.component.html',
  styleUrls: ['./holiday.component.scss']
})
export class HolidayComponent implements OnInit {

  @ViewChildren('inputDate') dateIpElRefs: QueryList<ElementRef>;

  @ViewChild(AtaiDateRangeComponent) dateRangePicker: AtaiDateRangeComponent;

  @ViewChild('refHolidaysWrap') elHolidaysWrap: ElementRef;

  // the min date for the calendar when opening for date selection for a holiday row in edit mode
  minDate = new Date()

  // the maxdate for the calendar when opening for date selection for a holiday row in edit mode
  maxDate = new Date(this.minDate.getFullYear(), 11, 31)

  // the date selected in the calendar on selecting date for a holiday row in edit mode
  selected: { start: Date, end: Date };

  // the table columns for the holiday list
  tableHeadColumns = ["Date", "Occasion", "Day", "No of Days"]

  // 
  displayedYear: string[];

  // the year selected in the select drop down
  selectedYear;

  // whether the user logged in is an admin user
  isAdmin: boolean = false;

  // array containing the default holiday list maintained in the DB
  defaultHolidayList = [];

  // filtered default Holiday list
  filteredDefaultHolidayList: Array<any> = []

  // the current date in the backend server
  currentDate;

  // boolean indicating whether the year selected is editable or not
  isSelectedYearEditable = false;

  // boolean to indicate whether the user can view the next year holiday list when existing
  showNextYear = false

  /* is the page in edit mode when applicable */
  editMode: boolean = false;

  /* Array to hold the holiday list */
  holidayList: Array<any> = []

  /* boolean indicating whether the employees notification about the holidays is done or not */
  notifiedEmployees: boolean = false;

  // array holding the locations availble in the backend
  locations: Array<{ id?: any, name?: any, status?: any }> = []

  // locations that are having atleast one holiday checked in the selected year holidays
  locationsInSelectedYear: Array<any> = []

  // form controls array for the holiday list holiday date & holiday name
  faHolidayList: FormArray = new FormArray([]);

  // the holiday option selected in the pop up
  selectedHolidayOption: any = null

  // boolean to hold if it is a new holiday list which is to be added / cancelled if a new year holiday list is to be added from template or manually
  isNewHolidayList: boolean = false;

  // newly added indexes in holiday list to help on clicking cancel button to revert the holidaylist
  appendedHolidays = []

  // subject to emit for clearing the subscriptions
  destroy$: Subject<any> = new Subject();

  scrollXHolidayAffix: number = 0;

  // holiday template reference 
  @ViewChild('templateRefHolidayForm') templateHolidayForm: TemplateRef<any>;


  get is_MD_LT() {
    return this.ss.responsiveState[AtaiBreakPoints.MD_LT]
  }

  constructor(
    private cd: ChangeDetectorRef,
    private el: ElementRef,
    private fb: FormBuilder,
    private datePipe: DatePipe,
    private http: HttpClientService,
    private user: UserService,
    private cdRef: ChangeDetectorRef,
    private ss: SingletonService, public datepipe: DatePipe,
    private dialog: MatDialog) { }


  ngOnInit(): void {
    this.getCurrentDate();
    this.getHolidayList();
    this.getDefaultHolidayList();
    this.isSelectedYearEditable = true;
    this.isAdmin = this.user.getIsEmpAdmin();
  }


  ngAfterViewInit() {
    fromEvent(this.elHolidaysWrap.nativeElement, 'scroll').pipe(takeUntil(this.destroy$)).subscribe(val => {
      this.scrollXHolidayAffix = this.elHolidaysWrap.nativeElement.scrollLeft
    })
  }



  ngOnDestroy() {
    this.destroy$.next(null);
    this.destroy$.complete()
  }

  @ViewChild('addHoliday') elAddHoliday: ElementRef;

  // on focus of holiday name input in edit mode set index to help with autocomplete selection
  holidayNameIndexInFocus = null;

  @HostListener("document:click", ['$event'])
  onClickDocument(e) {
    let target: any = e.target;
    if (this.elAddHoliday && target == this.elAddHoliday.nativeElement) {
    } else if (this.elAddHoliday && isDescendant(this.elAddHoliday.nativeElement, target)) {
      let index = Number(target.getAttribute("index"));
    }
  }

  // index of the holiday list item for which the date picker is open 
  indexOfHolidayInDatePicker: number = null

  // event listener on document to check if remove a project button is clicked
  @HostListener("click", ['$event'])
  onClickHost(e) {

    let target: any = e.target;
    let tempTarget = target;
    while (tempTarget != this.el.nativeElement) {

      if (tempTarget == null) {
        break;
      }
      let classList = tempTarget.classList;
      // toggle the location checkbox for a holiday
      if (classList.contains('holidays__checkbox') && this.editMode && !classList.contains('disabled')) {
        let dataIndex = tempTarget.getAttribute('data-index');
        let dataLocationId = Number(tempTarget.getAttribute('data-location_id'));
        let locFormControl = this.faHolidayList.controls[dataIndex].get('locations');
        let locationsValue = locFormControl.value
        if (tempTarget.classList.contains('checked')) {
          let indexToRemove = locationsValue.indexOf(dataLocationId);
          locationsValue.splice(indexToRemove, 1)
        } else {
          locationsValue.push(dataLocationId);
        }
        locationsValue.sort((a, b) => a - b)
        locFormControl.setValue(locationsValue)
        break;
      }

      // open the date picker for selection of dates for the holiday
      if (classList.contains('holidays__calendar-icon') || classList.contains('holidays__input-date')) {
        let datePickerRefElement = tempTarget.previousElementSibling
        this.indexOfHolidayInDatePicker = Number(tempTarget.getAttribute('data-index'));
        // this.dateRangePicker.setSelection('custom')
        let dateValue = this.faHolidayList.controls[this.indexOfHolidayInDatePicker].get('date').value
        if (dateValue && dateValue['start_date'] && dateValue['end_date']) {
          this.dateRangePicker.setCustomValue(new Date(dateValue['start_date']), new Date(dateValue['end_date']))
        }
        this.dateRangePicker.openDateRangePicker(datePickerRefElement)
        break;
      }

      //  remove a row of holiday when the remove button is clicked
      if (classList.contains('holidays__remove')) {
        let indexOfHoliday = Number(tempTarget.getAttribute('data-index'));
        this.holidayList[indexOfHoliday].delete = true;
        let fc = this.faHolidayList.controls[indexOfHoliday];
        fc.get('delete').setValue(true);
        fc.get('date').clearValidators();
        fc.get('description').clearValidators()
        fc.get('date').updateValueAndValidity();
        fc.get('description').updateValueAndValidity()
      }

      //  remove a row of holiday when the remove button is clicked
      if (classList.contains('holidays__cell--locations') && this.editMode) {
        let indexOfHoliday = Number(tempTarget.getAttribute('data-index'));
        this.faHolidayList.controls[indexOfHoliday].get('locations').markAsTouched();
      }

      tempTarget = tempTarget.parentNode;
    }
  }


  @HostListener("input", ['$event'])
  onInputDescriptionInput(e: Event) {
    // console.log('input')
    let target: HTMLElement = <HTMLElement>e.target;
    if (target.classList.contains('holidays__description')) {
      let index = Number(target.getAttribute('data-index'));
      let val = (<HTMLInputElement>target).value
      this.faHolidayList.controls[index].get('description').setValue(val)
      this.faHolidayList.controls[index].get('description').updateValueAndValidity();

      this.filteredDefaultHolidayList = this.defaultHolidayList.filter((item) => {
        if (val) {
          return item.name.toLowerCase().includes(val.toLowerCase())
        } else {
          return true
        }
      })
    }
  }

  @HostListener("focusout", ['$event'])
  onFocusOutDescriptionInput(e: Event) {
    let target: HTMLElement = <HTMLElement>e.target;
    if (target.classList.contains('holidays__description')) {
      setTimeout(() => {
        this.filteredDefaultHolidayList = this.defaultHolidayList
      }, 250)
    }
  }

  @HostListener("focusin", ['$event'])
  onFocusInDescriptionInput(e: Event) {
    let target: HTMLElement = <HTMLElement>e.target;
    if (target.classList.contains('holidays__description')) {
      let index = target.getAttribute('data-index');
      this.holidayNameIndexInFocus = index;
    }
  }

  /* on clicking the edit button */
  onClickEdit() {
    this.editMode = true;
    // loop through the holiday list and add the form group with date and description into the faHoliday
    this.faHolidayList = new FormArray([])
    this.holidayList.forEach((item) => {
      item.delete = false;
      this.faHolidayList.push(this.fb.group({
        date: [{ start_date: item.start_date, end_date: item.end_date }, [notWeekend(), YearVd(this.selectedYear)]],
        description: [item.holiday.holiday_name, [Validators.required]],
        count: [item.holiday_count],
        locations: [[...item.locations]],
        delete: [false]
      }))
    })
  }

  /* on selecting the date from the calendar for a holiday row item dates */
  onDateSelection(val: DateRange<any>) {
    this.faHolidayList.controls[this.indexOfHolidayInDatePicker].get('date').markAsTouched()
    if (val.start && val.end) {
      this.faHolidayList.controls[this.indexOfHolidayInDatePicker].get('date').setValue({ start_date: this.convertDatefmt(val.start), end_date: this.convertDatefmt(val.end) })
      // // set the days count and 
      let count = this.getWorkdayCount(val)
      this.faHolidayList.controls[this.indexOfHolidayInDatePicker].get('count').setValue(count)
      this.dateRangePicker.resetRange()
      this.cdRef.detectChanges();
    }
  }

  // when no date is selected in date picker
  onCancelDatePicker() {
    this.faHolidayList.controls[this.indexOfHolidayInDatePicker].get('date').markAsTouched()
  }

  onSelectAutoComplete(data: MatAutocompleteSelectedEvent) {
    this.faHolidayList.controls[this.holidayNameIndexInFocus].get('description').setValue(data.option.value)
  }

  getWorkdayCount(date: { end: Date, start: Date }) {
    if (date.hasOwnProperty('start') && date.hasOwnProperty('end')) {
      let startDate = new Date(date.start)
      let endDate = new Date(date.end)
      var count = 0;
      while (startDate <= endDate) {
        let startDay = startDate.getDay();
        if ((startDay != 0) && (startDay != 6)) {
          count++;
        }
        startDate.setDate(startDate.getDate() + 1);
      }
      return count;
    }
  }

  convertDatefmt(date, format = 'yyyy-MM-dd') {
    return this.datepipe.transform(date, format);
  }

  // add holiday item into the holiday list
  addHolidayItem() {

    let holiday = {
      "holiday_year": this.selectedYear,
      "holiday_date": null,
      "start_date": null,
      "end_date": null,
      "holiday_count": 0,
      "holiday": {
        "holiday_name": ""
      },
      "editable": true,
      "locations": [
      ]
    };

    this.holidayList.push(holiday);

    let fg = this.fb.group({
      date: [{ start_date: null, end_date: null }, [notWeekend(), YearVd(this.selectedYear)]],
      description: ["", [Validators.required]],
      count: [0],
      locations: [[]],
      delete: false
    })

    this.faHolidayList.push(fg)

    this.appendedHolidays.push(holiday)
  }

  onClickCancel() {
    if (this.isNewHolidayList) {
      // reset the holiday list if imported from template
      this.holidayList = []
      // set to false always as new holiday list is resolved
      this.isNewHolidayList = false;
    }

    // reset the delete status of each holiday list item
    this.holidayList.forEach((item) => {
      item.delete = false;
    })

    // if any newly added indexes remove them to revert the holiday list
    if (this.appendedHolidays.length > 0) {
      this.holidayList = this.holidayList.filter((item, index) => this.appendedHolidays.indexOf(item) == -1);
    }

    this.faHolidayList = new FormArray([])
    this.editMode = false;
  }

  onClickSave() {

    let datesWithoutAtleastOneSelection = []
    let festivalNamesArray = []
    let duplicateFestivalNames = [];
    let duplicateFestivalIndex = [];
    let dateLocationCombinations = [];

    // loop through the current holiday list and find errors
    this.faHolidayList.controls.forEach((control, index) => {

      let dateValue = control.get('date').value;
      let count = control.get('count').value;
      let startDate = dateValue.start_date;
      let locations = control.get('locations').value

      // check for duplicate festival error
      let festivalName = control.get('description').value.toLowerCase().trim()
      if (festivalNamesArray.indexOf(festivalName) != -1) {
        duplicateFestivalNames.push(festivalName)
        duplicateFestivalIndex.push(index)
      }
      festivalNamesArray.push(festivalName)

      // check for duplicate date location combination
      if (count == 1) {
        for (let j = 0; j < locations.length; j++) {
          let date = this.convertDatefmt(new Date(startDate), 'dd-MM-yyyy');
          dateLocationCombinations.push(date + " " + locations[j]);
        }
      } else {
        for (let i = 0; i < count; i++) {
          for (let j = 0; j < locations.length; j++) {
            let date = this.convertDatefmt(new Date(startDate), 'dd-MM-yyyy');
            dateLocationCombinations.push(date + " " + locations[j]);
          }
          startDate = this.convertDatefmt(new Date(new Date(startDate).getTime() + 86400000))
        }
      }

      // check for atleast one location selected error
      if (locations.length < 1) {
        let dates = control.get('date').value;
        if (dates.start_date == dates.end_date) {
          datesWithoutAtleastOneSelection.push(this.convertDatefmt(dates.start_date, 'dd-MM-yyyy'))
        } else {
          datesWithoutAtleastOneSelection.push(this.convertDatefmt(dates.start_date, 'dd-MM-yyyy'), this.convertDatefmt(dates.end_date, 'dd-MM-yyyy'))
        }
        return
      }

    })

    // console.log(dateLocationCombinations)
    let countDateLocationCombinations = _.pickBy(_.countBy(dateLocationCombinations), (val, key) => val > 1)

    let datesWithSameLocationMultipleTimes = [];
    _.forIn(countDateLocationCombinations, (val, key) => {
      let splitVal = key.split(' ');
      datesWithSameLocationMultipleTimes.push(splitVal[0]);
    })

    datesWithSameLocationMultipleTimes = _.uniq(datesWithSameLocationMultipleTimes)

    if (datesWithoutAtleastOneSelection.length > 0) {
      this.ss.statusMessage.showStatusMessage(false, 'Atleast one location should be selected for any holiday. No location is selected for ' + datesWithoutAtleastOneSelection.toString())
      return
    }

    // if same date is having same location in multiple holidays show the below error
    if (datesWithSameLocationMultipleTimes.length > 0) {
      this.ss.statusMessage.showStatusMessage(false, 'Same locations are selected multiple times for ' + datesWithSameLocationMultipleTimes.toString())
      return
    }

    // check for same occassion name
    if (duplicateFestivalNames.length > 0) {
      duplicateFestivalIndex.forEach((idx) => {
        let control = this.faHolidayList.controls[idx].get('description')
        control.markAsTouched();
        control.setErrors({ uniqueName: true })
      })
      this.ss.statusMessage.showStatusMessage(false, "Duplicate festivals found for " + duplicateFestivalNames.join(", "));
      return
    }

    // check for duplicate dates

    // set to false always if it is new holiday list then it is resolved
    this.isNewHolidayList = false;


    let formData = new FormData()

    this.faHolidayList.value.forEach((item, index) => {
      if (!item.delete) {
        formData.append(index, JSON.stringify({
          'start_date': item.date.start_date, 'end_date': item.date.end_date,
          'holiday': item.description, 'locations': item.locations, 'holiday_year': this.selectedYear, 'holiday_count': item.count,
          'holiday_date': item.date.start_date
        }));
      }
    });

    this.http.request('post', 'update-location-holiday-cal/', '', formData).subscribe(res => {
      if (res.status == 201) {
        this.editMode = false
        this.faHolidayList = new FormArray([])
        this.getHolidayList(this.selectedYear);
      }
    })

  }

  changeYear(y) {
    this.onClickCancel()
    this.selectedYear = y.value
    this.isSelectedYearEditable = Number(this.selectedYear) >= Number(this.currentDate.getFullYear()) ? true : false;

    // if the selected year is editable
    if (this.isSelectedYearEditable) {
      let today = new Date()
      if (this.selectedYear == today.getFullYear()) {
        // set the min date for the calendar to today if current year else set to 1 Jan
        this.minDate = new Date()
      } else {
        // set the min date for the calendar to today if current year else set to 1 Jan
        this.minDate = new Date(this.selectedYear, 0, 1)
      }
      // the maxdate for the calendar when opening for date selection for a holiday row in edit mode
      this.maxDate = new Date(this.minDate.getFullYear(), 11, 31)
    }
    this.getHolidayList(y.value)
  }

  getFromTemplate() {
    this.http.request('get', 'location-holiday-cal/', `year=${this.selectedYear-1}`).subscribe(res => {
      if (res.status == 200) {
        let response = res.body['results'];
        response['holidays'].forEach(ele=>{
          ele.editable=true;
        })
        this.holidayList = response['holidays']
        this.processHolidayListResponse()
        this.onClickEdit();
      }
    })
  }

  /* open holiday pop up to show the form to select between import holidays or manually add holidays */
  openHolidayPopup() {
    this.isNewHolidayList = true;
    let dialogRef = this.dialog.open(PopUpComponent, {
      data: {
        heading: 'Add Holiday Option',
        template: this.templateHolidayForm,
        maxWidth: '500px'
      },
      restoreFocus: true
    })

    dialogRef.afterClosed().pipe(take(1)).subscribe(result => {
      if (result) {
        if (this.selectedHolidayOption == "Import from template") {
          this.holidayList = []
          this.getFromTemplate();
        } else if (this.selectedHolidayOption == "Add manually") {
          this.holidayList = []
          this.onClickEdit()
        }
      }
      this.selectedHolidayOption = null;
    })
  }

  changeSelectedYear(y) {
    this.selectedYear = y.value;

    // if the selected year is editable
    let today = new Date()

    if (this.selectedYear == today.getFullYear()) {

      // set the min date for the calendar to today if current year else set to 1 Jan
      this.minDate = new Date()

    } else {

      // set the min date for the calendar to today if current year else set to 1 Jan
      this.minDate = new Date(this.selectedYear, 0, 1)

    }

    // the maxdate for the calendar when opening for date selection for a holiday row in edit mode
    this.maxDate = new Date(this.minDate.getFullYear(), 11, 31)
  }

  processHolidayListResponse() {
    // set the day of start date and end date for each holiday (eg: Friday, Saturday)
    this.holidayList = this.holidayList.map((item) => {
      item.delete = false;
      item.startDay = WeekDay[new Date(item.start_date).getDay()];
      item.endDay = WeekDay[new Date(item.end_date).getDay()];
      return item;
    })

    // get the distinct locations that are available in this holiday list
    this.locationsInSelectedYear = [...new Set(this.holidayList.reduce((prev, curr, index, array) => {
      return prev.concat(curr.locations);
    }, []))]
    let temp = this.locations.filter((item) => {
      return this.locationsInSelectedYear.indexOf(item.id) !== -1
    })
    this.locationsInSelectedYear = temp
  }

  async getHolidayList(year = null) {

    await this.getLocation();

    this.http.request('get', 'location-holiday-cal/', 'year=' + (year || "")).subscribe(res => {
      if (res.status == 200) {
        let response = res.body['results'];
        // console.log(response)
        this.showNextYear = response["is_next_year_visible"]
        this.notifiedEmployees = response["is_confirmed"]

        this.holidayList = response['holidays']

        this.processHolidayListResponse()
      }
    })
    // console.log("holidayArrayData", this.holidayArrayData)


  }

  async getLocation() {
    var res = await this.http.request('get', 'location/').toPromise();
    if (res.status == 200) {
      // console.log("res.body['results']", res.body['results'])
      // this.headerLocation = res.body['results'] 
      this.locations = res.body['results']
    }
  }


  getDefaultHolidayList() {
    this.defaultHolidayList = []

    this.http.request('get', 'default-holiday-list/').subscribe(res => {
      if (res.status == 200) {
        // console.log("res.body['results']", res.body['results'])
        this.defaultHolidayList = res.body['results']
      }
    })

  }

  getCurrentDate() {
    this.displayedYear = []

    this.http.request('get', 'get_current_date/').subscribe(res => {
      if (res.status == 200) {
        this.currentDate = new Date(res.body['results'].date);
        // this.datePipe.transform(main_dt,'dd-MM-yyyy')
        this.selectedYear = this.currentDate.getFullYear()
        this.displayedYear.push((Number(this.currentDate.getFullYear()) - 1).toString(), this.currentDate.getFullYear(), (Number(this.currentDate.getFullYear()) + 1).toString())
      }
    })

  }


  getNextYearHoliday() {
    this.selectedYear += 1
    this.getHolidayList(this.selectedYear);
  }

  getCurrentYearHoliday() {
    this.selectedYear = this.currentDate.getFullYear()
    this.getHolidayList(this.selectedYear);
  }

  confirmHoliday() {
    let formData = new FormData()
    formData.append("year", this.selectedYear)
    this.http.request('post', 'confirm-holiday/', '', formData).subscribe(res => {
      if (res.status == 201) {
        this.ss.statusMessage.showStatusMessage(true, res.body["results"])
        this.notifiedEmployees = true
      }
      else {
        this.ss.statusMessage.showStatusMessage(false, "Error while notifying")
        this.notifiedEmployees = false
      }
    })

  }


}


// in no edit mode hide the location if atleast one holiday is not having the location selected
// format the HTML with meaning ful class names
// if past year the edit button should not be visible
// if it is next year the edit buton should be visible
// in the current year the holidays should not be editable if they are past
// 