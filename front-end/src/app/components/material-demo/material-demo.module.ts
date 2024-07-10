import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
 
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon'; 
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button'; 
import {  MatSelectModule } from '@angular/material/select';
import { MatTreeModule } from '@angular/material/tree';
import { MatRippleModule } from '@angular/material/core';
import { MaterialDemoComponent } from './material-demo.component';
import { MaterialDemoRoutingModule } from './material-demo-routing.module';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSliderModule } from '@angular/material/slider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialogModule } from '@angular/material/dialog';
import { DialogContentExampleComponent } from './dialog-content-example/dialog-content-example.component';
import { ButtonModule } from '../button/button.module';  
import { AtaiDateRangeModule } from '../atai-date-range/atai-date-range.module';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatDatepickerModule } from '@angular/material/datepicker';

@NgModule({
  declarations: [MaterialDemoComponent, DialogContentExampleComponent],
  imports: [
    CommonModule,
    MaterialDemoRoutingModule,
    MatIconModule, 
    MatSelectModule,
    MatFormFieldModule, 
    MatButtonModule, 
    MatTreeModule,
    MatRippleModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    MatRadioModule,
    MatToolbarModule,
    MatTabsModule,
    MatSliderModule,
    MatExpansionModule,
    MatDialogModule,
    MatInputModule,
    ButtonModule, 
    AtaiDateRangeModule,
    OverlayModule,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule
  ]
})
export class MaterialDemoModule {  
}
