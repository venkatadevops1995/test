from vedikaweb.vedikaapi.services.email_service import email_service
from rest_framework.views import APIView
from rest_framework.response import Response
from openpyxl import load_workbook
import time 

# Modles
from vedikaweb.vedikaapi.models import Employee,EmployeeProject,EmployeeWeeklyStatusTracker,EmployeeProjectTimeTracker,Project,EmployeeWorkApproveStatus,MisInfo,ManagerWorkHistory,EmployeeAdmin, Project, Location,EmployeeHierarchy,EmployeeEntryCompStatus,EmployeeApprovalCompStatus, AttendanceAccessGroup,GlobalAccessFlag, WelcomeEmailNotification, EmailAccessGroup,ServiceAccount, Category , LeaveRequest, TimesheetDiscrepancy

# Serialisers
from vedikaweb.vedikaapi.serializers import  EmployeeWorkApproveStatusSerializer,RejectedTimesheetEmailNotificationSerializer,EmployeeProfileSerializer,EmployeeProjectTimeTrackerReqSerializer, EmployeeProjectTimeTrackerSerializer, WeeklyStatusReqSerializer, WeeklyStatusPostSerializer, EmployeeWorkApproveStatusPostSerializer,  EmployeeTimesheetApprovedHistorySerializer

from vedikaweb.vedikaapi.constants import StatusCode, ExcelHeadings, DefaultProjects, WorkApprovalStatuses, MailConfigurations, GenderChoices, MaritalStatuses, LeaveRequestStatus, TimesheetDiscrpancyStatus
from vedikaweb.vedikaapi.utils import utils
from django.conf import settings
from vedikaweb.vedikaapi.decorators import custom_exceptions,jwttokenvalidator, query_debugger
from django.db.models import Q,F,Value as V, Case,When,Count, IntegerField, Sum, FloatField

from openpyxl.utils.cell import get_column_letter
from django.core.validators import validate_email
from django.core.paginator import Paginator
from vedikaweb.vedikaapi.services.xlsxservice import ExcelServices
from django.core.mail import send_mail
from django.template.loader import get_template
#logging
import traceback, json
from datetime import datetime, timedelta, date
import calendar 
import ast
import logging
from django.utils.encoding import smart_str
from vedikaweb.vedikaapi.services.attendance_services import AttendenceService as attendance
from hashlib import md5
from django.core.mail import send_mail
from django.template.loader import get_template 
from vedikaweb.vedikaapi.views.common_views import CommonFunctions

log = logging.getLogger(__name__)

attendance_ = attendance()

class WeeklyEmployeeData(APIView):
    def sum_of_work_hours(self,data):
        sum_total=0
        for each in data:
            sum_total=sum_total+each['h']+each['m']
        return sum_total
    def project_exists_in_projtrack(self,empprojid,work_week,year):
        emp_proj_timetrack = EmployeeProjectTimeTracker.objects.filter(Q(employee_project_id=empprojid) & Q(work_week=work_week) & Q(work_year=year))
        if(len(emp_proj_timetrack)>0):
            return True
        return False
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        emp_id=auth_details['emp_id']

        #1. 0 for current week, 1 for previous week, 2 for 2nd previous week, etc...And getting all dates of that week
        prev_week = self.request.query_params.get('previousweek', 0)#######
        commonfuncobj=CommonFunctions()
        response=commonfuncobj.get_employees_weeklydata([emp_id],prev_week=prev_week)
        return Response(response)

    @jwttokenvalidator
    @custom_exceptions
    def post(self,request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        emp_id=auth_details['emp_id']
        prev_week = self.request.query_params.get('previousweek', 0)
        req_serializer=EmployeeProjectTimeTrackerReqSerializer(data=request.data,many=True,context={'emp_id':emp_id,'prev_week':prev_week})
        if(req_serializer.is_valid()):
            weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(prev_week)))
            week_number=weekdatesList[-1].isocalendar()[1]
            year=str(weekdatesList[-1]).split('-')[0]
            # years = [year,str(int(year)+1)]
            data=json.loads(json.dumps(req_serializer.data))
            inputdata=[]
            timesheetDiscrepancies = TimesheetDiscrepancy.objects.filter(leave_request__emp_id=emp_id,status=0)
            tt_id_in_ts_des = timesheetDiscrepancies.values_list('employee_project_time_tracker_id',flat=True)

            for each in data:
                ##Loop Through ACTIVE PROJECTS##
                for eachproj in each['active_projects']:
                    empproj=EmployeeProject.objects.get(project_id=eachproj['project_id'],emp_id=emp_id)
                    if(self.sum_of_work_hours(eachproj['work_hours'])>0 or self.project_exists_in_projtrack(empproj.id,week_number,year)):
                        for eachday in eachproj['work_hours']:
                            eachdate=datetime.strptime(eachday['date'], "%Y-%m-%d").date()
                            if(eachdate in weekdatesList and eachdate<=datetime.now().date()):
                                inputdata.append({'work_date':eachdate,'work_week':week_number,'work_year':year,'work_minutes':60*int(eachday['h'])+int(eachday['m']),
                                        'employee_project':empproj.id,'status':1})
                    ep_tt_id = EmployeeProjectTimeTracker.objects.filter(Q(employee_project_id=empproj.id) & Q(work_week=week_number) & Q(work_year=year)).order_by('work_date')

                    for index,each_tt_id in enumerate(ep_tt_id):
                        if(60*int(eachproj['work_hours'][index]['h'])+int(eachproj['work_hours'][index]['m'])==0 and  each_tt_id.id in tt_id_in_ts_des):
                            timesheetDiscrepancies.filter(employee_project_time_tracker_id=each_tt_id.id).update(status=1)


                default_non_projects=DefaultProjects.default_non_projects()
                for eachnonproj in default_non_projects:
                    emp_non_proj=EmployeeProject.objects.get(project__name=eachnonproj,emp_id=emp_id,status=1)
                    if(self.sum_of_work_hours(each[eachnonproj]['work_hours'])>0 or self.project_exists_in_projtrack(emp_non_proj.id,week_number,year)):
                        for eachday in each[eachnonproj]['work_hours']:
                            eachdate=datetime.strptime(eachday['date'], "%Y-%m-%d").date()
                            inputdata.append({'work_date':eachdate,'work_week':week_number,'work_year':year,'work_minutes':60*int(eachday['h'])+int(eachday['m']),'employee_project':emp_non_proj.id,'status':1})

                # ##Loop Through VACTION PROJECT##
                # emp_vac_proj=EmployeeProject.objects.get(project__name=DefaultProjects.Vacation.value,emp_id=emp_id,status=1)
                # if(self.sum_of_work_hours(each[DefaultProjects.Vacation.value]['work_hours'])>0 or self.project_exists_in_projtrack(emp_vac_proj.id,week_number,year)):
                #     for eachday in each[DefaultProjects.Vacation.value]['work_hours']:
                #         eachdate=datetime.strptime(eachday['date'], "%Y-%m-%d").date()
                #         inputdata.append({'work_date':eachdate,'work_week':week_number,'work_minutes':60*int(eachday['h'])+int(eachday['m']),'employee_project':emp_vac_proj.id,'status':1})


                # ##Loop Through MISCELLANEOUS PROJECT##
                # emp_mis_proj=EmployeeProject.objects.get(project__name=DefaultProjects.Mis.value,emp_id=emp_id,status=1)
                # if(self.sum_of_work_hours(each[DefaultProjects.Mis.value]['work_hours'])>0 or self.project_exists_in_projtrack(emp_mis_proj.id,week_number,year)):
                #     for eachday in each[DefaultProjects.Mis.value]['work_hours']:
                #         eachdate=datetime.strptime(eachday['date'], "%Y-%m-%d").date()
                #         if(eachdate in weekdatesList and eachdate<=datetime.now().date()):
                #             inputdata.append({'work_date':eachdate,'work_week':week_number,'work_minutes':60*int(eachday['h'])+int(eachday['m']),'employee_project':emp_mis_proj.id,'status':1})

            emp_proj_ser=EmployeeProjectTimeTrackerSerializer(data=inputdata,many=True)
            if(emp_proj_ser.is_valid()):
                emp_proj_ser.save()
                return Response(req_serializer.data,status=201)
            return Response(emp_proj_ser.errors,status=400)
        return Response(req_serializer.errors,status=400)

