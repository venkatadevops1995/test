import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
import time
from selenium.webdriver.chrome.options import Options  
from selenium.webdriver.common.keys import Keys
import math
import json
import sys
import datetime
import re
from shell_scripts import *
from read_excel import *
from settings import *
from common import *


def wts_action(driver,empName,ACTION_INFO):
    print("wts action ",empName)
    
    index = driver.find_element_by_xpath('/html/body/app-root/div/main/div/app-approve-timesheets/mat-paginator/div/div/div[2]/div').text
    index = math.ceil(int(index.split('of')[-1])/3)

    for i in range(index):
        if i != 0:
            driver.find_element_by_xpath('/html/body/app-root/div/main/div/app-approve-timesheets/mat-paginator/div/div/div[2]/button[2]').click()
            print("clicked next page")
            time.sleep(3) 
        
        #driver.find_element_by_xpath('/html/body/app-root/div/main/div/app-timesheet-view/app-time-sheet/div/div[3]/div/div[1]').text #3 primary 5 vacation
        #/html/body/app-root/div/main/div/app-timesheet-view/app-time-sheet/div/*/div[1]

        WEEK = driver.find_element_by_xpath('/html/body/app-root/div/main/div/app-approve-timesheets/div[3]/div[2]/div[1]').text
        print("week no "+WEEK)

        #projs = driver.find_elements_by_xpath('/html/body/app-root/div/main/div/app-approve-timesheets/div[3]/*/*')

        names = driver.find_elements_by_xpath('/html/body/app-root/div/main/div/app-approve-timesheets/div[3]/*/div[1]')
        
        wsr_buttons = driver.find_elements_by_xpath('/html/body/app-root/div/main/div/app-approve-timesheets/div[3]/*/div[2]/app-button/button')                        
        approve_buttons = driver.find_elements_by_xpath('/html/body/app-root/div/main/div/app-approve-timesheets/div[3]/*/div[2]/div/div/app-button[1]/button')
        reject_buttons = driver.find_elements_by_xpath('/html/body/app-root/div/main/div/app-approve-timesheets/div[3]/*/div[2]/div/div/app-button[2]/button')

        # empName = [ 'Ravi Prakash Meda','Naga Yamini Annam','Dinith Reddy Aleti', 'Md. Habeeb Ahmed',
        # 'Nagalakshmi Gudala','Prerana Majumdar','Vasundara Devi Palatla', 'Durga', 'Kiran', 'DVR']


        last_count = len(names)
        for i in range(0,last_count):

            # print('------------* '+names[i].text)
            if(names[i].text in empName):

                if(ACTION_INFO[names[i].text.strip()]=="Approve"):
                    # print("--------------------------------------------")
                    # print(len(approve_buttons))
                    approve_buttons[0].click()
                    print('approved for ' +names[i].text)
                    time.sleep(1)
                elif(ACTION_INFO[names[i].text.strip()]=="Reject"):
                    reject_buttons[0].click()
                    time.sleep(1)
                    # textareas = driver.find_elements_by_xpath('//*[contains(@class,"mat-input-element"]')
                    textareas = driver.find_elements_by_class_name("mat-input-element")
                    textareas[len(textareas)-1].send_keys('rejected for '+names[i].text)
                    driver.find_element_by_xpath('/html/body/app-root/div/main/div/app-approve-timesheets/app-modal-popup[1]/div/div/div[2]/div/form/div/app-button').click()
                    print('rejected for ' +names[i].text)
                    time.sleep(2)
                approve_buttons = driver.find_elements_by_xpath('/html/body/app-root/div/main/div/app-approve-timesheets/div[3]/*/div[2]/div/div/app-button[1]/button')
                reject_buttons = driver.find_elements_by_xpath('/html/body/app-root/div/main/div/app-approve-timesheets/div[3]/*/div[2]/div/div/app-button[2]/button')
                names = driver.find_elements_by_xpath('/html/body/app-root/div/main/div/app-approve-timesheets/div[3]/*/div[1]')
                



def action_on_timesheet():
    
    TAB_LIST = ["Timesheet", "Rejected Timesheeet","Resolve Timesheets"]
    TAB = TAB_LIST[2]
    
    #driver=webdriver.Chrome(executable_path='C:\\Users\\rhita\\bin\\chromedriver.exe')
    # driver = webdriver.Chrome(executable_path='/home/rakumar/TEST_ATDATA/automation/venv/bin/chromedriver')
    driver = webdriver.Chrome(executable_path='/home/rhitam/bin/chromedriver')
    driver.maximize_window()
    driver.get('http://testvedika.atai.ai')
    EMP_EMAIL,MANAGER_DATA = get_email_id()
    # print(MANAGER_DATA)
    WTS_DATA,SUBMIT_INFO,ACTION_INFO = get_wts_data()

    for key in MANAGER_DATA.keys():
        login(driver,EMP_EMAIL[key],"Welcome@123")
        change_tab(driver,TAB)
        wts_action(driver,MANAGER_DATA[key],ACTION_INFO)
        logout(driver)

    time.sleep(2)

    

change_time(TIMESHEET_SUBMISSION_DATE)
time.sleep(3)
execute_cron(TIMESHEET_SUBMISSION_CRON_ID)
time.sleep(2)
action_on_timesheet()
