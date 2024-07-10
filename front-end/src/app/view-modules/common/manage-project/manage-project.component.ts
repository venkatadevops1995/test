import { Component, ComponentRef, Directive, ElementRef, HostListener, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';
import { TooltipDirective } from 'src/app/directives/tooltip/tooltip.directive';
import { HttpParams } from '@angular/common/http';
import { PopUpComponent } from 'src/app/components/pop-up/pop-up.component';
import { Overlay, OverlayPositionBuilder, OverlayRef } from '@angular/cdk/overlay';

import { ComponentPortal } from '@angular/cdk/portal';
import { AtaiBreakPoints } from 'src/app/constants/atai-breakpoints';
import { UserService } from 'src/app/services/user.service';

export interface Project {
  id: number,
  name: string
}

export interface ProjectData {
  emp_id: number,
  emp_name: string,
  company: string,
  proj1: Project,
  proj2: Project,
  proj3: Project
}


@Component({
  selector: 'app-manage-project',
  templateUrl: './manage-project.component.html',
  styleUrls: ['./manage-project.component.scss']
})
export class ManageProjectComponent implements OnInit {


  //  Rahul change(using Viewchild for EditProjectDialog)**************************
  @ViewChild("EditProjectDialog") EditProjectDialog: TemplateRef<any>;

  //  ***********************************************************************
  @ViewChild('editProjectDialog') editProjectPopup: ModalPopupComponent;
  PROJECTS = [] //["ab","bc","ca","ad"]
  PROJECTS_LIST = {}
  EMP_PROJECTS_DATA: ProjectData[] = [];
  displayedColumns = ['serial_no', 'staff_no', 'emp_name', 'company', 'proj1', 'proj2', 'proj3', 'edit'];
  loading_emp_data = true;
  EMP_PROJECTS_FILTERED_DATA: ProjectData[] = [];
  filteredOptions: Observable<any[]>;
  filteredOptions2: Observable<string[]>;
  filteredOptions3: Observable<string[]>;
  filteredOptions4: Observable<string[]>;
  employees: any;
  EmpName:string;
  filteredValues: any;
  value: any;
  filtervalue = new FormControl();
  employeeList: any[] = [];
  showMessage = false
//Rahul change(adding variable for use breakpoint observer api using singlton service)************
get is_XMD_LT(){
  return this.ss.responsive.isMatched(AtaiBreakPoints.XMD_LT)
}
//*******************************************************************************************
  constructor(public dialog: MatDialog,
    private ss: SingletonService,
    private http: HttpClientService,
    // Rahul change(making DialogRef as a global variable)for closing and opening the squre popup********
    public dialogRef: MatDialogRef<any>,
    //*****************************************************************************************
    private user:UserService,
    // ***********************************************************************************************
    private fb: FormBuilder,
    private el: ElementRef) {
    this.fgSearch = this.ss.fb.group({
      filtervalue: ["", [Validators.required]],
    }),
      this.filteredManagers = this.managerCtrl.valueChanges
        .pipe(
          startWith(''),
          map(state => state ? this.filterManagerList(state) : this.employeeList)
        );
 

  }

  editProjectForm = this.fb.group({
    'emp_id': [''],
    'proj1': [''],
    'proj2': [''],
    'proj3': [''],
    'projects': this.fb.array([
      this.fb.group({ 'p': [''] }),
      this.fb.group({ 'p': [''] }),
      this.fb.group({ 'p': [''] })

    ])
  })
  filterForm = this.fb.group({
    'filter': []
  })
  // form group for search form
  fgSearch: FormGroup;

  //filter for Dashboard
  filterArray = [];

  managerCtrl = new FormControl();

  filteredManagers: Observable<any>; 
  
  get is_MD_LT() {
    return this.ss.responsiveState[AtaiBreakPoints.MD_LT];
  }

  getControls() {
    return (this.editProjectForm.get('projects') as FormArray).controls;
  }

  ngOnInit(): void {
    this.getEmployees();
    this.getAllProjects();
    // this.getEmpProjects();


  }
  //Rahul change(adding event daligation for table row when clicking on edit ) *******************************
  @HostListener('click', ['$event'])
  onClickHost(e) {
    let target: any = e.target;
    let tempTarget = target;
    // console.log("--------------click");
    // if(e.target.classList.contains('edit')){
    //   let index=e.target.getAttribute("index");
    //   console.log('$$$$$$$$$$$$$$$$$$$$$$$',index);
    //   this.editUser(index);
    // }

    while (tempTarget != this.el.nativeElement) {
      if (tempTarget.classList.contains('edit')) {
        // console.log('::::::::::::::clicked on the edit icon');
        let index = tempTarget.getAttribute("index");
        this.openEditDialog(index);
        break;
      }
      tempTarget = tempTarget.parentNode;
    }

  }

  //**************************************************************************** 


  filterManagerList(value: string) {
    const filterValue = value.toLowerCase();


    return this.employeeList.filter(option => option.emp_name.toLowerCase().includes(filterValue))
    // return this.filterArray.filter(state => state.emp_name.toLowerCase().indexOf(filterValue) === 0);
  }

  clear() {
    this.managerCtrl.reset();
    this.managerCtrl.setValue('');
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
    if (!term || term == 'ALL') {
      this.EMP_PROJECTS_FILTERED_DATA = this.EMP_PROJECTS_DATA;
    } else {
      this.EMP_PROJECTS_FILTERED_DATA = this.EMP_PROJECTS_DATA.filter(x =>
        x.emp_name.trim().toLowerCase().includes(term.trim().toLowerCase())
      );
    }
  }

  openEditDialog(index) {
    // this.filteredOptions = this.editProjectForm.controls.proj1.valueChanges.pipe(
    //   startWith(''),
    //   map(value => this._filter(value)),
    //   map(val => this._filter(this.editProjectForm.controls.proj1.value)),
    //   map(val => this._delete(val, this.editProjectForm.controls.proj2.value)),
    //   map(val => this._delete(val, this.editProjectForm.controls.proj3.value))

    // );
    this.editProjectForm.controls.proj1.valueChanges.subscribe(val => {

      this.filteredOptions = of(this._delete(this._delete(this._filter(this.editProjectForm.controls.proj1.value, this._filter(val)), this.editProjectForm.controls.proj2.value), this.editProjectForm.controls.proj3.value));

      this.filteredOptions2 = of(this._delete(this._delete(this._filter(this.editProjectForm.controls.proj2.value, this._filter("")), this.editProjectForm.controls.proj1.value), this.editProjectForm.controls.proj3.value));

      this.filteredOptions3 = of(this._delete(this._delete(this._filter(this.editProjectForm.controls.proj3.value, this._filter("")), this.editProjectForm.controls.proj1.value), this.editProjectForm.controls.proj2.value));

    });
    this.editProjectForm.controls.proj2.valueChanges.subscribe(val => {

      this.filteredOptions = of(this._delete(this._delete(this._filter(this.editProjectForm.controls.proj1.value, this._filter("")), this.editProjectForm.controls.proj2.value), this.editProjectForm.controls.proj3.value));

      this.filteredOptions2 = of(this._delete(this._delete(this._filter(this.editProjectForm.controls.proj2.value, this._filter(val)), this.editProjectForm.controls.proj1.value), this.editProjectForm.controls.proj3.value));

      this.filteredOptions3 = of(this._delete(this._delete(this._filter(this.editProjectForm.controls.proj3.value, this._filter("")), this.editProjectForm.controls.proj1.value), this.editProjectForm.controls.proj2.value));
    });
    this.editProjectForm.controls.proj3.valueChanges.subscribe(val => {

      this.filteredOptions = of(this._delete(this._delete(this._filter(this.editProjectForm.controls.proj1.value, this._filter("")), this.editProjectForm.controls.proj2.value), this.editProjectForm.controls.proj3.value));

      this.filteredOptions2 = of(this._delete(this._delete(this._filter(this.editProjectForm.controls.proj2.value, this._filter("")), this.editProjectForm.controls.proj1.value), this.editProjectForm.controls.proj3.value));

      this.filteredOptions3 = of(this._delete(this._delete(this._filter(this.editProjectForm.controls.proj3.value, this._filter(val)), this.editProjectForm.controls.proj1.value), this.editProjectForm.controls.proj2.value));

    });


    // this.filteredOptions4 = this.editProjectForm.controls.projects.valueChanges.pipe(
    //   startWith(''),
    //   map(value => this._filter(value[0])),
    //   // map(val => this._filter(this.editProjectForm.controls.proj1.value)),
    //   // map(val => this._delete(val, this.editProjectForm.controls.proj2.value)),
    //   // map(val => this._delete(val, this.editProjectForm.controls.proj3.value))

    // );
    this.EmpName=this.EMP_PROJECTS_FILTERED_DATA[index]["emp_name"];
    this.editProjectForm.controls.emp_id.setValue(this.EMP_PROJECTS_FILTERED_DATA[index]["emp_id"]);

    this.editProjectForm.controls.proj1.setValue(this.EMP_PROJECTS_FILTERED_DATA[index]["staged_proj1"]["id"] !== "" ? this.EMP_PROJECTS_FILTERED_DATA[index]["staged_proj1"]["id"] == 0 ? "" : this.EMP_PROJECTS_FILTERED_DATA[index]["staged_proj1"] : this.EMP_PROJECTS_FILTERED_DATA[index]["proj1"]);

    this.editProjectForm.controls.proj2.setValue(this.EMP_PROJECTS_FILTERED_DATA[index]["staged_proj2"]["id"] !== "" ? this.EMP_PROJECTS_FILTERED_DATA[index]["staged_proj2"]["id"] == 0 ? "" : this.EMP_PROJECTS_FILTERED_DATA[index]["staged_proj2"] : this.EMP_PROJECTS_FILTERED_DATA[index]["proj2"]);

    this.editProjectForm.controls.proj3.setValue(this.EMP_PROJECTS_FILTERED_DATA[index]["staged_proj3"]["id"] !== "" ? this.EMP_PROJECTS_FILTERED_DATA[index]["staged_proj3"]["id"] == 0 ? "" : this.EMP_PROJECTS_FILTERED_DATA[index]["staged_proj3"] : this.EMP_PROJECTS_FILTERED_DATA[index]["proj3"]);
    // this.editProjectPopup.open();
    //  Rahulchange(opening EditProjectDialog) ***********************************
    //  ********************************************
    this.dialogRef = this.dialog.open(PopUpComponent, {
      data: {
        heading: 'Edit Project',
        template: this.EditProjectDialog,
        maxWidth: '420px',
        hideFooterButtons: true,
        showCloseButton: true,

      },
      autoFocus: false,
      restoreFocus:true
    })


  }

  displayFn(proj) {

    return proj && proj.name ? proj.name : '';
  }

  addProject() {

    var formData: any = {}


    formData.emp_id = this.editProjectForm.controls.emp_id.value;
    if (this.editProjectForm.controls.proj1.value.id !== "") {
      formData.proj1 = this.editProjectForm.controls.proj1.value.id;
    }
    if (this.editProjectForm.controls.proj2.value.id !== "") {
      formData.proj2 = this.editProjectForm.controls.proj2.value.id;
    }
    if (this.editProjectForm.controls.proj3.value.id !== "") {
      formData.proj3 = this.editProjectForm.controls.proj3.value.id;
    }
    this.http.request('post', 'emp-projects/', '', formData).subscribe(res => {
      if (res.status == 201) {
        this.ss.statusMessage.showStatusMessage(true, "Projects have been added successfully");
        this.editProjectForm.reset();
        // this.editProjectPopup.close();
        //Rahul change (closing the EditProjectDialog)*******************************
        this.dialogRef.close();
        //********************************************** */
        this.getEmpProjects();
        this.showMessage = true
      } else {
        this.ss.statusMessage.showStatusMessage(false, "Error while adding the projects!!");
      }
    })
  }


  getAllProjects(): void {
    let projects = []
    this.http.request('get', 'all-projects/').subscribe(res => {


      if (res.status == 200) {
        res.body["results"].forEach(element => {
          projects.push({ id: element["id"], name: element["name"] });
        });
        this.getEmpProjects();
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

  // get employees based on the string entered in auto complete
  getEmployees() {
    let params = new HttpParams({
      fromObject: {
        type: 'hierarchy',
        hierarchy_type:this.user.getIsEmpAdmin()?'all':'immediate'
      }
    })
    this.http.request('get', 'users/', params).subscribe((res) => {
      if (res.status == 200) {
        this.employees = res.body['results'];
        this.employeeList.push(({ emp_id: -1, emp_name: 'ALL' }))
        // this.employeeList = []
        let employeeList = [...this.employees];
        employeeList.forEach(element => {
          this.employeeList.push(element)
        });
        this.managerCtrl.setValue('ALL');
      }
    })
  }
  getEmpProjects(): void {
    let emp_projects = []
    this.http.request('get', 'emp-projects/').subscribe(res => {


      if (res.status == 200) {
        res.body["results"].forEach(element => {

          emp_projects.push({
            emp_id: element["emp_id"], staff_no: element["staff_no"], emp_name: element["emp_name"],
            staging_status: element['staging_status'], staging_relieved: element['staging_relieved'],
            company: element["company"], proj1: this.getProjectById(element["p1"]), proj2: this.getProjectById(element["p2"]), proj3: this.getProjectById(element["p3"]), staged_proj1: this.getProjectById(element["staged"]["p1"]), staged_proj2: this.getProjectById(element["staged"]["p2"]), staged_proj3: this.getProjectById(element["staged"]["p3"])
          });

        });

        this.EMP_PROJECTS_DATA = emp_projects;
        this.EMP_PROJECTS_FILTERED_DATA = emp_projects;
        this.search(this.filterForm.controls.filter.value);
      }
    })
  }


  // Rahul change(adding function for closing EditProjectDialog when user clicks on EditProjectDialog close button)*******
  // closeEditDialog(){
  //   this.dialogRef.close();
  // }
  // ****************************************************************************************

}

