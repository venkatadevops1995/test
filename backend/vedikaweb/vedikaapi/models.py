from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.query import Prefetch
from django.utils import timezone
from django.db.models import Sum
from django.db.models import Q,F,Count,Prefetch as pref
from .constants import DefaultProjects
from django.utils.translation import gettext_lazy as _
from django_prometheus.models import ExportModelOperationsMixin
from datetime import date
from vedikaweb.vedikaapi.custom_lookups import CustomGTELookup,CustomLTELookup,CustomLTLookup,CustomGTLookup

## EMPLOYEE MODEL AND CUSTOM MANAGER,QUERYSET ## 
class EmployeeQuerySet(models.QuerySet):
    def allmanagers(self):
        qs=self
        qs=qs.filter(role_id__gt=1,status=1)
        return qs
    def allmanagersprojects(self):
        qs=self.prefetch_related('employeeproject_set','emp').filter(
            Q(status=1) )
        return qs
    def allenabledisableemployee(self):
        qs=self.prefetch_related('employeeproject_set','emp').filter(
            Q(status=1) | ~Q(relieved = None))
        return qs
    def allprojects(self):
        qs=self.prefetch_related(Prefetch('employeeproject_set', queryset=EmployeeProject.objects.filter(status=1)),Prefetch('empl',queryset=StageEmployeeProject.objects.filter(status=1) )).filter(Q(status=1))
        return qs
          
class EmployeeManager(models.Manager):
    def get_queryset(self):
        return EmployeeQuerySet(self.model,using=self._db)
    def allmanagers(self,emp_id=None):
        return self.get_queryset().allmanagers()
    def allmanagersprojects(self):
        return self.get_queryset().allmanagersprojects()
    def allprojects(self):
        return self.get_queryset().allprojects()

class Employee(ExportModelOperationsMixin('employee'), models.Model):
    emp_id = models.AutoField(primary_key=True)
    email = models.CharField(unique=True, max_length=100)
    password = models.CharField(max_length=255)
    emp_name = models.CharField(max_length=100)
    company = models.CharField(max_length=100)
    staff_no = models.CharField(max_length=45)
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(auto_now=True)
    role = models.ForeignKey('Role', models.DO_NOTHING)
    added_by = models.CharField(max_length=10, default='mis')
    status = models.IntegerField()
    relieved = models.DateField(blank=True, null=True)

    objects = EmployeeManager()
    class Meta:
        managed = False
        db_table = 'employee'
####################################

# EMPLOYEE TYPE:: CURRENTLY FROM THE MIS
class Category(models.Model):
    name = models.CharField(max_length=255,blank=False,null=False)
    status = models.IntegerField(default=1, blank=False, null=False)
    class Meta:
        managed = False
        db_table = 'category'

class Location(models.Model):
    name = models.CharField(max_length=255)
    status = models.IntegerField()
    class Meta:
        managed = False
        db_table = 'location'

# The employee profile table with meta related to the profile of the employee
class EmployeeProfile(models.Model):
    class GENDER_CHOICES(models.IntegerChoices):
        NONE=0,_('None')
        MALE=1,_('Male')
        FEMALE=2,_('Female')

    emp = models.ForeignKey(Employee, models.DO_NOTHING,related_name='profile')
    category = models.ForeignKey(Category, models.DO_NOTHING)
    gender_id = models.SmallIntegerField(choices=GENDER_CHOICES.choices, default=0)
    is_married = models.BooleanField(default=False)
    patentry_maternity_cnt=models.SmallIntegerField(default=0)
    date_of_join=models.DateField()
    location =  models.ForeignKey(Location, models.DO_NOTHING)
    picture = models.CharField(default=None,null=True,max_length=255)

    class Meta:
        managed = False
        db_table = 'employee_profile'


## EMPLOYEE PROJECT MAPPING ##
class EmployeeProjectQuerySet(models.QuerySet):
    
    def findByEmplistAndWeekdateslistAndWeeknumber(self,empList,weekdatesList,weeknumber,submitted_projs_list):
        
        qs = self
        # qs=qs.filter(emp_id__in=empList).select_related('project').prefetch_related(pref(
        qs=qs.filter(emp_id__in=empList).prefetch_related(pref(
            'employeeprojecttimetracker_set',
            queryset=EmployeeProjectTimeTracker.objects.filter(work_date__in=weekdatesList),
            to_attr='all_project_time_tracker'
        ),pref(
            'employeeweeklystatustracker_set',
            queryset=EmployeeWeeklyStatusTracker.objects.filter(wsr_date__in=weekdatesList),
            to_attr='all_project_wsr_tracker'
        )).order_by('priority').filter(Q(emp__emp_id__in=empList) & (Q(status=1) | Q(project_id__in=submitted_projs_list))).annotate(
                wsr_count = Count('employeeweeklystatustracker__employee_project',filter=Q(employeeweeklystatustracker__wsr_date__in=weekdatesList,employeeweeklystatustracker__wsr_week=weeknumber)),
                wtr_obj = F('employeeprojecttimetracker__employee_project')

            )
        
        return qs



class EmployeeProjectManager(models.Manager):
    def get_queryset(self):
        return EmployeeProjectQuerySet(self.model,using=self._db)
    def findByEmplistAndWeekdateslistAndWeeknumber(self,empList,weekdatesList,weeknumber,submitted_projs_list=[]):
        return self.get_queryset().findByEmplistAndWeekdateslistAndWeeknumber(empList,weekdatesList,weeknumber,submitted_projs_list)

