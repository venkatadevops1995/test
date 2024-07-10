import json
from rest_framework.response import Response
from django.conf import settings
import jwt
import traceback
import logging
from django.db import connection, reset_queries
import time
import functools
from .utils import utils
from .models import Employee
log = logging.getLogger(__name__)


#Error handling decorator
def exception_decorator():
    def decorator(func):
        def exceptionfunction(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                log.error(traceback.format_exc())
                return Response({"message":"unexpected error"},status=422)
        return exceptionfunction
    return decorator

""" API view method decorator to check if a user is a manager """
def is_manager(func):
    def check_is_manager(self,request,*args,**kwargs): 
        # print(request)
        auth_details = utils.validateJWTToken(request)
        if ((auth_details['role_id'] == 1) and (not auth_details['is_emp_admin']) and (len(auth_details['sub_report_access']) == 0)):
            return Response({"message":'you are forbidden to make this request'},status=403)
        return func(self,request, *args,**kwargs)
    return check_is_manager


""" API view method decorator to check if a user is an admin """
def is_admin(func):
    def check_is_admin(self,request,*args,**kwargs): 
        # print(request)
        auth_details = utils.validateJWTToken(request)
        if not auth_details['is_emp_admin']:
            return Response({"message":'you are forbidden to make this request'},status=403)
        return func(self,request, *args,**kwargs)
    return check_is_admin

def jwttokenvalidator(viewfunction):
    def validator(*args, **kwargs):
        request=args[1]
        try:
            btoken = request.query_params.get('btoken', None)
            if(btoken is not None):
                token = "Bearer "+btoken                
            else: 
                token = request.META['HTTP_AUTHORIZATION']
            if(str(settings.TOKEN_TYPE) not in token):
                return Response({'Message':"Token Missing"},status=400)
            d=jwt.decode(token.replace(settings.TOKEN_TYPE, '').strip(), settings.SECRET_KEY, algorithms=['HS256'])
            if('gender' not in d):
                return Response({'Message':settings.VALID_ERROR_MESSAGES['token_expired']},status=400)
            if Employee.objects.filter(emp_id = d['emp_id'], status = 0).exists() :
                return Response({'Message':settings.VALID_ERROR_MESSAGES['token_expired']},status=400)

            return viewfunction(*args,**kwargs)

        except jwt.exceptions.ExpiredSignatureError as e:
            return Response({'Message':settings.VALID_ERROR_MESSAGES['token_expired']},status=400)

        except Exception as e:
            if('HTTP_AUTHORIZATION' in str(e)):
                return Response({'Message':"please login"},status=400)
            return Response({'Message':settings.VALID_ERROR_MESSAGES['token_expired']},status=400)                
    return validator

def servicejwttokenvalidator(viewfunction):
    def validator(*args, **kwargs):
        request=args[1]
        try:
            token = request.META['HTTP_AUTHORIZATION']
            if(str(settings.TOKEN_TYPE) not in token):
                #return Response({'Message':"Token Missing"},status=400)
                return Response(utils.StyleRes(False,'Token Missing', {}), status=401)
            d=jwt.decode(token.replace(settings.TOKEN_TYPE, '').strip(), settings.SECRET_KEY, algorithms=['HS256'])
            if('gender' not in d):
                return Response({'Message':settings.VALID_ERROR_MESSAGES['token_expired']},status=400)

            return viewfunction(*args,**kwargs)

        except jwt.exceptions.ExpiredSignatureError as e:
            return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['token_expired'], {}), status=401)
                           

        except Exception as e:
            if('HTTP_AUTHORIZATION' in str(e)):
                # return Response({'Message':"please login"},status=400)
                return Response(utils.StyleRes(False,'please login', {}), status=401)
            return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['token_expired'], {}), status=401)                
    return validator

def query_debugger(func):

    @functools.wraps(func)
    def inner_func(*args, **kwargs):

        reset_queries()
        
        start_queries = len(connection.queries)
        print("START QUERIES",start_queries,connection.queries)

        start = time.perf_counter()
        result = func(*args, **kwargs)
        end = time.perf_counter()

        end_queries = len(connection.queries)

        print(f"Function : {func.__qualname__}")
        
        for i,each in enumerate(connection.queries):
            # print(each,"----------------")
            pass
        print(f"Number of Queries : {end_queries - start_queries}")
        print(f"Finished in : {(end - start):.2f}s")
        return result

    return inner_func

custom_exceptions = exception_decorator()