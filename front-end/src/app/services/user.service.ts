 

import { SingletonService } from "./singleton.service";
import { Router, NavigationStart } from "@angular/router";
import { Injectable, ViewChild } from "@angular/core";
import { Observable, Subject, BehaviorSubject, Observer } from "rxjs";
import { HttpClientService } from "./http-client.service";
import { HttpResponse } from "@angular/common/http"; 
import { dashboardRoutes } from '../constants/dashboard-routes';

@Injectable()
export class UserService {

  private messageSource = new BehaviorSubject('default message');
  currentMessage = new Subject();
  private userName = new BehaviorSubject('');
  user = this.userName.asObservable();
  private notifyCount = new BehaviorSubject('');
  notificationCount = this.notifyCount.asObservable();


  constructor(
    private router: Router,
    private ss: SingletonService,
    private httpClient: HttpClientService
  ) { }

  getDashboardRoute() {
    let roleId = this.getRoleId();
    return dashboardRoutes.get(roleId);
  }

  logoutOnExpiry(){
    this.logout();
    this.router.navigate(['login']);
  }

  getRoutePrefix(){
    let roleId = this.getRoleId();
    return dashboardRoutes.get(roleId).replace("/dashboard","");
  }

  getToken() {
    return localStorage.getItem("token");
  } 
  getRoleId() {
    return this.getTokenPayload()["role_id"];
  } 
  getSessionExpiry() {
    return this.getTokenPayload()["exp"];
  }
  getUserId() {
    return this.getTokenPayload()["username"];
  }
  getEmpId() {
    return this.getTokenPayload()["emp_id"];
  }
  getName() {
    let fullName = this.getTokenPayload()["emp_name"] ;
    return fullName;
  }
  getUserName() {
    let payLoad = this.getTokenPayload();
    this.userName.next(payLoad["username"])
    return payLoad["username"];
  }
  getDataFromToken(key) {
    return this.getTokenPayload()[key];
  }
  getIsEmpAdmin(){
    let isEmpAdmin = this.getTokenPayload()["is_emp_admin"];
    return isEmpAdmin

  }
  getEmpAdminPriority(){
    let empAdminPriority = this.getTokenPayload()["emp_admin_priority"];
    return empAdminPriority

  }
  getReportAccess(){
    let reportAccess = this.getTokenPayload()['report_access'];
    return reportAccess
  }

  getSubReportAccess(){
    let subReportAccess = this.getTokenPayload()['sub_report_access'] ? this.getTokenPayload()['sub_report_access'] : [];
    return subReportAccess
  }

  isDemo() {
    return localStorage.getItem("isDemo") == "true";
  }

  // check if the expiration of token is valid.
  validateSession() {
    // return true;
    if (localStorage.getItem("token")) {
      let timeStamp = this.getDataFromToken("exp") * 1000;
      var diff = parseInt(localStorage.getItem("timeDiff"), 10);
      let now = Date.now();
      let boolean: boolean = timeStamp > now;
      // console.log(now, timeStamp+diff, timeStamp,  diff);
      // console.log(new Date(timeStamp+diff));
      // console.log("validate : "+boolean);
      this.ss.loggedIn$.next(boolean);
      return boolean;
    } else {
      this.ss.loggedIn$.next(false);
      return false;
    }
  }

  // remove the user meta data in the local storage
  resetSession() {
    localStorage.removeItem("token");
    //console.log(this.getRole());
  }

  public reloadOnLogout;

  logout(
    reload: boolean = true) {
    let loginEndPoint;
    let role = this.getRoleId();
    // loginEndPoint = role === "student" ? "/login" : "/login/";
    // emit to the subscribers of isLoggedIn
    this.ss.loggedIn$.next(false);
    this.ss.isPreSignIn$.next(true);
    this.ss.sideBarToggle$.next(false);
    // reset the session
    this.resetSession();
    // this.router.navigate(["/login"])

    if (reload) {
      setTimeout(function () {
        window.location.replace('/login');
        // window.location.reload();
      });
    }
  }
 

  // get the payload from JWT   -- header.payload.signature
  getTokenPayload() {
    if (localStorage.getItem("token")) {
      // get the part of the token which can be base 64 decoded
      let payload = localStorage.getItem("token").split(".")[1];
      // decode the payload
      let decoded = this.b64DecodeUnicode(payload);
      let parsed = JSON.parse(decoded);
      return parsed;
    } else {
      return false;
    }
  }


  // method to base64 decode the token to get decoded text ( should work with unicode text also )
  b64DecodeUnicode(str) {
    return decodeURIComponent(
      atob(str)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
  }

  b64EncodeUnicode(str) {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
        return String.fromCharCode(<any>"0x" + p1);
      })
    );
  }
}