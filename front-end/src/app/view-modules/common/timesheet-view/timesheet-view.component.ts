import { HttpParams } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormControl, FormArray, AnyForUntypedForms } from '@angular/forms';
import { SingletonService } from './../../../services/singleton.service';
import { TimeSheetComponent } from './../../common/time-sheet/time-sheet.component';
import { HttpClientService } from 'src/app/services/http-client.service';
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, HostListener, ElementRef, TemplateRef, Renderer2, ViewChildren, QueryList } from '@angular/core';
import { isDescendant } from 'src/app/functions/isDescendent.fn';
import { emptyFormArray } from 'src/app/functions/empty-form-array.fn';
import { debounceTime, take, takeUntil } from 'rxjs/operators';
import enmTsStatus from 'src/app/enums/timesheet-status.enum';
import { fromEvent, Subject } from 'rxjs';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import { PopUpComponent } from 'src/app/components/pop-up/pop-up.component';
import { AtaiBreakPoints } from 'src/app/constants/atai-breakpoints';
import { ListKeyManager } from '@angular/cdk/a11y';
import { UP_ARROW, DOWN_ARROW, ENTER, E } from '@angular/cdk/keycodes';

@Component({
  selector: 'app-timesheet-view',
  templateUrl: './timesheet-view.component.html',
  styleUrls: ['./timesheet-view.component.scss']
})
export class TimesheetViewComponent implements OnInit {

  // subject to emit for clearing the subscriptions
  destroy$: Subject<any> = new Subject();

  // property used to enable or disable the timesheet for editing
  disableTimesheet: boolean = false;

  // property used to enable or disable the save &submit button
  disableSaveSubmit: boolean = true;

  // property used to enable or disable the wsr for editing
  disableWsr: boolean = false;

  // the reference to the timesheet
  @ViewChild(TimeSheetComponent) compTimeSheet: TimeSheetComponent;

  // reference to the active mins element
  @ViewChild('selProject') elSelProject: ElementRef;

  @ViewChild('refTimesheetWrap') elTimesheetWrap: ElementRef;

  // template ref of maanger comments
  @ViewChild('templateRefManagerComments') templateRefManagerComments: TemplateRef<any>;

  // unlisten function reference for the time sheet wrap element scroll event
  unlistenScrollTimesheetWrap: Function = null

  // reference to the all zeros in project confirmation modal pop up
  // @ViewChild('refModalProjectAllZeros') modalProjectAllZeros: ModalPopupComponent

  // reference to save submit confirmation modal pop up
  @ViewChild('refModalSaveSubmit') modalSaveSubmit: ModalPopupComponent

  // the projects in the wsr projects
  wsrProjects: Array<any> = [
  ];

  // active projects which are visible by default
  wsrActiveProjectsVisible: Array<any> = [];

  // active projects which are visible by default
  wsrActiveProjectsHidden: Array<any> = [];

  // form group to hold the wsr Projects
  fgWsrProjects: FormGroup;

  // weekly timesheet data holder
  weeklyTimeSheetData;

  // weekly status data holder
  weeklyStatusData;

  // boolean view token to show hide the select project list in wsr
  showProjectList: boolean = false;

  // boolean view token to show hide the  wsr
  showWsr: boolean = false;

  //boolean view token to show hide the  save buttons
  savedWtr: boolean = false;

  savedWsr: boolean = false;


  // boolean view token  to enable / disable wsr projects submit button
  wsrFormValidity: boolean = false;

  // property to hold the current route whether is timesheet or rejected timesheet
  timeSheetType: 'regular' | 'rejected';

  // word count int wsr should be less than or equal to 5000
  wsrCharCount: number = 0;

  // holder for the rejected timesheet and wsr data
  holderRejected: { timesheet: any, wsr: any } = { timesheet: null, wsr: null }

  // boolean to indicate whether rejected timesheet value has changed
  hasRejectedValueChange;

  // boolean to indicate if it has all zeros filled in any of the projects in timesheet
  hasAllZerosInProject: boolean = false;

