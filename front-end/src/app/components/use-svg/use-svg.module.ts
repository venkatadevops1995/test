import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UseSvgComponent } from './use-svg.component';



@NgModule({
  declarations: [
    UseSvgComponent
  ],
  imports: [
    CommonModule
  ],
  exports:[UseSvgComponent]
})
export class UseSvgModule { }
