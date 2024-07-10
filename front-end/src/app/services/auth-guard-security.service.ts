import {CanActivate,ActivatedRouteSnapshot,RouterStateSnapshot,Router} from "@angular/router";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { SingletonService } from "./singleton.service";
import { UserService } from "./user.service";
import { HttpClientService } from 'src/app/services/http-client.service'; 

// For Hr
@Injectable({
  providedIn: 'root'
})
export class AuthGuardSecurityService_HR implements CanActivate {

  constructor(
    private ss: SingletonService,
    private router: Router,
    private user: UserService
  ) { }
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {

      let is_hr =  this.user.getIsEmpAdmin()
      let dashbaord_route = this.user.getDashboardRoute()
      if (is_hr) {
          return true;
      } else {
          this.router.navigate([dashbaord_route], {
          });
          return false;
      }
  }
}

// For Manger
@Injectable({
  providedIn: 'root'
})
export class AuthGuardSecurityService_Manager implements CanActivate {

  constructor(
    private ss: SingletonService,
    private router: Router,
    private user: UserService
  ) { }
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    let role_id = this.user.getRoleId()  
    let is_manager = false
    if(role_id > 1){
      is_manager = true
    }
      let dashbaord_route = this.user.getDashboardRoute()
      if (is_manager) {
          return true;
      } else {
          this.router.navigate([dashbaord_route], {
          });
          return false;
      }
  }
}

// For Manger Or HR
@Injectable({
  providedIn: 'root'
})
export class AuthGuardSecurityService_HR_OR_Manager implements CanActivate {

  constructor(
    private ss: SingletonService,
    private router: Router,
    private user: UserService
  ) { }
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    let role_id = this.user.getRoleId()  
    let is_manager = false
    let is_hr =  this.user.getIsEmpAdmin()
    if(role_id > 1){
      is_manager = true
    }
      let dashbaord_route = this.user.getDashboardRoute()
      if (is_manager || is_hr) {
          return true;
      } else {
          this.router.navigate([dashbaord_route], {
          });
          return false;
      }
  }
}

// For Report Access
@Injectable({
  providedIn: 'root'
})
export class AuthGuardSecurityService_Report_Access implements CanActivate {

  constructor(
    private ss: SingletonService,
    private router: Router,
    private user: UserService,
    private http: HttpClientService
  ) { }
  canActivate (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
      let is_report_access_admin = this.user?.getReportAccess()
      let dashbaord_route = this.user.getDashboardRoute()
      if (is_report_access_admin) {
          return true;
      } else {
          this.router.navigate([dashbaord_route], {
          });
          return false;
      }
  }
}

// For Sub Report  Access

@Injectable({
  providedIn: 'root'
})
export class AuthGuardSecurityService_HR_OR_SUB_Add_User implements CanActivate {

  constructor(
    private ss: SingletonService,
    private router: Router,
    private user: UserService,
    private http: HttpClientService
  ) { }
  canActivate (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
      let is_hr =  this.user.getIsEmpAdmin()
      let sub_report_access = this.user.getSubReportAccess()
      let dashbaord_route = this.user.getDashboardRoute()
      // console.log("Sub hr list:",sub_report_access)
      if (is_hr ||sub_report_access.includes('add-user')) {
          return true;
      } else {
          this.router.navigate([dashbaord_route], {
          });
          return false;
      }
  }
}

// getSubHRAccess
@Injectable({
  providedIn: 'root'
})
export class AuthGuardSecurityService_HR_OR_SUB_Attendance implements CanActivate {

  constructor(
    private ss: SingletonService,
    private router: Router,
    private user: UserService,
    private http: HttpClientService
  ) { }
  canActivate (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
      let is_hr =  this.user.getIsEmpAdmin()
      let sub_report_access = this.user.getSubReportAccess()
      let dashbaord_route = this.user.getDashboardRoute()
      if (is_hr || sub_report_access.includes('hr-attendance-reports')) {
          return true;
      } else {
          this.router.navigate([dashbaord_route], {
          });
          return false;
      }
  }
}

// For Alternative Report Access
@Injectable({
  providedIn: 'root'
})
export class AuthGuardSecurityService_Alt_Report_Access implements CanActivate {

  constructor(
    private ss: SingletonService,
    private router: Router,
    private user: UserService,
    private http: HttpClientService
  ) { }
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    let sub_report_access = this.user.getSubReportAccess()
    let dashbaord_route = this.user.getDashboardRoute()
    if (sub_report_access.includes('alt-attendance')) {
      return true;
    } else {
      this.router.navigate([dashbaord_route], {
      });
      return false;
    }
  }
}