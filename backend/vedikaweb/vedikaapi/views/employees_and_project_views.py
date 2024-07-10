
from django.db.models.query import Prefetch
from vedikaweb.vedikaapi.services.email_service import email_service
from rest_framework.views import APIView
from rest_framework.response import Response
from vedikaweb.vedikaapi.models import Employee, EmployeeMaster,EmployeeProject, LeaveRequest,Project,Project,EmployeeHierarchy,EmployeeEntryCompStatus,StageEmployeeProject, NewHireLeaveConfig, LeaveBalance, EmployeeProfile, Leave, GlobalAccessFlag, LeaveAccessGroup, StageEmpolyee

from vedikaweb.vedikaapi.serializers import EmployeeDisableSerializer, EmployeeListSerializer, EmployeeSerializer, UpdateProjectSerializer, EmpManagersSerializer, EmployeeDetailsSerializer,ProjectSerializer, NewEmpSerializer, ChangeRoleSerializer

from vedikaweb.vedikaapi.constants import DeletedEmployeePrefix, StatusCode, DefaultProjects, MailConfigurations
from vedikaweb.vedikaapi.utils import utils
from django.conf import settings
from vedikaweb.vedikaapi.decorators import custom_exceptions, is_admin, is_manager,jwttokenvalidator,servicejwttokenvalidator
from django.db.models import Q,F,Count,CharField, Case, When, Value as V

from django.core.paginator import Paginator
from django.db.models.functions import Concat,ExtractYear
from django.core.mail import send_mail
from django.template.loader import get_template
from vedikaweb.vedikaapi.views.common_views import CommonFunctions
import traceback, json
from datetime import datetime, timedelta
import ast
import logging
from vedikaweb.vedikaapi.services.attendance_services import AttendenceService as attendance
from vedikaweb.vedikaapi.services.email_service import email_service 
from django.db.models import When, Case
log = logging.getLogger(__name__)
from vedikaweb.vedikaapi.views.common_views import CommonFunctions
import os
import decimal
attendance_ = attendance()