class WeeklyStatus(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        emp_id=auth_details['emp_id']
        #1. 0 for current week, 1 for previous week, 2 for 2nd previous week, etc...And getting all dates of that week
        prev_week = self.request.query_params.get('previousweek', 0)
        commonfunc_obj=CommonFunctions()
        response=commonfunc_obj.get_weekly_statuses([emp_id],prev_week=prev_week)
        return Response(response, status=StatusCode.HTTP_OK)

    @jwttokenvalidator
    @custom_exceptions
    def post(self,request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        emp_id=auth_details['emp_id']
        prev_week = self.request.query_params.get('previousweek', 0)
        req_serializer=WeeklyStatusReqSerializer(data=request.data,context={'emp_id':emp_id,'prev_week':prev_week})

        if(req_serializer.is_valid()):
            data=json.loads(json.dumps(req_serializer.data))
            inputdata=[]
            weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(prev_week)))
            week_number=weekdatesList[-1].isocalendar()[1]
            year=str(weekdatesList[-1]).split('-')[0]
            # years = [int(year), int(year) + 1]
            for each in data['weekly_status']:
                empproj=EmployeeProject.objects.get(project_id=each['project_id'],emp_id=emp_id)
                if(each['report']==""):
                    wd=EmployeeWeeklyStatusTracker.objects.filter(employee_project_id=empproj.id,wsr_week=week_number,wsr_year=year)
                    if(len(wd)>0):

                        inputdata.append({'wsr_date':data['wsr_date'],'wsr_year':year,'wsr_week':week_number,'work_report':each['report'],'employee_project':empproj.id,'status':1})
                else:
                    report_utf_format=smart_str(each['report'], encoding='utf-8', strings_only=False, errors='strict')
                    inputdata.append({'wsr_date':data['wsr_date'],'wsr_year':year,'wsr_week':week_number,'work_report':report_utf_format,
                        'employee_project':empproj.id,'status':1})

            week_status_post_serializer=WeeklyStatusPostSerializer(data=inputdata,many=True)
            if(week_status_post_serializer.is_valid()):
                if(data['is_final_submit']==True):
                    workweekstatus_data={'emp':emp_id,'work_week':week_number,'work_year':year,'status':WorkApprovalStatuses.Pending.value}
                    workweek_approval_ser=EmployeeWorkApproveStatusPostSerializer(data=workweekstatus_data)
                    if(workweek_approval_ser.is_valid()):
                        week_status_post_serializer.save()
                        workweek_approval_ser.save()
                    else:
                        return Response(utils.StyleRes(False,'WorkapprovalstatusSerializer error',workweek_approval_ser.errors),status=StatusCode.HTTP_EXPECTATION_FAILED)
                else:
                    week_status_post_serializer.save()
                return Response(utils.StyleRes(True,'Success fully retrive data',week_status_post_serializer.data),status=StatusCode.HTTP_CREATED)
            return Response(utils.StyleRes(False,'week status serializer raised this exception',week_status_post_serializer.errors), status=StatusCode.HTTP_EXPECTATION_FAILED)
        return Response(utils.StyleRes(False,'request serializer raised this exception',req_serializer.errors), status=StatusCode.HTTP_EXPECTATION_FAILED)

class StatusBasedTimeSheets(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        emp_id=auth_details['emp_id']

        #1. 0 for current week, 1 for previous week, 2 for 2nd previous week, etc...And getting all dates of that week
        prev_week = self.request.query_params.get('previousweek', 1)
        statfilter = self.request.query_params.get('status',-1)

        commonfunc_obj=CommonFunctions()
        weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(prev_week)))
        week_number=weekdatesList[-1].isocalendar()[1]
        year=str(weekdatesList[-1]).split('-')[0]
        # years = [str(year),str(int(year)+1)]
        employee_approve_status=EmployeeWorkApproveStatus.objects.filter(emp_id=emp_id,work_year=year,work_week=week_number)
        employee_approve_status_list=list(map(lambda x:x.emp_id,employee_approve_status))
        if(len(employee_approve_status_list)>0):
            response=commonfunc_obj.get_employees_weeklydata([emp_id],prev_week=prev_week,statusFlag=True)
            if(statfilter!=-1):
                resp=filter(lambda x:x['status']==int(statfilter),response)
                return Response(resp, status=StatusCode.HTTP_OK)
            return Response(response, status=StatusCode.HTTP_OK)
        return Response([],StatusCode.HTTP_OK)

class StatusBasedWeeklyStatus(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        emp_id=auth_details['emp_id']

        #1. 0 for current week, 1 for previous week, 2 for 2nd previous week, etc...And getting all dates of that week
        prev_week = self.request.query_params.get('previousweek', 1)
        statfilter = self.request.query_params.get('status',-1)

        commonfunc_obj=CommonFunctions()
        response=commonfunc_obj.get_weekly_statuses([emp_id],prev_week=prev_week,statusFlag=True)
        if(statfilter!=-1):
            resp=filter(lambda x:x['status']==int(statfilter),response)
            return Response(resp, status=StatusCode.HTTP_OK)
        return Response(response, status=StatusCode.HTTP_OK)


class GetEmployeesWSTData(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        emp_id=auth_details['emp_id']    

        # emp_id=113
        
        prev_week = self.request.query_params.get('previousweek', 1)
        statfilter = self.request.query_params.get('status',-1)
        page_number = int(self.request.query_params.get('page',1))
        items_per_page = int(self.request.query_params.get('itms_per_page',9))
        final_resp={}
        common_fun_obj=CommonFunctions()
        weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(prev_week)))
        week_number=weekdatesList[-1].isocalendar()[1]
        year=str(weekdatesList[-1]).split('-')[0]
        # years = [year, str(int(year) + 1)]
        emp_of_manager=common_fun_obj.get_employees_list(emp_id)
        if(int(statfilter)==-1):
            employee_approve_status=EmployeeWorkApproveStatus.objects.filter(emp_id__in=emp_of_manager,work_year=year,work_week=week_number)
        else:
            employee_approve_status=EmployeeWorkApproveStatus.objects.filter(emp_id__in=emp_of_manager,work_year=year,work_week=week_number,status=int(statfilter))
        employee_approve_status_list=list(map(lambda x:x.emp_id,employee_approve_status))
        response=common_fun_obj.get_employees_weeklydata(employee_approve_status_list[items_per_page*page_number-items_per_page:items_per_page*page_number],prev_week=prev_week,statusFlag=True)
        dayid,dayname=utils.findDay(datetime.now().date())
        enableFlag=False
        if(dayid in [0,1,6]):
            enableFlag=True

        res = {'results': list(response), 'enableFlag':enableFlag,'total': len(employee_approve_status_list)}
        return Response(res,status=StatusCode.HTTP_OK)

