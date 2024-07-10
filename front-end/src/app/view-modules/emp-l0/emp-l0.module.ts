import { TimesheetViewModule } from './../common/timesheet-view/timesheet-view.module';
import { ReactiveFormsModule } from '@angular/forms'; 
import { ButtonModule } from './../../components/button/button.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmpL0RoutingModule } from './emp-l0-routing.module';
import { EmpL0Component } from './emp-l0.component';
import { L0DashboardComponent } from './l0-dashboard/l0-dashboard.component';
import { L0TimesheetComponent } from './l0-timesheet/l0-timesheet.component'; 
import { AttendenceSheetModule } from '../common/attendence-sheet/attendence-sheet.module';
import { HolidayModule } from '../common/holiday/holiday.module';
import { ReportModule } from '../common/report/report.module';
import { ManageSelfLeavesModule } from '../common/manage-self-leaves/manage-self-leaves.module';
import { LeavePolicyConfigModule } from '../common/leave-policy-config/leave-policy-config.module';
import { EmployeeLeaveInfoModule } from '../common/employee-leave-info/employee-leave-info.module';
import { ImportExportLeaveModule } from '../common/import-export-leave/import-export-leave.module';
import { LeaveHistoryModule } from '../common/leave-history/leave-history.module';
import { ManageUserModule } from '../common/manage-user/manage-user.module';
import { ManageProjectModule } from '../common/manage-project/manage-project.module';
import { PolicyConfigModule } from '../common/policy-config/policy-config.module';
import { PolicyListModule } from '../common/policy-list/policy-list.module';
import { EmpPolicyListModule } from '../common/emp-policy-list/emp-policy-list.module';
import { HrAttendenceReportModule } from '../common/hr-attendance-report/hr-attendance-report.module';
import { HrTimesheetReportModule } from '../common/hr-timesheet-report/hr-timesheet-report.module';
import { DownloadMisModule } from '../common/download-mis/download-mis.module';
import { TimeSheetModule } from '../common/time-sheet/time-sheet.module';
import { UseSvgModule } from 'src/app/components/use-svg/use-svg.module';
import { VedaModule } from '../common/veda/veda.module';
import { DownloadAltAttendanceModule } from '../common/download-alt-attendance/download-alt-attendance.module';


@NgModule({
  declarations: [EmpL0Component, L0DashboardComponent, L0TimesheetComponent ],
  imports: [
    CommonModule,
    EmpL0RoutingModule,
    TimesheetViewModule,
    TimeSheetModule,
    ButtonModule,
    UseSvgModule,
    ReactiveFormsModule,
    TimesheetViewModule,
    AttendenceSheetModule,
    ManageSelfLeavesModule,
    ReportModule,
    HolidayModule,
    EmployeeLeaveInfoModule,
    ImportExportLeaveModule,
    LeavePolicyConfigModule,
    LeaveHistoryModule,
    ManageUserModule,
    ManageProjectModule,
    PolicyConfigModule,
    PolicyListModule,
    EmpPolicyListModule,
    HrAttendenceReportModule,
    HrTimesheetReportModule,
    DownloadMisModule,
    DownloadAltAttendanceModule,
    VedaModule
  ]
})
export class EmpL0Module { }
