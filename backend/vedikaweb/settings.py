
import os
from datetime import timedelta
from six.moves import configparser

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
config = configparser.SafeConfigParser(allow_no_value=True, interpolation=None)


config.read('%s/configs/dev.config' % (PROJECT_DIR))
logFolder =  '%s/logs' % (PROJECT_DIR)
if not os.path.exists(logFolder):
    os.makedirs(logFolder)

print("debug value: ",config.get('general', 'DEBUG'))

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/3.0/howto/deployment/checklist/



UPLOAD_MIS_PATH = config.get('general', 'UPLOAD_MIS_PATH')
UPLOAD_EMP_PATH = config.get('general', 'UPLOAD_EMP_PATH')

# base name used to point http or https
BASE_MIS_FILES = config.get('general', 'BASE_MIS_FILES')
BASE_LEAVE_BALANCE = config.get('general', 'BASE_LEAVE_BALANCE')
BASE_INVITATIONS = config.get('general', 'BASE_INVITATIONS')
BASE_PROFILE = config.get('general', 'BASE_PROFILE')
BASE_POLICIES = config.get('general','BASE_POLICIES')
ADMIN_EMAIL_ATTACHMENT = config.get('general','ADMIN_EMAIL_ATTACHMENT')

#File System paths to upload files
UPLOAD_PATH = os.path.join(UPLOAD_MIS_PATH,BASE_MIS_FILES)
UPLOAD_LEAVE_BALANCE_PATH = os.path.join(UPLOAD_MIS_PATH,BASE_LEAVE_BALANCE)
UPLOAD_INVITATIONS_PATH = os.path.join(UPLOAD_EMP_PATH,BASE_INVITATIONS)
UPLOAD_PROFILE_PIC_PATH = os.path.join(UPLOAD_EMP_PATH,BASE_PROFILE)
BASE_POLICIES_PATH = os.path.join(UPLOAD_EMP_PATH,BASE_POLICIES)
UPLOAD_ADMIN_EMAIL_ATTACHMENT_PATH = os.path.join(UPLOAD_MIS_PATH,ADMIN_EMAIL_ATTACHMENT)

#URLS TO access http or https
INVITATION_IMAGE_URL =  os.path.join(config.get('general', 'IMAGE_URL'),BASE_INVITATIONS)
PROFILE_IMAGE_URL =  os.path.join(config.get('general', 'IMAGE_URL'),BASE_PROFILE)

MEDIA_FOLDER = config.get('general', 'MEDIA_FOLDER')
DOMAIN_URL = config.get('general', 'DOMAIN_URL')
UI_URL = config.get('general', 'UI_URL')


MEDIA_ROOT = UPLOAD_EMP_PATH # os.path.join(BASE_DIR, MEDIA_FOLDER)
MEDIA_URL = '/media/'


# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config.get('security', 'SECRET_KEY') #'mze7)kac0&##qx=_8i4&6lxxw9q!@pt@z1&a%i3=*mz6(dz)vi'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = bool(config.get('general', 'DEBUG'))

ALLOWED_HOSTS = ['*'] # allow only Dominname

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'vedikaweb.vedikaapi',
    'django_crontab',
    'rest_framework_swagger',
    'django_prometheus',
    'django_filters',
]

MIDDLEWARE = [
    'django_prometheus.middleware.PrometheusBeforeMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.contrib.admindocs.middleware.XViewMiddleware',
    'django_prometheus.middleware.PrometheusAfterMiddleware',
]

