import { Component, OnInit, ElementRef, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'app-svg',
    templateUrl: './svg.component.svg',
    styles: [],
    encapsulation:ViewEncapsulation.None
})
export class SvgComponent implements OnInit {

    constructor(
        private _el: ElementRef
    ) { }

    get el(): ElementRef {
        return this._el;
    }

    ngOnInit() {
    }

}
