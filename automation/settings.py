import datetime



YEAR = 2020
WEEK_NO = 28

TIME_FORMAT = "%Y-%m-%d"
WEEK_DATE = datetime.datetime.strptime(str(YEAR) +"-W"+str(WEEK_NO-1)+"-Saturday","%Y-W%W-%A")

TIMESHEET_FILLING_DATE = datetime.datetime.strftime(WEEK_DATE,TIME_FORMAT)
TIMESHEET_SUBMISSION_DATE = datetime.datetime.strftime(WEEK_DATE+datetime.timedelta(days=1),TIME_FORMAT)
REPORT_DATE = datetime.datetime.strftime(WEEK_DATE+datetime.timedelta(days=4),TIME_FORMAT)

TIMESHEET_SUBMISSION_CRON_ID = "cfa3d0d70900e88ecc429cb23cf190ff"
REPORT_CRON_ID = "63a82f9b11b067a99d6f92c1ede252a6"
DRIVER_EXECUTABLE_PATH='/home/rhitam/bin/chromedriver'


print("TIMESHEET_FILLING_DATE",TIMESHEET_FILLING_DATE)
print("TIMESHEET_SUBMISSION_DATE",TIMESHEET_SUBMISSION_DATE)
print("REPORT_DATE",REPORT_DATE)