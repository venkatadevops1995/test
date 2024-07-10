from .constants import LeaveDiscrepancyStatus
from vedikaweb.vedikaapi.models import LeaveDiscrepancy, LeaveBalanceUploaded
import json
from django.core.exceptions import ValidationError
from django.urls.conf import path
from rest_framework import serializers
import ast
from django.db.models import Q, fields
from django.core.validators import MaxValueValidator,MinValueValidator

from vedikaweb.vedikaapi.models import Employee, EmployeeProject, EmployeeProjectTimeTracker, EmployeeWeeklyStatusTracker, Project, Role, EmployeeWorkApproveStatus,EmployeeApprovalCompStatus,EmployeeEntryCompStatus,ManagerWorkHistory,EmployeeMaster,PunchLogs, RejectedTimesheetEmailNotification,  EmployeeHierarchy, Category, LeaveType, NewHireMonthTimePeriods, NewHireLeaveConfig, LeaveConfig ,LeaveBalance, LeaveRequest, Leave , Company, LocationHolidayCalendar, HolidayCalendar, Holiday, Location, EmployeeProfile, EmailQueue, EmployeeTimesheetApprovedHistory, PolicyDocument, PolicyType, PolicyCompany, PolicyDocumentEmployeeAccessPermission, PolicyDocumentEmployeeAction ,VedaBatch,VedaStudent

from .utils import utils
from datetime import datetime,timedelta
from django.core.validators import MaxValueValidator,MinValueValidator
from django.conf import settings
from rest_framework.exceptions import ErrorDetail
import logging
from django.db.models import When, Case
import os
log = logging.getLogger(__name__)

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(max_length=255)
    class Meta:
        # model = Employee
        fields = ('email', 'password')

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    class Meta:
        fields = ('email')

class TokenVerificationSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=None, min_length=None, allow_blank=False, trim_whitespace=True)
    class Meta:
        fields = ('token')

class RegisterConfirmSerializer(serializers.Serializer):
    def validate(self, data):
        if not data.get('password') or not data.get('confirm_password'):
            raise serializers.ValidationError("Please enter a password and "
                "confirm it.")
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError("Those passwords don't match.")
        return data
    
    token = serializers.CharField(max_length=None, min_length=None, allow_blank=False, trim_whitespace=True)
    password = serializers.CharField(max_length=45)
    confirm_password = serializers.CharField(max_length=45)
    class Meta:
        extra_fields = ['token', 'password', 'confirm_password']

class EmployeeWorkApproveStatusSerializer(serializers.Serializer):
    emp_id = serializers.IntegerField()
    work_week = serializers.IntegerField()
    year = serializers.IntegerField()
    status = serializers.IntegerField()
    attendance_ts_approved_dates = serializers.ListField(
         child=serializers.DateField(), allow_empty=True
    )
    attendance_ts_work_minutes = serializers.ListField(
         child=serializers.IntegerField(min_value=1), allow_empty=True
    )
    rm_comments = serializers.CharField(required=False)
    def validate(self,data):
        if(len(data['attendance_ts_approved_dates'])!=len(data['attendance_ts_work_minutes'])):

            raise ValidationError("number of values in attendance_ts_approved_dates and attendance_ts_work_minutes should be same")
        if(len(data['attendance_ts_approved_dates'])>0 and (('rm_comments' not in data) or len(data['rm_comments'])==0 or data['rm_comments'].strip()==0) ):
            raise ValidationError("rm_comments should be empty")
        return data
    class Meta:
        extra_fields = ['emp_id', 'work_week', 'year', 'status']
       
class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = '__all__'

class EmployeeProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeProject
        fields = '__all__'

class EmployeeProjectTimeTrackerSerializer(serializers.ModelSerializer):
    
    def create(self,validated_data):
        obj,created=EmployeeProjectTimeTracker.objects.update_or_create(
            employee_project=validated_data['employee_project'],work_date=validated_data['work_date'],work_year=validated_data['work_year'],
            defaults=validated_data
        )
        return obj,created

    class Meta:
        model = EmployeeProjectTimeTracker
        fields = '__all__'
        
class EmployeeWeeklyStatusTrackerSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeWeeklyStatusTracker
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'





##CUSTOM SERIALIZER FOR WORK_HOURS DICT##
class WorkHoursSerializer(serializers.Serializer):
    date=serializers.DateField()
    h=serializers.IntegerField(validators=[MaxValueValidator(24),MinValueValidator(0)])
    m=serializers.IntegerField(validators=[MaxValueValidator(59),MinValueValidator(0)])
    
    def validate_date(self,value):
        prev_week=self.context.get('prev_week')
        weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(prev_week)))
        if value in weekdatesList:
            return value
        raise serializers.ValidationError("{} Date in not part of the current week".format(value))

    def validate(self,data):
        if(data['h']==24 and data['m']>0):
            raise serializers.ValidationError("Total time should not be greater than 24 hours")
        return data

