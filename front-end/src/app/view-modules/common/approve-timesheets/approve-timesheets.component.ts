import { ModalPopupComponent } from './../../../components/modal-popup/modal-popup.component';
import { SingletonService } from 'src/app/services/singleton.service';
import { Component, OnInit, HostListener, ElementRef, ViewChild, TemplateRef } from '@angular/core';
import { PageEvent, MatPaginator } from '@angular/material/paginator';
import { fromEvent, Subject, take, takeUntil } from 'rxjs';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { HttpClientService } from 'src/app/services/http-client.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PopUpComponent } from 'src/app/components/pop-up/pop-up.component';
import { AtaiBreakPoints } from 'src/app/constants/atai-breakpoints';

@Component({
  selector: 'app-approve-timesheets',
  templateUrl: './approve-timesheets.component.html',
  styleUrls: ['./approve-timesheets.component.scss']
})
export class ApproveTimesheetsComponent implements OnInit {

  // subject to emit for clearing the subscriptions
  destroy$: Subject<any> = new Subject();

  // template ref element for the modal pop up of reject comments
  @ViewChild('refModalRejectComments') modalRejectComments: ModalPopupComponent;

  @ViewChild('refModalApproveComments') modalApproveComments: ModalPopupComponent;

  // template ref element for the modal pop up of view wsr
  @ViewChild('refModalViewWsr') modalViewWsr: ModalPopupComponent;

  @ViewChild('refTimesheetWrap') elTimesheetWrap: ElementRef;

  // form group for search form
  fgSearch: FormGroup;

  // rejection comments form group 
  fgRejectionComments: FormGroup;

  //coments form reference to reset the form
  @ViewChild('commentForm') commentForm;

  // wsr pop up reference
  @ViewChild('templateRefWSRData') templateRefWSRData: TemplateRef<any>;

  // reject timesheet pop up reference
  @ViewChild('templateRefRejectTimeSheet') templateRejectTimesheet: TemplateRef<any>;

  //updating the page no
  page = 1;

  //filter for timesheets
  filterArray: any = [{ 'Name': 'All', value: -1 }, { 'Name': 'Pending', value: 0 }, { 'Name': 'Approved', value: 1 }, { 'Name': 'Rejected', value: 2 }, { 'Name': 'NC', value: 3 }]

  //Enable flag for all buttons 
  enableFlag: boolean;

  //sending request post to backend
  requestBody: any = {};

  //counting status of each employee with the following variables
  pendingApprovalCount = 0;
  rejectedCount = 0;

  // all timesheets data
  timesheetsData: Array<any> = [];

  //paginator ref
  @ViewChild('refPaginator') refPaginator: MatPaginator;

  // emp wsr data
  wsrData: Array<any> = [];
  showMessage:boolean = false;

  // reference to the dialog component for wsr data viewing
  dialogRef: MatDialogRef<any> = null;

  // the translation value to set on scroll so the title look fixed
  translateTimesheetTitle:number = 0;

