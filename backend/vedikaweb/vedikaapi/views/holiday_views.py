from rest_framework.views import APIView
from rest_framework.response import Response
from vedikaweb.vedikaapi.models import Employee, LocationHolidayCalendar, HolidayCalendar, Location,Holiday, HolidayViewConfirmation, HolidayPermament



from vedikaweb.vedikaapi.serializers import LocationHolidayCalendarSerializer, HolidayCalendarSerializer,AddHolidayCalendarSerializer, HolidaySerializer, LocationHolidayCalendarCustomSerializer

from vedikaweb.vedikaapi.constants import StatusCode
from vedikaweb.vedikaapi.utils import utils
from django.conf import settings
from vedikaweb.vedikaapi.decorators import custom_exceptions,jwttokenvalidator
from django.db.models import Q,F,Value as V
#logging
import traceback, json
from datetime import datetime, timedelta
import logging
from vedikaweb.vedikaapi.services.attendance_services import AttendenceService as attendance
from django.core.mail import send_mail
from django.template.loader import get_template
from rest_framework import generics
from django.db.models import  When, Case
from vedikaweb.vedikaapi.filters import HolidayFilter
from vedikaweb.vedikaapi.services.email_service import email_service

log = logging.getLogger(__name__)

attendance_ = attendance()


class LocationView(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400) 
        res = Location.objects.filter(status=1).values()
        return Response(utils.StyleRes(True,"location data",res), status=StatusCode.HTTP_OK)

class DefaultHolidayList(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400) 
        res = HolidayPermament.objects.filter(Q(status=1)).values()
        return  Response(utils.StyleRes(True,"holiday list data",res), status=StatusCode.HTTP_OK)

