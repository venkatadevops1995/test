import { FormBuilder } from '@angular/forms';
import { SvgComponent } from './../layout/svg/svg.component';
import { BehaviorSubject } from 'rxjs';
import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { LoaderComponent } from '../components/loader/loader.component';
import { ProgressBarComponent } from '../components/progress-bar/progress-bar.component';
import { StatusMessageComponent } from '../components/status-message/status-message.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../src/environments/environment';
import { take, takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';
import { BreakpointObserver } from '@angular/cdk/layout';
@Injectable({
  providedIn: 'root'
})
export class SingletonService {

  // the form builder used to build formgroups and formarrays
  fb: FormBuilder = new FormBuilder();

  // subject to unsubscibe subscriptions
  destroy$ = new Subject();

  // subject used to emit the window resize event object whenever window is resized
  windowResize$: Subject<Event> = new Subject();

  theme: "light" | "dark" = "dark";

  // reference to the loader  component in app component used for http request
  loader: LoaderComponent;

  progressBar: ProgressBarComponent;

  // ref to the status message component in the app component
  statusMessage: StatusMessageComponent;

  // subject to emit boolean if the application active view is in pre sign in area
  isPreSignIn$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  // constant to hold the latest state emitted of the isPreSignIn$
  isPreSignIn: boolean = false;

  // subject to emit boolean if the user is logged in
  loggedIn$: Subject<boolean> = new Subject();

  // constant to hold the latest state emitted of the loggedIn$
  loggedIn: boolean = false;

  // subject to emit boolean sidebar is opened / closed
  sideBarToggle$: Subject<boolean> = new Subject();

  // constant to hold sidebar is opened / closed
  sideBarToggle: boolean = false;

  // baseUrl = "http://10.60.62.54:8000/api/";
  baseUrl = environment.apiUrl + 'api/';

  // the component in the app component ref to the svg which holds all the icons
  svgComponent: SvgComponent;

  // property to hold refs the different svg sprite urls used to contain the icons. There may be more than one. It is used in svg icon directive
  svg: string[] = [];

  // subject used to communicate with the sidebar component for menu manipulation
  menu$: Subject<{ key: any, value: any }> = new Subject();

  // subject used to communicate with the resolve timeshet for manipulation
  resTimeSheet$: Subject<{ rc: any, pac: any }> = new Subject();

  //attendance flag
  attendanceFlag: boolean = false

  leaveFlag: boolean = false;

  // reference to the breakpoint observer (like a global one)
  responsive: BreakpointObserver;

  // responsive state to find out the current state of each break points
  responsiveState: any;

  constructor(
    private dialog: MatDialog
  ) {
    this.loggedIn$.pipe(takeUntil(this.destroy$)).subscribe(val => {
      this.loggedIn = val;
    })
    this.isPreSignIn$.pipe(takeUntil(this.destroy$)).subscribe(val => {
      this.isPreSignIn = val;
    })
  }

  takeConfirmation = (_this, message = "", callback, callbackArgs = []) => {
    let dialogRef = this.dialog.open(ConfirmDialogComponent, {
      panelClass: 'confirm-popup',
      data: {
        confirmMessage: message
      },
      restoreFocus: true
    })
    if (callback) {
      dialogRef.afterClosed().pipe(take(1)).subscribe((result) => {
        if (result) {
          callback.apply(_this, callbackArgs)
        }
      })
    } else {
      console.error('method takeConfirmation needs to have callback argument passed and arguments if necessary')
    }
  }

}
