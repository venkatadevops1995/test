import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigGridComponent } from './config-grid.component';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [ConfigGridComponent],
  imports: [
    CommonModule,
    MatIconModule
  ],
  exports:[
    ConfigGridComponent
  ]
})
export class ConfigGridModule { }
