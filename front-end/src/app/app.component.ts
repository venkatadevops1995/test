import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { LoaderComponent } from './components/loader/loader.component';
import { ProgressBarComponent } from './components/progress-bar/progress-bar.component';
import { StatusMessageComponent } from './components/status-message/status-message.component';
import { SvgComponent } from './layout/svg/svg.component';
import { HttpClientService } from './services/http-client.service';
import { SingletonService } from './services/singleton.service';
import { UserService } from './services/user.service';
import * as _ from 'lodash';
import { AtaiBreakPoints } from './constants/atai-breakpoints';
import { routerNewAnimation } from './animations/router-new.animation';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { isDescendant } from './functions/isDescendent.fn';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  // ref to the global loader compoonent
  @ViewChild(LoaderComponent, /* TODO: add static flag */   { static: false }) loader;

  // ref to the global progress compoonent
  @ViewChild(ProgressBarComponent, /* TODO: add static flag */   { static: false }) progressBar;

  // ref to the global status compoonent
  @ViewChild(StatusMessageComponent, /* TODO: add static flag */   { static: false }) statusMessage;

  // ref to the global svg compoonent
  @ViewChild(SvgComponent) svg;

  // ref to the global progress compoonent
  @ViewChild(SidebarComponent, /* TODO: add static flag */   { static: false }) sidebarComponent;

  @ViewChild('layout') layoutEl: ElementRef;

  // boolean to know whether it is pre sign in area
  isPreSignIn: boolean = true;

  // subject to unsubscibe subscriptions
  private destroy$ = new Subject();

  // the svg sprite urls
  defaultSvgSpriteUrls = ['./assets/icons-sprite-new.svg', './assets/images/icons-sprite.svg'];

  isSideBarOpen: boolean = false;

  iconsPrefetched: boolean = false;

  constructor(
    private ss: SingletonService,
    private cdRef: ChangeDetectorRef,
    private user: UserService,
    private router: Router,
    private http: HttpClientService,
    private responsive: BreakpointObserver
  ) {

  }

  ngOnInit() {
    // this.getDefaultIcons()
    this.ss.sideBarToggle$.pipe(takeUntil(this.destroy$)).subscribe((val) => {
      this.ss.sideBarToggle = val;
      this.isSideBarOpen = this.ss.sideBarToggle
      this.cdRef.detectChanges()
    })
    this.ss.responsive = this.responsive;
    this.ss.responsive.observe([..._.values(AtaiBreakPoints)]).pipe(takeUntil(this.destroy$)).subscribe(val => { 
      this.ss.responsiveState = val.breakpoints;
    })
  }

  ngAfterViewInit() {
    // pass the ref to the components to the singleton service properties
    this.ss.loader = this.loader;
    this.ss.progressBar = this.progressBar;
    this.ss.statusMessage = this.statusMessage;
    this.ss.svgComponent = this.svg;

    // is user session is validated then set the pre sign in as false else set it as true and logout
    // let validity = this.user.validateSession();
    // this.isPreSignIn = !validity 
    // this.cdRef.detectChanges()
    // if(validity){
    //   this.sidebarComponent.setSidebarStatus(true)
    // }
    this.layoutEl.nativeElement.style.transition = 'padding-left 0.3s ease-in-out'

    
    this.ss.isPreSignIn$.pipe(takeUntil(this.destroy$), debounceTime(500)).subscribe(val => {
      // console.log(this.isPreSignIn)
      this.isPreSignIn = val;
      this.cdRef.detectChanges();
      this.redirectBasedOnSession();
    }) 
    this.cdRef.detectChanges();
  }

  ngOnDestroy() {
    // emit using destroy subject to unsubscribe all subscriptions
    this.destroy$.next(null);
    // emit using  destroy subject to unsubscribe all subscriptions
    this.ss.destroy$.next(null);
  }


  // on window resize emit the event to subscribers through out
  @HostListener("window:resize", ['$event'])
  onResizeWindow(e: Event) {
    this.ss.windowResize$.next(e);
  }

  @HostListener('click', ['$event'])
  onClickHost(e: Event) {
    this.redirectBasedOnSession();
    // close the sidebar menu if open for less than laptop resolutions
    if (this.ss.responsiveState[AtaiBreakPoints.LG_LT]) {
      let target = e.target;
      if (this.sidebarComponent && e.target != this.sidebarComponent.el.nativeElement && !isDescendant(this.sidebarComponent.el.nativeElement, target)) {
        this.sidebarComponent.setSidebarStatus(false)
      }
    }
  }

  // get the default svg sprite urls on load of the application
  getDefaultIcons() {
    this.defaultSvgSpriteUrls.forEach((url) => {
      this.http.request('get', url, "", null, {}, { responseType: "text", baseUrl: "" }).subscribe(res => {
        if (res.status == 200) {
          let svg = res.body;
          this.ss.svg.push(url);
          this.ss.svgComponent.el.nativeElement.insertAdjacentHTML(
            "beforeEnd",
            svg
          );
          this.iconsPrefetched = true;
        }
      });
    })
  }


  onClickToggleSideBar(toggle) {
    if (toggle) {

    } else {

    }
  }

  redirectBasedOnSession() {
    if (!this.ss.isPreSignIn) {
      if (!this.user.validateSession()) {
        this.user.logout();
        this.router.navigate(['login']);
      }
    } else {
      if (this.user.validateSession()) {
        this.router.navigate([this.user.getDashboardRoute()]);
      }
    }
    // this.router.navigate(['login']); 
  }
}