class GetEmployeesWSRData(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        emp_id=auth_details['emp_id']
        prev_week = self.request.query_params.get('previousweek', 1)
        statfilter = self.request.query_params.get('status',-1)
        page_number = self.request.query_params.get('page',1)
        items_per_page = self.request.query_params.get('itms_per_page',3)

        final_resp={}
        common_fun_obj=CommonFunctions()
        resp=common_fun_obj.get_employees_list(emp_id)
        response=common_fun_obj.get_weekly_statuses(resp,prev_week=prev_week,statusFlag=True)
        dayid,dayname=utils.findDay(datetime.now().date())
        enableFlag=False
        if(dayid in [0,1,6]):
            enableFlag=True


        if(int(statfilter)!=-1):
            filteredresp=filter(lambda x:x['status']==int(statfilter),response)
            final_resp['results']=filteredresp
            paginator = Paginator(list(filteredresp), items_per_page)
            page_obj = paginator.page(page_number)
            res = {'results': list(page_obj), 'enableFlag':enableFlag,'total': page_obj.paginator.count}
            return Response(res,status=StatusCode.HTTP_OK)

        #With all data, there should be only one page with all data
        paginator = Paginator(list(response), page_obj.paginator.count)
        page_obj = paginator.page(page_number)
        res = {'results': list(page_obj), 'enableFlag':enableFlag,'total': page_obj.paginator.count}
        return Response(res, status=StatusCode.HTTP_OK)

class GetWsrWithEmpId(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        emp_id=auth_details['emp_id']
        #1. 0 for current week, 1 for previous week, 2 for 2nd previous week, etc...And getting all dates of that week
        prev_week = self.request.query_params.get('previousweek', 1)
        empid = self.request.query_params.get('empid',emp_id)
        commonfunc_obj=CommonFunctions()
        response=commonfunc_obj.get_weekly_statuses([empid],prev_week=prev_week)
        return Response(response, status=StatusCode.HTTP_OK)


class WSTDownload(APIView):
    def sum_of_work_hours(self,data):
        sum_total=0
        for each in data:
            sum_total=sum_total+each['h']+each['m']
        return sum_total
    def convtohms(seconds):
        return time.strftime("%H:%M:%S",time.gmtime(seconds))
    @jwttokenvalidator
    @custom_exceptions
    @query_debugger
    def get(self,request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        empid=auth_details['emp_id']
        prev_week = self.request.query_params.get('previousweek', 1)
        emp_id = self.request.query_params.get('emp_id',empid)

        common_fun_obj=CommonFunctions()
        weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(prev_week)))
        work_week=weekdatesList[-1].isocalendar()[1]
        year=str(weekdatesList[-1]).split('-')[0]
        # years = [year, str(int(year) + 1)]
        emp_of_manager=[]
        if(len(self.request.query_params)==0):
            emp_of_manager=common_fun_obj.get_employees_list(emp_id,priorityCheck=False)
        elif (emp_id == '-1'):
            all_emp = Employee.objects.all().values('emp_id')
            for emp in all_emp:
                emp_of_manager.append(emp['emp_id'])
        else:
            emp_of_manager_obj=ManagerWorkHistory.objects.filter(Q(emp_id=emp_id) & Q(work_week=work_week) & Q(work_year=year))
            if(len(emp_of_manager_obj)>0):
                emp_of_manager=ast.literal_eval(emp_of_manager_obj[0].emp_list)

        
        employee_approve_status=EmployeeWorkApproveStatus.objects.findByEmplistAndWeekAndYear(emp_of_manager,work_week,year)
        employee_approve_status_list=list(map(lambda x:x.emp_id,employee_approve_status))
        data_struct=common_fun_obj.get_employees_weeklydata(employee_approve_status_list,prev_week=prev_week,statusFlag=True,TimeTrackerdataFlag=False)
        if(emp_id) == '-1':
            emp = {'emp_name':'All'}
        else:
            emp=Employee.objects.filter(emp_id=emp_id).values()[0]

        
        
        basename=(emp['emp_name'])+"_WTR_WEEK"+str(work_week)+"_"+str(datetime.strftime(datetime.now().date(), '%d%m%Y'))+".xlsx"
        response=utils.contentTypesResponce('xl',basename)
        e=ExcelServices(response,in_memory=True,multisheetFlag=True)
        columns=['Date','Staff No','Name','Project','Manager','Hrs']
        data=[columns]

        sheet2_columns = ['Staff No','Name','Project','Manager','Total Hours']
        sheet2_data=[sheet2_columns]

        
        
        emp_hierarchy_obj = EmployeeHierarchy.objects.filter(emp_id=emp_id,status=1)
        emp_managers = list(map(lambda x: x.manager_id,emp_hierarchy_obj))
        att_access_grp_individual=[]
        global_attendance_access = GlobalAccessFlag.objects.filter(status=1,access_type__iexact='ATTENDANCE')
        if(len(global_attendance_access)>0):
            att_access_grp_obj = Employee.objects.filter(role_id=4,status=1)
        else:
            att_access_grp_obj = AttendanceAccessGroup.objects.filter(emp_id__in=emp_managers,status=1)
            att_access_grp_individual = list(map(lambda x:x.emp_id,AttendanceAccessGroup.objects.filter(emp_id=emp_id,status=2)))

        if(len(att_access_grp_obj)>0 or len(att_access_grp_individual)>0):
            sheet3_columns = ['Staff No','Name','Manager','Date','Day','Gross Hours','Net Hours']
            sheet3_data=[sheet3_columns]
            eh=EmployeeHierarchy.objects.select_related('manager').filter(emp_id__in=emp_of_manager,priority=1,status=1)
            eh_dict={}
            for x in eh:
                eh_dict[x.emp_id]=x.manager.emp_name
            for each in emp_of_manager:
                # eh=EmployeeHierarchy.objects.filter(emp_id=each,priority=1,
                # status=1)
                manager_name=eh_dict[each]
                ####ADDING ATTENDANCE DATA####
                
                attendance_data,attendance_flag,present_dates_list = attendance_.get_tt_final_datastructure(each,weekdatesList[0],weekdatesList[-1])
                
                if(len(attendance_data)>0):
                    for eachitem in weekdatesList:
                        matchflag=False
                        for eachone in attendance_data:
                            if(str(eachitem)==eachone['Date'] and (str(eachone['Date']) in present_dates_list) and each==eachone['emp_id']):
                                gross_mins = (60*int(eachone['GrossWorkingHours'].split(':')[0]))+int(eachone['GrossWorkingHours'].split(':')[1])
                                net_mins = (60*int(eachone['NetWorkingHours'].split(':')[0]))+int(eachone['NetWorkingHours'].split(':')[1])
                                gross_format_time='{:02d}:{:02d}'.format(*divmod(gross_mins,60))
                                gross_date_object = datetime.strptime(gross_format_time, "%H:%M")
                                net_format_time='{:02d}:{:02d}'.format(*divmod(net_mins,60))
                                net_date_object = datetime.strptime(net_format_time, "%H:%M")
                                sheet3_data.append([eachone['staff_no'],eachone['emp_name'],manager_name,str(eachitem),str(calendar.day_name[datetime.strptime(str(eachitem), '%Y-%m-%d').weekday()]),gross_date_object,net_date_object])
                                matchflag = True
                                break
                        if(not matchflag):
                            empty_format_time_='{:02d}:{:02d}'.format(*divmod(0,60))
                            empty_date_object_ = datetime.strptime(empty_format_time_, "%H:%M")
                            sheet3_data.append([eachone['staff_no'],eachone['emp_name'],manager_name,str(eachitem),str(calendar.day_name[datetime.strptime(str(eachitem), '%Y-%m-%d').weekday()]),empty_date_object_,empty_date_object_])
                ################################

        
        eh=EmployeeHierarchy.objects.findByEmplistAndPriorityAndStatus(emp_of_manager,1,1)
        eh_dict={}
        for x in eh:
            eh_dict[x.emp_id]=x.manager.emp_name
        for each in data_struct:
            # eh=EmployeeHierarchy.objects.filter(emp_id=each['emp_id'],priority=1,
            # status=1)
            manager_name=eh_dict[each['emp_id']]
            day_wise_dict = {}
            for i,eachproj in enumerate(each['active_projects']):
                total_time_active = 0
                # if(eachproj['visibilityFlag']):
                for eachday in eachproj['work_hours']:
                    # if(eachday['date'] not in day_wise_dict):
                    #     if((self.sum_of_work_hours(eachproj['work_hours'])>0)):
                    #         day_wise_dict[eachday['date']]=(60*eachday['h'])+eachday['m']
                    #     else:
                    #         day_wise_dict[eachday['date']]=0
                    # else:
                    #     if((self.sum_of_work_hours(eachproj['work_hours'])>0)):
                    #         day_wise_dict[eachday['date']]+=(60*eachday['h'])+eachday['m']
                    
                    if((self.sum_of_work_hours(eachproj['work_hours'])>0)):
                        mins=(60*eachday['h'])+eachday['m']
                        if(mins!=0):
                            if(eachday['h']==24):
                                mins=mins-15
                            total_time_active = total_time_active+mins

                            format_time='{:02d}:{:02d}'.format(*divmod(mins,60))
                            date_object = datetime.strptime(format_time, "%H:%M")
                            data.append([eachday['date'],each['staff_no'],each['emp_name'],eachproj['project_name'],manager_name,date_object])
                  
            
                if(total_time_active>0):
                    hrs_active,mins_active = divmod(total_time_active,60)
                    format_total_time_active = '{h:02d}:{m:02d}'.format(h=hrs_active,m=mins_active)
                    sheet2_data.append([each['staff_no'],each['emp_name'],eachproj['project_name'],manager_name,format_total_time_active])
            # print(day_wise_dict)
            
            for each_mis_or_vac_proj in DefaultProjects.mis_vac_projs():
                total_time_mis_or_vac = 0
                for eachday in each[each_mis_or_vac_proj]['work_hours']:
                    # if(eachday['date'] not in day_wise_dict):
                    #     if((self.sum_of_work_hours(each[each_mis_or_vac_proj]['work_hours'])>0)):
                    #         day_wise_dict[eachday['date']]=(60*eachday['h'])+eachday['m']
                    #     else:
                    #         day_wise_dict[eachday['date']]=0
                    # else:
                    #     if((self.sum_of_work_hours(each[each_mis_or_vac_proj]['work_hours'])>0)):
                    #         day_wise_dict[eachday['date']]+=(60*eachday['h'])+eachday['m']
                    if(self.sum_of_work_hours(each[each_mis_or_vac_proj]['work_hours'])>0):
                        mins=(60*eachday['h'])+eachday['m']
                        if(mins!=0):
                            if(eachday['h']==24):
                                mins=mins-15
                            total_time_mis_or_vac = total_time_mis_or_vac + mins
                            format_time='{:02d}:{:02d}'.format(*divmod(mins,60))
                            date_object = datetime.strptime(format_time, "%H:%M")
                            data.append([eachday['date'],each['staff_no'],each['emp_name'],each_mis_or_vac_proj,eh[0].manager.emp_name,date_object])
                if(total_time_mis_or_vac>0):
                    hrs_mis_or_vac,mins_mis_or_vac = divmod(total_time_mis_or_vac,60)
                    format_total_time_mis_or_vac = '{h:02d}:{m:02d}'.format(h=hrs_mis_or_vac,m=mins_mis_or_vac)
                    sheet2_data.append([each['staff_no'],each['emp_name'],each_mis_or_vac_proj,eh[0].manager.emp_name,format_total_time_mis_or_vac])
        
            # for k,v in day_wise_dict.items():
            #     if(datetime.strptime(k,"%Y-%m-%d").weekday()<=4 and v==0):
            #         format_time='{:02d}:{:02d}'.format(*divmod(v,60))
            #         date_object = datetime.strptime(format_time, "%H:%M")
            #         data.append([k,each['staff_no'],each['emp_name'],"",manager_name,date_object])

        if(len(att_access_grp_obj)>0 or len(att_access_grp_individual)>0):
            e.defineMultipleWorksheets(['Weekly Timesheet Report','WTR Summary','Attendance'],[data,sheet2_data,sheet3_data])
        else:
            e.defineMultipleWorksheets(['Weekly Timesheet Report','WTR Summary'],[data,sheet2_data])
        del e
        return response

class WSRDownload(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        empid=auth_details['emp_id']
        prev_week = self.request.query_params.get('previousweek', 1)
        emp_id = self.request.query_params.get('emp_id',empid)
        common_fun_obj=CommonFunctions()
        weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(prev_week)))
        work_week=weekdatesList[-1].isocalendar()[1]
        year=str(weekdatesList[-1]).split('-')[0]
        # years = [year,str(int(year)+1)]
        emp_of_manager=[]
        if(len(self.request.query_params)==0):
            emp_of_manager=common_fun_obj.get_employees_list(emp_id,priorityCheck=False)
        elif (emp_id == '-1'):
            all_emp = Employee.objects.all().values('emp_id')
            for emp in all_emp:
                emp_of_manager.append(emp['emp_id'])
        else:
            emp_of_manager_obj=ManagerWorkHistory.objects.filter(Q(emp_id=emp_id) & Q(work_week=work_week) & Q(work_year=year))
            if(len(emp_of_manager_obj)>0):
                emp_of_manager=ast.literal_eval(emp_of_manager_obj[0].emp_list)

        employee_approve_status=EmployeeWorkApproveStatus.objects.findByEmplistAndWeekAndYear(emp_of_manager,work_week,year)
        employee_approve_status_list=list(map(lambda x:x.emp_id,employee_approve_status))
        data_struct=common_fun_obj.get_weekly_statuses(employee_approve_status_list,prev_week=prev_week,statusFlag=True)
        if(emp_id) == '-1':
            emp = {'emp_name':'All'}
        else:
            emp=Employee.objects.filter(emp_id=emp_id).values()[0]

        basename=(emp['emp_name'])+"_WSR_WEEK"+str(work_week)+"_"+str(datetime.strftime(datetime.now().date(), '%d%m%Y'))+".xlsx"
        response=utils.contentTypesResponce('xl',basename)
        e=ExcelServices(response,in_memory=True,workSheetName="Weekly Status Report")
        columns=['Name','Staff No.','Project Name','Manager Name','WeeklyStatus']
        data=[columns]
        
        eh_dict={}
        eh=EmployeeHierarchy.objects.findByEmplistAndPriorityAndStatus(employee_approve_status_list,1,1)
        for each in eh:
            eh_dict[each.emp_id]=each
        for each in data_struct:
            # eh=EmployeeHierarchy.objects.filter(emp_id=each['emp_id'],priority=1,status=1)
            for eachproj in each['active_projects']:
                if(eachproj['work_report']!=''):
                    data.append([each['emp_name'],each['staff_no'],eachproj['project_name'],eh_dict.get(each['emp_id']).manager.emp_name,eachproj['work_report']])
            if(each[DefaultProjects.General.value]['work_report']!=''):
                data.append([each['emp_name'],each['staff_no'],each[DefaultProjects.General.value]['project_name'],eh_dict.get(each['emp_id']).manager.emp_name,each[DefaultProjects.General.value]['work_report']])
        e.writeExcel(data,row_start=0,long_column_list=[2])
        del e
        return response

