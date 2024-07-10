import { ChangeDetectorRef, Component, HostBinding, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { slideAnimationTrigger } from 'src/app/animations/slide.animation';
import { ThemePalette } from '@angular/material/core';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabGroup } from '@angular/material/tabs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PopUpComponent } from 'src/app/components/pop-up/pop-up.component';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import { take } from 'rxjs/operators';
import { BreakpointObserver } from '@angular/cdk/layout';
import { AtaiBreakPoints } from 'src/app/constants/atai-breakpoints';

export interface Task {
  id?: Number,
  name: string;
  completed: boolean;
  subtasks?: Task[];
}

@Component({
  selector: 'app-policy-config',
  templateUrl: './policy-config.component.html',
  styleUrls: ['./policy-config.component.scss'],
  animations: [slideAnimationTrigger]
})
export class PolicyConfigComponent implements OnInit {
  //  Rahul change************
  @ViewChild('selectEmp') selectEmp: TemplateRef<any>;
  @ViewChild('selectedEmpPopup') selectedEmpPopup: TemplateRef<any>;

  //**********************
  // @ViewChild('selectEmployeePopup') selectEmpModal: ModalPopupComponent;
  @ViewChild('selectedEmployeePopup') selectedEmpModal: ModalPopupComponent;

  @ViewChild('publishPolicyRef') publishPolicyModal: ModalPopupComponent;

  @ViewChild('discardSelectRef') discardSelectModal: ModalPopupComponent;

  @ViewChild(MatTabGroup) tabGroup: MatTabGroup;
  tabList = []
  // tabList = ["View Only", "Digitally Acknowledged", "Download and Upload"]


//  Rahul change(setting a boolean var to find out range is matches to meadiaquery)*****
// Is_match:boolean;
get Is_match(){
  return this.ss.responsive.isMatched([AtaiBreakPoints.XMD_LT,
     ])
}
get Is_SM(){
  return this.ss.responsive.isMatched([AtaiBreakPoints.XS,AtaiBreakPoints.SM,AtaiBreakPoints.MD
     ])
}
get is_XS(){
  return this.ss.responsive.isMatched(AtaiBreakPoints.XS)
}
//  ******************************************************************************
DisableCheck:boolean=false;

  employeePopupColumns = ["select", "staff_no", "emp_name", "company"]
  selectedEmployeePopupColumns = ["serial_no", "staff_no", "emp_name", "company"]
  tabIndexControl = this.fb.control(0)
  selectTab = 0
  EMPLOYEE_DATA: any = []
  EMPLOYEE_FILTERED_DATA: any = []
  policyForm;
  EDITED_EMP_IDS: any = []
  SELECTED_EMPLOYEE_DATA: any = []
  // policyForm = this.fb.group({
  //   "policy_type":['', Validators.required],
  //   "policy_name": ['', Validators.required],
  //   "file_name": ['', Validators.required],
  //   "display_name": ['', Validators.required],
  //   "enable_for": ['ALL'],
  //   "company_list":[],
  //   // "emp_list":[],
  //   "enable_on":[''],
  //   "expire_on":['']
  // })
  employeeSearchControl = this.fb.control('')
  policyUploadControl = this.fb.control('', [Validators.required])
  edit_policy = false
  policy_id = ''
  emp_count = 0;
  allSelected: boolean = false;
  enable_for_options = [{ option: 'ALL', value: 'All employees' },
  { option: 'FEW', value: 'Selected employees' }]
  showUploadBlock: boolean;

  // to avoid the start slide animation of tab group
  showView: boolean = false;

