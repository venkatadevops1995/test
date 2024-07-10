import { Component, OnInit, HostBinding } from '@angular/core';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss']
})
export class LoaderComponent {

    @HostBinding('class.dis-nn') private hideLoader: boolean = true;

    constructor( 
    ) {
        
    }
 

    activeLoad: Array<any> = [];

    append(endPoint) {
        if (this.hideLoader) {
            setTimeout(() => {
                this.hideLoader = false;
                this.startTimer();
            }, 150);

            //console.log(' show loader');
        }
        // console.log(endPoint);
        
        this.activeLoad.push(endPoint);
    }

    interval: any;
 

    startTimer() {
        this.interval = setInterval(() => {
            //console.log('timer on');    
            //console.log(this.activeLoad.length);

            this.hideLoader = false;
            if (this.activeLoad.length < 1) {
                this.hideLoader = true;
                // console.log(' hide loader');

                clearInterval(this.interval);
            }
        }, 50);

        /*if(!this.timerToken){
              let that = this.timerToken;
              setTimeout(()=>{
                    clearInterval(this.interval);
                    that = false;
              },5000);
        }*/

    }

    remove(url) {
        for (let i = 0; i < this.activeLoad.length; i++) {
            if (this.activeLoad[i] === url) {
                this.activeLoad.splice(i, 1);
            }
        }
    }
    gethideLoader():boolean{
        return this.hideLoader
    }
}
