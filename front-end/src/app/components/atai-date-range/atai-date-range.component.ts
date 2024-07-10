import { FocusMonitor } from '@angular/cdk/a11y';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ConnectionPositionPair, Overlay, OverlayPositionBuilder, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, forwardRef, HostBinding, HostListener, Input, OnInit, Optional, Output, Renderer2, Self, SimpleChange, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, FormGroupDirective, NgControl, NgForm, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CanUpdateErrorState, ErrorStateMatcher, mixinErrorState, NativeDateAdapter } from '@angular/material/core';
import { DateRange, MatCalendar, MatCalendarCell, MatCalendarCellCssClasses, MatCalendarUserEvent, MatDateSelectionModel, MatRangeDateSelectionModel, MatSingleDateSelectionModel } from '@angular/material/datepicker';
import { MatFormFieldControl } from '@angular/material/form-field';
import { Subject, Subscription, take, takeUntil } from 'rxjs';
import { AtaiBreakPoints } from 'src/app/constants/atai-breakpoints';
import { SingletonService } from 'src/app/services/singleton.service';

export type SelectionPresetTypes = Array<'Last 7 Days' | 'Last 30 Days' | 'This Month' | 'Last Month'>

/** Checks whether a node is a table cell element. */
function isTableCell(node: Node): node is HTMLTableCellElement {
  return node.nodeName === 'TD';
}
// to make the component show errors on submit of a form
class MatDateRangeCompBase {
  constructor(public _defaultErrorStateMatcher: ErrorStateMatcher,
    public _parentForm: NgForm,
    public _parentFormGroup: FormGroupDirective,
    /** @docs-private */
    public ngControl: NgControl) { }
}
const _MatDateRangeMixinBase = mixinErrorState(MatDateRangeCompBase);

@Component({
  selector: 'app-atai-date-range',
  templateUrl: './atai-date-range.component.html',
  styleUrls: ['./atai-date-range.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: MatFormFieldControl, useExisting: forwardRef(() => AtaiDateRangeComponent) }
    //   {
    //     provide: NG_VALUE_ACCESSOR,
    //     multi: true,
    //     useExisting: AtaiDateRangeComponent
    //   }
  ],

})
export class AtaiDateRangeComponent extends _MatDateRangeMixinBase implements OnInit, ControlValueAccessor, MatFormFieldControl<any>, CanUpdateErrorState {


  // mat form field error state matcher
  @Input() override errorStateMatcher: ErrorStateMatcher;

  @Input() label: string = 'Date Range';

  // whether to show the input field for the calendar (some cases we need just the date picker to be attached to some external input field)
  @Input() showInput: boolean = true;

  // whether to disable or not
  @Input() disabled: boolean = false;

  // whether to allow same date to be selected as start and end date
  @Input() allowSameDateRange: boolean = true;

  get empty() {
    let selection = this._model.selection;
    return !(!!selection.start && !!selection.end);
  }

  // the date to be in view on opening the calendar
  @Input() startDate = new Date();

  // ID attribute for the field and for attribute for the label
  @Input() idd = "daterange-picker-" + Math.floor((Math.random() * 100) + 1);

  // whether to show or hide the presets
  @Input() showPresets: boolean = true

  // whether to show or hide the presets
  @Input() presets: SelectionPresetTypes = []

  // event emitted when the date selection is completed
  @Output('dateSelected') dateSelectedEvent: EventEmitter<any> = new EventEmitter();

  // event emitted when the date selection is completed
  @Output('cancel') cancelSelection: EventEmitter<any> = new EventEmitter();

  // for mat
  @HostBinding() id = `${this.idd}`

  @ViewChild('input') inputElRef: ElementRef;

  // for compatibility for angular material
  override stateChanges = new Subject<void>();

  // set month View to minDate or maxDate
  setMonthView: 'minDate' | 'maxDate';

  // selection presets
  defaultPresets: Array<{ str: string, id: string }> = [
    { str: 'Last 7 Days', id: 'last7Days' },
    { str: 'Last 30 Days', id: 'last30Days' },
    { str: 'This Month', id: 'thisMonth' },
    { str: 'Last Month', id: 'lastMonth' },
  ]

  // selection presets
  selectionPresets: Array<{ str: string, id: string }> = this.defaultPresets;

  // boolean to track the status of the calendar is it open or closed
  isCalendarOpen: boolean = false;

  // date meta to keep track of the user selected dates
  dateMeta: { dateString?: string, selectedRange?: DateRange<any>, selectionType?: any } = { dateString: "", selectedRange: null, selectionType: null }

