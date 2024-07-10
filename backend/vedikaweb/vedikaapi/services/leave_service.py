from vedikaweb.vedikaapi.utils import utils
from vedikaweb.vedikaapi.serializers import LeaveRequestQpSerializer
from django.db.models import Q,F,Prefetch,Count,CharField, Case, When, Value as V, Subquery, OuterRef
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from django.db.models import Sum
from django.db.models import Value, When, FloatField
from django.db.models.functions import Coalesce 

from django.db.models import Q,F,Prefetch,Count,  Subquery, OuterRef
from django.db.models.fields import CharField, FloatField
from django.db.models.query import Prefetch
from vedikaweb.vedikaapi.constants import LeaveDayStatus, LeaveRequestStatus, LeaveDiscrepancyStatus
from django.db.models.query_utils import Q
from vedikaweb.vedikaapi.models import Employee, EmployeeHierarchy, Leave, LeaveBalance, LeaveDiscrepancy, LeaveRequest, LocationHolidayCalendar
import json
from rest_framework import serializers
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from datetime import datetime, timedelta, date

    # get leave requests based on query params
def get_leave_requests(qp, emp_id,is_hr=False):     

    leave_requests = None
    qp_serializer = LeaveRequestQpSerializer(data=qp)

    if qp_serializer.is_valid():
        filter =  qp.get('filter') 
        # is_unconsumed = json.loads(qp.get('is_unconsumed','false'))
        # is_consumed = json.loads(qp.get('is_consumed','false'))
        monthly_time_cycle_flag = json.loads(qp.get('cyclewise','false'))
        threshold = qp.get('previous',1)
        if(monthly_time_cycle_flag):
            res = utils.get_monthly_cycle(date.today(),Threshold=threshold)
            start_date,end_date = str(res[0]),str(res[1])
        else:
            start_date = qp.get('start_date')
            end_date = qp.get('end_date')

        is_history_valid = bool(start_date and end_date)
        is_manager = json.loads(qp.get('is_manager','false'))
        
        # STEP : store sorting criteria and process sorting query params into an array in the order desired
        sort_key = qp.get('sort_key',None)
        sort_dir = qp.get('sort_dir',None)
        sorting_order = ['-startdate','-enddate']
        
        today = datetime.today()
        today = today.replace(hour=0,minute=0,second=0,microsecond=0)
        
        if sort_key == 'emp_name': 
            if sort_dir == 'asc':
                sorting_order.insert(0,sort_key)
            elif sort_dir == 'desc':
                sorting_order.insert(0,'-'+sort_key)
            else:
                sorting_order.insert(0,'-'+sort_key)
        elif sort_key == 'startdate':
            if sort_dir == 'asc':
                sorting_order[0] = sort_key
            elif sort_dir == 'desc':
                sorting_order[0] = '-'+sort_key
        elif sort_key == 'enddate':
            sorting_order.reverse()
            if sort_dir == 'asc':
                sorting_order[0] = sort_key
            elif sort_dir == 'desc':
                sorting_order[0] = '-'+sort_key
        if is_hr:
            employees = Employee.objects.filter(status=1).distinct().values_list('emp_id',flat=True)
        elif is_manager:
            manager_id=emp_id
            # get all the employees in employee hierarchy under the manager with status 1
            employees = EmployeeHierarchy.objects.filter(manager=manager_id,status=1,priority=1).distinct().values_list('emp_id',flat=True)
            if filter == 'history':
                employees = EmployeeHierarchy.objects.filter(manager=manager_id,status=1).distinct().values_list('emp_id',flat=True)
            # print(employees,emp_id, manager_id)
            is_pending = json.loads(qp.get('is_pending','false'))                                    
        if filter == 'history':
            if is_history_valid:
                if(monthly_time_cycle_flag):
                    res = utils.get_monthly_cycle(date.today(),Threshold=threshold)
                    start_date,end_date = str(res[0]),str(res[1])
                else:
                    start_date= datetime.strptime(qp.get('start_date', utils.default_date()), '%Y-%m-%dT%H:%M:%S')
                    end_date = datetime.strptime(qp.get('end_date', utils.default_date()), '%Y-%m-%dT%H:%M:%S')
                
                today = datetime.today()
                today = today.replace(hour=0, minute=0, second=0, microsecond=0)
                is_date_between_startdate_end_date = (Q(startdate__gte=start_date) & Q(startdate__lte=end_date)) | (Q(enddate__gte=start_date) & Q(enddate__lte=end_date)) | (Q(startdate__lte=start_date) & Q(enddate__gte=end_date) & ~(Q(startdate__custom_gte=today) & Q(enddate__custom_lte=today)))

        base_query_set_leave_requests = LeaveRequest.objects.prefetch_related('leave_set','leavediscrepancy').filter((~Q(leavediscrepancy__status = 1)))
        if is_manager:
            query_expression = Q(emp__in=employees)
            if qp.get('emp_name'):
                if(qp.get('emp_name')!='ALL'):
                    query_expression = query_expression & Q(emp__emp_name__icontains=qp.get('emp_name'))
            if qp.get('status'):
                query_expression = query_expression & Q(status=qp.get('status'))

            if filter == 'history':         
                query_expression = is_date_between_startdate_end_date & query_expression
                base_query_set_leave_requests = base_query_set_leave_requests.filter(query_expression ).exclude(status__in = [LeaveRequestStatus.Pending.value,LeaveRequestStatus.EmployeeCancelled.value,LeaveRequestStatus.Rejected.value])
            elif filter == 'pending':
                query_expression = query_expression & (Q(startdate__custom_gt=today))
                base_query_set_leave_requests = base_query_set_leave_requests.filter(query_expression).exclude(status__in=[LeaveRequestStatus.EmployeeCancelled.value])
            elif filter == 'in_progress':
                query_expression = query_expression & (Q(startdate__custom_gt=today))
                base_query_set_leave_requests = base_query_set_leave_requests.filter(query_expression, status__in=[LeaveRequestStatus.Pending.value]) 
            else: 
                base_query_set_leave_requests = base_query_set_leave_requests.filter(query_expression)
        else:
            # self leave requests
            query_expression = Q(emp_id=emp_id)
            # today_minus_90 = today - timedelta(90)
            # query_expression = query_expression & Q(enddate__gte=today_minus_90)
            if qp.get('status'):
                query_expression = Q(emp_id=emp_id) & Q(status=qp.get('status'))

            if filter == 'history':
                if is_history_valid:
                    query_expression = query_expression & is_date_between_startdate_end_date 
                else: 
                    query_expression = query_expression & Q(startdate__custom_lte=today) & Q(startdate__custom_gte=today-timedelta(days=30))
                
                base_query_set_leave_requests = base_query_set_leave_requests.filter(query_expression).exclude(Q(status__in = [LeaveRequestStatus.Rejected.value,LeaveRequestStatus.EmployeeCancelled.value]) )
            elif filter == 'pending':
                query_expression = query_expression & (Q(startdate__custom_gt=today))
                base_query_set_leave_requests = base_query_set_leave_requests.filter(query_expression)
            elif filter == 'in_progress':
                query_expression = query_expression & (Q(enddate__custom_gte=today) )
                base_query_set_leave_requests = base_query_set_leave_requests.filter(query_expression)
            else:
                base_query_set_leave_requests = base_query_set_leave_requests.filter(Q(emp_id=emp_id))

        base_query_set_leave_requests = base_query_set_leave_requests.order_by(*sorting_order) 

        # before returning the results check if any of the leaves in leave request status needs to be changed
        # all consumed leave days update the status to 1 to mark them as Consumed
        ids = base_query_set_leave_requests.values_list('id',flat=True) 
        today = datetime.today()
        today = today.replace(hour=0,minute=0,second=0,microsecond=0)
        
        # leaves_in_leave_requests = Leave.objects.filter(leave_request_id__in=ids,leave_on__lt=today).exclude(status=LeaveDayStatus.HrCancelled.value)  
        # for leave in leaves_in_leave_requests:
        #     leave.status=LeaveDayStatus.Consumed.value
        # Leave.objects.bulk_update(leaves_in_leave_requests,['status'])

        # print(base_query_set_leave_requests.copy())
        # print("getting leave requests")
        leave_requests = base_query_set_leave_requests.annotate(
            day_count = Sum(Case( When(leave__day_leave_type='FULL', then=1.0),
            When(leave__day_leave_type='FIRST_HALF', then=0.5),
            When(leave__day_leave_type='SECOND_HALF', then=0.5),
            default=0.0,output_field=FloatField(),)),
            req_status = Case( When(status=0, then=Value('Pending')),
            When(status=LeaveRequestStatus.Approved.value, then=Value('Approved')),
            When(status=LeaveRequestStatus.Rejected.value, then=Value('Rejected')),
            When(status=LeaveRequestStatus.AutoApprovedEmp.value, then=Value('AutoApprovedEmp')),
            When(status=LeaveRequestStatus.AutoApprovedMgr.value, then=Value('AutoApprovedMgr')),
            When(status=LeaveRequestStatus.EmployeeCancelled.value, then=Value('Cancelled')),output_field=CharField(),),
            leave_type_name = F("leave_type_id__name"),
            emp_name=F('emp_id__emp_name'),
            emp_staff_no=F('emp_id__staff_no'),
            discrepancy_raised= Count(F('leavediscrepancy')),
            discrepancy_status=F('leavediscrepancy__status')
        )
        return leave_requests, qp_serializer.errors
    else:
        return leave_requests, qp_serializer.errors


