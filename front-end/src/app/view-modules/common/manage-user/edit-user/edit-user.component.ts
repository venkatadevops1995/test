import { Component, ElementRef, HostListener, OnInit, Renderer2,TemplateRef, ViewChild } from '@angular/core';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UserService } from 'src/app/services/user.service';
import { HttpParams } from '@angular/common/http';
import ValidateEmail from 'src/app/functions/validations/email';
import { NotNull, NoDate } from '../manage-user.component';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';
import { Observable } from 'rxjs';
import { map, startWith, take } from 'rxjs/operators';
import { DatePipe } from '@angular/common';
import { PopUpComponent } from 'src/app/components/pop-up/pop-up.component';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import { Subject, takeUntil } from 'rxjs';
import { AtaiBreakPoints } from 'src/app/constants/atai-breakpoints';
import * as _ from 'lodash';
export interface UserData {
  emp_id: number;
  name: string;
  staff_no: number;
  company: string;
  role: number,
  email: string,
  // managers: {
  //   'emp_id': number;
  //   'emp_name': string;
  // }[]

}
export interface ILocation{
  id: number,
  name: string,
  status: number
}
@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.scss']
})
export class EditUserComponent implements OnInit{
  //variable for holding image in image upload
  selectedFile:string = ''
  SupportImageType: boolean = false;
  SupportImageSize: boolean = false;
  SupportImageDimension: boolean = false
  heightandwidth: boolean = false;
  //variable for holding the previous image 
  previousVal:any
  get getImageHeightIsValid(): boolean {
    return this.heightandwidth;
  }

  set setImageHeightIsValid(flag: boolean) {

    this.heightandwidth = flag;
  }
  //  Rahul change(using Viewchild for modalPopup)**************************
  @ViewChild("editEmppopup") editEmppopup: TemplateRef<any>;
  @ViewChild("table") table: ElementRef;
  //  ***********************************************************************
  // ********************************************************************
  // ***************************************************************
  //  Rahul change(using Viewchild for disable employee popup)**************************
  @ViewChild("disableEmppopup") disableEmppopup: TemplateRef<any>;
  @ViewChild("errorOnDisablePopup") errorOnDisablePopup: TemplateRef<any>;
  @ViewChild("successOnDisablePopup") successOnDisablePopup: TemplateRef<any>;

  //  ***********************************************************************
  // ********************************************************************
  // ***************************************************************
  @ViewChild('refModalDisable') modalDisable: ModalPopupComponent
  @ViewChild('refModalDisableError') modalDisableError: ModalPopupComponent
  @ViewChild('refModalDisableSuccess') modalDisableSuccess: ModalPopupComponent

  @ViewChild('editEmp') editUserPopup: ModalPopupComponent;

  //Rahul change(adding variable for use breakpoint observer api using singlton service)************
  get is_XMD_LT() {
    return this.ss.responsive.isMatched(AtaiBreakPoints.XMD_LT)
  }
  //*******************************************************************************************


  fgSearch: FormGroup;
  displayedColumns: string[] = ['serial_no', 'staff_no', 'name', 'company', 'email', 'category','device_id','amd_id', 'edit', 'disable'] // 'reporting_manager', 'managers_manager', 'functional_manager', ];
  GROUPS_DATA: any[];
  IS_mobile:boolean=false;
  constructor(public dialog: MatDialog,
    private datepipe: DatePipe,
    private ss: SingletonService,
    private http: HttpClientService,
    private fb: FormBuilder,
    private user: UserService,
    // Rahul change(making DialogRef as a global variable)for closing and opening the squre popup********
    public dialogRef: MatDialogRef<any>,

    private el: ElementRef
    //*****************************************************************************************
    // ***********************************************************************************************
  ) {
    this.fgSearch = this.ss.fb.group({
      filtervalue: ["", [Validators.required]],
    }),
    this.filteredManagers = this.searchField.valueChanges
      .pipe(
        startWith(''),
        map(state => state ? this.filterManagerList(state) : this.employeeListSearch.slice())
      );
      this.ss.responsive.observe(AtaiBreakPoints.XS).subscribe(val=>{ 
        this.IS_mobile=val.matches;
             })
  }
  deleteUserForm = this.fb.group({
    'dol': ['', [Validators.required, NoDate()]],
  })