  // get reference to the template of the calendar for date range picker
  @ViewChild('calendarTemplate') calendarTemplateRef;

  @ViewChild('dateField') dateFieldRef: ElementRef;

  @ViewChild('iconSvg') elIconRef: ElementRef

  // the overlay reference of the overlay module
  overlayRef: OverlayRef;

  // backDrop click Subscription
  subscribeBackDropClick: Subscription;

  // To store selected year 
  year = new Date().getFullYear();

  // list of months
  listOfMonths = [" JAN ", " FEB ", " MAR ", " APR ", " MAY ", " JUN ", " JUL ", " AUG ", " SEP ", " OCT ", " NOV ", " DEC "]

  // To store selected month
  month = this.listOfMonths[new Date().getMonth()];

  //  date selection model to hold between range and single date selection
  _model: MatDateSelectionModel<any, any>

  // minimum date calendar should start
  @Input() minDate = null;

  // count for how many next days should be displayed in calendar
  daysLimit = 60;

  // maximum data calendar should start
  @Input() maxDate: Date = new Date(new Date().setDate(new Date().getDate() + this.daysLimit));

  // To store date selected
  selectedDates: Array<Date | any> = [];

  // range in between dates
  rangeInBetweenDates: Array<any> = [];

  // selected Preset reference
  selectedPresetRef: HTMLElement = null;

  // mat calendar 
  @ViewChild(MatCalendar) calendar: MatCalendar<any>;

  // dateIconWidth: number = 20;

  // for mat
  get value(): any {
    return this._model.selection;
  }
  // for mat
  set value(date: any) {
    if (date && date.start && date.start instanceof Date && date.end && date.end instanceof Date) {
      this.setCustomValue(date.start, date.end)
      this.stateChanges.next();
    }
  }

  // placeholder input
  @Input() pH: string;

  // for mat
  get placeholder() {
    return this.pH;
  }

  set placeholder(plh) {
    this.pH = plh;
    this.stateChanges.next();
  }


  // for mat
  @HostBinding('class.floating')
  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  // placeholder input
  @Input() optional: boolean;

  get required() {
    return !this.optional;
  }

  set required(req) {
    this.optional = !req;
    this.stateChanges.next();
  }

  /* 
    @param: preset  (preset type)
    @description: Method to set the dates selection to one of the preset values
  */
  setPresetValue(preset: 'Last 7 Days' | 'Last 30 Days' | 'This Month' | 'Last Month') {
    if (this.selectionPresets.map(item => item.str).indexOf(preset) != -1) {
      let presetObj = this.selectionPresets.filter(item => {
        return item.str == preset;
      })[0]
      this.dateMeta.dateString = presetObj.str;
      this.setSelection(presetObj.id)
    } else {
      console.warn("UNKNOWN date range picker PRESET VALUE");
    }
  }


  setCustomValue(start: Date, end: Date) {
    this.dateMeta.selectionType = 'custom';
    this.dateMeta.dateString = this.nativeDateAdapter.format(start, 'dd-mm-yyyy') + ' - ' + this.nativeDateAdapter.format(end, 'dd-mm-yyyy');
    this.dateMeta.selectedRange = new DateRange(start, end);
    this._model.updateSelection({ start: null, end: null } as unknown as any, this);
    this._model.add(start);
    this._model.add(end);
    // this.setSelection('custom')
    if (this.calendar) {
      this.calendar.updateTodaysDate()
    }
  }

  // for mat
  focused = false;

  // boolean to hold if the current width is less than LG (1350px)
  get is_LG_LT() {
    return this.ss.responsiveState[AtaiBreakPoints.LG_LT];
  }

  @HostBinding('attr.aria-describedby') describedBy = '';

  setDescribedByIds(ids: string[]) {
    this.describedBy = ids.join(' ');
  }

  onContainerClick(event: MouseEvent) {
    if ((event.target as Element).tagName.toLowerCase() != 'input') {
      // this.el.nativeElement.querySelector('input').focus();
    }
  }

