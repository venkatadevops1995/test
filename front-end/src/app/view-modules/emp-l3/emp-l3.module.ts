import { ApproveTimesheetsModule } from './../common/approve-timesheets/approve-timesheets.module';
import { SvgIconModule } from './../../directives/svg-icon/svg-icon.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmpL3RoutingModule } from './emp-l3-routing.module';
import { EmpL3Component } from './emp-l3.component';
import { TimesheetViewModule } from '../common/timesheet-view/timesheet-view.module';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { MatIconModule } from '@angular/material/icon';
import { AttendenceSheetModule } from '../common/attendence-sheet/attendence-sheet.module';
import { ManageUserModule } from '../common/manage-user/manage-user.module';
import { ManageProjectModule } from '../common/manage-project/manage-project.module';
import { ManageSelfLeavesModule } from '../common/manage-self-leaves/manage-self-leaves.module';
import { EmployeeLeaveInfoModule } from '../common/employee-leave-info/employee-leave-info.module';
import { LeavePolicyConfigModule } from '../common/leave-policy-config/leave-policy-config.module';
import { ManageTeamLeavesModule } from '../common/manage-team-leaves/manage-team-leaves.module';
import { HolidayModule } from '../common/holiday/holiday.module';
import { ImportExportLeaveModule } from '../common/import-export-leave/import-export-leave.module';
import { ReportModule } from '../common/report/report.module';
import { LeaveHistoryModule } from '../common/leave-history/leave-history.module';
import { PolicyConfigModule } from '../common/policy-config/policy-config.module';
import { PolicyListModule } from '../common/policy-list/policy-list.module';
import { EmpPolicyListModule } from '../common/emp-policy-list/emp-policy-list.module';
import { HrAttendenceReportModule } from '../common/hr-attendance-report/hr-attendance-report.module';
import { HrTimesheetReportModule } from '../common/hr-timesheet-report/hr-timesheet-report.module';
import { DownloadMisModule } from '../common/download-mis/download-mis.module';
import { DownloadAltAttendanceModule } from '../common/download-alt-attendance/download-alt-attendance.module';

@NgModule({
  declarations: [EmpL3Component],
  imports: [
    CommonModule,
    EmpL3RoutingModule,
    SvgIconModule,
    TimesheetViewModule,
    ApproveTimesheetsModule,
    MatAutocompleteModule,
    MatIconModule,
    AttendenceSheetModule,
    ManageUserModule,
    ManageProjectModule,
    ManageSelfLeavesModule,
    EmployeeLeaveInfoModule,
    LeavePolicyConfigModule,
    ManageTeamLeavesModule,
    HolidayModule,
    ImportExportLeaveModule,
    ReportModule,
    LeaveHistoryModule,
    PolicyConfigModule,
    PolicyListModule,
    EmpPolicyListModule,
    HrAttendenceReportModule,
    HrTimesheetReportModule,
    NgCircleProgressModule.forRoot({}),
    DownloadMisModule,
    DownloadAltAttendanceModule
  ]
})
export class EmpL3Module { }
