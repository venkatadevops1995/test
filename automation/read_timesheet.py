import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
#from Utility import Utility
import time
from selenium.webdriver.chrome.options import Options  
from selenium.webdriver.common.keys import Keys
import math
import json
import sys
import datetime

from read_excel import * 
from compare_data import *


RESOLVE_WTS = []

def getData(driver, PROJECTS, TAB):
    emp_data = []
    each_emp_data=[]
    flagVal=0
    index = driver.find_element_by_xpath('/html/body/app-root/div/main/div/app-approve-timesheets/mat-paginator/div/div/div[2]/div').text
    index = math.ceil(int(index.split('of')[-1])/3)

    for i in range(index):
        if i != 0:
            driver.find_element_by_xpath('/html/body/app-root/div/main/div/app-approve-timesheets/mat-paginator/div/div/div[2]/button[2]').click()
            time.sleep(2) 
        for each_project in PROJECTS:
            PROJECT = each_project
            
            #driver.find_element_by_xpath('/html/body/app-root/div/main/div/app-timesheet-view/app-time-sheet/div/div[3]/div/div[1]').text #3 primary 5 vacation
            #/html/body/app-root/div/main/div/app-timesheet-view/app-time-sheet/div/*/div[1]
            pop_up_button = 1

            WEEK = driver.find_element_by_xpath('/html/body/app-root/div/main/div/app-approve-timesheets/div[3]/div[2]/div[1]').text
            print("week no "+WEEK)
            name = driver.find_element_by_xpath('/html/body/app-root/div/main/div/app-approve-timesheets/div[3]/div[3]/div[1]').text

            projs = driver.find_elements_by_xpath('/html/body/app-root/div/main/div/app-approve-timesheets/div[3]/*/*')
            
            data=[]
            # print(projs)
            # print("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
            for each in projs:
                #print(each.text)
                if('\n' in each.text):
                    d = each.text.replace('\n',',')
                    # print(d)
                    # print("=====================================",list(d.split(',')))
                    # # jdata = json.loads('\''+d+'\'')
                    # print(d)
                    data=data+list(d.split(','))
                else:
                    data.append(each.text)
            # print('---------------------------------------------------------------')
            # print(data)
            # print('---------------------------------------------------------------')

            
            for i in range(10,len(data)):
                if 'View WSR' in data[i] or 'Approve' in data[i] or 'Reject' in data[i]:
                    continue

                each_emp_data.append(data[i])

                if data[i] == 'Vacation':
                    flagVal = i + 8
                if i == flagVal:
                    emp_data.append(each_emp_data)
                    each_emp_data=[]
            #print(emp_data)
        # break
    
    employees_data = []

    for emp in emp_data:
        for each in emp:
            if each == '':
                emp.remove(each)
        employees_data.append(emp)
    # print(employees_data)
    for emp in employees_data:
        i=0

        emp_data = []
        emp_data.append(emp[i])
        i = i+1
        times = []
        while(i<len(emp)):
            emp_data.append(emp[i])
            times = []
            i = i+1
            for j in range(0,8):
                times.append(emp[i+j])
            emp_data.append(times)
            i=i+8
        RESOLVE_WTS.append(emp_data)
    


def get_timesheet_data():
    
    TAB_LIST = ["Timesheet", "Rejected Timesheeet","Resolve Timesheets"]
    TAB = TAB_LIST[2]
    # SUBMIT_DATA = False
    SUBMIT_DATA = True
    
    PROJECTS = [
    #  ["ATAI-Sol-CONCOR",[0,0,8,8,0,0,8],"Holiday",[0,0,0,0,8,8,0],"satish","sg@atai.ai"],
    ["ATAI-Sol-CONCOR",[0,0,8,8,0,0,8],"Holiday",[0,0,0,0,8,8,0],"satish","10@gmail.com"]
    ]
    #driver=webdriver.Chrome(executable_path='C:\\Users\\rhita\\bin\\chromedriver.exe')
    driver = webdriver.Chrome(executable_path='/home/rhitam/bin/chromedriver')
    # driver = webdriver.Chrome(executable_path='/home/rakumar/TEST_ATDATA/automation/venv/bin/chromedriver')
    driver.maximize_window()
    #driver.get('https://testplatform.atdata.ai/register')
    driver.get('http://testvedika.atai.ai')

    driver.find_element_by_xpath('//*[@id="mat-input-0"]').send_keys(PROJECTS[0][5])
    driver.find_element_by_xpath('//*[@id="mat-input-1"]').send_keys("Welcome@123")
    #time.sleep(1)
    driver.find_element_by_xpath('/html/body/app-root/div/main/div/app-login/app-pre-sign-in/div/div[3]/div/form/div[2]/app-button[2]/button').click()

    time.sleep(3)
    timesheet = driver.find_elements_by_xpath("/html/body/app-root/div/app-sidebar/ul/*/a")
    for each in timesheet:
        # print("---------------",each.text) 
        if(TAB == each.text):
            each.click()
            print("clicked Timesheet")
            break
    time.sleep(2)
    
    getData(driver, PROJECTS, TAB)
    # print('******************************************************')
    # print(RESOLVE_WTS)
    # driver.find_element_by_xpath('/html/body/app-root/div/main/div/app-approve-timesheets/mat-paginator/div/div/div[2]/button[2]').click()
    # getData(driver, PROJECTS, TAB, emp_data, each_emp_data, flagVal)

    time.sleep(2)