class EmployeeProject(ExportModelOperationsMixin('employee_project'), models.Model):
    project = models.ForeignKey('Project', models.DO_NOTHING)
    emp = models.ForeignKey(Employee, models.DO_NOTHING)
    priority = models.IntegerField()
    total_work_minutes = models.IntegerField(default=0)
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(auto_now=True)
    status = models.IntegerField()

    objects=EmployeeProjectManager()

    class Meta:
        managed = False
        db_table = 'employee_project'
####################################

## EMPLOYEE PROJECT TIME TRACKER ##
class EmployeeProjectTimeTrackerQuerySet(models.QuerySet):
    def get_cumulative_of_week(self,emp_id=None,work_week=None,year=None):
        qs=self
        if emp_id is not None:
            if work_week is not None:
                qs=qs.filter(Q(employee_project__emp_id=emp_id) & Q(work_week=work_week) & Q(work_year=year)).values('employee_project').annotate(sum_output_count=Sum('work_minutes'))
            else:
                qs=qs.filter(employee_project__emp_id=emp_id).values('employee_project').annotate(sum_output_count=Sum('work_minutes'))
            return qs
        return qs
    # CODE OPT
    # def get_cumulative_of_week_multiple_years(self,emp_id=None,work_week=None,years=[]):
    #     qs=self
    #     if emp_id is not None:
    #         if work_week is not None:
    #             qs=qs.filter(Q(employee_project__emp_id=emp_id) & Q(work_week=work_week) & Q(created__year__in=years)).values('employee_project').annotate(sum_output_count=Sum('work_minutes'))
    #         else:
    #             qs=qs.filter(employee_project__emp_id=emp_id).values('employee_project').annotate(sum_output_count=Sum('work_minutes'))
    #         return qs
    #     return qs

    ## To get Cumulative Sum of projects excluding Vacation ##
    def get_cumulative_of_week_without_vacation_holiday(self,emp_id=None,work_week=None,year=None):
        qs=self
        if emp_id is not None:
            if work_week is not None:
                qs=qs.filter(Q(employee_project__emp_id=emp_id) & Q(work_week=work_week) & Q(work_year=year) & ~Q(employee_project__project__name=DefaultProjects.Vacation.value) & ~Q(employee_project__project__name=DefaultProjects.Holiday.value)).values('employee_project').annotate(sum_output_count=Sum('work_minutes'))
            else:
                qs=qs.filter(Q(employee_project__emp_id=emp_id) & ~Q(employee_project__project__name=DefaultProjects.Vacation.value) & ~Q(employee_project__project__name=DefaultProjects.Holiday.value)).values('employee_project').annotate(sum_output_count=Sum('work_minutes'))
            return qs
        return qs
    #   CODE OPT
    # def get_cumulative_of_week_without_vacation_holiday_multiple_years(self,emp_id=None,work_week=None,years=[]):
    #     qs=self
    #     if emp_id is not None:
    #         if work_week is not None:
    #             qs=qs.filter(Q(employee_project__emp_id=emp_id) & Q(work_week=work_week) & Q(created__year__in=years) & ~Q(employee_project__project__name=DefaultProjects.Vacation.value) & ~Q(employee_project__project__name=DefaultProjects.Holiday.value)).values('employee_project').annotate(sum_output_count=Sum('work_minutes'))
    #         else:
    #             qs=qs.filter(Q(employee_project__emp_id=emp_id) & ~Q(employee_project__project__name=DefaultProjects.Vacation.value) & ~Q(employee_project__project__name=DefaultProjects.Holiday.value)).values('employee_project').annotate(sum_output_count=Sum('work_minutes'))
    #         return qs
    #     return qs
    
    def get_submitted_projects(self,emp_id=None,work_week=None,year=None):
        qs=self
        if emp_id is not None:
            if work_week is not None:
                qs=qs.filter(Q(employee_project__emp_id=emp_id) & Q(work_week=work_week) & Q(work_year=year)).values('employee_project').annotate(
                    emp_id = F('employee_project__emp_id'),
                    project_id = F('employee_project__project_id'),
                    project_name = F('employee_project__project__name'),
                    sum_output_count=Sum('work_minutes'))
            else:
                qs=qs.filter(employee_project__emp_id=emp_id).values('employee_project').annotate(
                    emp_id = F('employee_project__emp_id'),
                    project_id = F('employee_project__project_id'),
                    project_name = F('employee_project__project__name'),
                    sum_output_count=Sum('work_minutes'))
            return qs
        return qs
    # CODE OPT
    # def get_submitted_projects_multiple_years(self,emp_id=None,work_week=None,years=[]):
    #     qs=self
    #     if emp_id is not None:
    #         if work_week is not None:
    #             qs=qs.filter(Q(employee_project__emp_id=emp_id) & Q(work_week=work_week) & Q(created__year__in=years)).values('employee_project').annotate(
    #                 emp_id = F('employee_project__emp_id'),
    #                 project_id = F('employee_project__project_id'),
    #                 project_name = F('employee_project__project__name'),
    #                 sum_output_count=Sum('work_minutes'))
    #         else:
    #             qs=qs.filter(employee_project__emp_id=emp_id).values('employee_project').annotate(
    #                 emp_id = F('employee_project__emp_id'),
    #                 project_id = F('employee_project__project_id'),
    #                 project_name = F('employee_project__project__name'),
    #                 sum_output_count=Sum('work_minutes'))
    #         return qs
    #     return qs
    
    def get_submitted_projects_daterange(self,emp_id=None,start_date=None,last_date=None):
        qs=self
        if emp_id is not None:
            if start_date is not None and last_date is not None:
                qs=qs.filter(Q(employee_project__emp_id=emp_id) & Q(work_date__gte=start_date) & Q(work_date__lte=last_date)).values('employee_project').annotate(
                    emp_id = F('employee_project__emp_id'),
                    project_id = F('employee_project__project_id'),
                    project_name = F('employee_project__project__name'),
                    sum_output_count=Sum('work_minutes'))
            else:
                qs=qs.filter(employee_project__emp_id=emp_id).values('employee_project').annotate(
                    emp_id = F('employee_project__emp_id'),
                    project_id = F('employee_project__project_id'),
                    project_name = F('employee_project__project__name'),
                    sum_output_count=Sum('work_minutes'))
            return qs
        return qs
    def findByEmplistAndWeekdateslistAndWeeknumberAndYear(self,empList,weekdatesList,weeknumber,year):
        qs=self
        qs=qs.filter(Q(work_week=weeknumber) & Q(work_year=year) & Q(work_date__in=weekdatesList)).values('employee_project').annotate(
                    emp_id = F('employee_project__emp_id'),
                    project_id = F('employee_project__project_id'),
                    project_name = F('employee_project__project__name'),
                    sum_output_count=Sum('work_minutes')).filter(sum_output_count__gt=0,employee_project__emp_id__in=empList)
        return qs
    
    # CODE OPT
    # def findByEmplistAndWeekdateslistAndWeeknumberAndMultipleYears(self,empList,weekdatesList,weeknumber,years):
    #     qs=self
    #     qs=qs.filter(Q(work_week=weeknumber) & Q(created__year__in=years) & Q(work_date__in=weekdatesList)).values('employee_project').annotate(
    #                 emp_id = F('employee_project__emp_id'),
    #                 project_id = F('employee_project__project_id'),
    #                 project_name = F('employee_project__project__name'),
    #                 sum_output_count=Sum('work_minutes')).filter(sum_output_count__gt=0,employee_project__emp_id__in=empList)
    #     return qs


            
