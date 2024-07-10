import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ButtonModule } from '../button/button.module';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { FocusModule } from 'src/app/directives/focuseDirective/focus/focus.module';

@NgModule({
  declarations: [
    ConfirmDialogComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatToolbarModule,
    ButtonModule,
    ReactiveFormsModule,
    MatInputModule,
    FocusModule
  ],
  exports: [
    ConfirmDialogComponent
  ],
  providers: [{ provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: {   hasBackdrop: true, disableClose: true } },]
})
export class ConfirmDialogModule { }