CRONJOBS = [
    ('30 * * * *', 'vedikaweb.vedikaapi.cron.sentWelcomeEmail'),
    ('5 0 * * 0', 'vedikaweb.vedikaapi.cron.employee_time_entry_complaince'),
    ('5 0 * * 3', 'vedikaweb.vedikaapi.cron.employee_approval_complaince'),
    ('5 0 * * 2', 'vedikaweb.vedikaapi.cron.ManagerNotificationThree'),#EVERY TUESDAY MANAGER MAIL
    ('5 15 * * 5', 'vedikaweb.vedikaapi.cron.EmployeeNotificationOne'),#EVERY FRIDAY EMPLOYEE MAIL
    ('5 0 * * 6', 'vedikaweb.vedikaapi.cron.EmployeeNotificationTwo'),#EVERY SATURDAY EMPLOYEE REMAINDER MAIL
    ('5 1 * * 6', 'vedikaweb.vedikaapi.cron.ManagerNotificationOneTwo'),#EVERY SATURDAY MANAGER MAIL
    ('5 1 * * 0', 'vedikaweb.vedikaapi.cron.ManagerNotificationOneTwo'),#EVERY SUNDAY MANAGER MAIL
    ('5 1 * * 3', 'vedikaweb.vedikaapi.cron.ModifyProjectsCron'), #EVERY WEDNESDAY PROJECT UPDATE 
    ('5 0 1 * *', 'vedikaweb.vedikaapi.cron.LeaveUpdateCron'), #EVERY 1ST DAY OF MONTH LEAVE UPDATE
    ('15 0 * * *', 'vedikaweb.vedikaapi.cron.autoApprovalOfExpiredLeaveRequests'), # AUTO APPROVE LEAVES
    ('*/10 * * * *', 'vedikaweb.vedikaapi.cron.emailCron'), #Cron to send all pending emails
    ('5 22 28-31 * *','vedikaweb.vedikaapi.cron.sendMisMail'),#  Cron to Send MIS Mail on the end of the month at 22:05
    ('10 22 28-31 * *','vedikaweb.vedikaapi.cron.sendLeaveBalanceEmail'),#Cron to Send CLB Mail on the end of the month at 22:05
    ('5 21 * * *','vedikaweb.vedikaapi.cron.relieveEmployee')#Cron to Run  Every day at 21:05 to disable the employee from staged table
]

ROOT_URLCONF = 'vedikaweb.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'vedikaweb.wsgi.application'


# Database
# https://docs.djangoproject.com/en/3.0/ref/settings/#databases

DATABASES = {
        'default': {
            'ENGINE': config.get('databases', 'ENGINE'),
            'NAME': config.get('databases', 'NAME'),
            'USER': config.get('databases', 'USER'),
            'PASSWORD': config.get('databases', 'PASSWORD'),
            'HOST': config.get('databases', 'HOST'),
            'PORT': config.get('databases', 'PORT'),
        },
        'attendance': {
            'ENGINE': config.get('attendancedatabase', 'ENGINE'),
            'NAME': config.get('attendancedatabase', 'NAME'),
            'USER': config.get('attendancedatabase', 'USER'),
            'PASSWORD': config.get('attendancedatabase', 'PASSWORD'),
            'HOST': config.get('attendancedatabase', 'HOST'),
            'PORT': config.get('attendancedatabase', 'PORT'),
            
        }
    }

# Password validation
# https://docs.djangoproject.com/en/3.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
# https://docs.djangoproject.com/en/3.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

# TIME_ZONE = 'UTC'
TIME_ZONE =  'Asia/Kolkata'

USE_I18N = True

USE_L10N = True

USE_TZ = False

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.0/howto/static-files/

STATIC_URL = '/static/'

STATIC_ROOT = os.path.join(BASE_DIR, 'static')

TOKEN_TYPE = config.get('security', 'TOKEN_TYPE')  # Moulali This is temp purpose. To handle own authentication.

CORS_ORIGIN_ALLOW_ALL = bool(config.get('general', 'CORS_ORIGIN_ALLOW_ALL'))

ENCRYPT_KEY = config.get('security', 'ENCRYPT_KEY')

