from rest_framework.views import APIView
from rest_framework.response import Response

from vedikaweb.vedikaapi.models import Employee, EmployeeMaster,EmployeeProject,EmployeeProjectTimeTracker, EmployeeWorkApproveStatus, HolidayCalendar, ManagerEmailOpted, EmployeeHierarchy,Company , Category, GlobalAccessFlag, EmailAccessGroup, LeaveAccessGroup, PunchLogs


from vedikaweb.vedikaapi.serializers import EmailOptedSerializer, FaceAppLogsSerializer

from vedikaweb.vedikaapi.constants import StatusCode, DefaultProjects, WorkApprovalStatuses, MailConfigurations
from vedikaweb.vedikaapi.utils import utils
from django.conf import settings
from vedikaweb.vedikaapi.decorators import custom_exceptions,jwttokenvalidator, is_admin
from django.db.models import Q,F,Value as V

import traceback, json

from django.core.mail import send_mail
from django.template.loader import get_template
from datetime import datetime, timedelta
import logging
import time
from vedikaweb.vedikaapi.services.attendance_services import AttendenceService as attendance
import uuid

log = logging.getLogger(__name__)

attendance_ = attendance()


class CommonFunctions:
    def get_employees_weeklydata(self,employeeList,prev_week=0,statusFlag=False,approve_status=-1,TimeTrackerdataFlag=True):
        '''
            1.Function to get employee weekly time sheet for list of employees.
            2.By default it will give weekly time sheet of list of employees for the current week
            3.If we want previous week time sheets, then we need to call this function with prev_week=<number>
                Ex: prev_week=0 means currentweek, 1 means previous week, 2 means second previous week
        '''
        resp=[]
        weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(prev_week)))
        weeknumber=weekdatesList[-1].isocalendar()[1]
        year=str(weekdatesList[-1]).split('-')[0]
        # years = [year, str(int(year) + 1)] 
        emp_cnt=0
        holiday_list=list(HolidayCalendar.objects.prefetch_related('locationholidaycalendar_set').filter(Q(holiday_date__in=weekdatesList)&Q(status=1)).annotate(location=F('locationholidaycalendar__location'),location_status=F('locationholidaycalendar__status')).values())
        empObj = Employee.objects.prefetch_related('profile').filter(emp_id__in=employeeList)
        empObj_dict = {}
        for each in empObj:
            empObj_dict[each.emp_id]=each

        submitted_projs=EmployeeProjectTimeTracker.objects.findByEmplistAndWeekdateslistAndWeeknumberAndYear(employeeList,weekdatesList,weeknumber,year)
        submitted_projs_dict={}
        submitted_projs_list=list(map(lambda x:x['project_id'],submitted_projs))
        for eachemployee in employeeList:
            submitted_projs_dict[eachemployee]=[]
            for eachsub in submitted_projs:
                if(eachsub['emp_id']==eachemployee):
                    submitted_projs_dict[eachsub['emp_id']].append(eachsub['project_id'])
        empproj_obj=EmployeeProject.objects.findByEmplistAndWeekdateslistAndWeeknumber(employeeList,weekdatesList,weeknumber,submitted_projs_list)
        emp_proj_dict={}
        for eachemployee in employeeList:
            emp_proj_dict[eachemployee]=[]
            for each in empproj_obj:
                if(each.emp_id==eachemployee):
                    emp_proj_dict[eachemployee].append(each)
        emp_work_approvestatus_dict = {}
        emp_work_approvestatus_=EmployeeWorkApproveStatus.objects.findByEmplistAndWeekAndYear(employeeList,weeknumber,year)
        for eachemployee in employeeList:
            emp_work_approvestatus_dict[eachemployee]=[]
            for each in emp_work_approvestatus_:
                if(each.emp_id==eachemployee):
                    emp_work_approvestatus_dict[eachemployee].append(each) 
        fms_of_emps = EmployeeHierarchy.objects.filter(emp_id__in = employeeList,priority=3 ).values('emp_id','manager_id')
        emp_leave_access_flags = {}

        leave_access_enabled_fms = []
        leave_globally_enabled = GlobalAccessFlag.objects.filter(Q(access_type="LEAVE")&Q(status=1))
        if(len(leave_globally_enabled)>0):
            for each_emp in fms_of_emps:
                emp_leave_access_flags[each_emp['emp_id']] = True
        else:
            leave_access_enabled_fms=LeaveAccessGroup.objects.filter(status=1).values_list('emp_id',flat=True)
            leave_individ_access_list = LeaveAccessGroup.objects.filter(status=2).values_list('emp_id',flat=True)
            for each_emp in fms_of_emps:
                emp_leave_access_flags[each_emp['emp_id']] = True if each_emp['manager_id'] in leave_access_enabled_fms else False
            for each_emp in leave_individ_access_list:
                emp_leave_access_flags[each_emp]=True

        for i,eachemployee in enumerate(employeeList):
            emp_id=eachemployee
            empObj=empObj_dict[emp_id]
            #empObj=Employee.objects.prefetch_related('profile').get(emp_id=emp_id)
            location_id = empObj.profile.filter().first().location.id if empObj.profile.filter().first()!= None else None
            #TODO
            #CASE1: If MIS is uploaded and active projects changed between weeks and WTS is rejected--Inthis case we might get issue here we might get this week active projects not the lastweek.--Answer.We might look into WTS table for last week projects timesheets and get the project id's.
            #CASE2: For the above case1, what happend if the projects timesheets are not submitted.
            #1. Query to get EmployeeProject data
            #empproj_obj=EmployeeProject.objects.select_related('project').order_by('priority').filter(Q(emp__emp_id=emp_id) & Q(project__status=1) & Q(status=1))

            # submitted_projs=EmployeeProjectTimeTracker.objects.get_submitted_projects(emp_id=emp_id,work_week=weeknumber,year=year).filter(sum_output_count__gt=0)
            # submitted_projs_list=list(map(lambda x:x['project_id'],submitted_projs))
            submitted_projs_list = submitted_projs_dict[emp_id]
            # empproj_obj=EmployeeProject.objects.select_related('project').order_by('priority').filter(Q(emp__emp_id=emp_id) & (Q(status=1) | Q(project_id__in=submitted_projs_list)))
            enableSaveSubmit=True
            wsr_data=map(lambda eachobj:eachobj.wsr_count,emp_proj_dict[emp_id])
            # print(list(wsr_data),"********************",emp_proj_dict[emp_id], len(employeeList),i)
            # wsr_data=map(lambda eachobj:len(list(eachobj.employeeweeklystatustracker_set.filter(wsr_date__in=weekdatesList,wsr_week=weeknumber))),empproj_obj)
            is_wsr_present=any(ele > 0 for ele in list(wsr_data))
            # emp_work_approvestatus=EmployeeWorkApproveStatus.objects.filter(emp_id=emp_id,work_week=weeknumber,created__year=year)
            emp_work_approvestatus=emp_work_approvestatus_dict[emp_id]

            ## If WSR exists and it is not rejected, then disbale save&submit.
            if(is_wsr_present):
                if(len(emp_work_approvestatus)>0):
                    if(emp_work_approvestatus[0].status!=WorkApprovalStatuses.Rejected):
                        enableSaveSubmit=False

            resp.append({'emp_id':emp_id,'emp_name':empObj.emp_name,'staff_no':empObj.staff_no,'week_number':weekdatesList[-1].isocalendar()[1],'year':year,'days':weekdatesList,'enableSaveSubmit':enableSaveSubmit,'active_projects':[]})

            ##Sending Status and comments if url has the status filter
            if(statusFlag):
                if(len(emp_work_approvestatus)>0):
                    resp[emp_cnt]['status']=emp_work_approvestatus[0].status
                    resp[emp_cnt]['comments']=emp_work_approvestatus[0].comments

            emp_proj_timetracks=[]
            emp_projs=[]
            #2. Loop to get projects and to make List for Timetracking for the week
            for eachobj in emp_proj_dict[emp_id]:
                # cumulative_obj=list(eachobj.employeeprojecttimetracker_set.filter(work_week__lt=weeknumber).values('employee_project').annotate(sum_output_count=Sum('work_minutes')))
                # if(len(cumulative_obj)>0):
                #     cumulative_time['h'],cumulative_time['m']=utils.get_time_hms(timedelta(minutes=cumulative_obj[0]['sum_output_count']))
                cumulative_mins=eachobj.total_work_minutes
                cumulative_time={'h':0,'m':0}
                if(cumulative_mins>0):
                    cumulative_time['h'],cumulative_time['m']=utils.get_time_hms(timedelta(minutes=cumulative_mins))
                emp_projs.append({'project_name':eachobj.project.name,'project_id':eachobj.project.id,'priority':eachobj.priority,'cumulative':cumulative_time})
                q=eachobj.all_project_time_tracker
                #emp_proj_timetracklist=list(eachobj.employeeprojecttimetracker_set.filter(work_date__in=weekdatesList))
                emp_proj_timetracklist=list(q)
                if(len(emp_proj_timetracklist)>0):
                    emp_proj_timetracks=emp_proj_timetracks+emp_proj_timetracklist

            #3. Loop to get working time for each day
            default_projs=DefaultProjects.list()
            default_proj_without_Init=DefaultProjects.default_without_Init()

            i=-1
            ##For each Active Project
            for eachproj in emp_projs:
                visiblityFlag=False
                proj_name=eachproj['project_name']
                is_vac_hol=lambda x:True if x==DefaultProjects.Vacation.value or x==DefaultProjects.Holiday.value else False
                is_hol = lambda x:True if x==DefaultProjects.Holiday.value else False
                is_vac_mis_hol=lambda  x:True if x==DefaultProjects.Vacation.value or x==DefaultProjects.Mis.value or x==DefaultProjects.Holiday.value else False
                is_general=lambda  x:True if x==DefaultProjects.General.value else False
                
                if(is_vac_mis_hol(proj_name)):
                    resp[emp_cnt][proj_name]={'work_hours':[]}
                
                if(proj_name not in default_proj_without_Init):
                    # wsr_data=map(lambda eachobj:len(list(eachobj.employeeweeklystatustracker_set.filter(wsr_date__in=weekdatesList))),empproj_obj)
                    resp[emp_cnt]['active_projects'].append({**eachproj,**{'work_hours':[]}})
                    i=i+1

                if(not is_general(proj_name)):
                    notFound=True
                    #For each weekday within the particular week
                    for eachday in weekdatesList:
                        editEnable=True
                        if(eachday>datetime.now().date() and not is_vac_hol(proj_name)): editEnable=False
                        if(is_vac_hol(proj_name) and emp_leave_access_flags[emp_id]): editEnable=False
                        if(is_hol(proj_name) and emp_leave_access_flags[emp_id]): editEnable = False

                        #For each project updated in the timetracker of the week
                        for eachrec in emp_proj_timetracks:
                            if(eachproj['project_id']==eachrec.employee_project.project.id and eachday==eachrec.work_date):
                                hours,mins=utils.get_time_hms(timedelta(minutes=eachrec.work_minutes))


                                if(not is_vac_mis_hol(proj_name)):
                                    resp[emp_cnt]['active_projects'][i]['work_hours'].append({'date':str(eachday),'h':int(hours),'m':int(mins),'enable':editEnable})
                                    # if(int(hours)>0 or int(mins)>0):
                                    #     visiblityFlag=True
                                    # resp[emp_cnt]['active_projects'][i]['visibilityFlag']=visiblityFlag
                                else:
                                    resp[emp_cnt][proj_name]['work_hours'].append({'date':str(eachday),'h':int(hours),'m':int(mins),'enable':editEnable})
                                notFound=False
                                break
                            else:
                                notFound=True
                        if(notFound):
                            if(not is_vac_mis_hol(proj_name)):
                                
                                resp[emp_cnt]['active_projects'][i]['work_hours'].append({'date':str(eachday),'h':0,'m':0,'enable':editEnable})
                                if(resp[emp_cnt]['active_projects'][i]['priority']==1):
                                    visiblityFlag=True
                                # resp[emp_cnt]['active_projects'][i]['visibilityFlag']=visiblityFlag
                            else:
                                ## setting holiday  hours
                                
                                # print("---------",eachday,location_id,holiday_list)
                                hl = list(filter(lambda x:x['holiday_date']==eachday and x['location']==location_id and x['location_status'] == 1,holiday_list))
                                # print("holiday_list",hl)
                                # hl =  HolidayCalendar.objects.prefetch_related('locationholidaycalendar_set').filter(Q(holiday_date=eachday)&Q(status=1)&Q(locationholidaycalendar__location=location_id))
                                # if(len(hl)>0):
                                #     loc_list = [l.loc_id for l in hl[0].locationholidaycalendar_set.filter(Q(status=1)).annotate(loc_id=F('location_id'),loc_name=F('location__name'))]
                                # else:
                                #     loc_list = []
                                # print("hl",hl)
                                if(is_hol(proj_name) and len(hl)>0 and emp_leave_access_flags[emp_id]): 
                                    # print("----",{'date':str(eachday),'h':8,'m':0,'enable':editEnable})
                                    resp[emp_cnt][proj_name]['work_hours'].append({'date':str(eachday),'h':8,'m':0,'enable':editEnable})
                                else:
                                    resp[emp_cnt][proj_name]['work_hours'].append({'date':str(eachday),'h':0,'m':0,'enable':editEnable})
                    ##ASSIGNING VISIBILITY FLAG BASED ON WORK HOURS##
                    active_cnt=0
                    for each in resp[emp_cnt]['active_projects']:
                        totalhours=0
                        totalminutes=0
                        for eachday in each['work_hours']:
                            totalhours=totalhours+int(eachday['h'])
                            totalminutes=totalminutes+int(eachday['m'])
                        sumhours=totalhours+totalminutes
                        if(sumhours==0 and each['priority']!=1):
                            resp[emp_cnt]['active_projects'][active_cnt]['visibilityFlag']=False
                        else:
                            resp[emp_cnt]['active_projects'][active_cnt]['visibilityFlag']=True
                        active_cnt=active_cnt+1
            if(TimeTrackerdataFlag):
                resp[emp_cnt]['gross_working_hours']=[]
                resp[emp_cnt]['net_working_hours']=[]
                attendance_data,attendance_flag,present_dates_list = attendance_.get_tt_final_datastructure(emp_id,weekdatesList[0],weekdatesList[-1])
                resp[emp_cnt]['attendance_flag']=attendance_flag
                for eachitem in weekdatesList:
                    matchflag=False
                    for eachone in attendance_data:
                        if(str(eachitem)==eachone['Date'] and (str(eachone['Date']) in present_dates_list)):
                            resp[emp_cnt]['gross_working_hours'].append({'date':str(eachitem),'h':int(eachone['GrossWorkingHours'].split(':')[0]),'m':int(eachone['GrossWorkingHours'].split(':')[1])})
                            resp[emp_cnt]['net_working_hours'].append({'date':str(eachitem),'h':int(eachone['NetWorkingHours'].split(':')[0]),'m':int(eachone['NetWorkingHours'].split(':')[1])})
                            matchflag = True
                            break
                    if(not matchflag):
                        resp[emp_cnt]['gross_working_hours'].append({'date':str(eachitem),'h':0,'m':0})
                        resp[emp_cnt]['net_working_hours'].append({'date':str(eachitem),'h':0,'m':0})
            emp_cnt=emp_cnt+1
        return resp

    # CODE OPT -- Need more overview on this
    def get_employees_daterangedata(self,employeeList,start_date,last_date,statusFlag=False):
        '''
            1.Function to get employee weekly time sheet for list of employees.
            2.By default it will give weekly time sheet of list of employees for the date range
        '''
        resp=[]
        # weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(prev_week)))
        # weeknumber=weekdatesList[-1].isocalendar()[1]
        # year=str(weekdatesList[-1]).split('-')[0]
        emp_cnt=0
        # holiday_list=list(HolidayCalendar.objects.prefetch_related('locationholidaycalendar_set').filter(Q(holiday_date__in=weekdatesList)&Q(status=1)).annotate(location=F('locationholidaycalendar__location')).values())
        # print(holiday_list)
        for eachemployee in employeeList:
            emp_id=eachemployee
            empObj=Employee.objects.prefetch_related('profile').get(emp_id=emp_id)
            # location_id = empObj.profile.filter().first().location.id if empObj.profile.filter().first()!= None else None
            location_id =1
            #TODO
            #CASE1: If MIS is uploaded and active projects changed between weeks and WTS is rejected--Inthis case we might get issue here we might get this week active projects not the lastweek.--Answer.We might look into WTS table for last week projects timesheets and get the project id's.
            #CASE2: For the above case1, what happend if the projects timesheets are not submitted.
            #1. Query to get EmployeeProject data
            #empproj_obj=EmployeeProject.objects.select_related('project').order_by('priority').filter(Q(emp__emp_id=emp_id) & Q(project__status=1) & Q(status=1))

            submitted_projs=EmployeeProjectTimeTracker.objects.get_submitted_projects_daterange(emp_id=emp_id, start_date=start_date,last_date=last_date).filter(sum_output_count__gt=0)
            submitted_projs_list=list(map(lambda x:x['project_id'],submitted_projs))
            empproj_obj=EmployeeProject.objects.select_related('project').order_by('priority').filter(Q(emp__emp_id=emp_id) & (Q(status=1) | Q(project_id__in=submitted_projs_list)))
            # print(empproj_obj)
            # enableSaveSubmit=True
            # wsr_data=map(lambda eachobj:len(list(eachobj.employeeweeklystatustracker_set.filter(wsr_date__in=weekdatesList,wsr_week=weeknumber))),empproj_obj)
            # is_wsr_present=any(ele > 0 for ele in list(wsr_data))
            # emp_work_approvestatus=EmployeeWorkApproveStatus.objects.filter(emp_id=emp_id)

            ## If WSR exists and it is not rejected, then disbale save&submit.
            # if(is_wsr_present):
            #     if(len(emp_work_approvestatus)>0):
            #         if(emp_work_approvestatus[0].status!=WorkApprovalStatuses.Rejected):
            #             enableSaveSubmit=False

            resp.append({'emp_id':emp_id,'emp_name':empObj.emp_name,'staff_no':empObj.staff_no,'active_projects':[]})

            ##Sending Status and comments if url has the status filter
            # if(statusFlag):
            #     if(len(emp_work_approvestatus)>0):
            #         resp[emp_cnt]['status']=emp_work_approvestatus[0].status
            #         resp[emp_cnt]['comments']=emp_work_approvestatus[0].comments

            emp_proj_timetracks=[]
            emp_projs=[]

            #2. Loop to get projects and to make List for Timetracking for the week
            for eachobj in empproj_obj:
                # print(eachobj)
                cumulative_mins=eachobj.total_work_minutes
                cumulative_time={'h':0,'m':0}
                if(cumulative_mins>0):
                    cumulative_time['h'],cumulative_time['m']=utils.get_time_hms(timedelta(minutes=cumulative_mins))
                emp_projs.append({'project_name':eachobj.project.name,'project_id':eachobj.project.id,'priority':eachobj.priority,'cumulative':cumulative_time})
                emp_proj_timetracklist=list(eachobj.employeeprojecttimetracker_set.filter(Q(work_date__gte = start_date) & Q(work_date__lte = last_date)))
                if(len(emp_proj_timetracklist)>0):
                    emp_proj_timetracks=emp_proj_timetracks+emp_proj_timetracklist

                #3. Loop to get working time for each day
                default_projs=DefaultProjects.list()
                default_proj_without_Init=DefaultProjects.default_without_Init()

                i=-1
                ##For each Active Project
                for eachproj in emp_projs:
                    visiblityFlag=False
                    proj_name=eachproj['project_name']
                    is_vac_hol=lambda x:True if x==DefaultProjects.Vacation.value or x==DefaultProjects.Holiday.value else False
                    is_hol = lambda x:True if x==DefaultProjects.Holiday.value else False
                    is_vac_mis_hol=lambda  x:True if x==DefaultProjects.Vacation.value or x==DefaultProjects.Mis.value or x==DefaultProjects.Holiday.value else False
                    is_general=lambda  x:True if x==DefaultProjects.General.value else False
                if(is_vac_mis_hol(proj_name)):
                    resp[emp_cnt][proj_name]={'work_hours':[]}

                if(proj_name not in default_proj_without_Init):
                    # wsr_data=map(lambda eachobj:len(list(eachobj.employeeweeklystatustracker_set.filter(wsr_date__in=weekdatesList))),empproj_obj)
                    resp[emp_cnt]['active_projects'].append({**eachproj,**{'work_hours':[]}})
                    i=i+1

                if(not is_general(proj_name)):
                    notFound=True
                    #For each weekday within the particular week
                    weekdatesList = utils.get_dates_between_twodates(startdate=start_date,lastdate=last_date)
                    # print(weekdatesList,'weekdatesList')
                    for eachday in weekdatesList:
                        eachdate=eachday.date()
                        # editEnable=True
                        # if(eachday>datetime.now().date()): editEnable=False
                        # if(is_vac_hol(proj_name)): editEnable=False
                        # if(is_hol(proj_name)): editEnable = False

                        #For each project updated in the timetracker of the week
                        for eachrec in emp_proj_timetracks:
                            if(eachproj['project_id']==eachrec.employee_project.project.id and eachdate==eachrec.work_date):
                                hours,mins=utils.get_time_hms(timedelta(minutes=eachrec.work_minutes))
                                if(not is_vac_mis_hol(proj_name)):
                                    resp[emp_cnt]['active_projects'][i]['work_hours'].append({'date':str(eachdate),'h':int(hours),'m':int(mins)})
                                    # if(int(hours)>0 or int(mins)>0):
                                    #     visiblityFlag=True
                                    # resp[emp_cnt]['active_projects'][i]['visibilityFlag']=visiblityFlag
                                else:
                                    resp[emp_cnt][proj_name]['work_hours'].append({'date':str(eachdate),'h':int(hours),'m':int(mins)})
                                notFound=False
                                break
                            else:
                                notFound=True
                        if(notFound):
                            if(not is_vac_mis_hol(proj_name)):
                                
                                resp[emp_cnt]['active_projects'][i]['work_hours'].append({'date':str(eachdate),'h':0,'m':0})
                                if(resp[emp_cnt]['active_projects'][i]['priority']==1):
                                    visiblityFlag=True
                                # resp[emp_cnt]['active_projects'][i]['visibilityFlag']=visiblityFlag
                            else:
                                pass
                                ## setting holiday  hours
                                
                                # print("---------",eachdate,location_id)
                                # hl = list(filter(lambda x:x['holiday_date']==eachday and x['location']==location_id))
                                # print("holiday_list",hl)
                                # hl =  HolidayCalendar.objects.prefetch_related('locationholidaycalendar_set').filter(Q(holiday_date=eachday)&Q(status=1)&Q(locationholidaycalendar__location=location_id))
                                # if(len(hl)>0):
                                #     loc_list = [l.loc_id for l in hl[0].locationholidaycalendar_set.filter(Q(status=1)).annotate(loc_id=F('location_id'),loc_name=F('location__name'))]
                                # else:
                                #     loc_list = []
                                # print("hl",hl)
                                # if(is_hol(proj_name) and len(hl)>0): 
                                #     print("----",{'date':str(eachday),'h':8,'m':0})
                                #     resp[emp_cnt][proj_name]['work_hours'].append({'date':str(eachday),'h':8,'m':0})
                                # else:
                                #     resp[emp_cnt][proj_name]['work_hours'].append({'date':str(eachday),'h':0,'m':0})
                    ##ASSIGNING VISIBILITY FLAG BASED ON WORK HOURS##
                    active_cnt=0
                    # print(resp)
                    for each in resp[emp_cnt]['active_projects']:
                        totalhours=0
                        totalminutes=0
                        for eachday in each['work_hours']:
                            totalhours=totalhours+int(eachday['h'])
                            totalminutes=totalminutes+int(eachday['m'])
                        sumhours=totalhours+totalminutes
                        if(sumhours==0 and each['priority']!=1):
                            resp[emp_cnt]['active_projects'][active_cnt]['visibilityFlag']=False
                        else:
                            resp[emp_cnt]['active_projects'][active_cnt]['visibilityFlag']=True
                        active_cnt=active_cnt+1
            # resp[emp_cnt]['gross_working_hours']=[]
            # resp[emp_cnt]['net_working_hours']=[]
            # attendance_data,attendance_flag,present_dates_list = attendance_.get_tt_final_datastructure(emp_id,weekdatesList[0],weekdatesList[-1])
            # resp[emp_cnt]['attendance_flag']=attendance_flag
            # for eachitem in weekdatesList:
            #     matchflag=False
            #     for eachone in attendance_data:
            #         if(str(eachitem)==eachone['Date'] and (str(eachone['Date']) in present_dates_list)):
            #             resp[emp_cnt]['gross_working_hours'].append({'date':str(eachitem),'h':int(eachone['GrossWorkingHours'].split(':')[0]),'m':int(eachone['GrossWorkingHours'].split(':')[1])})
            #             resp[emp_cnt]['net_working_hours'].append({'date':str(eachitem),'h':int(eachone['NetWorkingHours'].split(':')[0]),'m':int(eachone['NetWorkingHours'].split(':')[1])})
            #             matchflag = True
            #             break
            #     if(not matchflag):
            #         resp[emp_cnt]['gross_working_hours'].append({'date':str(eachitem),'h':0,'m':0})
            #         resp[emp_cnt]['net_working_hours'].append({'date':str(eachitem),'h':0,'m':0})
            emp_cnt=emp_cnt+1
        return resp

    # CODE OPT -- Need more overview on this
    def get_weekly_statuses(self,employeeList,prev_week=0,statusFlag=False):
        '''
            1.Function to get weekly status of list of employees.
            2.By default it will give weekly status of list of employees for the current week
            3.If we want previous week status, then we need to call this function with prev_week=<number>
                Ex: prev_week=0 means currentweek, 1 means previous week, 2 means second previous week
        '''
        resp=[]
        #1. Toget List of week dates -- saturday to friday
        weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(prev_week)))
        weeknumber=weekdatesList[-1].isocalendar()[1]
        year=str(weekdatesList[-1]).split('-')[0]
        # years = [year, str(int(year)+1)]
        emp_cnt=0
        for emp_id in employeeList:
            resp.append([])
            empObj=Employee.objects.get(emp_id=emp_id)
            #2. Query to get EmployeeProject data
            # empproj_obj=EmployeeProject.objects.select_related('project').order_by('priority').filter(Q(emp__emp_id=emp_id) & Q(project__status=1) & Q(status=1))
            submitted_projs=EmployeeProjectTimeTracker.objects.get_submitted_projects(emp_id=emp_id,work_week=weeknumber,year=year).filter(sum_output_count__gt=0)
            submitted_projs_list=list(map(lambda x:x['project_id'],submitted_projs))
            empproj_obj=EmployeeProject.objects.select_related('project').order_by('priority').filter(Q(emp__emp_id=emp_id) & (Q(status=1) | Q(project_id__in=submitted_projs_list)))
            resp[emp_cnt]={'emp_id':emp_id,'staff_no':empObj.staff_no,'emp_name':empObj.emp_name,'week_number':weekdatesList[-1].isocalendar()[1],'active_projects':[]}


            if(statusFlag):
                emp_work_approvestatus=EmployeeWorkApproveStatus.objects.filter(emp_id=emp_id,work_week=weeknumber,work_year=year)
                if(len(emp_work_approvestatus)>0):
                    resp[emp_cnt]['status']=emp_work_approvestatus[0].status

            emp_proj_wstatus_tracks=[]
            emp_projs=[]
            emp_proj_timetracks=[]

            #3. Preparing Related WSR and WST Lists
            for eachobj in empproj_obj:
                emp_projs.append({'project_name':eachobj.project.name,'project_id':eachobj.project.id,'priority':eachobj.priority})
                emp_wstatus_tracklist=list(eachobj.employeeweeklystatustracker_set.filter(wsr_date__in=weekdatesList))
                emp_proj_timetracklist=list(eachobj.employeeprojecttimetracker_set.filter(work_date__in=weekdatesList))
                if(len(emp_wstatus_tracklist)>0):
                    emp_proj_wstatus_tracks.append(emp_wstatus_tracklist[0])
                if(len(emp_proj_timetracklist)>0):
                    emp_proj_timetracks=emp_proj_timetracks+emp_proj_timetracklist

            #4. Getting all related project ids from time tracker sheet data
            project_list_with_timesheet=map(lambda x:x.employee_project.project.id,emp_proj_timetracks)

            project_list_with_wsr=map(lambda x:x.employee_project.project.id,emp_proj_wstatus_tracks)
            #5. Removing Duplicates from the Timetracker list
            projects_with_timesheet=list(dict.fromkeys(list(project_list_with_timesheet)))
            projects_with_wsr=list(dict.fromkeys(list(project_list_with_wsr)))
            default_projs=DefaultProjects.list()
            default_proj_without_Init=DefaultProjects.default_without_Init()


            #6. Loop to get weekly status of employee
            i=-1
            for eachproj in emp_projs:
                visiblityFlag=False
                proj_name=eachproj['project_name']
                proj_id=eachproj['project_id']
                is_general=lambda x:True if x==DefaultProjects.General.value else False
                is_vac_mis_hol=lambda  x:True if x==DefaultProjects.Vacation.value or x==DefaultProjects.Mis.value or x==DefaultProjects.Holiday.value else False
                #7. Defining General project Datastructue
                if(is_general(proj_name)):
                    resp[emp_cnt][proj_name]={**eachproj,**{'work_report':'','visibilityFlag':True}}

                #8. Defining Active projects datastructure
                if(proj_name not in default_proj_without_Init):
                    if(eachproj['priority']==1):
                        visiblityFlag=True
                    if(proj_id in projects_with_timesheet or proj_id in projects_with_wsr):
                        visiblityFlag=True
                        ## Gettingwork minutes for matched project with in the given week
                        times_list_in_timesheet=map(lambda x: x.work_minutes if x.employee_project.project.id==proj_id and x.work_week==weeknumber else 0,emp_proj_timetracks)
                        ## If it has zero workminutes  and it is not p1 project and wsr report not submitted for that project,then making visibilityflag as False
                        if(not any(ele!=0 for ele in list(times_list_in_timesheet)) and eachproj['priority']!=1 and proj_id not in projects_with_wsr):
                            visiblityFlag=False


                    resp[emp_cnt]['active_projects'].append({**eachproj,**{'work_report':'','visibilityFlag':visiblityFlag}})
                    i=i+1
                #9. Getting WSR from database if projects are general or active
                if(not is_vac_mis_hol(proj_name)):
                    for eachrec in emp_proj_wstatus_tracks:
                        proj=eachrec.employee_project.project
                        if(eachproj['project_id']==proj.id):
                            if(not is_general(proj_name)):
                                resp[emp_cnt]['active_projects'][i]['work_report']=eachrec.work_report
                            else:
                                resp[emp_cnt][proj_name]['work_report']=eachrec.work_report
            emp_cnt=emp_cnt+1
        return resp

    def get_post_request_for_timesheet(self,emp_id,serialized_data,prev_week=0):
        weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(prev_week)))
        week_number=weekdatesList[-1].isocalendar()[1]
        year=str(weekdatesList[-1]).split('-')[0]
        data=json.loads(json.dumps(serialized_data))
        inputdata=[]
        for each in data:
            ##Loop Through ACTIVE PROJECTS##
            for eachproj in each['active_projects']:
                empproj=EmployeeProject.objects.get(project_id=eachproj['project_id'],emp_id=emp_id,status=1)
                for eachday in eachproj['work_hours']:
                    eachdate=datetime.strptime(eachday['date'], "%Y-%m-%d").date()
                    if(eachdate in weekdatesList and eachdate<=datetime.now().date()):
                        inputdata.append({'work_date':eachdate,'work_week':week_number,'work_year':year,'work_minutes':60*int(eachday['h'])+int(eachday['m']),
                                'employee_project':empproj.id,'status':1})


            ##Loop Through VACTION PROJECT##
            for eachday in each[DefaultProjects.Vacation.value]['work_hours']:
                eachdate=datetime.strptime(eachday['date'], "%Y-%m-%d").date()
                empproj=EmployeeProject.objects.get(project__name=DefaultProjects.Vacation.value,emp_id=emp_id,status=1)
                inputdata.append({'work_date':eachdate,'work_week':week_number,'work_year':year,'work_minutes':60*int(eachday['h'])+int(eachday['m']),
                                'employee_project':empproj.id,'status':1})
            ##Loop Through MISCELLANEOUS PROJECT##
            for eachday in each[DefaultProjects.Mis.value]['work_hours']:
                eachdate=datetime.strptime(eachday['date'], "%Y-%m-%d").date()
                empproj=EmployeeProject.objects.get(project__name=DefaultProjects.Mis.value,emp_id=emp_id,status=1)
                if(eachdate in weekdatesList and eachdate<=datetime.now().date()):
                    inputdata.append({'work_date':eachdate,'work_week':week_number,'work_year':year,'work_minutes':60*int(eachday['h'])+int(eachday['m']),
                                    'employee_project':empproj.id,'status':1})
        return inputdata


    def get_post_req_for_wsr(self,emp_id,serialized_data,prev_week=1):
        data=json.loads(json.dumps(serialized_data))
        inputdata=[]
        weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(prev_week)))
        year=str(weekdatesList[-1]).split('-')[0]
        week_number=weekdatesList[-1].isocalendar()[1]
        for each in data['weekly_status']:
            empproj=EmployeeProject.objects.get(project_id=each['project_id'],emp_id=emp_id,status=1)
            inputdata.append({'wsr_date':data['wsr_date'],'wsr_year':int(year),'wsr_week':week_number,'work_report':each['report'],
                    'employee_project':empproj.id,'status':1})
        return inputdata

    def get_employees_list(self,managerid,priority=1,priorityCheck=True):
        if(priorityCheck):
            emp_hirarchy_obj=EmployeeHierarchy.objects.select_related('emp').filter(manager_id=managerid,priority=priority,emp__status=1)
        else:
            emp_hirarchy_obj=EmployeeHierarchy.objects.select_related('emp').filter(manager_id=managerid,emp__status=1)
        emp_list_obj=map(lambda x:x.emp.emp_id,emp_hirarchy_obj)
        res=[]
        [res.append(x) for x in list(emp_list_obj) if x not in res]
        return res