class NCRDownload(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        empid=auth_details['emp_id']
        prev_week = self.request.query_params.get('previousweek', 1)
        emp_id = self.request.query_params.get('emp_id',empid)
        weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(prev_week)))
        work_week=weekdatesList[-1].isocalendar()[1]
        year=str(weekdatesList[-1]).split('-')[0]
        # years = [year,str(int(year)+1)]
        emp_of_manager=[]
        if(len(self.request.query_params)==0):
            emp=Employee.objects.get(emp_id=emp_id)
            emp_of_manager=common_fun_obj.get_employees_list(emp_id,priorityCheck=False)
            # emps_of_manager=EmployeeHierarchy.objects.direct_indirect_employees(manager_id=emp_id).values('emp_id').distinct().annotate(
            # emp_name = F('emp__emp_name'),
            # company = F('emp__company')
            # )
        elif (emp_id == '-1'):
            all_emp = Employee.objects.all().values('emp_id')
            for emp in all_emp:
                emp_of_manager.append(emp['emp_id'])
        else:
            emp=Employee.objects.get(emp_id=emp_id)
            emp_of_manager_obj=ManagerWorkHistory.objects.filter(Q(emp_id=emp_id) & Q(work_week=work_week) & Q(work_year=year))
            if(len(emp_of_manager_obj)>0):
                emp_of_manager=ast.literal_eval(emp_of_manager_obj[0].emp_list)
        if(emp_id) == '-1':
            emp = {'emp_name':'All'}
        else:
            emp=Employee.objects.filter(emp_id=emp_id).values()[0]

        basename=(emp['emp_name'])+"_NCR_WEEK"+str(work_week)+"_"+str(datetime.strftime(datetime.now().date(), '%d%m%Y'))+".xlsx"
        response=utils.contentTypesResponce('xl',basename)
        e=ExcelServices(response,in_memory=True,workSheetName="NCR Report")


        columns=['Name','Satff No','Company','Manager Name','DataEntryNC','DataApprovalNC']
        data=[columns]
        managers=Employee.objects.allmanagers()
        managers=list(map(lambda x:x.emp_id,managers))

        emp_dict={}
        empobj=Employee.objects.filter(emp_id__in=emp_of_manager)
        for each in empobj:
            emp_dict[each.emp_id]=each

        eh_dict={}
        eh=EmployeeHierarchy.objects.findByEmplistAndPriorityAndStatus(emp_of_manager,1,1)
        for each in eh:
            eh_dict[each.emp_id]=each
        
        entry_comp_dict={}
        empEntryCompStatusObj = EmployeeEntryCompStatus.objects.findByEmplistAndWeekAndYear(emp_of_manager,work_week,year)
        for each in empEntryCompStatusObj:
            entry_comp_dict[each.emp_id]=each
        
        approval_comp_dict = {}
        empApprCompStatusObj = EmployeeApprovalCompStatus.objects.findByEmplistAndWeekAndYear(emp_of_manager,work_week,year)
        for each in empApprCompStatusObj:
            approval_comp_dict[each.emp_id]=each


        for eachemp in emp_of_manager:
            # eh=EmployeeHierarchy.objects.filter(emp_id=eachemp,priority=1,status=1)

            DataEntryComp="NO"
            DataApprovalCount=0
            # empobj=Employee.objects.get(emp_id=eachemp)

            # entry_comps=EmployeeEntryCompStatus.objects.filter(Q(emp_id=eachemp) & Q(work_week=work_week) & Q(created__year=year))
            entry_comps = entry_comp_dict.setdefault(eachemp,None)
            if(entry_comps is not None):
                DataEntryComp="YES"
            # approval_comps=EmployeeApprovalCompStatus.objects.filter(Q(emp_id=eachemp) & Q(work_week=work_week) & Q(created__year=year))
            approval_comps = approval_comp_dict.setdefault(eachemp,None)
            if(eachemp not in managers):
                DataApprovalCount='NA'
            else:
                if(approval_comps is not None):
                    DataApprovalCount=approval_comps.cnt

            data.append([emp_dict.get(eachemp).emp_name,emp_dict.get(eachemp).staff_no,emp_dict.get(eachemp).company,eh_dict.get(eachemp).manager.emp_name,DataEntryComp,DataApprovalCount])

        e.writeExcel(data,row_start=0,long_column_list=[2])
        del e
        return response


