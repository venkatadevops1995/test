import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', loadChildren: () => import('./view-modules/common/pre-sign-in/pre-sign-in.module').then(m => m.PreSignInModule) },
  { path: 'material', loadChildren: () => import('./components/material-demo/material-demo.module').then(m => m.MaterialDemoModule) },
  { path: 'emp-l0', loadChildren: () => import('./view-modules/emp-l0/emp-l0.module').then(m => m.EmpL0Module) },
  { path: 'emp-l1', loadChildren: () => import('./view-modules/emp-l1/emp-l1.module').then(m => m.EmpL1Module) },
  { path: 'emp-l2', loadChildren: () => import('./view-modules/emp-l2/emp-l2.module').then(m => m.EmpL2Module) }, 
  { path: 'emp-l3', loadChildren: () => import('./view-modules/emp-l3/emp-l3.module').then(m => m.EmpL3Module) }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