class EmployeeProjectTimeTrackerManager(models.Manager):
    def get_queryset(self):
        return EmployeeProjectTimeTrackerQuerySet(self.model,using=self._db)
    def get_cumulative_of_week(self,emp_id=None,work_week=None,year=None):
        return self.get_queryset().get_cumulative_of_week(emp_id=emp_id,work_week=work_week,year=year)
    # def get_cumulative_of_week_multiple_years(self,emp_id=None,work_week=None,years=[]):
    #     return self.get_queryset().get_cumulative_of_week_multiple_years(emp_id=emp_id,work_week=work_week,years=years)
    def get_cumulative_of_week_without_vacation_holiday(self,emp_id=None,work_week=None,year=None):
        return self.get_queryset().get_cumulative_of_week_without_vacation_holiday(emp_id=emp_id,work_week=work_week,year=year)
    # def get_cumulative_of_week_without_vacation_holiday_multiple_years(self,emp_id=None,work_week=None,years=[]):
    #     return self.get_queryset().get_cumulative_of_week_without_vacation_holiday_multiple_years(emp_id=emp_id,work_week=work_week,years=years)
    def get_submitted_projects(self,emp_id=None,work_week=None,year=None):
        return self.get_queryset().get_submitted_projects(emp_id=emp_id,work_week=work_week,year=year)
    # def get_submitted_projects_multiple_years(self,emp_id=None,work_week=None,years=[]):
    #     return self.get_queryset().get_submitted_projects_multiple_years(emp_id=emp_id,work_week=work_week,years=years)
    def get_submitted_projects_daterange(self,emp_id=None,start_date=None,last_date=None):
        return self.get_queryset().get_submitted_projects_daterange(emp_id=emp_id,start_date=start_date,last_date = last_date)
    def findByEmplistAndWeekdateslistAndWeeknumberAndYear(self,empList,weekdatesList,weeknumber,year):
        return self.get_queryset().findByEmplistAndWeekdateslistAndWeeknumberAndYear(empList,weekdatesList,weeknumber,year)
    # def findByEmplistAndWeekdateslistAndWeeknumberAndMultipleYears(self,empList,weekdatesList,weeknumber,years):
    #     return self.get_queryset().findByEmplistAndWeekdateslistAndWeeknumberAndMultipleYears(empList,weekdatesList,weeknumber,years)
	

class EmployeeProjectTimeTracker(ExportModelOperationsMixin('employee_project_time_tracker'), models.Model):
    id = models.BigAutoField(primary_key=True)
    employee_project = models.ForeignKey(EmployeeProject, models.DO_NOTHING)
    work_minutes = models.IntegerField()
    work_date = models.DateField()
    work_week = models.IntegerField()
    work_year = models.IntegerField(default=0)
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(auto_now=True)
    status = models.IntegerField()

    objects = EmployeeProjectTimeTrackerManager()
    class Meta:
        # unique_together = ('employee_project','work_date')
        managed = False
        db_table = 'employee_project_time_tracker'
        
####################################


## EMPLOYEE WSR TRACKER ##
class EmployeeWeeklyStatusTracker(ExportModelOperationsMixin('employee_weekly_status_tracker'), models.Model):
    employee_project = models.ForeignKey(EmployeeProject, models.DO_NOTHING)
    work_report = models.TextField(blank=True, null=True)
    wsr_date = models.DateField()
    wsr_week = models.IntegerField()
    wsr_year = models.IntegerField(default=0)
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(auto_now=True)
    status = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'employee_weekly_status_tracker'
