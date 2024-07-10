from django.db import connection
from django.db.models.expressions import F
from rest_framework.response import Response
import traceback
#import datetime
from datetime import datetime, timedelta, date
import dateutil.relativedelta
import logging
import jwt
import json
from django.db import connection
from cryptography.fernet import Fernet
import base64
from .models import Employee, SubAdminAccess
import re # regular expresson
import os
import string
import calendar

# Modles
from .models import Employee,Project,EmployeeHierarchy,EmployeeProject, ServiceAccount, EmployeeAdmin

from django.http import HttpResponse, FileResponse
from operator import itemgetter as itemget
from functools import cmp_to_key
from dateutil.rrule import rrule, MONTHLY,DAILY
from django.conf import settings
from django.core.mail import send_mail
from .constants import TimeCycleConfigurations

log = logging.getLogger(__name__)




class StringOptimize(object):
    def __init__(self, string):
        self.string = string

    def __sub__(self, other):
        if self.string.startswith(other.string):
            return self.string[len(other.string):]

    def __str__(self):
        return self.string

class utils():
    
    def getJWTToken(request):
        payload = {}        
        # hours_from_now = datetime.now() + timedelta(minutes=2)
        exp_time = int((datetime.now() + timedelta(hours=settings.JWT_TOKEN_EXP)).timestamp())
        payload['exp'] = exp_time

        email = request.data['email']
        employee = Employee.objects.prefetch_related('profile').annotate(category=F('profile__category__name'),gender=F('profile__gender_id')).get(email=email)
        emp_admin = EmployeeAdmin.objects.filter(emp_id=employee.emp_id,status=1)
        payload['report_access'] = False
        if(email in settings.ADMINS_TO_ACCESS_REPORTS):
            payload['report_access'] = True
        payload['sub_report_access'] = []

        ''' now getting the employee sub admin access list from database and inserting in the list'''
        accessList = SubAdminAccess.objects.filter(emp_id=employee.emp_id, status =1).values('module')
        subAdminAccessList = []
        for item in accessList:
            subAdminAccessList.append(item['module'])
        payload['sub_report_access'] = subAdminAccessList #['add-user']

        # if(email in settings.SUB_ADMINS_TO_ACCESS_REPORTS):
        #     payload['sub_report_access'] = ['add-user']
        payload['emp_name'] = employee.emp_name
        payload['emp_id'] = employee.emp_id
        payload['role_id'] = employee.role_id
        payload['email'] = email
        payload['gender'] = 'Male' if employee.gender is 1 else 'Female' if employee.gender is 2 else 'None'
        payload['category'] = employee.category
        if(len(emp_admin)>0):
            payload['is_emp_admin'] = True
            payload['emp_admin_priority'] = emp_admin[0].priority
        else:
            payload['is_emp_admin'] = False
            payload['emp_admin_priority'] = 0
        

        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        payload_response = {}
        payload_response['token'] = token
        return payload_response

    def validateJWTToken(request,is_qp_accepted=False):
        
        payload_response={'emp_no':'','customer_email':'','role_id':''}
        if(is_qp_accepted):
            token = request.query_params.get('btoken', None)
        else:
            token = request.META['HTTP_AUTHORIZATION']
            token = token.replace(settings.TOKEN_TYPE, '').strip()

        if(token == None):
            return payload_response
            
        decode_details = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        if('email' in decode_details):
            payload_response['message'] = 'Token is valid'
            payload_response['emp_id'] = decode_details['emp_id']
            payload_response['role_id'] = decode_details['role_id']
            payload_response['email'] = decode_details['email']
            payload_response['gender'] = decode_details['gender']
            payload_response['is_emp_admin'] = decode_details['is_emp_admin']
            payload_response['emp_admin_priority'] = decode_details['emp_admin_priority']
            if('sub_report_access' not in decode_details):
                payload_response['sub_report_access'] = []
            else:
                payload_response['sub_report_access'] = decode_details['sub_report_access']
            return payload_response
        else:
            return payload_response

    def getServiceToken(request):
        payload = {}        
        exp_time = int((datetime.now() + timedelta(hours=settings.JWT_TOKEN_EXP)).timestamp())
        payload['exp'] = exp_time

        api_user = request.data['api_user']
        serviceAccount = ServiceAccount.objects.get(api_user=api_user)
        # payload['username'] = serviceAccount.api_user
        payload['api_user'] = serviceAccount.api_user
        
        apitoken = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        payload_response = {}
        payload_response['apitoken'] = apitoken
        return payload_response

    def validateServiceToken(request):
        payload_response={'success':False, 'message':'API Token is not valid','results':{'api_user':''}}
        apitoken = request.META['HTTP_AUTHORIZATION']
        apitoken = apitoken.replace(settings.TOKEN_TYPE, '').strip()

        decode_details = jwt.decode(apitoken, settings.SECRET_KEY, algorithms=['HS256'])
        if('api_user' in decode_details):
            payload_response['message'] = 'API Token is valid'
            # payload_response['username'] = decode_details['username']
            payload_response['results']['api_user'] = decode_details['api_user']
            
            return payload_response
        else:
            return payload_response

    def getJoinQueryResults(packageQuery):
        response = []
        with connection.cursor() as cursor:
            cursor.execute(packageQuery)
            columns = [col[0] for col in cursor.description]
            # print("columns: ", columns)
            resultSet = cursor.fetchall()
            # print("resultSet:", resultSet)
            # print("type of resultSet:", type(resultSet))
            for row in resultSet:
                data = {}
                for index, item in enumerate(row):
                    # create dict with selected columns as dict keys
                    if not data.get(row[0], False):
                        if isinstance(row[index], datetime):
                            data[columns[index]] = row[index].isoformat().replace("T"," ") 
                        elif isinstance(row[index], date):
                            data[columns[index]] = row[index].isoformat()    
                        else:
                            data[columns[index]] = row[index]
                response.append(data)
        return(response)

    def chunker_list(seq, size):
        return (seq[i::size] for i in range(size))
    
    def strip_value(value):
        if (value != None) and type(value) != int:
            return value.strip()
        else:
            return value

    def emp_hierarchyupdate(emp_id,manager_name,priority):
        manager_det = Employee.objects.get(emp_name = utils.strip_value(manager_name),status = 1)
        if manager_det != None:
            man_empid = manager_det.emp_id
            emp_hierarchy = EmployeeHierarchy.objects.filter(emp_id = emp_id,priority = priority)
            if len(emp_hierarchy) == 0:
                emp_hie = EmployeeHierarchy(emp_id = emp_id,manager_id = man_empid,priority = priority,status = 1)
                emp_hie.save()
            else:
                emp_hie = EmployeeHierarchy.objects.filter(emp_id = emp_id,priority = priority).update(manager_id = man_empid,status = 1)
    
    def emp_project_update(emp_id,proj_name,priority):
        project_det = Project.objects.get(name = utils.strip_value(proj_name))
        if (project_det):
            proj_id = project_det.id
            emp_project_det = EmployeeProject.objects.filter(emp_id = emp_id,project_id = proj_id)
            if len(emp_project_det) == 0:
                emp_proj = EmployeeProject(emp_id = emp_id,project_id = proj_id,priority = priority,status = 1)
                emp_proj.save()
            else:
                emp_proj_update = EmployeeProject.objects.filter(emp_id = emp_id,project_id = proj_id).update(priority = priority,status = 1)

    def write_json(data, filename): 
        with open(filename,'w+') as f: 
            json.dump(data, f)
    

    def getRoleId(req):
        bearerHeader = req.headers['Authorization']
        #  Check if bearer is undefined
        if bearerHeader:
            #  Split at the space
            bearer = bearerHeader.split()
            #  Get token from array
            bearerToken = bearer[1]
            decoded = jwt.decode(bearerToken, 'secretkey', algorithm='HS256')
        return decoded["user"]["id"]
    
    def encrypt(txt):
        try:
            # convert integer etc to string first
            txt = str(txt)
            # get the key from settings
            cipher_suite = Fernet(settings.ENCRYPT_KEY) # key should be byte
            # #input should be byte, so convert the text to byte
            encrypted_text = cipher_suite.encrypt(txt.encode('ascii'))
            # encode to urlsafe base64 format
            encrypted_text = base64.urlsafe_b64encode(encrypted_text).decode("ascii") 
            return encrypted_text
        except Exception as e:
            # log the error if any
            logging.getLogger("error_logger").error(traceback.format_exc())
            return None

    def decrypt(txt):
        try:
            # base64 decode
            txt = base64.urlsafe_b64decode(txt)
            cipher_suite = Fernet(settings.ENCRYPT_KEY)
            decoded_text = cipher_suite.decrypt(txt).decode("ascii")     
            return decoded_text
        except Exception as e:
            # log the error
            logging.getLogger("error_logger").error(traceback.format_exc())
            return None

    # def isGeneralEmailDomain(email):
    #     domain = email.split('@')[1]
    #     blockedList = Blockeddomains.objects.filter(domain=domain)
    #     if(len(blockedList)>0):
    #         return True
    #     return False

    # def isCompetitorEmailDomain(email):
    #     domain = email.split('@')[1]
    #     blockedList = Blockedcompetitors.objects.filter(domain=domain)
    #     if(len(blockedList)>0):
    #         return True
    #     return False

    def getRegistrationHtml(token):
        # html = self.get_html(email_data).decode("utf-8")
        anchor_url = settings.UI_URL+"confirm-email/?token="+token
        mail_content="<html><head></head><body>Please confirm your registration with ATDATA. Please <a href='"+anchor_url+"'>click here</a> to confirm"
        return mail_content #.decode("utf-8")

    def getForgotPasswordHtml(token):
        # html = self.get_html(email_data).decode("utf-8")
        anchor_url = settings.UI_URL+"reset-password/?token="+token
        mail_content="<html><head></head><body><a href='"+anchor_url+"'>Click here</a> to reset your password"
        return mail_content #.decode("utf-8")

    def sendForgotPasswordMail(email):
        
        exp_time = int((datetime.now() + timedelta(hours=settings.FORGOT_PASSWORD_EXP_TIME)).timestamp())
        userDetails =  {}
        userDetails['email'] = email
        userDetails['type'] = 'forgotpassword'
        userDetails['datetime'] = exp_time
        conf_token = utils.encrypt(json.dumps(userDetails))
        log.info(email+" forgotpasswod conf token: "+conf_token)

        #TODO: check is Customer is approved.
        mail_content = utils.getForgotPasswordHtml(conf_token)
        emailList = [email]
        
        try:
            ret_val = send_mail("Reset password", mail_content, settings.EMAIL_FROM, emailList, html_message=mail_content)
            return ret_val
        except Exception as e:
            return 0
            

    
    def getUniqueId():
        return datetime.now().strftime('%Y%m%d%H%M%S%f')
    def createDirIfNotExists(path):
        if not os.path.exists(path):
            os.makedirs(path)

    def fileExists(path):
        return os.path.exists(path)
            
    
    def get_client_ip(request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def _isNA(element):
        return int(0 if element is 'NA' else element)

    def contentTypesResponce(filetype,name,file_obj=None):
        if(filetype.upper()=='XL'):
            response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = 'attachment; filename='+str(name)
            response['Access-Control-Expose-Headers'] = "Content-Disposition"
            return response
        if(filetype.upper()=='ZIP'):
            resp = HttpResponse(content_type="application/zip")
            resp['Content-Disposition'] = f'attachment; filename=' + str(name)+ '.zip'
            resp['Access-Control-Expose-Headers'] = 'Content-Disposition'
            return resp
        if(filetype.upper()=='PDF'):
            resp = HttpResponse(file_obj,content_type="application/pdf")
            resp['Content-Disposition'] = f'attachment; filename=' + str(name)+ '.pdf'
            resp['Access-Control-Expose-Headers'] = 'inline;Content-Disposition'
            resp['responseType'] = 'blob'
            return resp
        if(filetype.upper()=='DOCX'):
            resp = HttpResponse(file_obj,content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
            resp['Content-Disposition'] = f'attachment; filename=' + str(name)+ '.docx'
            resp['Access-Control-Expose-Headers'] = 'Content-Disposition'
            return resp

            

    
    def getUsername(email):
        return email.replace("@","_").replace(".","_")

    # get IP address of client request
    def get_client_ip(request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[-1].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
		
    def multikeysort(items, columns):
        comparers = [
            ((itemget(col[1:].strip()), -1) if col.startswith('-') else (itemget(col.strip()), 1))
            for col in columns
        ]
        def cmp(a, b):
            return (a > b) - (a < b) 
        def comparer(left, right):
            comparer_iter = (
                cmp(fn(left), fn(right)) * mult
                for fn, mult in comparers
            )
            return next((result for result in comparer_iter if result), 0)
        return sorted(items, key=cmp_to_key(comparer))
    def get_months_between_twodates(startdate,lastdate):
        months = [dt for dt in rrule(MONTHLY, dtstart=startdate, until=lastdate)]
        return months
    
    def get_dates_between_twodates(startdate,lastdate):
        dates = [dt for dt in rrule(DAILY,
                      dtstart=datetime.strptime(startdate, '%Y-%m-%d'),
                      until=datetime.strptime(lastdate, '%Y-%m-%d'))]
        return dates

    # def get_reponse_data_structure(respstatus=True,message="",results=[]):
    #     resp={}
    #     resp['success']=respstatus
    #     resp['message']=message
    #     resp['results']=results
    #     return resp

    def StyleRes(respstatus=True,message="",results={}):
        resp={}
        resp['success']=respstatus
        resp['message']=message
        resp['results']=results
        return resp

    def changeExtensionOfFilename(name,outext):
        return ('.').join(name.split('.')[:-1])+'.'+str(outext)

    def get_time_hms(td):
        seconds = td.total_seconds()
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        seconds = seconds % 60
        timestr = '{}:{}:{}'.format(int(hours), int(minutes), int(seconds))
        return int(hours),int(minutes)

    def get_week(date,bufferday=True):
        if(bufferday):
            date=date-timedelta(days=TimeCycleConfigurations.BUFFERDAYTOVIEWWEEKLYTIMESHEET)
        one_day = timedelta(days=1)
        #1. Return the full week (Saturday first) of the week containing the given date.
        day_idx = (date.weekday()+2) % 7  # turn saturday into 0, sunday into 1, etc.
        saturday = date - timedelta(days=day_idx)
        date = saturday
        datesList=[]
        for each in range(7):
            datesList.append(date)
            date += one_day
        return datesList

    def get_previous_week(date,prevThresh,bufferday=True):
        if(bufferday):
            date=date-timedelta(days=TimeCycleConfigurations.BUFFERDAYTOVIEWWEEKLYTIMESHEET)
        one_day = timedelta(days=1)
        #1. Return the full week (Saturday first) of the week containing the given date.
        day_idx = (date.weekday()+2) % 7  # turn saturday into 0, sunday into 1, etc.
        day_idx = day_idx + 7*(prevThresh)
        saturday = date - timedelta(days=day_idx)
        date = saturday
        datesList=[]
        for each in range(7):
            datesList.append(date)
            date += one_day
        return datesList

    def get_month(date,Thresold=1):
        year = date.year
        month = date.month-int(Thresold) #9-10 = -1
        if(month==0):
            year=year-1
            month=12
        while(month<0):
            month=12 + month
            year = year-1
            if(month==0):
                month=12
                year=year-1
        last_day_of_prev_month = date.replace(day=1,month=month,year=year)
        return last_day_of_prev_month.month,last_day_of_prev_month.year
    
    def get_monthly_cycle(date,Threshold=1):
        d = datetime.strptime(str(date), "%Y-%m-%d")
        d2 = d - dateutil.relativedelta.relativedelta(months=int(Threshold),day=31)
        if(d2.day>=settings.MONTH_CYCLE_START_DATE):#28>=31
            d2 = (d - dateutil.relativedelta.relativedelta(months=int(Threshold))).replace(day = settings.MONTH_CYCLE_START_DATE)
        end_month_value = int(Threshold)-1
        if(settings.MONTH_CYCLE_START_DATE==1):
            end_month_value = int(Threshold)
        enddate = d - dateutil.relativedelta.relativedelta(months=end_month_value,day=31)
        if(enddate.day>=settings.MONTH_CYCLE_START_DATE):
            enddate = (d - dateutil.relativedelta.relativedelta(months=int(Threshold)-1)).replace(day=settings.MONTH_CYCLE_START_DATE-1)
        return d2.date(),enddate.date()

    def get_start_and_end_dates_based_on_month_year(month,year):
        return datetime(int(year), int(month), settings.MONTH_CYCLE_START_DATE) - dateutil.relativedelta.relativedelta(months=1) , datetime(int(year), int(month), settings.MONTH_CYCLE_START_DATE)-timedelta(days=1)

    def getDateRangeFromWeek(p_year=datetime.today().year,p_week=1):
        firstdayofweek=datetime.strptime(f'{p_year}-W{int(p_week) -1 }-1',"%Y-W%W-%w").date()
        # lastdayofweek=firstdayofweek+timedelta(days=6.9)
        date=firstdayofweek
        prevThresh=0
        one_day = timedelta(days=1)
        #1. Return the full week (Saturday first) of the week containing the given date.
        day_idx = (date.weekday()+2) % 7  # turn saturday into 0, sunday into 1, etc.
        day_idx = day_idx + 7*(prevThresh)
        saturday = date - timedelta(days=day_idx)
        date = saturday
        datesList=[]
        for each in range(7):
            datesList.append(date)
            date += one_day
        return datesList 
    def findDay(date): 
        given_date = date.weekday() 
        return given_date,calendar.day_name[given_date]
    def removekey(d,key):
        r=dict(d)
        del r[key]
        return r

    def emp_hierarchyupdate_id(emp_id,man_empid,priority):
        emp_hierarchy = EmployeeHierarchy.objects.filter(emp_id = emp_id,priority = priority)
        if len(emp_hierarchy) == 0:
            emp_hie = EmployeeHierarchy(emp_id = emp_id,manager_id = man_empid,priority = priority,status = 1)
            emp_hie.save()
        else:
            emp_hie = EmployeeHierarchy.objects.filter(emp_id = emp_id,priority = priority).update(manager_id = man_empid,status = 1)  

    def removeDuplicatesFromList(listobj):
        return [i for n, i in enumerate(listobj) if i not in listobj[:n]]
    
    def isNotNone(*argv):
        return all(arg is not None for arg in argv)
              
    is_valid_leave_date = lambda x,y:x<=y if settings.TODAY_AS_HISTORY else x<y

    default_date = lambda :datetime.now().strftime('%Y-%m-%dT%H:%M:%S') if settings.TODAY_AS_HISTORY else (datetime.now()-timedelta(days=1)).strftime('%Y-%m-%dT%H:%M:%S')

    def dataUnavailabledates():
        today = today = datetime.now().date()
        dayid,dayname=utils.findDay(datetime.now().date())
        weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(1)))
        if(dayid in [6,0,1]):
            weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(2)))
            return weekdatesList[-1]+timedelta(days=1),today,weekdatesList[-1]
        return weekdatesList[-1]+timedelta(days=1),today,weekdatesList[-1]