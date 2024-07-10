from vedikaweb.vedikaapi.models import Employee, AttendanceAccessGroup, EmployeeHierarchy, EmployeeProfile, GlobalAccessFlag,EmployeeMaster, PunchLogs,  EmployeeProjectTimeTracker, HolidayCalendar

import itertools
import logging
log = logging.getLogger(__name__)

from datetime import datetime, timedelta, date
from django.db.models import Q,F
from vedikaweb.vedikaapi.constants import DefaultProjects
from django.conf import settings


class AttendenceService():
    def getFirstOccurence(self,list_,value):
        try:
            res = list_.index(next(filter(lambda i: i['Direction'] == value, list_)))
        except Exception:
            res=None
        return res
    def getLastOccurence(self,list_,value):
        try:
            i=0
            lastindex=None
            while(i<len(list_)):
                if(list_[i]['Direction']=='Out'):
                    lastindex=i
                i=i+1
            return lastindex
            res=len(list_) - 1 - list_[::-1].index('e')
            # res = list_.index(next(filter(lambda i: i['Direction'] == value, reversed(list_))))
        except Exception:
            res=None
        return res
        
    def getPunchPairs(self,list_):
        DirectionList = [list_[i]['Direction'] for i in range(len(list_))]
        i = 0
        res_dict = []
        while i <= len(DirectionList) - 1:
            n = DirectionList[i]
            startIndex = i
            while i < len(DirectionList) - 1 and DirectionList[i] == DirectionList[i + 1]:
                i = i + 1
            endIndex = i
            res_dict.append({'Direction':n,'data':[startIndex, endIndex]})
            i = i + 1
        #Discarding FirstOut
        if(res_dict[0]['Direction']=='Out'):
            res_dict = res_dict[1:]
        #Discarding LastIn
        if(res_dict[-1]['Direction']=='In'):
            res_dict = res_dict[:-1]
        return res_dict
    
    def getNetworkingHours(self,punchPairs,list_):
        i=0
        total_net_time=datetime.strptime('00:00:00', '%H:%M:%S')
        while(i<len(punchPairs)):
            time_interval = list_[punchPairs[i+1]['data'][0]]['Time'] - list_[punchPairs[i]['data'][-1]]['Time']
            total_net_time = time_interval + total_net_time
            i=i+2
        return str(total_net_time.strftime('%H:%M:%S'))

    def getpunchdata(self,list_):
        DirectionList = [list_[i]['Direction'] for i in range(len(list_))]
        i = 0
        res_dict = []
        while i <= len(DirectionList) - 1:
            if(i==len(DirectionList)-1):
                if(DirectionList[i]=="In"):
                    InTime = str(list_[i]['Time'].strftime('%H:%M:%S'))
                    OutTime = '--:--:--'
                elif(DirectionList[i]=="Out"):
                    InTime = '--:--:--'
                    OutTime = str(list_[i]['Time'].strftime('%H:%M:%S'))
                res_dict.append({'In':InTime,'Out':OutTime,'Net':'--:--:--'})
                i=i+1
            else:
                if(DirectionList[i] == DirectionList[i + 1]):
                    if(DirectionList[i]=="In"):
                        InTime = str(list_[i]['Time'].strftime('%H:%M:%S'))
                        OutTime = '--:--:--'
                    elif(DirectionList[i]=="Out"):
                        InTime = '--:--:--'
                        OutTime = str(list_[i]['Time'].strftime('%H:%M:%S'))
                    res_dict.append({'In':InTime,'Out':OutTime,'Net':'--:--:--'})
                    i=i+1
                else:
                    if(DirectionList[i] == "Out" and DirectionList[i + 1]=="In"):
                        InTime = '--:--:--'
                        OutTime = str(list_[i]['Time'].strftime('%H:%M:%S'))
                        res_dict.append({'In':InTime,'Out':OutTime,'Net':'--:--:--'})
                        i=i+1
                    elif(DirectionList[i] == "In" and DirectionList[i + 1]=="Out"):
                        
                        InTime = list_[i]['Time']
                        OutTime = list_[i+1]['Time']
                        NetTime = str(OutTime - InTime)
                        res_dict.append({'In':str(InTime.strftime('%H:%M:%S')),'Out':str(OutTime.strftime('%H:%M:%S')),'Net':NetTime})
                        i=i+2
        
        return res_dict
    
    def minutes_to_hm_format_conversion(self, time_in_minutes):
        time = int(time_in_minutes)/60
        hours = int(time)
        minutes = (time*60) % 60
        return "%02d:%02d" % (hours, minutes)
    def get_tt_final_datastructure(self,emp_id,from_date,to_date):
        final_datastructure = []
        k=0
        k2=0
        present_dates_list = []
        e=Employee.objects.filter(emp_id=emp_id)
        staff_no=""
        Employee_name=""
        if(len(e)>0):
            Employee_name = e.last().emp_name
            staff_no = e.last().staff_no
        else:
            return final_datastructure
        attendance_flag = False
        # print(Employee_name, staff_no)
        format = "%Y-%m-%d"
        if(type(from_date)==str):
            from_date = datetime.strptime(from_date,format)
        if(type(to_date)==str):
            to_date = datetime.strptime(to_date,format)
        to_date = datetime.combine(to_date, datetime.min.time())+timedelta(hours=23,minutes=59,seconds=59)
        emp_obj = EmployeeMaster.objects.using('attendance').filter(EmpId=staff_no)
        total_dates_list =[]
        if((type(from_date) is datetime) and (type(to_date) is date)):
            delta = to_date - from_date.date()
        elif((type(from_date) is date) and (type(to_date) is datetime)):
            delta = to_date.date() - from_date
        elif((type(from_date) is datetime) and (type(to_date) is datetime)):
            delta = to_date.date() - from_date.date()
        else:
            delta = to_date - from_date

        for i in range(delta.days + 1):
            day = from_date + timedelta(days=i)
            if(type(day) is datetime):
                total_dates_list.append(str(day.date()))
            else:
                total_dates_list.append(str(day))

        selected_year_list = [ y for y in range(from_date.year,to_date.year + 1)]
        emp_location_id = EmployeeProfile.objects.get(emp_id=emp_id).location_id
        #emp_location_id=1
        holiday_list=list(HolidayCalendar.objects.prefetch_related('locationholidaycalendar_set').filter(Q(holiday_year__in=selected_year_list)&Q(status=1)&Q(locationholidaycalendar__location_id=emp_location_id)&Q(locationholidaycalendar__status=1)).annotate(location=F('locationholidaycalendar__location')).values_list('holiday_date',flat=True))

        holiday_list = list(map(lambda x: datetime.strftime(x,'%Y-%m-%d'),holiday_list))
    
        posted_hours = EmployeeProjectTimeTracker.objects.filter(
                Q(employee_project__emp_id=emp_id) & Q(work_date__gte=from_date) & Q(work_date__lte=to_date)).values('work_date','work_minutes',).annotate(
                emp_id = F('employee_project__emp'),
                project_name = F('employee_project__project__name'),
                project_hours = F('work_minutes'),
            )
        # print("****************************",posted_hours)
            # delta = to_date.date() - from_date.date()
        # delta = to_date - from_date
        datesList = []
        for i in range(delta.days + 1):
            day = from_date + timedelta(days=i)
            datesList.append(day)
        final_data = []
        for i,eachdate in enumerate(datesList):
            final_data.append({'emp_id':emp_id,'day':eachdate,'total_hours':0,'vacation_hours':0, 'holiday_hours':0, 'project_hours':0})
            for each in posted_hours:
                eachdate = eachdate.date() if isinstance(eachdate,datetime) else eachdate
                
                if(each['work_date']==eachdate):
                    # final_data[i]['project']=each['project_name']
                    # final_data[i]['hours']=each['project_hours']
                    if each['project_name'] == DefaultProjects.Mis.value:
                        final_data[i]['project_hours'] += each['project_hours']
                        # continue
                    elif each['project_name'] == DefaultProjects.Vacation.value:
                        final_data[i]['vacation_hours'] += each['project_hours']
                    elif each['project_name'] == DefaultProjects.Holiday.value:
                        final_data[i]['holiday_hours'] += each['project_hours']
                    else:
                        final_data[i]['total_hours'] += each['project_hours']
                        final_data[i]['project_hours'] += each['project_hours']
                
        for each in final_data:
            each['total_hours'] = self.minutes_to_hm_format_conversion(each['total_hours'])
            each['vacation_hours'] = self.minutes_to_hm_format_conversion(each['vacation_hours'])
            each['holiday_hours'] = self.minutes_to_hm_format_conversion(each['holiday_hours'])
            each['project_hours'] = self.minutes_to_hm_format_conversion(each['project_hours'])
        

        ignorePunchLog = settings.IGNOROR_PUNCH_DEVICES 
        device_id = 0
        alternative_id = 0
        if(len(emp_obj)>0):
            device_id = emp_obj.last().DeviceId
            alternative_id = emp_obj.last().AmdId
            qs=PunchLogs.objects.using('attendance').filter(Q(DeviceID=emp_obj.last().DeviceId) & Q(LogDate__gte=from_date) & Q(LogDate__lte=to_date)  & (~Q(SerialNo__in=ignorePunchLog))).order_by('LogDate')
            grouped = itertools.groupby(qs, lambda record: record.LogDate.strftime("%Y-%m-%d"))
            jobs_by_day = [{"Date":day,"result": [{'Direction':each.Direction,'Time':each.LogDate} for each in list(jobs_this_day)]} for day, jobs_this_day in grouped]
            present_dates_list = list(map(lambda x:x['Date'],jobs_by_day))
            if isinstance(from_date, datetime):
                from_date = from_date.date()
            else:
                from_date = from_date
            if isinstance(to_date, datetime):
                to_date = to_date.date()
            else:
                to_date = to_date
            
            global_attendance_access = GlobalAccessFlag.objects.filter(status=1,access_type__iexact='ATTENDANCE')
            if(len(global_attendance_access)>0):
                att_access_grp_list = list(map(lambda x:x.emp_id,Employee.objects.filter(role_id=4,status=1)))
            else:
                att_access_grp_obj = AttendanceAccessGroup.objects.filter(status=1)
                att_access_grp_list = list(map(lambda x: x.emp_id,att_access_grp_obj))
            emp_hierarchy_obj = EmployeeHierarchy.objects.filter(manager_id__in=att_access_grp_list,emp_id=emp_id)
            if(len(emp_hierarchy_obj)>0):
                attendance_flag = True

            for eachday in total_dates_list:
                punchdata=[]
                weekdayFlag=False
                if(datetime.strptime(eachday, '%Y-%m-%d').weekday()==5 or datetime.strptime(eachday, '%Y-%m-%d').weekday()==6):
                    weekdayFlag=True
                for eachdate in datesList:
                    if eachdate.strftime("%Y-%m-%d") not in [eachjob['Date'] for eachjob in jobs_by_day]:
                        jobs_by_day.append({"Date":eachdate.strftime("%Y-%m-%d"),"result": [{'Direction':"--",'Time':"--:--:--"}]})

                if(str(eachday) in present_dates_list):
                    FirstIn = self.getFirstOccurence(jobs_by_day[k]['result'],"In")
                    LastOut = self.getLastOccurence(jobs_by_day[k]['result'],"Out")
                    getTime = lambda x : str(jobs_by_day[k]['result'][x]['Time'].strftime('%H:%M:%S')) if x is not None else '--:--:--'
                    FirstInTime = getTime(FirstIn)
                    LastOutTime = getTime(LastOut)
                    punchdata = self.getpunchdata(jobs_by_day[k]['result'])
                    if(FirstIn is None or LastOut is None):
                        Grossworking_hours = '00:00:00'
                        Networking_hours = '00:00:00'
                    else:
                        if(jobs_by_day[k]['result'][LastOut]['Time'] < jobs_by_day[k]['result'][FirstIn]['Time']):
                            Grossworking_hours = '00:00'
                            Networking_hours = '00:00'
                        else:
                            Grossworking_hours = str(jobs_by_day[k]['result'][LastOut]['Time'] - jobs_by_day[k]['result'][FirstIn]['Time'])
                            if(len(Grossworking_hours.split(':')[0])==1):
                                Grossworking_hours = "0"+Grossworking_hours
                            punchPairs = self.getPunchPairs(jobs_by_day[k]['result'])
                            Networking_hours = self.getNetworkingHours(punchPairs,jobs_by_day[k]['result'])

                    final_datastructure.append({"emp_name":Employee_name,'staff_no':staff_no,'emp_id':emp_id,"Date":jobs_by_day[k]['Date'],"FirstInTime":FirstInTime,"LastOutTime":LastOutTime,"GrossWorkingHours":Grossworking_hours,"NetWorkingHours":Networking_hours,"WeekdayFlag":weekdayFlag,"punchdata":punchdata, 'timesheet_total_working_hours':final_data[k2]['project_hours'], 'vacation_hours':final_data[k2]['vacation_hours'], 'holiday_hours':final_data[k2]['holiday_hours'], 'project_hours':final_data[k2]['project_hours'],'HolidayFlag':True if eachday in holiday_list else False, "device_id":device_id,"alternative_id":alternative_id})
                    # ,'HolidayFlag':True if eachday in holiday_list else False
                    k=k+1
                else:

                    final_datastructure.append({"emp_name":Employee_name,'staff_no':staff_no,'emp_id':emp_id,"Date":eachday,"FirstInTime":"--:--:--","LastOutTime":"--:--:--","GrossWorkingHours":"00:00:00","NetWorkingHours":"00:00:00","WeekdayFlag":weekdayFlag,"punchdata":punchdata, 'timesheet_total_working_hours':final_data[k2]['project_hours'],'vacation_hours':final_data[k2]['vacation_hours'], 'holiday_hours':final_data[k2]['holiday_hours'], 'project_hours':final_data[k2]['project_hours'],'HolidayFlag':True if eachday in holiday_list else False,"device_id":device_id,"alternative_id":alternative_id})
                    
                k2=k2+1
                    # k=k+1
                #print(final_datastructure)
        else:
            for eachday in total_dates_list:
                weekdayFlag=False
                if(datetime.strptime(eachday, '%Y-%m-%d').weekday()==5 or datetime.strptime(eachday, '%Y-%m-%d').weekday()==6):
                    weekdayFlag=True
                final_datastructure.append({"emp_name":Employee_name,'staff_no':staff_no,'emp_id':emp_id,"Date":eachday,"FirstInTime":"--:--:--","LastOutTime":"--:--:--","GrossWorkingHours":"00:00:00","NetWorkingHours":"00:00:00","WeekdayFlag":weekdayFlag,"punchdata":[], 'timesheet_total_working_hours':final_data[k]['total_hours'], 'vacation_hours':final_data[k]['vacation_hours'], 'holiday_hours':final_data[k]['holiday_hours'], 'project_hours':final_data[k]['project_hours'],'HolidayFlag':True if eachday in holiday_list else False,"device_id":device_id,"alternative_id":alternative_id})
                k=k+1
        return final_datastructure, attendance_flag, present_dates_list
    
    def get_student_final_datastructure(self,deviceId,from_date,to_date):
        final_datastructure = []
        isHoliday = False
        k=0
        k2=0
        present_dates_list = []
        format = "%Y-%m-%d"
        if(type(from_date)==str):
            from_date = datetime.strptime(from_date,format)
        if(type(to_date)==str):
            to_date = datetime.strptime(to_date,format)
        to_date = datetime.combine(to_date, datetime.min.time())+timedelta(hours=23,minutes=59,seconds=59)
        total_dates_list =[]
        if((type(from_date) is datetime) and (type(to_date) is date)):
            delta = to_date - from_date.date()
        elif((type(from_date) is date) and (type(to_date) is datetime)):
            delta = to_date.date() - from_date
        elif((type(from_date) is datetime) and (type(to_date) is datetime)):
            delta = to_date.date() - from_date.date()
        else:
            delta = to_date - from_date

        for i in range(delta.days + 1):
            day = from_date + timedelta(days=i)
            if(type(day) is datetime):
                total_dates_list.append(str(day.date()))
            else:
                total_dates_list.append(str(day))

        datesList = []
        for i in range(delta.days + 1):
            day = from_date + timedelta(days=i)
            datesList.append(day)
        final_data = []

        ignorePunchLog = settings.IGNOROR_PUNCH_DEVICES 
        qs=PunchLogs.objects.using('attendance').filter(Q(DeviceID=deviceId) & Q(LogDate__gte=from_date) & Q(LogDate__lte=to_date)  & (~Q(SerialNo__in=ignorePunchLog))).order_by('LogDate')
        grouped = itertools.groupby(qs, lambda record: record.LogDate.strftime("%Y-%m-%d"))
        jobs_by_day = [{"Date":day,"result": [{'Direction':each.Direction,'Time':each.LogDate} for each in list(jobs_this_day)]} for day, jobs_this_day in grouped]
        present_dates_list = list(map(lambda x:x['Date'],jobs_by_day))
        if isinstance(from_date, datetime):
            from_date = from_date.date()
        else:
            from_date = from_date
        if isinstance(to_date, datetime):
            to_date = to_date.date()
        else:
            to_date = to_date
        
        for eachday in total_dates_list:
            punchdata=[]
            weekdayFlag=False
            if(datetime.strptime(eachday, '%Y-%m-%d').weekday()==5 or datetime.strptime(eachday, '%Y-%m-%d').weekday()==6):
                weekdayFlag=True
            for eachdate in datesList:
                if eachdate.strftime("%Y-%m-%d") not in [eachjob['Date'] for eachjob in jobs_by_day]:
                    jobs_by_day.append({"Date":eachdate.strftime("%Y-%m-%d"),"result": [{'Direction':"--",'Time':"--:--:--"}]})

            if(str(eachday) in present_dates_list):
                FirstIn = self.getFirstOccurence(jobs_by_day[k]['result'],"In")
                LastOut = self.getLastOccurence(jobs_by_day[k]['result'],"Out")
                getTime = lambda x : str(jobs_by_day[k]['result'][x]['Time'].strftime('%H:%M:%S')) if x is not None else '--:--:--'
                FirstInTime = getTime(FirstIn)
                LastOutTime = getTime(LastOut)
                punchdata = self.getpunchdata(jobs_by_day[k]['result'])
                if(FirstIn is None or LastOut is None):
                    Grossworking_hours = '00:00:00'
                    Networking_hours = '00:00:00'
                else:
                    if(jobs_by_day[k]['result'][LastOut]['Time'] < jobs_by_day[k]['result'][FirstIn]['Time']):
                        Grossworking_hours = '00:00'
                        Networking_hours = '00:00'
                    else:
                        Grossworking_hours = str(jobs_by_day[k]['result'][LastOut]['Time'] - jobs_by_day[k]['result'][FirstIn]['Time'])
                        if(len(Grossworking_hours.split(':')[0])==1):
                            Grossworking_hours = "0"+Grossworking_hours
                        punchPairs = self.getPunchPairs(jobs_by_day[k]['result'])
                        Networking_hours = self.getNetworkingHours(punchPairs,jobs_by_day[k]['result'])

                final_datastructure.append({"deviceId":deviceId,"Date":jobs_by_day[k]['Date'],"FirstInTime":FirstInTime,"LastOutTime":LastOutTime,"GrossWorkingHours":Grossworking_hours,"NetWorkingHours":Networking_hours,"punchdata":punchdata,"attendance":'Present',"isHoliday":False})
                k=k+1
            else:
                day_name= ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday','Sunday']
                day = datetime.strptime(eachday, "%Y-%m-%d").weekday()
                current_day = day_name[day]
                if(day == 5 or day == 6):
                    isHoliday = True
                else:
                    isHoliday = False
                final_datastructure.append({"deviceId":deviceId,"Date":eachday,"FirstInTime":'00:00',"LastOutTime":'00:00',"GrossWorkingHours":'00:00',"NetWorkingHours":'00:00',"punchdata":{},"attendance":current_day if (day == 5 or day == 6) else 'Absent',"isHoliday":isHoliday})
            k2=k2+1
                # k=k+1
            # print(final_datastructure)
        return final_datastructure
    