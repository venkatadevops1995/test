import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
import sys
import time
from selenium.webdriver.chrome.options import Options  
from selenium.webdriver.common.keys import Keys
from common import *
from shell_scripts import *
from settings import *
from read_excel import *

def readData(driver,week_no,dashboard_data):
    #read name
    name = driver.find_element_by_xpath('/html/body/app-root/div/app-sidebar/div/div[2]/p').text
    name = name.split(', ')[-1]
    #read week
    weeks = driver.find_elements_by_xpath('/html/body/app-root/div/main/div/app-l2-dashboard/div[2]/div[*]/div[1]/span[1]')
    #read noOfEmp
    noOfEmpoyess = driver.find_elements_by_xpath('/html/body/app-root/div/main/div/app-l2-dashboard/div[2]/div[*]/div[2]/div[2]')
    # read total time
    totalTimes = driver.find_elements_by_xpath('/html/body/app-root/div/main/div/app-l2-dashboard/div[2]/div[*]/div[3]/div[2]')
    # # read Entry NC
    # entryNC = driver.find_elements_by_xpath('/html/body/app-root/div/main/div/app-l2-dashboard/div[2]/div[*]/div[4]/div[1]/circle-progress/svg/text/tspan[1]')
    # # read approval NC
    # approvalNC = driver.find_elements_by_xpath('/html/body/app-root/div/main/div/app-l2-dashboard/div[2]/div[*]/div[4]/div[2]/circle-progress/svg/text/tspan[1]')

    print(name)
    
    weeksList = []
    noOfEmpoyessList = []
    totalTimesList = []
    # entryNCList = []
    # approvalNCList = []

    for each in weeks:
        #print(each)
        weeksList.append(each.text)

    for each in noOfEmpoyess:
        #print(each.text)
        noOfEmpoyessList.append(each.text)

    for each in totalTimes:
        #print(each.text)
        totalTimesList.append(each.text)
    
    # for each in entryNC:
    #     #print(each.text)
    #     entryNCList.append(each.text)

    # for each in approvalNC:
    #     #print(each.text)
    #     approvalNCList.append(each.text)

    # print(weeksList)
    # print(noOfEmpoyessList)
    # print(totalTimesList)
    # print(entryNCList)
    # print(approvalNCList)

    dashboard_vals=[]
    dashboard_vals.append(name)
    for i in range(len(weeksList)):
        dashboard_vals.append(weeksList[i])
        dashboard_vals.append([noOfEmpoyessList[i], totalTimesList[i]])
    # return
    for i in range(1,len(dashboard_vals),2):
        if str(week_no) in dashboard_vals[i]:
            if(dashboard_data[dashboard_vals[0]][0]==int(dashboard_vals[i+1][0])):
                    print(dashboard_vals[0]+" employee count matched")
            if(str(dashboard_data[dashboard_vals[0]][1]) in dashboard_vals[i+1][1]):
                    print(dashboard_vals[0]+" total hours matched")
def setUp():
    TAB_LIST = ["Dashboard", " Resolve Timesheets"," Timesheet"," Rejected Timesheet"]
    TAB = TAB_LIST[0]
    #SUBMIT_DATA = True
    

    driver = webdriver.Chrome(executable_path=DRIVER_EXECUTABLE_PATH)
    driver.maximize_window()
    driver.get('http://testvedika.atai.ai')
    managers = get_all_managers()
    # manager_dashboard_data = get_manager_dashboard_data()
    DASHBOARD_DATA = get_manager_dashboard_data()

    EMP_EMAIL,MANAGER_DATA =get_email_id()
    for manager in managers:
        print(manager)
        login(driver,EMP_EMAIL[manager],"Welcome@123")

        change_tab(driver,TAB)

        readData(driver,WEEK_NO,DASHBOARD_DATA)
        logout(driver)


change_time(REPORT_DATE)
time.sleep(2)
execute_cron(REPORT_CRON_ID)
time.sleep(2)
setUp()