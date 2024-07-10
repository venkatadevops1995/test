import { UserService } from 'src/app/services/user.service';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { SingletonService } from 'src/app/services/singleton.service';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import MatchPassword from 'src/app/functions/validations/password';
import { HttpClientService } from 'src/app/services/http-client.service';
import { AtaiBreakPoints } from 'src/app/constants/atai-breakpoints';
import { slideAnimationTrigger } from 'src/app/animations/slide.animation';
import { isDescendant } from 'src/app/functions/isDescendent.fn';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  animations: [slideAnimationTrigger]
})
export class HeaderComponent implements OnInit {

  // boolean properties used to toggle password to text and text to password for both the fields
  // com = [{'week':1,'cnt':1},{'week':2,'cnt':0},{'week':3,'cnt':0},{'week':4,'cnt':0},{'week':5,'cnt':1}]
  compliances: any;
  isHr: boolean = false;
  showEmailToggle: boolean = false;
  isEmailEnabled: boolean = false;
  hide: any = {
    password: true,
    retypePassword: true
  }
  value: any;

  role_id: Number = this.user.getRoleId();
  is_admin: Boolean = this.user.getIsEmpAdmin();
  leaveFlag: Boolean = false;
  
  // template ref element for the modal pop up of change password
  @ViewChild('refModalChangePassword') modalChangePassword: ModalPopupComponent;

  get is_MD_LT(): boolean {
    return this.ss.responsiveState[AtaiBreakPoints.MD_LT]
  }

  // form group for Change password form
  fgChangePassword: FormGroup;

  //Change password form reference to reset the form
  @ViewChild('changePasswordForm') changePasswordForm;

  @ViewChild('refHeaderSearchMobile') elHeaderSearchMobile: ElementRef<any>;

  @ViewChild('refOpenUserSearchMobile') elOpenUserSearchMobile: ElementRef<any>;

  // is user search mobile open 
  isUserSearchMobileOpen: boolean = false;

  // get 

  constructor(
    private user: UserService,
    private ss: SingletonService,
    private http: HttpClientService
  ) {
    this.fgChangePassword = this.ss.fb.group({
      currentpassword: ["", [Validators.required]],
      newPassword: ["", [Validators.required]],
      retypeNewPassword: ["", [Validators.required, MatchPassword('password')]]
    });
    this.fgChangePassword.get('newPassword').setValidators([Validators.required, MatchPassword('retypeNewPassword')])
  }


  @HostListener('document:click', ['$event'])
  onClickDocument(e: Event) {
    if(!this.ss.loader.gethideLoader()){
      return;
    }   
    let target = e.target;
    let cond1 = this.elHeaderSearchMobile ? target != this.elHeaderSearchMobile.nativeElement : true;
    let cond2 = this.elHeaderSearchMobile ? !isDescendant(this.elHeaderSearchMobile, target) : true;
    let cond3 = target != (<any>this.elOpenUserSearchMobile.nativeElement);
    let cond4 = !isDescendant(this.elOpenUserSearchMobile.nativeElement, target);

    if (cond1 && cond2 && cond3 && cond4) { 
      this.isUserSearchMobileOpen = false;
    }
  }

  ngOnInit(): void {

    this.isHr = this.user.getIsEmpAdmin();
    this.showEmailToggle = (this.user.getRoleId() > 2);
    if (this.showEmailToggle) {
      this.getEmailToggleStatus();
    }
    this.getCompliance();
    // console.log("---------------------------leaveFlag", this.leaveFlag)
    this.http.noLoader(true).request("get", 'leavestatus/').subscribe(leave_res => {
      this.leaveFlag = leave_res.body.leave_flag;
    })
  }

  onClickUserSearchMobile(e) {
    e.stopPropagation();
  }

  getEmailToggleStatus() {
    this.http.request('get', 'leave/mail-opted/', "",).subscribe(res => {
      // console.log(res)
      if (res.status == 200) {
        this.isEmailEnabled = res.body.results['email-opted'].toLowerCase() == 'true' ? true : false;
      }
    })
  }


  onEmailToggle(event) {
    let status = 0;
    if (event.checked) {
      status = 1
    }
    let requestBody = { 'status': status }
    this.http.request('post', 'leave/mail-opted/', '', requestBody).subscribe(res => {
      let status = res.status
      if (status == 200) {
        this.ss.statusMessage.showStatusMessage(true, res.body.message)
      } else {
        this.ss.statusMessage.showStatusMessage(false, res.error['message'])
      }
    });
  }

  getCompliance() {
    this.http.request('get', 'compliance/', "",).subscribe(res => {
      // console.log(res)
      if (res.status == 200) {
        this.compliances = res.body.results;
      }
    })

  }



  //on clicking on change password link
  onClickChnagePassword() {
    this.modalChangePassword.open()
  }


  //on changing passsword
  onModalChangePasswordSubmit(value) {

  }

  // method triggered whenever input value change in both fields to check password matching
  onChangeInput() {
    this.fgChangePassword.get('retypeNewPassword').updateValueAndValidity();
    this.fgChangePassword.get('newPassword').updateValueAndValidity();
  }

  logout() {
    this.user.logout();
  }


}