####################################


## PROJECT MODEL ##
class Project(ExportModelOperationsMixin('project'), models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=255, blank=True)
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(auto_now=True)
    status = models.IntegerField(default=1)

    class Meta:
        managed = False
        db_table = 'project'
####################################


## EMPLOYEE ROLE ##
class Role(ExportModelOperationsMixin('role'), models.Model):
    role_id = models.AutoField(primary_key=True)
    role_name = models.CharField(max_length=45)
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(auto_now=True)
    status = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'role'
####################################


## EMPLOYEE HEIRARCHY MODEL AND MANAGER ##
class EmployeeHierarchyQuerySet(models.QuerySet):
    def directemployees(self,manager_id=None):
        qs = self
        if manager_id is not None:
            look_up_query = (Q(manager_id=manager_id) & Q(priority=1) & Q(emp__status=1))
            qs=qs.filter(look_up_query)
            return qs
        return qs
    def direct_indirect_employees(self,manager_id=None):
        qs = self
        if manager_id is not None:
            qs=qs.filter(manager_id=manager_id,emp__status=1)
            return qs
        return qs
    def direct_managers(self,manager_id=None):
        qs=self
        if manager_id is not None:
            qs = qs.filter(Q(manager_id=manager_id) & Q(emp__role_id__gt=1) & Q(emp__status=1))
            return qs
        return qs

    def direct_managers_dashboard(self,manager_id=None):
        qs=self
        if manager_id is not None:
            qs = qs.filter(Q(manager_id=manager_id) & Q(emp__role_id__gt=2) & Q(emp__status=1))
            return qs
        return qs
    def findByEmplistAndPriorityAndStatus(self,empList,priority,status):
        qs=self
        qs=qs.select_related('emp','manager').filter(emp_id__in=empList,priority=priority,status=status)
        return qs
class EmployeeHierarchyManager(models.Manager):
    def get_queryset(self):
        return EmployeeHierarchyQuerySet(self.model,using=self._db)
    def directemployees(self,manager_id=None):
        return self.get_queryset().directemployees(manager_id=manager_id)
    def direct_indirect_employees(self,manager_id=None):
        return self.get_queryset().direct_indirect_employees(manager_id=manager_id)
    def direct_managers(self,manager_id=None):
        return self.get_queryset().direct_managers(manager_id=manager_id)
    def direct_managers_dashboard(self,manager_id = None):
        return self.get_queryset().direct_managers_dashboard(manager_id=manager_id)
    def findByEmplistAndPriorityAndStatus(self,empList,priority,status):
        return self.get_queryset().findByEmplistAndPriorityAndStatus(empList,priority,status)

class EmployeeHierarchy(ExportModelOperationsMixin('employee_hierarchy'), models.Model):
    emp = models.ForeignKey('Employee', related_name='emp', on_delete=models.DO_NOTHING)
    manager = models.ForeignKey('Employee', related_name='manager', on_delete=models.DO_NOTHING)
    priority = models.IntegerField()
    status = models.IntegerField()
    
    objects=EmployeeHierarchyManager()
    class Meta:
        managed = False
        db_table = 'employee_hierarchy'
####################################


## EMPLOYEE WORK APPROVE STATUS ##
class EmployeeWorkApproveStatusQuerySet(models.QuerySet):
    def findByEmplistAndWeekAndYear(self,empList,work_week,year):
        qs = self
        look_up_query = (Q(emp_id__in=empList) & Q(work_week=work_week) & Q(work_year=year))
        qs=qs.filter(look_up_query)
        return qs
    # CODE OPT
    # def findByEmplistAndWeekAndMultipleYears(self,empList,work_week,years):
    #     qs = self
    #     look_up_query = (Q(emp_id__in=empList) & Q(work_week=work_week) & Q(created__year__in=years))
    #     qs=qs.filter(look_up_query)
    #     return qs
   


class EmployeeWorkApproveStatusManager(models.Manager):
    def get_queryset(self):
        return EmployeeWorkApproveStatusQuerySet(self.model,using=self._db)
    def findByEmplistAndWeekAndYear(self,empList,work_week,year):
        return self.get_queryset().findByEmplistAndWeekAndYear(empList,work_week,year)
    # def findByEmplistAndWeekAndMultipleYears(self,empList,work_week,years):
    #     return self.get_queryset().findByEmplistAndWeekAndMultipleYears(empList,work_week,years)
class EmployeeWorkApproveStatus(ExportModelOperationsMixin('employee_work_approve_status'), models.Model):
    emp = models.ForeignKey('Employee', models.DO_NOTHING)
    work_week = models.IntegerField()
    work_year = models.IntegerField(default=0)
    comments = models.CharField(max_length=255, blank=True, null=True)
    status = models.IntegerField()
    comments = models.CharField(max_length=150,blank=True,null=True)
    created = models.DateTimeField(default=timezone.now)
    objects=EmployeeWorkApproveStatusManager()
    class Meta:
        managed = False
        db_table = 'employee_work_approve_status'
####################################


## MIS INFO ##
class MisInfo(ExportModelOperationsMixin('mis_info'), models.Model):
    mis_filename = models.CharField(max_length=255)
    info = models.TextField(blank=True, null=True)
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(auto_now=True)
    status = models.IntegerField()
    class Meta:
        managed = False
        db_table = 'mis_info'
####################################