  // boolean to indicate whether to proceed or stop submitting when there are all zeros in a project
  proceedWithAllZerosInProject: boolean = false;

  // propery to hold the submit type whil confirming the al zeroes in a project
  submitTypeWhileConfirmingAllZeros: string;

  // in rejected form value on load we ignore the form value changes to validate and enable the submit button. so keep initial load key
  initialWsrChange: boolean = true;

  // in rejected timesheet we need to know if the form value is changed or not
  wsrFormValueChanged: boolean = false;

  // form controls count in wsr projects active projects
  formControlsCount: number = 0;

  // the translation value to set on scroll so the title look fixed
  translateTimesheetTitle: number = 0;

  get is_MD_LT() {
    return this.ss.responsiveState[AtaiBreakPoints.MD_LT]
  }

  // Rahul changes(adding the arrow key nevigation)*******************

  public currentIndex: number = 0;
  list: number = 0;
  activeIndex;
  elements;
  @ViewChildren('select') select: QueryList<ElementRef>;
  @ViewChildren('text') text: QueryList<ElementRef>
  @ViewChildren('textarea') textarea: QueryList<ElementRef>


  public key_pressed(event) {
    // this.list= Array.from(event.target.children).length;
    this.list = this.select.toArray().length;
    console.log('hello', this.list)
    // this.users = this.keyboardEventsManager.activeItem.item.name;
    if (event.keyCode == 27)
      this.showProjectList = false;
    if (event.keyCode == 13) {
      this.showProjectList = !this.showProjectList;

      this.select.toArray().forEach(element => {
        console.log('----->', element.nativeElement.classList.value)
        console.log('&&&&&&&&&&&&', this.currentIndex);

        if (element.nativeElement.classList.contains('grey')) {
          let i;
          i = element.nativeElement.getAttribute('index');
          console.log('!!!!!!!!!!!!!@@@@@@@@@', i)
          if (i === undefined || i == NaN) {
            return
          }
          else {
            console.log("I from if ", i);
            let projectToBeAdded = this.wsrActiveProjectsHidden[i];
            this.wsrActiveProjectsVisible.push(projectToBeAdded);
            this.wsrActiveProjectsHidden.splice(i, 1);
            (<FormArray>this.fgWsrProjects.get('active_projects')).push(new FormControl(""));
            this.cd.detectChanges();
            this.textarea.get(this.wsrActiveProjectsVisible.length - 1).nativeElement.focus();
            this.showProjectList = false;

          }
        }

      });

      // passing the event to key manager so we get a change fired
      console.log('enter has been pressed')
    }

    switch (event.keyCode) { //13
      case 38: //  arrow up
        event.stopPropagation();
        event.preventDefault();
        if (this.currentIndex <= 0)
          this.currentIndex = this.list - 1;
        else
          this.currentIndex = (this.currentIndex - 1) % this.list;

        console.log('keyup', this.currentIndex);
        break;
      case 40: //  arrow down
        event.stopPropagation();
        event.preventDefault();
        this.currentIndex = (this.currentIndex + 1) % this.list;
        console.log('keydown', this.currentIndex);
        break;
      default: this.currentIndex = 0;
    }
    this.cd.detectChanges();
    this.select.toArray().forEach((ele) => {
      let i;
      i = parseInt(ele.nativeElement.getAttribute('id'));
      console.log('!!!!!!!!!!!!!!!!!!', ele.nativeElement, i);
      if (this.currentIndex == i) {
        console.log('currentIndex::::::', this.currentIndex);
        ele.nativeElement.classList.add('grey');

      } else if (this.currentIndex !== i) {

        ele.nativeElement.classList.remove('grey');
      }
      console.log('hello i am true');
    });


  }


  //***************************************************************************
  //**************************************************************************
  //****************************************************************************