  //timesheets length
  totalTimesheetsLength = 0;
  // timesheetsData: Array<any> = [
  //   {
  //     emp_name: "Name",
  //     week_number: 18,
  //     days: ["2020-05-02", "2020-05-03", "2020-05-04", "2020-05-05", "2020-05-06", "2020-05-07", "2020-05-08"],
  //     active_projects: [
  //       {
  //         project_name: "test 1",
  //         work_hours: [{ h: 0, m: 15 }, { h: 7, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 8, m: 15 }]
  //       }
  //     ],
  //     "VACATION": {
  //       work_hours: [{ h: 0, m: 15 }, { h: 7, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 8, m: 15 }]
  //     },
  //     "MISCELLANEOUS": {
  //       work_hours: [{ h: 0, m: 15 }, { h: 7, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 8, m: 15 }]
  //     }
  //   },
  //   {
  //     emp_name: "Name 2",
  //     week_number: 18,
  //     days: ["2020-05-02", "2020-05-03", "2020-05-04", "2020-05-05", "2020-05-06", "2020-05-07", "2020-05-08"],
  //     active_projects: [
  //       {
  //         project_name: "test 1",
  //         work_hours: [{ h: 0, m: 15 }, { h: 7, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 8, m: 15 }]
  //       }
  //     ],
  //     "VACATION": {
  //       work_hours: [{ h: 0, m: 15 }, { h: 7, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 8, m: 15 }]
  //     },
  //     "MISCELLANEOUS": {
  //       work_hours: [{ h: 0, m: 15 }, { h: 7, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 8, m: 15 }]
  //     }
  //   },
  //   {
  //     emp_name: "Name 3",
  //     week_number: 18,
  //     days: ["2020-05-02", "2020-05-03", "2020-05-04", "2020-05-05", "2020-05-06", "2020-05-07", "2020-05-08"],
  //     active_projects: [
  //       {
  //         project_name: "test 1",
  //         work_hours: [{ h: 0, m: 15 }, { h: 7, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 8, m: 15 }]
  //       }
  //     ],
  //     "VACATION": {
  //       work_hours: [{ h: 0, m: 15 }, { h: 7, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 8, m: 15 }]
  //     },
  //     "MISCELLANEOUS": {
  //       work_hours: [{ h: 0, m: 15 }, { h: 7, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 8, m: 15 }]
  //     }
  //   },
  //   {
  //     emp_name: "Name 4",
  //     week_number: 18,
  //     days: ["2020-05-02", "2020-05-03", "2020-05-04", "2020-05-05", "2020-05-06", "2020-05-07", "2020-05-08"],
  //     active_projects: [
  //       {
  //         project_name: "test 1",
  //         work_hours: [{ h: 0, m: 15 }, { h: 7, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 8, m: 15 }]
  //       }
  //     ],
  //     "VACATION": {
  //       work_hours: [{ h: 0, m: 15 }, { h: 7, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 8, m: 15 }]
  //     },
  //     "MISCELLANEOUS": {
  //       work_hours: [{ h: 0, m: 15 }, { h: 7, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 0, m: 15 }, { h: 8, m: 15 }]
  //     }
  //   }
  // ];

  // mat paginator settings
  paginator: any = {
    length: 3,
    pageSize: 9,
    pageSizeOptions: [3, 6, 9]
  }

  constructor(
    private el: ElementRef,
    private ss: SingletonService,
    private http: HttpClientService,
    private dialog: MatDialog
  ) {

    this.fgSearch = this.ss.fb.group({
      filtervalue: ["", [Validators.required]],
    })
    this.fgRejectionComments = this.ss.fb.group({
      comments: ["", [Validators.required]],
    })

  }

  ngOnInit(): void {
    this.fgSearch.controls['filtervalue'].setValue(-1);
    this.onSubmitSearch(-1, 1, this.paginator.pageSize);
  }