## EMPLOYEE ENTRY COMPLAINCE STATUS ##
class EmployeeEntryCompStatusQuerySet(models.QuerySet):
    def findByEmplistAndWeekAndYear(self,empList,work_week,year):
        qs = self
        look_up_query = (Q(emp_id__in=empList) & Q(work_week=work_week) & Q(work_year=year))
        qs=qs.filter(look_up_query)
        return qs
    # CODE OPT
    # def findByEmplistAndWeekAndMultipleYears(self,empList,work_week,years):
    #     qs = self
    #     look_up_query = (Q(emp_id__in=empList) & Q(work_week=work_week) & Q(created__year__in=years))
    #     qs=qs.filter(look_up_query)
    #     return qs

class EmployeeEntryCompStatusManager(models.Manager):
    def get_queryset(self):
        return EmployeeEntryCompStatusQuerySet(self.model,using=self._db)
    def findByEmplistAndWeekAndYear(self,empList,work_week,year):
        return self.get_queryset().findByEmplistAndWeekAndYear(empList,work_week,year)
    # def findByEmplistAndWeekAndMultipleYears(self,empList,work_week,year):
    #     return self.get_queryset().findByEmplistAndWeekAndMultipleYears(empList,work_week,year)
		
class EmployeeEntryCompStatus(ExportModelOperationsMixin('employee_entry_comp_status'), models.Model):
    emp = models.ForeignKey('Employee', models.DO_NOTHING)
    work_week = models.IntegerField()
    work_year = models.IntegerField(default=0)
    cnt = models.IntegerField()
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(auto_now=True)
    objects=EmployeeEntryCompStatusManager()
    class Meta:
        managed = False
        db_table = 'employee_entry_comp_status'
####################################


## EMPLOYEE APPROVAL COMPLAINCE STATUS ##
class EmployeeApprovalCompStatusQuerySet(models.QuerySet):
    def findByEmplistAndWeekAndYear(self,empList,work_week,year):
        qs = self
        look_up_query = (Q(emp_id__in=empList) & Q(work_week=work_week) & Q(work_year=year))
        qs=qs.filter(look_up_query)
        return qs
    # CODE OPT
    # def findByEmplistAndWeekAndMultipleYears(self,empList,work_week,years):
    #     qs = self
    #     look_up_query = (Q(emp_id__in=empList) & Q(work_week=work_week) & Q(created__year__in=years))
    #     qs=qs.filter(look_up_query)
    #     return qs

class EmployeeApprovalCompStatusManager(models.Manager):
    def get_queryset(self):
        return EmployeeApprovalCompStatusQuerySet(self.model,using=self._db)
    def findByEmplistAndWeekAndYear(self,empList,work_week,year):
        return self.get_queryset().findByEmplistAndWeekAndYear(empList,work_week,year)
    # def findByEmplistAndWeekAndMultipleYears(self,empList,work_week,years):
    #     return self.get_queryset().findByEmplistAndWeekAndMultipleYears(empList,work_week,years)
class EmployeeApprovalCompStatus(ExportModelOperationsMixin('employee_approval_comp_status'), models.Model):
    emp = models.ForeignKey('Employee', models.DO_NOTHING)
    work_week = models.IntegerField()
    work_year = models.IntegerField(default=0)
    cnt = models.IntegerField()
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(auto_now=True)
    objects=EmployeeApprovalCompStatusManager()
    class Meta:
        managed = False
        db_table = 'employee_approval_comp_status'
####################################

class EmployeeAdmin(ExportModelOperationsMixin('employee_admin'), models.Model):
    emp = models.ForeignKey('Employee', models.DO_NOTHING)
    priority = models.IntegerField()
    status = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'employee_admin'


## MANAGER WORK HISTORY TRACKING ##
class ManagerWorkHistory(ExportModelOperationsMixin('manager_work_history'), models.Model):
    emp = models.ForeignKey('Employee', models.DO_NOTHING)
    work_week = models.IntegerField()
    work_year = models.IntegerField(default=0)
    total_work_minutes = models.IntegerField()
    entry_comp_cnt = models.IntegerField()
    approval_comp_cnt = models.IntegerField()
    emp_cnt = models.IntegerField()
    emp_list = models.TextField(blank=True, null=True)
    entry_comp_list = models.TextField(blank=True, null=True)
    approval_comp_list = models.TextField(blank=True, null=True)
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'manager_work_history'
####################################


## COMPANY WORK HISTORY TRACKING ##
class CompanyWorkHistory(ExportModelOperationsMixin('company_work_history'), models.Model):
    company = models.CharField(max_length=100)
    work_week = models.IntegerField()
    total_work_minutes = models.IntegerField()
    entry_comp_cnt = models.IntegerField()
    approval_comp_cnt = models.IntegerField()
    emp_cnt = models.IntegerField()
    emp_list = models.TextField(blank=True, null=True)
    entry_comp_list = models.TextField(blank=True, null=True)
    approval_comp_list = models.TextField(blank=True, null=True)
    created = models.DateTimeField()
    updated = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'company_work_history'
####################################


class AttendanceAccessGroup(ExportModelOperationsMixin('attendance_access_group'), models.Model):
    emp = models.ForeignKey('Employee', models.DO_NOTHING)
    created = models.DateTimeField()
    status = models.IntegerField(default=1)
    class Meta:
        managed = False
        db_table = 'attendance_access_group'


class EmailAccessGroup(ExportModelOperationsMixin('email_access_group'), models.Model):
    emp = models.ForeignKey('Employee', models.DO_NOTHING)
    created = models.DateTimeField()
    status = models.IntegerField(default=1)
    class Meta:
        managed = False
        db_table = 'email_access_group'