  USERS_DATA: UserData[] = [];
  ALL_CATEGORIES = [];
  index: number = -1;
  employeeListSearch: any = [];
  employeeList: any = [];
  ALL_GENDERS = [{ name: "Male", id: 1 }, { name: "Female", id: 2 }, { name: "Other", id: 0 }];
  ALL_LOCATIONS:Array<ILocation> = [];
  show_message = false;
  filteredManagers: Observable<any>;
  errorMessage: string = "";
  userName: string = '';
/*variable empId will hold the value of employee id while sending payload to API--> update_device_id/
*/
  empId:Number
  delete_emp_success_msg: string = '';
  ngOnInit(): void {
    this.getAllReportes();
    this.getCompanies()
    this.getCategories();
    this.getLocations();
    // this.renderer.listen(this.table?.nativeElement,'click',(evt)=>{
    //   console.log('hello u clicked on the table!!!')
    // })
  }
  private filterManagerList(value: string) {
    const filterValue = value.toLowerCase();
    return this.employeeListSearch.filter(option => option.emp_name.toLowerCase().includes(filterValue))
    // return this.filterArray.filter(state => state.emp_name.toLowerCase().indexOf(filterValue) === 0);
  }
  searchField = this.fb.control('ALL', [Validators.required])

  //Rahul change(adding event daligation for table row when clicking on edit and disable icon) *******************************
  @HostListener('click', ['$event'])
  onClickHost(e) {
    let target: any = e.target;
    let tempTarget = target;
    console.log("--------------click");
    // if(e.target.classList.contains('edit')){
    //   let index=e.target.getAttribute("index");
    //   console.log('$$$$$$$$$$$$$$$$$$$$$$$',index);
    //   this.editUser(index);
    // }

    while (tempTarget != this.el.nativeElement) {
      if (tempTarget.classList.contains('edit')) {
        console.log('::::::::::::::clicked on the edit icon');
        let index = tempTarget.getAttribute("index");
        this.editUser(index);
        break;
      }
      if (tempTarget.classList.contains('disable')) {
        console.log('::::::::::::::clicked on the disable icon');
        let index = tempTarget.getAttribute("index");
        this.setId(index);
        this.disableEmppopupopen()
        break;
      }
      tempTarget = tempTarget.parentNode;
    }

  }

  //**************************************************************************** 

  editUserForm = this.fb.group({
    'emp_id': ['', Validators.required],
    'emp_name': ['', Validators.required],
    'staff_no': ['', Validators.required],
    'company': ['', Validators.required],
    // 'rep_manager': ['', [Validators.required, NotNull()]],
    // 'man_manager': ['', [Validators.required, NotNull()]],
    // 'fun_own': ['', [Validators.required, NotNull()]],
    'email': ['', [Validators.required, ValidateEmail]],
    // 'role': [1, Validators.required],
    'location':['', Validators.required],
    'category': ['', Validators.required],
    // 'doj': ['', [Validators.required, NoDate()]],
    'gender': ['', Validators.required],
    'device_id':['0',[Validators.pattern("^[0-9]*$")]],
    'amd_id':['0',[Validators.pattern("^[0-9]*$")]],
    'user_pic': ['']
    // 'is_married': ['',Validators.required],
    // 'patentry_maternity_cnt': [0,Validators.required],
  })
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

  clear() {
    this.searchField.reset();
    this.searchField.setValue('');
    this.searchField.updateValueAndValidity()
  }

  getAllReportes(): void {
    this.employeeListSearch = []
    const params = new HttpParams().set("type", "hr").set("search", this.searchField.value)
    console.log("-----------------", this.searchField.value)
    this.http.request("get", "users/", params).subscribe(res => {

      if (res?.body["success"] == true) {
        this.show_message = true
        let emp_list = []
        res.body["results"].forEach(ele => {
          // console.log("---------------",ele)
          Array.prototype.push.apply(emp_list, [ele]);
        })
        console.log('----------------emp_list--', emp_list)

        this.USERS_DATA = emp_list;
        this.employeeList = [...this.USERS_DATA]
        let employeeList = [...this.USERS_DATA];
        this.employeeListSearch.push({ emp_id: -1, emp_name: 'ALL' });
        employeeList.forEach(element => {
          this.employeeListSearch.push(element);
        });


      } else {
        this.ss.statusMessage.showStatusMessage(false, "error in fetching users");
      }

    });


  }

