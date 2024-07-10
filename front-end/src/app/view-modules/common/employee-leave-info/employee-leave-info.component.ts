import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormArray, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';
import { PopUpComponent } from 'src/app/components/pop-up/pop-up.component';
import { AtaiBreakPoints } from 'src/app/constants/atai-breakpoints';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';


export interface EmpLeave {
  emp_id: number,
  emp_name: string,
  company: string,
  staff_no: string,
  outstanding_leave_bal: number

}


@Component({
  selector: 'app-employee-leave-info',
  templateUrl: './employee-leave-info.component.html',
  styleUrls: ['./employee-leave-info.component.scss']
})
export class EmployeeLeaveInfoComponent implements OnInit {

  @ViewChild('editLeaveDialog') editProjectTemplateRef: TemplateRef<any>;


  editProjectDialogRef: MatDialogRef<any>;

  PROJECTS = [] //["ab","bc","ca","ad"]

  PROJECTS_LIST = {}

  EMP_LEAVE_DATA:EmpLeave[] =[]
  displayedColumns = ['serial_no','staff_no', 'emp_name', 'company', 'currLvBal', 'edit'];

  loading_emp_data = true;

  EMP_LEAVE_FILTERED_DATA: any[] = [];

  employeeList: EmpLeave[];

  // form group for search form
  fgSearch: FormGroup;

  //filter for Dashboard
  filterArray = [];

  managerCtrl = new FormControl();

  filteredManagers: Observable<any[]>;

  value: any;

  edited_emp_name = ""

  showMessage = false;


  get is_XMD_LT(){
    return this.ss.responsiveState[AtaiBreakPoints.XMD_LT]
  }

  constructor(public dialog: MatDialog,
    private ss: SingletonService,
    private http: HttpClientService,
    private fb: FormBuilder) {
    this.fgSearch = this.ss.fb.group({
      filtervalue: ["", [Validators.required]],
    }),
      this.filteredManagers = this.managerCtrl.valueChanges
        .pipe(
          startWith(''),
          map(state => state ? this.filterManagerList(state) : this.employeeList)
        );
  }

  // on submitting the search by filter form
  onSubmitSearch(value?) {

    if (value != "ALL") {
      const filterValue = value.toLowerCase();
      this.EMP_LEAVE_FILTERED_DATA = this.employeeList.filter(option => option.emp_name.toLowerCase().includes(filterValue) && option.emp_name.toLowerCase() != 'all')
    }
    else {
      this.EMP_LEAVE_FILTERED_DATA = this.employeeList.slice(1, this.employeeList.length);
    }
  }

  editLeaveForm = this.fb.group({
    'emp': [''],
    'currentLeaveBal': [''],
    'leave_credits': ['', Validators.required],
    'comments': ["", Validators.required]

  })
  filterForm = this.fb.group({
    'filter': []
  })

  getControls() {
    return (this.editLeaveForm.get('projects') as FormArray).controls;
  }

  ngOnInit(): void {
    // this.getAllProjects();
    this.getEmpLeaves();
    // this.filterForm.controls.filter.valueChanges.subscribe(val => {
    //   this.search(val);
    // })

  }

  clear() {
    this.fgSearch.reset('')
    this.managerCtrl.setValue('')
    this.managerCtrl.updateValueAndValidity()
  }

  filterManagerList(value: string) {


    const filterValue = value.toLowerCase();
    return this.employeeList.filter(option => option.emp_name.toLowerCase().includes(filterValue))
    // return this.filterArray.filter(state => state.emp_name.toLowerCase().indexOf(filterValue) === 0);
  }

  private _filter(value: string, projects = this.PROJECTS): string[] {
    let filterValue = '';
    if (value == null || value == '') {
      return projects
    }
    if (typeof (value) == 'string') {
      filterValue = value.toLowerCase();
    } else if (typeof (value) == 'object') {
      filterValue = String(value['name']).toLowerCase();

    }


    return projects.filter(option => option["name"].toLowerCase().includes(filterValue));

  }
  private _delete(value: any[], d): string[] {


    let deleted_list = []
    if (d != null) {
      deleted_list = value.filter(val => val["id"] != d["id"]);

      return deleted_list
    } else {
      return value
    }

  }