class GlobalAccessFlag(ExportModelOperationsMixin('global_access_flag'), models.Model):
    access_type = models.CharField(unique=True, max_length=50)
    created = models.DateTimeField()
    status = models.IntegerField()
    class Meta:
        managed = False
        db_table = 'global_access_flag'

##ATTENDACE DATABASE##
class EmployeeMaster(ExportModelOperationsMixin('EmployeeMaster'), models.Model):
    Id = models.AutoField(primary_key=True)
    EmpId = models.CharField(unique=True, max_length=50)
    DeviceId = models.IntegerField()
    ManagerId = models.CharField(max_length=50)
    EmpName = models.CharField(max_length=50)
    AmdId = models.DecimalField(default=0,blank=True,max_digits=18 ,decimal_places=0)
    class Meta:
        managed = False
        db_table = 'EmployeeMaster'

class PunchLogs(ExportModelOperationsMixin('punch_logs'), models.Model):
    TransID = models.AutoField(primary_key=True)
    DeviceID = models.IntegerField()
    LogDate = models.DateTimeField()
    Direction = models.CharField(max_length = 50)
    SerialNo = models.CharField(max_length=50)
    Hrview_TransID = models.IntegerField()
    Source = models.CharField(max_length=50)

    class Meta:
        managed = False
        db_table = 'punch_logs'

## Space app models
class ServiceAccount(ExportModelOperationsMixin('service_account'), models.Model):
    api_user = models.CharField(unique=True, max_length=255)
    password = models.CharField(max_length=255)
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(auto_now=True)
    status = models.IntegerField(default=1)

    class Meta:
        managed = False
        db_table = 'service_account'
class WelcomeEmailNotification(ExportModelOperationsMixin('welcome_email_notification'), models.Model):
    emp = models.OneToOneField('Employee', models.DO_NOTHING)
    created = models.DateTimeField(default=timezone.now)
    status = models.IntegerField(default = 0)
    class Meta:
        managed = False
        db_table = 'welcome_email_notification'

class RejectedTimesheetEmailNotification(ExportModelOperationsMixin('rejected_timesheet_email_notification'), models.Model):
    emp = models.ForeignKey('Employee', models.DO_NOTHING)
    work_week = models.IntegerField()
    work_year = models.IntegerField()
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(auto_now=True)
    comments = models.CharField(max_length=255, blank=True, null=True)
    status = models.IntegerField(default=0)
    class Meta:
        managed = False
        db_table = 'rejected_timesheet_email_notification'

## STAGE EMPLOYEE PROJECT ##
## project_id IS NOT FOREIGN KEY. VALUE 0 MEANS DISABLE THE PROJECT WITH SAME PRIORITY IN MAIN TABLE
class StageEmployeeProject(models.Model):
    project_id = models.IntegerField(default=0)
    emp = models.ForeignKey('Employee', related_name='empl', on_delete=models.DO_NOTHING)
    priority = models.IntegerField(default=0)
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(auto_now=True)
    status = models.IntegerField(default=1)
    class Meta:
        managed = False
        db_table = 'stage_employee_project'
 

# LEAVE TYPES FOR THE LEAVE APPLICATION
class LeaveType(models.Model):
    name = models.CharField(max_length=50,blank=False,null=False)
    status = models.IntegerField(default=1, blank=False, null=False)
    class Meta:
        managed = False
        db_table = 'leave_type'
 


# LEAVE CREDITS MAPPING FOR EMPLOYEE TYPE AND LEAVE TYPE
class LeaveConfig(models.Model):    
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE)
    max_leaves = models.FloatField(default=0, blank=False, null=False)
    status = models.IntegerField(default=1, blank=False, null=False)

    class Meta:
        managed=False
        unique_together = ('category_id', 'leave_type_id')
        db_table='leave_config'

# TIME PERIODS OF A MONTH FOR A NEW HIRE
class NewHireMonthTimePeriods(models.Model):
    start_date = models.IntegerField(blank=False,null=False)
    end_date = models.IntegerField(blank=False,null=False)
    status = models.IntegerField(default=1, blank=False, null=False)

    class Meta:
        unique_together = ('start_date', 'end_date')
        managed = False
        db_table='leave_policy_month_time_periods'