class ApproveEmpTimesheet(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def post(self, request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400) 
        try:
            serialized = EmployeeWorkApproveStatusSerializer(data = request.data)
            if (serialized.is_valid()):
                emp_id = serialized.data['emp_id']
                work_week = serialized.data['work_week']
                year = serialized.data['year']
                status = serialized.data['status']
                comments = request.data.get('comments', '')
                emp_obj = Employee.objects.prefetch_related('emp').filter(emp_id=emp_id).last()
                global_email_access = GlobalAccessFlag.objects.filter(status=1,access_type__iexact='EMAIL')
                individual_email_access_emps=[]
                if(len(global_email_access)>0):
                    accessed_managers = list(map(lambda x:x.emp_id,Employee.objects.filter(role_id=4,status=1)))
                else:
                    accessed_managers = list(map(lambda x:x.emp_id,EmailAccessGroup.objects.filter(status=1)))
                    individual_email_access_emps = list(map(lambda x:x.emp_id,EmailAccessGroup.objects.filter(status=2)))
                managers_list=list(map(lambda x:x.manager_id,emp_obj.emp.filter(status=1,priority=3)))
                comments_utf_format=smart_str(comments, encoding='utf-8', strings_only=False, errors='strict')
                approve_status_data = EmployeeWorkApproveStatus.objects.filter(emp_id = emp_id,work_week=work_week,work_year=year)
                if len(approve_status_data) == 0:
                    insert_approve_status = EmployeeWorkApproveStatus(emp_id = emp_id,work_week = work_week,work_year=year,comments = comments_utf_format,status = status)
                    insert_approve_status.save()
                else:
                    if comments != '':
                        EmployeeWorkApproveStatus.objects.filter(emp_id = emp_id,work_week=work_week,work_year=year).update(comments = comments_utf_format,status = status)
                    else:
                        EmployeeWorkApproveStatus.objects.filter(emp_id = emp_id,work_week=work_week,work_year=year).update(status = status)
                
                if((any(item in accessed_managers for item in managers_list) or emp_id in individual_email_access_emps) and status==WorkApprovalStatuses.Rejected.value):
                    # template = get_template('reject.html')
                    ctx={
                        "work_week":work_week,
                        "name":emp_obj.emp_name,
                        "comments":comments_utf_format,
                        "UI_URL":settings.UI_URL
                    }
        
                    email_service.sendTimeSheetRejectmail(emp_id,emp_obj.email,ctx)
                else:
                    if(status==WorkApprovalStatuses.Rejected.value):
                        log.error("REJECTED EMAIL NOT SENT TO ANY ONE BECAUSE CORRESPONDING MANAGER SHOULD NOT HAVE EMAIL ACCESS TO SEND")
                employee_ts_approve_hostory_data = []
                emp_hierarchy = EmployeeHierarchy.objects.order_by('priority').filter(emp_id=serialized.data['emp_id']).values_list('manager_id',flat=True)
                for i in range(0,len(serialized.data['attendance_ts_approved_dates'])):
                    employee_ts_approve_hostory_data.append({'emp':serialized.data['emp_id'],'work_date':serialized.data['attendance_ts_approved_dates'][i],'swipe_minutes':0,'work_minutes':serialized.data['attendance_ts_work_minutes'][i],'rm':emp_hierarchy[0],'mm':emp_hierarchy[1],'fo':emp_hierarchy[2],'rm_comments':serialized.data['rm_comments']})
                employee_ts_approve_hostory_serial_data = EmployeeTimesheetApprovedHistorySerializer(data = employee_ts_approve_hostory_data, many=True )
                if(employee_ts_approve_hostory_serial_data.is_valid()):
                    employee_ts_approve_hostory_serial_data.save()
                    log.info("saved employee_timesheet_approve_hostory for emp_id {}".format(serialized.data['emp_id']))
                else:
                    log.error("error in saving employee_timesheet_approve_hostory for emp_id {} details {}".format(serialized.data['emp_id'],str(employee_ts_approve_hostory_serial_data.errors)))

                return Response(utils.StyleRes(True,'data updated Successfully',{}), status=StatusCode.HTTP_CREATED)
            else:
                return Response(utils.StyleRes(False,serialized.errors,{}), status=StatusCode.HTTP_UNPROCESSABLE_ENTITY)
        except Exception as e:
            log.error(e)
            return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['something_went_wrong'],{}), status=StatusCode.HTTP_UNPROCESSABLE_ENTITY)

class getEmpManagers(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self, request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400) 
        try:
            auth_details = utils.validateJWTToken(request)
            if(auth_details['email']==""):
                return Response(auth_details, status=400)
            emp_id=auth_details['emp_id']
            admin_check = EmployeeAdmin.objects.filter(emp_id = emp_id,status =1)
            if len(admin_check) > 0:
                all_emp = {'emp_id':-1,'emp_name':'All'}
                admin_priority = list(admin_check.values())[-1]['priority']
                if admin_priority == 1:
                    manager_det = Employee.objects.filter(Q(role = 4) & ~Q(emp_id=emp_id) ).values('emp_id','emp_name').distinct().order_by('emp_name')
                    manager_det = list(manager_det)

                    #managers if emp is l3 start and remove ~Q(emp_id=emp_id) from above line
                    manager_det_l3 = EmployeeHierarchy.objects.direct_managers_dashboard(manager_id = emp_id).values('emp_id').distinct().annotate(emp_name = F('emp__emp_name')).order_by('emp_name')
                    for each in manager_det_l3:
                        manager_det.append(each)
                    #end
                    manager_det.append(all_emp)
                    return Response(manager_det, status=StatusCode.HTTP_OK)
                elif admin_priority == 2:
                    manager_det = Employee.objects.filter(role__gt = 2).values('emp_id','emp_name').distinct().order_by('emp_name')
                    manager_det = list(manager_det)
                    manager_det.append(all_emp)
                    return Response(manager_det, status=StatusCode.HTTP_OK)
            else:
                emp_det = Employee.objects.filter(emp_id = emp_id).values('emp_id','emp_name')
                emp_det = list(emp_det)
                manager_det = EmployeeHierarchy.objects.direct_managers_dashboard(manager_id = emp_id).values('emp_id').distinct().annotate(emp_name = F('emp__emp_name')).order_by('emp_name')
                manager_det = list(manager_det)
                missing_man = []
                for each in manager_det:
                    if(each['emp_id'] == emp_id):
                        missing_man.append(each)
                if len(missing_man) == 0:
                    manager_det.append(emp_det[0])
                return Response(manager_det, status=StatusCode.HTTP_OK)

        except Exception as e:
            log.error(traceback.format_exc())
            return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['something_went_wrong'],{}), status=StatusCode.HTTP_UNPROCESSABLE_ENTITY)

