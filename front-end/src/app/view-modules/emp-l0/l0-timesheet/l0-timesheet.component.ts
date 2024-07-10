import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormControl, FormArray } from '@angular/forms';
import { SingletonService } from './../../../services/singleton.service';
import { TimeSheetComponent } from './../../common/time-sheet/time-sheet.component';
import { HttpClientService } from 'src/app/services/http-client.service';
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, HostListener, ElementRef } from '@angular/core';
import { isDescendant } from 'src/app/functions/isDescendent.fn';
import { emptyFormArray } from 'src/app/functions/empty-form-array.fn';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-l0-timesheet',
  templateUrl: './l0-timesheet.component.html',
  styleUrls: ['./l0-timesheet.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class L0TimesheetComponent implements OnInit {

  // subject to emit for clearing the subscriptions
  destroy$:Subject<any> = new Subject();

  // property used to enable or disable the timesheet for editing
  disableTimesheet: boolean = false; 

  // property used to enable or disable the wsr for editing
  disableWsr: boolean = false;

  // the reference to the timesheet
  @ViewChild(TimeSheetComponent) compTimeSheet: TimeSheetComponent;

  // reference to the active mins element
  @ViewChild('selProject') elSelProject: ElementRef;

  // boolean token to enable save-submit button
  enableSaveSubmit: boolean = false;

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

  // boolean view token  to enable / disable wsr projects submit button
  enableWsrSubmit: boolean = false;

  // property to hold the current route whether is timesheet or rejected timesheet
  timeSheetType : 'regular'|'rejected';

  constructor(
    private http: HttpClientService,
    private cd: ChangeDetectorRef,
    private ss: SingletonService,
    private router:Router
  ) {
    this.fgWsrProjects = this.ss.fb.group({
      active_projects: this.ss.fb.array([]),
      general: new FormControl('')
    })
  }

  ngOnInit(): void {
    this.getWeeklyTimeSheetData(true)

    // check the wsr form validation to enable or disable the submit button
    this.fgWsrProjects.valueChanges.pipe(debounceTime(500),takeUntil(this.destroy$)).subscribe(val => {
      let filled: boolean = false;
      // looop thhrough the active project and check if it is filled
      this.fgWsrProjects.get('active_projects').value.forEach((val, index) => {
        // if atleast one project is filled including general then enable button
        if (val.trim()) {
          filled = true;
        }
      })
      if (this.fgWsrProjects.get('general').value.trim()) {
        filled = true;
      }
      this.enableWsrSubmit = filled;
      console.log(this.fgWsrProjects.value);

    })
    let url = this.router.url;

    if(url.indexOf('rejected-timesheet') >= 0){
      this.timeSheetType = 'rejected';
    }else{
      this.timeSheetType = 'regular';
    } 
  }

  ngOnDestroy(){
    this.destroy$.next(null);
  }

  // event listener on document to check if active mins is clicked
  @HostListener("document:click", ['$event'])
  onClickDocument(e) {
    let target: any = e.target;
    if (this.elSelProject) {
      if (target == this.elSelProject.nativeElement) {
        this.showProjectList = !this.showProjectList;
      } else if (isDescendant(this.elSelProject.nativeElement, target) && target.classList.contains('sel-project__project')) {
        let index = Number(target.getAttribute("index"));
        let projectToBeAdded = this.wsrActiveProjectsHidden[index];
        this.wsrActiveProjectsVisible.push(projectToBeAdded);
        this.wsrActiveProjectsHidden.splice(index, 1);
        (<FormArray>this.fgWsrProjects.get('active_projects')).push(new FormControl(""));
        this.showProjectList = false;
      } else {
        this.showProjectList = false;
      }
    }
  }

  // get the weekly data from  backend for timesheet
  getWeeklyTimeSheetData(initial:boolean = false) {
    this.http.request("get", "weeklydata/").subscribe(res => {
      if (res.status == 200) {
        this.weeklyTimeSheetData = res.body[0];
        if (!this.weeklyTimeSheetData.enableSaveSubmit) {
          this.disableTimesheet = true; 
          this.showWsr=true;
        } else {
          if(initial){
            this.disableTimesheet = false; 
          }else{
            this.disableTimesheet = true; 
          }

        }
      } else {
        this.weeklyTimeSheetData = false;
        this.disableTimesheet = true; 
        console.log("Disable timesheet")
      }
      if(initial){
        this.getWeeklyStatusData();
      }
      this.cd.detectChanges();
    })
  }

  // get the projects for the employee
  getProjects() {
    this.http.request("get", "projects/").subscribe(res => {
      if (res.status == 200) {
        console.log(res)
      }
    });
  }

  // on clicking submit to submit timesheet
  onSubmitTimeSheet(type) {
    let timesheet = this.compTimeSheet.getTimeSheetData();
    this.http.request("post", "weeklydata/", "", [timesheet]).subscribe(res => {
      if (res.status == 201) {
        this.ss.statusMessage.showStatusMessage(true, "Successfully saved the timesheet");
        this.disableTimesheet = true; 
        this.showWsr = true;
        this.getWeeklyTimeSheetData();
      } else {

      }
      this.cd.detectChanges();
    });
  }

  // to ge tthe wsr data from backend
  getWeeklyStatusData() {
    this.http.request("get", "weeklystatus/").subscribe(res => {
      if (res.status == 200) {
        this.weeklyStatusData = res.body[0];
        this.wsrActiveProjectsVisible = [];
        this.wsrActiveProjectsHidden = [];
        emptyFormArray((<FormArray>this.fgWsrProjects.get('active_projects')));
        if(!this.weeklyTimeSheetData.enableSaveSubmit){
          this.weeklyStatusData.active_projects.forEach((item) => {
            if (item.visibilityFlag) {
              this.wsrActiveProjectsVisible.push(item);
              (<FormArray>this.fgWsrProjects.get('active_projects')).push(new FormControl(item.work_report));
            }else {
              // this.wsrActiveProjectsHidden.push(item)
            }
          });
          this.fgWsrProjects.get('general').setValue(this.weeklyStatusData['GENERAL'].work_report)
          this.fgWsrProjects.disable()
        }else{
          this.weeklyStatusData.active_projects.forEach((item) => {
            if (item.visibilityFlag) {
              this.wsrActiveProjectsVisible.push(item);
              (<FormArray>this.fgWsrProjects.get('active_projects')).push(new FormControl(""));
            } else {
              this.wsrActiveProjectsHidden.push(item)
            }
          });
        }
        this.cd.detectChanges();
      }
    });
  }

  // on submitting the wsr form
  onSubmitWsr() {
    // if atleast one wsr is finished 
    if (this.enableWsrSubmit) {
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
      console.log(requestBody)
      this.http.request("post", "weeklystatus/", "", requestBody).subscribe(res => {
        if (res.status == 201) {
          this.disableWsr = true;
          this.ss.statusMessage.showStatusMessage(true, "Successfully saved the weekly status report");
          this.getWeeklyStatusData();
          this.cd.detectChanges();
        } else {

        }
      });
    }
  }

}
