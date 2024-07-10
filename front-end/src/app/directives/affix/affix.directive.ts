import { WindowReferenceService } from './../../services/window-reference.service';
import { Inject, Renderer2 } from '@angular/core';
import { Directive, Input, SimpleChange, SimpleChanges, ElementRef } from '@angular/core';
import { SingletonService } from '../../services/singleton.service';
import { DOCUMENT } from '@angular/common';
import { fromEvent, skipWhile, Subject, takeUntil } from 'rxjs';

interface ataiAffix {
    top?: number;
    referenceElement?: any;
    referenceHierarchy?: 'p' | 'p.p' | any,
    disable?: boolean,
    scrollX?: number
}

@Directive({ selector: '[ataiAffix]' })
export class AffixDirective {

    // declare the property of the directive to access the input value 
    @Input() ataiAffix: ataiAffix;

    // declare the property of the directive to access the input value 
    @Input() scrollX: number;

    destroy$: Subject<any> = new Subject();

    constructor(
        private el: ElementRef,
        private renderer: Renderer2,
        private windowRef: WindowReferenceService,
        private ss: SingletonService,
        @Inject(DOCUMENT) private doc: Document
    ) {
    }

    offsetTop: any;

    offsetSetToken: boolean = true;

    clone: HTMLElement;

    wrapperDiv: HTMLElement;

    private get win(): Window {
        return this.windowRef.nativeWindow
    }


    // the mutation observer of for auto update
    observer: MutationObserver;

    ngAfterViewInit() {
        this.ss.sideBarToggle$.pipe(takeUntil(this.destroy$)).subscribe((val) => {
            setTimeout(() => { 
                this.cloneElement() 
            }, 450)
        })
        fromEvent(this.windowRef.nativeWindow, 'scroll').pipe(takeUntil(this.destroy$), skipWhile(() => {
            let reference = this.ataiAffix.referenceElement ? this.ataiAffix.referenceElement : this.el.nativeElement.parentElement;
            let offsetHeight = reference.offsetHeight;
            return (offsetHeight < 200 && (reference.offsetTop < (reference.scrollTop + this.win.innerHeight)));
        })).subscribe(e => {
            // console.log('scrolled')
            if (!this.ataiAffix.disable) {
                let reference
                if (this.ataiAffix.referenceElement) {
                    reference = this.ataiAffix.referenceElement
                } else if (this.ataiAffix.referenceHierarchy) {
                    let splitParents = this.ataiAffix.referenceHierarchy.split('.')
                    let count = 0;
                    reference = this.el.nativeElement
                    while (count < splitParents.length) {
                        reference = reference.parentElement
                        count++;
                    }
                } else {
                    reference = this.el.nativeElement.parentElement
                }

                let offsetTop = this.win.pageYOffset;
                let target = (<HTMLElement>this.el.nativeElement);
                let targetRect = target.getBoundingClientRect();
                let referenceRect = reference.getBoundingClientRect()
                this.wrapperDiv.style.width = referenceRect.width + 'px';
                this.wrapperDiv.style.overflowX = 'auto'

                // console.log(referenceRect.top, targetRect.height)

                if (this.ataiAffix.scrollX) {
                    this.wrapperDiv.scrollLeft = this.scrollX
                } else {
                    this.wrapperDiv.scrollLeft = 0;
                }

                if (referenceRect.top < 0 && (referenceRect.bottom - targetRect.height) > 0) {
                    // console.log('in range',);
                    this.wrapperDiv.classList.add('affix-target');
                    this.wrapperDiv.style.display = reference.style.display;
                    this.clone.style.width = targetRect.width + 'px';
                } else {
                    // console.log('out of range')
                    this.wrapperDiv.classList.remove('affix-target')
                    this.wrapperDiv.style.display = 'none'
                }
            }
        })
    }

    ngOnChanges(values: SimpleChanges) {
        if (values.ataiAffix && (values.ataiAffix.currentValue != values.ataiAffix.previousValue)) {
            this.cloneElement();
            this.observer = new MutationObserver(() => this.cloneElement());
            this.observer.observe(this.el.nativeElement, { subtree: true, childList: true });
        }
        if (values.scrollX && (values.scrollX.currentValue != values.scrollX.previousValue)) {
            if (this.wrapperDiv) {
                this.wrapperDiv.scrollLeft = this.scrollX || 0
            }
        }
    }

    cloneElement() {
        if (!this.clone) {
            this.wrapperDiv = document.createElement('div');
            let clone = (<HTMLElement>this.el.nativeElement).cloneNode(true);
            this.clone = (<HTMLElement>clone);
            this.wrapperDiv.appendChild(this.clone);
            this.wrapperDiv.style.display = 'none';
            this.renderer.insertBefore(this.el.nativeElement.parentNode, this.wrapperDiv, this.el.nativeElement)
        } else {
            this.renderer.removeChild(this.wrapperDiv.parentNode, this.wrapperDiv);
            this.clone = undefined;
            this.wrapperDiv = undefined
            this.cloneElement();
        }
    }

    ngOnDestroy() {
        this.destroy$.next(null)
        this.destroy$.complete();
        if (this.observer) {
            this.observer.disconnect();
        }
    }

}