  ngAfterViewInit(){ 
    fromEvent(this.elTimesheetWrap.nativeElement,'scroll').pipe(takeUntil(this.destroy$)).subscribe((e)=>{
      let target:HTMLElement = e['target'];
      this.translateTimesheetTitle = target.scrollLeft
      // console.log(target.scrollLeft,target.scrollWidth)
    })
  }
  // onclicking the host
  @HostListener('click', ['$event'])
  onClickHost(e: Event) {
    let target = e.target;
    let tempTarget: any = target;
    while (tempTarget != this.el.nativeElement) {
      if (tempTarget.classList.contains('timesheet__approve')) {
        // console.log("approve")
        break;
      } else if (tempTarget.classList.contains('timesheet__reject')) {
        // console.log("reject")
        // this.modalRejectComments.open();
        break;
      }
      tempTarget = tempTarget.parentNode;
    }
  }
// Rahul change(adding class for making the input field right aligned for<550px)*****
get is_XS(){
  return this.ss.responsive.isMatched(AtaiBreakPoints.XS)
}
//****************************************************************************
  // on submitting the search by filter form
  onSubmitSearch(value, page, count, change?) {
    if (change == 1) {
      if (this.refPaginator)
        this.refPaginator.firstPage();
    }
    this.http.request("get", 'employeeswstdata/', 'status=' + value + '&page=' + page + '&itms_per_page=' + this.paginator.pageSize).subscribe(res => {
      if (res.status == 200) {
        this.timesheetsData = res.body['results'];
        this.showMessage = true
        // console.log(':::::::::::::::',this.timesheetsData);
        for (let i = 0; i < this.timesheetsData.length; i++) {

          let totHoliHours = this.timesheetsData[i]['HOLIDAY'].work_hours.map(item => item.h).reduce((prev, next) => prev + next);
          let totHoliMins = this.timesheetsData[i]['HOLIDAY'].work_hours.map(item => item.m).reduce((prev, next) => prev + next);
          this.timesheetsData[i]['HOLIDAY'].work_hours.push(this.projectWeekTotal(this.timesheetsData[i]['HOLIDAY'].work_hours, true));

          let totVacHours = this.timesheetsData[i]['VACATION'].work_hours.map(item => item.h).reduce((prev, next) => prev + next);
          let totVacMins = this.timesheetsData[i]['VACATION'].work_hours.map(item => item.m).reduce((prev, next) => prev + next);
          this.timesheetsData[i]['VACATION'].work_hours.push(this.projectWeekTotal(this.timesheetsData[i]['VACATION'].work_hours, true));

          let totMisHours = this.timesheetsData[i]['MISCELLANEOUS'].work_hours.map(item => item.h).reduce((prev, next) => prev + next);
          let totMisMins = this.timesheetsData[i]['MISCELLANEOUS'].work_hours.map(item => item.m).reduce((prev, next) => prev + next);
          this.timesheetsData[i]['MISCELLANEOUS'].work_hours.push(this.projectWeekTotal(this.timesheetsData[i]['MISCELLANEOUS'].work_hours, true));

          this.timesheetsData[i]['gross_working_hours'].push(this.projectWeekTotal(this.timesheetsData[i]['gross_working_hours'], true));
          this.timesheetsData[i]['net_working_hours'].push(this.projectWeekTotal(this.timesheetsData[i]['net_working_hours'], true));

          let activeProjects = this.timesheetsData[i]['active_projects'];
          this.timesheetsData[i]['projectSubTotal'] = [0, 1, 2, 3, 4, 5, 6].map(idx => this.getSubTotal(activeProjects, idx, true));

          let proj_work = [];
          let proj_work_hours = [];

          this.timesheetsData[i]['active_projects'].forEach(element => {
            element.work_hours.forEach(element1 => {
              proj_work_hours.push(element1);
            });
          });
          // console.log("---------", proj_work_hours, i);

          let projects_total_hours = [[], [], [], [], [], [], []]
          this.timesheetsData[i]['active_projects'].forEach(element => {
            element.work_hours.push(this.projectWeekTotal(element.work_hours, true));
            for (let k = 0; k < 7; k++) {
              projects_total_hours[k].push(element.work_hours[k]);
            }
          });
          this.timesheetsData[i]['total_highlight'] = []
          this.timesheetsData[i]['total_project_work_mins'] = []
          let daywise_projects_total_hours = this.getProjectTotal(projects_total_hours)
          let gross_working_hours = this.timesheetsData[i]['gross_working_hours']

          for (let k = 0; k < 7; k++) {
            if ((this.ss.attendanceFlag == true) && (gross_working_hours[k]['h'] * 60 + gross_working_hours[k]['m']) == 0 && daywise_projects_total_hours[k] > 0) {
              this.timesheetsData[i]['total_highlight'].push(true)
              this.timesheetsData[i]['total_project_work_mins'].push([true, daywise_projects_total_hours[k]])
            } else {
              this.timesheetsData[i]['total_highlight'].push(false)
              this.timesheetsData[i]['total_project_work_mins'].push([false, daywise_projects_total_hours[k]])
            }
          }

          // let daywise_projects_total_hours = projects_total_hours.map(item => item.h).reduce((prev, next) => prev + next);

          let totProjHours = proj_work_hours.map(item => item.h).reduce((prev, next) => prev + next);
          let totProjMins = proj_work_hours.map(item => item.m).reduce((prev, next) => prev + next);


          if (totProjMins >= 60) {
            totProjHours = totProjHours + Math.floor(totProjMins / 60);
            totProjMins = totProjMins % 60;
          }
          // console.log(active);
          this.timesheetsData[i].projSubTotal = ("00" + totProjHours).slice(-JSON.stringify(totProjHours).length) + ' : ' + ("00" + totProjMins).slice(-2)
          let allProjTotalHours = totProjHours + totHoliHours + totMisHours + totVacHours;
          let allProjTotalMins = totProjMins + totMisMins + totHoliMins + totVacMins;
          if (allProjTotalMins >= 60) {
            allProjTotalHours = allProjTotalHours + Math.floor(allProjTotalMins / 60);
            allProjTotalMins = allProjTotalMins % 60;
          }
          this.timesheetsData[i].allProjTotal = ("00" + allProjTotalHours).slice(-JSON.stringify(allProjTotalHours).length) + ' : ' + ("00" + allProjTotalMins).slice(-2)
          this.timesheetsData[i].days.push('Total')
        }
        this.enableFlag = res.body['enableFlag'];
        this.totalTimesheetsLength = res.body['total'];
      }
    })
    this.http.request("get", 'statuswisetimesheetcount/').subscribe(res => {
      if (res.status == 200) {

        let timesheetsData = res.body;
        this.pendingApprovalCount = timesheetsData.pending_cnt + timesheetsData.entry_complaince_cnt;
        this.rejectedCount = timesheetsData.rejected_cnt;
        
        this.filterArray = 
        [{ 'Name': 'All ', value: -1 }, 
        { 'Name': 'Pending ' + '('+timesheetsData.pending_cnt  + ')', value: 0 }, 
        { 'Name': 'Approved '+ '('+(timesheetsData.approved_cnt?? 0 )+ ')', value: 1 }, 
        { 'Name': 'Rejected '+ '('+this.rejectedCount + ')', value: 2 }, 
        { 'Name': 'NC ' + '('+(timesheetsData.entry_complaince_cnt?? 0 )+ ')', value: 3 }]
        

        this.ss.resTimeSheet$.next({
          rc: this.rejectedCount,
          pac: this.pendingApprovalCount
        })
      }
    })

  }