VALID_ERROR_MESSAGES = {

    'invalidlogins':'invalidlogins',
    'access_token':'access_token',
    'something_went_wrong': 'something_went_wrong',
    'In_Active_Employee': 'In_Active_Employee',
    'invalid_inputs': 'invalid_inputs',
    'forgot_password_email_sent' :'Forgot password email sent',
    'forgot_password_email_not_sent' :'Fail to send forgot password email',
    'token_expired':'token_expired',
    'invalid_email':'invalid_email',
    'valid_token':'valid_token',
    'password_rest_success':'password_rest_success',
    'project_exitst':'project is already exist'

   
    # 'username': 'invalid_username',
    # 'password': 'invalid_password',
    # 'emailexists': 'email_already_exists',
    # 'registration_conf' : 'registration_conf',
    # 'invalid_token': 'invalid_token',
    # 'registration_thanks' :'registration_thanks',
    # 'passwords_not_matching' :'passwords_not_matching',
    # 'emailsent':'registarion_email_sent',
    # 'password_reset_success':'password_reset_success',
    # 'success' : 'Success',
    # 'failed' : 'Failed',
    # 'company_email_required':'company_email_required',
    # 'competitors_registration_response':'competitors_registration_response',
    # 'reg_conf_subject':'Registration confirmation',
    # 'forgot_password_subject':'Reset password',
    # 'forgot_password_email_sent':'forgot_password_email_sent',
    # 'project_created':'project_created',
    # 'project_exist':'project_exist',
    # 'invalid_user_id': 'invalid_user_id',
    # 'project_exist':'project_exist'
}

JWT_TOKEN_EXP = int(config.get('security', 'JWT_TOKEN_EXP')) # in hours
FORGOT_PASSWORD_EXP_TIME = int(config.get('security', 'FORGOT_PASSWORD_EXP_TIME')) # in hours

EMAIL_FROM  =  config.get('mail', 'EMAIL_FROM')
EMAIL_HOST = config.get('mail', 'EMAIL_HOST')
EMAIL_PORT = config.get('mail', 'EMAIL_PORT')
EMAIL_HOST_USER = config.get('mail', 'EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = config.get('mail', 'EMAIL_HOST_PASSWORD')
EMAIL_USE_TLS = bool(config.get('mail', 'EMAIL_USE_TLS'))


REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'rest_framework.schemas.coreapi.AutoSchema',
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend']
}

LOGGING = {
    'version': 1,
    'disable_existing_loggers': True,
    'formatters': {
        'standard': {
            'format' : "[%(asctime)s] %(levelname)s [%(name)s:%(lineno)s] %(message)s",
            'datefmt' : "%d/%b/%Y %H:%M:%S"
        },
    },
    'handlers': {
        'null': {
            'level':'DEBUG',
            'class':'logging.NullHandler',
        },
        'logfile': {
            'level':'DEBUG',
            'class':'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(logFolder,"logfile.log"),
            'maxBytes': 1024 * 512, #currently 0.5 MB  #1024 * 1024 * 10,  # 10 MB
            'backupCount': 10,
            'formatter': 'standard',
        },
        'console':{
            'level':'INFO',
            'class':'logging.StreamHandler',
            'formatter': 'standard'
        },
    },
    'loggers': {
        'django': {
            'handlers':['console'],
            'propagate': True,
            'level':'WARN',
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'vedikaweb': {
            'handlers': ['console', 'logfile'],
            'level': 'DEBUG',
        }
    }
}
ENABLE_SUPPORT_EMAIL = False
SUPPORT_EMAIL = 'atwork@atai.ai'

IGNORE_ADMIN_EMAILS=[]
SENDEMAILTOALL=False
CUSTOM_EMAILS = ['suman@atai.ai','dipak@atai.ai']


MONTH_CYCLE_START_DATE = 26
TODAY_AS_HISTORY = True

ADMINS_TO_ACCESS_REPORTS = ['1suman@atai.ai','1prerana@atai.ai']
SUB_ADMINS_TO_ACCESS_REPORTS = ['1dipak@atai.ai','1suman@atai.ai']
STAGED_EMPLOYEE_INFO_EMAILS=['suman@atai.ai','dipak@atai.ai']
MIS_REPORT_RECEIVER_EMAILS =['suman@atai.ai','dipak@atai.ai']
CLB_REPORT_RECEIVER_EMAILS =['suman@atai.ai','dipak@atai.ai']
IGNOROR_PUNCH_DEVICES = ['AIOR181160597', 'AIOR181160618']