##CUSTOM SERIALIZER FOR ACTIVE PROJECTS LIST##
class ActiveProjectsSerializer(serializers.Serializer):
    project_id=serializers.IntegerField()
    priority=serializers.IntegerField(validators=[MaxValueValidator(3),MinValueValidator(0)])
    work_hours=WorkHoursSerializer(many=True)
    def validate_project_id(self,value):
        try:
            Project.objects.get(id=int(value))
            emp_id=self.context.get('emp_id')
            EmployeeProject.objects.get(project_id=int(value),emp_id=emp_id)
            return value
        except Exception as e:
            raise serializers.ValidationError(e)

##CUSTOM SERIALIZER FOR POST REQUEST OF WEEKLY TIMESHEET##
class EmployeeProjectTimeTrackerReqSerializer(serializers.Serializer):
    active_projects=ActiveProjectsSerializer(many=True)
    VACATION=serializers.DictField(child=WorkHoursSerializer(many=True))
    MISCELLANEOUS=serializers.DictField(child=WorkHoursSerializer(many=True))
    HOLIDAY=serializers.DictField(child=WorkHoursSerializer(many=True))

##CUSTOM SERIALIZER FOR WEEKLYSTATUS DATA##
class WeeklyStatusDataSerializer(serializers.Serializer):
    project_id=serializers.IntegerField()
    report=serializers.CharField(allow_blank=True)
    def validate_project_id(self,value):
        proj_obj=Project.objects.filter(id=int(value))
        emp_id=self.context.get('emp_id')
        emp_proj_obj=EmployeeProject.objects.filter(project_id=int(value),emp_id=emp_id)
        if(len(proj_obj)<=0):
            raise serializers.ValidationError("No project with specific projectid:{}".format(value))
        if(len(emp_proj_obj)<=0):
            raise serializers.ValidationError("provided projectid id {} not under this employee".format(value))
        return value

##CUSTOM MODEL SERIALIZER TO VALIDATE WSR REQUEST DATA##
class WeeklyStatusReqSerializer(serializers.Serializer):
    wsr_date=serializers.DateField()
    is_final_submit=serializers.BooleanField()
    weekly_status=WeeklyStatusDataSerializer(many=True)
    
    def validate_wsr_date(self,value):
        prev_week=self.context.get('prev_week')
        weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(prev_week)))
        if value in weekdatesList:
            return value
        raise serializers.ValidationError("{} Date in not part of the provided week".format(value))

##MODEL SERIALIZER TO POST/UPDATE WSR##
class WeeklyStatusPostSerializer(serializers.ModelSerializer):
    # year=serializers.IntegerField()
    def create(self,validated_data):
        obj,created=EmployeeWeeklyStatusTracker.objects.update_or_create(
            employee_project=validated_data['employee_project'],wsr_week=validated_data['wsr_week'],wsr_year=validated_data['wsr_year'],
            defaults=validated_data
            # defaults=utils.removekey(validated_data,"year")
        )
        return validated_data
    class Meta:
        model=EmployeeWeeklyStatusTracker
        fields='__all__'

##MODEL SERIALIZER TO POST/UPDATE WORKAPPROVALSTATUS##
class EmployeeWorkApproveStatusPostSerializer(serializers.ModelSerializer):
    # year=serializers.IntegerField()
    
    def create(self,validated_data):
        obj,created=EmployeeWorkApproveStatus.objects.update_or_create(
            emp=validated_data['emp'],work_week=validated_data['work_week'],work_year=validated_data['work_year'],
            defaults=validated_data
            # defaults=utils.removekey(validated_data,"year")
        )
        return validated_data
    class Meta:
        model=EmployeeWorkApproveStatus
        fields='__all__'
# CODE OPT
# class EmployeeWorkApproveStatusMultipleYearsPostSerializer(serializers.ModelSerializer):
#     year=serializers.ListField(child=serializers.CharField())
    
#     def create(self,validated_data):
#         obj,created=EmployeeWorkApproveStatus.objects.update_or_create(
#             emp=validated_data['emp'],work_week=validated_data['work_week'],created__year__in=validated_data['year'],
#             defaults=utils.removekey(validated_data,"year")
#         )
#         return validated_data
#     class Meta:
#         model=EmployeeWorkApproveStatus
#         fields='__all__'

class EmployeeEntryCompStatusPostSerializer(serializers.ModelSerializer):
    # year=serializers.ListField(child=serializers.CharField())
    # year=serializers.IntegerField()
    def create(self,validated_data):
        obj,created=EmployeeEntryCompStatus.objects.update_or_create(
            emp=validated_data['emp'],work_week=validated_data['work_week'],work_year=validated_data['work_year'],
            defaults={'emp':validated_data['emp'],'work_week':validated_data['work_week'],'work_year':validated_data['work_year'],'cnt':validated_data['cnt']}
        )
        return obj
    class Meta:
        model=EmployeeEntryCompStatus
        fields='__all__'