  constructor(
    private http: HttpClientService,
    private cd: ChangeDetectorRef,
    private ss: SingletonService,
    private router: Router,
    private el: ElementRef,
    private dialog: MatDialog,
    private rendrer: Renderer2,


  ) {
    this.fgWsrProjects = this.ss.fb.group({
      active_projects: this.ss.fb.array([]),
      general: new FormControl('')
    });
    this.hasRejectedValueChange = this.timeSheetType != 'rejected';

  }

  ngOnInit(): void {

    // check the wsr form validation to enable or disable the submit button
    this.fgWsrProjects.valueChanges.pipe(debounceTime(500), takeUntil(this.destroy$)).subscribe(val => {
      let filled: boolean = false;
      let valueChanged = false;
      this.wsrCharCount = 0;
      // looop thhrough the active project and check if it is filled
      this.fgWsrProjects.get('active_projects').value.forEach((val, index) => {
        // if atleast one project is filled including general then enable button
        this.wsrCharCount += val.length;
        if (val.trim()) {
          filled = true;
        }
      })
      // check general project value
      let generalValue = this.fgWsrProjects.get('general').value;
      if (generalValue.trim()) {
        filled = true;
      }
      this.wsrCharCount += generalValue.length;
      this.wsrFormValidity = filled;
      if (this.timeSheetType == 'rejected') {
        if (this.initialWsrChange) {
          this.initialWsrChange = false;
        } else {
          if (!this.wsrFormValueChanged && this.formControlsCount == (<FormArray>this.fgWsrProjects.get("active_projects")).length) {
            this.wsrFormValueChanged = true;
          }
        }
      }
      this.cd.detectChanges();
      this.formControlsCount = (<FormArray>this.fgWsrProjects.get("active_projects")).length;
    })
    let url = this.router.url;

    if (url.indexOf('rejected-timesheet') >= 0) {
      this.timeSheetType = 'rejected';
    } else {
      this.timeSheetType = 'regular';
    }

    // call after the timeshet type is known
    this.getWeeklyTimeSheetData(true)
  }

  ngAfterViewInit() {
    fromEvent(this.elTimesheetWrap.nativeElement, 'scroll').pipe(takeUntil(this.destroy$)).subscribe((e) => {
      let target: HTMLElement = e['target'];
      this.translateTimesheetTitle = target.scrollLeft
    })
    // Rahul change ************************
    this.list = this.select.toArray().length;
    this.elements = this.select.toArray();

    //*********************************************
  }

  ngOnDestroy() {
    this.destroy$.next(null);
    this.destroy$.complete()
  }

  // event listener on document to check if active mins is clicked
  @HostListener("document:click", ['$event'])
  onClickDocument(e) {
    let target: any = e.target;
    let tempTarget = target;
    if (target == this.el.nativeElement || isDescendant(this.el.nativeElement, target)) {
      while (tempTarget && tempTarget != this.el.nativeElement) {
        if (tempTarget.classList.contains('wsr__sel-project-project')) {
          let index = Number(target.getAttribute("index"));
          let projectToBeAdded = this.wsrActiveProjectsHidden[index];
          this.wsrActiveProjectsVisible.push(projectToBeAdded);
          this.wsrActiveProjectsHidden.splice(index, 1);
          (<FormArray>this.fgWsrProjects.get('active_projects')).push(new FormControl(""));
          this.showProjectList = false;
          break;
        } else if (tempTarget.classList.contains('wsr__sel-project-toggle')) {
          this.showProjectList = !this.showProjectList;
          break;
        }
        tempTarget = tempTarget.parentNode;
      }
      if (tempTarget == this.el.nativeElement) {
        this.showProjectList = false;
      }
    } else {
      this.showProjectList = false;
    }
  }