  constructor(
    private el: ElementRef,
    private overlay: Overlay, private viewContainerRef: ViewContainerRef,
    private positionBuilder: OverlayPositionBuilder,
    private _singleModel: MatSingleDateSelectionModel<any>,
    private _rangeModel: MatRangeDateSelectionModel<any>,
    private nativeDateAdapter: NativeDateAdapter,
    private cdRef: ChangeDetectorRef,
    public override _defaultErrorStateMatcher: ErrorStateMatcher,
    private ss: SingletonService,
    @Optional() public override _parentForm: NgForm,
    @Optional() public override _parentFormGroup: FormGroupDirective,
    @Optional() @Self() public override ngControl: NgControl,
    private fm: FocusMonitor,
    private renderer: Renderer2,
    private responsive: BreakpointObserver
  ) {
    super(_defaultErrorStateMatcher, _parentForm, _parentFormGroup, ngControl)
    fm.monitor(el.nativeElement, true).subscribe(origin => {
      this.focused = !!origin;
      this.stateChanges.next();
    });
    if (ngControl) {
      // set the value accessor to the current component instance
      ngControl.valueAccessor = this;
    }
  }

  ngOnChanges(changes) {
    let presetChange: SimpleChange = changes['presets'] 
    if (presetChange && presetChange['currentValue']) {
      let presetInput = presetChange['currentValue'];
      this.selectionPresets = this.defaultPresets.filter(item => {
        return presetInput.indexOf(item.str) != -1
      })
      // console.log(this.selectionPresets)
    }
  }

  ngOnInit(): void {
    this._model = this._rangeModel;

    if (this.ngControl) {
      this.ngControl.statusChanges.subscribe((status) => {
        // console.log(status);
        this.stateChanges.next()
      })
    }

    // to set the startAt monthView
    this._model.add(new Date)
    // this._model.add(new Date)
  }


  ngAfterViewInit() {
    if (this.showInput) {
      this.renderer.listen(this.inputElRef.nativeElement, 'keydown', (e: Event) => {
        e.preventDefault();
      })
    }
    // let svgFontSize = parseInt((getComputedStyle(this.el.nativeElement.querySelector('.use-svg') as any)).fontSize);
    // this.dateIconWidth = svgFontSize * 1.5;
    // this.cdRef.detectChanges()
    // console.log(svgFontSize)
  }

  ngDoCheck() {
    if (this.ngControl) {
      this.updateErrorState();
      // this.stateChanges.next();
    }
  }

  /* 
    @param presetId the id from the above predefined preset options
    @return undefined
    @description set the selection in the calendar 
  */
  setSelection(presetId, emit: boolean = true) {

    let d = new Date();
    d.setHours(0, 0, 0, 0)
    this.dateMeta.selectionType = presetId;
    let startDate, endDate;
    switch (presetId) {
      case ('last7Days'):
        this._model.updateSelection({ start: null, end: null } as unknown as any, this);
        startDate = new Date(d.getTime() - 6 * 86400000);
        if (startDate > this.maxDate) {
          this._model.updateSelection({ start: null, end: null } as unknown as any, this)
        } else {
          let endDate = d;
          if (this.maxDate < endDate) {
            endDate = this.maxDate;
          }
          this._model.add(startDate);
          this._model.add(endDate);
        }
        this.dateMeta.selectedRange = new DateRange(this._model.selection.start, this._model.selection.end);
        if (emit) {
          this.dateSelectedEvent.emit(this.dateMeta.selectedRange)
        }
        break;
      case ('last30Days'):
        this._model.updateSelection({ start: null, end: null } as unknown as any, this);
        startDate = new Date(d.getTime() - 29 * 86400000);
        if (startDate > this.maxDate) {
          this._model.updateSelection({ start: null, end: null } as unknown as any, this)
        } else {
          let endDate = d;
          if (this.maxDate < endDate) {
            endDate = this.maxDate;
          }
          this._model.add(startDate);
          this._model.add(endDate);
        }
        this.dateMeta.selectedRange = new DateRange(this._model.selection.start, this._model.selection.end);
        if (emit) {
          this.dateSelectedEvent.emit(this.dateMeta.selectedRange)
        }
        break;
      case ('thisMonth'):
        let currentDate = d.getDate()
        if (currentDate != 1) {
          this._model.updateSelection({ start: null, end: null } as unknown as any, this);
          startDate = new Date(d.getTime() - (currentDate - 1) * 86400000)

          if (startDate > this.maxDate) {
            this._model.updateSelection({ start: null, end: null } as unknown as any, this)
          } else {
            let endDate = (d > this.maxDate) ? this.maxDate : d;
            this._model.add(startDate);
            this._model.add(endDate);
          }
          this.dateMeta.selectedRange = new DateRange(this._model.selection.start, this._model.selection.end);
          if (emit) {
            this.dateSelectedEvent.emit(this.dateMeta.selectedRange)
          }
          this.cdRef.markForCheck()
          this.cdRef.detectChanges()
        }
        break;
      case ('lastMonth'):
        // console.log('last month');
        d.setDate(1);
        let lastMonthlastDayDate = new Date(d.getTime() - 86400000)
        let lastMonthLastDay = lastMonthlastDayDate.getDate()
        this._model.updateSelection({ start: null, end: null } as unknown as any, this);
        startDate = new Date(lastMonthlastDayDate.getTime() - (lastMonthLastDay - 1) * 86400000)
        if (startDate > this.maxDate) {
          this._model.updateSelection({ start: null, end: null } as unknown as any, this)
        } else {
          let endDate = (lastMonthlastDayDate > this.maxDate) ? this.maxDate : lastMonthlastDayDate;
          this._model.add(startDate);
          this._model.add(endDate);
        }
        this.dateMeta.selectedRange = new DateRange(this._model.selection.start, this._model.selection.end);
        if (emit) {
          this.dateSelectedEvent.emit(this.dateMeta.selectedRange)
        }
        break;
      case ('custom'):
        // console.log('custom selection');
        this._model.updateSelection({ start: null, end: null } as unknown as any, this);
        let dateRange = this.dateMeta.dateString.split(' - ');
        let startDateSplit = dateRange[0].split('-') 
        let endDateSplit = dateRange[1].split('-')  
        this._model.add(new Date(Number(startDateSplit[2]),(Number(startDateSplit[1]) -1),Number(startDateSplit[0])));
        this._model.add(new Date(Number(endDateSplit[2]),(Number(endDateSplit[1]) -1),Number(endDateSplit[0]))); 
        this.dateMeta.selectedRange = new DateRange(this._model.selection.start, this._model.selection.end);
        if (emit) {
          this.dateSelectedEvent.emit(this.dateMeta.selectedRange)
        }
        break;
      default:
        // console.log('default')
        break;
    }
  }

