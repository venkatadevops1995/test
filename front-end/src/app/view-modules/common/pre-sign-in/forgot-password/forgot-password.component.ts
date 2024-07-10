import { HttpClientService } from '../../../../services/http-client.service'; 
import {  FormGroup, Validators, NgForm } from '@angular/forms';
import { Component, OnInit, ViewChild } from '@angular/core';
import validateEmail from 'src/app/functions/validations/email';
import { SingletonService } from 'src/app/services/singleton.service';
import { AtaiBreakPoints } from 'src/app/constants/atai-breakpoints'; 

@Component({
    selector: 'app-forgot-password',
    templateUrl: './forgot-password.component.html',
    styleUrls: ['./forgot-password.component.scss', './../login/login.component.scss']
})
export class ForgotPasswordComponent implements OnInit {

    // the formgroup for the forgotpassword form
    fgForgotPassword: FormGroup;

    // show success message boolean value
    showSuccessMessage: boolean = false;

    // ref to the ngForm . helpful in reset .
    @ViewChild("form") ngForm: NgForm;

    // is less than md resolutions
    get is_MD_LT() {
        return this.ss.responsiveState[AtaiBreakPoints.MD_LT];
    };

    // is less than md resolutions
    get is_XS() {
        return this.ss.responsiveState[AtaiBreakPoints.SM_LT];
    };

    constructor(
        private authHttp: HttpClientService,
        private ss: SingletonService
    ) {
        this.fgForgotPassword = this.ss.fb.group({
            email: ["", [Validators.required, validateEmail]]
        });
    }

    ngOnInit() {
    }

    // on submiting the forgot password form
    onSubmit(e) {
        if (this.fgForgotPassword.valid) {
            this.authHttp.noAuth().request('post', 'forgot-password/', "", this.fgForgotPassword.value).subscribe(res => {
                if (res.status === 200) {
                    this.ss.statusMessage.showStatusMessage(true, "An email has been sent to reset password.")
                    this.ngForm.resetForm();
                    this.showSuccessMessage = true;
                } else if (res.error.message == "invalidlogins") {
                    this.ss.statusMessage.showStatusMessage(false, "This email does not exist.")
                } else {
                    this.ss.statusMessage.showStatusMessage(false, "Something went wrong.")
                }
            });
        }
    }


}
