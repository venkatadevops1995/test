import { HttpClientService } from 'src/app/services/http-client.service';
import { Component, OnInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { SingletonService } from 'src/app/services/singleton.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
// import { TweenMax, TimelineMax, Power2 } from 'gsap'; 
import ValidateEmail from 'src/app/functions/validations/email';
import { AtaiBreakPoints } from 'src/app/constants/atai-breakpoints';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  // boolean used to show and hide password
  hidePassword: boolean = true;

  // form group for login form
  fgLogin: FormGroup;

  // is view port less than sm and greater than xs
  get is_XS() {
    return this.ss.responsiveState[AtaiBreakPoints.SM_LT]
  }


  constructor(
    private ss: SingletonService,
    private authHttp: HttpClientService,
    private router: Router,
    private user: UserService,
    private route: ActivatedRoute,
    private cdRef: ChangeDetectorRef
  ) {
    this.fgLogin = this.ss.fb.group({
      email: ["", [Validators.required, ValidateEmail]],
      password: ["", [Validators.required]]
    })
  }

  ngOnInit() {
    // if the user session is valid then redirect to respective dashboard pages
    if (this.user.validateSession()) {
      this.ss.loggedIn$.next(true);
      // this.ss.sideBarToggle$.next(true)
      this.ss.isPreSignIn$.next(false)
      let redirectRoute = this.user.getDashboardRoute();
      this.router.navigate([redirectRoute]);
    }
  }

  // on submitting the login form
  onSubmitLogin() {
    if (this.fgLogin.valid) {
      this.authHttp.request('post', 'login/', "", this.fgLogin.value).subscribe(res => {
        console.log(res)
        if (res.status == 200) {
          // this.ss.statusMessage.showStatusMessage(true,'Success');
          let token = res.body.results.token;
          localStorage.setItem('token', token);
          setTimeout(() => {
            this.ss.loggedIn$.next(true);
            // this.ss.sideBarToggle$.next(true)
            this.ss.isPreSignIn$.next(false)
            let redirectRoute = this.user.getDashboardRoute();
            this.router.navigate([redirectRoute]);
          }, 1000);
        } else if (res.error.message == 'invalidlogins') {
          this.ss.statusMessage.showStatusMessage(false, 'Invalid logins.', 5000, 'invalid-logins');
        } else if (res.error.message == 'In_Active_Employee') {
          this.ss.statusMessage.showStatusMessage(false, 'This account is currently inactive. Contact HR for any query.');
        }
      })
    }
  }


}
