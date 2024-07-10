import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeavePolicyConfigComponent } from './leave-policy-config.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ButtonModule } from 'src/app/components/button/button.module';
import { MatTableModule } from '@angular/material/table';
import { ModalPopupModule } from 'src/app/components/modal-popup/modal-popup.module';
import { MatSelectModule } from '@angular/material/select';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { MatIconModule } from '@angular/material/icon';
import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';
import { UseSvgModule } from 'src/app/components/use-svg/use-svg.module';
import { FocusModule } from 'src/app/directives/focuseDirective/focus/focus.module';



@NgModule({
  declarations: [LeavePolicyConfigComponent],
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    ButtonModule,
    MatTableModule,
    ModalPopupModule,
    MatSelectModule,
    PipesModule,
    ButtonModule,
    MatIconModule,
    UseSvgModule,
    FocusModule
  ]
})
export class LeavePolicyConfigModule { }