def get_leave_balance(year,emp_id,is_hr=False):

    all_emp_leaves_balance = []
    if(is_hr.lower() == 'true'):
        emp_leaves_balance = Employee.objects.filter(status=1).prefetch_related(Prefetch(
            "leavebalance_set",
            queryset=LeaveBalance.objects.filter(year=year) 
        )).filter().annotate(
            total_leave_bal = Coalesce(Sum(Case(When(Q(leavebalance__year=year),then=F'leavebalance__leave_credits'),default=0.0)),V(0))
        )
    else:
        emp_leaves_balance = Employee.objects.filter(emp_id=emp_id).prefetch_related(Prefetch(
            "leavebalance_set",
            queryset=LeaveBalance.objects.filter(year=year) 
        )).annotate(
            total_leave_bal = Coalesce(Sum(Case(When(Q(leavebalance__year=year),then=F'leavebalance__leave_credits'),default=0.0)),V(0))
        )

    for each_emp_leave_bal in emp_leaves_balance.values('emp_id','email','emp_name', 'company','staff_no', 'role_id', 'total_leave_bal'):
        # print(each_emp_leave_bal)
        leave_statuses = [LeaveRequestStatus.Pending.value,LeaveRequestStatus.Approved.value,LeaveRequestStatus.AutoApprovedEmp.value,LeaveRequestStatus.AutoApprovedMgr.value]
        is_paid_and_valid_status = Q(leaverequest__leave_type__name='Paid') & Q(leaverequest__status__in=leave_statuses) & (Q(leaverequest__leavediscrepancy__status__in=[LeaveDiscrepancyStatus.Rejected.value,LeaveDiscrepancyStatus.Pending.value]) | Q(leaverequest__leavediscrepancy__status__isnull=True))

        emp_leave_requests = Employee.objects.filter(emp_id=each_emp_leave_bal["emp_id"],leaverequest__leave__leave_on__year=year).filter().prefetch_related("leaverequest_set", Prefetch("leaverequest_set__leave_set",queryset=Leave.objects.filter(leave_on__year=year))).aggregate(
            consumed = Coalesce(Sum(Case( When(Q(leaverequest__leave__day_leave_type='FULL') & is_paid_and_valid_status, then=1.0),
            When(Q(leaverequest__leave__day_leave_type='FIRST_HALF')& is_paid_and_valid_status, then=0.5),
            When(Q(leaverequest__leave__day_leave_type='SECOND_HALF')& is_paid_and_valid_status, then=0.5),default=0.0,output_field=FloatField(),)),V(0)))
        each_emp_leave_bal.update(emp_leave_requests)
        # print(each_emp_leave_bal['total_leave_bal'],)
        each_emp_leave_bal.update({'outstanding_leave_bal':each_emp_leave_bal['total_leave_bal'] - emp_leave_requests['consumed'] })
        each_emp_leave_bal.update({'year':year})
        all_emp_leaves_balance.append(each_emp_leave_bal)
    return all_emp_leaves_balance

