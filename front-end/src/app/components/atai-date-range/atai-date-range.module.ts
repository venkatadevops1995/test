import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AtaiDateRangeComponent } from './atai-date-range.component';
import { MatDatepickerModule, MatRangeDateSelectionModel, MatSingleDateSelectionModel } from '@angular/material/datepicker';
import { MatNativeDateModule, NativeDateAdapter } from '@angular/material/core';
import { AppDateAdapter } from './app-date-adapter';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; 
import { UseSvgModule } from '../use-svg/use-svg.module';



@NgModule({
  declarations: [
    AtaiDateRangeComponent
  ],
  imports: [
    CommonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatIconModule,
    MatMenuModule,
    OverlayModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    UseSvgModule
  ],
  exports: [AtaiDateRangeComponent],
  providers: [
    MatSingleDateSelectionModel,
    MatRangeDateSelectionModel,
    { provide: NativeDateAdapter, useClass: AppDateAdapter },]
})
export class AtaiDateRangeModule { }