  // get the weekly data from backend for timesheet
  getWeeklyTimeSheetData(initial: boolean = false) {
    let params = new HttpParams();
    let url;
    if (this.timeSheetType == 'rejected') {
      params = params.append('status', enmTsStatus.Rejected + "")
      url = "rejectedtimesheet/";
    } else {
      url = "weeklydata/";
    }

    this.http.request("get", url, params).subscribe(res => {
      if (res.status == 200) {
        this.weeklyTimeSheetData = res.body[0];

        if (initial) {
          if (this.weeklyTimeSheetData) {
            this.weeklyTimeSheetData.days.push('Total');
            // console.log(this.weeklyTimeSheetData.HOLIDAY['work_hours']);

            let holHours = this.weeklyTimeSheetData.HOLIDAY['work_hours'].map(item => item.h).reduce((prev, next) => prev + next);
            let holMins = this.weeklyTimeSheetData.HOLIDAY['work_hours'].map(item => item.m).reduce((prev, next) => prev + next);
            if (holMins >= 60) {
              holHours = holHours + Math.floor(holMins / 60);
              holMins = holMins % 60;
            }
            this.weeklyTimeSheetData.HOLIDAY['work_hours'].push({ date: "Total", enable: true, h: holHours, m: holMins });

            let grossHours = this.weeklyTimeSheetData.gross_working_hours.map(item => item.h).reduce((prev, next) => prev + next);
            let grossMins = this.weeklyTimeSheetData.gross_working_hours.map(item => item.m).reduce((prev, next) => prev + next);
            if (grossMins >= 60) {
              grossHours = grossHours + Math.floor(grossMins / 60);
              grossMins = grossMins % 60;
            }
            this.weeklyTimeSheetData.gross_working_hours.push({ date: "Total", h: grossHours, m: grossMins });

            let netHours = this.weeklyTimeSheetData.net_working_hours.map(item => item.h).reduce((prev, next) => prev + next);
            let netMins = this.weeklyTimeSheetData.net_working_hours.map(item => item.m).reduce((prev, next) => prev + next);
            if (netMins >= 60) {
              netHours = netHours + Math.floor(netMins / 60);
              netMins = netMins % 60;
            }
            this.weeklyTimeSheetData.net_working_hours.push({ date: "Total", h: netHours, m: netMins });

            let misHours = this.weeklyTimeSheetData.MISCELLANEOUS['work_hours'].map(item => item.h).reduce((prev, next) => prev + next);
            let misMins = this.weeklyTimeSheetData.MISCELLANEOUS['work_hours'].map(item => item.m).reduce((prev, next) => prev + next);
            if (misMins >= 60) {
              misHours = misHours + Math.floor(misMins / 60);
              misMins = misMins % 60;
            }

            this.weeklyTimeSheetData.MISCELLANEOUS['work_hours'].push({ date: "Total", enable: true, h: misHours, m: misMins });

            let vacHours = this.weeklyTimeSheetData.VACATION['work_hours'].map(item => item.h).reduce((prev, next) => prev + next);
            let vacMins = this.weeklyTimeSheetData.VACATION['work_hours'].map(item => item.m).reduce((prev, next) => prev + next);

            if (vacMins >= 60) {
              vacHours = vacHours + Math.floor(vacMins / 60);
              vacMins = vacMins % 60;
            }

            this.weeklyTimeSheetData.VACATION['work_hours'].push({ date: 'Total', enable: true, h: vacHours, m: vacMins });

            this.weeklyTimeSheetData.active_projects.forEach(element => {
              if (element.visibilityFlag) {
                let eleHours = element['work_hours'].map(item => item.h).reduce((prev, next) => prev + next);
                let eleMins = element['work_hours'].map(item => item.m).reduce((prev, next) => prev + next);
                if (eleMins >= 60) {
                  eleHours = eleHours + Math.floor(eleMins / 60);
                  eleMins = eleMins % 60;
                }
                element['work_hours'].push({ date: 'Total', enable: true, h: eleHours, m: eleMins });
              }
            });

            if (this.timeSheetType == 'regular') {
              if (this.weeklyTimeSheetData.enableSaveSubmit) {
                this.disableTimesheet = false;
                this.showWsr = true;
              } else {
                this.disableTimesheet = true;
                this.showWsr = true;
              }
            } else if (this.timeSheetType == 'rejected') {
              if (this.weeklyTimeSheetData.enableSaveSubmit) {
                this.disableTimesheet = false;
                this.showWsr = true;
              }
            }
          } else {
            this.weeklyTimeSheetData = false;
            this.showWsr = false;
            emptyFormArray((<FormArray>this.fgWsrProjects.get('active_projects')));
          }

        } else {
        }
      } else {
        this.weeklyTimeSheetData = false;
        this.showWsr = false;
        emptyFormArray((<FormArray>this.fgWsrProjects.get('active_projects')));
        // console.log("Disable timesheet")
      }
      if (this.weeklyTimeSheetData) {
        this.holderRejected.timesheet = { ...this.weeklyTimeSheetData }
      }
      if (initial && this.weeklyTimeSheetData) {
        this.getWeeklyStatusData();
      }
      this.cd.detectChanges();
    })
  }

