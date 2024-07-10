import { UserService } from './../../../../services/user.service';
import { HttpClientService } from 'src/app/services/http-client.service';
import { HttpParams } from '@angular/common/http';
// import { AuthHttpService } from './../../../services/auth-http.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { SingletonService } from 'src/app/services/singleton.service';
import { ActivatedRoute, Router } from '@angular/router';
import MatchPassword from 'src/app/functions/validations/password';

@Component({
    selector: 'app-reset-password',
    templateUrl: './reset-password.component.html',
    styleUrls: ['./reset-password.component.scss', './../login/login.component.scss']
})
export class ResetPasswordComponent {

    // boolean properties used to toggle password to text and text to password for both the fields
    hide: any = {
        password: true,
        retypePassword: true
    }

    // the angular formgroup for the reset password
    fgResetPassword: FormGroup;

    // property to store the token in the query param
    token;

    // boolean to decided whether to show / hide the form
    showForm: boolean = false;

    // a booleann to indicate if the token is resolved. Used to show any valid content
    tokenResolved = false;

    constructor(
        private authHttp: HttpClientService,
        private ss: SingletonService,
        private route: ActivatedRoute,
        private router: Router,
        private user: UserService
    ) {
        this.fgResetPassword = this.ss.fb.group({
            password: ["", [Validators.required]],
            retypePassword: ["", [Validators.required, MatchPassword('password')]]
        });
        this.fgResetPassword.get('password').setValidators([Validators.required, MatchPassword('retypePassword')])
    }

    ngOnInit() {
        if (!this.user.validateSession()) {
            this.token = this.route.snapshot.queryParams['token'];
            console.log(this.token)
            if (this.token) {
                this.verifyToken();
            } else {
                this.tokenResolved = true;
                this.ss.statusMessage.showStatusMessage(false, "There is no token . You may use the forgot password page.")
            }

        }
    }

    // method triggered to verify the token before showing the reset form
    verifyToken() {
        this.authHttp.request('post', 'forgot-password/verify/', "", { token: this.token }).subscribe(res => {
            if (res.status == 200) {
                this.showForm = true;
            } else if (res.error.message == 'something_went_wrong') {
                this.showForm = false;
                this.ss.statusMessage.showStatusMessage(false, "Something went wrong. Retry using the forgot password page.")
            }
            this.tokenResolved = true;
        });

    }

    // method triggered whenever input value change in both fields to check password matching
    onChangeInput() {
        this.fgResetPassword.get('retypePassword').updateValueAndValidity();
        this.fgResetPassword.get('password').updateValueAndValidity();
    }

    // on submitting the reset password form 
    onSubmit(e) {
        if (this.fgResetPassword.valid) {
            if (!this.token) {
                this.ss.statusMessage.showStatusMessage(false, "The token is not present. Cannot reset the password.")
                return;
            }
            let fd = new FormData();
            fd.append('token', this.token);
            fd.append('password', this.fgResetPassword.get('password').value);
            fd.append('confirm_password', this.fgResetPassword.get('retypePassword').value);
            this.authHttp.request('post', 'reset-password/', "", fd).subscribe(res => {
                if (res.status === 200) {
                    this.ss.statusMessage.showStatusMessage(true, "The password was successfully reset.")
                    this.router.navigate(['/login'])
                } else if (res.error.Message === 'invalid_token') {
                    this.ss.statusMessage.showStatusMessage(false, "The token is invalid.")
                } else {
                    this.ss.statusMessage.showStatusMessage(false, "Something went wrong.")
                }
            })
        }
    }

}