def getLeaveDaysCnt(emp_id,startdate, enddate):
        delta = enddate - startdate       # as timedelta
        cnt=0
        print(emp_id,startdate,enddate)
        holiday_obj = LocationHolidayCalendar.objects.getdetailedHolidayList(emp_id=emp_id)
        holiday_list = list(map(lambda x:datetime.strptime(str(x.holiday_date.strftime('%Y-%m-%d %H:%M:%S')),'%Y-%m-%d %H:%M:%S'),holiday_obj))
        for i in range(delta.days + 1):
            day = startdate + timedelta(days=i)
            weekno = day.weekday()
            if weekno < 5 and (day not in holiday_list): # 5 Sat, 6 Sun
                cnt = cnt+1
        return cnt

def getLeaveperiod(req_id,startdate,enddate):
    leave_obj = Leave.objects.filter(leave_request_id=req_id).annotate(
        leave_on_date = F('leave_on__date')
    )
    if(len(leave_obj)==1 and startdate==enddate):
        leave_type = leave_obj[0].day_leave_type.split("_")
        leave_date = str(leave_obj[0].leave_on_date).split()[0]
        if(leave_type[0].upper()=='FULL'):
            leave_period =  leave_date + " ( "+leave_type[0]+" DAY )"
        else:
            leave_period = leave_date + " ( HALF DAY - "+' '.join(leave_type)+" )"

    else:
        leave_obj_start = leave_obj.filter(leave_on__date=startdate)
        leave_type_start = leave_obj_start[0].day_leave_type.split("_")
        leave_period = ""
        leave_start_date = str(leave_obj_start[0].leave_on_date).split()[0]
        
        if(leave_type_start[0].upper()!="FULL"):
            leave_period = leave_period + leave_start_date + " ( HALF DAY - "+' '.join(leave_type_start)+" ) TO "
        else:
            leave_period = leave_period + leave_start_date+" TO "

        leave_obj_end = leave_obj.filter(leave_on__date=enddate)
        leave_type_end = leave_obj_end[0].day_leave_type.split("_")
        leave_end_date = str(leave_obj_end[0].leave_on_date).split()[0]
        if(leave_type_end[0].upper()!="FULL"):
            leave_period = leave_period + leave_end_date + " ( HALF DAY - "+' '.join(leave_type_end)+" )"
        else:
            leave_period = leave_period + leave_end_date

    return leave_period

