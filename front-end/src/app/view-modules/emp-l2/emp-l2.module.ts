import { ApproveTimesheetsModule } from './../common/approve-timesheets/approve-timesheets.module'; 
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmpL2RoutingModule } from './emp-l2-routing.module';
import { EmpL2Component } from './emp-l2.component';
import { L2DashboardComponent } from './l2-dashboard/l2-dashboard.component';
import { TimesheetViewModule } from '../common/timesheet-view/timesheet-view.module';
import { ButtonModule } from 'src/app/components/button/button.module';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ModalPopupModule } from 'src/app/components/modal-popup/modal-popup.module';
import { MatSelectModule } from '@angular/material/select';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import { FileDownloadModule } from 'src/app/directives/file-download/file-download.module';
import { NgCircleProgressModule } from 'ng-circle-progress'; 
import { AttendenceSheetModule } from '../common/attendence-sheet/attendence-sheet.module';
import { ManageProjectModule } from '../common/manage-project/manage-project.module';
import { LeavePolicyConfigModule } from '../common/leave-policy-config/leave-policy-config.module';
import { ManageSelfLeavesModule } from '../common/manage-self-leaves/manage-self-leaves.module';
import { ManageTeamLeavesModule } from '../common/manage-team-leaves/manage-team-leaves.module';
import { HolidayModule } from '../common/holiday/holiday.module';
import { ReportModule } from '../common/report/report.module';
import { EmployeeLeaveInfoModule } from '../common/employee-leave-info/employee-leave-info.module';
import { ImportExportLeaveModule } from '../common/import-export-leave/import-export-leave.module';
import { LeaveHistoryModule } from '../common/leave-history/leave-history.module';
import { ManageUserModule } from '../common/manage-user/manage-user.module';
import { EmpPolicyListModule } from '../common/emp-policy-list/emp-policy-list.module';
import { PolicyConfigModule } from '../common/policy-config/policy-config.module';
import { PolicyListModule } from '../common/policy-list/policy-list.module';
import { HrAttendenceReportModule } from '../common/hr-attendance-report/hr-attendance-report.module';
import { HrTimesheetReportModule } from '../common/hr-timesheet-report/hr-timesheet-report.module';
import { DownloadMisModule } from '../common/download-mis/download-mis.module';
import { UseSvgModule } from 'src/app/components/use-svg/use-svg.module';
import { FocusModule } from 'src/app/directives/focuseDirective/focus/focus.module';
import { DownloadAltAttendanceModule } from '../common/download-alt-attendance/download-alt-attendance.module';
@NgModule({
  declarations: [EmpL2Component, L2DashboardComponent],
  imports: [
    CommonModule,
    EmpL2RoutingModule, 
    TimesheetViewModule,
    ApproveTimesheetsModule,
    ButtonModule,
    MatPaginatorModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
    ModalPopupModule,
    MatSelectModule,
    FileDownloadModule,
    MatAutocompleteModule, 
    AttendenceSheetModule,
    ManageProjectModule,
    ReportModule,
    NgCircleProgressModule.forRoot({}),
    LeavePolicyConfigModule,
    ManageTeamLeavesModule,
    ManageSelfLeavesModule,
    HolidayModule,
    EmployeeLeaveInfoModule,
    ImportExportLeaveModule,
    LeaveHistoryModule,
    ManageUserModule,
    PolicyConfigModule,
    PolicyListModule,
    EmpPolicyListModule,
    HrAttendenceReportModule,
    HrTimesheetReportModule,
    DownloadMisModule,
    UseSvgModule,
    FocusModule,
    DownloadAltAttendanceModule
  ]
})
export class EmpL2Module { }