get_timesheet_data()

WTS_DATA = get_wts_data()



# print("-------------------------------------------------------------------------")
# print(RESOLVE_WTS)
# print("-------------------------------------------------------------------------")
# print(WTS_DATA)
# RESOLVE_WTS = [['Ravi Prakash Meda', 'Total', ['00 : 00', '00 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '40 : 00'], 'Project Sub Total', ['00 : 00', '00 : 00', '08 : 00', '08 : 00', '00 : 00', '00 : 00', '08 : 00', '24 : 00'], 'ATAI-Sol-CONCOR [00 : 00]', ['0 : 00', '0 : 00', '8 : 00', '8 : 00', '0 : 00', '0 : 00', '8 : 00', '24 : 00'], 'Miscellaneous', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Holiday', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Vacation', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '8 : 00', '8 : 00', '0 : 00', '16 : 00']], ['Naga Yamini Annam', 'Total', ['00 : 00', '00 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '40 : 00'], 'Project Sub Total', ['00 : 00', '00 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '40 : 00'], 'IMS [00 : 00]', ['0 : 00', '0 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '40 : 00'], 'Miscellaneous', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Holiday', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Vacation', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00']], ['Dinith Reddy Aleti', 'Total', ['00 : 00', '00 : 00', '04 : 00', '05 : 00', '09 : 00', '12 : 00', '07 : 00', '37 : 00'], 'Project Sub Total', ['00 : 00', '00 : 00', '04 : 00', '05 : 00', '09 : 00', '12 : 00', '07 : 00', '37 : 00'], 'VEDA-Portal [00 : 00]', ['0 : 00', '0 : 00', '4 : 00', '5 : 00', '9 : 00', '12 : 00', '7 : 00', '37 : 00'], 'Miscellaneous', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Holiday', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Vacation', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00']], ['Md. Habeeb Ahmed', 'Total', ['00 : 00', '00 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '40 : 00'], 'Project Sub Total', ['00 : 00', '00 : 00', '04 : 00', '04 : 00', '08 : 00', '08 : 00', '00 : 00', '24 : 00'], 'VEDA-Portal [00 : 00]', ['0 : 00', '0 : 00', '4 : 00', '4 : 00', '8 : 00', '8 : 00', '0 : 00', '24 : 00'], 'Miscellaneous', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Holiday', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Vacation', ['0 : 00', '0 : 00', '4 : 00', '4 : 00', '0 : 00', '0 : 00', '8 : 00', '16 : 00']], ['Nagalakshmi Gudala', 'Total', ['00 : 00', '00 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '40 : 00'], 'Project Sub Total', ['00 : 00', '00 : 00', '00 : 00', '00 : 00', '00 : 00', '00 : 00', '00 : 00', '00 : 00'], 'ATAI-Sol-CONCOR [00 : 00]', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Miscellaneous', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Holiday', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Vacation', ['0 : 00', '0 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '40 : 00']], ['Prerana Majumdar', 'Total', ['04 : 00', '04 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '48 : 00'], 'Project Sub Total', ['04 : 00', '04 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '00 : 00', '40 : 00'], 'Operations-BD [00 : 00]', ['4 : 00', '4 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '0 : 00', '40 : 00'], 'Miscellaneous', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Holiday', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Vacation', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '8 : 00', '08 : 00']], ['Vasundara Devi Palatla', 'Total', ['08 : 00', '00 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '48 : 00'], 'Project Sub Total', ['08 : 00', '00 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '48 : 00'], 'ATAI-EASW-Development [00 : 00]', ['8 : 00', '0 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '48 : 00'], 'Miscellaneous', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Holiday', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Vacation', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00']], ['Durga', 'Total', ['00 : 00', '08 : 00', '08 : 00', '04 : 00', '06 : 00', '12 : 00', '08 : 00', '46 : 00'], 'Project Sub Total', ['00 : 00', '08 : 00', '00 : 00', '04 : 00', '06 : 00', '12 : 00', '04 : 00', '34 : 00'], 'ATAI-Sol-CONCOR [00 : 00]', ['0 : 00', '8 : 00', '0 : 00', '4 : 00', '6 : 00', '12 : 00', '4 : 00', '34 : 00'], 'Miscellaneous', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Holiday', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Vacation', ['0 : 00', '0 : 00', '8 : 00', '0 : 00', '0 : 00', '0 : 00', '4 : 00', '12 : 00']], ['Kiran', 'Total', ['04 : 00', '04 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '48 : 00'], 'Project Sub Total', ['04 : 00', '04 : 00', '00 : 00', '00 : 00', '00 : 00', '00 : 00', '00 : 00', '08 : 00'], 'ATAI-EASW-Development [00 : 00]', ['4 : 00', '4 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '08 : 00'], 'Miscellaneous', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Holiday', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Vacation', ['0 : 00', '0 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '40 : 00']], ['DVR', 'Total', ['08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '56 : 00'], 'Project Sub Total', ['08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '56 : 00'], 'IMS [00 : 00]', ['8 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '56 : 00'], 'Miscellaneous', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Holiday', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Vacation', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00']]]
# RESOLVE_WTS = [['Ravi Prakash Meda', 'Total', ['00 : 00', '00 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '40 : 00'], 'Project Sub Total', ['00 : 00', '00 : 00', '08 : 00', '08 : 00', '00 : 00', '00 : 00', '08 : 00', '24 : 00'], 'ATAI-Sol-CONCOR [00 : 00]', ['0 : 00', '0 : 00', '8 : 00', '8 : 00', '0 : 00', '0 : 00', '8 : 00', '24 : 00'], 'Miscellaneous', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Holiday', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Vacation', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '8 : 00', '8 : 00', '0 : 00', '16 : 00']], ['Naga Yamini Annam', 'Total', ['00 : 00', '00 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '40 : 00'], 'Project Sub Total', ['00 : 00', '00 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '40 : 00'], 'IMS [00 : 00]', ['0 : 00', '0 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '40 : 00'], 'Miscellaneous', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Holiday', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Vacation', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00']], ['Dinith Reddy Aleti', 'Total', ['00 : 00', '00 : 00', '04 : 00', '05 : 00', '09 : 00', '12 : 00', '07 : 00', '37 : 00'], 'Project Sub Total', ['00 : 00', '00 : 00', '04 : 00', '05 : 00', '09 : 00', '12 : 00', '07 : 00', '37 : 00'], 'VEDA-Portal [00 : 00]', ['0 : 00', '0 : 00', '4 : 00', '5 : 00', '9 : 00', '12 : 00', '7 : 00', '37 : 00'], 'Miscellaneous', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Holiday', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Vacation', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00']], ['Md. Habeeb Ahmed', 'Total', ['00 : 00', '00 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '40 : 00'], 'Project Sub Total', ['00 : 00', '00 : 00', '04 : 00', '04 : 00', '08 : 00', '08 : 00', '00 : 00', '24 : 00'], 'VEDA-Portal [00 : 00]', ['0 : 00', '0 : 00', '4 : 00', '4 : 00', '8 : 00', '8 : 00', '0 : 00', '24 : 00'], 'Miscellaneous', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Holiday', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Vacation', ['0 : 00', '0 : 00', '4 : 00', '4 : 00', '0 : 00', '0 : 00', '8 : 00', '16 : 00']], ['Nagalakshmi Gudala', 'Total', ['00 : 00', '00 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '40 : 00'], 'Project Sub Total', ['00 : 00', '00 : 00', '00 : 00', '00 : 00', '00 : 00', '00 : 00', '00 : 00', '00 : 00'], 'ATAI-Sol-CONCOR [00 : 00]', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Miscellaneous', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Holiday', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Vacation', ['0 : 00', '0 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '40 : 00']], ['Prerana Majumdar', 'Total', ['04 : 00', '04 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '48 : 00'], 'Project Sub Total', ['04 : 00', '04 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '00 : 00', '40 : 00'], 'Operations-BD [00 : 00]', ['4 : 00', '4 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '0 : 00', '40 : 00'], 'Miscellaneous', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Holiday', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Vacation', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '8 : 00', '08 : 00']], ['Vasundara Devi Palatla', 'Total', ['08 : 00', '00 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '48 : 00'], 'Project Sub Total', ['08 : 00', '00 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '48 : 00'], 'ATAI-EASW-Development [00 : 00]', ['8 : 00', '0 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '48 : 00'], 'Miscellaneous', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Holiday', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Vacation', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00']], ['Durga', 'Total', ['00 : 00', '08 : 00', '08 : 00', '04 : 00', '06 : 00', '12 : 00', '08 : 00', '46 : 00'], 'Project Sub Total', ['00 : 00', '08 : 00', '00 : 00', '04 : 00', '06 : 00', '12 : 00', '04 : 00', '34 : 00'], 'ATAI-Sol-CONCOR [00 : 00]', ['0 : 00', '8 : 00', '0 : 00', '4 : 00', '6 : 00', '12 : 00', '4 : 00', '34 : 00'], 'Miscellaneous', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Holiday', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Vacation', ['0 : 00', '0 : 00', '8 : 00', '0 : 00', '0 : 00', '0 : 00', '4 : 00', '12 : 00']], ['Kiran', 'Total', ['04 : 00', '04 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '48 : 00'], 'Project Sub Total', ['04 : 00', '04 : 00', '00 : 00', '00 : 00', '00 : 00', '00 : 00', '00 : 00', '08 : 00'], 'ATAI-EASW-Development [00 : 00]', ['4 : 00', '4 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '08 : 00'], 'Miscellaneous', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Holiday', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Vacation', ['0 : 00', '0 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '40 : 00']], ['DVR', 'Total', ['08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '56 : 00'], 'Project Sub Total', ['08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '56 : 00'], 'IMS [00 : 00]', ['8 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '56 : 00'], 'Miscellaneous', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Holiday', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Vacation', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00']]]
# WTS_DATA = [['Ravi Prakash Meda', 'ATAI-Sol-CONCOR', [0, 0, 8, 8, None, None, 8], 'Vacation', [None, None, None, None, 8, 8, 0]], ['Naga Yamini Annam', 'IMS', [None, None, 8, 8, 8, 8, 8], 'Vacation', [None, None, None, None, None, None, None]], ['Dinith Reddy Aleti', 'VEDA-Portal', [None, None, 4, 5, 9, 12, 7], 'Vacation', [None, None, None, None, None, None, None]], ['Md. Habeeb Ahmed', 'VEDA-Portal', [None, None, 4, 4, 8, 8, None], 'Vacation', [None, None, 4, 4, None, None, 8]], ['Nagalakshmi Gudala', 'ATAI-Sol-CONCOR', [None, None, None, None, None, None, None], 'Vacation', [None, None, 8, 8, 8, 8, 8]], ['Prerana Majumdar', 'Operations-BD', [4, 4, 8, 8, 8, 8, None], 'Vacation', [None, None, None, None, None, None, 8]], ['Vasundara Devi Palatla ', 'ATAI-EASW-Development', [8, None, 8, 8, 8, 8, 8], 'Vacation', [None, None, None, None, None, None, None]], ['Durga', 'ATAI-Sol-CONCOR', [None, 8, None, 4, 6, 12, 4], 'Vacation', [None, None, 8, None, None, None, 4]], ['Kiran', 'ATAI-EASW-Development', [4, 4, None, None, None, None, None], 'Vacation', [None, None, 8, 8, 8, 8, 8]], ['DVR', 'IMS', [8, 8, 8, 8, 8, 8, 8], 'Vacation', [None, None, None, None, None, None, None]]]


result = compare_wts(RESOLVE_WTS,WTS_DATA)
print(result)


# print("-------------------------------------------------------------------------")
# print(result)