class EmployeeApprovalCompStatusPostSerializer(serializers.ModelSerializer):
    # year=serializers.ListField(child=serializers.CharField())
    year=serializers.IntegerField()
    def create(self,validated_data):
        emp_comp=EmployeeApprovalCompStatus.objects.filter(emp_id=validated_data['emp'],work_week=validated_data['work_week'],work_year=validated_data['year'])
        if(len(emp_comp)>0):
            validated_data['cnt']=emp_comp[0].cnt+validated_data['cnt']
        obj,created=EmployeeApprovalCompStatus.objects.update_or_create(
            emp=validated_data['emp'],work_week=validated_data['work_week'],work_year=validated_data['year'],
            defaults={'emp':validated_data['emp'],'work_week':validated_data['work_week'],'work_year':validated_data['year'],'cnt':validated_data['cnt']}
        )
        return obj
    class Meta:
        model=EmployeeApprovalCompStatus
        fields='__all__'
class ManagerWorkHistoryPostSerializer(serializers.ModelSerializer):
    #No need to pass years  only pass year
    # year=serializers.IntegerField()
    def removekey(self,d,key):
        r=dict(d)
        del r[key]
        return r

    def create(self,validated_data):
        
        obj,created=ManagerWorkHistory.objects.update_or_create(
            emp=validated_data['emp'],work_week=validated_data['work_week'],work_year=validated_data['work_week'],
            defaults=validated_data
            # defaults=self.removekey(validated_data,"year")
        )
        return obj
    class Meta:
        model=ManagerWorkHistory
        fields='__all__'


class EmployeeManagerSerializer(serializers.ModelSerializer):
    Id = serializers.IntegerField()
    EmpId = serializers.CharField()
    DeviceId = serializers.IntegerField()
    ManagerId = serializers.CharField()

    def create(self,validated_data):
        obj=EmployeeMaster.objects.using('attendance').create(
        Id=validated_data['Id'],EmpId=validated_data['EmpId'],DeviceId=validated_data['DeviceId'], ManagerId=validated_data['ManagerId'])
        return obj
        
    class Meta:
        model=EmployeeMaster
        fields='__all__'

class PunchLogsSerializer(serializers.ModelSerializer):
    TransID = serializers.IntegerField()
    DeviceID = serializers.IntegerField()
    LogDate = serializers.DateTimeField()
    Direction = serializers.CharField()
    SerialNo = serializers.CharField()
    Hrview_TransID = serializers.IntegerField()
    Source = serializers.CharField()

    def create(self,validated_data):
        obj=PunchLogs.objects.using('attendance').create(
        TransID=validated_data['TransID'],DeviceID=validated_data['DeviceID'],LogDate=validated_data['LogDate'],
        Direction=validated_data['Direction'],SerialNo=validated_data['SerialNo'],Hrview_TransID=validated_data['Hrview_TransID'],
        Source=validated_data['Source'])
        return obj

    class Meta:
        model=PunchLogs
        fields='__all__'

class RejectedTimesheetEmailNotificationSerializer(serializers.ModelSerializer):

    def create(self,validated_data):
        rej_timesheet_not_obj=RejectedTimesheetEmailNotification.objects.filter(emp_id=validated_data['emp'],work_week=validated_data['work_week'],work_year=validated_data['work_year'])
        if(len(rej_timesheet_not_obj)>0):
            validated_data['comments']=rej_timesheet_not_obj[0].comments+" | "+validated_data['comments']
        
        obj,created=RejectedTimesheetEmailNotification.objects.update_or_create(
            emp=validated_data['emp'],work_week=validated_data['work_week'],work_year=validated_data['work_year'],
            defaults=validated_data
        )
        return obj
    class Meta:
        model=RejectedTimesheetEmailNotification
        fields='__all__'

class ServieLoginSerializer(serializers.Serializer):
    api_user = serializers.CharField(max_length=255)
    password = serializers.CharField(max_length=255)
    class Meta:
        # model = Employee
        fields = ('api_user', 'password')
class EmployeeListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        exclude = ('password', )