class getHistoricalData(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self, request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400) 
        try:
            auth_details = utils.validateJWTToken(request)
            if(auth_details['email']==""):
                return Response(auth_details, status=400)
            emp_id=auth_details['emp_id']
            role = auth_details['role_id']

            if role >= 3:
                req = request.GET
                emp = req['emp_id']
                dayid,dayname=utils.findDay(datetime.now().date())
                # monday is 0,1 is tuesday and 6 for sunday
                if(dayid not in [0,1,6]):
                    weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(1)))
                    weekstartone = weekdatesList[0]
                    weekendone = weekdatesList[-1]
                    week_numberone=weekdatesList[-1].isocalendar()[1]
                    yearone=str(weekdatesList[-1]).split('-')[0]
                    weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(2)))
                    weekstarttwo = weekdatesList[0]
                    weekendtwo = weekdatesList[-1]
                    week_numbertwo=weekdatesList[-1].isocalendar()[1]
                    yeartwo=str(weekdatesList[-1]).split('-')[0]
                    weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(3)))
                    weekstartthree = weekdatesList[0]
                    weekendthree = weekdatesList[-1]
                    week_numberthree=weekdatesList[-1].isocalendar()[1]
                    yearthree=str(weekdatesList[-1]).split('-')[0]



                else:
                    weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(2)))
                    weekstartone = weekdatesList[0]
                    weekendone = weekdatesList[-1]
                    week_numberone=weekdatesList[-1].isocalendar()[1]
                    yearone=str(weekdatesList[-1]).split('-')[0]

                    weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(3)))
                    week_numbertwo=weekdatesList[-1].isocalendar()[1]
                    weekstarttwo = weekdatesList[0]
                    weekendtwo = weekdatesList[-1]
                    yeartwo=str(weekdatesList[-1]).split('-')[0]
                    weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(4)))
                    weekstartthree = weekdatesList[0]
                    weekendthree = weekdatesList[-1]
                    week_numberthree=weekdatesList[-1].isocalendar()[1]
                    yearthree=str(weekdatesList[-1]).split('-')[0]
                
                # yearoneArray =  [str(yearone),str(int(yearone)+1)]
                # yeartwoArray =  [str(yeartwo),str(int(yeartwo)+1)]
                # yearthreeArray =  [str(yearthree),str(int(yearthree)+1)]
                #taking all last three work weeks and year
                work_weeks_years = [{'week':week_numberone,'year':yearone},{'week':week_numbertwo,'year':yeartwo},{'week':week_numberthree,'year':yearthree}]
                manager_overall_work = []
                #for all employees data
                if (emp == '-1'):
                    all_l3_emp_list = []
                    l3_emp_list = Employee.objects.filter(role = 4).values('emp_id')
                    for emp in l3_emp_list:
                        all_l3_emp_list.append(emp['emp_id'])
                    for each in work_weeks_years:
                        manager_work_his = ManagerWorkHistory.objects.filter(emp_id__in = all_l3_emp_list,work_week = each['week'],work_year=each['year']).values()
                        # print('manager_work_his',manager_work_his)

                        if len(manager_work_his)>0:
                            total_work_minutes = 0
                            entry_comp_cnt = 0
                            approval_comp_cnt = 0
                            emp_cnt = 0
                            work_week = 0
                            for week in manager_work_his:
                                total_work_minutes = total_work_minutes + week['total_work_minutes']
                                entry_comp_cnt = entry_comp_cnt + week['entry_comp_cnt']
                                approval_comp_cnt = approval_comp_cnt + week['approval_comp_cnt']
                                emp_cnt = emp_cnt + week['emp_cnt']
                                work_week = week['work_week']
                            manager_overall_work.append({'emp_id':-1,'work_week':work_week,'total_work_minutes':total_work_minutes,'entry_comp_cnt':entry_comp_cnt,'approval_comp_cnt':approval_comp_cnt,'emp_cnt':emp_cnt})
                    # print('manager_overall_work',manager_overall_work)
                else:
                    for each in work_weeks_years:
                        
                        manager_work_his = ManagerWorkHistory.objects.filter(emp_id = emp,work_week = each['week'],work_year=each['year']).order_by('-work_week').values()
                        # print(manager_work_his,"*************")
                        # print('manager_work_his',manager_work_his)
                        if len(manager_work_his)>0:
                            # manager_work = list(manager_work_his)
                            manager_overall_work.append(manager_work_his[0])

                if(dayid not in [0,1,6]):
                    for each in manager_overall_work:
                        if each['work_week'] == week_numberone:
                            each['prev_week'] = 1
                            each['week_start'] = weekstartone
                            each['week_end'] = weekendone
                        if each['work_week'] == week_numbertwo:
                            each['prev_week'] = 2
                            each['week_start'] = weekstarttwo
                            each['week_end'] = weekendtwo
                        if each['work_week'] == week_numberthree:
                            each['prev_week'] = 3
                            each['week_start'] = weekstartthree
                            each['week_end'] = weekendthree
                else:
                    for each in manager_overall_work:
                        if each['work_week'] == week_numberone:
                            each['prev_week'] = 2
                            each['week_start'] = weekstartone
                            each['week_end'] = weekendone
                        if each['work_week'] == week_numbertwo:
                            each['prev_week'] = 3
                            each['week_start'] = weekstarttwo
                            each['week_end'] = weekendtwo
                        if each['work_week'] == week_numberthree:
                            each['prev_week'] = 4
                            each['week_start'] = weekstartthree
                            each['week_end'] = weekendthree
                for week in manager_overall_work:
                    week['total_hours'],week['total_mins'] = utils.get_time_hms(timedelta(minutes=week['total_work_minutes']))
                return Response(manager_overall_work, status=StatusCode.HTTP_OK)
            else:
                return Response({}, status=StatusCode.HTTP_OK)

        except Exception as e:
            log.error(traceback.format_exc())
            return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['something_went_wrong'],{}), status=StatusCode.HTTP_UNPROCESSABLE_ENTITY)


