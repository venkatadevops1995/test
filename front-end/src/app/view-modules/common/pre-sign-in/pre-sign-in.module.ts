import { ButtonModule } from './../../../components/button/button.module';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule, MatError } from '@angular/material/form-field';
// import { ValidateFormModule } from './../../directives/validate-form/validate-form.module';
import { MatButtonModule } from '@angular/material/button';
import { PreSignInRoutingModule } from './pre-sign-in-routing.module';
// import { InputTextModule } from './../../form-components/input-text/input-text.module';
import { LoginComponent } from './login/login.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreSignInComponent } from './pre-sign-in.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
// import { MatInputModule, MatIconModule } from '@angular/material/mat-';  
import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';
import { UseSvgModule } from 'src/app/components/use-svg/use-svg.module';

@NgModule({
  declarations: [PreSignInComponent, ForgotPasswordComponent, LoginComponent, ResetPasswordComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // InputTextModule,
    PreSignInRoutingModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    UseSvgModule,
    MatSelectModule,
    ButtonModule 
  ]
})
export class PreSignInModule { }
