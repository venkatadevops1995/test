import { SvgIconDirective } from './svg-icon.directive';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    SvgIconDirective
  ],
  exports:[
    SvgIconDirective
  ]
})
export class SvgIconModule { }