  search(term: string) {
    if (!term) {
      this.EMP_LEAVE_FILTERED_DATA = this.EMP_LEAVE_DATA;
    } else {
      this.EMP_LEAVE_FILTERED_DATA = this.EMP_LEAVE_DATA.filter(x =>
        x.emp_name.trim().toLowerCase().includes(term.trim().toLowerCase())
      );
    }
  }



  openEditDialog(index) {


    this.edited_emp_name = this.EMP_LEAVE_FILTERED_DATA[index]["emp_name"]
    this.editLeaveForm.reset()
    this.editLeaveForm.controls.emp.setValue(this.EMP_LEAVE_FILTERED_DATA[index]["emp_id"]);
    this.editLeaveForm.controls.currentLeaveBal.setValue(this.EMP_LEAVE_FILTERED_DATA[index]["outstanding_leave_bal"]);

    this.editLeaveForm.controls.leave_credits.setValue(this.EMP_LEAVE_FILTERED_DATA[index]["outstanding_leave_bal"]);

    this.editProjectDialogRef = this.dialog.open(PopUpComponent,{
      data:{
        heading: 'Edit Leave Balance',
        template:this.editProjectTemplateRef,
        hideFooterButtons:true,
        showCloseButton:true,
        minWidth:'250px'
      },
      restoreFocus:true
    })
    // this.editProjectPopup.open();

  }

  displayFn(proj) {

    return proj && proj.name ? proj.name : '';
  }

  updateLeave() {
    // console.log("update leave")
    var formData: any = {}


    formData.emp = this.editLeaveForm.controls.emp.value;
    formData.currentLeaveBal = this.editLeaveForm.controls.currentLeaveBal.value;
    formData.leave_credits = this.editLeaveForm.controls.leave_credits.value - this.editLeaveForm.controls.currentLeaveBal.value;
    formData.modifiedValue = this.editLeaveForm.controls.leave_credits.value;
    formData.comments = this.editLeaveForm.controls.comments.value;

    this.http.request('post', 'leave/balance/', '', formData).subscribe(res => {
      if (res.status == 201) {
        this.ss.statusMessage.showStatusMessage(true, "Leave balance have been added successfully");
        this.editLeaveForm.reset();
        this.editProjectDialogRef.close();
        this.getEmpLeaves();

      }
      else if (res.status == 417) {
        this.ss.statusMessage.showStatusMessage(false, res.error.results);
      }
      else {
        this.ss.statusMessage.showStatusMessage(false, "Error while updating leave balance");
      }
    })
  }


  getAllProjects(): void {
    let projects = []
    this.http.request('get', 'all-projects/').subscribe(res => {
      // "emp_id": 28,
      // "email": "a@gmail.com",
      // "emp_name": "aa vv",
      // "company": "ATAI",
      // "staff_no": "1111",
      // "role_id": 1,
      // "total_leave_bal": 0.0,
      // "consumed": 0.0,
      // "outstanding_leave_bal": 0.0

      if (res.status == 200) {
        res.body["results"].forEach(element => {
          projects.push(element);
        });
        this.getEmpLeaves();
        this.PROJECTS = projects;
      }
    })
  }
  getProjectById(id) {
    if (id === "") {
      return { id: '', name: '' }
    } else if (id === 0) {
      return { id: 0, name: 'None' }
    }

    for (let i = 0; i < this.PROJECTS.length; i++) {
      {
        if (this.PROJECTS[i].id == id) {
          return this.PROJECTS[i];
        }
      }

    }
  }
  getEmpLeaves(): void {
    let emp_projects = []
    this.http.request('get', 'leave/balance/', 'is_hr=true').subscribe(res => {


      if (res.status == 200) {
        res.body["results"].forEach(element => {

          emp_projects.push(element
          );

        });
        this.EMP_LEAVE_DATA = emp_projects;
        this.EMP_LEAVE_FILTERED_DATA = emp_projects;
        this.employeeList = [...this.EMP_LEAVE_FILTERED_DATA]
        this.employeeList.unshift({ emp_id: -1, emp_name: 'ALL', company: '', staff_no: '', outstanding_leave_bal: 0 })
        this.managerCtrl.setValue('ALL');
        this.showMessage = true;
        // this.search(this.filterForm.controls.filter.value);
      }
    })
  }
}
