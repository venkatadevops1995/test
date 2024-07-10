import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSortModule } from '@angular/material/sort';
import { ShowTableComponent } from './show-table.component';
import { MatTableModule } from '@angular/material/table';



@NgModule({
  declarations: [ShowTableComponent],
  imports: [
    CommonModule,
    MatSortModule,
    MatTableModule
  ],
  exports: [ShowTableComponent],
})
export class ShowTableModule { }
