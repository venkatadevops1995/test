import { SvgIconModule } from './../../directives/svg-icon/svg-icon.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmpL1RoutingModule } from './emp-l1-routing.module';
import { L1DashboardComponent } from './l1-dashboard/l1-dashboard.component';
import { EmpL1Component } from './emp-l1.component';
import { TimesheetViewModule } from '../common/timesheet-view/timesheet-view.module';
import { ApproveTimesheetsModule } from '../common/approve-timesheets/approve-timesheets.module';
import { AttendenceSheetModule } from '../common/attendence-sheet/attendence-sheet.module';
import { ManageProjectModule } from '../common/manage-project/manage-project.module';
import { ManageSelfLeavesModule } from '../common/manage-self-leaves/manage-self-leaves.module';
import { ManageTeamLeavesModule } from '../common/manage-team-leaves/manage-team-leaves.module';
import { HolidayModule } from '../common/holiday/holiday.module';
import { ReportModule } from '../common/report/report.module';
import { EmployeeLeaveInfoModule } from '../common/employee-leave-info/employee-leave-info.module';
import { ImportExportLeaveModule } from '../common/import-export-leave/import-export-leave.module';
import { LeavePolicyConfigModule } from '../common/leave-policy-config/leave-policy-config.module';
import { LeaveHistoryModule } from '../common/leave-history/leave-history.module';
import { ManageUserModule } from '../common/manage-user/manage-user.module';
import { EmpPolicyListModule } from '../common/emp-policy-list/emp-policy-list.module';
import { PolicyConfigModule } from '../common/policy-config/policy-config.module';
import { PolicyListModule } from '../common/policy-list/policy-list.module';
import { HrAttendenceReportModule } from '../common/hr-attendance-report/hr-attendance-report.module';
import { HrTimesheetReportModule } from '../common/hr-timesheet-report/hr-timesheet-report.module';
import { DownloadMisModule } from '../common/download-mis/download-mis.module';
import { DownloadAltAttendanceModule } from '../common/download-alt-attendance/download-alt-attendance.module';


@NgModule({
  declarations: [L1DashboardComponent, EmpL1Component],
  imports: [
    CommonModule,
    EmpL1RoutingModule,
    SvgIconModule,
    TimesheetViewModule,
    ApproveTimesheetsModule,
    AttendenceSheetModule,
    ManageProjectModule,
    ManageSelfLeavesModule,
    ManageTeamLeavesModule,
    ReportModule,
    HolidayModule,
    EmployeeLeaveInfoModule,
    ImportExportLeaveModule,
    LeavePolicyConfigModule,
    LeaveHistoryModule,
    ManageUserModule,
    PolicyConfigModule,
    PolicyListModule,
    EmpPolicyListModule,
    HrAttendenceReportModule,
    HrTimesheetReportModule,
    DownloadMisModule,
    DownloadAltAttendanceModule

  ]
})
export class EmpL1Module { }