class NewEmpSerializer(serializers.Serializer):
    email = serializers.EmailField()
    firstName = serializers.CharField()
    lastName = serializers.CharField()
    staff_no = serializers.CharField()
    doj = serializers.DateField()
    category =  serializers.PrimaryKeyRelatedField(queryset=Category.objects.filter(status=1))
    role =  serializers.PrimaryKeyRelatedField(queryset=Role.objects.filter(status=1))
    rep_manager = serializers.IntegerField()
    man_manager = serializers.IntegerField()
    fun_own =  serializers.IntegerField()
    company = serializers.CharField()
    location =  serializers.PrimaryKeyRelatedField(queryset=Location.objects.filter(status=1))
    # is_married = serializers.BooleanField()
    # patentry_maternity_cnt = serializers.IntegerField()
    gender = serializers.IntegerField()
    user_pic = serializers.CharField(allow_null=True, default=None, required=False, allow_blank=True)
    device_id = serializers.IntegerField(default=0)
    amd_id = serializers.IntegerField(default=0)
    def validate_email(self, data):
        emp =Employee.objects.filter(email=data)
        if len(emp)>0:

            raise serializers.ValidationError("user is already existed with email {}".format(emp[0].email),code=409)
        return data
    def validate_staff_no(self, data):
        emp =Employee.objects.filter(staff_no=data)
        if len(emp)>0:
            raise serializers.ValidationError("user is already existed with staff_no {}".format(data),code=409)
        return data
    def validate_fun_own(self, data):
        if(int(self.initial_data.get('role')) != 4 and data==0 ):
            raise serializers.ValidationError("Self reporting is only for role 4 users.",code=409)
        if( data!=0 and len(Employee.objects.filter(emp_id=data))==0):
            raise serializers.ValidationError("Invalid pk {} - object does not exist.".format(data),code=409)
        else:
            return data
    def validate_man_manager(self, data):
        if(self.initial_data.get('fun_own') == None):
            raise serializers.ValidationError("Manager's manager  {} can't be validated without functional owner".format(data),code=409)
        if( data!=0 and len(Employee.objects.filter(emp_id=data))==0):
            raise serializers.ValidationError("Invalid pk {} - object does not exist.".format(data),code=409)
        else:
            mgr = EmployeeHierarchy.objects.filter(status=1,emp_id=data,manager_id=self.initial_data['fun_own'],priority=1)
            if(int(self.initial_data['fun_own'])!=data and len(mgr)==0):
                raise serializers.ValidationError("Manager's manager  {} is not under given functional owner".format(data),code=409)
            return data
    def validate_rep_manager(self, data):
        if(self.initial_data.get('man_manager') == None):
            raise serializers.ValidationError("Reporting manager  {} can't be validated without manager's manager".format(data),code=409)
        if( data!=0 and len(Employee.objects.filter(emp_id=data))==0):
            raise serializers.ValidationError("Invalid pk {} - object does not exist.".format(data),code=409)
        else:
            mgr = EmployeeHierarchy.objects.filter(status=1,emp_id=data,manager_id=self.initial_data['man_manager'],priority=1)
            if(int(self.initial_data['man_manager'])!=data and len(mgr)==0):
                raise serializers.ValidationError("Reporting manager  {} is not under given manager's manager".format(data),code=409)
            return data
    def validate_company(self,data):
        company_data=Company.objects.filter(name=data)
        if(len(company_data)==0):  
            raise serializers.ValidationError("Company with name \"{}\" does not exist".format(data),code=409)
        return company_data[0].name
    def validate(self,data):
        emp_name = data["firstName"]+ " "+data["lastName"]
        if(Employee.objects.filter(emp_name = emp_name).exists()):
            raise serializers.ValidationError("Same Name employee already exists.",code=409)
        return data
    def validate_device_id(self,data):
        if data !=None and  data > 1000000:
            raise serializers.ValidationError("Hid maximum value is 999999")
        return data
    def validate_amd_id(self,data):
        if data !=None and  data > 10000000000:
            raise serializers.ValidationError("Alternative id maximum value is 9999999999")
        return data

class UpdateProjectSerializer(serializers.Serializer):
    emp_id = serializers.IntegerField()
    proj1 = serializers.IntegerField(required = False)
    proj2 = serializers.IntegerField(required = False)
    proj3 = serializers.IntegerField(required = False)
    def validate_emp_id(self, data):
        if(len(Employee.objects.filter(emp_id=data))==0):
            raise serializers.ValidationError("user is not existed with emp_id {}".format(data))
        return data
    def validate_proj1(self, data):
        if(len(Project.objects.filter(id=data))==0):
            raise serializers.ValidationError("proj1 is not existed with id {}".format(data))
        return data
    def validate_proj2(self, data):
        if(len(Project.objects.filter(id=data))==0):
            raise serializers.ValidationError("proj2 is not existed with id {}".format(data))
        return data
    def validate_proj3(self, data):
        if(len(Project.objects.filter(id=data))==0):
            raise serializers.ValidationError("proj3 is not existed with id {}".format(data))
        return data
