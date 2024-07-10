
import { Component, OnInit, Input, ViewEncapsulation, ViewChild, ElementRef, EventEmitter, Output, ChangeDetectorRef, ViewChildren, QueryList, ContentChildren, forwardRef, SimpleChanges, SimpleChange } from '@angular/core';
import { trigger, state, animate, transition, style, keyframes } from '@angular/animations';
import { AnimationsService } from '../../services/animations.service';

@Component({
    selector: 'app-modal-popup',
    templateUrl: './modal-popup.component.html',
    styleUrls: ['./modal-popup.component.scss'],
    animations: [
        trigger(
            'togglePopUp',
            [
                state(
                    'open',
                    style({ bottom: 0 })
                ),
                state(
                    'close',
                    style({ bottom: '100%' })
                ),
                transition(
                    'close=>open', [
                    animate(
                        '200ms',
                        keyframes([
                            style({ bottom: '-30%', offset: 0.7 }),
                            style({ bottom: 0, offset: 1 })
                        ])
                    )
                ]
                ),
                transition(
                    'open=>close',
                    animate(
                        '200ms',
                        keyframes([
                            style({ bottom: '-30%', offset: 0.3 }),
                            style({ bottom: '80%', offset: 0.8 }),
                            style({ bottom: '100%', offset: 1 })
                        ])
                    )
                )
            ]
        ),
        // toggle the content of the pop up
        trigger(
            'togglePopUpContent',
            [
                state(
                    'open',
                    style({ opacity: 1, pointerEvents: 'auto' })
                ),
                state(
                    'close',
                    style({ opacity: 0, pointerEvents: 'none' })
                ),
                transition(
                    'close<=>open', [
                    animate(
                        '100ms'
                    )
                ]

                )
            ]
        )
    ]
})
export class ModalPopupComponent {


    // the id which will be emitted as data in closeEvent emitted
    @Input() idd: any;

    // the trigger for the pop up open / close animation
    togglePopUp: any = "close";

    // get reference to the overlay element in the modal popup markup
    @ViewChild('overlay', /* TODO: add static flag */ { static: false }) overlay: ElementRef;

    // get reference to the scroll bar component in the modal popup markup
    // @ViewChild('scrollbar') scrollBar: ScrollBarComponent;

    // boolean to show / hide the head of the modal popup. Default they are visible
    @Input() foot: boolean = true;

    // boolean input to show / hide the foot of the modal popup. Default they are visible
    @Input() head: boolean = true;

    //input to set the width of the pop-up.Default will be 80%.
    @Input() w: number | string;

    //input to set the width of the pop-up.Default will be initial.
    @Input() maxW: number | string;
    //input to set the width of the pop-up.Default will be initial.
    @Input() maxH: number | string;

    //input to set the width of the pop-up.Default will be initial.
    @Input() minW: number | string;
    //input to set the width of the pop-up.Default will be initial.
    @Input() minH: number | string;

    //input to set the height of the pop-up.Default will be 80%.
    @Input() h: number | string;

    @Output("close") closeEvent: EventEmitter<any> = new EventEmitter();

    //Input for closing the pop-up. Defalt will be true
    @Input("closeModel") closeModel: boolean = true;

    // timer reference to help in clearing and setting
    timer;

    // for policy list styling
     @Input() policy_style: boolean 
    // for hide the close button in policy updation popup
     @Input()iscloseBtnVisible:boolean;

    minHeight;

    widthToSet: string = "80%";
    heightToSet: string = "60%";
    maxWidthToSet: string = "initial";
    maxHeightToSet: string = "initial";
    minWidthToSet: string = "initial";
    minHeightToSet: string = "initial";


    processInputChange(property: SimpleChange, propertyToSet) {
        // let width: SimpleChange = changes.w;
        // let height: SimpleChange = changes.h;
        if (property.previousValue !== property.currentValue) {
            if (typeof property.currentValue == 'string') {
                // if(property.currentValue.search('vw') != -1 ||  property.currentValue.search('%') != -1){
                this[propertyToSet] = property.currentValue;
                // }
            } else if (typeof property.currentValue == "number") {
                this[propertyToSet] = property.currentValue + "px";
            }
        }
    }
    ngOnChanges(changes: SimpleChanges) {
        let width: SimpleChange = changes.w;
        let height: SimpleChange = changes.h;
        let maxWidth: SimpleChange = changes.maxW;
        let maxHeight: SimpleChange = changes.maxH;
        let minWidth: SimpleChange = changes.minW;
        let minHeight: SimpleChange = changes.minH;
        if (width) { this.processInputChange(width, 'widthToSet'); }
        if (height) { this.processInputChange(height, 'heightToSet'); }
        if (maxWidth) { this.processInputChange(maxWidth, 'maxWidthToSet'); }
        if (maxHeight) { this.processInputChange(maxHeight, 'maxHeightToSet'); }
        if (minWidth) { this.processInputChange(minWidth, 'minWidthToSet'); }
        if (minHeight) { this.processInputChange(minHeight, 'minHeightToSet'); }
        // if (height.previousValue !== height.currentValue) {
        //     if (typeof height.currentValue == 'string') {
        //         this.heightToSet = height.currentValue;
        //     } else if (typeof height.currentValue == "number") {
        //         this.heightToSet = height.currentValue + "px";
        //     }
        // }
    }

    constructor(
        private animationService: AnimationsService,
        private cdRef: ChangeDetectorRef
    ) { }

    // close the popup
    close() {
        console.log("++++++++++inside+++++++++++++++++++", this.closeModel);
        this.togglePopUp = "close";
        this.animationService.fadeOutUp(this.overlay.nativeElement);
        clearInterval(this.timer);
        this.closeEvent.emit(this.idd);
    }

    // public method to update scroller
    updateScroller(scrollTo: any = 'relative') {
        // this.scrollBar.update(scrollTo);
        // this.minHeight = this.scrollBar.viewportSize.Y;
    }

    // open the modal popup
    open() {
        this.togglePopUp = "open";
        this.animationService.fadeInDown(this.overlay.nativeElement, '200ms', () => {
            // this.minHeight = this.scrollBar.viewportSize.Y; 
            this.cdRef.detectChanges();
            this.cdRef.detectChanges();
            setTimeout(() => {
                // this.scrollBar.update();
            }, 100)
        }, this);
    }

}



