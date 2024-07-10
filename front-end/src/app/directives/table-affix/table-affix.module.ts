import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableAffixDirective } from './table-affix.directive';



@NgModule({
  declarations: [
    TableAffixDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    TableAffixDirective
  ]
})
export class TableAffixModule { } 