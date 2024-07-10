import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolTipDirective } from './tool-tip.directive';
import { OverlayModule } from '@angular/cdk/overlay';
import { ToolTipCompComponent } from './tool-tip-comp/tool-tip-comp.component';



@NgModule({
  declarations: [
    ToolTipDirective,
    ToolTipCompComponent
  ],
  imports: [
    CommonModule,
    OverlayModule
  ],
  exports: [ToolTipDirective, ToolTipCompComponent]
})
export class ToolTipModule { }