  Search(term:string){
    if(!term || term.trim().toLowerCase() == 'all'){
   this.getAllReportes()
    }else{
      this.USERS_DATA=this.employeeListSearch.filter(x =>
        x.emp_name.trim().toLowerCase().includes(term.trim().toLowerCase())
      );
    }
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
  reset() {
    this.searchField.reset()
    this.USERS_DATA = []
  }
  // (rahul change) adding the onDateSelection() for selecting date****************

  onDate(event): void {
    console.log("Date input:", event)

  }
  //***************************************************************************** */

  editUser(i) { 

    this.editUserForm.controls.emp_id.setValue(this.USERS_DATA[i]["emp_id"]);
    this.editUserForm.controls.emp_name.setValue(this.USERS_DATA[i]["emp_name"]);
    this.editUserForm.controls.staff_no.setValue(this.USERS_DATA[i]["staff_no"]);
    this.editUserForm.controls.company.setValue(this.USERS_DATA[i]["company"]);
    this.editUserForm.controls.email.setValue(this.USERS_DATA[i]["email"]);
    this.editUserForm.controls.category.setValue(this.USERS_DATA[i]["category"]);
    this.editUserForm.controls.gender.setValue(this.USERS_DATA[i]["gender"]);
    this.editUserForm.controls.location.setValue(this.getLocationId(this.USERS_DATA[i]["location"]));
    //setting the value of image formcontrol 
    this.editUserForm.controls.user_pic.setValue(this.USERS_DATA[i]["user_pic"]);
    this.editUserForm.controls.device_id.setValue(this.USERS_DATA[i]["device_id"]??'0');
    this.editUserForm.controls.amd_id.setValue(this.USERS_DATA[i]["amd_id"]??'0')
    this.previousVal= this.USERS_DATA[i]["user_pic"];
    this.selectedFile = this.USERS_DATA[i]["user_pic"];
    
    // Rahul change(opening modal popup)******************************
    // this.editUserPopup.open() 
    this.dialogRef = this.dialog.open(PopUpComponent, {
      data: {
        heading: 'Edit Employee',
        template: this.editEmppopup,
        maxWidth: '420px',
        hideFooterButtons: true,
        showCloseButton: true,
      },
      autoFocus: false,
      restoreFocus:true
    })
    this.dialogRef.afterClosed().subscribe(result => {
      if(!result){
        //image support variable setting into default
        this.SupportImageType = false;
        this.SupportImageSize = false;
        this.setImageHeightIsValid = false;
      }
    })
    // calling setId() for getting userName corresponding to click index
    this.setId(i)
    // ******************************************************************
    console.log(i,)
    this
  }
 
  getLocationId(location:string){
    return this.ALL_LOCATIONS.filter(loc=>loc.name.toLowerCase()===location.toLowerCase())[0]?.id
  }

  close() {
    this.editUserForm.reset()
    // this.editUserPopup.close()
    // this.dialog.closeAll()
    console.log("$$$$$  Close cl")
    this.dialogRef.close()
    this.SupportImageType = false;
    this.SupportImageSize = false;
    this.setImageHeightIsValid = false;
  }

  reSetInput(event){
    event.target.value = '';
  }

    // function for image upload
// function for image upload
  onFileChanged(event) {
    this.selectedFile=''
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    let filetype = ['image/jpeg', 'image/png', 'image/jpg']
      this.SupportImageType = !filetype.includes(file.type)
      this.SupportImageSize = !this.SupportImageType?this.filesize(file):false
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
          this.editUserForm.controls['user_pic'].setValue(this.selectedFile)
        }
        else {
          this.ss.statusMessage.showStatusMessage(false, "something went wrong with image upload");
        }

      })
    }else{
      // for invalid image setting previous image value 
      this.editUserForm.controls['user_pic'].setValue(this.previousVal)
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
  //for invalid type of image ie file resolve the promise
  if(this.SupportImageType){
    return Promise.resolve(true)
  }
  ///////
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
///////////
  
  updateEmp() {
    if(this.editUserForm.get('device_id').value===''){
     _.set(this.editUserForm.value,'device_id',"0")
    }
     if(this.editUserForm.get('amd_id').value===''){
     _.set(this.editUserForm.value,'amd_id',"0")
    }
    this.http.request("put", "users/", '', this.editUserForm.value).subscribe(res => {

      if (res.status == 200) {
        console.log("-------------------------");
        this.ss.statusMessage.showStatusMessage(true,res?.body?.results);
        this.close()
        this.getAllReportes()
        this
      }else if(res.status == 400){
        const deviceIdErrorkey = res?.error?.results[0]?.device_id?.[0];
        if(deviceIdErrorkey){
          this.ss.statusMessage.showStatusMessage(false,deviceIdErrorkey);
        }
        const empNameErrorkey = res?.error?.results[0]?.emp_name;
        if(empNameErrorkey){
          this.ss.statusMessage.showStatusMessage(false,empNameErrorkey);
        }
        const empEmailErrorkey = res?.error?.results[0]?.email;
        if(empEmailErrorkey){
          this.ss.statusMessage.showStatusMessage(false,empEmailErrorkey);
        }
        const empAmdIdErrorkey = res?.error?.results[0]?.amd_id?.[0];
        if(empAmdIdErrorkey){
          this.ss.statusMessage.showStatusMessage(false,empAmdIdErrorkey);
        }
      }
    })
    //clear image form control
    this.editUserForm.controls['user_pic'].setValue('')
  }


  // disable user 

  disableUser(i) {
    console.log(i);
    this.editUserForm.controls.emp_id.setValue(this.USERS_DATA[i]["emp_id"]);
    this.disableEmp();
  }
  disableEmp() {
    console.log('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%date%%%%%%%%%%%%%%%%%%%%', this.deleteUserForm.value.dol)
    if (this.deleteUserForm.value.dol) {
      let obj = {
        emp_id: this.editUserForm.value.emp_id,
        relieved: this.datepipe.transform(this.deleteUserForm.value.dol, 'yyyy-MM-dd'),
        //   relieved : this.datepipe.transform(this.deleteUserForm.controls.dol.value.startDate._d, 'yyyy-MM-dd')
      }

      this.http.request("put", "delete/", '', obj).subscribe(res => {
        if (res.status == 400) {
          this.errorMessage = res.error.message + ". First update employee's manager";
          // this.modalDisableError.open()
          //Rahul change(open a dialog box on status 400 when user click on disable employee proceed button ) ************************

          this.dialog.open(ConfirmDialogComponent, {
            panelClass: 'confirm-remove-project',
            backdropClass: 'cdk-overlay-darker-backdrop',
            data: {
              template: this.errorOnDisablePopup,
              heading: '',
              hideFooterButtons: true,
            },
            restoreFocus:true
          })
          // **************************************************************** 
          this.deleteUserForm.controls.dol.setValue('')
          return;
        } else if (res.status == 406) {
          this.errorMessage = res.error.message;
          // this.modalDisableError.open()
          //Rahul change(open a dialog box  when user click on disable employee proceed button and enter releaving date less then 
          //joining date ) ************************
          this.dialog.open(ConfirmDialogComponent, {
            panelClass: 'confirm-remove-project',
            backdropClass: 'cdk-overlay-darker-backdrop',
            data: {
              template: this.errorOnDisablePopup,
              heading: '',
              hideFooterButtons: true,
            },
            restoreFocus:true
          })
          // **************************************************************** 

          this.deleteUserForm.controls.dol.setValue('')
          return;
        }
        if (res.body["success"] == true) {

          console.log("-------------------------")
          // this.modalDisableError.open()
          //Rahul change(open a dialog box on status success when user click on disable employee proceed button ) ************************

          this.dialog.open(ConfirmDialogComponent, {
            panelClass: 'confirm-remove-project',
            backdropClass: 'cdk-overlay-darker-backdrop',
            data: {
              template: this.successOnDisablePopup,
              heading: '',
              hideFooterButtons: true,
            },
            restoreFocus:true
          })
          // **************************************************************** 
          this.close()
          this.getAllReportes()
          this.delete_emp_success_msg = res.body.results
          this.deleteUserForm.controls.dol.setValue('')
          this
        } else {
          alert(res.body.message)

          this.errorMessage = res.body.message;
          // this.modalDisableError.open();
          //Rahul change(open a dialog box  when user click on disable employee proceed button and get some server error 
          this.dialog.open(ConfirmDialogComponent, {
            panelClass: 'confirm-remove-project',
            backdropClass: 'cdk-overlay-darker-backdrop',
            data: {
              template: this.errorOnDisablePopup,
              heading: '',
              hideFooterButtons: true,
            },
            restoreFocus:true
          })
          // **************************************************************** 

          this.deleteUserForm.controls.dol.setValue('')
          return;

        }
      })
    } else {
      return;
    }

  }
  setId(i: number) {
    this.index = i;
    this.userName = this.USERS_DATA[i]["emp_name"]
    //Rahul change(assigning employee name after calling setId() from editUser() by passing the index number*****
    //********************************************************************************************* 
    //**********************************************************************
  }

  proeceedDisable() {
    //  Rahul change (closing disableEmployee popup)***************************
    //  **********************************************************************
    //  this.modalDisable.close();
    this.dialogRef.close();
    if (this.index != -1) {
      this.disableUser(this.index);
    }
  }
  open(e) {
    console.log("---------------------------------------------------[[[[[[[[[[[[[[[[[[")
    e.click()
  }

  //Rahul change (disableEmppopupopen() and disableEmppopupclose() are added)in order to open and close disable employee squre
  // popup
  disableEmppopupopen() {
    this.deleteUserForm.get('dol').setValue("")
    this.deleteUserForm.get('dol').markAsUntouched();
    this.dialogRef = this.dialog.open(PopUpComponent, {
      data: {
        heading: 'Edit Employee',
        template: this.disableEmppopup,
        maxWidth: '420px',
        hideFooterButtons: true,
        showCloseButton: true,
      },
      autoFocus: false,
      restoreFocus:true
    })
  }
  // disableEmpclose(){
  //   this.dialogRef.close();
  // }
  //**************************************************************************************** */
  //Rahul change ( disableerorrpopup() is added in order to close all confermation popup 
  // while user click on disable employee proceed  button

  disableerorrpopup() {
    console.log('disable error popup have been close#####################')
    this.dialog.closeAll();
  }
  //**************************************************************************************** */
}