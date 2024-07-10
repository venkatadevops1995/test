from datetime import time
from logging import log
from django.conf.urls import url, include
from rest_framework import routers
from rest_framework_swagger.views import get_swagger_view
from django.urls import path, include
from vedikaweb.vedikaapi import views
from vedikaweb.vedikaapi.views import attendance_views, common_views,employees_and_project_views,holiday_views,leave_views,login_views,mis_views,timesheet_views, third_party_views, policy_view
from django.conf.urls.static import static
from django.conf import settings
router = routers.DefaultRouter()
schema_view = get_swagger_view(title='Vedika API')

urlpatterns = [
    url(r'^', include(router.urls)),
    # url(r'hello/', views.HelloView.as_view(), name="hello"),
    path('login/', login_views.LoginView.as_view(), name='login'),
    path('forgot-password/', login_views.ForgotPasswordView.as_view(), name='ForgotPasswordView'),
    path('reset-password/', login_views.ResetPasswordView.as_view(), name='resetforgotpassword'),
    path('forgot-password/verify/', login_views.ResetPasswordTokenVerificationView.as_view(), name='forgotpasswordverify'),
    path('weeklydata/',timesheet_views.WeeklyEmployeeData.as_view(),name='WeeklyEmployeeData'),
    path('weeklystatus/',timesheet_views.WeeklyStatus.as_view(),name='WeeklyStatus'),
    path('rejectedtimesheet/',timesheet_views.StatusBasedTimeSheets.as_view(),name='RejectedTimeSheets'),
    path('rejectedweeklystatus/',timesheet_views.StatusBasedWeeklyStatus.as_view(),name='RejectedWeeklyStatus'),
    path('projects/',employees_and_project_views.EmpProjects.as_view(),name='EmpProjects'),
    path('employeeswstdata/',timesheet_views.GetEmployeesWSTData.as_view(),name='GetEmployeesData'),
    path('employeeswsrdata/',timesheet_views.GetEmployeesWSRData.as_view(),name='GetEmployeesWSRData'),
    path('downloadwst/',timesheet_views.WSTDownload.as_view(),name='WSTDownload'),
    path('downloadwsr/',timesheet_views.WSRDownload.as_view(),name='WSRDownload'),
    path('downloadncr/',timesheet_views.NCRDownload.as_view(),name='NCRDownload'),
    path('getwsr/',timesheet_views.GetWsrWithEmpId.as_view(),name='GetWsrWithEmpId'),
    #mis upload
    path('mis-upload/', mis_views.MisUpload.as_view(), name='MisUpload'),
    #approve emp time sheet
    path('approve-emp-timesheet/', timesheet_views.ApproveEmpTimesheet.as_view(), name='ApproveEmpTimesheet'),
    #report
    path('report/', timesheet_views.ReportApi.as_view(), name='ReportApi'),
    path('reportdatesavailability/',common_views.DataAvailability.as_view(),name='DataAvailability'),
    #dashboard apis
    path('get-emp-mangers/', timesheet_views.getEmpManagers.as_view(), name='getempmangers'),
    path('get-historical-data/', timesheet_views.getHistoricalData.as_view(), name='getHistoricalData'),

    #Attendance
    path('attendance/', attendance_views.AttendanceApi.as_view(), name='AttendanceApi'),
    path('attendancestatus/', attendance_views.AttendanceStatusAPI.as_view(), name='AttendanceStatusAPI'),
    path('student/attendance/', attendance_views.VedaStudentAttendanceApi.as_view(), name='VedaStudentAttendanceApi'),
    path('student/batch/', attendance_views.VedaStudentBatchAPI.as_view(), name='VedaStudentBatchAPI'),
    path('student/', attendance_views.VedaStudentAPI.as_view(), name='VedaStudentAPI'),
    path('export_student/<batch_id>', attendance_views.ExportVedaStudentApi.as_view(), name='VedaStudentAPI'),
    path('attendance_by_alt_id/', attendance_views.AttendanceByAltId.as_view(), name='AttendanceByAltId'),
    

    #service account apis
    path('service/apikey/', third_party_views.ServiceLoginView.as_view(), name='ServiceLoginViewAPI'),
    path('service/emp-validate/', third_party_views.ValidateEmployee.as_view(), name='ValidateEmployee'),
    path('service/employee/', third_party_views.EmployeeDetails.as_view(), name='EmployeeDetails'),
    url(r'^service/employee/(?P<email>\w+|[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4})/$', third_party_views.EmployeeDetails.as_view(), name='DetailsEmployeeSearch'),
    path('service/reporters/', third_party_views.ManagerDetails.as_view(), name='ManagerDetails'),
    url(r'^service/reporters/(?P<email>\w+|[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4})/$', third_party_views.ManagerDetails.as_view(), name='ManagerDetailsSearch'),
    url(r'^service/allreporters/$', third_party_views.Reporters.as_view(), name='Reporters'),
    url(r'^service/allreporters/(?P<email>\w+|[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4})/$', third_party_views.Reporters.as_view(), name='Reporters'),

    url(r'^docs/', schema_view),

    #manage user apis
    url(r'^users/', employees_and_project_views.Users.as_view(), name='Users'),
    url(r'^all-projects/$', employees_and_project_views.AllProjects.as_view(), name='AllProjects'),
    path('delete/', employees_and_project_views.Usersdelete.as_view(), name='Usersdel'),
    path('upload-profile-pic/',common_views.ProfilePicUpload.as_view(),name='ProfilePicUpload'),

    url(r'^emp-projects/$', employees_and_project_views.EmployeeProjects.as_view(), name='EmployeeProjects'),

    url(r'^downloadmis/$', mis_views.DownloadMIS.as_view(), name='DownloadMIS'),
    url(r'all-company/$', common_views.CompanyView.as_view(), name='CompanyView'),
    #leave status
    path('leavestatus/', leave_views.LeaveStatusAPI.as_view(), name='LeaveStatusAPI'),
    #leave
    path('leave/',include([ 
        path('config/',include([ 
            path('new-hire-month-time-periods/',leave_views.NewHireMonthTimePeriodsView.as_view(),name='NewHireMonthTimePeriodsView'),
            path('new-hire-leave-config/',leave_views.NewHireLeaveConfigView.as_view(),name='NewHireLeaveConfig'),
            path('leave-config/',leave_views.LeaveConfigView.as_view(),name='LeaveConfigView'),
            path('fill-leave-config/',leave_views.FillLeaveConfigView.as_view(), name='FillLeaveConfigView'),
            path('fill-new-hire-leave-config/',leave_views.FillNewHireLeaveConfigView.as_view(), name='FillNewHireLeaveConfigView'),
            path('category/',leave_views.LeaveConfigOfCategory.as_view(), name='LeaveConfigOfCategory'),
            path('export-emp-leave/',leave_views.ExportEmpLeave.as_view(),name='ExportEmpLeave'), 
        ])),
        path('balance/',leave_views.LeaveBalanceView.as_view(),name='LeaveBalanceView'),
        path('request/',leave_views.LeaveRequestView.as_view(),name='leaveRequest'),
        # path('request-history/',views.LeaveRequestHistoryView.as_view(),name='leaveRequestHistory'),
        path('resolve/',leave_views.LeaveResolveView.as_view(),name='leaveResolve'), 
        path('export-resolved/',leave_views.ExportResolvedLeaves.as_view(),name='exportResolvedLeaves'), 
        path('get-leaves-in-last-n-days/',leave_views.getLeavesLastNDaysView.as_view(),name='getLeavesLastNDaysView'), 
        path('request/<id>/',leave_views.LeaveRequestSingleView.as_view(),name='leaveRequestSingle'),
        path('discrepancy/',leave_views.LeaveDiscrepancyView.as_view(),name='leaveDiscrepancyView'),
        # path('dates/',leave_views.LeaveRequestLeaveDatesView.as_view(),name='leaveRequestLeaveDatesView'),
        path('types/',leave_views.LeaveTypeView.as_view(),name='leaveType'),
        path('special-leave-requests-available/',leave_views.SpecialLeaveRequestsAvailableView.as_view(),name='specialLeaveRequestsAvailableView'),
        path('mail-opted/',common_views.MailOptedStatus.as_view(),name='mail-opted'),
        path('monthlycycleleavereport/',leave_views.MonthyCycleLeaveReportRequestBasedView.as_view(),name='MonthyCycleLeaveReportRequestBasedView'),
    ])),
    # url(r'leave-type/$', leave_views.LeaveTypeView.as_view(), name='leaveType'),
    url(r'employee-type/$', common_views.CategoryView.as_view(), name='Category'),
    # url(r'leave-bal/$', leave_views.LeaveBalanceView.as_view(), name="leaveBal"),
    # url(r'leave-req/$', leave_views.LeaveRequestView.as_view(), name="leaveRequest"),
    # url(r'leave-history/$', leave_views.LeaveHistory.as_view(), name="leaveHistory"),
    # url(r'leave-config/$', leave_views.LeaveConfigView.as_view(), name='configLeave'),

    url(r'emp-mgr/$', employees_and_project_views.EmpManagers.as_view(), name='EmpManagers'),
    url(r'^mgr-reporters/', employees_and_project_views.ManagersReporters.as_view(), name='ManagersReporters'),
    url(r'compliance/',employees_and_project_views.EmployeeEntryComplianceStatus.as_view(),name="EmployeeEntryComplianceStatus"),
    url(r'change-role/$', employees_and_project_views.ChangeRole.as_view(), name='ChangeRole'),
    url(r'transfer-emp/$', employees_and_project_views.TransferEmp.as_view(), name='TransferEmp'),
    url(r'^location-holiday-cal/$',holiday_views.LocationHolidayCalendarView.as_view(),name='LocationHolidayCalendarView'),
    url(r'^update-location-holiday-cal/$',holiday_views.LocationHolidayCalendarUpdateView.as_view(),name='LocationHolidayCalendarUpdateView'),
    url(r'^location/$',holiday_views.LocationView.as_view(),name='LocationView'),
    url(r'^default-holiday-list/$',holiday_views.DefaultHolidayList.as_view(),name='DefaultHolidayList'),
    url(r'^get_current_date/$',holiday_views.DateView.as_view(),name='DateView'),
    path('sendemails/',common_views.SendWelcomeEmails.as_view(),name="sendemails"),
    url(r'^confirm-holiday/$',holiday_views.ConfirmHoliday.as_view(),name="ConfirmHoliday"),
    url(r'^timesheet-discrepancy/$',timesheet_views.TimesheetDiscrepancyView.as_view(),name="TimesheetDiscrepancyView"),
    url(r'^get-submitted-timesheet/',timesheet_views.GetSubmittedTimesheet.as_view(),name="GetSubmittedTimesheet"),
    url(r'^timesheet-discrepancy/(?P<id>[0-9]+)/$',timesheet_views.TimesheetDiscrepancyView.as_view(),name="TimesheetDiscrepancyView"),
    url(r'^holiday/',holiday_views.HolidayView.as_view(),name="Holiday"),
    url(r'^statuswisetimesheetcount/',timesheet_views.StatusWiseTimesheetCount.as_view(),name='StatusWiseTimesheetCount'),
    url(r'^employeeData/',employees_and_project_views.EmployeeDetails.as_view(),name='EmployeeDetails'),
    # url(r'^reportsAccessableAdmins/',common_views.MajorAdmins.as_view(),name='MajorAdmins'),
    path('policy/',include([ 
            path('',policy_view.CreatePolicyView.as_view(),name='CreatePolicyView'),
            path('<int:pk>/',policy_view.CreatePolicyView.as_view(),name='UpdatePolicyView'),
            path('type/',policy_view.PolicyTypeView.as_view(),name='policyTypeView'),
            path('emp-policy/', policy_view.EmployeePolicyView.as_view(),name='EmployeePolicyView'),
            path('emp-policy/<int:policy_id>/', policy_view.EmployeePolicyView.as_view(),name='EmployeePolicyUpdateView'),
            path('upload/',policy_view.PolicyUpload.as_view(),name='PolicyUpload'),
    ])),
    url(r'^projects-active-inactive/$', employees_and_project_views.AllActiveInActiveProjects.as_view(), name='projects-active-inactive'),
    url(r'^save-project/', employees_and_project_views.AllActiveInActiveProjects.as_view(), name='save-project'),
    path('app/',include([
            path('image-reg/', common_views.ImageRecognigationData.as_view(), name='image-reg'),
            path('report-reg-issue/', common_views.ReportRegistartionIssue.as_view(), name='image-reg'),
            path('report-check-in-out-issue/', common_views.ReportCheckINOutIssue.as_view(), name='image-reg'),
            
     ]))
    
    
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