  /* 
    @param e : Mouse click event
  */
  @HostListener('document:click', ['$event'])
  onClick(e: Event) {
    // console.log('click document')
    let target, targetId, targetIndex;
    target = e.target;
    targetId = e.target['id'];
    targetIndex = Number(target.getAttribute('data-index'));

    if (this.selectedPresetRef) {
      this.selectedPresetRef.classList.remove('selected')
    }

    let setClass = () => {
      target.classList.add('selected')
      this.selectedPresetRef = target;
      this.overlayRef.dispose()
      this.subscribeBackDropClick.unsubscribe()
    }
    if (this.selectionPresets.map(item => item.id).indexOf(targetId) != -1) {
      let preset = this.selectionPresets[targetIndex]
      this.setSelection(preset.id)
      setClass();
      this.dateMeta.dateString = preset.str;
      this.propagateChange(this._model.selection)
    }

  }


  @HostListener('document:keydown.enter', ['$event'])
  onEnter(e) {
    // console.log(e.target, this.elIconRef)
    let target = e.target;
    if (target.classList.contains('atai-date-range__calendar-icon')) {
      this.openDateRangePicker()
    } else if (target.classList.contains('selection-preset')) {
      let targetId = target['id'];
      let targetIndex = Number(target.getAttribute('data-index'));
      let setClass = () => {
        target.classList.add('selected')
        this.selectedPresetRef = target;
        this.overlayRef.dispose()
        this.subscribeBackDropClick.unsubscribe()
      }
      if (this.selectedPresetRef) {
        this.selectedPresetRef.classList.remove('selected')
      }
      let preset = this.selectionPresets[targetIndex]
      this.setSelection(preset.id)
      setClass();
      this.dateMeta.dateString = preset.str;
      this.propagateChange(this._model.selection)
      // setTimeout(() => {
      // }, 2000)
      // console.log(this.elIconRef.nativeElement,this.dateFieldRef)
      // this.elIconRef.nativeElement.focus()
    }
  }

  /* 
    @param event:Mouse click event on apply button
  */
  onClickApply() {
    this.dateMeta.selectionType = 'custom';
    this.selectedPresetRef = null;
    const selection = this._model.selection;
    if (this._model.selection.end == null) {
      this._model.selection.end = new Date(this._model.selection.start)
    }
    this.dateMeta.dateString = this.nativeDateAdapter.format(selection.start, 'dd-mm-yyyy') + ' - ' + this.nativeDateAdapter.format(selection.end, 'dd-mm-yyyy')
    this.dateSelectedEvent.emit(this.dateMeta.selectedRange)
    this.cdRef.markForCheck()
    this.propagateChange(this._model.selection)
    this.overlayRef.dispose()
    this.subscribeBackDropClick.unsubscribe()
  }

