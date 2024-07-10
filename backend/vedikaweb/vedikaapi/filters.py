from django_filters import FilterSet
from django_filters import rest_framework as filters
from .models import EmployeeProfile, LocationHolidayCalendar
from datetime import datetime, timedelta, date
from django.db.models import F

class HolidayFilter(FilterSet):
    location = filters.CharFilter(method='filter_by_location')
    emp_id = filters.CharFilter(method='filter_by_empid')

    class Meta:
        model = LocationHolidayCalendar
        fields = ('id',)

    def filter_by_location(self,queryset,name,value):
        return queryset.filter(location=value,holiday_calendar__holiday_year=date.today().year)

    def filter_by_empid(self,queryset,name,value):
        employee_profile_obj = EmployeeProfile.objects.get(emp_id=value)
        lhc_obj = LocationHolidayCalendar.objects.filter(location = employee_profile_obj.location_id,holiday_calendar__holiday_year=date.today().year,status=1,holiday_calendar__status=1).annotate(
            holiday_name = F('holiday_calendar__holiday__holiday_name'),
            holiday_date = F('holiday_calendar__holiday_date'),
            holiday_year = F('holiday_calendar__holiday_year'),
            location_name = F('location__name')
        )
        return lhc_obj