  /* when resolutiion or view wsr buttons are clicked events are emitted from time sheet */
  onEventEmitTimeSheet(data) {
    if (data.event == 'view') {
      this.viewWSR(data.data.empId)
    } else if (data.event == 'approve') { 
      let dataObj = data.data
      this.onClickApprove(dataObj.wkNo, dataObj.empId, dataObj.year, 1)
    } else if (data.event == 'reject') { 
      let dataObj = data.data
      this.onClickApprove(dataObj.wkNo, dataObj.empId, dataObj.year, 2)
    }
  }

  //on clicking view wsr show wsr of emp
  viewWSR(empId) {
    this.http.request("get", 'getwsr/', 'empid=' + empId).subscribe(res => {
      if (res.status == 200) {
        this.wsrData = res.body;
      }
      this.dialogRef = this.dialog.open(PopUpComponent, {
        panelClass: 'cdk-backdrop-darker',
        data:{
          template:this.templateRefWSRData,
          hideFooterButtons:true,
          showCloseButton:true,
          heading:'Weekly Status Report',
          maxWidth:'780px'
        },
        restoreFocus:true
      })
      this.dialogRef.afterClosed().pipe(take(1)).subscribe((result) => {

      })
    })
  }

  // on page change of the pagination for the timesheets
  onChangePage(e: PageEvent) {
    // console.log(e);

    this.page = this.page + e.pageIndex - e.previousPageIndex;
    this.paginator.pageSize = e.pageSize;
    this.onSubmitSearch(this.fgSearch.value.filtervalue, this.page, e.pageSize)
  }

  //on clicking on approve or reject
  onClickApprove(work_week, emp_id, year, status, i = undefined) {

    this.requestBody = {};
    this.requestBody.work_week = work_week;
    this.requestBody.emp_id = emp_id;
    this.requestBody.status = status;
    this.requestBody.year = year;
    this.requestBody.attendance_ts_approved_dates = []
    this.requestBody.attendance_ts_work_minutes = []
    // console.log(this.requestBody);
    var attendance_data_confict = false
    if (i != undefined) {
      for (let j = 0; j < this.timesheetsData[i]['total_project_work_mins'].length; j++) {
        if (this.timesheetsData[i]['total_project_work_mins'][j][0] == true) {
          this.requestBody.attendance_ts_approved_dates.push(this.timesheetsData[i]['days'][j])
          this.requestBody.attendance_ts_work_minutes.push(this.timesheetsData[i]['total_project_work_mins'][j][1])
          attendance_data_confict = true
        }
      }

    }
    if (status == 1) {
      if (attendance_data_confict == true) {
        this.commentForm.resetForm();
        this.modalApproveComments.open();
      }
      else {

        this.http.request("post", 'approve-emp-timesheet/', '', this.requestBody).subscribe(res => {
          if (res.status == 201) {
            this.ss.statusMessage.showStatusMessage(true, 'Status Updated Sucessfully');
            this.onSubmitSearch(this.fgSearch.value.filtervalue, this.page, this.paginator.pageSize);
          }
          else {
            this.ss.statusMessage.showStatusMessage(false, 'Something went wrong')
          }
        })
      }
    }else{
      
      this.dialogRef = this.dialog.open(PopUpComponent, {
        data:{
          template:this.templateRejectTimesheet,
          maxWidth:'500px',
          heading:"Enter Comments",
          hideFooterButtons:true,
          showCloseButton:true,
        },
        restoreFocus:true
      })
      this.dialogRef.afterOpened().pipe(take(1)).subscribe((val) => {
        this.commentForm.resetForm()
      })
    }
  }