class CompanyView(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        company_list = list(Company.objects.filter(status=1).values())
        return Response(utils.StyleRes(True,"Company list",company_list),status=StatusCode.HTTP_OK)



class CategoryView(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request, *args, **kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        employee_type = list(Category.objects.values())
        return Response(utils.StyleRes(True,"Employee Types",employee_type),status=StatusCode.HTTP_OK)




class DataAvailability(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        from_,to_,last_ = utils.dataUnavailabledates()
        msg = {'msg':'Data will not be available from {} to {}'.format(from_,to_)}
        res ={'msg':msg,'availbledate':last_}
        return Response(res)


class MailOptedStatus(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self, request): 
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        emp_id=str(auth_details['emp_id'])
        emailOpted = ManagerEmailOpted.objects.filter(emp_id = emp_id, status=1)
        
        optedDetails ={}
        optedDetails['email-opted'] = 'False'
        if(len(emailOpted)>0):
            optedDetails['email-opted'] = 'True'
        return Response(utils.StyleRes(True,'Email Opted Status',optedDetails), status=StatusCode.HTTP_OK)
    
    @jwttokenvalidator
    @custom_exceptions
    def post(self, request):
        try: 
            auth_details = utils.validateJWTToken(request)
            if(auth_details['email']==""):
                return Response(auth_details, status=400)
            emp_id=str(auth_details['emp_id'])
            email = str(auth_details['email'])
            serialized = EmailOptedSerializer(data=request.data)
            if(serialized.is_valid()):
                try:
                    status = serialized.data['status']
                    obj, created = ManagerEmailOpted.objects.update_or_create(
                    emp_id=emp_id, defaults={'status': status},)
                except Exception as e:
                    log.error(traceback.format_exc())
                    log.error("Fail to update the email opted status for the user {}".format(email))
                    return Response(utils.StyleRes(False,'Fail to update the email opted status',{}), status=StatusCode.HTTP_UNAUTHORIZED)
                
                optedDetails ={}
                optedDetails['email-opted'] = bool(status)
                msg = 'Email disabled successfully'
                if(bool(status)):
                    msg = 'Email enabled successfully'
                return Response(utils.StyleRes(True,msg,optedDetails), status=StatusCode.HTTP_OK)
            else:
                return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['invalid_inputs'], serialized._errors), status=StatusCode.HTTP_EXPECTATION_FAILED)
        except Exception as e:
            log.error(traceback.format_exc())
            return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['something_went_wrong'],{}), status=StatusCode.HTTP_UNPROCESSABLE_ENTITY)