  constructor(private fb: FormBuilder,
    private http: HttpClientService,
    private ss: SingletonService,
    public datepipe: DatePipe,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<any>,
    private changeDetectorRef: ChangeDetectorRef,
    private responsive: BreakpointObserver
  ) {
    this.getCompanies()


    this.policyForm = this.fb.group({
      "policy_type": ['', Validators.required],
      "policy_name": ['', Validators.required],
      "file_name": ['', Validators.required],
      "display_name": ['', Validators.required],
      "enable_for": ['ALL'],
      "company_list": [],
      // "emp_list":[],
      "enable_on": [''],
      "expire_on": ['']
    })

    const state = router.getCurrentNavigation().extras.state;

    if (state != undefined) {
      this.policy_id = state['policy_id']
      this.edit_policy = true
      this.getPolicyType(state['type'])
      this.showUploadBlock = false;

      this.getPolicyById(this.policy_id)
      console.log('==this.selectTab', this.selectTab)

    }
    else {
      this.showUploadBlock = true;
      this.getPolicyType()
    }
    // // Rahul change(Using breakpoint observer Api)************
    // this.responsive.observe([AtaiBreakPoints.XS,
    //   AtaiBreakPoints.SM,AtaiBreakPoints.MD
    //  ]
    //   ).subscribe(res=>{
    //   // console.log('@@@@@@@@@@@@@@@@@@@@@@@@!!!!!!!!!',res.matches)
    //   this.Is_match=res.matches;
    //   if(res.matches)
    //   {
    //     console.log('hello the breakpoints has been matches');
    //   }
    //    console.log('!!!!!!!!!!@@@@@@@@@@@##########',this.Is_match);
    //   console.log('@@@@@@@@@@@@@@@@@@@@@@@@!!!!!!!!!',res.matches);
    // })
   
    // ***********************************************************
    // *****************************************************
  }

  subs: any;

  @HostBinding('style.visibility') get visibility() {
    return this.showView ? 'visible' : 'hidden';
  }


