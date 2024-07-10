import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmpPolicyListComponent } from './emp-policy-list.component';
import { MatTableModule } from '@angular/material/table';
import { PdfViewerModule } from 'ng2-pdf-viewer';
// import { NgxDocViewerModule } from 'ngx-doc-viewer';
import { ButtonModule } from 'src/app/components/button/button.module';
import { ModalPopupModule } from 'src/app/components/modal-popup/modal-popup.module';
import { UseSvgModule } from 'src/app/components/use-svg/use-svg.module';
import { TableAffixModule } from 'src/app/directives/table-affix/table-affix.module';
import { FocusModule } from 'src/app/directives/focuseDirective/focus/focus.module';



@NgModule({
  declarations: [EmpPolicyListComponent],
  imports: [
    CommonModule,
    MatTableModule,
    UseSvgModule,
    ModalPopupModule,
    ButtonModule, 
    PdfViewerModule,
    TableAffixModule,
    FocusModule
  ]
})
export class EmpPolicyListModule { }
