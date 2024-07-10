from django.conf import settings
import traceback, json

from django.db.models.fields import FloatField
from vedikaweb.vedikaapi.models import Employee, EmployeeAdmin, EmployeeHierarchy, GlobalAccessFlag, EmailAccessGroup, WelcomeEmailNotification, ManagerEmailOpted, LeaveRequest, EmailQueue, LocationHolidayCalendar, Leave, EmployeeEntryCompStatus, EmployeeApprovalCompStatus
from vedikaweb.vedikaapi.serializers import EmailQueueSerializer
from datetime import datetime, timedelta, date
import calendar
from django.db.models import Q,F,Sum,Value, Case, When, CharField, Value as V, Prefetch, Func, DurationField, Count
# from django.db.models.fields import DurationField 
from django.db.models.functions import Concat
from django.core.mail import send_mail
from django.template.loader import get_template
import logging
from vedikaweb.vedikaapi.utils  import utils
from vedikaweb.vedikaapi.constants import MailConfigurations, LeaveMailTypes
from vedikaweb.vedikaapi.services import leave_service
import unicodedata
from itertools import chain

log = logging.getLogger(__name__)

#settings.MANAGER_EMAIL_OPTED = True

class email_service():
    
    def isValidReceiver(emp_id):
        emp_obj = EmployeeHierarchy.objects.filter(emp_id=emp_id,emp__status=1,priority=3,status=1).annotate(
            fun_owner = F('manager__emp_name')
        )
        if(len(emp_obj)>0):
            emp_object = emp_obj[len(emp_obj)-1]
            global_email_access = GlobalAccessFlag.objects.filter(status=1,access_type__iexact='EMAIL')
            individual_email_access_emps = []
            if(len(global_email_access)>0):
                accessed_managers = list(map(lambda x:utils.strip_value(x.emp_name),Employee.objects.filter(role_id=4,status=1)))
            else:
                accessed_managers = list(map(lambda x:utils.strip_value(x.emp.emp_name),EmailAccessGroup.objects.filter(status=1)))
                individual_email_access_emps = list(map(lambda x:x.emp.emp_id,EmailAccessGroup.objects.filter(status=2)))

            if((utils.strip_value(emp_object.fun_owner) in accessed_managers) or (emp_id in individual_email_access_emps)):
                try:
                    if(settings.SENDEMAILTOALL or emp_object.emp.email in settings.CUSTOM_EMAILS):
                        return True
                    else:
                        return False
                except Exception as e:
                    log.error(traceback.format_exc())
                    return False
            else:
                # log.error("WELCOME EMAIL NOT SENT TO {} BECAUSE CORRESPONDING MANAGER SHOULD NOT HAVE EMAIL ACCESS TO SEND".format(email))
                return False
        return False

    def getUniqueManagers(emp_id, filtered=True):
        manage_emails = []
        manage_ids = []
        emp_list = Employee.objects.filter(emp_id = emp_id).values('emp_id','email','emp_name','staff_no')
        if(len(emp_list)>0):
            emp = emp_list[0]
            emp_managers = EmployeeHierarchy.objects.filter(emp_id = emp['emp_id']).values(empid=F('manager_id')).annotate(
                    emp_name = F('manager__emp_name'),
                    priority = F('priority'),
                    email = F('manager__email'),
                    staff_no = F('manager__staff_no')
                )
            emp['managers'] = list(emp_managers)
            for emp in emp_list:
                for mgr in emp['managers']:
                    if(mgr['priority'] == 1):
                        if(mgr['empid'] not in manage_ids):
                            manage_emails.append(mgr['email'])
                            manage_ids.append(mgr['empid'])
                    elif(mgr['priority'] in [2,3]):
                        if(filtered):
                            emailOpt = ManagerEmailOpted.objects.filter(emp_id=mgr['empid'], status=1)
                            if(len(emailOpt)>0):
                                if(mgr['empid'] not in manage_ids):
                                    manage_emails.append(mgr['email'])
                                    manage_ids.append(mgr['empid'])
                        else:
                            if(mgr['empid'] not in manage_ids):
                                manage_emails.append(mgr['email'])
                                manage_ids.append(mgr['empid'])
        print(manage_emails,manage_ids)
        return manage_ids,manage_emails

    def getManagers(emp_id, filtered=True):
        # manage_emails = set()
        # emp_list = Employee.objects.filter(emp_id = emp_id).values('emp_id','email','emp_name','staff_no')
        emp_managers = EmployeeHierarchy.objects.filter(emp_id = emp_id).values(empid=F('manager_id')).annotate(
                emp_name = F('manager__emp_name'),
                priority = F('priority'),
                email = F('manager__email'),
                staff_no = F('manager__staff_no')
            )
        emp_managers = list(emp_managers)
        new_dict={}
        for mgr in emp_managers:
            new_dict[mgr['priority']]=mgr
        return new_dict
    
    def sendTimeSheetRejectmail(emp_id,email,ctx):
        mail_type="reject"
        if(email_service.isValidReceiver(emp_id)):
            emp_queue_obj = {'emp':emp_id,'email':email,'email_subject':MailConfigurations.RejectedTimeSheetSubject.value,'email_type':mail_type,'required_inputs':str(json.dumps(ctx))}
            emp_queue_ser_obj = EmailQueueSerializer(data=emp_queue_obj)
            if(emp_queue_ser_obj.is_valid()):
                emp_queue_ser_obj.save()
                log.info("REJECTED TIMESHEET EMAIL NOTIFICATION {} TASK SENT TO CRON SUCCESSFULLY".format(email))
            else:
                log.info(emp_queue_ser_obj.errors)
        else:
            log.info("No access to send mail to {}".format(email))


    def sendWelcomeMail(emp_id):
        mail_type = "Welcome"
        emp_list = list(Employee.objects.filter(emp_id = emp_id).values())
        exp_time = int((datetime.now() + timedelta(hours=settings.FORGOT_PASSWORD_EXP_TIME)).timestamp())
        userDetails =  {}
        email = emp_list[-1]['email']
        userDetails['email'] = email
        userDetails['type'] = 'forgotpassword'
        userDetails['datetime'] = exp_time
        conf_token = utils.encrypt(json.dumps(userDetails))
        log.info(email+" Welcome Email token: "+conf_token)
        ctx={
            "token_url":settings.UI_URL+"reset-password/?token="+conf_token,
            "name":unicodedata.normalize("NFKD", emp_list[-1]['emp_name']),
            "email":emp_list[-1]['email'],
            "UI_URL":settings.UI_URL,
        }
        # if(email_service.isValidReceiver(emp_id)):
        emp_queue_obj = {'emp':emp_id,'email':email,'email_subject':MailConfigurations.Welcome.value,'email_type':"welcome",'required_inputs':str(json.dumps(ctx))}
        emp_queue_ser_obj = EmailQueueSerializer(data=emp_queue_obj)
        if(emp_queue_ser_obj.is_valid()):
            emp_queue_ser_obj.save()
            log.info("Welcome EMAIL NOTIFICATION {} TASK SENT TO CRON SUCCESSFULLY".format(email))
        else:
            log.info(emp_queue_ser_obj.errors)
        # else:
            # log.info("No access to send mail to {}".format(email))
        

        '''
        Inform Managers about new employee
        '''
        ctx={
            "token_url":settings.UI_URL+"reset-password/?token="+conf_token,
            "name":unicodedata.normalize("NFKD", emp_list[-1]['emp_name']),
            "email":emp_list[-1]['email'],
            "UI_URL":settings.UI_URL,
            "emp_name": unicodedata.normalize("NFKD", emp_list[-1]['emp_name']),
            "staff_no": emp_list[-1]['staff_no'],
        }
        
        # template = get_template('manager_new_emp.html')
        # mail_content = template.render(json.dumps(ctx))


        ###SUPPORT MAIL###
        if(settings.ENABLE_SUPPORT_EMAIL):
            support_email=settings.SUPPORT_EMAIL
            emp_queue_obj = {'emp':emp_id,'email':support_email,'email_subject':MailConfigurations.Welcome.value,'email_type':"manager_new_emp",'required_inputs':str(json.dumps(ctx))}
            emp_queue_ser_obj = EmailQueueSerializer(data=emp_queue_obj)
            if(emp_queue_ser_obj.is_valid()):
                emp_queue_ser_obj.save()
                log.info("Welcome EMAIL NOTIFICATION {} TASK SENT TO CRON SUCCESSFULLY".format(support_email))
            else:
                log.info(emp_queue_ser_obj.errors)
        ###################


        manager_ids,manager_emails = email_service.getUniqueManagers(emp_id, False)
        
        if(len(manager_emails)==0):
            log.info("Manager details not available for emp-id:{}, While sending {} email".format(emp_id, mail_type))
        
        admin_ids,admin_emails = email_service.getEmpAdmins()
        print('admin_emails...',admin_emails)
        manager_ids=utils.removeDuplicatesFromList(manager_ids+admin_ids)
        manager_emails=utils.removeDuplicatesFromList(manager_emails+admin_emails)
 
        print('manage_emails...',manager_emails)
        for mgr_id,mgr_email in zip(manager_ids,manager_emails):
            emailList=[mgr_email]
            if(email_service.isValidReceiver(mgr_id)):
                emp_queue_obj = {'emp':mgr_id,'email':mgr_email,'email_subject':MailConfigurations.Welcome.value,'email_type':"manager_new_emp",'required_inputs':str(json.dumps(ctx))}
                emp_queue_ser_obj = EmailQueueSerializer(data=emp_queue_obj)
                if(emp_queue_ser_obj.is_valid()):
                    emp_queue_ser_obj.save()
                    log.info("Leave Application mail for manager email {}--Added to cron successfully".format(mgr_email))
                else:
                    log.info(emp_queue_ser_obj.errors)
            else:
                log.info("No access to send mail to {}".format(mgr_email))
    

    def getEmpAdmins():
        admin_emails = []
        admin_ids = []
        admins = EmployeeAdmin.objects.filter(priority=2, status=1).select_related('emp').all()
        # print('admins...',admins.values())
        for admin in admins:
            a = admin.emp
            if(a.emp_id not in admin_ids and a.email not in settings.IGNORE_ADMIN_EMAILS):
                admin_ids.append(a.emp_id)
                admin_emails.append(a.email)
        return admin_ids,admin_emails

    def sendLeaveMail(leave_request_id, mail_type):
        # emp_id is not required.
        # if need to validate leave_request_id with emp_id, then accept emp_id
        leaveRequest =  LeaveRequest.objects.filter(pk=leave_request_id).values('id','leave_reason', 'emp_comments', 'manager_comments', 'uploads_invitation', 'leave_reason','startdate','enddate','created', 'emp_id').annotate(
            leave_period = Concat('startdate', Value(' to '), 'enddate'),
            leave_type = Case(
                        When(leave_type__name='Paid',then=V('General')),
                        default=F('leave_type__name'),
                        output_field=CharField()
                    ),
            status  =  Case(
                When(status = 0, then=V('Pending')),
                When(status = 1, then=V('Approved')),
                When(status = 2, then=V('Rejected')),
                When(status = 3, then=V('Cancelled')),
                When(status = 4, then=V('AutoApprovedEmp')),
                When(status = 5, then=V('AutoApprovedMgr')),
                default=V('Default Val'),
                output_field=CharField()
            ),
            requsted_by = Case(
                When(requested_by='emp', then=V('Employee')),
                defult = V("HR"),
                output_field=CharField()
            ),
            day_count = Sum(Case( When(leave__day_leave_type='FULL', then=1.0),
            When(leave__day_leave_type='FIRST_HALF', then=0.5),
            When(leave__day_leave_type='SECOND_HALF', then=0.5),
            default=0.0,output_field=FloatField(),)),

        )
        
        if(len(leaveRequest)>0):
            ctx =  leaveRequest[0]
            leave_start_date = ctx['startdate'].strftime("%Y-%m-%d")
            leave_end_date = ctx['enddate'].strftime("%Y-%m-%d")
            leave_period = leave_service.getLeaveperiod(leave_request_id,leave_start_date,leave_end_date)
            log.info("LEAVE PERIOD {}".format(leave_period))
            emp_id = ctx['emp_id']
            empObj =  Employee.objects.get(emp_id=emp_id)

            # mail_type = "APPROVED"
            day_count = ctx['day_count']
            if(str(ctx['day_count']).split('.')[1]!='5'):
                day_count = int(ctx['day_count'])
            subject = "Leave Application-"+str(empObj.emp_name)+"("+str(empObj.staff_no)+"): "+str(mail_type)
            ctx['created'] = ctx['created'].strftime("%Y-%m-%d")
            ctx['total_leaves'] = day_count
            ctx['startdate'] = leave_start_date
            ctx['enddate'] = leave_end_date
            ctx['emp_name'] = unicodedata.normalize("NFKD", empObj.emp_name)
            ctx['leave_period'] = leave_period
            
            # print('-----------------------',ctx,'............................')
            if(email_service.isValidReceiver(emp_id)):
                emp_queue_obj = {'emp':emp_id,'email':empObj.email,'email_subject':subject,'email_type':"leave",'required_inputs':str(json.dumps(ctx))}
                emp_queue_ser_obj = EmailQueueSerializer(data=emp_queue_obj)
                if(emp_queue_ser_obj.is_valid()):
                    emp_queue_ser_obj.save()
                    log.info("Leave Application mail for {}--Added to cron successfully".format(empObj.email))
                else:
                    log.info(emp_queue_ser_obj.errors)
            else:
                log.info("No access to send mail to {}".format(empObj.email))
            
            
            manager_ids, manager_emails = email_service.getUniqueManagers(emp_id)
            # print(manager_emails)
            if(len(manager_emails)==0):
                log.info("Manager details not available for emp-id:{}, While sending {} leave email".format(emp_id, mail_type))
            
            # print('manage_emails...',manager_emails)

            admin_ids,admin_emails = email_service.getEmpAdmins()
            # print('admin_emails...',admin_emails)
            manager_ids=utils.removeDuplicatesFromList(manager_ids+admin_ids)
            manager_emails=utils.removeDuplicatesFromList(manager_emails+admin_emails)
            # print('manage_emails...',manager_emails)
            for mgr_id,mgr_email in zip(manager_ids,manager_emails):
                if(empObj.email != mgr_email):
                    emailList=[mgr_email]
                    ret_val=0
                    if(email_service.isValidReceiver(mgr_id)):
                        emp_queue_obj = {'emp':mgr_id,'email':mgr_email,'email_subject':subject,'email_type':"leave",'required_inputs':str(json.dumps(ctx))}
                        emp_queue_ser_obj = EmailQueueSerializer(data=emp_queue_obj)
                        if(emp_queue_ser_obj.is_valid()):
                            emp_queue_ser_obj.save()
                            log.info("Leave Application mail for manager email {}--Added to cron successfully".format(mgr_email))
                        else:
                            log.info(emp_queue_ser_obj.errors)
                    else:
                        log.info("No access to send mail to {}".format(mgr_email))
                

    def sendHolidayCalendar(calendaryear=datetime.now().year):
        mail_type = "Holiday Calendar"
        subject = MailConfigurations.Sub_HolidayCalendar.value+" "+str(calendaryear)
        ctx={
            "year":calendaryear
        }
        # empList=[{'emp_id':1,'email':'moulali@atai.ai'},{'emp_id':2,'email':'murali@atai.ai'}]
        empList = Employee.objects.filter(status=1).values('emp_id','email')
        for emp in empList:
            if(settings.SENDEMAILTOALL or emp in settings.CUSTOM_EMAILS):
                emailList=[emp['email']]
                ret_val=0
                if(email_service.isValidReceiver(emp['emp_id'])):
                    emp_queue_obj = {'emp':emp['emp_id'],'email':emp['email'],'email_subject':subject,'email_type':"holiday_calendar",'required_inputs':str(json.dumps(ctx))}
                    emp_queue_ser_obj = EmailQueueSerializer(data=emp_queue_obj)
                    if(emp_queue_ser_obj.is_valid()):
                        emp_queue_ser_obj.save()
                        log.info("Holiday calander mail for {}--Added to cron successfully".format(emp['email']))
                    else:
                        log.info(emp_queue_ser_obj.errors)
                else:
                    log.info("No access to send mail to {}".format(emp['email']))
            else:
                log.info("Not sending {} Mail Send to {}".format(mail_type,emp))

    def informManagerEmpDisable(emp_id,emp_details, relieved=str(datetime.now().date()), stagging=False):
        '''
        Inform Managers about employee disable
        '''
        emp_list =  Employee.objects.filter(emp_id=emp_id)
        staff_no = emp_details['staff_no'] #Employee.objects.only('staff_no'). get(emp_id=emp_id).staff_no
        emp_name = unicodedata.normalize("NFKD", emp_details['emp_name']) #unicodedata.normalize("NFKD", emp_list[0].emp_name)
        email = emp_details['email']
        # print(emp_list.values())
        # print(emp_list[0].emp_name)

        mail_type =  "Employee disabled"
        subject=""
        
        # log.info(subject)
        if(stagging):
            subject = MailConfigurations.Sub_EmployeeDisabledFuture.value + emp_name+"("+ str(staff_no)+")" 
        else:
            subject = MailConfigurations.Sub_EmployeeDisabledPast.value + emp_name+"("+ str(staff_no)+")" 
        relieved = str(relieved)
        ctx={
            "name":unicodedata.normalize("NFKD", emp_name),#unicodedata.normalize("NFKD", emp_list[0].emp_name),
            "email":email, #emp_list[0].email,
            "relieved":relieved,
            "staff_no":staff_no,
        }
        if(stagging):
            if(email_service.isValidReceiver(emp_id)):
                emp_queue_obj = {'emp':emp_id,'email':emp_list[0].email,'email_subject':subject,'email_type':"disable_info_emp",'required_inputs':str(json.dumps(ctx))}
                emp_queue_ser_obj = EmailQueueSerializer(data=emp_queue_obj)
                if(emp_queue_ser_obj.is_valid()):
                    emp_queue_ser_obj.save()
                    log.info("Employee Disabled mail for {}--Added to cron successfully".format(emp_list[0].email))
                else:
                    log.info(emp_queue_ser_obj.errors)
            else:
                log.info("No access to send mail to {}".format(emp_list[0].email))

        manager_ids,manager_emails = email_service.getUniqueManagers(emp_id, False)
        if(len(manager_emails)==0):
            log.info("Manager details not available for emp-id:{}, While sending {} email".format(emp_id, mail_type))
        
        admin_ids,admin_emails = email_service.getEmpAdmins()
        # print('admin_emails...',admin_emails)
        manager_ids=utils.removeDuplicatesFromList(manager_ids+admin_ids)
        manager_emails=utils.removeDuplicatesFromList(manager_emails+admin_emails)
        # print('manage_emails...',manager_emails)
        for mgr_id,mgr_email in zip(manager_ids,manager_emails):
            emailList=[mgr_email]
            if(email_service.isValidReceiver(mgr_id)):
                mgr_name = Employee.objects.only('emp_name'). get(emp_id=mgr_id).emp_name                
                
                ctx2={
                    "name":unicodedata.normalize("NFKD", emp_name),#unicodedata.normalize("NFKD", emp_list[0].emp_name),
                    "email":email, #emp_list[0].email,
                    "relieved":relieved,
                    "staff_no":staff_no,
                    "mgr_name":mgr_name,
                    "stagging":stagging
                }
                emp_queue_obj = {'emp':mgr_id,'email':mgr_email,'email_subject':subject,'email_type':"disable_info_mgr",'required_inputs':str(json.dumps(ctx2))}
                emp_queue_ser_obj = EmailQueueSerializer(data=emp_queue_obj)
                if(emp_queue_ser_obj.is_valid()):
                    emp_queue_ser_obj.save()
                    log.info("Employee Disabled mail for manager email {}--Added to cron successfully".format(mgr_email))
                else:
                    log.info(emp_queue_ser_obj.errors)
            else:
                log.info("No access to send mail to {}".format(mgr_email))                      
    
    def getDictWithKeys(new_managers_details):
        new_dict={}
        for new_mgr in new_managers_details:
            new_dict[new_mgr['role']]=new_mgr
        return new_dict

    def sendTransferMail(emp_id, old_managers_set=[], actedby=""):
        
        '''
        Inform Employee and Managers about employee Transfer
        '''
        emp_list =  Employee.objects.filter(emp_id=emp_id)
        mail_type =  "Employee Transfer"
        subject = MailConfigurations.Sub_EmployeeTransfer.value+":"+str(emp_list[0].emp_name)+"("+str(emp_list[0].staff_no)+")"

        employee_emails = []
        employee_ids=[]
        employee_emails.append(emp_list[0].email)
        employee_ids.append(emp_list[0].emp_id)
        old_manager_emails = list(map(lambda x:old_managers_set[x]['email'],old_managers_set))
        old_manager_ids = list(map(lambda x:old_managers_set[x]['emp_id'],old_managers_set))
        manager_ids,manager_emails = email_service.getUniqueManagers(emp_id, False)
        
        if(len(manager_emails)==0):
            log.info("Manager details not available for emp-id:{}, While sending {} email".format(emp_id, mail_type))
        
        '''
        Setting New manager details
        '''
        new_managers_details = email_service.getManagers(emp_id)
        

        admin_ids,admin_emails = email_service.getEmpAdmins()
        print('admin_emails...',admin_emails)
        manager_ids=manager_ids+admin_ids
        manager_emails=manager_emails+admin_emails
        '''
        adding employee, old managers to the list
        '''
        manager_ids = utils.removeDuplicatesFromList(manager_ids+employee_ids)
        manager_emails=utils.removeDuplicatesFromList(manager_emails+employee_emails)

        if old_manager_emails is not None:
            # old_managers_set = set(old_managers_set)
            manager_emails=utils.removeDuplicatesFromList(manager_emails+old_manager_emails)
            manager_ids=utils.removeDuplicatesFromList(manager_ids+old_manager_ids)
        # if old_managers_set is not None:
        #     # old_managers_set = set(old_managers_set)
        #     manager_emails.update(old_managers_set)

        # print('manage_emails...',manager_emails)

        ctx={
            "name":unicodedata.normalize("NFKD", emp_list[0].emp_name),
            "email":emp_list[0].email,
            "new_FO":unicodedata.normalize("NFKD", new_managers_details[3]['emp_name']),
            "new_MM":unicodedata.normalize("NFKD", new_managers_details[2]['emp_name']),
            "new_RM":unicodedata.normalize("NFKD", new_managers_details[1]['emp_name']),

            "curr_FO":unicodedata.normalize("NFKD", old_managers_set[3]['emp_name']),
            "curr_MM":unicodedata.normalize("NFKD", old_managers_set[2]['emp_name']),
            "curr_RM":unicodedata.normalize("NFKD", old_managers_set[1]['emp_name']),
            "actedby":actedby
        }
        

        for mgr_id,mgr_email in zip(manager_ids,manager_emails):
            emailList=[mgr_email]
            ret_val=0
            if(email_service.isValidReceiver(mgr_id)):
                emp_queue_obj = {'emp':mgr_id,'email':mgr_email,'email_subject':subject,'email_type':"employee_transfer",'required_inputs':str(json.dumps(ctx))}
                emp_queue_ser_obj = EmailQueueSerializer(data=emp_queue_obj)
                if(emp_queue_ser_obj.is_valid()):
                    emp_queue_ser_obj.save()
                    log.info("Transfer mail for {}--Added to cron successfully".format(mgr_email))
                else:
                    log.info(emp_queue_ser_obj.errors)
            else:
                log.info("No access to send mail to {}".format(mgr_email))

    def informLeaveBalanceChange(emp_id, old_leave_cnt, new_leave_cnt, is_bulk_upload=False):
        '''
        Inform Managers about employee leave change
        '''
        emp_list =  Employee.objects.filter(emp_id=emp_id)
        mail_type = "Leave Balance Change"

        subject = MailConfigurations.Sub_LeaveBalanceChange.value+":"+str(emp_list[0].emp_name)+"("+str(emp_list[0].staff_no)+")"
        log.info(subject)
        ctx={
            "name":unicodedata.normalize("NFKD", emp_list[0].emp_name),
            "email":emp_list[0].email,
            "old_leave_cnt":old_leave_cnt,
            "new_leave_cnt":new_leave_cnt
        }

        if(email_service.isValidReceiver(emp_id)):
            emp_queue_obj = {'emp':emp_id,'email':emp_list[0].email,'email_subject':subject,'email_type':"leave_balance_change",'required_inputs':str(json.dumps(ctx))}
            emp_queue_ser_obj = EmailQueueSerializer(data=emp_queue_obj)
            if(emp_queue_ser_obj.is_valid()):
                emp_queue_ser_obj.save()
                log.info("Leave Balance Change mail for {}--Added to cron successfully".format(emp_list[0].email))
            else:
                log.info(emp_queue_ser_obj.errors)
        else:
            log.info("No access to send mail to {}".format(emp_list[0].email))
        if (is_bulk_upload == True):
            log.info("Leave Balance not sending mail to managers for bulk upload")
            return
        manager_ids,manager_emails = email_service.getUniqueManagers(emp_id)
        if(len(manager_emails)==0):
            log.info("Manager details not available for emp-id:{}, While sending {} email".format(emp_id, mail_type))
        
        admin_ids,admin_emails = email_service.getEmpAdmins()
        manager_ids=utils.removeDuplicatesFromList(manager_ids+admin_ids)
        manager_emails=utils.removeDuplicatesFromList(manager_emails+admin_emails)
        for mgr_id,mgr_email in zip(manager_ids,manager_emails):
            if(emp_list[0].email != mgr_email):
                emailList=[mgr_email]
                if(email_service.isValidReceiver(mgr_id)):
                    emp_queue_obj = {'emp':mgr_id,'email':mgr_email,'email_subject':subject,'email_type':"leave_balance_change",'required_inputs':str(json.dumps(ctx))}

                    emp_queue_ser_obj = EmailQueueSerializer(data=emp_queue_obj)
                    if(emp_queue_ser_obj.is_valid()):
                        emp_queue_ser_obj.save()
                        log.info("Leave Balance Change mail for manager email {}--Added to cron successfully".format(mgr_email))
                    else:
                        log.info(emp_queue_ser_obj.errors)
                else:
                    log.info("No access to send mail to {}".format(mgr_email))


    def getEmailAccessFlag():
        emp_obj = Employee.objects.filter(status=1)
        global_email_access = GlobalAccessFlag.objects.filter(status=1,access_type__iexact='EMAIL')
        individual_email_access_emps=[]
        if(len(global_email_access)>0):
            accessed_managers = list(map(lambda x:x.emp_id,emp_obj.filter(role_id=4)))
        else:
            accessed_managers = list(map(lambda x:x.emp_id,EmailAccessGroup.objects.filter(status=1)))
            individual_email_access_emps = list(map(lambda x:x.emp_id,EmailAccessGroup.objects.filter(status=2)))
        return accessed_managers,individual_email_access_emps

    def getEmployeeEntryCompliance(emp_id):
        resp=[]
        weekdatesList=list(utils.get_previous_week(datetime.now().date(),0))
        weeknumber=weekdatesList[-1].isocalendar()[1]
        # print("weekdatesList",weekdatesList)
        # print("weeknumber",weeknumber)
        # if(datetime.now().weekday() >5):
        #     weeknumber = weeknumber -1
        lastYearWeeks = []
        currentYearWeeks = []
        last5Weeks=[]
        for  i in range(1,6):
            n=weeknumber-i
            weekstart = list(utils.get_previous_week(datetime.now().date(),int(i)))[0]
            weekend = list(utils.get_previous_week(datetime.now().date(),int(i)))[-1]
            week_year = str(weekend).split('-')[0]
            
            # print("old....",i,weekstart,weekend,week_year)
            # if(str(weekstart).split('-')[0] != str(weekend).split('-')[0]):
            #     week_year = str(weekstart).split('-')[0]
            # print("mod....",i,weekstart,weekend,week_year)
            week_years = [week_year, str(int(week_year)+1)]
            # if(n>=0):
            #     n=n+1
            if(n<=0):
                lastyear_last_week_=weekend.isocalendar()[1]
                n=lastyear_last_week_
                lastYearWeeks.append({'week':n,'year':week_year,"weekstart":weekstart.strftime('%b %d'),'weekend':weekend.strftime('%b %d')})
            else:
                currentYearWeeks.append({'week':n,'year':week_year,"weekstart":weekstart.strftime('%b %d'),'weekend':weekend.strftime('%b %d')})
            
            last5Weeks.append({'week':n,'year':week_year,"weekstart":weekstart.strftime('%b %d'),'weekend':weekend.strftime('%b %d')})
        eachemp=Employee.objects.filter(emp_id=emp_id,status=1)[0]
        # entry_complaince_statues=EmployeeEntryCompStatus.objects.filter(emp_id=emp_id,work_week__in=[ sub['week'] for sub in last5Weeks ], created__year__in=week_years).values().annotate(
        #     cnt = Count('cnt'),
        #     week_and_year = Concat(
        #             'work_week', V('_'),ExtractYear('created'),
        #             output_field=CharField()
        #         )
        # )
        last_year_entry_complaince_statues = EmployeeEntryCompStatus.objects.none()
        current_year_entry_complaince_statues = EmployeeEntryCompStatus.objects.none()
    
        if(len(lastYearWeeks)>0):
            last_year_entry_complaince_statues=EmployeeEntryCompStatus.objects.filter(emp_id=emp_id,work_week__in=[ sub['week'] for sub in lastYearWeeks ], work_year=lastYearWeeks[0]['year']).values().annotate(
                cnt = Count('cnt'),
                week_and_year = Concat(
                        'work_week', V('_'),'work_year',
                        output_field=CharField()
                    )
            )

        if(len(currentYearWeeks)>0):
            current_year_entry_complaince_statues=EmployeeEntryCompStatus.objects.filter(emp_id=emp_id,work_week__in=[ sub['week'] for sub in currentYearWeeks ], work_year=currentYearWeeks[0]['year']).values().annotate(
                cnt = Count('cnt'),
                week_and_year = Concat(
                        'work_week', V('_'),'work_year',
                        output_field=CharField()
                    )
            )
        entry_complaince_statues = list(chain(last_year_entry_complaince_statues, current_year_entry_complaince_statues))
        weekFound=False
        cnt=0
        for _, eachweek in enumerate(last5Weeks):
            joinedWeek = eachemp.created.isocalendar()[1]
            joinedYear = str(eachemp.created).split('-')[0]
            validweek = False
            if(joinedWeek <= int(eachweek['week']) and int(joinedYear) <= int(eachweek['year'])):
                validweek=True
            if(int(joinedYear) < int(eachweek['year'])):
                if(joinedWeek > int(eachweek['week'])):
                    validweek=True
            for each_compliance in entry_complaince_statues:
                # TODO: temp fix by adding new condition with OR statement
                # TODO: (each_compliance['week_and_year']==str(eachweek['week'])+"_"+str(eachweek['year']))
                if(each_compliance['week_and_year']==str(eachweek['week'])+"_"+str(eachweek['year'])) | (each_compliance['week_and_year']==str(eachweek['week'])+"_"+str(int(eachweek['year'])+1)):
                    weekFound=True
                    cnt=each_compliance['cnt']
            if(weekFound):
                resp.append({"week":eachweek['week'],'year':eachweek['year'],"cnt":cnt,"valid":validweek,'weekstart':eachweek['weekstart'],'weekend':eachweek['weekend']})
            else:
                resp.append({"week":eachweek['week'],'year':eachweek['year'],"cnt":cnt,"valid":validweek,'weekstart':eachweek['weekstart'],'weekend':eachweek['weekend']})
            weekFound=False
            validweek=False
            cnt=0
        return resp

    def getManagerApprovalCompliance(emp_id):
        eachemp=Employee.objects.filter(emp_id=emp_id,status=1)[0]
        weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(0)))
        weeknumber=weekdatesList[-1].isocalendar()[1]
        lastYearWeeks=[]
        currentYearWeeks=[]
        last5Weeks=[]
        for  i in range(2,7):
            n=weeknumber-i
            weekstart = list(utils.get_previous_week(datetime.now().date(),int(i)))[0]
            weekend = list(utils.get_previous_week(datetime.now().date(),int(i)))[-1]
            week_year = str(weekend).split('-')[0]

            if(str(weekstart).split('-')[0] != str(weekend).split('-')[0]):
                week_year = str(weekstart).split('-')[0]
            week_years = [week_year, str(int(week_year)+1)]

            if(n<=0):
                lastyear_last_week_=weekend.isocalendar()[1]      
                n=lastyear_last_week_
                lastYearWeeks.append({'week':n,'year':week_year,'weekstart':weekstart.strftime('%b %d'),'weekend':weekend.strftime('%b %d')})
            else:
                currentYearWeeks.append({'week':n,'year':week_year,'weekstart':weekstart.strftime('%b %d'),'weekend':weekend.strftime('%b %d')})

            last5Weeks.append({'week':n,'year':week_year,'weekstart':weekstart.strftime('%b %d'),'weekend':weekend.strftime('%b %d')})

        # manager_history_obj = EmployeeApprovalCompStatus.objects.filter(emp_id=eachemp.emp_id,emp__status=1,work_week__in=[ sub['week'] for sub in last5Weeks ], created__year__in=week_years).values().annotate(
        #             approval_comp_cnt = F('cnt'),
        #             week_and_year = Concat(
        #                     'work_week', V('_'),'work_year',
        #                     output_field=CharField()
        #                 )
        #         )
        last_year_manager_history_obj = EmployeeApprovalCompStatus.objects.none()
        current_year_manager_history_obj = EmployeeApprovalCompStatus.objects.none()

        if(len(lastYearWeeks)>0):
            last_year_manager_history_obj = EmployeeApprovalCompStatus.objects.filter(emp_id=eachemp.emp_id,emp__status=1,work_week__in=[ sub['week'] for sub in lastYearWeeks ], work_year=lastYearWeeks[0]['year']).values().annotate(
                        approval_comp_cnt = F('cnt'),
                        week_and_year = Concat(
                                'work_week', V('_'),'work_year',
                                output_field=CharField()
                            )
                    )
        if(len(currentYearWeeks)>0):
            current_year_manager_history_obj = EmployeeApprovalCompStatus.objects.filter(emp_id=eachemp.emp_id,emp__status=1,work_week__in=[ sub['week'] for sub in currentYearWeeks ], work_year=currentYearWeeks[0]['year']).values().annotate(
                        approval_comp_cnt = F('cnt'),
                        week_and_year = Concat(
                                'work_week', V('_'),'work_year',
                                output_field=CharField()
                            )
                    )
        manager_history_obj = list(chain(last_year_manager_history_obj, current_year_manager_history_obj))
        

        resp=[]
        weekFound=False
        cnt=0
        for k,eachweek in enumerate(last5Weeks):
            joinedWeek = eachemp.created.isocalendar()[1]
            joinedYear = str(eachemp.created).split('-')[0]
            validweek = False
            if(joinedWeek <= int(eachweek['week']) and int(joinedYear) <= int(eachweek['year'])):
                validweek=True
            
            if(int(joinedYear) < int(eachweek['year'])):
                if(joinedWeek > int(eachweek['week'])):
                    validweek=True

            for each_compliance in manager_history_obj:
                # TODO: temp fix by adding new condition with OR statement
                # TODO: | (each_compliance['week_and_year']==str(eachweek['week'])+"_"+str(int(eachweek['year'])+1))
                if(each_compliance['week_and_year']==str(eachweek['week'])+"_"+str(eachweek['year'])) | (each_compliance['week_and_year']==str(eachweek['week'])+"_"+str(int(eachweek['year'])+1)):
                    weekFound=True
                    cnt=each_compliance['approval_comp_cnt']

            if(weekFound):
                resp.append({"week":eachweek['week'],"year":eachweek['year'],"cnt":cnt,"valid":validweek,'weekstart':eachweek['weekstart'],'weekend':eachweek['weekend']})
                weekFound=False
                cnt=0
            else:
                resp.append({"week":eachweek['week'],"year":eachweek['year'],"cnt":cnt,"valid":validweek,'weekstart':eachweek['weekstart'],'weekend':eachweek['weekend']})
        return resp
    