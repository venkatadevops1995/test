import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopUpComponent } from './pop-up.component';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { ButtonModule } from '../button/button.module';
import { UseSvgModule } from '../use-svg/use-svg.module';
import { FocusModule } from 'src/app/directives/focuseDirective/focus/focus.module';

@NgModule({
  declarations: [
    PopUpComponent
  ],
  imports: [
    CommonModule,
    MatDialogModule,
    ButtonModule,
    UseSvgModule,
    FocusModule
  ],
  exports: [PopUpComponent],
  providers: [{ provide: MAT_DIALOG_DATA, useValue: {} },
  { provide: MatDialogRef, useValue: {} },
  { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { maxWidth: '90vw', hasBackdrop: true, disableClose:true } },
  ]
})
export class PopUpModule { }
