from os import access
import os

from django.db.models.fields import BooleanField
from django.http.request import QueryDict
from vedikaweb.vedikaapi.decorators import is_admin, is_manager, jwttokenvalidator, custom_exceptions
from rest_framework.views import APIView
from vedikaweb.vedikaapi.serializers import PolicyDocumentSerializer,PolicyDocumentCreateSerializer, PolicyCompanySerializer, PolicyDocumentEmployeeAccessPermissionSerializer, PolicyDocumentEmployeeActionSerializer
from vedikaweb.vedikaapi.models import Company, Employee, PolicyType, PolicyDocument, PolicyCompany, PolicyDocumentEmployeeAccessPermission
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
from django.db.models import ObjectDoesNotExist
from datetime import datetime
from django.http import HttpResponse, FileResponse, response
log = logging.getLogger(__name__)


class PolicyTypeView(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request,*args,**kwargs): 
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400) 
        policy_types  = PolicyType.objects.filter(status=1).values('id','name');  
        if len(policy_types) > 0:
            return Response(utils.StyleRes(True,"Policy types", policy_types), status=StatusCode.HTTP_OK)
        else:
            return Response(utils.StyleRes(True,"No content available", policy_types),status=StatusCode.HTTP_NO_CONTENT)
    
class CreatePolicyView(APIView):
    @jwttokenvalidator
    @is_admin
    @custom_exceptions
    def get(self,request,pk=None,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        condition = Q(status=1)
        if pk is not None:
            condition = condition&Q(id=pk)
        policy_list = PolicyDocument.objects.prefetch_related('policycompany_set','policydocumentemployeeaccesspermission_set','policydocumentemployeeaction_set').filter(condition).order_by('-created')
        all_policy_data = []
        for each_policy in policy_list:
            each_data = {}
            each_data.update(PolicyDocumentSerializer(each_policy).data)
            each_data.update({'company_list':list(each_policy.policycompany_set.filter(status=1).annotate(company_name=F('company__name'),cmpny_id=F('company__id')).values('company_name','cmpny_id'))})
            emp_list = list(each_policy.policydocumentemployeeaccesspermission_set.filter(status=1).annotate(emp_company = F('emp__company'), emp_name=F('emp__emp_name')).values('emp_name','emp_id', 'emp_company'))
            if(pk is None):
                emp_action = list(each_policy.policydocumentemployeeaction_set.filter(status=1).annotate(emp_company = F('emp__company'), emp_name=F('emp__emp_name')).values('emp_name','is_policy_accepted','upload_status','upload_policy_document','emp_id','emp_company'))
            else:
                emp_action = []
            # emps = list(map(lambda x: x.update(emp) for emp in emp_list if emp.emp_id == x.emp_id else x,emp_action))
            emps = []
            for each_list in emp_list:
                action_found = False
                for each_action in emp_action:
                    if each_action['emp_id'] == each_list['emp_id']:
                        action_found = True
                        each_list.update(each_action)
                        emp_action.remove(each_action)
                if action_found != True:
                    each_list.update({"is_policy_accepted": False,"upload_status": False,"upload_policy_document":None})
            emp_list.extend(emp_action)
  
            each_data.update({'emp_list': emp_list})

            # each_data.update({'emp_list': emp_list})


            # each_data.update({'emp_action':emp_action})
            all_policy_data.append(each_data)
        return Response(utils.StyleRes(True,"Policy list", all_policy_data), status=StatusCode.HTTP_OK)
    
    @jwttokenvalidator
    # @is_manager
    @is_admin
    @custom_exceptions
    def post(self,request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        # is_hr = auth_details['is_emp_admin']
        # if(not(is_hr)):
        #     return Response(utils.StyleRes(False,"Unauthorized User"),StatusCode.HTTP_UNAUTHORIZED)
        policy_serial_data = PolicyDocumentCreateSerializer(data=request.data)
        
        if policy_serial_data.is_valid():
            # policy_serial_data.save()

            policy_document = PolicyDocumentSerializer(data=policy_serial_data.data)
            if(policy_document.is_valid()):
                # pass
                policy_document=policy_document.save()
                log.info("Policy has been added with id {}".format(policy_document.id))
                policy_company_serial_data = PolicyCompanySerializer(data =[{'policy':policy_document.id,'company':c,'status':1} for c in policy_serial_data.data['company_list']],many=True)
                if(policy_company_serial_data.is_valid()):
                    policy_company_serial_data.save()
                    log.info("Companies have been mapped for policy id {}".format(policy_document.id))
                else:
                    log.error("Error while mapping companies with policy id {} error: {}".format(policy_document.id,policy_company_serial_data.errors))
                

                if (policy_serial_data.data['enable_for'] == 'FEW'):
                    emp_access_serial_data = PolicyDocumentEmployeeAccessPermissionSerializer(data =[{'policy_document':policy_document.id,'emp':e,'status':1} for e in policy_serial_data.data['emp_list']],many=True)
                    if(emp_access_serial_data.is_valid()):
                        emp_access_serial_data.save()
                        log.info("Employee access has been added for policy id {}".format(policy_document.id))
                    else:
                        log.error("Error while adding employee access with policy id {} error: {}".format(policy_document.id,emp_access_serial_data.errors))
                    # print(policy_serial_data.data['emp_list'])
            

            return Response(utils.StyleRes(True,"Policy created successfully", policy_serial_data.data), status=StatusCode.HTTP_CREATED)
        return Response(utils.StyleRes(False,"Policy creation error", policy_serial_data.errors), status=StatusCode.HTTP_BAD_REQUEST)

    def put(self,request,pk,*args,**kwargs):
        try: 
            old_policy_document = PolicyDocument.objects.get(pk=pk)
        except ObjectDoesNotExist as e:
            return Response(utils.StyleRes(False,"Policy update error",str(e)  ), status=StatusCode.HTTP_BAD_REQUEST)

        policy_serial_data = PolicyDocumentCreateSerializer(data=request.data)
        if policy_serial_data.is_valid():

            policy_document = PolicyDocumentSerializer(old_policy_document,data=policy_serial_data.data)
            if(policy_document.is_valid()):
                
                policy_document=policy_document.save()
                log.info("Policy has been update id {}".format(policy_document.id))

                policy_company_old_data = PolicyCompany.objects.filter(policy=policy_document.id)
                policy_company_new_data = []
                for each_cmpny in  policy_serial_data.data['company_list']:
                    if len(list(filter(lambda x: True if each_cmpny == x.company_id and x.status == 1 else False,policy_company_old_data)))==0:
                        policy_company_new_data.append({'policy':policy_document.id,'company':each_cmpny,'status':1})

                policy_company_new_data.extend([{'policy':policy_document.id,'company':ex_cmpny.company_id,'status':0} for ex_cmpny in policy_company_old_data if ex_cmpny.company_id not in policy_serial_data.data['company_list']  ])
                policy_company_serial_data = PolicyCompanySerializer(data=policy_company_new_data,many=True)
                if policy_company_serial_data.is_valid():
                    policy_company_serial_data.save()
                    log.info("Companies have been updated for policy id {}".format(policy_document.id))
                else:
                    log.info("Error while updating Companies for policy id {} error {}".format(policy_document.id,(policy_company_serial_data.errors)))
                
                if (policy_serial_data.data['enable_for'] == 'FEW'):
                    emp_access_old_data = PolicyDocumentEmployeeAccessPermission.objects.filter(policy_document=policy_document.id)
                    emp_access_new_data = []
                    for each_emp in  policy_serial_data.data['emp_list']:
                        if len(list(filter(lambda x: True if each_emp == x.emp_id and x.status == 1 else False,emp_access_old_data)))==0:
                            emp_access_new_data.append({'policy_document':policy_document.id,'emp':each_emp,'status':1})

                    emp_access_new_data.extend([{'policy_document':policy_document.id,'emp':ex_emp.emp_id,'status':0} for ex_emp in emp_access_old_data if ex_emp.emp_id not in policy_serial_data.data['emp_list']  ])
                    emp_access_serial_data = PolicyDocumentEmployeeAccessPermissionSerializer(data=emp_access_new_data,many=True)
                    if emp_access_serial_data.is_valid():
                        emp_access_serial_data.save()
                        log.info("Employee access has been updated for policy id {}".format(policy_document.id))
                    else:
                        log.error("Error while updating Employee access for policy id {} error {}".format(policy_document.id,(emp_access_serial_data.errors)))
                else:
                    PolicyDocumentEmployeeAccessPermission.objects.filter(policy_document=policy_document.id).update(status=0)
                    log.info("Employee access has been disabled as it is enabled for ALL for policy id {}".format(policy_document.id))

            return Response(utils.StyleRes(True,"Policy updated successfully", "Policy updated successfully"), status=StatusCode.HTTP_CREATED)
        return Response(utils.StyleRes(False,"Error while updating policy", str(policy_serial_data.errors)), status=StatusCode.HTTP_BAD_REQUEST)
    def delete(self,request,pk=None,*args,**kwargs):

        policy_list = PolicyDocument.objects.filter(id=pk,status=1)
        if(len(policy_list)==0):
            return Response(utils.StyleRes(False,"Policy disabled error", "No active policy found with id {}".format(pk)), status=StatusCode.HTTP_CONFLICT)
        policy_list.update(status=0)
        return Response(utils.StyleRes(True,"Policy disabled successfully", "Policy disabled successfully"), status=StatusCode.HTTP_OK)

class EmployeePolicyView(APIView):


    @jwttokenvalidator
    @custom_exceptions
    def get(self,request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        emp_id=auth_details['emp_id']
        emp_location = Employee.objects.get(emp_id=emp_id).company
        policy_list = PolicyDocument.objects.prefetch_related('policydocumentemployeeaccesspermission_set','policydocumentemployeeaction_set','policycompany_set').filter(
        Q(status=1)&Q(policycompany__company__name__iexact=emp_location)&Q(policycompany__status=1)&
        (Q(enable_for__iexact="ALL")|
        Q(policydocumentemployeeaccesspermission__emp_id=emp_id,policydocumentemployeeaccesspermission__status=1))
        ).distinct().order_by('-created')
        all_policy_data = []
        for each_policy in policy_list:
            each_data = {}
            each_data.update(PolicyDocumentSerializer(each_policy).data)
            emp_action = list(each_policy.policydocumentemployeeaction_set.filter(status=1).values())
            if(len(emp_action)>0):
                each_data.update(emp_action[0])
            else:
                each_data.update({"is_policy_accepted": False,"upload_status": False,"upload_policy_document":None})
            all_policy_data.append(each_data)
           
        #     each_data.update(PolicyDocumentSerializer(each_policy).data)
        #     all_policy_data.append(each_data)
        # all_policy_data = PolicyDocumentSerializer(policy_list,many=True).data
        return Response(utils.StyleRes(True,"Employee Policy list", all_policy_data), status=StatusCode.HTTP_OK)
    @jwttokenvalidator
    @custom_exceptions
    def post(self,request,policy_id,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400) 
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        emp_id=auth_details['emp_id']

        if len(request.data)>0:
            request_data = request.data.dict()
        else:
            request_data = request.data
        
        request_data.update({'emp':emp_id,'policy_document':policy_id,'is_policy_accepted':True})
        if('upload_policy_document' in request_data.keys()):
            request_data.update({'upload_status':True})
        else:
            request_data.update({'upload_status':False,'upload_policy_document':""})

        policy_data = PolicyDocument.objects.prefetch_related('policydocumentemployeeaccesspermission_set').filter(
            Q(status=1)&
            (Q(policydocumentemployeeaccesspermission__emp_id=emp_id)|Q(enable_for__iexact='ALL'))&
            Q(id=policy_id)).annotate(has_access=Case( 
                When((Q(policydocumentemployeeaccesspermission__status=0)&Q(enable_for__iexact='FEW')), then=False),
             default=True,output_field=BooleanField(),)).values()

        if(len(policy_data)>0):
            if(not policy_data[0]['has_access']):
                return Response(utils.StyleRes(False,"Employee Policy update error", 'Policy with id {} is not enabled for this user'.format(policy_id) ), status=StatusCode.HTTP_UNAUTHORIZED)

            policy_action_serial_data = PolicyDocumentEmployeeActionSerializer(data=request_data)

            if(policy_action_serial_data.is_valid()):
                
                policy_action_serial_data.save()

                return Response(utils.StyleRes(True,"Employee Policy update", "Employee policy updated successfully"), status=StatusCode.HTTP_OK)

            return Response(utils.StyleRes(False,"Employee Policy update error", str(policy_action_serial_data.errors)), status=StatusCode.HTTP_BAD_REQUEST)
        return Response(utils.StyleRes(False,"Employee Policy update", 'No active policy exists with id {}'.format(policy_id)), status=StatusCode.HTTP_OK)


class PolicyUpload(APIView):
    @jwttokenvalidator
    def get(self,request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request,is_qp_accepted=True)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        emp_id=auth_details['emp_id']
        is_admin = auth_details['is_emp_admin']
        if 'policy_id' in request.query_params:
            # file_name = request.data['filename']
            # file_name = request.query_params['filename']
            policy_id = request.query_params['policy_id']
            btoken = request.query_params['btoken']
            
        # print(file_name)
        # Q(file_name=file_name)

        if(not is_admin):
            policy_data = PolicyDocument.objects.prefetch_related('policydocumentemployeeaccesspermission_set').filter(Q(status=1)&Q(id=policy_id)&(Q(policydocumentemployeeaccesspermission__emp_id=emp_id)|Q(enable_for__iexact='ALL'))).annotate(has_access=Case( When(Q(policydocumentemployeeaccesspermission__status=1)|Q(enable_for__iexact='ALL'), then=True),default=False,output_field=BooleanField(),)).values()

            
            if(len(policy_data)==0 or policy_data[0]['has_access']==False):
                return Response(utils.StyleRes(False,"Employee Policy file download", "Employee does not have the permission for the file"), status=StatusCode.HTTP_UNAUTHORIZED)
        else:
            policy_data = PolicyDocument.objects.filter(Q(status=1)&Q(id=policy_id)).values()
            if(len(policy_data)==0 ):
                return Response(utils.StyleRes(False,"Employee Policy file download", "Policy does not exist with id {}".format(policy_id)), status=StatusCode.HTTP_UNAUTHORIZED)
        file_name = policy_data[0]['file_name']
        display_name = policy_data[0]['display_name']
        try: 
            # with open(settings.UPLOAD_PATH+'/policy/'+file_name, 'rb') as f:
            #     data = f.read()
            # response = HttpResponse(data,content_type="application/pdf")    
            # response['Content-Disposition'] = 'attachment; filename=%s' % display_name # force browser to download file    response.write(data)
            #     # response=utils.contentTypesResponce('pdf',policy_data[0]['display_name'],f)
            # response['response-type'] = 'blob'
            # response.write(data)
           
            file_path = os.path.join(settings.BASE_POLICIES_PATH,file_name)
            response = FileResponse(open(file_path, 'rb'), content_type='application/pdf')
            # response = FileResponse(open(settings.UPLOAD_PATH+'/policy/'+file_name,'rb'),content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
            # response["Access-Control-Allow-Origin"] = "*"
            # response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
            # response["Access-Control-Max-Age"] = "1000"
            # response["Access-Control-Allow-Headers"] = "X-Requested-With, Content-Type"

            return response
           
        except Exception as e:
            print(e)
            return Response(utils.StyleRes(False,"Employee Policy file download", "file does not exist"), status=StatusCode.HTTP_NOT_FOUND)
    @jwttokenvalidator
    @is_admin
    @custom_exceptions

    def post(self,request,*args,**kwargs):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400) 
        file_name = request.data['file']
        uploadedfilename = str(file_name).split('.')[0]
        uploadedfileext=str(file_name).split('.')[-1]
        filename=uploadedfilename+"_"+utils.getUniqueId() + '.'+ uploadedfileext
        utils.createDirIfNotExists(settings.BASE_POLICIES_PATH)
        with open(os.path.join(settings.BASE_POLICIES_PATH,filename), 'wb') as f:
            f.write(file_name.read())
        dt = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        return Response(utils.StyleRes(True,"Employee Policy file upload", {"displayname":str(file_name),"filename":filename}), status=StatusCode.HTTP_OK)
