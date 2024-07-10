from vedikaweb.vedikaapi.decorators import servicejwttokenvalidator, custom_exceptions
from rest_framework.views import APIView
from vedikaweb.vedikaapi.serializers import LoginSerializer, ServieLoginSerializer
from vedikaweb.vedikaapi.models import Employee, ServiceAccount, EmployeeHierarchy
from hashlib import md5
from rest_framework.response import Response

from vedikaweb.vedikaapi.constants import EmpStatus,StatusCode
from vedikaweb.vedikaapi.utils import utils
from django.conf import settings

from django.db.models import Q,F,CharField, Case, When, Value as V

from django.core.paginator import Paginator
import traceback, json
import logging
from django.db.models import When, Case
log = logging.getLogger(__name__)


class ServiceLoginView(APIView):
    def get_serializer(self):
        return ServieLoginSerializer()
    def post(self, request):
        try:
            serialized = ServieLoginSerializer(data=request.data)
            if (serialized.is_valid()):
                api_user = serialized.data['api_user']
                password = serialized.data['password']

                #Check api_user and user name already exists..
                user = None
                try:
                    # TODO: USE MD5 OR HASH TO GET DB PASSWORD
                    hashpass = md5(password.encode('utf8')).hexdigest()
                    user =  ServiceAccount.objects.get(api_user=api_user, password=hashpass)
                except ServiceAccount.DoesNotExist:
                    log.error("Failed to login service account = "+api_user)
                    return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['invalidlogins'],{}), status=StatusCode.HTTP_UNAUTHORIZED)

                # Checking Employee is active or not
                if(user.status == EmpStatus.InActive):
                    return Response(utils.StyleRes(False,"Inactive Service account",{}), status=StatusCode.HTTP_UNAUTHORIZED)

                try:
                    payload = utils.getServiceToken(request)
                    return Response(utils.StyleRes(True,settings.VALID_ERROR_MESSAGES['access_token'],payload), status=StatusCode.HTTP_OK)
                except Exception as e:
                    log.error(traceback.format_exc())
                    return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['something_went_wrong'],{}), status=StatusCode.HTTP_UNPROCESSABLE_ENTITY)
            else:
                return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['invalid_inputs'], serialized._errors), status=StatusCode.HTTP_EXPECTATION_FAILED)
        except Exception as e:
            log.error(traceback.format_exc())
            return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['something_went_wrong'],{}), status=StatusCode.HTTP_UNPROCESSABLE_ENTITY)


class ValidateEmployee(APIView):
    @servicejwttokenvalidator
    @custom_exceptions
    def post(self,request):
        auth_details = utils.validateServiceToken(request)
        if(auth_details['results']['api_user']==""):
            return Response(auth_details, status=401)
        try:
            serialized = LoginSerializer(data=request.data)
            if (serialized.is_valid()):
                email = serialized.data['email']
                password = serialized.data['password']
                # TODO: USE MD5 OR HASH TO GET DB PASSWORD
                hashpass = md5(password.encode('utf8')).hexdigest()
                user =  Employee.objects.filter(email=email, password=hashpass)
                resp = {}
                if len(user)> 0:
                    if(len(user.filter(status=1))>0):
                        resp['status'] = 'active'
                    else:
                        resp['status'] = 'inactive'
                    return Response(utils.StyleRes(True,"Employee Validation",resp), status=StatusCode.HTTP_OK)
                else:
                    resp['status'] = 'invalid'
                    return Response(utils.StyleRes(True,"Employee Validation",resp), status=StatusCode.HTTP_OK)
            else:
                return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['invalid_inputs'], serialized._errors), status=StatusCode.HTTP_EXPECTATION_FAILED)
        except Exception as e:
            log.error(traceback.format_exc())
            return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['something_went_wrong'],{}), status=StatusCode.HTTP_UNPROCESSABLE_ENTITY)