  onProjectChange(data) {
    // if (data.type == 'add') {
    //   this.weeklyStatusData.active_projects.forEach(item => {
    //     if (item.project_id == data.project.project_id) {
    //       this.wsrActiveProjectsVisible.push(item);
    //       let initialValue = item.work_report;
    //       (<FormArray>this.fgWsrProjects.get('active_projects')).push(new FormControl(initialValue));
    //     }
    //   });
    // } else if (data.type == 'remove') {
    //   this.wsrActiveProjectsVisible = this.wsrActiveProjectsVisible.filter((itemVisible, index) => {
    //     if (itemVisible.project_id == data.project.project_id) {
    //       (<FormArray>this.fgWsrProjects.get('active_projects')).removeAt(0);
    //     }
    //     return itemVisible.project_id != data.project.project_id;
    //   })
    // }
  }

  openManagerComments() {
    let dialogRef = this.dialog.open(PopUpComponent, {
      data: {
        heading: 'Manager Comments',
        hideFooterButtons: true,
        template: this.templateRefManagerComments,
        maxWidth: '500px'
      },
      restoreFocus: true
    })
  }

  // on change timesheet entries
  onTimeSheetChange(data) {
    if (this.timeSheetType == 'rejected') {
      this.hasRejectedValueChange = data.hasValueChanged;
    }
    this.disableSaveSubmit = !data.canFinalSubmit;
    this.hasAllZerosInProject = data.hasAllZerosInProject;
    this.cd.detectChanges();
  }

  // get the projects for the employee
  getProjects() {
    this.http.request("get", "projects/").subscribe(res => {
      if (res.status == 200) {
        // console.log(res)
      }
    });
  }

  // checking disbale for save-submit button
  showDisable() {
    if (!this.disableSaveSubmit && this.wsrCharCount < 5000 && this.wsrCharCount > 0) {
      return false;
    }
    else {
      return true;
    }
  }