class EmpManagersSerializer(serializers.Serializer):
    emp_id = serializers.PrimaryKeyRelatedField(queryset=Employee.objects.filter(status=1))
    rep_manager = serializers.IntegerField()
    man_manager = serializers.IntegerField()
    fun_own =  serializers.IntegerField()
    def validate_fun_own(self, data):
        if( data!=0 and len(Employee.objects.filter(emp_id=data))==0):
            raise serializers.ValidationError("Invalid pk {} - object does not exist.".format(data),code=409)
        else:
            return data
    def validate_man_manager(self, data):
        if(self.initial_data.get('fun_own') == None):
            raise serializers.ValidationError("Manager's manager  {} can't be validated without functional owner".format(data),code=409)
        if( data!=0 and len(Employee.objects.filter(emp_id=data))==0):
            raise serializers.ValidationError("Invalid pk {} - object does not exist.".format(data),code=409)
        else:
            mgr = EmployeeHierarchy.objects.filter(status=1,emp_id=data,manager_id=self.initial_data['fun_own'],priority=1)
            if(int(self.initial_data['fun_own'])!=data and len(mgr)==0):
                raise serializers.ValidationError("Manager's manager  {} is not under given functional owner".format(data),code=409)
            return data
    def validate_rep_manager(self, data):
        if(self.initial_data.get('man_manager') == None):
            raise serializers.ValidationError("Reporting manager  {} can't be validated without manager's manager".format(data),code=409)
        if( data!=0 and len(Employee.objects.filter(emp_id=data))==0):
            raise serializers.ValidationError("Invalid pk {} - object does not exist.".format(data),code=409)
        else:
            mgr = EmployeeHierarchy.objects.filter(status=1,emp_id=data,manager_id=self.initial_data['man_manager'],priority=1)
            if(int(self.initial_data['man_manager'])!=data and len(mgr)==0):
                raise serializers.ValidationError("Reporting manager  {} is not under given manager's manager".format(data),code=409)
            return data

class LeaveBalanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveBalance
        fields = "__all__"

class LeaveBalanceListSerializer(serializers.ModelSerializer):
    leave_bal = serializers.FloatField(read_only=True)
    outstanding_leave_bal = serializers.FloatField(read_only=True)
    cunsumed = serializers.FloatField(read_only=True)
    class Meta:
        model = Employee 
        exclude = ("password",)


class InvitationsSerializer(serializers.Serializer):
    file = serializers.FileField()

class LeaveRequestSerializer(serializers.ModelSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if 'request' in self.context and self.context['request'].method == 'GET':
            self.fields['day_count'] = serializers.SerializerMethodField(read_only=True, source='get_day_count')
            self.fields['discrepancy_status'] = serializers.SerializerMethodField(read_only=True, source='get_discrepancy_status')
          
    day_leave_type = serializers.CharField(write_only=True)
    req_status = serializers.CharField(read_only=True)
    leave_type_name = serializers.CharField(read_only=True)
    emp_name = serializers.CharField(read_only=True)
    leave_reason = serializers.CharField(max_length=40,required=False)
    hour = serializers.CharField(write_only=True, allow_blank=True,required=False)
    uploads_invitation = serializers.CharField(allow_blank=True)
    discrepancy_raised=serializers.BooleanField(required=False)
    status_discrepancy=serializers.IntegerField(required=False)
    emp_staff_no = serializers.CharField(required=False,read_only=True)
    time_tracker_id = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=EmployeeProjectTimeTracker.objects.filter(status=1)),required=False
    )
    startdate = serializers.DateTimeField()
    enddate = serializers.DateTimeField()

    def get_day_count(self,obj):
        if(str(obj.day_count)[-2:]=='.0'):
            return int(obj.day_count)
        return obj.day_count

    def get_discrepancy_status(self,obj):
        try:
            if(obj.discrepancy_status==LeaveDiscrepancyStatus.Pending.value):
                return "pending"
            elif(obj.discrepancy_status==LeaveDiscrepancyStatus.Approved.value):
                return "Approved"
            elif(obj.discrepancy_status==LeaveDiscrepancyStatus.Rejected.value):
                return "Rejected"
            return None
        except Exception as e:
            return None
    def validate_startdate(self,start_date):
        emp_id = self.initial_data.get('emp')
        employee_joing_date_check = Employee.objects.filter(emp_id=emp_id,status=1,profile__date_of_join__lte = start_date.date())
        if(len(employee_joing_date_check)<=0):
            raise serializers.ValidationError('Leave request start date is less than joing date')
        return start_date
    def validate_enddate(self,end_date):
        if(end_date <  datetime.strptime(self.initial_data.get('startdate'), '%Y-%m-%dT%H:%M:%S')):
            raise serializers.ValidationError('End date should not be less than start date')
        return end_date
    def validate(self,data):      
        if data['leave_type'].id == 1 and bool(data.get('leave_reason',"")) == False:
            raise serializers.ValidationError('leave_reason cannot be empty for general leave type')
        if("Half Day" in data["day_leave_type"]):
            if("hour" not in data.keys() or data["hour"]==""):
                raise serializers.ValidationError("hour field is required") 
        return data 
    
    def to_representation(self,instance): 
        representation = super().to_representation(instance)
        # print(instance.uploads_invitation)
        upload_urls = []
        if instance.uploads_invitation:
            for upload in json.loads(instance.uploads_invitation):
                upload_urls.append(settings.INVITATION_IMAGE_URL+'/'+upload)
        representation['uploads_invitation'] =  upload_urls if len(upload_urls) > 0 else ""
        return representation

    def create(self,validated_data): 
        obj=LeaveRequest.objects.create(
            emp = validated_data["emp"], 
            startdate =  validated_data["startdate"], 
            enddate =  validated_data["enddate"],
            requested_by = validated_data["requested_by"], 
            leave_type =  validated_data["leave_type"],
            leave_reason = validated_data.get("leave_reason",""),
            emp_comments = validated_data["emp_comments"],
            manager_comments = validated_data["manager_comments"], 
            status=validated_data["status"],
            uploads_invitation=validated_data['uploads_invitation']
            )
        return obj
 
        
        return data

    class Meta:
        model = LeaveRequest
        fields = '__all__'

