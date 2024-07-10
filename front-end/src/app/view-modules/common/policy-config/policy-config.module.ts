import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PolicyConfigComponent } from './policy-config.component';
import {MatTabsModule} from '@angular/material/tabs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'src/app/components/button/button.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FileUploadModule } from 'src/app/components/input-file/input-file.module';
import { MatRadioModule } from '@angular/material/radio';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { ModalPopupModule } from 'src/app/components/modal-popup/modal-popup.module';
import { MatTableModule } from '@angular/material/table';
import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';
import { UseSvgModule } from 'src/app/components/use-svg/use-svg.module';
import { FocusModule } from 'src/app/directives/focuseDirective/focus/focus.module';

@NgModule({
  declarations: [PolicyConfigComponent],
  imports: [
    CommonModule,
    MatTabsModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FileUploadModule,
    MatRadioModule,
    MatCheckboxModule,
    ModalPopupModule,
    MatTableModule,
    UseSvgModule,
    FocusModule
  ]
})
export class PolicyConfigModule { }
