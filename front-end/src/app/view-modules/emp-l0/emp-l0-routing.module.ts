import { L0TimesheetComponent } from './l0-timesheet/l0-timesheet.component';
import { EmpL0Component } from './emp-l0.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { L0DashboardComponent } from './l0-dashboard/l0-dashboard.component'; 
import { TimesheetViewComponent } from '../common/timesheet-view/timesheet-view.component';
import { AttendenceSheetComponent } from '../common/attendence-sheet/attendence-sheet.component';
import { HolidayComponent } from '../common/holiday/holiday.component';
import { ReportComponent } from '../common/report/report.component';
import { ManageSelfLeavesComponent } from '../common/manage-self-leaves/manage-self-leaves.component';
import { LeavePolicyConfigComponent } from '../common/leave-policy-config/leave-policy-config.component';
import { EmployeeLeaveInfoComponent } from '../common/employee-leave-info/employee-leave-info.component';
import { ImportExportLeaveComponent } from '../common/import-export-leave/import-export-leave.component';
import { LeaveHistoryComponent } from '../common/leave-history/leave-history.component';
import { ManageUserComponent } from '../common/manage-user/manage-user.component';
import { AddUserComponent } from '../common/manage-user/add-user/add-user.component';
import { EditUserComponent } from '../common/manage-user/edit-user/edit-user.component';
import { ManageProjectComponent } from '../common/manage-project/manage-project.component';
import { PolicyConfigComponent } from '../common/policy-config/policy-config.component';
import { PolicyListComponent } from '../common/policy-list/policy-list.component';
import { EmpPolicyListComponent } from '../common/emp-policy-list/emp-policy-list.component';
import { HrAttendanceReportComponent } from '../common/hr-attendance-report/hr-attendance-report.component';
import { HrTimesheetReportComponent } from '../common/hr-timesheet-report/hr-timesheet-report.component';
import { AddProjectComponent } from '../common/add-project/add-project.component';
import { DownloadMisComponent } from '../common/download-mis/download-mis.component';
import {AuthGuardSecurityService_HR,
  AuthGuardSecurityService_HR_OR_SUB_Attendance,
  AuthGuardSecurityService_HR_OR_SUB_Add_User,
  AuthGuardSecurityService_Report_Access,
  AuthGuardSecurityService_Alt_Report_Access} from '../../services/auth-guard-security.service';
import { BatchListsComponent } from '../common/veda/batch-lists/batch-lists.component';
import { AttendanceReportComponent } from '../common/veda/attendance-report/attendance-report.component';
import { DownloadAltAttendanceComponent } from '../common/download-alt-attendance/download-alt-attendance.component';


const routes: Routes = [
  // { path: '', component: EmpL0Component },
  {path:"",redirectTo:"timesheet",pathMatch:'full'},
  { path: 'timesheet', component: TimesheetViewComponent },
  { path: 'rejected-timesheet', component: TimesheetViewComponent },
  {path:'attendance', component:AttendenceSheetComponent},
  {path:"holiday",component:HolidayComponent},
  {path:"report",component:ReportComponent},
  {path:"dashboard",redirectTo:"timesheet",pathMatch:'full'},
  {path:"manage-self-leaves",component: ManageSelfLeavesComponent},
  {path:"leave-policy-config",component:LeavePolicyConfigComponent,canActivate:[AuthGuardSecurityService_HR]},
  {path:"employee-leave-info",component:EmployeeLeaveInfoComponent,canActivate:[AuthGuardSecurityService_HR]},
  {path:"import-export-leave",component:ImportExportLeaveComponent,canActivate:[AuthGuardSecurityService_HR]},
  {path:"leave-history",component:LeaveHistoryComponent,canActivate:[AuthGuardSecurityService_HR]},
  {path:"manage-user",component: ManageUserComponent,canActivate:[AuthGuardSecurityService_HR]},
  {path:"add-user",component: AddUserComponent, canActivate:[AuthGuardSecurityService_HR_OR_SUB_Add_User]},
  {path:"edit-user",component: EditUserComponent,canActivate:[AuthGuardSecurityService_HR]},
  {path:"manage-project",component: ManageProjectComponent,canActivate:[AuthGuardSecurityService_HR]},
  {path:"document-config",component:PolicyConfigComponent,canActivate:[AuthGuardSecurityService_HR]},
  {path:"document-list",component:PolicyListComponent,canActivate:[AuthGuardSecurityService_HR]},
  {path:"emp-document-list",component:EmpPolicyListComponent},
  {path:"hr-attendance-reports",component:HrAttendanceReportComponent,canActivate:[AuthGuardSecurityService_HR_OR_SUB_Attendance]},
  {path:"hr-timesheet-reports",component:HrTimesheetReportComponent,canActivate:[AuthGuardSecurityService_HR]},
  {path:"mis-add-project",component:AddProjectComponent,canActivate:[AuthGuardSecurityService_Report_Access]},
  {path:"mis-download", component:DownloadMisComponent,canActivate:[AuthGuardSecurityService_Report_Access]},
  {path:"veda-batch-list", component:BatchListsComponent,canActivate:[AuthGuardSecurityService_HR]},
  {path:"veda-attendance-report", component:AttendanceReportComponent,canActivate:[AuthGuardSecurityService_HR]},   
  {path:"attendance-report-by-alt",component:DownloadAltAttendanceComponent,canActivate:[AuthGuardSecurityService_Alt_Report_Access]},
  {path:"**",redirectTo:"timesheet",pathMatch:'full'}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EmpL0RoutingModule { }
