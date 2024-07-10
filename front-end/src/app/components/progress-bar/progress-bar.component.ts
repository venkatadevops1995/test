import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { SingletonService } from 'src/app/services/singleton.service';

@Component({
    selector: 'app-progress-bar',
    templateUrl: './progress-bar.component.html',
    styleUrls: ['./progress-bar.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class ProgressBarComponent {

    // property to set the width of the progress bar during the download or upload 
    progressWidth: string = "0%";

    // set progress width of the progress bar
    setProgressWidth(width) {
        this.progressWidth = width;
    }

    showProgress = false;

    hide() {
        setTimeout(() => {
            this.showProgress = false;
            this.progressWidth = "0%";
        }, 250);
    }

    constructor(
        protected ss: SingletonService
    ) {

    }

}
