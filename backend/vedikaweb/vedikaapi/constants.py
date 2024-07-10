from enum import Enum
from enum import IntEnum

from django_enum_choices.fields import EnumChoiceField

# Example for int values
class EmpStatus(IntEnum):
    InActive = 0
    Active = 1

class StatusCode(IntEnum):
    HTTP_OK = 200
    HTTP_CREATED = 201
    HTTP_NO_CONTENT = 204
    HTTP_BAD_REQUEST = 400
    HTTP_UNAUTHORIZED = 401
    HTTP_NOT_FOUND = 404
    HTTP_NOT_ACCEPTABLE = 406
    HTTP_CONFLICT = 409
    HTTP_PRECONDITION_FAILED = 412
    HTTP_UNPROCESSABLE_ENTITY = 422
    HTTP_EXPECTATION_FAILED = 417
    SERVER_ERROR = 500

class WorkApprovalStatuses(IntEnum):
    Pending = 0
    Approved = 1
    Rejected = 2
    EntryComplaince = 3
    ApprovalComplaince = 4
    

class ExcelHeadings(Enum):
    Email = 'email'
    Company = 'company'
    Empid = 'staff no.'
    Emp_name = 'name'
    Project1 = 'actual project 1'
    Project2 = 'actual project 2'
    Project3 = 'actual project 3'
    Fun_owner= 'functional owner'
    Manager_manager = "manager's manager"
    Rep_manager = 'reporting manager'
    Date_of_joining = 'doj'
    Location = 'work location'
    Marital_status = 'marital status'
    Gender = 'gender'
    Category = 'status'


class DefaultProjects(Enum):
    Vacation = 'VACATION'
    Mis = 'MISCELLANEOUS'
    Test = 'INIT'
    General = 'GENERAL'
    Holiday = 'HOLIDAY'

    @staticmethod
    def list():
        return list(map(lambda  c:c.value, DefaultProjects))
    @staticmethod
    def default_without_Init():
        result=[each.value for each in DefaultProjects if each!=DefaultProjects.Test]
        return result
    @staticmethod
    def default_non_projects():
        result=[each.value for each in DefaultProjects if each!=DefaultProjects.Test and each!=DefaultProjects.General]
        return result
    @staticmethod
    def mis_vac_projs():
        result=[DefaultProjects.Vacation.value,DefaultProjects.Mis.value]
        return result
#Config for time cycles
class TimeCycleConfigurations(IntEnum):
    BUFFERDAYTOVIEWWEEKLYTIMESHEET = 1

class MailConfigurations(Enum):
    Subject = "atwork - Hey! one last thing to do"
    New_emp_manager_mail_sub = "Atwork new employee registered"
    RemainderSubject = "atwork - Hey! one last thing to do"
    RejectedTimeSheetSubject = "Atwork - time sheet rejected"
    Welcome = "Welcome from Atwork"
    Sub_HolidayCalendar = "Holiday Calendar for the year "
    Sub_EmployeeDisabled = "Employee disabled"
    Sub_EmployeeDisabledPast = "atwork Notifications - Access Disabled "
    Sub_EmployeeDisabledFuture = "atwork Notifications - Access to be Disabled "
    Sub_EmployeeTransfer = "Employee Transfer"
    Sub_LeaveBalanceChange = "Leave Balance Change"
    Sub_MIS_Report="Atwork Report MIS"
    Sub_CLB_Report="Atwork Report CLB"

class MaxRequestsForLeaveType(Enum):
    Marriage=1
    Paternity=2
    Maternity=2

class MaxLeaveDaysForLeaveType(Enum):
    Marriage=4
    Paternity=2
    Maternity=182

class LeaveRequestStatus(Enum):
    Pending = 0
    Approved=1
    Rejected=2
    EmployeeCancelled=3
    AutoApprovedEmp=4
    AutoApprovedMgr=5

class TimesheetDiscrpancyStatus(Enum):
    Pending = 0
    Approved=1

class LeaveDayStatus(Enum):
    Pending=0
    Consumed=1
    HrCancelled=2

class LeaveExcelHeadings(Enum):
    Emp_name = 'name'
    Empid = 'staff no'
    Leave_bal = 'leave balance'
    Modified_leave_bal = 'modified leave balance'
    Comments = 'comments'

class StudentDetailsHeadings(Enum):
    Student_name = 'student_name'
    Device_Id = 'device id'
    
class GenderChoices(Enum):
    OTHER = 0
    MALE = 1
    FEMALE = 2
class MaritalStatuses(Enum):
    UNMARRIED = 0
    MARRIED = 1

class LeaveDiscrepancyStatus(Enum):
    Pending = 0
    Approved=1
    Rejected=2 
 
class LeaveMailTypes(Enum):
    Applied = "Applied"
    Approved= "Approved"
    Rejected= "Rejected"
    Cancelled= "Cancelled"
    AutoApprovedEmp= "Auto Approved Employee"
    AutoApprovedMgr= "Auto Approved Manager"
    DiscrepancyApplied= "Correction Applied"
    DiscrepancyApproved= "Correction Approved"
    DiscrepancyRejected= "Correction Rejected"

class DeletedEmployeePrefix(Enum):
    Deleted = "_deleted"