class ReportApi(APIView):
    def sum_of_work_hours(self,data):
        sum_total=0
        for each in data:
            sum_total=sum_total+each['h']+each['m']
        return sum_total
    def convtohms(seconds):
        return time.strftime("%H:%M:%S",time.gmtime(seconds))
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        empid=str(auth_details['emp_id'])
        emp_id = self.request.query_params.get('emp_id',empid)
        all_emp = self.request.query_params.get('all_emp',False)
        is_hr = self.request.query_params.get('is_hr',False)
        start_date = self.request.query_params.get('from','')
        last_date = self.request.query_params.get('to','')
        common_fun_obj=CommonFunctions()
        emp_of_manager=[]
        # name="All"
        if all_emp:
            emp=[]
            if(not is_hr):
                empList = EmployeeHierarchy.objects.direct_indirect_employees(manager_id=emp_id).values('emp_id').distinct()
            else:
                empList = Employee.objects.filter(status=1).values('emp_id').distinct()
            for each in empList:
                emp.append(each['emp_id'])
            if(emp_id not in empList):
                emp.append(emp_id)
            name = Employee.objects.get(emp_id=empid).emp_name +"_Team"
        else:
            emp = [int(emp_id)]
            name=Employee.objects.get(emp_id=emp_id).emp_name
        emp_data = []
        from_,to_,last_ = utils.dataUnavailabledates()
        print("$$$$$", from_)
        for each in emp:
            emp_projects = EmployeeProject.objects.filter(Q(emp_id = each))
            wtr_data = EmployeeProjectTimeTracker.objects.filter(Q(employee_project_id__in = emp_projects) & Q(work_date__gte = start_date) & Q(work_date__lt = last_date) & Q(work_minutes__gt = 0) & Q(employee_project__emp__emp__priority = 1)).values().annotate(
                    Date = F('work_date'),
                    staff_no = F('employee_project__emp__staff_no'),
                    Name = F('employee_project__emp__emp_name'),
                    Project= F('employee_project__project__name'),
                    Manager = F('employee_project__emp__emp__manager__emp_name'),
                    Hrs = F('work_minutes')
                ).distinct().order_by('work_date')
            emp_data.append(wtr_data.values())
        # data = []
        columns=['Date','Staff No','Name','Project','Manager','Hrs']
        data=[columns]
        for each in emp_data:
            for emp_details in each:
                h,m=utils.get_time_hms(timedelta(minutes=emp_details['Hrs']))
                hrs = str(h).zfill(2) + ":"+ str(m).zfill(2)
                data.append([str((emp_details['work_date'])),emp_details['staff_no'],emp_details['Name'],emp_details['Project'],emp_details['Manager'],hrs])
        # e.writeExcel(data,row_start=0)
        # del e

        # employee_approve_status=EmployeeWorkApproveStatus.objects.filter(emp_id__in=emp_of_manager,created__year=year,work_week=work_week)
        # employee_approve_status_list=list(map(lambda x:x.emp_id,employee_approve_status))
        data_struct=common_fun_obj.get_employees_daterangedata(employeeList=emp,start_date=start_date,last_date=last_date,statusFlag=True)
        sheet2_columns = ['Staff No','Name','Project','Manager','Total Hours']
        sheet2_data=[sheet2_columns]

        for each in data_struct:
            day_wise_dict = {}
            eh=EmployeeHierarchy.objects.filter(emp_id=each['emp_id'],priority=1,
            status=1)
            for eachproj in each['active_projects']:
                total_time_active = 0
                # if(eachproj['visibilityFlag']):
                for eachday in eachproj['work_hours']:
                    if(eachday['date'] not in day_wise_dict):
                        if((self.sum_of_work_hours(eachproj['work_hours'])>0)):
                            day_wise_dict[eachday['date']]=(60*eachday['h'])+eachday['m']
                        else:
                            day_wise_dict[eachday['date']]=0
                    else:
                        if((self.sum_of_work_hours(eachproj['work_hours'])>0)):
                            day_wise_dict[eachday['date']]+=(60*eachday['h'])+eachday['m']
                    if(self.sum_of_work_hours(eachproj['work_hours'])>0):
                        mins=(60*eachday['h'])+eachday['m']
                        if(mins!=0):
                            if(eachday['h']==24):
                                mins=mins-15
                            total_time_active = total_time_active+mins

                            format_time='{:02d}:{:02d}'.format(*divmod(mins,60))
                            date_object = datetime.strptime(format_time, "%H:%M")
                            # sheet2_data.append([eachday['date'],each['staff_no'],each['emp_name'],eachproj['project_name'],eh[0].manager.emp_name,date_object])
                if(total_time_active>0):
                    hrs_active,mins_active = divmod(total_time_active,60)
                    format_total_time_active = '{h:02d}:{m:02d}'.format(h=hrs_active,m=mins_active)
                    sheet2_data.append([each['staff_no'],each['emp_name'],"Active Projects",eh[0].manager.emp_name,format_total_time_active])
            
            for each_mis_or_vac_proj in DefaultProjects.mis_vac_projs():
                total_time_mis_or_vac = 0

                for eachday in each[each_mis_or_vac_proj]['work_hours']:
                    if(eachday['date'] not in day_wise_dict):
                        if((self.sum_of_work_hours(each[each_mis_or_vac_proj]['work_hours'])>0)):
                            day_wise_dict[eachday['date']]=(60*eachday['h'])+eachday['m']
                        else:
                            day_wise_dict[eachday['date']]=0
                    else:
                        if((self.sum_of_work_hours(each[each_mis_or_vac_proj]['work_hours'])>0)):
                            day_wise_dict[eachday['date']]+=(60*eachday['h'])+eachday['m']
                    if(self.sum_of_work_hours(each[each_mis_or_vac_proj]['work_hours'])>0):
                        mins=(60*eachday['h'])+eachday['m']
                        if(mins!=0):
                            if(eachday['h']==24):
                                mins=mins-15
                            total_time_mis_or_vac = total_time_mis_or_vac + mins
                            format_time='{:02d}:{:02d}'.format(*divmod(mins,60))
                            date_object = datetime.strptime(format_time, "%H:%M")
                            # sheet2_data.append([each['staff_no'],each['emp_name'],each_mis_or_vac_proj,eh[0].manager.emp_name,format_time])
                if(total_time_mis_or_vac>0):
                    hrs_mis_or_vac,mins_mis_or_vac = divmod(total_time_mis_or_vac,60)
                    format_total_time_mis_or_vac = '{h:02d}:{m:02d}'.format(h=hrs_mis_or_vac,m=mins_mis_or_vac)
                    sheet2_data.append([each['staff_no'],each['emp_name'],each_mis_or_vac_proj,eh[0].manager.emp_name,format_total_time_mis_or_vac])
            
           

            for eachday in each['HOLIDAY']['work_hours']:
                if(eachday['date'] not in day_wise_dict):
                    if((self.sum_of_work_hours(each['HOLIDAY']['work_hours'])>0)):
                        day_wise_dict[eachday['date']]=(60*eachday['h'])+eachday['m']
                    else:
                        day_wise_dict[eachday['date']]=0
                else:
                    if((self.sum_of_work_hours(each['HOLIDAY']['work_hours'])>0)):
                        day_wise_dict[eachday['date']]+=(60*eachday['h'])+eachday['m']

            for k,v in day_wise_dict.items():
                if(datetime.strptime(k,"%Y-%m-%d").weekday()<=4 and v==0 and datetime.strptime(k,"%Y-%m-%d").date()<from_):
                    format_time='{:02d}:{:02d}'.format(*divmod(v,60))
                    date_object = datetime.strptime('00:00', "%H:%M")
                    data.append([k,each['staff_no'],each['emp_name'],"",eh[0].manager.emp_name,'00:00'])
        
        sorted_data = sorted(data[1:], key=lambda x: x[0])
        sorted_data.insert(0,data[0])
        basename=('')+name+"_TimeSheet_"+str(start_date)+"_"+str(last_date)+".xlsx"
        response=utils.contentTypesResponce('xl',basename)
        e=ExcelServices(response,in_memory=True,multisheetFlag=True)
        e.defineMultipleWorksheets(['Timesheet Report'],[sorted_data],reportFlag=True)
        del e
        return response
        ################################
    