  onSubmitApprove(value) {
    this.dialogRef.close()
    this.requestBody.comments = value.comments;
    this.http.request("post", 'approve-emp-timesheet/', '', this.requestBody).subscribe(res => {
      if (res.status == 201) {
        this.ss.statusMessage.showStatusMessage(true, 'Status Updated Sucessfully');
        // this.modalApproveComments.close();
        this.onSubmitSearch(this.fgSearch.value.filtervalue, this.page, this.paginator.pageSize);
      }
      else {
        this.ss.statusMessage.showStatusMessage(false, 'Something went wrong')
      }
    })
  }



  //Modal comments reject submisson
  onModalCommentSubmit(value) {
    // console.log(value);

    if (this.fgRejectionComments.valid) {
      this.requestBody.comments = value.comments;
      this.http.request("post", 'approve-emp-timesheet/', '', this.requestBody).subscribe(res => {
        if (res.status == 201) {
          this.ss.statusMessage.showStatusMessage(true, 'Status Updated Sucessfully');
          this.modalRejectComments.close();
          this.onSubmitSearch(this.fgSearch.value.filtervalue, this.page, this.paginator.pageSize);
        }
        else {
          this.ss.statusMessage.showStatusMessage(false, 'Something went wrong')
        }
      })
    }
  }


  //get total hours and minutes of weekly wise
  projectWeekTotal(hours, returnObj: boolean = false) {
    let TotHours = 0;
    let TotMins = 0;
    //   console.log(hours);

    hours.forEach(element => {
      if (element.h >= 0) {
        TotHours = + TotHours + element.h;
      }
      if (element.h >= 0) {
        TotMins = + TotMins + element.m;
      }
    });
    if (TotMins >= 60) {
      TotHours = TotHours + Math.floor(TotMins / 60);
      TotMins = TotMins % 60;
    }
    // console.log(active);

    return (returnObj) ? { h: TotHours, m: TotMins, date: 'Total' } : (("00" + TotHours).slice(-JSON.stringify(TotHours).length) + ' : ' + ("00" + TotMins).slice(-2))

  }

  //get total for active projects
  getSubTotal(active, index, returnObj: boolean = false) {
    let hours = 0;
    let minutes = 0;
    active.forEach(element => {
      hours += element.work_hours[index].h
      minutes += element.work_hours[index].m
    });
    if (minutes >= 60) {
      hours = hours + Math.floor(minutes / 60);
      minutes = minutes % 60;
    }
    // console.log(active);
    return (returnObj) ? { h: hours, m: minutes } : (("00" + hours).slice(-JSON.stringify(hours).length) + ' : ' + ("00" + minutes).slice(-2))
  }


  //get total for projects
  getTotal(active, vacation, mis, holi, index) {
    let hours = 0;
    let minutes = 0;
    active.forEach(element => {
      hours += element.work_hours[index].h
      minutes += element.work_hours[index].m
    });
    hours += vacation.work_hours[index].h
    minutes += vacation.work_hours[index].m
    hours += mis.work_hours[index].h
    minutes += mis.work_hours[index].m
    hours += holi.work_hours[index].h
    minutes += holi.work_hours[index].m
    if (minutes >= 60) {
      hours = hours + Math.floor(minutes / 60);
      minutes = minutes % 60;
    }
    // console.log(active);
    return ("00" + hours).slice(-JSON.stringify(hours).length) + ' : ' + ("00" + minutes).slice(-2)

  }
  getProjectTotal(pr) {
    let total = [];

    for (let index = 0; index < pr.length; index++) {

      total.push(pr[index].map(item => (item['h'] * 60 + item['m'])).reduce((prev, next) => prev + next));

    }

    return total
  }

  getColor(active, vacation, mis, holi, index, gross_working_hours) {
    let hours = this.getTotal(active, vacation, mis, holi, index)
    // console.log("=================", hours, gross_working_hours[index])
    return { 'red_total': false }
  }

}