class EmployeeDetails(APIView):
    @servicejwttokenvalidator
    @custom_exceptions
    def get(self,request,**kwargs):
        auth_details = utils.validateServiceToken(request)
        if(auth_details['results']['api_user']==""):
            return Response(auth_details, status=401)
        try:
            email  = kwargs.get("email", None)
            page_number = self.request.query_params.get('page',1)
            page_size = self.request.query_params.get('page_size',10)
            if email:
                emp_list = Employee.objects.filter(email = email).values('emp_id','email','emp_name','staff_no').annotate(
                    status = Case(
                        When(status=1,then=V('active')),
                        default=V('inactive'),
                        output_field=CharField(),
                    )
                )
            else:
                total_emp = Employee.objects.order_by('emp_id').values('emp_id','email','emp_name','staff_no').annotate(
                    status = Case(
                        When(status=1,then=V('active')),
                        default=V('inactive'),
                        output_field=CharField(),
                    )
                )
                paginator = Paginator(total_emp, page_size)
                try:
                    page_obj = paginator.page(page_number)
                    emp_list = list(page_obj)
                    total = page_obj.paginator.count
                except Exception as e:
                    log.error(traceback.format_exc())
                    return Response(utils.StyleRes(True,"Employees details",{}), status=StatusCode.HTTP_OK) 
            for emp in emp_list:
                emp_managers = EmployeeHierarchy.objects.filter(emp_id = emp['emp_id']).values(empid=F('manager_id')).annotate(
                    emp_name = F('manager__emp_name'),
                    priority = F('priority'),
                    email = F('manager__email'),
                    staff_no = F('manager__staff_no')
                )

                emp['managers'] ={}
                for manager in emp_managers:
                    if(manager['priority']==1):
                        emp['managers']['l1'] = {'emp_id':manager['empid'],'emp_name':manager['emp_name'], 'email':manager['email'],'staff_no':manager['staff_no']}
                    if(manager['priority']==2):
                        emp['managers']['l2'] = {'emp_id':manager['empid'],'emp_name':manager['emp_name'],'email':manager['email'],'staff_no':manager['staff_no']}
                    if(manager['priority']==3):
                        emp['managers']['l3'] = {'emp_id':manager['empid'],'emp_name':manager['emp_name'],'email':manager['email'],'staff_no':manager['staff_no']}
            resp = {}
            if email:
                if(len(emp_list)>0):
                    resp['employees']= emp_list[0]
                else:
                    return Response(utils.StyleRes(False,"Employee does not exist",{}), status=StatusCode.HTTP_UNPROCESSABLE_ENTITY)
            else:
                resp['total'] = total
                resp['employees']=emp_list
            return Response(utils.StyleRes(True,"Employees details",resp), status=StatusCode.HTTP_OK)
        except Exception as e:
            log.error(traceback.format_exc())
            return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['something_went_wrong'],{}), status=StatusCode.HTTP_UNPROCESSABLE_ENTITY)


class ManagerDetails(APIView):
    @servicejwttokenvalidator
    @custom_exceptions
    def get(self,request,**kwargs):
        auth_details = utils.validateServiceToken(request)
        if(auth_details['results']['api_user']==""):
            return Response(auth_details, status=401)
        try:
            email  = kwargs.get("email", None)
            resp ={}
            if email:
                emp_details = Employee.objects.filter(email = email).values('emp_id','email','emp_name','staff_no').annotate(
                    status = Case(
                        When(status=1,then=V('active')),
                        default=V('inactive'),
                        output_field=CharField(),
                    )
                )
                if (len(emp_details) ==0):
                    return Response(utils.StyleRes(False,"Employee does not exist",{}), status=StatusCode.HTTP_UNPROCESSABLE_ENTITY)
                resp['employees'] = list(emp_details)[0]
                emp_id = resp['employees']['emp_id']
                status = resp['employees']['status']
                if(status=='inactive'):
                    repoters_details = []
                else:
                    repoters_details = EmployeeHierarchy.objects.filter(manager_id = emp_id,priority = 1).values('emp_id').annotate(
                    emp_name = F('emp__emp_name'),
                    email = F('emp__email'),
                    staff_no = F('emp__staff_no')                
                    )
                resp['employees']['reporters'] = repoters_details
            else:
                return Response(utils.StyleRes(False,"Employee does not exist",{}), status=StatusCode.HTTP_UNPROCESSABLE_ENTITY)
            return Response(utils.StyleRes(True,"First level reporters for the manager",resp), status=StatusCode.HTTP_OK)
           
        except Exception as e:
            log.error(traceback.format_exc())
            return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['something_went_wrong'],{}), status=StatusCode.HTTP_UNPROCESSABLE_ENTITY)

