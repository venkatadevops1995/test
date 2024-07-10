import { StatusMessageComponent } from './status-message.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { UseSvgModule } from '../use-svg/use-svg.module';
@NgModule({
    declarations: [
     StatusMessageComponent
    ],
    imports:[
     CommonModule, RouterModule, UseSvgModule
    ],
    exports:[
    StatusMessageComponent
    ]
})
export class StatusMessageModule{
}