import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { ManageTeamLeavesComponent } from './manage-team-leaves.component';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmDialogModule } from 'src/app/components/confirm-dialog/confirm-dialog.module';
import { ButtonModule } from 'src/app/components/button/button.module';
// import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { ModalPopupModule } from 'src/app/components/modal-popup/modal-popup.module';
import { StripTableModule } from 'src/app/components/strip-table/strip-table.module';
import { MatExpansionModule } from '@angular/material/expansion';
import { LeaveDetailsModule } from 'src/app/components/leave-details/leave-details.module';
import { ConfirmRejectLeaveComponent } from './confirm-reject-leave/confirm-reject-leave.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FileDownloadModule } from 'src/app/directives/file-download/file-download.module';
import { SvgIconModule } from 'src/app/directives/svg-icon/svg-icon.module';
import { AtaiDateRangeModule } from 'src/app/components/atai-date-range/atai-date-range.module';
import { UseSvgModule } from 'src/app/components/use-svg/use-svg.module';
import { FocusModule } from 'src/app/directives/focuseDirective/focus/focus.module';

@NgModule({
  declarations: [ManageTeamLeavesComponent, ConfirmRejectLeaveComponent],
  imports: [
    CommonModule,
    MatTableModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    ConfirmDialogModule,
    ButtonModule,
    // NgxDaterangepickerMd.forRoot(),
    ModalPopupModule,
    StripTableModule,
    MatExpansionModule,
    LeaveDetailsModule,
    MatDialogModule,
    MatToolbarModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    FileDownloadModule,
    UseSvgModule,
    AtaiDateRangeModule,
    FocusModule
  ],
  exports: [ManageTeamLeavesComponent]
})
export class ManageTeamLeavesModule { }
