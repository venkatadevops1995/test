import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NumericDirective } from './numeric.directive';



@NgModule({
  declarations: [NumericDirective],
  imports: [
    CommonModule
  ],
  exports:[NumericDirective]
})
export class NumericModule { }
