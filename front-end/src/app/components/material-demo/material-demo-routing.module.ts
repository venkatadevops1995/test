import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';   
import { MaterialDemoComponent } from './material-demo.component';

const MATERIAL_DEMO_ROUTES: Routes = [
  { path: '', component: MaterialDemoComponent }, 
]

@NgModule({
  imports: [RouterModule.forChild(MATERIAL_DEMO_ROUTES)],
  exports: [RouterModule]
})
export class MaterialDemoRoutingModule { }