class TimesheetDiscrepancyView(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        empid=str(auth_details['emp_id'])
        
        leave_req_id = kwargs["id"] if "id" in kwargs else None
        res = []
        if(leave_req_id == None):
            direct_emps=list(EmployeeHierarchy.objects.directemployees(manager_id=empid).values_list('emp_id',flat=True))
            ts_discrepancy = TimesheetDiscrepancy.objects.select_related('leave_request').filter(leave_request__emp_id__in = direct_emps,status=TimesheetDiscrpancyStatus.Pending.value).annotate(
                day_count = Sum(Case( When(leave_request__leave__day_leave_type='FULL', then=1.0),
                    When(leave_request__leave__day_leave_type='FIRST_HALF', then=0.5),
                    When(leave_request__leave__day_leave_type='SECOND_HALF', then=0.5),
                    default=0.0,output_field=FloatField(),)),
            )
            for each_ts_dis in ts_discrepancy:
                if(each_ts_dis.leave_request_id in [ x['leave_request_id'] for x in res]):
                    continue
                res.append({ 'emp_name': each_ts_dis.leave_request.emp.emp_name, 'emp_staff_no': each_ts_dis.leave_request.emp.staff_no, 'leave_request_id': each_ts_dis.leave_request_id, 'startdate': each_ts_dis.leave_request.startdate, 'enddate':each_ts_dis.leave_request.enddate,'leave_type': each_ts_dis.leave_request.leave_type_id,'day_count':each_ts_dis.day_count, 'leave_type_name': each_ts_dis.leave_request.leave_type.name, 'status':each_ts_dis.leave_request.status })
        else:
            discrepancy_details=TimesheetDiscrepancy.objects.filter(leave_request_id=leave_req_id)
            if(len(discrepancy_details)==0):
                return Response(utils.StyleRes(False,"timesheet discrepancy not found", "no discrepancy exists with id {}".format(leave_req_id)
        ),status=StatusCode.HTTP_NOT_FOUND)
            for each_discrepancy in discrepancy_details:
                hours,mins=utils.get_time_hms(timedelta(minutes=each_discrepancy.employee_project_time_tracker.work_minutes))
                modified_hours,modified_mins=utils.get_time_hms(timedelta(minutes=each_discrepancy.work_minutes))
                res.append({"project_name": each_discrepancy.employee_project_time_tracker.employee_project.project.name, "work_minutes": "{:02d}:{:02d}".format(hours,mins),"work_date": each_discrepancy.employee_project_time_tracker.work_date, "modified_work_minutes": "{:02d}:{:02d}".format(modified_hours,modified_mins) })
                            
        return Response(utils.StyleRes(True,"timesheet discrepancy", res),status=StatusCode.HTTP_OK)
    def put(self,request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        empid=str(auth_details['emp_id'])

        if "id" not in kwargs:
            return Response(utils.StyleRes(False,"timesheet discrepancy approval failed","request id is required"),status=StatusCode.HTTP_BAD_REQUEST)
        leave_req_id = kwargs["id"]

        # DefaultProjects.Vacation.value
        
        discrepancy_details=TimesheetDiscrepancy.objects.filter(leave_request_id=leave_req_id)
        
        

        # SubmittedTimeTrackerSerializer()
        if(len(discrepancy_details)==0):
            return Response(utils.StyleRes(False,"timesheet discrepancy approval", "no discrepancy exists with id {}".format(leave_req_id)
        ),status=StatusCode.HTTP_NOT_FOUND)

        # emp_for_request=LeaveRequest.objects.get(id=leave_req_id)
        # emp_vacation_project_id=EmployeeProject.objects.get(Q(project__name=DefaultProjects.Vacation.value)&Q(emp=emp_for_request.emp)).id

        # time_tracker_vacation_data = []
        for each_dis in discrepancy_details:
            ep_tt_data = EmployeeProjectTimeTracker.objects.filter(Q(id=each_dis.employee_project_time_tracker_id)&~Q(employee_project__project__name__in=[DefaultProjects.Vacation.value,DefaultProjects.Holiday.value,DefaultProjects.Mis.value,DefaultProjects.Holiday.value,DefaultProjects.General.value]))
            ep_tt_data.update(work_minutes=each_dis.work_minutes)
            # for each_ep_tt_data in ep_tt_data:
            #     time_tracker_vacation_data.append({'employee_project':emp_vacation_project_id,'work_minutes':480,'work_date':each_ep_tt_data.work_date,'work_week':each_ep_tt_data.work_week,'status':1})
        # time_tracker_vacation_serial_data=EmployeeProjectTimeTrackerSerializer(data=time_tracker_vacation_data,many=True)
        # if( time_tracker_vacation_serial_data.is_valid()):
        #     time_tracker_vacation_serial_data.save()

        discrepancy_details.update(status=TimesheetDiscrpancyStatus.Approved.value)
        # LeaveRequest.objects.filter(id=leave_req_id).update(status=LeaveRequestStatus.Approved.value)
        return Response(utils.StyleRes(True,"timesheet discrepancy approved", "approved request {}".format(leave_req_id)),status=StatusCode.HTTP_CREATED)

class GetSubmittedTimesheet(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        empid=str(auth_details['emp_id'])

        emp_id = self.request.query_params.get('emp_id',empid)
        start_date = request.query_params.get('start_date',None)
        end_date = request.query_params.get('end_date',None)
        start_date_second_half = request.query_params.get('start_date_second_half',None)
        end_date_first_half = request.query_params.get('end_date_first_half',None)
        # print(start_date_second_half,end_date_first_half)
        half_days = []
        if start_date_second_half != None and start_date_second_half.lower() == "true":
            # half_days.append(datetime.strptime(start_date,"%Y-%m-%d"))
            half_days.append(start_date)
        if end_date_first_half != None and end_date_first_half.lower() == "true":
            # half_days.append(datetime.strptime(end_date,"%Y-%m-%d"))
            half_days.append(end_date)
        # print(half_days)

        if(start_date == None or end_date==None):
            return Response(utils.StyleRes(False,"Get submitted timesheet", "start_date and end_date are required"
        ),status=StatusCode.HTTP_BAD_REQUEST)

        res = []
        
        # if(datetime(start_date)> datetime.now())
        # print("emp_id",emp_id,start_date,end_date)
        emp_work_approval_status = EmployeeWorkApproveStatus.objects.filter(emp_id=emp_id,work_week=datetime.strptime(start_date,"%Y-%m-%d").isocalendar()[1])
        # print("emp_work_approval_status",emp_work_approval_status)
        if(len(emp_work_approval_status)==0):
            return Response(utils.StyleRes(True,"Get submitted timesheet", res
        ),status=StatusCode.HTTP_OK)

        submitted_projs=EmployeeProjectTimeTracker.objects.filter(Q(employee_project__emp_id=emp_id)&Q(work_date__gte=start_date)&Q(work_date__lte=end_date)&Q(work_minutes__gt=0)&~Q(employee_project__project__name__in=[DefaultProjects.Vacation.value,DefaultProjects.Holiday.value,DefaultProjects.Mis.value,DefaultProjects.General.value])).annotate(project_name=F('employee_project__project__name'),project_priority=F('employee_project__priority')).order_by('work_date','-employee_project__priority')
        
        
        date_wise_project_hours = []
        each_date_project_data = []
        work_date = ''
        for each_proj in submitted_projs.values():
            if(work_date != each_proj["work_date"] ):
                work_date = each_proj["work_date"]
                if(work_date == ''):
                    continue
                date_wise_project_hours.append(each_date_project_data)
                each_date_project_data = []
            
            each_date_project_data.insert(0 if each_proj["project_priority"] != 0 else len(each_date_project_data),{"project_name": each_proj["project_name"],"priority":each_proj["project_priority"], "work_minutes": each_proj["work_minutes"],"work_date": each_proj["work_date"],"modified_work_minutes":0, "created": each_proj["created"], "updated": each_proj["updated"],"id": each_proj["id"]})

        if(len(each_date_project_data)>0):
            date_wise_project_hours.append(each_date_project_data)
            del each_date_project_data
        # print(date_wise_project_hours)

        
        for each_date_data in date_wise_project_hours:
            total_hours = 0

            for each_proj_data in each_date_data:
                # print("----------",str(each_proj_data["work_date"]), half_days)
                if( str(each_proj_data["work_date"]) in half_days):
        
                    if total_hours == 300:
                        each_proj_data["modified_work_minutes"] = 0
                        
                    else:
                        each_proj_data["modified_work_minutes"] = each_proj_data["work_minutes"] if (each_proj_data["work_minutes"] + total_hours) <=300 else 300-total_hours
                        total_hours = total_hours + each_proj_data["modified_work_minutes"]
                hours,mins=utils.get_time_hms(timedelta(minutes=each_proj_data["work_minutes"]))
                each_proj_data["work_minutes"]= "{:02d}:{:02d}".format(hours,mins)
                hours,mins=utils.get_time_hms(timedelta(minutes=each_proj_data["modified_work_minutes"]))
                each_proj_data["modified_work_minutes"]= "{:02d}:{:02d}".format(hours,mins)
                res.append(each_proj_data)

            # print("----qqqq---",each_date_data)






        # for each_proj in submitted_projs.values():
        #     hours,mins=utils.get_time_hms(timedelta(minutes=each_proj["work_minutes"]))
        #     res.append({"project_name": each_proj["project_name"], "work_minutes": "{:02d}:{:02d}".format(hours,mins),"work_date": each_proj["work_date"], "created": each_proj["created"], "updated": each_proj["updated"],"id": each_proj["id"]})
        
        return Response(utils.StyleRes(True,"Get submitted timesheet", res
        ),status=StatusCode.HTTP_OK)

class StatusWiseTimesheetCount(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        emp_id=auth_details['emp_id']
        prev_week = self.request.query_params.get('previousweek', 1)
        common_fun_obj=CommonFunctions()
        weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(prev_week)))
        week_number=weekdatesList[-1].isocalendar()[1]
        year=str(weekdatesList[-1]).split('-')[0]
        emp_of_manager=common_fun_obj.get_employees_list(emp_id)
        # years =  [year, str(int(year)+1)]
        employee_approve_status=EmployeeWorkApproveStatus.objects.filter(emp_id__in=emp_of_manager,work_year=year,work_week=week_number).aggregate(
            pending_cnt = Sum(Case(
                            When(status=0, then=1),
                            output_field=IntegerField(),
                            default=0
                        )),
            approved_cnt = Sum(Case(
                When(status=1,then=1),
                output_field=IntegerField(),
                default=0
            )),
            rejected_cnt = Sum(Case(
                When(status=2,then=1),
                output_field=IntegerField(),
                default=0
            )),
            entry_complaince_cnt = Sum(Case(
                When(status=3,then=1),
                output_field=IntegerField(),
                default=0
            )),
            approval_complaince_cnt_cnt = Sum(Case(
                When(status=4,then=1),
                output_field=IntegerField(),
                default=0
            ))
        )
        return Response(employee_approve_status)