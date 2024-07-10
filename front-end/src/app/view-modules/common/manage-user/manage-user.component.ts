import { DatePipe } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { Component, ElementRef, HostListener, Inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';
import { cloneDeep } from 'lodash';
import { TooltipDirective } from 'src/app/directives/tooltip/tooltip.directive';

import { AbstractControl, ValidatorFn } from '@angular/forms';
import ValidateEmail from 'src/app/functions/validations/email';
import { UserService } from 'src/app/services/user.service';
import { Observable, Subject } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { PopUpComponent } from 'src/app/components/pop-up/pop-up.component';
import { AtaiBreakPoints } from 'src/app/constants/atai-breakpoints';

export function NotNull(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const res = ((control.value === null) || control.value === "")
    return res ? { notNull: res } : null
  }
}

export function NoDate(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const res = ((control.value['startDate'] === null) || control.value['startDate'] === "")
    return res ? { notNull: res } : null
  }
}

export interface UserData {
  emp_id: number;
  name: string;
  staff_no: number;
  company: string;
  role: number,
  managers: {
    'emp_id': number;
    'emp_name': string;
  }[]

}
export interface ProjectData {
  id: number,
  name: string
}




@Component({
  selector: 'app-manage-user',
  templateUrl: './manage-user.component.html',
  styleUrls: ['./manage-user.component.scss']
})
export class ManageUserComponent implements OnInit {
  selected_emp: UserData;
  // Rahul change *******************************
  @ViewChild("EditManagerDialog") EditManagerDialog: TemplateRef<any>;
  // **********************************************
  @ViewChild('addUserDialog') addUserPopup: ModalPopupComponent;

  @ViewChild('confirmationDialog') confirmationPopup: ModalPopupComponent;

  @ViewChild('editManagerDialog') editManagerPopup: ModalPopupComponent;

  @ViewChild('transferEmps') transferEmpPopUp: ModalPopupComponent;

  @ViewChild('updateLeave') updateLeavePopUp: ModalPopupComponent;

  @ViewChild('updateMis') updateMisPopUp: ModalPopupComponent;

  ATWORK_ROLES = [{ name: 'L0', selected: true, value: 1 }, { name: 'L1', selected: false, value: 2, disabled: false }, { name: 'L2', selected: false, value: 3, disabled: false }, { name: 'L3', selected: false, value: 4, disabled: false }]
  displayedColumns: string[] = ['serial_no', 'staff_no', 'name', 'company', 'reporting_manager', 'managers_manager', 'functional_manager', 'edit'];
  data: UserData[] = [];
  USERS_DATA: any = [];
  RM_DATA: UserData[] = [];
  MM_DATA: UserData[] = [];
  FM_DATA: UserData[] = [];
  edited_emp_role: any;
  edited_emp_name: any = ""
  PROJECT_LIST: ProjectData[] = []
  GROUPS_DATA = []
  //Rahul change(adding variable for use breakpoint observer api using singlton service)************
  get is_XMD_LT() {
    return this.ss.responsive.isMatched(AtaiBreakPoints.XMD_LT)
  }
  //*******************************************************************************************
  ALL_CATEGORIES = []
  effected_emp_count = 0;

  // ROLES = [...this.ATWORK_ROLES]; //[{ name: 'L0', selected: true, value: 1 }, { name: 'L1', selected: false, value: 2, disabled: false }, { name: 'L2', selected: false, value: 3, disabled: false }, { name: 'L3', selected: false, value: 4, disabled: false }]
  ROLES = cloneDeep(this.ATWORK_ROLES)
  newUserFirstName = '';
  newUserLastName = '';
  makeSelfRM = false;
  makeSelfMM = false;
  makeSelfFM = false;
  newUserRoleValue = 1;
  user_role_id: any;
  // form group for search form
  fgSearch: FormGroup;

  managerCtrl = new FormControl();