class EmpProjects(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        emp_id=auth_details['emp_id']
        #1. Query to get EmployeeProject data
        empproj_obj=EmployeeProject.objects.select_related('project').order_by('priority').filter(emp__emp_id=emp_id)
        emp_projs=[]
        #2. Loop to get projects and weekly status of employee
        for eachobj in empproj_obj:
            emp_projs.append({'id':eachobj.project.id,'name':eachobj.project.name,'priority':eachobj.priority})
        return Response(utils.StyleRes(True,'successfully retrived projects',emp_projs))

class Usersdelete(APIView):
    @jwttokenvalidator
    @custom_exceptions
    @is_manager
    def put(self,request,*args,**kargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        emp_id=auth_details['emp_id']
        is_hr = auth_details['is_emp_admin']
        if(is_hr):
            serial_data = EmployeeDisableSerializer(data=request.data)

            if(serial_data.is_valid()):
                emp_id = serial_data.validated_data['emp_id'].emp_id
                relieved = serial_data.validated_data['relieved']

                obj = Employee.objects.only('role_id', 'created','emp_name','email').get(emp_id = emp_id)
                role_id = obj.role_id
                emp_name = obj.emp_name
                staff_no = obj.staff_no
                created = obj.created
                email = obj.email
                current_date = datetime.now().date()
                emp_details = {
                        "staff_no": staff_no,
                        "email": email,
                        "emp_name": emp_name
                }
                if (created.date() > relieved):
                    return Response(utils.StyleRes(False,'Relieve date must be greater than joining date',{"Joining date": created , "Relieving date":relieved}), status = StatusCode.HTTP_NOT_ACCEPTABLE)
                
                if (role_id > 1): 
                    manager_id = EmployeeHierarchy.objects.filter(manager_id = emp_id).filter(Q(emp__status = 1) & ~Q(emp__emp_id = emp_id)).aggregate(cnt = Count('emp_id', distinct=True))
                    if (manager_id['cnt'] > 0):
                        return Response(utils.StyleRes(False,"This manager has {} employee".format(manager_id['cnt']),str(serial_data.errors)), status=StatusCode.HTTP_BAD_REQUEST)
                
                if((((relieved == current_date) and datetime.now().hour >= 21)) or( relieved < current_date)):
                    obj = Employee.objects.filter(emp_id = emp_id).update(status=0, relieved=relieved,email=email+str(DeletedEmployeePrefix.Deleted.value),emp_name=emp_name+str(DeletedEmployeePrefix.Deleted.value),staff_no=staff_no+str(DeletedEmployeePrefix.Deleted.value))
                    # change the DeviceId and AmdId of relieved employee in EmployeeMaster 
                    EmployeeMaster.objects.using('attendance').filter(EmpId=staff_no).update(DeviceId=0, AmdId=0)
                    
                    # adding email_details to EmailQueue 
                    email_service.informManagerEmpDisable(emp_id,emp_details,relieved,stagging = False)
                    return Response(utils.StyleRes(True,"Employee disable","{} account disabled successfully.".format(emp_name)), status=StatusCode.HTTP_OK)
                else:
                    obj, created = StageEmpolyee.objects.update_or_create(
                        emp_id=emp_id,
                        defaults={'status': 1,'relieved':relieved},
                    )
                    # adding email_details to EmailQueue 
                    email_service.informManagerEmpDisable(emp_id,emp_details,relieved,stagging=True)
                    return Response(utils.StyleRes(True,"Disbale Employee in Stagging","{} account will be disabled on {} at 9PM.".format(emp_name,relieved)) , status=StatusCode.HTTP_OK)
            else:
                return Response(utils.StyleRes(False,"Employee update",str(serial_data.errors)), status=StatusCode.HTTP_BAD_REQUEST)
        else:
            return Response(utils.StyleRes(False,'Unautherized User',{}), status = StatusCode.HTTP_UNAUTHORIZED)


class Users(APIView):

    @jwttokenvalidator
    @custom_exceptions
    def get(self,request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        hierarchy_type = request.query_params.get('hierarchy_type','immediate')
        search = request.query_params.get('search',False)
        if(hierarchy_type=='all'):
            emp_data=Employee.objects.prefetch_related('profile').filter(Q(status=1)).annotate(gender=F('profile__gender_id'),category=F('profile__category_id'),category_name=F('profile__category_id__name'),user_pic=F('profile__picture'),location=F('profile__location_id__name')).order_by("staff_no")
            emp_serial_data = EmployeeDetailsSerializer(emp_data, many=True)
            return Response(utils.StyleRes(True,"All employee list",emp_serial_data.data), status=StatusCode.HTTP_OK)  
        elif(auth_details['role_id']>1 or auth_details['is_emp_admin'] or len(auth_details['sub_report_access']) >0):
            user_id = auth_details['emp_id']
            is_emp_admin = auth_details['is_emp_admin']
            emp_type = request.query_params.get('type','employee')
            # hierarchy type can be immediate, lower or higher
            

            
            role = request.query_params.getlist('role',[2,3,4])
            if(emp_type=='manager'):
                emp_serial_data = Employee.objects.filter(role_id__in=role ,status=1).order_by("staff_no")
                filtered_data = {2:EmployeeListSerializer(emp_serial_data.filter(role_id = 2),many=True).data,3:EmployeeListSerializer(emp_serial_data.filter(role_id = 3),many=True).data,4:EmployeeListSerializer(emp_serial_data.filter(role_id = 4),many=True).data}
                return Response(utils.StyleRes(True,"All Managers list",filtered_data))
            elif emp_type == 'employee':
                emp_serial_data = EmployeeListSerializer(Employee.objects.filter(status=1).order_by("staff_no"), many=True)
                return Response(utils.StyleRes(True,"All employee list",emp_serial_data.data), status=StatusCode.HTTP_OK)
            elif emp_type == 'hierarchy':
                # l1,l2,l3 users are eligible to make this request
                # this is used in the employee drop down where a user searches for employees under himself based on a string
                # the l1 user will see l0 users and l2 user will see l1 users etc
                if hierarchy_type == 'immediate': 
                    filter_criteria = Q(manager_id = user_id) & Q(priority=1) & Q(emp__status=1)
                    
                    if search:
                        filter_criteria = filter_criteria & Q(emp_name__icontains=search)
                    employees = EmployeeHierarchy.objects.prefetch_related('emp').annotate(emp_name=F('emp__emp_name')).filter(filter_criteria).values('emp_id','emp_name')
                    return Response(utils.StyleRes(True,"All employee list",employees), status=StatusCode.HTTP_OK)
                elif hierarchy_type == 'lower':
                    filter_criteria = Q(manager_id = user_id) & Q(emp__status=1)
                    if search:
                        filter_criteria = filter_criteria & Q(emp_name__icontains=search)
                    employees = EmployeeHierarchy.objects.prefetch_related('emp').annotate(emp_name=F('emp__emp_name')).filter(filter_criteria).values('emp_id','emp_name').distinct()
                    return Response(utils.StyleRes(True,"All employee list",employees), status=StatusCode.HTTP_OK)
                elif hierarchy_type == 'higher':                     
                    filter_criteria = Q(emp_id=user_id) 
                    if search:
                        filter_criteria = filter_criteria & Q(manager_name__icontains=search)
                    employees = EmployeeHierarchy.objects.prefetch_related('manager').annotate(manager_name=F('manager__emp_name')).filter(filter_criteria).values('manager_id','manager_name').distinct()
                    return Response(utils.StyleRes(True,"All employee list",employees), status=StatusCode.HTTP_OK)
            elif (is_emp_admin == True or 'hr-attendance-reports' in auth_details['sub_report_access']) and emp_type == "hr":
                if(search.lower()=="all"):
                    emp_data=Employee.objects.prefetch_related('profile','stage_employee').filter(Q(status=1)).annotate(staging_status=F('stage_employee__status'), staging_relieved=F('stage_employee__relieved'),gender=F('profile__gender_id'),category=F('profile__category_id'),category_name=F('profile__category_id__name'),user_pic=F('profile__picture'),location=F('profile__location_id__name')).order_by("staff_no")
                                                                   
                else:
                    emp_data=Employee.objects.prefetch_related('profile','stage_employee').filter(Q(emp_name__icontains=search) & Q(status=1)).annotate(staging_status=F('stage_employee__status'), staging_relieved=F('stage_employee__relieved'),gender=F('profile__gender_id'),category=F('profile__category_id'),category_name=F('profile__category_id__name'),user_pic=F('profile__picture'), location=F('profile__location_id__name')).order_by("staff_no")
                # emp_serial_data = EmployeeDetailsSerializer(emp_data, many=True)

                final_data = list(emp_data.values())
                emp_staff_no_list = []
                emp_device_id_dict = {}  # example: {staff_no: {device_id:12345, amd_id:456788}}
                for each_emp in emp_data:
                    emp_staff_no_list.append(each_emp.staff_no)
                emp_master_data = EmployeeMaster.objects.using('attendance').filter(EmpId__in = emp_staff_no_list).order_by('Id') 
                for each_master_data in emp_master_data:
                    obj = {}
                    obj["device_id"] = each_master_data.DeviceId
                    obj["amd_id"] = int(each_master_data.AmdId)
                    emp_device_id_dict[str(each_master_data.EmpId)] = obj
                for each_emp in final_data:
                    if each_emp['staff_no'] in emp_device_id_dict:
                        each_emp['device_id'] = emp_device_id_dict[each_emp['staff_no']]['device_id']
                        each_emp['amd_id'] = emp_device_id_dict[each_emp['staff_no']]['amd_id']
                    else:
                        each_emp['device_id'] = None
                        each_emp['amd_id'] = None

                return Response(utils.StyleRes(True,"All employee list",final_data), status=StatusCode.HTTP_OK)
            else:
                
                return Response(utils.StyleRes(True,"All Managers list","Loggedin user do not have permission"))
        else:
            return Response(utils.StyleRes(True,"All Managers list","Loggedin user do not have permission"))


    
    @jwttokenvalidator
    @custom_exceptions
    @is_admin
    def put(self,request,*args,**kargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        serial_data = EmployeeDetailsSerializer(data=request.data)
        try:
            if(serial_data.is_valid(raise_exception=True)):
                
                emp_id = serial_data.data["emp_id"]
                email = serial_data.data["email"]
                emp_name = serial_data.data["emp_name"]
                # checking the name and email are  exist for another employee or not 
                if(Employee.objects.filter(Q(email = email) & ~(Q(emp_id = emp_id))).exists()):
                    return Response(utils.StyleRes(False,"Employee update failed",[{'email':"employee already exists with email {}".format(email)}]), status=StatusCode.HTTP_BAD_REQUEST)
                
                if(Employee.objects.filter(Q(emp_name = emp_name) & ~(Q(emp_id = emp_id))).exists()):
                    return Response(utils.StyleRes(False,"Employee update failed",[{'emp_name':"employee name {} already exists for another employee.".format(emp_name)}]), status=StatusCode.HTTP_BAD_REQUEST)
                
                EmployeeProfile.objects.filter(emp=serial_data.validated_data.get("emp_id")).update(category=serial_data.validated_data.get("category"),picture=serial_data.validated_data.get("user_pic"),location_id=serial_data.validated_data.get("location"),gender_id=serial_data.validated_data.get("gender"))
                Employee.objects.filter(emp_id = emp_id).update(emp_name =emp_name,email=email)

                staff_no = serial_data.data["staff_no"]
                device_id = serial_data.data["device_id"]
                amd_id =  decimal.Decimal(serial_data.data["amd_id"])
                if(device_id == None):
                    device_id = 0
                
                # Checking Device ID and AMD ID is already exists for another employee or no 
                if ((EmployeeMaster.objects.using('attendance').filter(Q(DeviceId=device_id) & ~Q(EmpId=staff_no) & ~Q(DeviceId=0)).exists())):
                    return Response(utils.StyleRes(False,"Employee update failed",[{'device_id':["HID {} already exists for another employee.".format(device_id)]}]), status=StatusCode.HTTP_BAD_REQUEST)
                
                if ((EmployeeMaster.objects.using('attendance').filter(Q(AmdId=amd_id) & ~Q(EmpId=staff_no) & ~Q(AmdId=0)).exists())):
                    return Response(utils.StyleRes(False,"Employee update failed",[{'amd_id':["Alternative id {} already exists for another employee.".format(amd_id)]}]), status=StatusCode.HTTP_BAD_REQUEST)
                
                emp_master_data = EmployeeMaster.objects.using('attendance').filter(EmpId=staff_no).order_by('-Id')
                
                if(len(emp_master_data) == 0):
                    new_emp_mastser_data = EmployeeMaster.objects.using('attendance').create(EmpId=staff_no, DeviceId=device_id,AmdId=amd_id)
                else:
                    updated_data = EmployeeMaster.objects.using('attendance').filter(EmpId=staff_no).update(DeviceId=device_id,AmdId=amd_id)
            
            return Response(utils.StyleRes(True,"Employee update","updated profile for {}".format(serial_data.validated_data.get("emp_name"))), status=StatusCode.HTTP_OK)

        except Exception as e:
            log.error(traceback.format_exc())
            return Response(utils.StyleRes(False,"Employee update failed",e.args), status=StatusCode.HTTP_BAD_REQUEST)
            

    @jwttokenvalidator
    @custom_exceptions
    # @is_admin
    def post(self,request,*args,**kargs):
        # new_user_data = request.data
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)

        data = NewEmpSerializer(data=request.data)
        
        try:
            if(data.is_valid(raise_exception=True)):

                emp_name = data["firstName"].value+ " "+data["lastName"].value
                emp = Employee(email = data["email"].value,password = '',emp_name = emp_name,company = data["company"].value, staff_no = data["staff_no"].value, role_id = data["role"].value,status = 1)

                emp.save()
                # pass
                # utils.emp_hierarchyupdate(emp.emp_id,fun_own,3)
                # utils.emp_hierarchyupdate(emp.emp_id,man_manager,2)
                # utils.emp_hierarchyupdate(emp.emp_id,rep_manager,1)
                if(data["fun_own"].value == 0):
                    utils.emp_hierarchyupdate_id(emp.emp_id,emp.emp_id,3)
                else:
                    utils.emp_hierarchyupdate_id(emp.emp_id,data["fun_own"].value,3)
                if(data["man_manager"].value  == 0):
                    utils.emp_hierarchyupdate_id(emp.emp_id,emp.emp_id,2)
                else:
                    utils.emp_hierarchyupdate_id(emp.emp_id,data["man_manager"].value,2)
                if(data["rep_manager"].value  == 0):
                    utils.emp_hierarchyupdate_id(emp.emp_id,emp.emp_id,1)
                else:
                    utils.emp_hierarchyupdate_id(emp.emp_id,data["rep_manager"].value,1)
                
                #taking the default projects from constants
                default_projects = []
                for project in DefaultProjects:
                    default_projects.append(utils.strip_value(project.value))

                    
                #checking and updating the projects in projects table
                for project in default_projects:
                    proj_det = Project.objects.filter(name = project)
                    if len(proj_det) == 0:
                        proj = Project(name = project,code = '',status = 1)
                        proj.save()
                    else:
                        Project.objects.filter(name = project).update(status = 1)
                #taking all emails from the excel and updating employee project table if not present

            
                emp_id = emp.emp_id
                
                for project in default_projects:
                    proj_det = Project.objects.get(name = utils.strip_value(project))
                    emp_project_det = EmployeeProject.objects.filter(emp_id = emp_id,project_id=proj_det.id)
                    if len(emp_project_det) == 0:
                        emp_proj = EmployeeProject(emp_id = emp_id, project_id=proj_det.id,priority=0, status = 1)
                        emp_proj.save()

                # EmployeeDesignation(emp_id = emp_id,designation_id = data["designation"].value ).save()
                # setting is_married=False, patentry_maternity_cnt=0 as those fields are removed in serializer
                EmployeeProfile(emp_id = emp_id,category_id = data["category"].value, date_of_join = data["doj"].value, is_married=False, patentry_maternity_cnt=0, gender_id = data["gender"].value,location_id=data["location"].value, picture=data['user_pic'].value ).save()

                global_leave_access = GlobalAccessFlag.objects.filter(status=1,access_type__iexact='LEAVE')
                leave_access_grp_list = []
                leave_access_individual_list = []
                if(len(global_leave_access)>0):
                    leave_access_grp_list = list(map(lambda x:x.emp_id,Employee.objects.filter(role_id=4,status=1)))
                else:
                    leave_access_grp_obj = LeaveAccessGroup.objects.filter(status=1)
                    leave_access_grp_list = list(map(lambda x: x.emp_id,leave_access_grp_obj))
                    leave_access_individual_obj = LeaveAccessGroup.objects.filter(status=2)
                    leave_access_individual_list = list(map(lambda x: x.emp_id,leave_access_individual_obj))


                if((data["fun_own"].value != 0 and (data["fun_own"].value in leave_access_grp_list or emp_id in leave_access_individual_list)) or len(global_leave_access)>0 ):
                    # adding leaves
                    doj = datetime.strptime( data["doj"].value ,'%Y-%m-%d')
                    today = datetime.now()
                    month_diff = (today.year - doj.year)*12 + (today.month - doj.month)
                    days = doj.strftime("%d")

                    highest_credit = 0
                    new_hire_config = NewHireLeaveConfig.objects.filter(Q(category=data['category'].value)&Q(time_period__start_date=1))
                    if(len(new_hire_config)>0):
                        highest_credit = new_hire_config[0].round_off_leave_credit

                    leave_credits=NewHireLeaveConfig.objects.filter(Q(category=data['category'].value)&Q(time_period__start_date__lte=days)&Q(time_period__end_date__gte=days)&Q(status=1))
                    if(len(leave_credits)==0):
                        leave_credits = 0
                    else:
                        leave_credits = leave_credits[0].round_off_leave_credit

                    total_leave_credit=leave_credits+ (highest_credit * month_diff)
                    # print("total leave credits",total_leave_credit )

                    LeaveBalance(emp_id=emp_id,year=today.year,month=today.month,leave_credits=total_leave_credit,status=1).save()
                    log.info("Leave credited {} for emp_id {}".format(leave_credits,emp_id))
                else:
                     log.info("Leave balance is not added for emp_id {} as Leave access is not enabled".format(emp_id))
                

                # If device_id  and amd_id is available in request body then adding those to Employee Master

                device_id = data['device_id'].value
                amd_id =  decimal.Decimal(data['amd_id'].value)
                # Checking Device ID and AMD ID is already exists for another employee or no 
                if ((EmployeeMaster.objects.using('attendance').filter(Q(DeviceId=device_id) & ~Q(EmpId=data["staff_no"].value) & ~Q(DeviceId=0)).exists())):
                    return Response(utils.StyleRes(False,"Employee update failed",[{'device_id':["HID {} already exists for another employee.".format(device_id)]}]), status=StatusCode.HTTP_BAD_REQUEST)
                
                if ((EmployeeMaster.objects.using('attendance').filter(Q(AmdId=amd_id) & ~Q(EmpId=data["staff_no"].value) & ~Q(AmdId=0)).exists())):
                    return Response(utils.StyleRes(False,"Employee update failed",[{'amd_id':["Alternative id {} already exists for another employee.".format(amd_id)]}]), status=StatusCode.HTTP_BAD_REQUEST)
                emp_master_data = EmployeeMaster.objects.using('attendance').create(EmpId=data["staff_no"].value,DeviceId=device_id,AmdId=amd_id,EmpName=emp_name)

                # new employee email with reset password link
                email_service.sendWelcomeMail(emp_id)

                # exp_time = int((datetime.now() + timedelta(hours=settings.FORGOT_PASSWORD_EXP_TIME)).timestamp())
                # userDetails =  {}
                # userDetails['email'] = emp.email
                # userDetails['type'] = 'forgotpassword'
                # userDetails['datetime'] = exp_time
                # conf_token = utils.encrypt(json.dumps(userDetails))
                # log.info(emp.email+" Welcome Email token: "+conf_token)
                # ctx={
                #     "token_url":settings.UI_URL+"reset-password/?token="+conf_token,
                #     "name":emp.emp_name,
                # }
                # template = get_template('welcome.html')
                # mail_content = template.render(ctx)

                # try:
                #     if(settings.SENDEMAILTOALL):
                #         send_mail(MailConfigurations.Welcome.value, mail_content, settings.EMAIL_FROM, [emp.email], html_message=mail_content)
                #         log.info("WELCOME MAIL SENT TO {}".format(emp.email))
                #     else:
                #         if(emp.email in settings.CUSTOM_EMAILS):
                #             send_mail(MailConfigurations.Welcome.value, mail_content, settings.EMAIL_FROM, [emp.email], html_message=mail_content)
                #             log.info("WELCOME MAIL SENT TO {}".format(emp.email))
                # except:
                #         log.error(traceback.format_exc())
                #         log.info("ERROR IN SENDING WELCOME MAIL TO {}".format(emp.email))

                # # managers email for new employee with employee name and employee id

                # emp_managers = {each.man_email:each.man_name for each in EmployeeHierarchy.objects.filter(emp_id = emp.emp_id).annotate(
                #     man_email = F('manager__email'),
                #     man_name = F('manager__emp_name')
                # )}
                

                # for each_man in emp_managers.keys():
                #     manager_ctx={
                #         "name":emp_managers[each_man],
                #         "emp_name":emp.emp_name,
                #         "staff_no":emp.staff_no

                #     }
                #     manager_template = get_template('manager_new_emp.html')
                #     manager_mail_content = manager_template.render(manager_ctx)

                #     #each_man = "rhitam@atai.ai" # for testing, sending all mail to rhitam@atai.ai
                #     try:
                #         if(settings.SENDEMAILTOALL):
                #             send_mail(MailConfigurations.New_emp_manager_mail_sub.value, manager_mail_content, settings.EMAIL_FROM, [each_man], html_message=manager_mail_content)
                #             log.info("MANAGER'S WELCOME MAIL SENT TO {}".format(each_man))
                #         elif(each_man in settings.CUSTOM_EMAILS):
                #             send_mail(MailConfigurations.New_emp_manager_mail_sub.value, manager_mail_content, settings.EMAIL_FROM, [each_man], html_message=manager_mail_content)
                #             log.info("MANAGER'S WELCOME MAIL SENT TO {}".format(each_man))
                #     except:
                #         log.info("ERROR IN SENDING MANAGER'S WELCOME MAIL {}".format(each_man))

                return Response(utils.StyleRes(True,"new employee creation","new employee added successfully"),status=StatusCode.HTTP_CREATED)

            return Response(utils.StyleRes(False,"new employee creation failed",data.errors),status=StatusCode.HTTP_UNPROCESSABLE_ENTITY)
        except Exception as e:
            log.error(traceback.format_exc())
            return Response(utils.StyleRes(False,"new employee creation failed",e.args), status=409)



class AllProjects(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        project_serialized_data = ProjectSerializer(Project.objects.filter(Q(status=1),~Q(name__in = DefaultProjects.list())), many=True)
        return Response(utils.StyleRes(True,"All project list",project_serialized_data.data), status=StatusCode.HTTP_OK)
        
 
class EmployeeProjects(APIView):
    @jwttokenvalidator
    @custom_exceptions
    @is_manager
    def get(self,request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        emp_id=auth_details['emp_id']
        is_hr = auth_details['is_emp_admin']
        common_fun_obj=CommonFunctions()
        if(is_hr):
             emp_data = Employee.objects.allprojects().prefetch_related('emp','stage_employee').filter(Q(status=1)).annotate(staging_status=F('stage_employee__status'), staging_relieved=F('stage_employee__relieved')).order_by('staff_no')
        else:
            emp_of_manager=common_fun_obj.get_employees_list(emp_id)
            emp_data = Employee.objects.allprojects().prefetch_related('emp','stage_employee').filter(Q(status=1),emp_id__in=emp_of_manager).annotate(staging_status=F('stage_employee__status'), staging_relieved=F('stage_employee__relieved')).order_by('staff_no')

        resp=[]
        for each in emp_data:
            projects = {str(proj.priority):proj.project_id for proj in each.employeeproject_set.filter(~Q(project__name__in = DefaultProjects.list()))}
            staged = {str(empl.priority):empl.project_id for empl in each.empl.filter()}
            resp.append({"emp_id":each.emp_id,"staff_no":each.staff_no,"emp_name":each.emp_name,"company":each.company,"p1":projects['1'] if '1' in projects.keys() else "","p2":projects['2'] if '2' in projects.keys() else "","p3":projects['3'] if '3' in projects.keys() else "","staged":{"p1":staged['1'] if '1' in staged.keys() else "","p2":staged['2'] if '2' in staged.keys() else "","p3":staged['3'] if '3' in staged.keys() else ""}, 'staging_status':each.staging_status ,'staging_relieved':each.staging_relieved})
        return Response(utils.StyleRes(True,"Employee project list",resp),status=StatusCode.HTTP_OK)

    @jwttokenvalidator
    @custom_exceptions
    @is_manager
    def post(self,request,*args,**kargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        serial_update_proj_data = UpdateProjectSerializer(data=request.data)

        if(serial_update_proj_data.is_valid() == True):

            proj1 = serial_update_proj_data.data.get("proj1")
            proj2 = serial_update_proj_data.data.get("proj2")
            proj3 = serial_update_proj_data.data.get("proj3")
            
            projs = []
            

            try:
                emp_data = Employee.objects.allprojects().get(emp_id=serial_update_proj_data.data.get("emp_id"))
            except Employee.DoesNotExist:
                log.error("employee does not exist for id {}".format(request.data.get("emp_id")))
                return Response(utils.StyleRes(False,"Employee does not exist",{}), status = StatusCode.HTTP_BAD_REQUEST )

            for proj_id in [proj1,proj2,proj3]:
                

                if (proj_id == "" or  proj_id == 0 or  proj_id == None) :
                    proj_id=0
                    continue
                elif(proj_id in projs):
                    return Response(utils.StyleRes(False,"Projects should not be duplicated",{}), status = StatusCode.HTTP_BAD_REQUEST )
                projs.append(proj_id)
            


            existing_projs = [ep.project_id for ep in emp_data.employeeproject_set.filter(~Q(project__name__in = DefaultProjects.list())).order_by('priority')]
            
            if(len(existing_projs)==0):
                proj_list = list(filter(None,map(lambda x : x if x!=0 else None,projs)))
                
                for i in range(0,len(proj_list)):
                    project_det = Project.objects.get(id = proj_list[i])
                    disabled_proj =  EmployeeProject.objects.filter(emp_id = emp_data.emp_id,project_id = project_det.id,status = 0)

                    if(len(disabled_proj)>0):
                        disabled_proj.update(priority = i+1,status = 1)
                        log.info("activated disabled project for emp_id {} project_id {} priority {}".format(emp_data.emp_id,project_det.id,i+1))
                    else:
                        emp_proj = EmployeeProject(emp_id = emp_data.emp_id,project_id = project_det.id,priority = i+1,status = 1)
                        emp_proj.save()
                        log.info("added project for emp_id {} project_id {} priority {}".format(emp_data.emp_id,project_det.id,i+1))
            else:
                proj_list = list(map(lambda x : x if x!=0 else 0,projs))
                # fill the list with 0 (zeros) for empty projects

                proj_list = proj_list + [0]*(3 - len(proj_list))
                existing_projs = existing_projs + [0]*(3 - len(existing_projs))

                for i in range(0,len(proj_list)):
                    ex_stg_emp_proj = {sep.priority:sep.project_id for sep in StageEmployeeProject.objects.filter(emp_id = emp_data.emp_id,status = 1)}
                    # if there is no active projects other than defaults adding the projects directly
                    if(len(existing_projs)>0 and existing_projs[i]==proj_list[i]):
                        log.info("existing project not changed for emp_id {} project {}".format(emp_data.emp_id,proj_list[i] ))
                        if(i+1 in ex_stg_emp_proj.keys()):
                            ex_stg_emp_proj = StageEmployeeProject.objects.filter(emp_id = emp_data.emp_id,priority = i+1,status = 1).update(status=0)
                            log.info("disable staged project for emp_id {} priority {}".format(emp_data.emp_id,i+1))
                     # if active projects are there other than defaults adding the projects into the staged table
                    else:
                        
                        if(i+1 in ex_stg_emp_proj.keys()):
                            ex_stg_emp_proj = StageEmployeeProject.objects.filter(emp_id = emp_data.emp_id,priority = i+1,status = 1).update(project_id =  proj_list[i])
                            log.info("priority has been updated for emp_id {} project_id {} priority {}".format(emp_data.emp_id,proj_list[i],i+1))
                        else:
                            stg_emp_proj = StageEmployeeProject(emp_id = emp_data.emp_id,project_id =  proj_list[i],priority = i+1,status = 1)
                            stg_emp_proj.save()
                            log.info("added to staged table project_id {} emp_id {} priority {}".format(proj_list[i],emp_data.emp_id,i+1))

            return Response(utils.StyleRes(True,"projects have been added successfully",{}),status=StatusCode.HTTP_CREATED)
        else:
            return Response(utils.StyleRes(False,serial_update_proj_data.errors,{}), status = StatusCode.HTTP_BAD_REQUEST )



class EmpManagers(APIView):
    
    @jwttokenvalidator
    @is_manager
    @custom_exceptions
    def get(self,request,*args,**kwargs):

        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        emp_id=auth_details['emp_id']
        is_emp_admin = auth_details["is_emp_admin"]
        is_sub_edmin = auth_details["sub_report_access"]
        emp_manager_list = []
        # emp_type = self.request.query_params.get('type',None)
        # if(emp_type == 'hr'):
        if(is_emp_admin == True or len(is_sub_edmin)>0):
            emp_list=Employee.objects.prefetch_related('emp','stage_employee').filter(Q(status=1)).annotate(staging_status=F('stage_employee__status'), staging_relieved=F('stage_employee__relieved'))
        else:
            # auth_details = utils.validateJWTToken(request)
            # if(auth_details['email']==""):
            #     return Response(auth_details, status=400)
            # emp_id=auth_details['emp_id']
            direct_indirect_emps = EmployeeHierarchy.objects.direct_indirect_employees(manager_id=emp_id).values('emp_id')
            emp_list=Employee.objects.prefetch_related('emp','stage_employee').filter(status=1,emp_id__in=direct_indirect_emps).annotate(staging_status=F('stage_employee__status'), staging_relieved=F('stage_employee__relieved'))
        for each in emp_list:
            emp_manager_list.append({ 'emp_id':each.emp_id, 'email':each.email, 'staff_no':each.staff_no,'emp_name':each.emp_name, 'company':each.company, 'role':each.role_id, 'managers': { man.priority : { 'emp_id': man.manager_id,'emp_name':man.manager.emp_name } for man in each.emp.all()} ,'staging_status':each.staging_status,'staging_relieved' : each.staging_relieved
             })

        return Response(utils.StyleRes(True,"All employee managers list",emp_manager_list), status=StatusCode.HTTP_OK)


    @jwttokenvalidator
    @custom_exceptions
    @is_manager
    def post(self,request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        emp_role = auth_details["role_id"]
        emp_name = Employee.objects.filter(emp_id=auth_details['emp_id']).values_list('emp_name',flat=True)[0]
        # if(emp_role <=1 and  auth_details["is_emp_admin"]):
        #      return Response(utils.StyleRes(False,"Manager update error",'User does not have permission'), status=StatusCode.HTTP_UNAUTHORIZED)

        validated_data = EmpManagersSerializer(data=request.data)
        if(validated_data.is_valid()):
            old_managers = {}
            emp_details = Employee.objects.filter(emp_id=validated_data['emp_id'].value)[0]

            direct_emps = EmployeeHierarchy.objects.directemployees(manager_id=validated_data['emp_id'].value).values_list("emp_id",flat=True)
            # NOT USING STAGING TABLE
            # stg_direct_emps = StageEmployeeHierarchy.objects.filter(Q(manager_id=validated_data['emp_id'].value) & Q(priority=1) & Q(emp__status=1) & Q(status=1)).values_list("emp_id",flat=True)
            # stg_direct_emps_diff_rm = StageEmployeeHierarchy.objects.filter( Q(emp_id__in=direct_emps) & ~Q(manager_id=validated_data['emp_id'].value) & Q(priority=1) & Q(emp__status=1) & Q(status=1)).values_list("emp_id",flat=True)
            
            # print("direct_emps  ",direct_emps)
            # print("stg_direct_emps  ",stg_direct_emps)
            # print("stg_direct_emps_diff_rm ",stg_direct_emps_diff_rm)
            # direct_emps = set(direct_emps).union(set(stg_direct_emps)).difference(set(stg_direct_emps_diff_rm))
            indirect_emps = []
            if(emp_details.role_id==3):
                for each_direct_emp in direct_emps:
                    indirect_direct_emps = []
                    indirect_direct_emps.extend(EmployeeHierarchy.objects.directemployees(manager_id=each_direct_emp).values_list("emp_id",flat=True))
                    # stg_indirect_emps = StageEmployeeHierarchy.objects.filter(Q(manager_id=each_direct_emp) & Q(priority=1) & Q(emp__status=1) & Q(status=1)).values_list("emp_id",flat=True)
                    # stg_indirect_emps_diff_rm = StageEmployeeHierarchy.objects.filter( Q(emp_id__in=indirect_direct_emps) & ~Q(manager_id=each_direct_emp) & Q(priority=1) & Q(emp__status=1) & Q(status=1)).values_list("emp_id",flat=True)
                    # indirect_direct_emps = set(indirect_direct_emps).union(set(stg_indirect_emps)).difference(set(stg_indirect_emps_diff_rm))
                    indirect_emps.extend(indirect_direct_emps)
            fm = EmployeeHierarchy.objects.get(emp_id = validated_data['emp_id'].value,priority = 3,status = 1)
            old_fm = Employee.objects.filter(emp_id=fm.manager_id).values()[0]
            old_managers.update({3:old_fm})
            if(fm.manager_id != validated_data['fun_own'].value):
                self.stg_emp_hierarchyupdate(validated_data['emp_id'].value,validated_data['fun_own'].value,3)
                if(emp_details.role_id==2):
                    self.bulk_emp_hierarchyupdate(direct_emps,validated_data['fun_own'].value,3)
            else:
                pass
                # emp_stg_fun_mgr=StageEmployeeHierarchy.objects.filter(emp_id = validated_data['emp_id'].value,priority = 3,status = 1)
                
                # if(emp_details.role_id==2 and len(emp_stg_fun_mgr)>0):
                #     StageEmployeeHierarchy.objects.filter(emp_id__in = direct_emps,manager_id = emp_stg_fun_mgr[0].manager.emp_id,priority = 3,status = 1).update(status=0)
                # emp_stg_fun_mgr.update(status=0)

            mm = EmployeeHierarchy.objects.get(emp_id = validated_data['emp_id'].value,priority = 2,status = 1)
            old_mm = Employee.objects.filter(emp_id=mm.manager_id).values()[0]
            old_managers.update({2:old_mm})
            if(mm.manager_id != validated_data['man_manager'].value):
                self.stg_emp_hierarchyupdate(validated_data['emp_id'].value,validated_data['man_manager'].value,2)

            else:
                pass
            #     StageEmployeeHierarchy.objects.filter(emp_id = validated_data['emp_id'].value,priority = 2,status = 1).update(status=0)


            rm = EmployeeHierarchy.objects.get(emp_id = validated_data['emp_id'].value,priority = 1,status = 1)
            old_rm = Employee.objects.filter(emp_id=rm.manager_id).values()[0]
            old_managers.update({1:old_rm})
            if(rm.manager_id != validated_data['rep_manager'].value):
                self.stg_emp_hierarchyupdate(validated_data['emp_id'].value,validated_data['rep_manager'].value,1)  
                if(emp_details.role_id==3):
                    self.bulk_emp_hierarchyupdate(direct_emps,validated_data['rep_manager'].value,3)
                if(emp_details.role_id==2):
                    self.bulk_emp_hierarchyupdate(direct_emps,validated_data['rep_manager'].value,2)
                if(len(indirect_emps)>0):
                    self.bulk_emp_hierarchyupdate(indirect_emps,validated_data['rep_manager'].value,3)
                
            

            else:
                pass
                # emp_stg_rep_mgr=StageEmployeeHierarchy.objects.filter(emp_id = validated_data['emp_id'].value,priority = 1,status = 1)
                # if(len(emp_stg_rep_mgr)>0):
                #     if(emp_details.role_id==3):
                #         StageEmployeeHierarchy.objects.filter(emp_id__in = direct_emps,manager_id = emp_stg_rep_mgr[0].manager.emp_id,priority = 3,status = 1).update(status=0)
                #     if(emp_details.role_id==2):
                #         print("direct ",direct_emps,validated_data['rep_manager'].value)
                #         StageEmployeeHierarchy.objects.filter(emp_id__in = direct_emps,manager_id = emp_stg_rep_mgr[0].manager.emp_id,priority = 2,status = 1).update(status=0)
                #     if(len(indirect_emps)>0):
                #         StageEmployeeHierarchy.objects.filter(emp_id__in = indirect_emps,manager_id = emp_stg_rep_mgr[0].manager.emp_id,priority = 3,status = 1).update(status=0)

                # emp_stg_rep_mgr.update(status=0)
            if (fm.manager_id != validated_data['fun_own'].value) or (mm.manager_id != validated_data['man_manager'].value) or (rm.manager_id != validated_data['rep_manager'].value):
                # print(old_managers)
                email_service.sendTransferMail(validated_data['emp_id'].value,old_managers,emp_name)
            return Response(utils.StyleRes(True,"All employee managers list",''), status=StatusCode.HTTP_OK)
        else:
            return Response(utils.StyleRes(False,"All employee managers list",validated_data.errors), status=409)
 
    def bulk_emp_hierarchyupdate(self,emps,man_empid,priority):
        inputdata = []
        for each_emp_id in emps:
            self.stg_emp_hierarchyupdate(each_emp_id,man_empid,priority)
        #     inputdata.append({"emp":each_emp_id,"manager":man_empid,"priority":priority,"status":1})
        # emp_proj_ser=StageEmployeeHierarchySerializer(data=inputdata,many=True)
        # if(emp_proj_ser.is_valid()):
        #     emp_proj_ser.save()    

    def stg_emp_hierarchyupdate(self,emp_id,man_empid,priority):
        EmployeeHierarchy.objects.filter(emp_id = emp_id,priority = priority,status = 1).update(manager_id = man_empid)
        # emp_hierarchy = StageEmployeeHierarchy.objects.filter(emp_id = emp_id,priority = priority)
        # if len(emp_hierarchy) == 0:
        #     emp_hie = StageEmployeeHierarchy(emp_id = emp_id,manager_id = man_empid,priority = priority,status = 1)
        #     emp_hie.save()
        # else:
        #     emp_hie = StageEmployeeHierarchy.objects.filter(emp_id = emp_id,priority = priority).update(manager_id = man_empid,status = 1)
    
class ManagersReporters(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        
        emp_role_id=auth_details['role_id']
        try:
            emp_id  = request.query_params.get("emp_id", None)
            if(emp_id == None):
                emp_id= auth_details['emp_id']
            indirect_flag  = request.query_params.get("indirect", None)
            resp ={}
            if emp_id:
                emp_details = Employee.objects.filter(emp_id = emp_id).values('emp_id','email','emp_name','staff_no','role').annotate(
                    status = Case(
                        When(status=1,then=V('active')),
                        default=V('inactive'),
                        output_field=CharField(),
                    )
                )
                if (len(emp_details) ==0):
                    return Response(utils.StyleRes(False,"Employee does not exist",{}), status=StatusCode.HTTP_UNPROCESSABLE_ENTITY)
                
                    
                
                resp = list(emp_details)[0]
                emp_id = resp['emp_id']
                status = resp['status']
                if(status=='inactive'):
                    repoters_details = []
                else:
                    # role_upper_bound = emp_role_id if emp_role_id <= emp_details[0]['role'] else emp_details[0]['role']
                    # role_lower_bound = emp_details[0]['role']-1 if (emp_details[0]['role']-1) >2 else 2
                    if(indirect_flag=='true' or indirect_flag == 'True'):
                        repoters_details = EmployeeHierarchy.objects.filter(manager_id = emp_id, 
                        # emp__role_id__lte=role_upper_bound,emp__role_id__gte=role_lower_bound,
                        emp__status=1).values('emp_id').distinct().annotate(
                        emp_name = F('emp__emp_name'),
                        email = F('emp__email'),
                        staff_no = F('emp__staff_no'),
                        role = F('emp__role')   
                        )

                    else:
                        repoters_details = list(EmployeeHierarchy.objects.filter(manager_id = emp_id,
                        priority=1,
                        # emp__role_id__lte=role_upper_bound,emp__role_id__gte=role_lower_bound,
                        emp__status=1).values('emp_id').distinct().annotate(
                        emp_name = F('emp__emp_name'),
                        email = F('emp__email'),
                        staff_no = F('emp__staff_no'),
                        role = F('emp__role')   
                        ))
                        # print("repoters_details",repoters_details)
                        #repoters_details_ids = EmployeeHierarchy.objects.filter(manager_id = emp_id,
                        #priority=1, emp__status=1).values_list('emp_id',flat=True)

                        # stg_repoters_details = list(StageEmployeeHierarchy.objects.filter(Q(manager_id = emp_id) & Q(priority=1) &
                        # # emp__role_id__lte=role_upper_bound,emp__role_id__gte=role_lower_bound,
                        # Q(emp__status=1) & Q(status=1)).values('emp_id').distinct().annotate(
                        # emp_name = F('emp__emp_name'),
                        # email = F('emp__email'),
                        # staff_no = F('emp__staff_no'),
                        # role = F('emp__role')   
                        # ))
                        # stg_repoters_details_diff_rm = list(StageEmployeeHierarchy.objects.filter(Q(emp_id__in=repoters_details_ids) & ~Q(manager_id = emp_id) & Q(priority=1) &
                        # # emp__role_id__lte=role_upper_bound,emp__role_id__gte=role_lower_bound,
                        # Q(emp__status=1) & Q(status=1)).values('emp_id').distinct().annotate(
                        # emp_name = F('emp__emp_name'),
                        # email = F('emp__email'),
                        # staff_no = F('emp__staff_no'),
                        # role = F('emp__role')   
                        # ))
                        # for each_stg_repoters_details in stg_repoters_details:
                        #     if each_stg_repoters_details not in repoters_details:
                        #         repoters_details.append(each_stg_repoters_details)
                        # for each_stg_repoters_details_diff_rm in stg_repoters_details_diff_rm:
                        #     if each_stg_repoters_details_diff_rm in repoters_details:
                        #         repoters_details.remove(each_stg_repoters_details_diff_rm)

                resp['reporters'] = repoters_details
            else:
                return Response(utils.StyleRes(False,"Employee does not exist",{}), status=StatusCode.HTTP_UNPROCESSABLE_ENTITY)
            return Response(utils.StyleRes(True,"First level reporters for the manager",resp), status=StatusCode.HTTP_OK)
            
        except Exception as e:
            log.error(traceback.format_exc())
            return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['something_went_wrong'],{}), status=StatusCode.HTTP_UNPROCESSABLE_ENTITY)

class EmployeeEntryComplianceStatus(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self, request, *args, **kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        emp_id = auth_details['emp_id']
        # print("emp_id",emp_id)
        # resp=[]
        resp = email_service.getEmployeeEntryCompliance(emp_id)
        return Response(utils.StyleRes(True,"Employee entry compliance status for last 5 weeks",resp), status=StatusCode.HTTP_OK)

class ChangeRole(APIView):
    @jwttokenvalidator
    @custom_exceptions
    @is_manager 
    def post(self,request):
        # print("change role")
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        is_hr = auth_details['is_emp_admin']
        role_id = auth_details['role_id']
        if((not(is_hr)) and (role_id < 4)):
            return Response(utils.StyleRes(False,"Unauthorized Login"), status=StatusCode.HTTP_UNAUTHORIZED)
        serial_data = ChangeRoleSerializer(data=request.data)
        if(serial_data.is_valid()):
            emp_role_id = Employee.objects.filter(emp_id=serial_data['emp_id'].value)[0].role_id
            if(emp_role_id > serial_data['role_id'].value ):
                all_reporters = EmployeeHierarchy.objects.direct_indirect_employees(Q(manager_id=serial_data['emp_id'].value) & ~Q(emp_id=serial_data['emp_id'].value))
                # print(all_reporters)
                if(len(all_reporters)>0 ):
                    return Response(utils.StyleRes(False,"Change role","There should not be any reporters reporting while downgrading the role"), status=409)
            if(emp_role_id < 4 and serial_data['role_id'].value==4):
                
                emps = EmployeeHierarchy.objects.filter(manager_id=serial_data['emp_id'].value)
                emp_p2=emps.filter(priority=2).values_list('emp_id',flat=True)
                emp_p1=emps.filter(priority=1).values_list('emp_id',flat=True)
                if(emp_role_id==3):
                    emp_l1=set(emp_p2).intersection(set(emp_p1))
                    emp_l0=set(emp_p2).difference(set(emp_l1))
                    self.bulk_emp_hierarchyupdate(emp_l1,serial_data['emp_id'].value,3)
                    self.bulk_emp_hierarchyupdate(emp_l0,serial_data['emp_id'].value,3)
                if(emp_role_id==2):
                    self.bulk_emp_hierarchyupdate(emp_p1,serial_data['emp_id'].value,2)
                    self.bulk_emp_hierarchyupdate(emp_p1,serial_data['emp_id'].value,3)
                EmployeeHierarchy.objects.filter(emp_id=serial_data['emp_id'].value).update(manager_id=serial_data['emp_id'].value)
            elif(emp_role_id < 3 and serial_data['role_id'].value==3):
                emps = EmployeeHierarchy.objects.filter(manager_id=serial_data['emp_id'].value)
                emp_l0=emps.filter(priority=1).values_list('emp_id',flat=True)
                self.bulk_emp_hierarchyupdate(emp_l0,serial_data['emp_id'].value,2)
                man_l3=EmployeeHierarchy.objects.filter(emp_id=serial_data['emp_id'].value,priority=3)[0]
                EmployeeHierarchy.objects.filter(Q(emp_id=serial_data['emp_id'].value) & ~Q(priority=3)).update(manager_id=man_l3.manager_id)
            elif(emp_role_id < 2 and serial_data['role_id'].value==2):
                man_l2=EmployeeHierarchy.objects.filter(emp_id=serial_data['emp_id'].value,priority=2)[0]
                EmployeeHierarchy.objects.filter(Q(emp_id=serial_data['emp_id'].value) & Q(priority=1)).update(manager_id=man_l2.manager_id)
            Employee.objects.filter(emp_id=serial_data['emp_id'].value).update(role_id=serial_data['role_id'].value)
            # stg_direct_emps = StageEmployeeHierarchy.objects.filter(Q(manager_id=serial_data['emp_id'].value) & Q(emp__status=1) & Q(status=1)& Q(priority=1)).values_list("emp_id",flat=True)
            # stg_direct_emps_diff_rm = StageEmployeeHierarchy.objects.filter( Q(emp_id__in=direct_emps) & ~Q(manager_id=serial_data['emp_id'].value) & Q(priority=1) & Q(emp__status=1) & Q(status=1)).values_list("emp_id",flat=True)
            # print(direct_emps)
            # print("-------stg------------")
            # print(stg_direct_emps)
            # print("--------diff-----------")
            # print(stg_direct_emps_diff_rm)
            # print("---------final----------")
            
            # direct_emps = set(direct_emps).union(set(stg_direct_emps)).difference(set(stg_direct_emps_diff_rm))
            # print(direct_emps)
            # print("direct_emps  ",direct_emps)
            # print("stg_direct_emps  ",stg_direct_emps)
            # print("stg_direct_emps_diff_rm ",stg_direct_emps_diff_rm)
            # direct_emps = set(direct_emps).union(set(stg_direct_emps)).difference(set(stg_direct_emps_diff_rm))
            # indirect_emps = []
            # if(emp_details.role_id==3):
            #     for each_direct_emp in direct_emps:
            #         indirect_direct_emps = []
            #         indirect_direct_emps.extend(EmployeeHierarchy.objects.directemployees(manager_id=each_direct_emp).values_list("emp_id",flat=True))
            #         stg_indirect_emps = StageEmployeeHierarchy.objects.filter(Q(manager_id=each_direct_emp) & Q(priority=1) & Q(emp__status=1) & Q(status=1)).values_list("emp_id",flat=True)
            #         stg_indirect_emps_diff_rm = StageEmployeeHierarchy.objects.filter( Q(emp_id__in=indirect_direct_emps) & ~Q(manager_id=each_direct_emp) & Q(priority=1) & Q(emp__status=1) & Q(status=1)).values_list("emp_id",flat=True)
            #         indirect_direct_emps = set(indirect_direct_emps).union(set(stg_indirect_emps)).difference(set(stg_indirect_emps_diff_rm))
            #         indirect_emps.extend(indirect_direct_emps)
        else:
            return Response(utils.StyleRes(False,"Change role",serial_data.errors), status=StatusCode.HTTP_BAD_REQUEST)
        return Response(utils.StyleRes(True,"Change role",[]), status=StatusCode.HTTP_OK)
    def bulk_emp_hierarchyupdate(self,emps,man_empid,priority):
        inputdata = []
        for each_emp_id in emps:
            self.stg_emp_hierarchyupdate(each_emp_id,man_empid,priority)
        #     inputdata.append({"emp":each_emp_id,"manager":man_empid,"priority":priority,"status":1})
        # emp_proj_ser=StageEmployeeHierarchySerializer(data=inputdata,many=True)
        # if(emp_proj_ser.is_valid()):
        #     emp_proj_ser.save()    

    def stg_emp_hierarchyupdate(self,emp_id,man_empid,priority):
        
        EmployeeHierarchy.objects.filter(emp_id = emp_id,priority = priority,status = 1).update(manager_id = man_empid)
        # emp_hierarchy = StageEmployeeHierarchy.objects.filter(emp_id = emp_id,priority = priority)
        # if len(emp_hierarchy) == 0:
        #     emp_hie = StageEmployeeHierarchy(emp_id = emp_id,manager_id = man_empid,priority = priority,status = 1)
        #     emp_hie.save()
        # else:
        #     emp_hie = StageEmployeeHierarchy.objects.filter(emp_id = emp_id,priority = priority).update(manager_id = man_empid,status = 1)

class TransferEmp(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        emps = EmployeeHierarchy.objects.filter(manager_id=request.query_params.get('emp_id')).distinct().values('emp_id').annotate(
            emp_name = F('emp__emp_name')
        )
        
        return Response(utils.StyleRes(True,"transfer emp role",list(emps)), status=StatusCode.HTTP_OK)
    @jwttokenvalidator
    @custom_exceptions
    def post(self,request):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        validated_data = EmpManagersSerializer(data=request.data)
        if(validated_data.is_valid()):
            current_fun_own = EmployeeHierarchy.objects.filter(Q(emp_id=validated_data['emp_id'].value) & Q(priority=3))[0].manager_id
            current_man_manager = EmployeeHierarchy.objects.filter(Q(emp_id=validated_data['emp_id'].value) & Q(priority=2))[0].manager_id
            
            p1=EmployeeHierarchy.objects.filter(~Q(emp_id=validated_data['emp_id'].value) & Q(manager_id=validated_data['emp_id'].value) & Q(priority=1))
            p2=EmployeeHierarchy.objects.filter(~Q(emp_id=validated_data['emp_id'].value) & Q(manager_id=validated_data['emp_id'].value) & Q(priority=2))
            p1_p2 = set(p1.values_list('emp_id',flat=True)).union(set(p2.values_list('emp_id',flat=True)))

            if(validated_data['rep_manager'].value != validated_data['emp_id'].value):
               
                p1.update(manager_id=validated_data['rep_manager'].value)

            if(validated_data['fun_own'].value != current_fun_own):
                p3=EmployeeHierarchy.objects.filter(~Q(emp_id=validated_data['emp_id'].value) & Q(manager_id=validated_data['emp_id'].value) & Q(priority=3))
                p3.update(manager_id=validated_data['fun_own'].value)
                EmployeeHierarchy.objects.filter(emp_id__in=p1_p2,manager_id=current_fun_own).update(manager_id=validated_data['fun_own'].value)

            if(validated_data['man_manager'].value != current_man_manager):
                EmployeeHierarchy.objects.filter(emp_id__in=p1_p2,manager_id=current_man_manager).update(manager_id=validated_data['man_manager'].value)
                p2.update(manager_id=validated_data['man_manager'].value)

            
            return Response(utils.StyleRes(True,"transfer emp role",[]), status=StatusCode.HTTP_OK)
        else:
            return Response(utils.StyleRes(False,"transfer emp role error ",validated_data.errors), status=StatusCode.HTTP_BAD_REQUEST)

class EmployeeDetails(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        emp_name = request.query_params.get('emp_name','')
        emp_obj = Employee.objects.filter(emp_name__iexact=emp_name,status=1).prefetch_related(
            'emp','profile'
        ).annotate(
            image_name = F('profile__picture')
        )
        response=list(emp_obj.values('emp_id','emp_name','email','company','staff_no','created','role_id','image_name'))
        if(len(emp_obj)==0):
            return Response({'msg':'No user found with name {}'.format(emp_name)},status=StatusCode.HTTP_NOT_FOUND)
        for each in emp_obj[0].emp.all():
            if(each.priority==1):
                response[0]['reporting_manager']=each.manager.emp_name
            elif(each.priority==2):
                response[0]['managers_manager']=each.manager.emp_name
            elif(each.priority==3):
                response[0]['functional_manager']=each.manager.emp_name
        today = datetime.now().date()
        leave_requests_obj = LeaveRequest.objects.prefetch_related(Prefetch('leave_set',queryset=Leave.objects.filter(leave_request__emp__emp_name=emp_name,leave_on__date=today))).filter((Q(emp__emp_name=emp_name))&(Q(startdate__lte=today)) & (Q(enddate__gte=today)) & (Q(status__in =[1,4,5])) & ~(Q(leavediscrepancy__status__in =[1]))).annotate(
            leave_on_ = F('leave__leave_on'),
            day_leave_type = F('leave__day_leave_type')
        )
        leave_flag=False
        multi_leave=False
        day_leave_type=""
        startdate=""
        enddate=""
        for each in leave_requests_obj:
            if(each.leave_on_):
                leave_flag=True
                startdate = each.startdate
                enddate = each.enddate
                day_leave_type = each.day_leave_type
        if(startdate!=enddate):
            multi_leave = True
        if(response[0]['image_name']!=None and response[0]['image_name']!=""):
            response[0]['image_name'] = os.path.join(settings.PROFILE_IMAGE_URL,response[0]['image_name'])
        response[0]['leave_flag']=leave_flag
        response[0]['startdate']=startdate
        response[0]['enddate']=enddate
        response[0]['day_leave_type']=day_leave_type
        response[0]['multi_leave']=multi_leave
        return Response(response,status=200)

class AllActiveInActiveProjects(APIView):
    # get api for getting all active and inactive projects
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        project_serialized_data = ProjectSerializer(Project.objects.filter(), many=True)
        return Response(utils.StyleRes(True,"All project list",project_serialized_data.data), status=StatusCode.HTTP_OK)

    # post api for saving new projects
    @jwttokenvalidator
    @custom_exceptions
    # @is_manager
    def post(self,request):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        emp_id=auth_details['emp_id']
        is_hr = auth_details['is_emp_admin']
        email = str(auth_details['email'])
        if(is_hr | (email in settings.ADMINS_TO_ACCESS_REPORTS)):
            exitingProject = Project.objects.filter(name = request.data['name']).exists()
            if (exitingProject):
                return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['project_exitst'],{}), status=StatusCode.HTTP_BAD_REQUEST)
            else :
                validated_data = ProjectSerializer(data=request.data)
                if(validated_data.is_valid()):
                    proj = Project(name = validated_data['name'].value)
                    proj.save()
                    return Response(utils.StyleRes(True,"New project saved",[]), status=StatusCode.HTTP_CREATED)
                else:
                    return Response(utils.StyleRes(False,validated_data.errors,{}), status = StatusCode.HTTP_NOT_ACCEPTABLE)
        else:
            return Response(utils.StyleRes(False,'Unautherized User',{}), status = StatusCode.HTTP_UNAUTHORIZED)