class SendWelcomeEmails(APIView):
    def get(self,request):
        mails_list = ['suman@atai.ai']
        
        for eachemp in mails_list:
            fun_owner="Bulli Kishor Arumilli"
            emp_list = list(Employee.objects.filter(email = eachemp).values())
            exp_time = int((datetime.now() + timedelta(hours=settings.FORGOT_PASSWORD_EXP_TIME)).timestamp())
            userDetails =  {}
            userDetails['email'] = eachemp
            userDetails['type'] = 'forgotpassword'
            userDetails['datetime'] = exp_time
            conf_token = utils.encrypt(json.dumps(userDetails))
            log.info(eachemp+" Welcome Email token: "+conf_token)
            ctx={
                "token_url":settings.UI_URL+"reset-password/?token="+conf_token,
                "name":emp_list[-1]['emp_name'],
                "email":emp_list[-1]['email'],
                "UI_URL":settings.UI_URL
            }
            template = get_template('welcome.html')
            mail_content = template.render(ctx)

            check_status = 0

            global_email_access = GlobalAccessFlag.objects.filter(status=1,access_type__iexact='EMAIL')
            individual_email_access_emps=[]
            if(len(global_email_access)>0):
                accessed_managers = list(map(lambda x:utils.strip_value(x.emp_name),Employee.objects.filter(role_id=4,status=1)))
            else:
                accessed_managers = list(map(lambda x:utils.strip_value(x.emp.emp_name),EmailAccessGroup.objects.filter(status=1)))
                individual_email_access_emps = list(map(lambda x:x.emp.emp_id,EmailAccessGroup.objects.filter(status=2)))
            

            if (fun_owner !=0) and (fun_owner != None) and (fun_owner != '#N/A'):
                if((utils.strip_value(fun_owner) in accessed_managers) or (utils.strip_value(fun_owner) in individual_email_access_emps)):
                    ret_val = 0
                    try:
                        if(settings.SENDEMAILTOALL):
                            check_status = send_mail(MailConfigurations.Welcome.value, mail_content, settings.EMAIL_FROM, [eachemp], html_message=mail_content)
                            log.info("MAIL SENT TO {}".format([eachemp]))
                            log.info("Welcome EMAIL NOTIFICATION DATA SENT TO {} SUCCESSFULLY".format(eachemp))
                            
                        else:
                            if(eachemp in settings.CUSTOM_EMAILS):
                                check_status = send_mail(MailConfigurations.Welcome.value, mail_content, settings.EMAIL_FROM, [eachemp], html_message=mail_content)
                                log.info("MAIL SENT TO {}".format([eachemp]))
                    except Exception as e:
                        log.error(traceback.format_exc())
                else:
                    log.error("WELCOME EMAIL NOT SENT TO {} BECAUSE CORRESPONDING MANAGER SHOULD NOT HAVE EMAIL ACCESS TO SEND".format(eachemp))
        return Response({})

