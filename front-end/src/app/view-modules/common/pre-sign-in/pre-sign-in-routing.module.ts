import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { NgModule } from '@angular/core';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { PreSignInComponent } from './pre-sign-in.component';
import { LoginComponent } from './login/login.component';
import { Routes, RouterModule } from '@angular/router';  

const PRE_SIGNIN_ROUTES: Routes = [
    { path: 'login', component: LoginComponent }, 
    // { path: 'register', component: RegisterComponent },
    // { path: 'confirm-email', component: ConfirmEmailComponent },
    { path: 'forgot-password', component: ForgotPasswordComponent  },
    { path: 'reset-password', component: ResetPasswordComponent  },
    // { path: 'login', redirectTo: 'login/customer', pathMatch: 'full' },
    // { path: '', component: LoginComponent }
    { path: '', redirectTo: 'login', pathMatch: 'full' }
]

@NgModule({
    imports: [RouterModule.forChild(PRE_SIGNIN_ROUTES)],
    exports: [RouterModule]
})
export class PreSignInRoutingModule { }