import { Component, Input, ViewEncapsulation, ViewChild, HostListener, ElementRef, TemplateRef } from '@angular/core';
import { trigger, state, animate, transition, style, keyframes } from '@angular/animations';

@Component({
    selector: 'app-status-message',
    templateUrl: './status-message.component.html',
    styleUrls: ['./status-message.component.scss'],
    animations: [trigger(
        'visibilityChanged', [
        state('true', style({ 'height': '*', 'padding': '10px' })),
        state('false', style({ height: '*', 'padding': '0px' })),
        transition('*=>*', animate('200ms'))
    ],
    ),
    trigger('notificationAnimation', [
        transition(':enter', [
            animate(
                '400ms cubic-bezier(0.215, 0.61, 0.355, 1)',
                keyframes([
                    style({ transform: 'translate3d(100%, 0, 0)', offset: 0 }),
                    style({ transform: 'translate3d(-25px, 0, 0)', offset: 0.6 }),
                    style({ transform: 'translate3d(10px, 0, 0)', offset: 0.75 }),
                    style({ transform: 'translate3d(-5px, 0, 0)', offset: 0.9 }),
                    style({ transform: 'translate3d(0, 0, 0)', offset: 1 }),
                ])
            )
        ]),
        transition(':leave', [
            animate(
                '400ms ease-in',
                keyframes([
                    style({ transform: 'translate3d(0px, 0, 0)', offset: 0 }),
                    style({ transform: 'translate3d(-20px, 0, 0)', offset: 0.2 }),
                    style({ transform: 'translateX(100%)', offset: 1 }),
                ])
            )
        ])
    ])
    ]

})

export class StatusMessageComponent {

    // the status of the message. Success or Failure . Check methos  showStatusMessage
    @Input() status: boolean | string;

    typeof = "string";

    openClose: boolean;

    // default message
    @Input() notificationsQueue: Array<any> = [];

    // the status of the message
    statusHeading: any = "Status";

    lastClicked: any;

    // boolean to set the width to 100% or have padding on left
    full: boolean;

    @ViewChild('overlay', /* TODO: add static flag */ { static: false }) overlay: ElementRef;

    constructor(
        private el: ElementRef
    ) {

    }

    // close a notification on click
    clickClose(e: Event, i) {
        this.notificationsQueue.splice(i, 1);
    }

    @HostListener('document:click', ['$event', '$event.target'])
    getTarget(e: Event, target) {
        //console.log(e['clientY']);
        //console.log(this.el.nativeElement.getBoundingClientRect());
        //this.overlay.nativeElement.style.top = e['clientY']+"px";
        //this.lastClicked 
    }

    // the boolean property to mark the open and close animations of the 
    showStatus: boolean = false;


    timeOutRefForMoniter;

    private isQueueHavingNotifications() {
        let token = false;
        let indices = [];
        // loop through the notifications queue to get the list of not
        this.notificationsQueue.forEach((notification, index) => {
            if (notification && notification.show == true) {
                token = true;
            } else {
                indices.push(index);
            }
        });
        indices.forEach((index) => {
            this.notificationsQueue.splice(index, 1);
        })
        return token;
    }

    private moniterNotifications() {
        // console.log('there are notifications');
        this.notificationsQueue.forEach((notification, index) => {
            if ((notification.timestamp + notification.duration) < Date.now()) {
                console.log(notification.timestamp, notification.duration, Date.now(), (notification.timestamp + notification.duration) > Date.now());
                notification.show = false;
            }
        })
        this.timeOutRefForMoniter = setTimeout(() => {
            if (this.isQueueHavingNotifications()) {
                this.moniterNotifications();
                // console.log('rechecking notifications');
            } else {
                clearTimeout(this.timeOutRefForMoniter);
                this.notificationsQueue = [];
                // console.log('there are NO notifications');
                this.timeOutRefForMoniter = null;
            }
        }, 500);
        return;
    }

    // method to invoke the status message pop up with Input arguments to set the status , message, duration to show the message, heading in the pop up
    showStatusMessage(status: boolean | string, message?: string | TemplateRef<any> | Array<any>, duration?: number, id?: any) {
        let messageToPushIntoQueue: any = {};

        if (id && this.checkMessageExists(id)) {
            return;
        }
        console.log(id, this.checkMessageExists(id), this.notificationsQueue)
        messageToPushIntoQueue.message = message;

        if (message instanceof Array) {
            messageToPushIntoQueue.typeof = "Array";
        } else if (message instanceof TemplateRef) {
            messageToPushIntoQueue.typeof = "TemplateRef";
            // console.log('template ref');
        } else {
            messageToPushIntoQueue.typeof = "string";
            // console.log('string');
        }
        // set the passed status to the status property
        messageToPushIntoQueue.status = (status === true) ? 'success' : (status === false) ? 'fail' : status;

        // if input duration is not passed then set it to 5000 milli seconds
        messageToPushIntoQueue.duration = duration || 5000;
        // messageToPushIntoQueue.duration = 200000

        messageToPushIntoQueue.timestamp = Date.now();

        messageToPushIntoQueue.show = true;

        messageToPushIntoQueue.id = id;

        // if the message is a success message
        this.notificationsQueue.push(messageToPushIntoQueue);

        // to trigger the timer for monitering
        if (!this.timeOutRefForMoniter) {
            this.moniterNotifications();
        }

    }

    checkMessageExists(id) {
        let returnToken = false;
        this.notificationsQueue.forEach((item) => {
            if (item.id && item.id === id) {
                returnToken = true;
                // reset the timer for the particular message
                item.timestamp = Date.now();
            }
        });
        return returnToken;
    }
}