  filteredManagers: Observable<any>;
  //filter for Dashboard
  filterArray = [];
  is_emp_admin: boolean = false;
  ALL_GENDERS = [{ name: "Male", id: 1 }, { name: "Female", id: 2 }, { name: "Other", id: 0 }]
  MARITAL_STATUS = [{ name: "Married", value: true }, { name: "Unmarried", value: false }]
  employeeList: any = [];

  value: any;
  employeeListSearch: any = [];
  showMessage = false;
  selectedRoleValue: number = 0;
  PreviousRoleVlaue: number = 0;

  destroy$: Subject<any> = new Subject();

  // is medium resolution
  get is_MD_LT() {
    return this.ss.responsiveState[AtaiBreakPoints.MD_LT];
  };

  constructor(public dialog: MatDialog,
    private ss: SingletonService,
    private http: HttpClientService,
    private fb: FormBuilder,
    private datepipe: DatePipe,
    // Rahul change(making DialogRef as a global variable)for closing and opening the squre popup********
    public dialogRef: MatDialogRef<any>,
    //*****************************************************************************************
    private user: UserService,
    private el: ElementRef) {
    this.fgSearch = this.ss.fb.group({
      filtervalue: ["", [Validators.required]],
    }),
      setTimeout(() => {
        this.filteredManagers = this.managerCtrl.valueChanges
          .pipe(
            startWith(''),
            map(state => state ? this.filterManagerList(state) : this.employeeListSearch.slice())
          );
      }, 300)
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
        this.editManagers(index);
        break;
      }
      tempTarget = tempTarget.parentNode;
    }

  }


  //**************************************************************************** 

  private filterManagerList(value: string) {
    const filterValue = value.toLowerCase();
    return this.employeeListSearch.filter(option => option.emp_name.toLowerCase().includes(filterValue))
    // return this.filterArray.filter(state => state.emp_name.toLowerCase().indexOf(filterValue) === 0);
  }




  clear() {
    this.managerCtrl.reset();
    this.managerCtrl.setValue('');
  }

  onFocus(){ 
    this.managerCtrl.setValue(this.managerCtrl.value);
  }

  // on submitting the search by filter form
  onSubmitSearch(value?) {
    // console.log(value);
    // console.log(this.USERS_DATA);
    if (value != "ALL") {
      const filterValue = value.toLowerCase();
      this.USERS_DATA = this.employeeList.filter(option => option.emp_name.toLowerCase().includes(filterValue))
      // console.log(this.USERS_DATA);
    }
    else {
      this.USERS_DATA = this.employeeList;
    }
  }





  addUserForm = this.fb.group({
    'firstName': ['', Validators.required],
    'lastName': ['', Validators.required],
    'staff_no': ['', Validators.required],
    'company': ['', Validators.required],
    'rep_manager': ['', [Validators.required, NotNull()]],
    'man_manager': ['', [Validators.required, NotNull()]],
    'fun_own': ['', [Validators.required, NotNull()]],
    'email': ['', [Validators.required, ValidateEmail]],
    'role': [1, Validators.required],

    'category': ['', Validators.required],
    'doj': ['', [Validators.required, NoDate()]],
    'gender': ['', Validators.required],
    // 'is_married': ['',Validators.required],
    // 'patentry_maternity_cnt': [0,Validators.required],
  })

  editManagerForm = this.fb.group({
    'emp_id': ['', Validators.required],
    'rep_manager': ['', Validators.required],
    'man_manager': ['', Validators.required],
    'fun_own': ['', Validators.required],
  })

  transferEmpForm = this.fb.group({
    'emp_id': ['', Validators.required],
    'rep_manager': ['', Validators.required],
    'man_manager': ['', Validators.required],
    'fun_own': ['', Validators.required],
  })

  changeRoleForm = this.fb.group({
    'emp_id': ['', Validators.required],
    'role_id': ['', Validators.required],

  })

  fileUpdateForm = this.fb.group({
    'file': ['', Validators.required],
    'password': []
  })


  editableItem = new FormControl("manager");




  ngOnInit(): void {
    this.user_role_id = this.user.getRoleId();
    this.is_emp_admin = this.user.getIsEmpAdmin();
    this.getAllReportes();
    // console.log('::::::::::::::', this.filteredManagers)
  }

  ngOnDestroy() {
    this.destroy$.complete();
  }


  getAllReportes(): void {

    this.http.request("get", "emp-mgr/").subscribe(res => {

      if (res.body["success"] == true) {
        this.employeeListSearch = []
        let emp_list = []
        res.body["results"].forEach(ele => {
          // console.log("---------------",ele)
          Array.prototype.push.apply(emp_list, [ele]);

        })

        this.USERS_DATA = emp_list;
        this.employeeList = [...this.USERS_DATA];

        let employeeList = [...this.USERS_DATA];
        this.employeeListSearch.push({ emp_id: -1, emp_name: 'ALL' });

        // console.log('>>>>>>>>>>>>>>>>>>>>>Userdata', this.employeeListSearch)

        employeeList.forEach(element => {
          this.employeeListSearch.push(element);

        });

        this.showMessage = true;
      } else {
        this.ss.statusMessage.showStatusMessage(false, "error in fetching users");
      }

    });

  }

  async getFunOwners() {

    this.RM_DATA = [];
    this.MM_DATA = [];
    this.FM_DATA = [];


    let httpParams = new HttpParams();
    httpParams = httpParams.append("type", "manager");
    httpParams = httpParams.append("role", "4");
    var res = await this.http.request("get", "users/", httpParams).toPromise();

    // .subscribe(res => {

    if (res.body["success"] == true) {

      Object.keys(res.body["results"]).forEach(ele => {
        if (ele == '4') {
          Array.prototype.push.apply(this.FM_DATA, res.body["results"][ele]);
        }
      })

    } else {
      this.ss.statusMessage.showStatusMessage(false, "error in fetching users");
    }
    return res

    // });


  }

  getCompanies() {
    this.http.request("get", "all-company/",).subscribe(res => {
      let COMPANY = []
      if (res.body["success"] == true) {
        res.body["results"].forEach(element => {

          COMPANY.push(element["name"])
        });

        this.GROUPS_DATA = COMPANY;
      }
    })

  }


  selectRole(selectedRole, is_deselected, onload = true) {


    if (onload) {
      this.PreviousRoleVlaue = this.ROLES[selectedRole].value;
      // console.log(this.PreviousRoleVlaue,"$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")
      this.ROLES[selectedRole].selected = true;
      this.ROLES[selectedRole].disabled = true;
    }
    else {
      is_deselected = is_deselected?.target?.checked;
    }
    this.selectedRoleValue = selectedRole + 1;

    //setting role in the form
    if (is_deselected == true) {
      this.addUserForm.controls.role.setValue("1");
      this.selectedRoleValue = this.PreviousRoleVlaue - 1;
    } else {
      this.addUserForm.controls.role.setValue(this.ROLES[selectedRole].value);
    }

    this.addUserForm.controls.fun_own.reset();
    this.addUserForm.controls.man_manager.reset();
    this.addUserForm.controls.rep_manager.reset();
    // Rahul change(In order to fix after clicking checkbox MM and RM will become empty value)*************
    // this.MM_DATA = []
    // this.RM_DATA = []
    //******************************************************************************************* 
    // console.log(this.PreviousRoleVlaue,"===================>>>>>>>>>>>>",this.ROLES,onload,is_deselected)
    if (is_deselected) {
      this.selectedRoleValue = selectedRole + 1;
      for (let i = 0; i <= selectedRole - 1; i++) {
        this.ROLES[i].selected = true;
        this.ROLES[i].disabled = true;
      }
    }
    else {
      this.selectedRoleValue = this.PreviousRoleVlaue;
      // console.log(selectedRole,this.PreviousRoleVlaue,"%%%%%%%%%%%%")
      for (let i = selectedRole - 1; i > this.PreviousRoleVlaue - 1; i--) {
        this.ROLES[i].selected = false;
        this.ROLES[i].disabled = false;
      }
    }

    // if (this.newUserRoleValue <= this.ROLES[selectedRole].value) {
    //   if(selectedRole>this.PreviousRoleVlaue){
    //   for (let i = selectedRole - 1; i > this.PreviousRoleVlaue; i--) {
    //     console.log(i,selectedRole,"*****")
    //     // if(i+1!=this.PreviousRoleVlaue){
    //     this.ROLES[i].selected = !this.ROLES[selectedRole].selected;
    //     this.ROLES[i].disabled = !this.ROLES[selectedRole].selected;
    //     // }
    //   }
    //   if (this.ROLES[selectedRole].selected == false) {
    //     this.newUserRoleValue = this.ROLES[selectedRole].value;
    //   } 
    //   else{
    //     this.newUserRoleValue=1;
    //   }
    // }
    // }

    // this.ROLES[selectedRole].selected = !this.ROLES[selectedRole].selected;




    this.makeSelfFM = this.ROLES[3].disabled;
    this.makeSelfMM = this.ROLES[2].disabled;
    this.makeSelfRM = this.ROLES[1].disabled;
    console.log(this.makeSelfFM, this.ROLES, selectedRole)
    // if (this.makeSelfFM) {
    //   // this.addUserForm.controls.fun_own.setValue('Self (' + this.newUserFirstName + ' ' + this.newUserLastName + ')');
    //   this.addUserForm.controls.fun_own.setValue(0);
    // }
    // if (this.makeSelfMM) {
    //   // this.addUserForm.controls.man_manager.setValue('Self (' + this.newUserFirstName + ' ' + this.newUserLastName + ')');
    //   this.addUserForm.controls.man_manager.setValue(0);
    // }
    // if (this.makeSelfRM) {
    //   this.addUserForm.controls.rep_manager.setValue(0);
    //   // this.addUserForm.controls.rep_manager.setValue('Self (' + this.newUserFirstName + ' ' + this.newUserLastName + ')');
    // }
    console.log(this.makeSelfRM, this.makeSelfMM, this.makeSelfFM)

    // console.log(this.PreviousRoleVlaue,"-------------",this.newUserRoleValue,"=====",this.selectedRoleValue)




  }

  closeConfirmationDialog(): void {
    this.confirmationPopup.close();
  }

  closeAllDialog(): void {
    this.confirmationPopup.close();
    this.addUserPopup.closeModel = true;
    this.addUserPopup.close();
    this.addUserPopup.closeModel = false;
  }


  addUserOutputData(data): void {

    if (data == false && this.addUserForm.touched == true) {
      this.confirmationPopup.open();
    } else {
      this.addUserPopup.closeModel = true;

      this.addUserPopup.close();

    }
  }

  openAddUserDialog(): void {

    this.getCategories();
    this.getCompanies();
    this.getFunOwners();
    this.addUserPopup.closeModel = false;
    this.addUserForm.reset({ 'role': 1 });
    this.newUserFirstName = '';
    this.newUserLastName = '';
    this.newUserRoleValue = 1;
    this.makeSelfRM = false;
    this.makeSelfMM = false;
    this.makeSelfFM = false;

    this.ROLES = cloneDeep(this.ATWORK_ROLES)

    this.addUserPopup.open();
  }


  closeAddUserDialog(): void {
    this.addUserPopup.close();
    this.addUserForm.reset({ 'role': 1 });
    this.newUserFirstName = '';
    this.newUserLastName = '';
    this.newUserRoleValue = 1;
    this.ROLES = [{ name: 'L0', selected: true, value: 1 }, { name: 'L1', selected: false, value: 2, disabled: false }, { name: 'L2', selected: false, value: 3, disabled: false }, { name: 'L3', selected: false, value: 4, disabled: false }];
    this.ATWORK_ROLES = [{ name: 'L0', selected: true, value: 1 }, { name: 'L1', selected: false, value: 2, disabled: false }, { name: 'L2', selected: false, value: 3, disabled: false }, { name: 'L3', selected: false, value: 4, disabled: false }];
  }

  addUser() {
    let error_message = '';


    let formData = new FormData();
    formData.append('firstName', this.addUserForm.controls.firstName.value);
    formData.append('lastName', this.addUserForm.controls.lastName.value);
    formData.append('staff_no', this.addUserForm.controls.staff_no.value);
    formData.append('company', this.addUserForm.controls.company.value);


    formData.append('rep_manager', this.addUserForm.controls.rep_manager.value);

    formData.append('man_manager', this.addUserForm.controls.man_manager.value);

    formData.append('fun_own', this.addUserForm.controls.fun_own.value);


    formData.append('email', this.addUserForm.controls.email.value);
    formData.append('role', this.addUserForm.controls.role.value);

    formData.append('category', this.addUserForm.controls.category.value);
    formData.append('gender', this.addUserForm.controls.gender.value);
    formData.append('doj', this.datepipe.transform(this.addUserForm.controls.doj.value.startDate._d, 'yyyy-MM-dd'));



    this.http.request('post', 'users/', '', formData).subscribe(res => {

      if (res.status == 201) {
        this.ss.statusMessage.showStatusMessage(true, "User has been created successfully");


        this.newUserFirstName = '';
        this.newUserLastName = '';
        this.newUserRoleValue = 1;

        this.addUserPopup.closeModel = true;

        this.addUserPopup.close();
        this.getAllReportes();
        this.addUserForm.reset({ 'role': 1 });
      } else if (res.error) {

        Object.keys(res.error["results"][0]).forEach(ele => {
          error_message += " " + ele;
          this.addUserForm.controls[ele].setErrors({ 'is_duplicated': true })
        })

        this.ss.statusMessage.showStatusMessage(false, "duplicate or invalid data for " + error_message);

      }
    })


  }
  onMaritalStatusChange() {
    if (this.addUserForm.controls.is_married.value == false) {
      this.addUserForm.controls.patentry_maternity_cnt.setValue(0)
    }
  }

  getCategories() {
    let category = []
    this.http.request('get', 'employee-type/').subscribe(res => {
      if (res.status == 200) {
        res.body["results"].forEach(ele => {
          category.push(ele);
        })
        this.ALL_CATEGORIES = category;
      }
    })
  }

  async editManagers(i) {
    this.editableItem.setValue('manager');
    this.ROLES = cloneDeep(this.ATWORK_ROLES)
    this.selectRole(this.USERS_DATA[i]['role'] - 1, true);
    if (this.user_role_id === 4 || this.is_emp_admin == true) {
      await this.getFunOwners();
    }
    else {
      this.FM_DATA = [this.USERS_DATA[i].managers['3']];
    }

    // this.editManagerPopup.open();
    //Rahul chaange  opening EditManagerDialog on clicking edit icon
    this.dialogRef = this.dialog.open(PopUpComponent, {
      data: {
        heading: 'Transfer',
        template: this.EditManagerDialog,
        maxWidth: '420px',
        hideFooterButtons: true,
        showCloseButton: true,
      },
      autoFocus: false,
      restoreFocus: true
    })
    /////////////////////////////////////
    this.edited_emp_name = this.USERS_DATA[i].emp_name
    console.log(this.edited_emp_name, this.USERS_DATA[i].emp_name.value)
    this.changeRoleForm.controls.emp_id.setValue(this.USERS_DATA[i].emp_id);
    this.changeRoleForm.controls.role_id.setValue(this.USERS_DATA[i].role)
    this.editManagerForm.controls.emp_id.setValue(this.USERS_DATA[i].emp_id);
    this.edited_emp_role = this.USERS_DATA[i].role;

    // if (this.USERS_DATA[i]['staged_managers']['3'] !== undefined) {
    //   this.editManagerForm.controls.fun_own.setValue(this.USERS_DATA[i]['staged_managers']['3'].emp_id);
    // } else {
    this.editManagerForm.controls.fun_own.setValue(this.USERS_DATA[i].managers['3'].emp_id);
    // }
    if (this.user_role_id > 2 || this.is_emp_admin == true) {
      this.changeFM(this.USERS_DATA[i].managers['3'].emp_id, this.edited_emp_role);
    } else {
      this.MM_DATA = [this.USERS_DATA[i].managers['2']];
    }
    // if (this.USERS_DATA[i]['staged_managers']['2'] !== undefined) {
    //   this.editManagerForm.controls.man_manager.setValue(this.USERS_DATA[i]['staged_managers']['2'].emp_id);
    // } else {
    this.editManagerForm.controls.man_manager.setValue(this.USERS_DATA[i].managers['2'].emp_id);
    // }
    this.changeMM(this.USERS_DATA[i].managers['2'].emp_id, this.edited_emp_role);

    // if (this.USERS_DATA[i]['staged_managers']['1'] !== undefined) {
    //   this.editManagerForm.controls.rep_manager.setValue(this.USERS_DATA[i]['staged_managers']['1'].emp_id);
    // } else {
    this.editManagerForm.controls.rep_manager.setValue(this.USERS_DATA[i].managers['1'].emp_id);
    // }
    // console.log("---------edit value----------", this.editManagerForm.value)







  }

  updateManager() {

    this.http.request('post', 'emp-mgr/', '', this.editManagerForm.value).subscribe(res => {

      if (res.status == 200) {
        this.ss.statusMessage.showStatusMessage(true, "Managers have been updated successfully");

        // this.editManagerPopup.close();
        // Rahul change (closing the EditManagerDialog)***************************************
        this.dialogRef.close()
        //*************************************************************************** 
        this.getAllReportes();

      } else {
        this.ss.statusMessage.showStatusMessage(false, "Issue while updating managers")
      }
    })
  }

  changeFM(emp, role) {

    this.MM_DATA = []
    this.editManagerForm.controls.man_manager.reset()
    this.editManagerForm.controls.rep_manager.reset()
    this.http.request('get', 'mgr-reporters/', 'emp_id=' + emp).subscribe(res => {

      if (res.status == 200) {
        let emp_list = [];
        if (res.body['results']['role']) {
          emp_list.push({
            "emp_id": res.body['results']['emp_id'],
            "email": res.body['results']['email'],
            "emp_name": res.body['results']['emp_name'],
            "staff_no": res.body['results']['staff_no'],
            "role": res.body['results']['role']
          })
        }
        res.body['results']['reporters'].forEach(ele => {

          if (res.body['results']['emp_id'] !== ele['emp_id'] && (ele['role'] > role)) {
            emp_list.push(ele)
          }
        })
        // console.log("ChangeFM-------", emp_list)
        this.MM_DATA = emp_list;
      }
    })
  }


  changeMM(emp, role) {
    this.RM_DATA = []
    this.editManagerForm.controls.rep_manager.reset()
    // this.editManagerForm.controls.man_manager.value
    this.http.request('get', 'mgr-reporters/', 'emp_id=' + emp).subscribe(res => {

      if (res.status == 200) {
        let emp_list = []
        if (res.body['results']['role']) {
          emp_list.push({
            "emp_id": res.body['results']['emp_id'],
            "email": res.body['results']['email'],
            "emp_name": res.body['results']['emp_name'],
            "staff_no": res.body['results']['staff_no'],
            "role": res.body['results']['role']
          })
        }
        res.body['results']['reporters'].forEach(ele => {
          if (res.body['results']['emp_id'] !== ele['emp_id'] && (ele['role'] > role)) {
            emp_list.push(ele)
          }
        })
        this.RM_DATA = emp_list;
      }
    })
  }

  async getEffectedEmpList() {
    let emp = this.changeRoleForm.controls.emp_id.value;

    this.effected_emp_count = 0
    let res = await this.http.request('get', 'transfer-emp/', 'emp_id=' + emp).toPromise();
    let emp_list = []
    res.body["results"].forEach(e => {
      emp_list.push(e["emp_name"])
    })
    this.effected_emp_count = emp_list.length
    return emp_list
  }
  async openTransferEmp() {
    // await this.getEffectedEmpList(this.editManagerForm.controls.emp_id.value)
    this.newUserRoleValue = this.changeRoleForm.controls.role_id.value;
    this.transferEmpForm.controls.emp_id.setValue(this.editManagerForm.controls.emp_id.value);
    this.transferEmpPopUp.open();
  }
  transferEmp() {
    // console.log("===========", this.transferEmpForm.value)
    this.http.request('post', 'transfer-emp/', '', this.transferEmpForm.value).subscribe(res => {

      if (res.status == 200) {
        this.ss.statusMessage.showStatusMessage(true, "Employees have been transferred successfully");
        this.transferEmpPopUp.close();

      } else {
        this.ss.statusMessage.showStatusMessage(false, "Issue while transferring employees");
      }
    })
  }
  changeRole() {
    this.changeRoleForm.controls.role_id.setValue(this.selectedRoleValue);
    // console.log(this.changeRoleForm.value)
    console.log("----------role---change", this.changeRoleForm.value, this.addUserForm.controls.role)

    this.http.request('post', 'change-role/', '', this.changeRoleForm.value).subscribe(res => {

      if (res.status == 200) {
        this.ss.statusMessage.showStatusMessage(true, "Role has been changed successfully");
        this.edited_emp_name = "";
        //Previous code 
        // this.editManagerPopup.close();
        //New code
        // Rahul change (closing the EditManagerDialog when employee role changed successfully)***************************************
        this.dialogRef.close()
        //*************************************************************************** 
        // console.log('@@@@@@!!!!!!!!!$$$$$$$$$$$ edit manager popup close successfully');
        this.getAllReportes();
      } else {
        this.ss.statusMessage.showStatusMessage(false, "Issue while changing the role");
      }
    })
  }

  openLeavePopup() {
    this.updateLeavePopUp.open()
    this.fileUpdateForm.reset()
    this.fileUpdateForm.controls["password"].setValidators(null);
    this.fileUpdateForm.controls["password"].updateValueAndValidity()
  }



  uploadLeaveExcel() {

    var data = new FormData();
    data.append("file", this.fileUpdateForm.controls.file.value)

    this.http.request('post', 'leave/config/export-emp-leave/', '', data).subscribe(res => {

      if (res.status == 201) {
        this.ss.statusMessage.showStatusMessage(true, "Leaves have been imported successfully");
        this.updateLeavePopUp.close();
      } else {
        this.ss.statusMessage.showStatusMessage(false, "Issue while importing leaves");
      }
    })

  }

  openMisPopup() {

    this.fileUpdateForm.reset()
    this.fileUpdateForm.controls["password"].setValidators(Validators.required);
    this.fileUpdateForm.controls["password"].updateValueAndValidity()
    this.updateMisPopUp.open()
  }



  uploadMis() {

    var data = new FormData();
    data.append("file", this.fileUpdateForm.controls.file.value)
    data.append("api_key", this.fileUpdateForm.controls.password.value)

    this.http.request('post', 'mis-upload/', '', data).subscribe(res => {

      if (res.status == 200) {
        this.ss.statusMessage.showStatusMessage(true, "Mis has been imported successfully");
        this.updateMisPopUp.close();
      } else {
        this.ss.statusMessage.showStatusMessage(false, "Issue while importing Mis");
      }
    })

  }

}
