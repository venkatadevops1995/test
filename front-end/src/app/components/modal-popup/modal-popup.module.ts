import { ButtonModule } from './../button/button.module'; 
import { ModalPopupComponent } from './modal-popup.component';
//import { PipesModule } from './../../pipes/pipes.module';
//import { UtilitiesModule } from './../utilities.module'; 
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core'; 
// import { ScrollBarModule } from '../scroll-bar/scroll-bar.module';

@NgModule({
    declarations: [
        ModalPopupComponent
    ],
    imports: [
        //PipesModule,
        CommonModule, RouterModule,   
        ButtonModule
    ],
    exports: [
        ModalPopupComponent
    ]
})
export class ModalPopupModule {
}