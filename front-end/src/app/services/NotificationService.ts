// import { Injectable } from '@angular/core';
// import {Subject} from 'rxjs/Subject';  

import {
    Injectable
  } from '@angular/core';
  import {
    Observable
  } from 'rxjs';
  
  @Injectable()
  export class NotificationService {
  //  notification = new Subject();
  
  //  set notify(value) {
  //    this.notification.next(value); // this will make sure to tell every subscriber about the change.   
  //  }
  
  //  get notify() {
  //    return '';
  //  }
  // }
  
  public permission: Permission;
  constructor() {
      this.permission = this.isSupported() ? 'default' : 'denied';
  }
  public isSupported(): boolean {
      return 'Notification' in window;
  }
  requestPermission(): void {
      let self = this;
      if ('Notification' in window) {
          Notification.requestPermission(function(status) {
              return self.permission = status;
          });
      }
  }
  create(title: string, options ? : PushNotification): any {
      let self = this;
      return new Observable(function(obs) {
          if (!('Notification' in window)) {
            //   console.log('Notifications are not available in this environment');
              obs.complete();
          }
          if (self.permission !== 'granted') {
            //   console.log("The user hasn't granted you permission to send push notifications");
              obs.complete();
          }
          let _notify = new Notification(title, options);
          _notify.onshow = function(e) {
              return obs.next({
                  notification: _notify,
                  event: e
              });
          };
          _notify.onclick = function(e) {
              return obs.next({
                  notification: _notify,
                  event: e
              });
          };
          _notify.onerror = function(e) {
              return obs.error({
                  notification: _notify,
                  event: e
              });
          };
          _notify.onclose = function() {
              return obs.complete();
          };
      });
  }
  generateNotification(source: Array < any > ): void {
      let self = this;
      source.forEach((item) => {
          let options = {
              title:'Wave Notifies',
              body: item.body,
              icon: "../../assets/images/favicon.ico"
          };
          let notify = self.create(item.title, options).subscribe();
      })
  }
  }
  export declare type Permission = 'denied' | 'granted' | 'default';
  export interface PushNotification {
  body ? : string;
  icon ? : string;
  tag ? : string;
  data ? : any;
  renotify ? : boolean;
  silent ? : boolean;
  sound ? : string;
  noscreen ? : boolean;
  sticky ? : boolean;
  dir ? : 'auto' | 'ltr' | 'rtl';
  lang ? : string;
  vibrate ? : number[];
  }