class LeaveRequestQpSerializer(serializers.Serializer):
    # is_history = serializers.CharField(required=False)
    is_manager = serializers.CharField(required=False)
    # is_unconsumed = serializers.CharField(required=False)
    filter = serializers.CharField(required=False)
    sort_key = serializers.CharField(required=False)
    sort_dir = serializers.CharField(required=False)
    status = serializers.IntegerField(required=False)

    def validate(self,data):
        accepted_booleans = ['true','false',None] 
        accepted_filters = ['history','pending','in_progress']
        if data.get('filter') and data.get('filter') not in accepted_filters:
            raise ValidationError('unknown filter value. Accepted filter values are history, pending, in_progress','invalid')
        if data.get('is_manager') not in accepted_booleans:
            raise ValidationError('Only true or false accepted for is_manager','invalid') 
        if data.get('sort_key') not in ['emp_name','startdate','enddate',None]:
            raise ValidationError('Only emp_name , startdate , enddate  accepted for sort_key','invalid')
        if data.get('sort_dir') not in ['asc','desc',None]:
            raise ValidationError('Only emp_name , startdate , enddate  accepted for sort_dir','invalid')
        return data

class IdOnlySerializer(serializers.Serializer):
    id = serializers.IntegerField(required=True)

class LeaveDetailsSerializer(serializers.ModelSerializer):
    leave_type_name = serializers.CharField(read_only=True)

    class Meta:
        model = Leave
        fields = '__all__'


class CategorySerializer(serializers.ModelSerializer):
    name = serializers.CharField() 
    status = serializers.IntegerField() 

    class Meta:
        model= Category
        fields = ['id','name','status']

class NewHireMonthTimePeriodsSerializer(serializers.ModelSerializer): 
    start_date = serializers.IntegerField() 
    end_date = serializers.IntegerField() 
    status = serializers.IntegerField()

    def to_representation(self,instance):
        representation = super().to_representation(instance)
        hide_status = bool(self.context.get('hide_status'))
        status = representation.get('status')
        if hide_status and status:
            representation.pop('status')
        return representation

    class Meta:
        model= NewHireMonthTimePeriods
        fields = '__all__'

class NewHireLeaveConfigSerializer(serializers.ModelSerializer): 
    category=CategorySerializer(required=False, read_only=True ) 
    time_period=NewHireMonthTimePeriodsSerializer(required=False, read_only=True)  
    round_off_leave_credit=serializers.FloatField(required=True)

    def to_representation(self,instance):
        representation = super().to_representation(instance)
        hide_status = bool(self.context.get('hide_status'))
        status = representation.get('status')
        if hide_status and status:
            representation.pop('status')
        return representation

    def validate(self,data): 
        if len(str(data['round_off_leave_credit']).split('.')[1]) > 1:
            raise ValidationError("Only one digit allowed after decimal point")
        return data

    class Meta:
        model= NewHireLeaveConfig
        fields = ['id','category','category_id','time_period','round_off_leave_credit','status']

class LeaveTypeSerializer(serializers.ModelSerializer):

    def to_representation(self,instance):
        representation = super().to_representation(instance)
        hide_status = bool(self.context.get('hide_status'))
        status = representation.get('status')
        if hide_status and status:
            representation.pop('status')
        return representation

    class Meta:
        model = LeaveType
        fields="__all__"
        
class UpdateLeaveConfigSerializer(serializers.Serializer): 
    id= serializers.IntegerField(required=True)
    max_leaves=serializers.FloatField(required=True) 

    def validate_max_leaves(self,data):
        if data < 0 :
            raise serializers.ValidationError('Value should not be  less than 0')
        return data
    def validate(self,data):
        id = data['id']
        specialLeaveIdList = [3,4,5]
        if(id in specialLeaveIdList and not(data['max_leaves'].is_integer())):
            raise serializers.ValidationError('Value should not be float')
        return data
    