  /* 
    @param event:Mouse click event on cancel button
  */
  close() {
    // this.clearSelection(); 
    this.clearSelection()
    // as there is no change in date do not emit the dateSelected event
    this.setSelection(this.dateMeta.selectionType, false)
    this.overlayRef.dispose()
    this.cancelSelection.emit(false)
    this.subscribeBackDropClick.unsubscribe()
  }

  /* 
    @param event:on hovering over the calendar cells to show the cell in preview range
  */
  onHover(event) {
    let target = event.target
    const selection = this._model.selection;
    if (target.classList.contains('mat-calendar-body-cell') && selection.start && !selection.end) {
      let calendarBody = this.calendar.monthView._matCalendarBody;
      let matCell = this._getCellFromElement(target);
      calendarBody.previewStart = selection.start.getTime()
      calendarBody.previewEnd = matCell.compareValue
    }
  }

  onSelect(event) {

  }

  /* 
    @param element: html element which the html 
    @return matcalendar cell object
  */
  _getCellFromElement(element: HTMLElement): MatCalendarCell | null {
    let calendarBody = this.calendar.monthView._matCalendarBody;
    let cell: HTMLElement | undefined;

    if (isTableCell(element)) {
      cell = element;
    } else if (isTableCell(element.parentNode!)) {
      cell = element.parentNode as HTMLElement;
    }

    if (cell) {
      const row = cell.getAttribute('data-mat-row');
      const col = cell.getAttribute('data-mat-col');

      if (row && col) {
        return calendarBody.rows[parseInt(row)][parseInt(col)];
      }
    }

    return null;
  }