  ngOnInit(): void {

    console.log("-------------------", this.edit_policy);
    // this.changeDetectorRef.detectChanges()

    // this.getPolicyType();
    this.companyList.completed = true
    this.companyList.subtasks.forEach(t => t.completed = true);
    this.policyUploadControl.valueChanges.subscribe(s => {
      console.log("-------------***********************-------------file", s);

    })
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.showView = true
    }, 200)
  }

  setTab(v) {
    console.log("--------------SET TAB----", v, this.tabIndexControl.value);

    this.policyForm.controls.policy_type.setValue(this.tabList[v]["id"])

  }

  companyList: Task = {
    name: 'All',
    completed: false,
    subtasks: [
      { id: 1, name: 'SoCtronics', completed: false },
      { id: 2, name: 'INVECAS', completed: false },
      { id: 3, name: 'Atai', completed: false },
      // { id: 4, name: 'Veda', completed: false }
    ]
  };
  searchKey: any = '';
  updateFilterData() {
    var selectdCompList = []
    var selectdComp = this.companyList.subtasks.filter(c => { return c.completed == true })
    selectdCompList = selectdComp.map(e => e.name)
    this.EMPLOYEE_FILTERED_DATA = this.EMPLOYEE_DATA.filter((e) => {
      return e.emp_name.toLowerCase().includes(this.searchKey) && (selectdCompList.indexOf(e.company) != -1)

    })
    this.updateEmpSelection()
  }

  updateAllComplete(): void {

    const allComplete = this.companyList.subtasks != null && this.companyList.subtasks.every(t => t.completed);
    this.companyList.completed = allComplete

    console.log('###@@@@@@@@@@@@@@@333########', this.companyList)
    // if(this.companyList.completed==false && this.companyList.subtasks.length==3){
    //   this.DisableCheck=true;
    //   console.log('DisableCheck1',this.DisableCheck)
    // }else{
    //   this.DisableCheck=false;
    //   console.log('DisableCheck2',this.DisableCheck)
    // }

    if (this.companyList.completed == false) {
      let cnt = 0
      this.companyList.subtasks.map((sub_task) => {
        console.log("syb tasks,", sub_task)
        if (sub_task.completed == false) {
          cnt += 1;
        }
        console.log("!!!!!!!!!!!!!!!!->count1", cnt)
        if (cnt == this.companyList.subtasks.length ) {
          this.DisableCheck = true;
        } else {
          this.DisableCheck = false;
        }
        console.log("###############->count2", cnt)
         })
      cnt = 0;
      } else {
      this.DisableCheck = false;
    }
    this.updateFilterData()
    if(this.EMPLOYEE_FILTERED_DATA.length==0)
    this.DisableCheck = true;
  }


  // ********************************************************
  // *******************************************************
  // ********************************************************
  // *****************************************************
  // *****************************************************
  setAll(e) {
    console.log("------------------------------------------------------", e);

    var completed = e.target.checked
    this.companyList.completed = completed

    if (this.companyList.subtasks == null) {
      return;
    }
    this.companyList.subtasks.forEach(t => t.completed = completed);

    if (this.companyList.completed == false) {
      this.DisableCheck = true;
    } else {
      this.DisableCheck = false;
    }

    console.log('%%%%%%%%%%%%%%%%%%', this.companyList)


    this.updateFilterData()

  }

  async getCompanies() {
    const res = await this.http.request('GET', 'all-company/', '').toPromise()
    if (res.status == 200) {
      console.log(res.body)
      var comList = []
      res.body['results'].forEach(e => {
        comList.push({ id: e['id'], name: e['name'], completed: true })
      })
      this.companyList.subtasks = comList;

    } else {
      this.ss.statusMessage.showStatusMessage(false, "Issue while fetching companies");

    }
  }
  async openSelectEmp(val, fetch = true) {
    if (val == "FEW") {
      this.isFetched = false
      this.policyForm.addControl('emp_list', this.fb.control([], [Validators.required]));
    }
    if (val == "ALL") {
      // this.policyForm.controls.emp_list.reset()
      if (this.emp_count > 0) {
        // this.discardSelectModal.open()

        //Rahul change Open dialogBox dynamically(rahul changes) ************************
        // this.publishPolicyModal.open();
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          panelClass: 'confirm-remove-project',
          backdropClass: 'cdk-overlay-darker-backdrop',
          data: {
            confirmMessage: `Are you sure to discard${this.emp_count}selected employee(s) ?`
          },
          restoreFocus:true
        })
        dialogRef.afterClosed().pipe(take(1)).subscribe(data => {
          console.log('######################', data)
          if (data == true) {
            this.discardSelection()
          } else {
            this.closeDiscardSelectModal()
          }
        })

        // **************************************************************** 

      } else {
        this.policyForm.removeControl('emp_list');
      }
      // this.companyList.subtasks.forEach(t => t.completed = true);
      // this.companyList.completed = true;
    }
  }

  discardSelection() {
    this.emp_count = 0
    this.SELECTED_EMPLOYEE_DATA = []
    this.policyForm.removeControl('emp_list');
    // this.discardSelectModal.close()
  }
  closeDiscardSelectModal() {
    this.policyForm.controls.enable_for.setValue('FEW')
    // this.discardSelectModal.close()
  }


  isFetched = false;
  async editSelectEmp() {
    if (!this.isFetched) {
      this.isFetched = true
      // this.emp_count = 0
      await this.getAllUser()

    }
    console.log("====================", this.EMPLOYEE_DATA);

    this.updateFilterData()
    this.employeeSearchControl.reset('')

    // Rahul change (opening selected)********************************
    // this.selectEmpModal.open();
    this.dialogRef = this.dialog.open(PopUpComponent, {
      data: {
        heading: 'Select Employees',
        template: this.selectEmp,
        maxWidth: '850px',
        // minWidth:'false? 80vw :420px',
        hideFooterButtons: true,
        showCloseButton: true,
        padding_horizontal: false,
        padding_vertical: false,
        // vertical_scroll:false,
        mb_30: false
      },
      autoFocus: false,
      restoreFocus:true
    })
    //*************************************
    let selectedComps = []
    this.companyList.subtasks.forEach(c => {
      if (c.completed == true) {
        selectedComps.push(c.name)
      }
    })

    this.EMPLOYEE_FILTERED_DATA = this.EMPLOYEE_DATA.filter(emp => { return (selectedComps.indexOf(emp.company) != -1) });

    this.subs = this.employeeSearchControl.valueChanges.subscribe(val => {
      let selectedCompanies = []
      this.companyList.subtasks.forEach(c => {
        if (c.completed == true) {
          selectedCompanies.push(c.name)
        }
      })

      this.searchKey = val.trim().toLowerCase()

      if (val.trim() == '') {
        this.EMPLOYEE_FILTERED_DATA = this.EMPLOYEE_DATA.filter(emp => { return (selectedCompanies.indexOf(emp.company) != -1) });

      } else {
        this.EMPLOYEE_FILTERED_DATA = this.EMPLOYEE_DATA.filter(emp => {

          return (selectedCompanies.indexOf(emp.company) != -1) && emp.emp_name.toLowerCase().includes(this.searchKey)
        })
      }
      this.updateEmpSelection()
      console.log(this.EMPLOYEE_FILTERED_DATA)

    })
  }

  openSelectedEmp() {
    // Rahul change (opening modified popup for selected employee)****************
    // this.selectedEmpModal.open()
    this.dialogRef = this.dialog.open(PopUpComponent, {
      data: {
        heading: 'Selected Employees',
        template: this.selectedEmpPopup,
        maxWidth: '850px',
        hideFooterButtons: true,
        showCloseButton: true,
        padding_horizontal: false,
        padding_vertical: false,
        vertical_scroll: false,
        mb_30: false
      },
      autoFocus: false,
      restoreFocus:true
    })
    // **************************************************************
  }

  closeSelectEmp(isCancelled = false) {
    if (isCancelled == false) {
      const uniqueCompanies = new Set();
      this.SELECTED_EMPLOYEE_DATA = []
      const selectedEmps = this.EMPLOYEE_DATA.filter(e => {
        if (e.selected == true) {
          this.SELECTED_EMPLOYEE_DATA.push(e)
          uniqueCompanies.add(e.company); return true;
        }
      }).map(m => m.emp_id)
      console.log("------------selectedEmps---------------", selectedEmps);

      this.companyList.subtasks.forEach(c => {
        if (uniqueCompanies.has(c.name)) {
          c.completed = true
        } else {
          c.completed = false
        }
      })
      const allComplete = this.companyList.subtasks != null && this.companyList.subtasks.every(t => t.completed);
      this.companyList.completed = allComplete

      this.emp_count = selectedEmps.length
      this.policyForm.controls.emp_list.setValue(selectedEmps);
    }
    this.subs.unsubscribe()
  }
  selectAllEmp(e) {
    this.allSelected = e.target.checked
    this.EMPLOYEE_FILTERED_DATA = this.EMPLOYEE_FILTERED_DATA.map(e => { e.selected = this.allSelected; return e })
  }

  updateEmpSelection() {
    this.allSelected = this.EMPLOYEE_FILTERED_DATA.every(e => e.selected)
  }
  selectEmployeeList() {
    this.policyForm.controls.emp_list.markAsTouched()
    this.policyForm.updateValueAndValidity()
    this.closeSelectEmp();
    // Rahul change (closing)
    // this.selectEmpModal.close();
    this.dialogRef.close();
    //*************************************
  }

  uploadFile() {

    if (this.policyUploadControl.value instanceof File) {
      console.log("file upload", this.policyUploadControl.value);
      const formData = new FormData();
      let file__type = this.policyUploadControl.value.type
      if (file__type === 'application/pdf') {
        formData.append('file', this.policyUploadControl.value)
        this.http.request('POST', 'policy/upload/', '', formData).subscribe(res => {
          if (res.status == 200) {
            this.ss.statusMessage.showStatusMessage(true, "File has been uploaded successfully");
            this.policyForm.controls.file_name.setValue(res.body['results']['filename'])
            this.policyForm.controls.display_name.setValue(res.body['results']['displayname'])


          } else {
            this.ss.statusMessage.showStatusMessage(false, "Issue while uploading file");
            this.policyForm.controls.file_name.reset()
            this.policyForm.controls.display_name.reset()
            this.policyUploadControl.reset()
          }
        })
      } else {
        this.ss.statusMessage.showStatusMessage(false, "Only pdf files allowed");
        this.policyForm.controls.file_name.reset()
        this.policyForm.controls.display_name.reset()
        this.policyUploadControl.reset()
      }
    } else {


      this.policyForm.controls.display_name.markAsTouched();
      this.policyForm.controls.display_name.setErrors({ required: true })
      this.policyForm.updateValueAndValidity()
      this.policyForm.controls.file_name.setValue("")
      this.policyForm.controls.display_name.setValue("")
    }

  }



  publishPolicy() {
    const dataFormat = "yyyy-MM-dd"
    var enable_date = this.datepipe.transform(new Date(), dataFormat)
    var expire_date = this.datepipe.transform(new Date((new Date().getFullYear() + 1), 11, 31), dataFormat)
    this.policyForm.controls.enable_on.setValue(enable_date);
    this.policyForm.controls.expire_on.setValue(expire_date);
    var companies = this.companyList.subtasks.filter(e => e.completed).map(m => m.id)
    this.policyForm.controls.company_list.setValue(companies);
    console.log(this.policyForm.value);

    if (this.policy_id == '') {


      this.http.request('POST', 'policy/', '', this.policyForm.value).subscribe(res => {
        if (res.status == 201) {
          this.ss.statusMessage.showStatusMessage(true, "Policy has been created successfully");
          var policy_type = this.policyForm.controls.policy_type.value
          this.policyForm.reset({ 'policy_type': policy_type, 'enable_for': 'ALL' })
          this.policyUploadControl.reset()
          // Rahul change (closing publish policy popup confermation)*******************
          // this.publishPolicyModal.close()
          // ************************************************************************
          this.SELECTED_EMPLOYEE_DATA = [];
          this.emp_count = 0;
          this.companyList.completed = true;
          this.companyList.subtasks.forEach(t => t.completed = true);
        }else if(res.error){
          console.log("error",res.error["results"]['company_list'])
          if(res.error["results"]['company_list']){
            let error_message ="Please select atleast one company group."
            console.log(error_message)
            this.ss.statusMessage.showStatusMessage(false, error_message);
          }
          else {
            this.ss.statusMessage.showStatusMessage(false, "Issue while creating policy");
  
          }         
        } 
      })
    } else {

      this.http.request('PUT', 'policy/' + this.policy_id + "/", '', this.policyForm.value).subscribe(res => {
        if (res.status == 201) {
          this.ss.statusMessage.showStatusMessage(true, "Policy has been updated successfully");
          var policy_type = this.policyForm.controls.policy_type.value
          this.policyForm.reset({ 'policy_type': policy_type, 'enable_for': 'ALL' })
          this.policyUploadControl.reset()
          this.navigateToList()
        } else {
          this.ss.statusMessage.showStatusMessage(false, "Issue while updating policy");

        }

      })
    }
  }


  navigateToList() {
    var parentUrl = this.router.url.split('/')
    parentUrl.splice(-1, 1);

    this.router.navigate([parentUrl.join("/") + '/document-list']);
  }

  async getAllUser() {

    this.EMPLOYEE_DATA = []
    var res = await this.http.request('GET', 'users/', 'type=hr&search=ALL', this.policyForm.value).toPromise()
    if (res.status == 200) {
      //Rahul change(issue fixed when we open selectedEmp popup after closed selectEmp popup just by resetting the array)
      this.SELECTED_EMPLOYEE_DATA=[];
      //***********************************************************
      res.body['results'].forEach(e => {
        var emp = e;

        // console.log('!!!!!!!!!!!!!',typeof(e))

        if (this.EDITED_EMP_IDS.indexOf(e.emp_id) == -1) {
          emp["selected"] = false;
        } else {
          emp["selected"] = true;
          console.log("SELECTED_EMPLOYEE_DATA                        ===");
          console.log(':::::::::::::::-->',this.SELECTED_EMPLOYEE_DATA)
         
          this.SELECTED_EMPLOYEE_DATA.push(e)
        }
        this.EMPLOYEE_DATA.push(emp)
        console.log('#######################', emp)

      })
    } else {
      this.ss.statusMessage.showStatusMessage(false, "Issue while getting users");

    }
  }
  async getPolicyType(t_id = 0) {
    this.tabList = []
    var selectIndex = 0
    var res = await this.http.request('GET', 'policy/type/', '', this.policyForm.value).toPromise()
    if (res.status == 200) {
      res.body['results'].forEach((e, index) => {

        this.tabList.push(e)
        if ((t_id != 0) && (e.id == t_id)) {
          selectIndex = index
        }


      })
      console.log("---------------------------------setting", this.selectTab);
      this.tabIndexControl.setValue(selectIndex)

    } else {
      this.ss.statusMessage.showStatusMessage(false, "Issue while getting policy type");

    }
    // this.policyForm.controls.policy_type.setValue(this.tabList[0]["id"]) commenting
  }
  fileObjInstance;
  async getPolicyById(id) {
    const res = await this.http.request('GET', "policy/" + id + "/", "", "").toPromise();
    console.log("---------------------------------fun call----------")
    if (res.status == 200) {
      // console.log("========================",res.status,res.body["results"]);
      this.policyForm.controls.policy_type.setValue(res.body["results"][0]["policy_type"])
      this.policyForm.controls.policy_name.setValue(res.body["results"][0]["policy_name"])
      this.policyForm.controls.file_name.setValue(res.body["results"][0]["file_name"])
      this.policyForm.controls.display_name.setValue(res.body["results"][0]["display_name"])
      this.policyForm.controls.enable_for.setValue(res.body["results"][0]["enable_for"])

      const fileRes = await this.http.request("GET", "policy/upload/", "policy_id=" + id).toPromise()

      if (fileRes.status == 200) {
        console.log("=================fileRES=========", fileRes["error"]["text"], fileRes.headers.get('content-type'));
        if (fileRes["error"] != undefined) {
          const contentType = fileRes.headers.get('content-type');
          const fileParts = [new Blob([fileRes["error"]["text"]], { type: contentType })];
          const fileObj = new File(fileParts, res.body["results"][0]["display_name"], { type: contentType })
          this.fileObjInstance = fileObj
          console.log("------------------ccccccccccccccccccccccccccccccc--------------------", this.fileObjInstance);

          // this.policyUploadControl.setValue(this.fileObjInstance)
          this.showUploadBlock = true
        }

      } else {
        console.log("file not found");
        this.showUploadBlock = true
      }






      this.EDITED_EMP_IDS = []
      if (res.body["results"][0]["enable_for"] == "FEW") {
        this.policyForm.addControl('emp_list', this.fb.control([], [Validators.required]));
        this.emp_count = res.body["results"][0]["emp_list"].length
        res.body["results"][0]["emp_list"].forEach(emp => {
          this.EDITED_EMP_IDS.push(emp.emp_id)
        })
        this.policyForm.controls.emp_list.setValue(this.EDITED_EMP_IDS)
        this.getAllUser()
      }


      // this.policyUploadControl.setValue(res.body["results"][0]["file_name"])
      console.log(this.policyForm.value)
      var comp_list = []
      res.body["results"][0]["company_list"].forEach(element => {
        comp_list.push(element.cmpny_id)

      });

      this.companyList.subtasks.forEach(t => {
        if (comp_list.indexOf(t.id) != -1) {
          t.completed = true
        }
        else {
          t.completed = false
        }
      });
      this.updateAllComplete()
      // this.policyForm.controls.company_list


    }
  }

  openConfirmation() {
    // if(this.policyForm.errors){
    if (this.policyForm.controls.display_name.errors) {
      this.policyForm.controls.display_name.markAsTouched()

    }
    if (this.policyForm.controls.policy_name.errors) {
      this.policyForm.controls.policy_name.markAsTouched()

    }
    if (this.policyForm.controls.emp_list?.errors) {
      this.policyForm.controls.emp_list.markAsTouched()

    }
    this.policyForm.updateValueAndValidity()


    // }
    if (this.policyForm.valid) {

      //Rahul change Open dialogBox dynamically(rahul changes) ************************
      // this.publishPolicyModal.open();
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        panelClass: 'confirm-remove-project',
        backdropClass: 'cdk-overlay-darker-backdrop',
        data: {
          confirmMessage: 'Are you sure to publish Policy with the selected groups?'
        },
        restoreFocus:true
      })
      dialogRef.afterClosed().pipe(take(1)).subscribe(data => {
        console.log('######################', data)
        if (data == true) {
          this.publishPolicy()
        } else {
          this.dialog.closeAll()
        }
      })

      // **************************************************************** 
    }
  }
  closeConfirmation() {

    // this.publishPolicyModal.close()
  }


}










