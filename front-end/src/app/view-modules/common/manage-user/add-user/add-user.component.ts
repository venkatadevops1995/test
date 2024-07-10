import { DatePipe } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, NgForm, ValidatorFn, Validators } from '@angular/forms';
import { MatDatepicker } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { cloneDeep } from 'lodash';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';
import ValidateEmail from 'src/app/functions/validations/email';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';
import { UserService } from 'src/app/services/user.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import { take } from 'rxjs/operators';
import { Subject, takeUntil } from 'rxjs';
// Rahul changes *****************************
import { MAT_DATE_LOCALE, NativeDateAdapter } from "@angular/material/core";
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { formatDate } from '@angular/common';
import { AtaiBreakPoints } from 'src/app/constants/atai-breakpoints';
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
// ******************************************************
export interface ProjectData {
  id: number,
  name: string
}
export function NotNull(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const res = ((control.value === null) || control.value === "")
    return res ? { notNull: res } : null
  }
}

export function NoDate(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (control.value == null) {
      return { notNull: true }
    }
    const res = ((control.value['startDate'] === null) || control.value['startDate'] === "")

    return res ? { notNull: true } : null
  }
}
// Date Adapter(Rahul changes) *************************
// **************************************************************
// **************************************************************
export const PICK_FORMATS = {
  parse: {
    dateInput: { month: 'numeric', year: 'numeric', day: 'numeric' }
  },
  display: {
    dateInput: 'input',
    monthYearLabel: { year: 'numeric', month: 'numeric' },
    dateA11yLabel: { year: 'numeric', month: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'numeric' }
  }
};

export class PickDateAdapter extends NativeDateAdapter {
  override format(date: Date, displayFormat: Object): string {
    if (displayFormat === 'input') {
      return formatDate(date, 'yyyy-MM-dd', this.locale);
    } else {
      return formatDate(date, 'MMM YYYY', this.locale);
    }
  }
}
//****************************************************************** */
@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss'],
  // rahul changes ***********************************
  providers: [
    { provide: DateAdapter, useClass: PickDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: PICK_FORMATS }
  ]
  // ******************************************************
})
export class AddUserComponent implements OnInit, AfterViewInit {
  //valriable to holed the image file
  selectedFile: File | string = ''
  SupportImageType: boolean = false;
  SupportImageSize: boolean = false;
  SupportImageDimension: boolean = false
  heightandwidth: boolean = false
  // @ViewChild('confirmationRef') confirmationModal: ModalPopupComponent;
  @ViewChild(MatDatepicker) datepicker: MatDatepicker<Date>;

  // Rahul changes ****************************
  @ViewChild('f') myNgForm: NgForm;

  // ***********************************************
  ATWORK_ROLES = [{ name: 'L0', selected: true, value: 1 }, { name: 'L1', selected: false, value: 2, disabled: false }, { name: 'L2', selected: false, value: 3, disabled: false }, { name: 'L3', selected: false, value: 4, disabled: false }]
  displayedColumns: string[] = ['staff_no', 'name', 'company', 'reporting_manager', 'managers_manager', 'functional_manager', 'edit'];
  data: UserData[] = [];
  USERS_DATA: UserData[] = [];
  RM_DATA: UserData[] = [];
  MM_DATA: UserData[] = [];
  FM_DATA: UserData[] = [];
  edited_emp_role: any;
  PROJECT_LIST: ProjectData[] = []
  GROUPS_DATA = []
  IS_mobile: boolean = false;
  ALL_CATEGORIES = []
  effected_emp_count = 0;

  //Rahul change(adding variable for use breakpoint observer api using singlton service)************ 
  get is_XMD_LT() {
    return this.ss.responsive.isMatched(AtaiBreakPoints.XMD_LT)
  }

  get getImageHeightIsValid(): boolean {
    return this.heightandwidth;
  }

  set setImageHeightIsValid(flag: boolean) {

    this.heightandwidth = flag;
  }