  confirmSaveSubmit() {
    let dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        confirmMessage: 'Are you sure you want to proceed ?'
      },
      restoreFocus: true
    })
    dialogRef.afterClosed().pipe(take(1)).subscribe((result) => {
      console.log(result)
      if (!result) {
        // on click cancel
      } else {
        // on click proceed
        this.disableSaveSubmit = true;
        this.submitTypeWhileConfirmingAllZeros = 'save-submit';
        this.onSubmitWsr('save-submit');
        this.onSubmitTimeSheet('save-submit'); // Moulali -added this to fix post issues
      }
    })
  }

  // on clicking proceed of save submit popup
  proeceedSaveSubmit() {
    this.disableSaveSubmit = true;
    this.modalSaveSubmit.close();
    this.submitTypeWhileConfirmingAllZeros = 'save-submit';
    this.onSubmitWsr('save-submit');
    // this.onSubmitTimeSheet('save-submit')
  }

  // on clicking submit to submit timesheet
  onSubmitTimeSheet(type) {
    if (type == 'save') {
      this.savedWtr = true;
    }
    var sendRequest = (type) => {
      let params = new HttpParams();
      if (this.timeSheetType == 'rejected') {
        params = params.append('previousweek', "1");
      }
      let timesheet = this.compTimeSheet.getTimeSheetData();
      this.http.request("post", "weeklydata/", params, [timesheet]).subscribe(res => {
        if (res.status == 201) {
          if (type == 'save') {
            this.savedWtr = false;
          }
          this.ss.statusMessage.showStatusMessage(true, "Successfully saved the timesheet");
          if (type == 'save') {
            this.onSubmitWsr(type);
          }
          if (type == 'save-submit') {
            if (this.timeSheetType == 'regular') {
              this.showWsr = true;
            }
          }
          if (this.timeSheetType == 'regular') {
            this.getWeeklyTimeSheetData(true);
            this.getWeeklyStatusData();
          }
          else {
            this.http.request("get", 'statuswisetimesheetcount/').subscribe(res => {
              if (res.status == 200) {
                let pendingApprovalCount = 0;
                let rejectedCount = 0;
                let timesheetsData = res.body;
                pendingApprovalCount = timesheetsData.pending_cnt + timesheetsData.entry_complaince_cnt;
                rejectedCount = timesheetsData.rejected_cnt;
                this.ss.resTimeSheet$.next({
                  rc: rejectedCount,
                  pac: pendingApprovalCount
                })
              }
            })
          }
        } else {
          if (type == 'save') {
            this.savedWtr = false;
          }
          this.ss.statusMessage.showStatusMessage(false, "Something went wrong")
          if (this.timeSheetType == 'regular') {
            this.getWeeklyTimeSheetData(true);
            this.getWeeklyStatusData();
          }
        }
        this.cd.detectChanges();
      });
    }
    this.submitTypeWhileConfirmingAllZeros = type;
    if (this.hasAllZerosInProject) {
      if (this.proceedWithAllZerosInProject) {
        this.proceedWithAllZerosInProject = false;
        sendRequest(this.submitTypeWhileConfirmingAllZeros);
      } else {
        if (type == 'save-submit') {
          this.proceedWithAllZerosInProject = true;
          sendRequest(type); // Moulali -added this to fix post issues
        }
        else {
          // this.modalProjectAllZeros.open();
          this.confirmSubmit();
        }
      }
    } else {
      sendRequest(type);
    }

  }

  confirmSubmit() {
    let dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        confirmMessage: 'One or more projects are having all entries as zero. Are you sure you want to proceed?'
      },
      restoreFocus: true
    })
    dialogRef.afterClosed().pipe(take(1)).subscribe((result) => {
      console.log(result)
      if (!result) {
        // on click cancel in the modal pop up of confirm all zeros in project
        this.proceedWithAllZerosInProject = false;
        this.savedWtr = false;
        this.savedWsr = false;
      } else {
        // on click proceed in the modal pop up of confirm all zeros in project
        this.proceedWithAllZerosInProject = true;
        if (this.timeSheetType == 'rejected') {
          this.onSubmitWsr('save-submit');
        } else {
          this.onSubmitTimeSheet(this.submitTypeWhileConfirmingAllZeros)
        }

      }
    })
  }

  // to ge tthe wsr data from backend
  getWeeklyStatusData() {
    let params = new HttpParams();
    let url;
    if (this.timeSheetType == 'rejected') {
      params = params.append('previousweek', "1")
      url = "rejectedweeklystatus/";
    } else {
      url = "weeklystatus/";
    }
    this.http.request("get", url, params).subscribe(res => {
      if (res.status == 200) {
        this.weeklyStatusData = res.body[0];
        this.wsrActiveProjectsVisible = [];
        this.wsrActiveProjectsHidden = [];
        emptyFormArray((<FormArray>this.fgWsrProjects.get('active_projects')));
        if (!this.weeklyTimeSheetData.enableSaveSubmit) {
          this.weeklyStatusData.active_projects.forEach((item) => {
            if (item.visibilityFlag) {
              this.wsrActiveProjectsVisible.push(item);
              (<FormArray>this.fgWsrProjects.get('active_projects')).push(new FormControl(item.work_report));
            } else {
              this.wsrActiveProjectsHidden.push(item)
            }
          });
          this.fgWsrProjects.get('general').setValue(this.weeklyStatusData['GENERAL'].work_report)
          this.fgWsrProjects.disable()
        } else {
          this.weeklyStatusData.active_projects.forEach((item) => {
            if (item.visibilityFlag) {
              this.wsrActiveProjectsVisible.push(item);
              let initialValue = "";
              // if (this.timeSheetType == 'rejected') {
              initialValue = item.work_report;
              // }
              (<FormArray>this.fgWsrProjects.get('active_projects')).push(new FormControl(initialValue));
            } else {
              this.wsrActiveProjectsHidden.push(item)
            }
          });
          // if (this.timeSheetType == 'rejected') {
          this.fgWsrProjects.get('general').setValue(this.weeklyStatusData['GENERAL'].work_report);
          // }
        }
        if (this.weeklyTimeSheetData) {
          this.holderRejected.wsr = { ...this.weeklyTimeSheetData };
        }

        this.cd.detectChanges();
      }
    });
  }

  checkWsrSubmitEnable() {
    let returnValue;
    if (this.timeSheetType == 'regular') {
      returnValue = (this.wsrCharCount < 5000 && this.wsrCharCount > 0 && this.wsrFormValidity)
    } else {
      returnValue = (this.wsrCharCount < 5000 && this.wsrCharCount > 0 && this.wsrFormValidity && !this.disableSaveSubmit && (this.hasRejectedValueChange || this.wsrFormValueChanged))
    }
    return returnValue;
  }

  // on submitting the wsr form
  onSubmitWsr(type) {
    if (type == 'save') {
      this.savedWsr = true;
    }
    var sendRequest = () => {
      let params = new HttpParams();
      if (this.timeSheetType == 'rejected') {
        params = params.append('previousweek', "1")
      }
      // if atleast one wsr is finished
      // build the request body
      let requestBody: any = {};
      requestBody.wsr_date = this.weeklyTimeSheetData.days[6]
      requestBody.weekly_status = []
      this.wsrActiveProjectsVisible.forEach((item, index) => {
        requestBody.weekly_status.push(
          {
            project_id: item.project_id,
            report: this.fgWsrProjects.get('active_projects').value[index]
          }
        );
      });
      requestBody.weekly_status.push(
        {
          project_id: this.weeklyStatusData['GENERAL'].project_id,
          report: this.fgWsrProjects.get('general').value
        }
      );
      if (type == 'save') {
        requestBody.is_final_submit = false;
      }
      else {
        requestBody.is_final_submit = true;
      }
      this.http.request("post", "weeklystatus/", params, requestBody).subscribe(res => {
        if (res.status == 201) {
          if (type == 'save') {
            this.savedWsr = false;
          }
          this.ss.statusMessage.showStatusMessage(true, "Successfully saved the weekly status report");
          this.getWeeklyTimeSheetData(true);
          if (this.timeSheetType == 'rejected') {
            this.ss.menu$.next({
              key: 'rejected-timesheet',
              value: false
            })
          }
          this.cd.detectChanges();
        } else {

        }
      });
    }


    if (this.timeSheetType == 'rejected') {
      if (this.hasAllZerosInProject) {
        if (this.proceedWithAllZerosInProject) {
          this.proceedWithAllZerosInProject = false;
          this.hasAllZerosInProject = false;
          this.onSubmitTimeSheet('save-submit');
          sendRequest();
        } else {
          // this.modalProjectAllZeros.open();
          this.confirmSubmit();
        }
      } else {
        this.onSubmitTimeSheet('save-submit');
        sendRequest();
      }
    } else {
      if (type == 'save-submit') {
        this.proceedWithAllZerosInProject = false;
      }
      sendRequest();
    }
  }

}

// for rejected the submit button should be enabled only when there is a change in timesheet and wsr(on revert also enable submit for wsr change)
