import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StylePaginatorDirective } from './style-paginator.directive';



@NgModule({
  declarations: [
    StylePaginatorDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    StylePaginatorDirective
  ],
})
export class StylePaginatorModule { }