class MajorAdmins(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        email = str(auth_details['email'])
        if(email in settings.ADMINS_TO_ACCESS_REPORTS):
            return Response(True)
        return Response(False)

class ImageRecognigationData(APIView):
    def get(self,request):
        print("Hello  Get...")
        print("request :",request)
        return Response(utils.StyleRes(True,'Hello Get'),200)
    # @servicejwttokenvalidator
    def post(self, request):
        print("request :",request.data)
        data = FaceAppLogsSerializer(data=request.data)
        if(data.is_valid(raise_exception=True)):
            staff_no = data["StaffNO"].value
            emp_master_data = EmployeeMaster.objects.using('attendance').filter(EmpId=staff_no)
            if(len(emp_master_data) > 0):
                print( emp_master_data.values()[0]['DeviceId'])
                deviceId =  emp_master_data.values()[0]['DeviceId']
                puchData = PunchLogs(DeviceID = deviceId,LogDate = data["LogDate"].value,Direction = data["Direction"].value,SerialNo = data["SerialNo"].value,  Source = data["Source"].value)
                puchData.save(using='attendance')
                return Response(utils.StyleRes(True,"Data added to database successfully.",request.data),status=StatusCode.HTTP_OK)
            else:
                return Response(utils.StyleRes(False,"User not exists",{}),status=StatusCode.HTTP_UNAUTHORIZED)
        else:
            print("data is not valid ...")
            return Response(utils.StyleRes(False,"Error while save data",),status=StatusCode.HTTP_NOT_ACCEPTABLE)

class ReportRegistartionIssue(APIView):
    def get(self,request):
        print("Report for registartion issue:",request.data)
        return Response(utils.StyleRes(True,"GET Report Data",request.data),200)
    def post(self,request):
        print("post data",request.data)
        return Response(utils.StyleRes(True,"POST Report Data",request.data),200)

class ReportCheckINOutIssue(APIView):
    def get(self,request):
        print("Report for Check in out issue:",request.data)
        return Response(utils.StyleRes(True,"GET Check in out issue Data",request.data),200)
    def post(self,request):
        print("post Check in out issue Data ",request.data)
        return Response(utils.StyleRes(True,"POST Check in out issue Data",request.data),200)

class ProfilePicUpload(APIView):
    @jwttokenvalidator
    @is_admin
    @custom_exceptions
    def post(self,request,*args,**kwargs):
        try:
            auth_details = utils.validateJWTToken(request)
            if(auth_details['email']==""):
                return Response(auth_details, status=400) 
            if request.FILES and 'file' in request.FILES:
                file_obj = request.FILES['file']
                file_ext=str(file_obj).split('.')[-1]
                filename=str(uuid.uuid1())+ '.'+ file_ext
                with open(settings.UPLOAD_PROFILE_PIC_PATH+filename, 'wb') as f:
                    f.write(file_obj.read())
                return Response(utils.StyleRes(True,"Profile pic uploaded successfully", str(filename)), status=StatusCode.HTTP_OK)
            else:
                return Response(utils.StyleRes(False,"Fail to upload profile pic", "expecting `file` object"), status=StatusCode.HTTP_EXPECTATION_FAILED)
        except Exception as e:
            log.error(traceback.format_exc())
            return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['something_went_wrong'],{}), status=StatusCode.HTTP_UNPROCESSABLE_ENTITY)


        