  //*******************************************************************************************
  // ROLES = [...this.ATWORK_ROLES]; //[{ name: 'L0', selected: true, value: 1 }, { name: 'L1', selected: false, value: 2, disabled: false }, { name: 'L2', selected: false, value: 3, disabled: false }, { name: 'L3', selected: false, value: 4, disabled: false }]
  ROLES = cloneDeep(this.ATWORK_ROLES)
  newUserFirstName = '';
  newUserLastName = '';
  makeSelfRM = false;
  makeSelfMM = false;
  makeSelfFM = false;
  newUserRoleValue = 1;
  user_role_id: any;
  is_emp_admin: boolean = false;
  ALL_LOCATIONS = []
  ALL_GENDERS = [{ name: "Male", id: 1 }, { name: "Female", id: 2 }, { name: "Other", id: 0 }]
  MARITAL_STATUS = [{ name: "Married", value: true }, { name: "Unmarried", value: false }]
  date: any

  constructor(public dialog: MatDialog,
    private ss: SingletonService,
    private http: HttpClientService,
    private fb: FormBuilder,
    private datepipe: DatePipe,
    private user: UserService,
  ) {
    this.ss.responsive.observe(AtaiBreakPoints.XS).subscribe(val => {
      this.IS_mobile = val.matches;
      //  console.log(val.matches)
    })


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
    'location': ['', Validators.required],
    'category': ['', Validators.required],
    'doj': ['', [Validators.required, NoDate()]],
    'gender': ['', Validators.required],
    'user_pic': [null],
    'device_id': [null,Validators.pattern("^[0-9]*$")],
    'amd_id':[null,Validators.pattern("^[0-9]*$")]
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
    this.getCategories();
    this.getCompanies();
    this.getFunOwners();
    this.getLocations();
    this.addUserForm.reset({ 'role': 1 });
    this.newUserFirstName = '';
    this.newUserLastName = '';
    this.newUserRoleValue = 1;
    this.makeSelfRM = false;
    this.makeSelfMM = false;
    this.makeSelfFM = false;

    this.ROLES = cloneDeep(this.ATWORK_ROLES)
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.myNgForm.resetForm()
      this.addUserForm.reset({ 'role': 1 });
    }, 300)
  }

  reset() {
    //Rahul change(resetting all fields and setting default form value after clicking on reset())
    this.myNgForm.resetForm()
    //***************************************************************************************** */
    this.user_role_id = this.user.getRoleId();
    this.is_emp_admin = this.user.getIsEmpAdmin();
    // this.getCategories();
    // this.getCompanies();
    // this.getFunOwners();
    this.addUserForm.reset({ 'role': 1 });
    this.newUserFirstName = '';
    this.newUserLastName = '';
    this.newUserRoleValue = 1;
    this.makeSelfRM = false;
    this.makeSelfMM = false;
    this.makeSelfFM = false;
    this.ROLES = cloneDeep(this.ATWORK_ROLES)

    // this.reset()
  }


  getAllReportes(): void {

    this.http.request("get", "emp-mgr/").subscribe(res => {

      if (res.body["success"] == true) {

        let emp_list = []
        res.body["results"].forEach(ele => {
          // console.log("---------------",ele)
          Array.prototype.push.apply(emp_list, [ele]);
        })

        this.USERS_DATA = emp_list;


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


  selectRole(selectedRole, is_deselected) {



    //setting role in the form
    if (is_deselected == true) {
      this.addUserForm.controls.role.setValue("1");
    } else {
      this.addUserForm.controls.role.setValue(this.ROLES[selectedRole].value);
    }

    this.addUserForm.controls.fun_own.reset();
    this.addUserForm.controls.man_manager.reset();
    this.addUserForm.controls.rep_manager.reset();
    this.MM_DATA = []
    this.RM_DATA = []



    if (this.newUserRoleValue <= this.ROLES[selectedRole].value) {
      for (let i = selectedRole - 1; i > 0; i--) {
        this.ROLES[i].selected = !this.ROLES[selectedRole].selected;

        this.ROLES[i].disabled = !this.ROLES[selectedRole].selected;
      }
      if (this.ROLES[selectedRole].selected == false) {
        this.newUserRoleValue = this.ROLES[selectedRole].value;
      } else {
        this.newUserRoleValue = 1;
      }
    }

    this.ROLES[selectedRole].selected = !this.ROLES[selectedRole].selected;




    this.makeSelfFM = this.ROLES[3].disabled;
    this.makeSelfMM = this.ROLES[2].disabled;
    this.makeSelfRM = this.ROLES[1].disabled;

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
    // console.log(this.makeSelfRM, this.makeSelfMM, this.makeSelfFM)






  }




  closeAddUserDialog(): void {
    this.addUserForm.reset({ 'role': 1 });
    this.newUserFirstName = '';
    this.newUserLastName = '';
    this.newUserRoleValue = 1;
    this.ROLES = [{ name: 'L0', selected: true, value: 1 }, { name: 'L1', selected: false, value: 2, disabled: false }, { name: 'L2', selected: false, value: 3, disabled: false }, { name: 'L3', selected: false, value: 4, disabled: false }];
    this.ATWORK_ROLES = [{ name: 'L0', selected: true, value: 1 }, { name: 'L1', selected: false, value: 2, disabled: false }, { name: 'L2', selected: false, value: 3, disabled: false }, { name: 'L3', selected: false, value: 4, disabled: false }];
  }



  reSetInput(event){
    event.target.value = '';
  }

  // function for image upload
  onFileChanged(event) {
    this.selectedFile=''
    const file = event.target.files[0];
    const formData = new FormData();
    let filetype = ['image/jpeg', 'image/png', 'image/jpg']
      this.SupportImageType = !filetype.includes(file.type)
      this.SupportImageSize = !this.SupportImageType ? this.filesize(file):false
      // this.SupportImageSize = this.filesize(file)
    this.imageHeightAndWidthChecking(file).then((flag) => {
      this.validateAndUploadImageFile(flag, file, formData)
    }).catch((flag) => {
      this.validateAndUploadImageFile(flag, file, formData)
    })



  }

  validateAndUploadImageFile(flag: boolean, file: any, formData: FormData) {
    formData.append("file", file);
    this.setImageHeightIsValid = !flag;
   
    if (file &&  !this.SupportImageType &&!this.SupportImageSize&& flag) {
      this.http.request('post', 'upload-profile-pic/', '', formData).subscribe(res => {
        if (res.status === 200) {
          this.ss.statusMessage.showStatusMessage(true, "image uploaded successfully");
          this.selectedFile = res.body.results
        }
        else {
          this.ss.statusMessage.showStatusMessage(false, "something went wrong with image upload");
        }

      })
    }
  }

filesize(file):boolean{
  if(Math.floor(file.size / 1000)<= 200){
    return false;
  }
  else{
    return true;
  }
}

  imageHeightAndWidthChecking(file): Promise<boolean> {
if(this.SupportImageType){
  return Promise.resolve(true)
}
    return new Promise((resolved, rejected) => {
      var url = URL.createObjectURL(file);
      var img = new Image;
      img.onload = async () => {
        URL.revokeObjectURL(img.src);
        console.log('width', img.width, 'height', img.height)
        if ((img.width === 200) && (img.height === 200)&&img) {
          resolved(true)
        }else {
          rejected(false)
        }
      }

      img.src = url;
    })
  }


  addUser() {
    let error_message = '';


    let formData = new FormData();
    let deviceId = this.addUserForm.controls.device_id.value;
    let alternativeId = this.addUserForm.controls.amd_id.value
    formData.append('firstName', this.addUserForm.controls.firstName.value);
    formData.append('lastName', this.addUserForm.controls.lastName.value);
    formData.append('staff_no', this.addUserForm.controls.staff_no.value);
    formData.append('device_id', deviceId ==''||deviceId==null? 0 : deviceId);
    formData.append('amd_id', alternativeId ==''||alternativeId==null? 0 : alternativeId);
    formData.append('company', this.addUserForm.controls.company.value);


    formData.append('rep_manager', this.addUserForm.controls.rep_manager.value);

    formData.append('man_manager', this.addUserForm.controls.man_manager.value);

    formData.append('fun_own', this.addUserForm.controls.fun_own.value);


    formData.append('email', this.addUserForm.controls.email.value);
    formData.append('role', this.addUserForm.controls.role.value);

    formData.append('category', this.addUserForm.controls.category.value);
    formData.append('location', this.addUserForm.controls.location.value);
    formData.append('gender', this.addUserForm.controls.gender.value);
    // Rahul changes ************************************************
    formData.append('doj', this.datepipe.transform(this.addUserForm.controls.doj.value, 'yyyy-MM-dd'));
    // ****************************************************************
    formData.append('user_pic', this.selectedFile);
    // formData.append('is_married', this.addUserForm.controls.is_married.value);
    // formData.append('patentry_maternity_cnt', this.addUserForm.controls.patentry_maternity_cnt.value);
    // ******************************************************
    // ******************************************************
    // *****************************************************
    // logging the formdata in console after submission

    formData.forEach(i => {
      console.log("Posting payload for add user:", i)
    })
    // this.reset();
    // *************************************************
    // ************************************************** *
    this.http.request('post', 'users/', '', formData).subscribe(res => {

      if (res.status == 201) {
        this.ss.statusMessage.showStatusMessage(true, "User has been created successfully");
        //after user created make selected file empty
        this.selectedFile=''
        ///////
        this.myNgForm.resetForm()
        this.newUserFirstName = '';
        this.newUserLastName = '';
        this.newUserRoleValue = 1;
        for (let i = 1; i < this.ROLES.length; i++) {
          this.ROLES[i].selected = false
        }
        this.getAllReportes();
        this.addUserForm.reset({ 'role': 1 });
        this.reset();
      } else if (res.error) {

        Object.keys(res.error["results"][0]).forEach(ele => {
          if (ele == 'non_field_errors') {
            error_message = res.error["results"][0][ele][0];
            this.addUserForm.controls['firstName'].setErrors({ 'is_duplicated': true });
            this.addUserForm.controls['lastName'].setErrors({ 'is_duplicated': true });
            this.ss.statusMessage.showStatusMessage(false, error_message);
          }else if(ele=='device_id'){
             error_message = res.error["results"][0][ele][0];
             this.ss.statusMessage.showStatusMessage(false,error_message);
             this.addUserForm.controls['device_id'].setErrors({ 'max_length': true });
          }else if(ele=='amd_id'){
            error_message = res.error["results"][0][ele][0];
            this.ss.statusMessage.showStatusMessage(false,error_message);
            this.addUserForm.controls['amd_id'].setErrors({ 'max_length': true });
         } else {
            error_message = " " + ele;
            this.addUserForm.controls[ele].setErrors({ 'is_duplicated': true });
            this.ss.statusMessage.showStatusMessage(false, "duplicate or invalid data for " + error_message);
          }
        })

      } else if (res.status == 409) {
        error_message += res['results'][0]['non_field_errors'];
        console.log('error message--->',error_message)
        this.ss.statusMessage.showStatusMessage(false, "duplicate or invalid data for " + error_message);
      }
      // this.confirmationModal.close()
    })


  }
  onMaritalStatusChange() {
    if (this.addUserForm.controls.is_married.value == false) {
      this.addUserForm.controls.patentry_maternity_cnt.setValue(0)
    }
  }
  //Rahul change Open dialogBox dynamically(rahul changes) ************************
  // openDialog(): void {
  // const dialogRef = this.dialog.open(ConfirmDialogComponent, {
  //   panelClass: 'confirm-remove-project',
  //   backdropClass:'cdk-overlay-darker-backdrop',
  //   data: {
  //       confirmMessage: 'Are you sure to add this employee?'
  //   }
  // })
  // dialogRef.afterClosed().pipe(take(1)).subscribe(data => {
  //     console.log('######################',data)
  //     if(data){
  //       // call addUser
  //       this.addUser();
  //       //Reeset the for
  //     }
  // })
  // }       
  // **************************************************************** 
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

  getLocations() {
    let location = []
    this.http.request('get', 'location/').subscribe(res => {
      if (res.status == 200) {
        res.body["results"].forEach(ele => {
          location.push(ele);
        })
        this.ALL_LOCATIONS = location;
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
  open(e) {
    console.log("---------------------------------------------------[[[[[[[[[[[[[[[[[[")
    e.click()
  }




  openConfirmation() {
    // this.confirmationModal.open()
    // this.openDialog()
    //Rahul change Open dialogBox dynamically(rahul changes) ************************
    if (this.addUserForm.valid) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        panelClass: 'confirm-remove-project',
        backdropClass: 'cdk-overlay-darker-backdrop',
        data: {
          confirmMessage: 'Are you sure to add this employee?'
        },
        restoreFocus: true
      })
      dialogRef.afterClosed().pipe(take(1)).subscribe(data => {
        // console.log('######################', data)
        if (data) {
          // call addUser
          this.addUser();
          //Reeset the for
        }
      })

    }
    // ************************************************** *
    // ************************************************** *
    // ************************************************** *
    // ************************************************** *
    // ************************************************** *
  }


  closeConfirmation() {
    // this.confirmationModal.close()

  }

  onDate(event): void {
    // console.log("Date input:", event)

  }
  // addUserForm = new FormGroup({},{updateOn: ‘submit’});



}