class LeaveConfigSerializer(serializers.ModelSerializer):  
    id = serializers.ReadOnlyField()
    category=CategorySerializer(read_only=True)
    leave_type=LeaveTypeSerializer(read_only=True)
    max_leaves=serializers.FloatField(required=True)

    def to_representation(self,instance):
        representation = super().to_representation(instance)
        hide_status = bool(self.context.get('hide_status'))
        status = representation.get('status')
        if hide_status and status:
            representation.pop('status')
        return representation
    

    class Meta:
        model= LeaveConfig
        fields=   (
            'id', 'category', 'leave_type', 'max_leaves', 'status'
        )

class LeaveDiscrepancySerializer(serializers.ModelSerializer):
    class Meta:
        model=LeaveDiscrepancy
        fields='__all__'


class LeaveDiscrepanciesManagerSerializer(LeaveDiscrepancySerializer):
    emp_name=serializers.CharField(required=False)
    startdate=serializers.DateTimeField(required=False)
    enddate=serializers.DateTimeField(required=False)
    leave_type_name=serializers.CharField(required=False)
    req_status=serializers.CharField(required=False) 


class ChangeRoleSerializer(serializers.Serializer):
    emp_id = serializers.IntegerField()
    role_id = serializers.IntegerField()

class LocationHolidayCalendarSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocationHolidayCalendar
        fields = "__all__"

class HolidayCalendarListSerializer(serializers.ListSerializer):
    def create(self, validated_data):
        holidayCalendar_data = [HolidayCalendar(**item) for item in validated_data]
        return HolidayCalendar.objects.bulk_create(holidayCalendar_data)

class AddHolidayCalendarSerializer(serializers.Serializer):
    locations = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Location.objects.filter(status=1))
    )
    holiday = serializers.CharField()
    holiday_count = serializers.IntegerField()
    holiday_year = serializers.IntegerField()
    holiday_date = serializers.DateField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    status = serializers.IntegerField()
    def validate(self,data):

        if(datetime.strftime(data['holiday_date'],"%Y")!=str(data['holiday_year'])):
            raise serializers.ValidationError("date year should be same as holiday year")
        return data

class HolidayCalendarSerializer(serializers.ModelSerializer):
    class Meta:
        model = HolidayCalendar
        fields = "__all__"

class HolidaySerializer(serializers.ModelSerializer):
        class Meta:
            model = Holiday
            fields = "__all__"

class LocationHolidayCalendarCustomSerializer(serializers.Serializer):
    location_name = serializers.CharField()
    holiday_name = serializers.CharField()
    holiday_date = serializers.DateField()
    holiday_year = serializers.IntegerField()
    
class EmployeeProfileSerializer(serializers.ModelSerializer):
    def create(self,validated_data):
        obj, created = EmployeeProfile.objects.update_or_create(emp=validated_data.get('emp'),defaults=validated_data)
        return obj
    class Meta:
        model = EmployeeProfile
        fields = "__all__"

class EmployeeDetailsSerializer(serializers.Serializer):
    emp_id = serializers.PrimaryKeyRelatedField(queryset=Employee.objects.filter(status=1))
    emp_name = serializers.CharField()
    email = serializers.CharField()
    staff_no = serializers.CharField()
    category =  serializers.PrimaryKeyRelatedField(queryset=Category.objects.filter(status=1))
    company = serializers.CharField()
    category_name = serializers.CharField(read_only=True)
    # is_married = serializers.BooleanField()
    # patentry_maternity_cnt = serializers.IntegerField()
    gender = serializers.IntegerField()
    user_pic = serializers.CharField(allow_null=True, default=None, required=False, allow_blank=True)
    location =  serializers.PrimaryKeyRelatedField(queryset=Location.objects.filter(status=1))
    device_id = serializers.IntegerField(allow_null=True,default=0)
    amd_id = serializers.IntegerField(allow_null=True,default=0)
    def validate_device_id(self,data):
        if data !=None and  data > 1000000:
            raise serializers.ValidationError("Hid maximum value is 999999")
        return data
    def validate_amd_id(self,data):
        if data !=None and  data > 10000000000:
            raise serializers.ValidationError("Alternative  id maximum value is 9999999999")
        return data
    def validate_company(self,data):
        company_list = Company.objects.filter(name=data)
        if(len(company_list)==0):
            raise serializers.ValidationError("Company with name \"{}\" does not exist".format(data),code=409)
        return data

class EmployeeDisableSerializer(serializers.Serializer):
    emp_id = serializers.PrimaryKeyRelatedField(queryset=Employee.objects.filter(status=1))
    relieved = serializers.DateField()

class SubmittedTimeTrackerSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField()
    class Meta:
        model = EmployeeProjectTimeTracker
        fields = '__all__'

class EmailOptedSerializer(serializers.Serializer):
    status = serializers.IntegerField(required = True)
    class Meta:
        fields = ('status')
    def validate_status(self,data):
        if(data not in [0,1]):
            raise serializers.ValidationError("status \"{}\" is not valid".format(data),code=409)
        return data 

class EmailQueueSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailQueue
        fields = '__all__'
        

class LeaveBalanceUploadedSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveBalanceUploaded
        fields = '__all__'


class EmployeeTimesheetApprovedHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeTimesheetApprovedHistory
        fields = '__all__'

class PolicyDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PolicyDocument
        fields = '__all__'
class PolicyDocumentCreateSerializer(serializers.Serializer):

    policy_type = serializers.PrimaryKeyRelatedField(queryset=PolicyType.objects.filter(status=1))
    policy_name = serializers.CharField(max_length=255)
    display_name = serializers.CharField(max_length=255)
    file_name = serializers.CharField(max_length=255)
    enable_for = serializers.CharField(max_length=20)
    enable_on = serializers.DateField()
    expire_on = serializers.DateField()
    company_list = serializers.ListField(
         child=serializers.PrimaryKeyRelatedField(queryset=Company.objects.filter(status=1)),required=True
    )
    emp_list = serializers.ListField(
         child=serializers.PrimaryKeyRelatedField(queryset=Employee.objects.filter(status=1)),required=False
    )
    def validate_company_list(self,data):
        if len(data) == 0 :
            raise serializers.ValidationError("Company List must be not empty.",code=409)
        return data
    def validate(self,data):

        if data['enable_for'] == 'FEW' and (('emp_list' not in data) or len(data['emp_list'])==0):
            raise ValidationError({'emp_list':[ErrorDetail(string='This field is required.', code='required')]})
        fileExists = utils.fileExists(os.path.join(settings.BASE_POLICIES_PATH,data['file_name']))
        
        if(not fileExists):
            raise ValidationError({'file_name':'file "{}" does not exist'.format(data['file_name'])})
        return data


class PolicyCompanySerializer(serializers.ModelSerializer):

    def create(self,validated_data):
        obj,created=PolicyCompany.objects.update_or_create(
            policy=validated_data['policy'],company=validated_data['company'],
            defaults=validated_data
        )
        return obj,created
    class Meta:
        model = PolicyCompany
        fields = '__all__'

class PolicyDocumentEmployeeAccessPermissionSerializer(serializers.ModelSerializer):

    def create(self,validated_data):
        obj,created=PolicyDocumentEmployeeAccessPermission.objects.update_or_create(
            policy_document=validated_data['policy_document'],emp=validated_data['emp'],
            defaults=validated_data
        )
        return obj,created
    class Meta:
        model = PolicyDocumentEmployeeAccessPermission
        fields = '__all__'

class PolicyDocumentEmployeeActionSerializer(serializers.ModelSerializer):
    def validate(self,data):
        if('upload_policy_document' in data.keys()):
            fileExists = utils.fileExists(settings.UPLOAD_PATH+'/policy/'+data['upload_policy_document'])
            if(not fileExists):
                raise ValidationError({'upload_policy_document':'file "{}" does not exist'.format(data['upload_policy_document'])})
        return data
    def create(self,validated_data):
        obj,created=PolicyDocumentEmployeeAction.objects.update_or_create(
            policy_document=validated_data['policy_document'],emp=validated_data['emp'],
            defaults=validated_data
        )
        return obj,created
    class Meta:
        model = PolicyDocumentEmployeeAction
        fields = '__all__'
class MisDonloadDisableWithDate(serializers.Serializer):
    startdate = serializers.DateField()
    enddate = serializers.DateField()
    def validate(self, data):
        if data['startdate'] > data['enddate']:
            raise serializers.ValidationError("finish must occur after start")
        return data

class FaceAppLogsSerializer(serializers.Serializer):
    # TransID = serializers.IntegerField()
    StaffNO = serializers.IntegerField()
    LogDate = serializers.DateTimeField()
    Direction = serializers.CharField()
    SerialNo = serializers.CharField()
    Hrview_TransID = serializers.IntegerField(default=0)
    Source = serializers.CharField()

    class Meta:
        model=PunchLogs
        fields='__all__'

class BatchNameSerializer(serializers.Serializer):
    batch_name = serializers.CharField()
    status = serializers.IntegerField(required=False, default=1)

    def validate_batch_name(self,value):
        if len(value) < 51:
            return value
        raise serializers.ValidationError("{} Batch Name should be maximum 50 character".format(value))
    class Meta:
        model= VedaBatch
        fields='__all__'
class VedaStudentSerializer(serializers.Serializer):
    batch_name = serializers.CharField()
    student_name = serializers.CharField()
    device_id = serializers.IntegerField()   
    status = serializers.IntegerField(required=False, default=1)
    class Meta:
        model= VedaStudent
        fields='__all__'

class VedaStudentExportsSerializer(serializers.ModelSerializer):
    class Meta:
        model= VedaStudent
        fields='__all__'