# LEAVE CREDITS MAPPING FOR FIRST MONTH TIME PERIODS AND EMPLOYEE TYPE
class NewHireLeaveConfig(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    time_period = models.ForeignKey(NewHireMonthTimePeriods, on_delete=models.CASCADE)
    round_off_leave_credit = models.FloatField(default=0, blank=False, null=False)
    status = models.IntegerField(  default=1, blank=False, null=False)
    
    def save(self, *args, **kwargs):
        # print('test')
        self.round_off_leave_credit =  round(self.round_off_leave_credit,1)
        super(NewHireLeaveConfig,self).save(*args, **kwargs)

    class Meta:
        managed = False
        unique_together = ('category_id', 'time_period_id')
        db_table='leave_credit_roundoff_newhire_timeperiod'

# LEAVE REQUEST OBJECT
class LeaveRequest(models.Model):
    emp = models.ForeignKey(Employee, models.DO_NOTHING)
    startdate = models.DateTimeField()
    enddate = models.DateTimeField()
    requested_by = models.CharField(max_length=10, blank=True, null=True)
    leave_type = models.ForeignKey(LeaveType, models.DO_NOTHING)
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(auto_now=True)
    emp_comments = models.CharField(max_length=1000, blank=True, null=True)
    leave_reason = models.CharField(max_length=40, blank=True, null=False )
    uploads_invitation = models.TextField(null=True)
    manager_comments = models.CharField(max_length=255, blank=True, null=True)
    status = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'leave_request'

# LEAVE DATES MAPPED TO A LEAVE REQUEST
class Leave(models.Model):
    leave_request = models.ForeignKey(LeaveRequest, on_delete=models.CASCADE)
    leave_on = models.DateTimeField()
    day_leave_type = models.CharField(max_length=11, blank=True, null=True)
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField( auto_now=True )
    status = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'leave'

# LEAVE BALANCE:: LEAVE MANIPULATION ACTIONS SAVED TO HELP WITH LEAVE BALANCE CALCULATION
class LeaveBalance(models.Model):
    class ACTED_BY_CHOICES(models.TextChoices):
        CRON='cron',_('Cron')
        HR='hr',_('Hr')
    emp = models.ForeignKey('Employee', models.DO_NOTHING)
    year = models.IntegerField()
    month = models.IntegerField()
    leave_credits = models.FloatField()
    acted_by = models.CharField(max_length=4, blank=True, null=True, choices=ACTED_BY_CHOICES.choices)
    hr_emp_id = models.IntegerField(default=0)
    created = models.DateTimeField(default=timezone.now)
    comments = models.CharField(max_length=255, blank=True, null=True)
    status = models.IntegerField()
    current_leave_balance = models.FloatField(blank=True,null=True)
    modified_leave_balance = models.FloatField(blank=True,null=True)
    class Meta:
        managed = False
        db_table = 'leave_balance'

class LeaveDiscrepancy(models.Model):
    leave_request=models.OneToOneField(LeaveRequest,models.DO_NOTHING, related_name='leavediscrepancy')
    emp_comments=models.TextField(max_length=1024,null=True,blank=True)
    manager_comments=models.TextField(max_length=1024,null=True,blank=True)
    created = models.DateTimeField(auto_now_add=True,null=False,blank=False)
    status= models.SmallIntegerField(default=0,null=False,blank=False)

    class Meta:
        managed = False
        db_table = 'leave_discrepancy'

class Company(models.Model):
    name = models.CharField(max_length=50)
    status = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'company'

class Holiday(models.Model):
    holiday_name = models.CharField(max_length=255,unique=True)
    status = models.IntegerField()
    class Meta:
        managed = False
        db_table = 'holiday'

class HolidayCalendar(models.Model):
    holiday = models.ForeignKey('Holiday',on_delete=models.DO_NOTHING)
    holiday_year = models.IntegerField()
    holiday_date = models.DateField()
    status = models.IntegerField()
    class Meta:
        managed = False
        db_table = 'holiday_calendar'

##############LOCATIONHOLIDAYCALANDER###############
class LocationHolidayCalendarQuerySet(models.QuerySet):
    def getdetailedHolidayList(self,emp_id = None):
        qs=self
        if emp_id is not None:
            # print("GOT EMPLOYEE ID",emp_id)
            employee_profile_obj = EmployeeProfile.objects.get(emp_id=emp_id)
            lhc_obj = qs.filter(status=1,holiday_calendar__status=1,location = employee_profile_obj.location_id,holiday_calendar__holiday_year=date.today().year).annotate(
                holiday_name = F('holiday_calendar__holiday__holiday_name'),
                holiday_date = F('holiday_calendar__holiday_date'),
                holiday_year = F('holiday_calendar__holiday_year'),
                location_name = F('location__name')
            )
            return lhc_obj
        # print("NOT GOT EMPID",emp_id)
        qs=qs.annotate(
        holiday_name = F('holiday_calendar__holiday__holiday_name'),
        holiday_date = F('holiday_calendar__holiday_date'),
        holiday_year = F('holiday_calendar__holiday_year'),
        location_name = F('location__name')
        )
        return qs
    
          
class LocationHolidayCalendarManager(models.Manager):
    def get_queryset(self):
        return LocationHolidayCalendarQuerySet(self.model,using=self._db)
    def getdetailedHolidayList(self,emp_id=None):
        return self.get_queryset().getdetailedHolidayList(emp_id=emp_id)
    
class LocationHolidayCalendar(models.Model):
    location = models.ForeignKey('Location',on_delete=models.DO_NOTHING)
    holiday_calendar = models.ForeignKey('HolidayCalendar',on_delete=models.DO_NOTHING)
    status = models.IntegerField()

    objects = LocationHolidayCalendarManager()
    class Meta:
        managed = False
        db_table = 'location_holiday_calendar'
###################################################################

class HolidayPermament(models.Model):
    name = models.CharField(max_length=255)
    status = models.IntegerField(default=1)
    class Meta:
        managed = False
        db_table = 'holiday_permanent'
        

class HolidayViewConfirmation(models.Model):
    year= models.IntegerField(unique=True)
    status = models.IntegerField(default=1)
    class Meta:
        managed = False
        db_table = 'holiday_view_confirmation'

class TimesheetDiscrepancy(models.Model):
    id = models.BigAutoField(primary_key=True)
    employee_project_time_tracker = models.ForeignKey(EmployeeProjectTimeTracker, models.DO_NOTHING)
    leave_request = models.ForeignKey(LeaveRequest,models.DO_NOTHING)
    work_minutes = models.IntegerField()
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(auto_now=True)
    status = models.IntegerField()

    class Meta:
        managed = False
        db_table = "timesheet_discrepancy"
        
class ManagerEmailOpted(ExportModelOperationsMixin('manager_email_opted'), models.Model):
    emp = models.ForeignKey('Employee', models.DO_NOTHING)
    created = models.DateTimeField(default=timezone.now)
    status = models.IntegerField(default=0)
    class Meta:
        managed = False
        db_table = 'manager_email_opted'
class LeaveAccessGroup(models.Model):
    emp = models.ForeignKey(Employee, models.DO_NOTHING)
    created =  models.DateTimeField(default=timezone.now)
    status = models.IntegerField(default=1  )
    class Meta:
        managed = False
        db_table = 'leave_access_group'
        
class EmailQueue(models.Model):
    emp = models.ForeignKey(Employee, models.DO_NOTHING)
    email = models.CharField(max_length=100)
    email_type = models.CharField(max_length=50)
    email_subject = models.CharField(max_length=255)
    required_inputs = models.TextField()
    created = models.DateTimeField(default=timezone.now)
    status = models.IntegerField(default=0)
    class Meta:
        managed = False
        db_table = 'email_queue'

class LeaveBalanceUploaded(models.Model):
    emp = models.ForeignKey(Employee, models.DO_NOTHING)
    leave_balance_filename = models.CharField(max_length=255)
    info = models.TextField(blank=True)
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(default=timezone.now)
    status = models.IntegerField(default=0)

    class Meta:
        managed = False
        db_table = 'leave_balance_uploaded'

class EmployeeTimesheetApprovedHistory(models.Model):
    emp = models.ForeignKey('Employee', models.DO_NOTHING)
    work_date = models.DateField()
    work_minutes = models.IntegerField()
    swipe_minutes = models.IntegerField()
    rm = models.ForeignKey('Employee', related_name='rm' ,on_delete=models.DO_NOTHING)
    mm = models.ForeignKey('Employee', related_name='mm' ,on_delete=models.DO_NOTHING)
    fo = models.ForeignKey('Employee', related_name='fo', on_delete=models.DO_NOTHING)
    rm_comments = models.TextField()
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(default=timezone.now)
    status = models.IntegerField(default=1)
    class Meta:
        managed = False
        db_table = 'employee_timesheet_approved_history'

class PolicyType(models.Model):
    name = models.CharField(max_length=255)
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(auto_now=True)
    status = models.IntegerField()
    class Meta:
        managed = False
        db_table = 'policy_type'

class PolicyDocument(models.Model):
    policy_type = models.ForeignKey('PolicyType', models.DO_NOTHING)
    policy_name = models.CharField(max_length=255)
    display_name = models.CharField(max_length=255)
    file_name = models.CharField(max_length=255)
    enable_for = models.CharField(max_length=20)
    enable_on = models.DateField()
    expire_on = models.DateField()
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(auto_now=True)
    status = models.IntegerField(default=1)
    class Meta:
        managed = False
        db_table = 'policy_document'
class PolicyCompany(models.Model):
    company = models.ForeignKey('Company', models.DO_NOTHING)
    policy = models.ForeignKey('PolicyDocument', models.DO_NOTHING)
    status = models.IntegerField()
    class Meta:
        managed = False
        db_table = 'policy_company'
class PolicyDocumentEmployeeAccessPermission(models.Model):
    policy_document = models.ForeignKey('PolicyDocument', models.DO_NOTHING)
    emp = models.ForeignKey('Employee', models.DO_NOTHING)
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(auto_now=True)
    status = models.IntegerField()
    class Meta:
        managed = False
        db_table = 'policy_document_employee_access_permission'
class PolicyDocumentEmployeeAction(models.Model):
    policy_document = models.ForeignKey('PolicyDocument', models.DO_NOTHING)
    emp = models.ForeignKey('Employee', models.DO_NOTHING)
    is_policy_accepted = models.BooleanField(default=False)
    upload_status = models.BooleanField(default=False)
    upload_policy_document = models.CharField(max_length=255, blank=True, null=True)
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(auto_now=True)
    status = models.IntegerField(default=1)

    class Meta:
        managed = False
        db_table = 'policy_document_employee_action'

class StageEmpolyee(models.Model):
    emp = models.ForeignKey(Employee, models.DO_NOTHING,related_name='stage_employee')
    status = models.IntegerField(default=1)
    relieved = models.DateField()
    class Meta:
        managed = False
        db_table = 'stage_employee'

class leaveRequestDisable(models.Model):
    startdate = models.DateTimeField()
    enddate = models.DateTimeField()
    class Meta:
        managed = False
        db_table = 'leave_request_disable'


class SubAdminAccess(models.Model):
    emp = models.ForeignKey('Employee', models.DO_NOTHING)
    module = models.CharField(max_length=255)
    status = models.IntegerField(default=0)
    class Meta:
        managed = False
        db_table = 'sub_admin_access'


class VedaBatch(ExportModelOperationsMixin('veda_batch'), models.Model):
    id = models.AutoField(primary_key=True)
    batch_name = models.CharField(max_length=255, unique=True, null=False)
    status = models.IntegerField(default=1)    
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = 'veda_batch'
        managed = False
class VedaStudent(ExportModelOperationsMixin('veda_student'), models.Model):
    id = models.AutoField(primary_key=True)
    batch = models.ForeignKey('VedaBatch', models.DO_NOTHING)
    student_name = models.CharField(max_length=255, null=False)
    device_id = models.IntegerField(null=False)    
    status = models.IntegerField(default=1)    
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = 'veda_student'
        managed = False