  /* 
    @param: elRef The element relative to which the date picker is positioned
  */
  openDateRangePicker(elRef?: ElementRef) {
    // this.clearSelection()
    let positions = [
      new ConnectionPositionPair({ originX: 'start', originY: 'bottom' }, { overlayX: 'start', overlayY: 'top' }),
      new ConnectionPositionPair({ originX: 'start', originY: 'top' }, { overlayX: 'start', overlayY: 'bottom' }),
      new ConnectionPositionPair({ originX: 'end', originY: 'bottom' }, { overlayX: 'end', overlayY: 'top' }),
      new ConnectionPositionPair({ originX: 'end', originY: 'top' }, { overlayX: 'end', overlayY: 'bottom' }),
    ]

    let positionStrategy = this.positionBuilder.flexibleConnectedTo(elRef || this.dateFieldRef)
      .withPositions(positions)
      .withFlexibleDimensions(false)
      .withPush(false);



    let globalPositionStrategy = this.overlay.position().global().centerHorizontally().centerVertically();

    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
      panelClass: ['atai-date-range-calendar-wrap', 'is-active'],
      positionStrategy: this.is_LG_LT ? globalPositionStrategy : positionStrategy
    })

    this.overlay.position().flexibleConnectedTo(this.dateFieldRef).withPositions

    let portalRef = new TemplatePortal(this.calendarTemplateRef, this.viewContainerRef)
    this.overlayRef.attach(portalRef)
    this.subscribeBackDropClick = this.overlayRef.backdropClick().pipe(take(1)).subscribe(() => {
      this.close()
    });
  }

  // get the date in between of the start and end dates considering the time for start and end dates is equal
  getTheDatesInBetween(start, end) {
    let startTime = start.getTime();
    let endTime = end.getTime();
    let day = 86400000;
    let tempTime = (startTime < endTime) ? (startTime + day) : (endTime + day);
    let tempEndTime = (startTime < endTime) ? endTime : startTime;
    let returnDates = [];
    while (tempTime <= tempEndTime) {
      let date = new Date(tempTime);
      if (!(date.getDate() === end.getDate() && date.getMonth() === end.getMonth() && date.getFullYear() === end.getFullYear())) {
        returnDates.push(date);
      }
      tempTime += day;
    }
    return returnDates;
  }

  // on clicking the clear selection button we clear the selected dates
  clearSelection() {
    this.selectedDates = [];
    this.dateMeta.selectedRange = null;
    this._model.updateSelection({ start: null, end: null } as unknown as any, this);
    if (this.calendar) {
      this.calendar.updateTodaysDate()
    }
  }

  _handleUserSelection(event: MatCalendarUserEvent<any | null>) {
    const selection = this._model.selection;
    const value = event.value;
    const isRange = selection instanceof DateRange;
    if (!selection.end) {
      if (selection.start) {
        let calendarBody = this.calendar.monthView._matCalendarBody;
        calendarBody.previewStart = null;
        calendarBody.previewEnd = null;
        // console.log(this.calendar.monthView._previewStart)
        let isSameDate = selection.start.toString() == value.toString();
        if (!this.allowSameDateRange && isSameDate) {
          return;
        }
        if (value) {
          // console.log("NOT SAME DATE CAN ADD IN THE DATE LIST and the IN BETWEEN DATES ALSO. CHECK IF ALREADY EXISTS TO NOT DUPLICATE")   
          // if the selected end date is less than the start then set the start to the new date
          if (value.getTime() < selection.start.getTime()) {
            this.resetRange()
            this._model.add(value);
            this.dateMeta.selectedRange = new DateRange(this._model.selection.start, this._model.selection.end);
          } else {
            this._model.add(value);
            this.dateMeta.selectedRange = new DateRange(this._model.selection.start, this._model.selection.end);
            this.onClickApply();
          }
          // console.log("DATE SELECTED RANGE SELECTION", this._model.selection)
          // this.selectedDate = value;
          // CHECK IF ANY DATE ALREADY EXISTS AND GET THE LIST OF DATES TO BE ADDED    
        }

        // else if (value) {
        //   console.log("SAME DATE SO REMOVE THE DATE FROM THE LIST OF DATES AND ALSO RESET THE DATESELECTION MODEL")
        // }
      } else {
        if (value) {
          // this.clearSelection();
          // console.log("ADD DATE TO THE SELECTION AND ALSO LIST OF DATES ")
          this._model.add(value);
          this.dateMeta.selectedRange = new DateRange(this._model.selection.start, this._model.selection.end);
        }
      }
    } else {
      if (value) {
        this._model.add(value);
        this.dateMeta.selectedRange = new DateRange(this._model.selection.start, this._model.selection.end);
        this.dateSelectedEvent.emit(this.dateMeta.selectedRange)
      }
    }

    // this.calendar.updateTodaysDate();
    // this.cdRef.detectChanges() 
  }

  // resetRange selection model
  resetRange() {
    this._model.updateSelection({ start: null, end: null } as unknown as any, this);
    this.dateMeta.dateString = "";
    this.dateMeta.selectionType = null
    this.dateMeta.selectedRange = new DateRange(null, null);
    this.dateSelectedEvent.emit(this._model.selection);
    this.cdRef.markForCheck()
  }

  changeMonth(event) {
    // we are setting selected year. 
    this.year = event.getFullYear();
    this.month = this.listOfMonths[event.getMonth()];
  }

  dateClass = (date: Date): MatCalendarCellCssClasses => {
    // calendar is disabled 
    return "";
  };

  propagateChange = (quantity) => { };

  onTouched = () => { };

  touched = false;


  writeValue(date: any) {
    // validate the date string for required format
    let regexDate = new RegExp(/(Last 7 Days|Last 30 Days|Last Month|This Month)|(\d{4}-\d{2}-\d{2} - \d{4}-\d{2}-\d{2})/);
    let isValidDate = regexDate.test(date);
    if (date && date.start && date.start instanceof Date && date.end && date.end instanceof Date) {
      this._model.updateSelection({ start: null, end: null } as unknown as any, this);
      this._model.add(new Date(date.start));
      this._model.add(new Date(date.end));
      let selection = this._model.selection
      this.dateMeta.selectedRange = new DateRange(selection.start, selection.end);
      this.dateMeta.dateString = this.nativeDateAdapter.format(selection.start, 'dd-mm-yyyy') + ' - ' + this.nativeDateAdapter.format(selection.end, 'dd-mm-yyyy')
      // if format is satisfied then set the UI and model with the selected dates
    } else {
      console.warn("THE DATE " + date + " IS NOT A VALID VALUE FOR THE DATE RANGE PICKER");
    }
  }

  registerOnChange(onChange: any) {
    this.propagateChange = onChange;
  }

  registerOnTouched(onTouched: any) {
    this.onTouched = onTouched;
  }

  setDisabledState(disabled: boolean) {
    this.disabled = disabled;
  }

  ngOnDestroy() {
    this.stateChanges.complete();
    this.fm.stopMonitoring(this.el.nativeElement);
  }

}

// The date preview during range selection is sometimes missing adding a date to preview 
// The date range should temporarily hold the User interacted data until apply or any of the preset are clicked . If cancel is clicked the date meta should be reverted to the previous selection