def get_leave_added_by_hr(year,emp_id_list):
    all_emp_leaves_balance = []
    
    emp_leaves_balance = Employee.objects.filter(emp_id__in = emp_id_list).prefetch_related(Prefetch(
                "leavebalance_set",
                queryset=LeaveBalance.objects.filter(Q(year=year) &  Q(acted_by = 'hr')) 
            )).filter(leavebalance__year = year, leavebalance__acted_by = 'hr').annotate(total_leave_bal = Coalesce(Sum(Case(When(Q(leavebalance__year=year),then=F'leavebalance__leave_credits'),default=0.0)),V(0)), comments = F('leavebalance__comments') , month = F('leavebalance__month'),createddate = F('leavebalance__created'))
    
    for each_emp_leave_bal in emp_leaves_balance.values('staff_no','emp_name', 'total_leave_bal', 'comments', 'month', 'createddate'):
        each_emp_leave_bal.update({'year':year})
        all_emp_leaves_balance.append(each_emp_leave_bal) 
    
    print("emp_leaves_balance:",emp_leaves_balance)   
    print("emp_id_list:",emp_id_list,"all_emp_leaves_balance",all_emp_leaves_balance)
    return all_emp_leaves_balance


def get_emp_id_list(qp,emp_id,is_hr=False):  
     
    qp_serializer = LeaveRequestQpSerializer(data=qp)
    employees = []
    print("qp_serializer.is_valid()",qp_serializer.is_valid())
    if qp_serializer.is_valid():
        is_manager = json.loads(qp.get('is_manager','false'))
        today = datetime.today()
        today = today.replace(hour=0,minute=0,second=0,microsecond=0)
        
        if is_hr:
            employees = Employee.objects.filter(status=1).distinct().values_list('emp_id',flat=True)
        elif is_manager:
            manager_id=emp_id
            if qp.get('emp_name'):
                if(qp.get('emp_name')!='ALL'):
                     employees = EmployeeHierarchy.objects.filter(emp__emp_name__icontains=qp.get('emp_name'),status=1,priority=1).distinct().values_list('emp_id',flat=True)
                # get all the employees in employee hierarchy under the manager with status 1
                else:
                    employees = EmployeeHierarchy.objects.filter(manager=manager_id,status=1,priority=1).distinct().values_list('emp_id',flat=True)
        else:
            employees = [emp_id]     
    emp_id_list = employees    
    # print("emp_list:",emp_id_list )
    return emp_id_list   
                              
       