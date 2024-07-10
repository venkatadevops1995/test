import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StripComponent } from './strip.component';

@NgModule({
  declarations: [StripComponent],
  exports: [StripComponent],
  imports: [
    CommonModule
  ]
})
export class StripModule { }