class LocationHolidayCalendarView(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        emp_id=auth_details['emp_id']
        is_emp_admin = auth_details["is_emp_admin"]
        year= request.query_params.get('year',datetime.now().year)
        year = datetime.now().year if year == "" else int(year)
        is_visible = True if (is_emp_admin or len(HolidayViewConfirmation.objects.filter(year=year,status=1))>0) else False
        hol_list = []
        res = {}
        if(is_visible):
            holiday_cal_data = HolidayCalendar.objects.prefetch_related('locationholidaycalendar_set').select_related('holiday').filter(Q(status=1) & Q(holiday_year=year)).order_by('holiday_date')
            is_confirmed = True if len(HolidayViewConfirmation.objects.filter(year=year,status=1))>0 else False
            
            # holiday_ids = set(holiday_cal_data.values_list('holiday',flat=True))
            holiday_ids = []
            [holiday_ids.append(x) for x in holiday_cal_data.values_list('holiday',flat=True) if x not in holiday_ids]
        
            for each_holiday_id in holiday_ids:
                each_hol_data = holiday_cal_data.filter(holiday=each_holiday_id)
                # print("-------",each_hol_data)
                # if(len(each_hol_data)>0):
                loc_list = [l.loc_id for l in each_hol_data[0].locationholidaycalendar_set.filter(Q(status=1)).annotate(loc_id=F('location_id'),loc_name=F('location__name'))]
                # if(len(loc_list)==0 and is_emp_admin==False):
                #     continue
                
                hol_list.append({'holiday_year':each_hol_data[0].holiday_year, 'holiday_date':each_hol_data[0].holiday_date,'start_date':each_hol_data[0].holiday_date,'end_date':each_hol_data[len(each_hol_data)-1].holiday_date,
                'holiday_count':len(each_hol_data), 'holiday':{'id':each_hol_data[0].holiday.id,'holiday_name':each_hol_data[0].holiday.holiday_name},'editable':datetime.now().date()<each_hol_data[0].holiday_date,
                'locations': loc_list})

            res = {'holidays':hol_list,'is_confirmed':is_confirmed}
            if(not is_emp_admin):
                is_next_year_visible = True if len(HolidayViewConfirmation.objects.filter(Q(year=year+1)&Q(status=1)))>0 else False
                res.update({'is_next_year_visible': is_next_year_visible}) 

            # for i,each_holiday_cal_data in enumerate(holiday_cal_data.values()):
            #     each_holiday_cal_data.update({'holiday':{'id':holiday_cal_data[i].holiday.id,'holiday_name':holiday_cal_data[i].holiday.holiday_name},'locations':[l.loc_id for l in holiday_cal_data[i].locationholidaycalendar_set.filter(Q(status=1)).annotate(loc_id=F('location_id'),loc_name=F('location__name'))]})
            #     res.append(each_holiday_cal_data)

        return  Response(utils.StyleRes(True,"location holiday calendar data",res), status=StatusCode.HTTP_OK)

    @jwttokenvalidator
    @custom_exceptions
    def post(self,request):
        # holiday_calendar_serial_data = HolidayCalendarSerializer(data = )
        # print(request.data)
        req_data = []
        for index in request.data:
            d=json.loads(request.data[index])
            d.update({'status':1})
            req_data.append(d)
        
        serial_data = AddHolidayCalendarSerializer(data=req_data,many=True)
        if(serial_data.is_valid()):
         
            holiday_calendar_data =[]
            for each_serial_data in serial_data.data:
                holiday_calendar_data.append({'holiday':each_serial_data['holiday'],'holiday_year':each_serial_data['holiday_year'],'holiday_date':each_serial_data['holiday_date'],'status':each_serial_data['status']})
            holiday_calendar_serial_data=HolidayCalendarSerializer(data=holiday_calendar_data,many=True)
            if(holiday_calendar_serial_data.is_valid()):
                ids=holiday_calendar_serial_data.save()
           

                hol_loc_data =[]
                for index,each_hol in enumerate(ids):
                    for each_loc in serial_data.data[index]['locations']:
                        # print(index,each_hol.id)
                        hol_loc_data.append({'location':each_loc,'holiday_calendar':each_hol.id,'status':1})
           
                hol_loc_serial = LocationHolidayCalendarSerializer(data=hol_loc_data,many=True)
                if(hol_loc_serial.is_valid()):
                    
                    hol_loc_serial.save()
                else:
                    pass
                    # print('hol_loc_serial',hol_loc_serial.errors)
            return  Response(utils.StyleRes(True,"holiday list create",[]), status=StatusCode.HTTP_CREATED)
        # print(serial_data.errors)
        return  Response(utils.StyleRes(False,"holiday list creation error",str(serial_data.errors)), status=StatusCode.HTTP_CONFLICT)

class LocationHolidayCalendarUpdateView(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def post(self,request):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400) 
        # holiday_calendar_serial_data = HolidayCalendarSerializer(data = )
        # print(request.data)
        req_data = []
        for index in request.data:
            d=json.loads(request.data[index])
            d.update({'status':1})
            req_data.append(d)

        serial_data = AddHolidayCalendarSerializer(data=req_data,many=True)
        if(serial_data.is_valid(raise_exception=True)):
            modified_or_added_holiday_calendar_ids = []
            existing_holiday_dates = []
            for each_serial_data in serial_data.data:
                #GET HOLIDAY OR CREATE
                holiday_id = Holiday.objects.filter(Q(holiday_name=each_serial_data['holiday']))
                if(len(holiday_id)==0):
                    holiday_serial_data = HolidaySerializer(data={'holiday_name':each_serial_data['holiday'],'status':1})
                    if(holiday_serial_data.is_valid()):
                        holiday_id=holiday_serial_data.save()
                        holiday_id=holiday_id.id
                else:
                    if(holiday_id[0].status == 0 ):
                        holiday_id.update(status=1)
                    holiday_id = holiday_id[0].id

                holiday_dates = []
                # start_date = datetime.strptime(each_serial_data['holiday_date'], '%Y-%m-%d')
                start_date = datetime.strptime(each_serial_data['start_date'], '%Y-%m-%d')
                end_date = datetime.strptime(each_serial_data['end_date'], '%Y-%m-%d')
                # print(start_date)
                holiday_dates.append(start_date)

                # for cnt in range(1,each_serial_data['holiday_count']):
                #     start_date += timedelta(days=1)
                #     if(start_date.weekday()==5):
                #         start_date += timedelta(days=2)
                #     if(start_date.weekday()==6):
                #         start_date += timedelta(days=1)
                #     holiday_dates.append(start_date)
                # print(holiday_dates)

                while(start_date<end_date):
                    start_date += timedelta(days=1)
                    if(start_date.weekday()==5):
                        start_date += timedelta(days=2)
                    if(start_date.weekday()==6):
                        start_date += timedelta(days=1)
                    holiday_dates.append(start_date)
                # print(holiday_dates)
                
                for each_holiday_date in holiday_dates:
                    existing_holiday_cal=HolidayCalendar.objects.filter(Q(holiday_date=each_holiday_date)&Q(holiday=holiday_id))
                    # existing_holiday_dates.append(each_holiday_date)
                    existing_holiday_dates.append(each_holiday_date)
                    holiday_calendar_id = None
                    if(len(existing_holiday_cal)>0):
                        if(existing_holiday_cal[0].holiday_id != holiday_id or existing_holiday_cal[0].status!=1):
                            existing_holiday_cal.update(holiday=holiday_id,status=1)
                            # print('changed for',each_holiday_date)
                        holiday_calendar_id = existing_holiday_cal[0].id 
                    else:
                        serial_new_data = HolidayCalendarSerializer(data={'holiday':holiday_id,'holiday_year':each_serial_data['holiday_year'],'holiday_date': datetime.strftime(each_holiday_date, '%Y-%m-%d'),'status':each_serial_data['status']})
                        if(serial_new_data.is_valid()):
                            holiday_calendar_id=serial_new_data.save()
                            holiday_calendar_id = holiday_calendar_id.id
                            # log.debug("added new date for "+",".join(map(str,  each_holiday_date)))
                        else:
                            pass
                    # print(existing_holiday_ids[-1])

                    modified_or_added_holiday_calendar_ids.append(holiday_calendar_id)

                    existing_locations = list(LocationHolidayCalendar.objects.filter(Q(holiday_calendar=holiday_calendar_id)&Q(status=1)).values_list('location',flat=True))
                    hol_loc_data = []
                    for each_loc in each_serial_data['locations']:
                        if(each_loc not in existing_locations):
                            hol_loc_data.append({'location':each_loc,'holiday_calendar':holiday_calendar_id,'status':1})
                        else:
                            existing_locations.remove(each_loc)

                    hol_loc_serial = LocationHolidayCalendarSerializer(data=hol_loc_data,many=True)
                    if(hol_loc_serial.is_valid()):
                       
                        hol_loc_serial.save()
                    LocationHolidayCalendar.objects.filter(Q(holiday_calendar=holiday_calendar_id)&Q(location__in=existing_locations)).update(status=0)
            
            # HolidayCalendar.objects.filter(~Q(holiday_date__in=existing_holiday_dates)&Q(holiday_year=each_serial_data['holiday_year'])&Q(status=1)).update(status=0)
            #print('***',modified_or_added_holiday_calendar_ids)
            HolidayCalendar.objects.filter(~Q(id__in=modified_or_added_holiday_calendar_ids)&Q(holiday_year=each_serial_data['holiday_year'])).update(status=0)
            
            return  Response(utils.StyleRes(True,"update holiday cal",[]), status=StatusCode.HTTP_CREATED)
        return  Response(utils.StyleRes(False,"update holiday list creation error",str(serial_data.errors)), status=StatusCode.HTTP_CONFLICT)

class DateView(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400) 
        current_date={'date':datetime.now().strftime("%Y-%m-%d")}
        return  Response(utils.StyleRes(True,"current date",current_date), status=StatusCode.HTTP_OK)



class ConfirmHoliday(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def post(self,request):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400) 
        year = request.data.get("year",None)
        if (year != None and year != ""):
            holidays = HolidayCalendar.objects.filter(Q(holiday_year=year)&Q(status=1))
            if(len(holidays)>0):
                existing_holidayview= HolidayViewConfirmation.objects.filter(Q(year=year)&Q(status=0))
                if(len(existing_holidayview)>0):
                    existing_holidayview.update(status=1)
                else:
                    HolidayViewConfirmation(year=year,status=1).save()
                email_service.sendHolidayCalendar(year)
                log.info("ENABLING HOLIDAY CALENDAR AND SENDING EMAIL FOR YEAR {}".format(year))
                return  Response(utils.StyleRes(True,"Confirm holiday successfully","Confirmed holiday for year {}".format(year)), status=StatusCode.HTTP_CREATED)
            return  Response(utils.StyleRes(False,"Error in Confirm holiday","No holidays were added for year {}".format(year)), status=StatusCode.HTTP_CONFLICT) 
        return  Response(utils.StyleRes(False,"Error in Confirm holiday ","year: field should not be empty"), status=StatusCode.HTTP_CONFLICT)


class HolidayView(generics.ListAPIView):
    queryset = LocationHolidayCalendar.objects.getdetailedHolidayList()
    serializer_class = LocationHolidayCalendarCustomSerializer
    filterset_class = HolidayFilter