class Reporters(APIView):
    def reports_function(self,repoters_details,detail=True):
        i=0
        for i,eachreporter in enumerate(repoters_details):
            look_up_query = (Q(manager_id=eachreporter['emp_id']) & Q(priority=1) & Q(emp__status=1) & ~Q(emp_id=eachreporter['emp_id']))
            reporters_cnt = EmployeeHierarchy.objects.filter(look_up_query).values('emp_id').annotate(
                emp_name = F('emp__emp_name'),
                email = F('emp__email'),
                staff_no = F('emp__staff_no'),
                status = Case(
                            When(emp__status=1,then=V('active')),
                            default=V('inactive'),
                            output_field=CharField(),
                        )
            )
            if(detail):
                reporters_list = list(reporters_cnt)
                if(eachreporter['status']=='inactive'):
                    repoters_details[i]['reporters']=[]
                else:
                    repoters_details[i]['reporters']= reporters_list
                    for j,each in enumerate(reporters_list):
                        c=EmployeeHierarchy.objects.directemployees(manager_id=each['emp_id']).values('emp_id').annotate(
                            emp_name = F('emp__emp_name'),
                            email = F('emp__email'),
                            staff_no = F('emp__staff_no'),
                            status = Case(
                                When(emp__status=1,then=V('active')),
                                default=V('inactive'),
                                output_field=CharField(),
                            )
                        )
                        
                        repoters_details[i]['reporters'][j]['reporters'] = list(c)
            else:
                reporters_list = len(list(reporters_cnt))
                repoters_details[i]['reporters']= reporters_list
        return repoters_details

    @servicejwttokenvalidator
    @custom_exceptions
    def get(self,request,**kwargs):

        auth_details = utils.validateServiceToken(request)
        if(auth_details['results']['api_user']==""):
            return Response(auth_details, status=401)
        try:
            email  = kwargs.get("email", None)
            # detail = self.request.query_params.get('detail', True)
            detail=True
            if(type(detail)==str):
                detail = json.loads(detail.lower())
            resp ={}
            if email is not None:
                emp_details = Employee.objects.filter(email = email).values('emp_id','email','emp_name','staff_no').annotate(
                    status = Case(
                        When(status=1,then=V('active')),
                        default=V('inactive'),
                        output_field=CharField(),
                    )
                )
                if (len(emp_details) ==0):
                    return Response(utils.StyleRes(False,"Employee does not exist",{}), status=StatusCode.HTTP_UNPROCESSABLE_ENTITY)
                resp['employees'] = list(emp_details)[0]
                emp_id = resp['employees']['emp_id']
                status = resp['employees']['status']

                if(status=='inactive'):
                    repoters_details = []
                else:
                    repoters_details = EmployeeHierarchy.objects.filter(Q(manager_id = emp_id) & Q(priority=1) & ~Q(emp_id=emp_id)).values('emp_id').annotate(
                    emp_name = F('emp__emp_name'),
                    email = F('emp__email'),
                    staff_no = F('emp__staff_no'),
                    status = Case(
                        When(emp__status=1,then=V('active')),
                        default=V('inactive'),
                        output_field=CharField(),
                        )
                    )
                    repoters_details=self.reports_function(repoters_details,detail=detail)

                       
                resp['employees']['reporters'] = repoters_details
            else:
                return Response(utils.StyleRes(False,"Employee does not exist",{}), status=StatusCode.HTTP_UNPROCESSABLE_ENTITY)
            return Response(utils.StyleRes(True,"Manager direct and indirect reporters",resp), status=StatusCode.HTTP_OK)
           
        except Exception as e:
            log.error(traceback.format_exc())
            return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['something_went_wrong'],{}), status=StatusCode.HTTP_UNPROCESSABLE_ENTITY)
