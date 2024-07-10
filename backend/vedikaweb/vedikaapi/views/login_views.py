from vedikaweb.vedikaapi.decorators import servicejwttokenvalidator, custom_exceptions
from rest_framework.views import APIView
from vedikaweb.vedikaapi.serializers import LoginSerializer, ForgotPasswordSerializer, TokenVerificationSerializer, RegisterConfirmSerializer, ServieLoginSerializer
from vedikaweb.vedikaapi.models import Employee, ServiceAccount
from hashlib import md5
from rest_framework.response import Response

from vedikaweb.vedikaapi.constants import EmpStatus,StatusCode
from vedikaweb.vedikaapi.utils import utils
from django.conf import settings

import traceback, json
from datetime import datetime
import logging
from hashlib import md5

log = logging.getLogger(__name__)


class LoginView(APIView):

    def get_serializer(self):
        return LoginSerializer()

    def post(self, request):
        try:
            serialized = LoginSerializer(data=request.data)
            if (serialized.is_valid()):
                email = serialized.data['email']
                password = serialized.data['password']

                #Check email and user name already exists..
                user = None
                try:
                    # TODO: USE MD5 OR HASH TO GET DB PASSWORD
                    hashpass = md5(password.encode('utf8')).hexdigest()
                    user =  Employee.objects.get(email=email, password=hashpass)
                except Employee.DoesNotExist:
                    log.error("Failed to login email="+email)
                    return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['invalidlogins'],{}), status=StatusCode.HTTP_UNAUTHORIZED)

                # Checking Employee is active or not
                if(user.status == EmpStatus.InActive):
                    return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['In_Active_Employee'],{}), status=StatusCode.HTTP_UNAUTHORIZED)

                try:
                    payload = utils.getJWTToken(request)
                    return Response(utils.StyleRes(True,settings.VALID_ERROR_MESSAGES['access_token'],payload), status=StatusCode.HTTP_OK)
                except Exception as e:
                    log.error(traceback.format_exc())
                    return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['something_went_wrong'],{}), status=StatusCode.HTTP_UNPROCESSABLE_ENTITY)
            else:
                return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['invalid_inputs'], serialized._errors), status=StatusCode.HTTP_EXPECTATION_FAILED)
        except Exception as e:
            log.error(traceback.format_exc())
            return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['something_went_wrong'],{}), status=StatusCode.HTTP_UNPROCESSABLE_ENTITY)


class ForgotPasswordView(APIView):

    def get_serializer(self):
        return ForgotPasswordSerializer()

    def post(self, request):
        try:
            serialized = ForgotPasswordSerializer(data=request.data)
            if (serialized.is_valid()):
                email = serialized.data['email']

                user=None
                try:
                    user =  Employee.objects.get(email=email)
                except Employee.DoesNotExist:
                    log.error("email="+email+", "+traceback.format_exc())
                    return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['invalidlogins'],{}), status=StatusCode.HTTP_UNAUTHORIZED)

                # Checking Employee is active or not
                if(user.status == EmpStatus.InActive):
                    return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['In_Active_Employee'],{}), status=StatusCode.HTTP_UNAUTHORIZED)
                ret_val = utils.sendForgotPasswordMail(email)
                userDetails ={}
                userDetails['email'] = email
                if(ret_val == 1):
                    return Response(utils.StyleRes(True,settings.VALID_ERROR_MESSAGES['forgot_password_email_sent'],userDetails), status=StatusCode.HTTP_OK)
                else:
                    log.error(traceback.format_exc())
                    return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['forgot_password_email_not_sent'],{}), status=StatusCode.HTTP_UNPROCESSABLE_ENTITY)
            else:
                return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['invalid_inputs'], serialized._errors), status=StatusCode.HTTP_EXPECTATION_FAILED)

        except Exception as e:
            log.error(traceback.format_exc())
            return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['something_went_wrong'],{}), status=StatusCode.HTTP_UNPROCESSABLE_ENTITY)

class ResetPasswordTokenVerificationView(APIView):
    def get_serializer(self):
        return TokenVerificationSerializer()

    def post(self, request):
        try:
            serialized = TokenVerificationSerializer(data=request.data)
            if (serialized.is_valid()):
                token = serialized.data['token']
                userDetails = utils.decrypt(token)
                jsonDetails = json.loads(userDetails)
                email = jsonDetails['email']

                current_time = int(datetime.now().timestamp())
                if(current_time > int(jsonDetails['datetime'])):
                   return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['token_expired'], {}), status=StatusCode.HTTP_UNAUTHORIZED)

                user=None
                try:
                    user =  Employee.objects.get(email=email)
                except Employee.DoesNotExist:
                    log.error("email="+email+", "+traceback.format_exc())
                    return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['invalid_email'],{}), status=StatusCode.HTTP_UNAUTHORIZED)

                # Checking Employee is active or not
                if(user.status == EmpStatus.InActive):
                    return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['In_Active_Employee'],{}), status=StatusCode.HTTP_UNAUTHORIZED)

                return Response(utils.StyleRes(True,settings.VALID_ERROR_MESSAGES['valid_token'],{}), status=StatusCode.HTTP_OK)

            else:
                return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['invalid_inputs'], serialized._errors), status=StatusCode.HTTP_EXPECTATION_FAILED)

        except Exception as e:
            log.error(traceback.format_exc())
            return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['something_went_wrong'],{}), status=StatusCode.HTTP_UNPROCESSABLE_ENTITY)


class ResetPasswordView(APIView):
    def get_serializer(self):
        return RegisterConfirmSerializer()

    def post(self, request):
        try:
            serialized = RegisterConfirmSerializer(data=request.data)
            if (serialized.is_valid()):
                token = serialized.data['token']
                password = serialized.data['password']

                userDetails = utils.decrypt(token)
                jsonDetails = json.loads(userDetails)
                email = jsonDetails['email']

                user=None
                try:
                    user =  Employee.objects.get(email=email)
                except Employee.DoesNotExist:
                    log.error("email="+email+", "+traceback.format_exc())
                    return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['invalid_email'],{}), status=StatusCode.HTTP_UNAUTHORIZED)
                    
                # Checking Employee is active or not
                if(user.status == EmpStatus.InActive):
                    return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['In_Active_Employee'],{}), status=StatusCode.HTTP_UNAUTHORIZED)

                # TODO: USE MD5 OR HASH TO SAVE PASSWORD
                hashpass = md5(password.encode('utf8')).hexdigest()
                user.password = hashpass
                user.save()

                return Response(utils.StyleRes(True,settings.VALID_ERROR_MESSAGES['password_rest_success'],{}), status=StatusCode.HTTP_OK)

            else:
                return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['invalid_inputs'], serialized._errors), status=StatusCode.HTTP_EXPECTATION_FAILED)

        except Exception as e:
            log.error(traceback.format_exc())
            return Response(utils.StyleRes(False,settings.VALID_ERROR_MESSAGES['something_went_wrong'],{}), status=StatusCode.HTTP_UNPROCESSABLE_ENTITY)
