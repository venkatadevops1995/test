import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StripTableComponent } from './strip-table.component';



@NgModule({
  declarations: [StripTableComponent],
  exports: [StripTableComponent],
  imports: [
    CommonModule
  ]
})
export class StripTableModule { }
