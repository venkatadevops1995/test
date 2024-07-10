import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
#from Utility import Utility
import time
from selenium.webdriver.chrome.options import Options  
from selenium.webdriver.common.keys import Keys
from read_excel import *
from shell_scripts import *
from settings import *
from common import *
import threading

FAIL_PROJECTS = []
def fill_timesheet_data(PROJECTS):
    # print("called --------1")
    # time.sleep(3)
    # return
    #self.driver = webdriver.Firefox(executable_path='C:\\Users\\rhita\\webdriver\\gecko\\v0.26.0\\geckodriver-v0.26.0-win64\\geckodriver.exe')
    chrome_options = Options()  
    chrome_options.add_argument("--headless")  

    # PROJECT = ["ATAI-Sol-CONCOR",[0,0,8,8,0,0,8],"Vacation",[0,0,0,0,8,8,0],"ravi","1@gmail.com"]
    # PROJECT = ["IMS",[0,0,8,8,8,8,8],"Vacation",[0,0,0,0,0,0,0],"yamini","2@gmail.com"]
    # PROJECT = ["VEDA-Portal",[0,0,4,5,9,12,7],"Vacation",[0,0,0,0,0,0,0],"dinith","3@gmail.com"]
    # PROJECT = ["VEDA-Portal",[0,0,4,4,8,8,0],"Vacation",[0,0,4,4,0,0,8],"habeeb","4@gmail.com"]
    # PROJECT = ["ATAI-Sol-CONCOR",[0,0,0,0,0,0,0],"Vacation",[0,0,8,8,8,8,8],"laksmi","5@gmail.com"]
    # PROJECT = ["Operations-BD",[4,4,8,8,8,8,0],"Vacation",[0,0,0,0,0,0,8],"prerana","6@gmail.com"]
    # PROJECT = ["ATAI-EASW-Development",[8,0,8,8,8,8,8],"Vacation",[0,0,0,0,0,0,0],"Vasundara","7@gmail.com"]
    # PROJECT = ["ATAI-Sol-CONCOR",[0,8,0,4,6,12,4],"Vacation",[0,0,8,0,0,0,4],"durga","8@gmail.com"]
    # PROJECT = ["ATAI-EASW-Development",[4,4,0,0,0,0,0],"Vacation",[0,0,8,8,8,8,8],"kiran","9@gmail.com"]
    # PROJECT = ["IMS",[8,8,8,8,8,8,8],"Vacation",[0,0,0,0,0,0,0],"dvr","10@gmail.com"]
    
    TAB_LIST = ["Timesheet", "Rejected Timesheeet"]
    TAB = TAB_LIST[0]
    # SUBMIT_DATA = False
    SUBMIT_DATA = True

    # WTS_DATA,SUBMIT_INFO,ACTION_INFO = get_wts_data()
    # EMP_EMAIL,MANAGER_DATA = get_email_id()
    # # print(WTS_DATA)
    # # print(EMP_LIST)
    # PROJECTS = []
    # for each in WTS_DATA:
    #     # print(each[1:])
    #     PROJECTS.append([each[0],EMP_EMAIL[each[0]]]+each[1:])

    # print(PROJECTS)
    # sys.exit()
    # PROJECTS = [
    # ["ATAI-Sol-CONCOR",[0,0,8,8,0,0,8],"Holiday",[0,0,0,0,8,8,0],"ravi","1@gmail.com"],
    # ["IMS",[0,0,8,8,8,8,8],"Holiday",[0,0,0,0,0,0,0],"yamini","2@gmail.com"],
    # ["VEDA-Portal",[0,0,4,5,9,12,7],"Holiday",[0,0,0,0,0,0,0],"dinith","3@gmail.com"],
    # ["VEDA-Portal",[0,0,4,4,8,8,0],"Holiday",[0,0,4,4,0,0,8],"habeeb","4@gmail.com"],
    # ["ATAI-Sol-CONCOR",[0,0,0,0,0,0,0],"Vacation",[0,0,8,8,8,8,8],"laksmi","5@gmail.com"],
    # ["Operations-BD",[4,4,8,8,8,8,0],"Vacation",[0,0,0,0,0,0,8],"prerana","6@gmail.com"],
    # ["ATAI-EASW-Development",[8,0,8,8,8,8,8],"Vacation",[0,0,0,0,0,0,0],"Vasundara","7@gmail.com"],
    # ["ATAI-Sol-CONCOR",[0,8,0,4,6,12,4],"Holiday",[0,0,8,0,0,0,4],"durga","8@gmail.com"],
    # ["ATAI-EASW-Development",[4,4,0,0,0,0,0],"Holiday",[0,0,8,8,8,8,8],"kiran","9@gmail.com"],
    # ["IMS",[8,8,8,8,8,8,8],"Holiday",[0,0,0,0,0,0,0],"dvr","10@gmail.com"],

    # ["ATAI-Sol-CONCOR",[0,0,8,8,0,0,8],"Vacation",[0,0,0,0,8,8,0],"ravi","1@gmail.com"],
    # ["IMS",[0,0,8,8,8,8,8],"Vacation",[0,0,0,0,0,0,0],"yamini","2@gmail.com"],
    # ["VEDA-Portal",[0,0,4,5,9,12,7],"Vacation",[0,0,0,0,0,0,0],"dinith","3@gmail.com"],
    # ["VEDA-Portal",[0,0,4,4,8,8,0],"Vacation",[0,0,4,4,0,0,8],"habeeb","4@gmail.com"],
    # ["ATAI-Sol-CONCOR",[0,0,0,0,0,0,0],"Vacation",[0,0,8,8,8,8,8],"laksmi","5@gmail.com"],
    # ["Operations-BD",[4,4,8,8,8,8,0],"Vacation",[0,0,0,0,0,0,8],"prerana","6@gmail.com"],
    # ["ATAI-EASW-Development",[8,0,8,8,8,8,8],"Vacation",[0,0,0,0,0,0,0],"Vasundara","7@gmail.com"],
    # ["ATAI-Sol-CONCOR",[0,8,0,4,6,12,4],"Vacation",[0,0,8,0,0,0,4],"durga","8@gmail.com"],
    # ["ATAI-EASW-Development",[4,4,0,0,0,0,0],"Vacation",[0,0,8,8,8,8,8],"kiran","9@gmail.com"],
    # ["IMS",[8,8,8,8,8,8,8],"Vacation",[0,0,0,0,0,0,0],"dvr","10@gmail.com"],

    # ["ATAI-Sol-CONCOR",[0,0,7,7,0,0,7],"Vacation",[0,0,0,0,7,7,0],"ravi1","101@gmail.com"],
    # ["IMS",[0,0,9,9,9,9,9],"Vacation",[0,0,0,0,0,0,0],"yamini1","102@gmail.com"],
    # ["VEDA-Portal",[0,0,6,5,9,12,7],"Vacation",[0,0,0,0,0,0,0],"dinith1","103@gmail.com"],
    # ["VEDA-Portal",[0,0,14,4,8,8,0],"Vacation",[0,0,4,4,0,0,8],"habeeb1","104@gmail.com"],
    # ["ATAI-Sol-CONCOR",[0,0,0,0,0,0,0],"Vacation",[0,0,8,8,8,8,8],"laksmi1","105@gmail.com"],
    # ["Operations-BD",[6,6,8,8,8,8,0],"Vacation",[0,0,0,0,0,0,8],"prerana1","106@gmail.com"],
    # ["ATAI-EASW-Development",[8,4,8,8,8,8,8],"Vacation",[0,0,0,0,0,0,0],"Vasundara1","107@gmail.com"],
    # ["ATAI-Sol-CONCOR",[0,4,0,8,6,12,4],"Vacation",[0,0,8,0,0,0,4],"durga1","108@gmail.com"],
    # ["ATAI-EASW-Development",[4,4,0,0,0,0,0],"Vacation",[0,0,8,8,8,8,8],"kiran1","109@gmail.com"],
    # ["IMS",[18,3,3,8,8,8,8],"Vacation",[0,0,0,0,0,0,0],"dvr1","110@gmail.com"],

    # ["ATAI-Sol-CONCOR",[0,0,6,6,0,0,6],"Vacation",[0,0,0,0,8,8,0],"ravi2","201@gmail.com"],
    # ["IMS",[0,0,6,6,8,8,8],"Vacation",[0,0,0,0,0,0,0],"yamini2","202@gmail.com"],
    # ["VEDA-Portal",[0,0,4,5,9,12,7],"Vacation",[0,0,0,0,0,0,0],"dinith2","203@gmail.com"],
    # ["VEDA-Portal",[0,0,4,4,8,8,0],"Vacation",[0,0,4,4,0,0,8],"habeeb2","204@gmail.com"],
    # ["ATAI-Sol-CONCOR",[0,0,0,0,0,0,0],"Vacation",[0,0,8,8,8,8,8],"laksmi2","205@gmail.com"],
    # ["Operations-BD",[6,6,10,10,10,10,2],"Vacation",[0,0,0,0,0,0,8],"prerana2","206@gmail.com"],
    # ["ATAI-EASW-Development",[8,0,8,8,8,8,8],"Vacation",[0,0,0,0,0,0,0],"Vasundara2","207@gmail.com"],
    # ["ATAI-Sol-CONCOR",[0,8,0,4,6,12,4],"Vacation",[0,0,8,0,0,0,4],"durga2","208@gmail.com"],
    # ["ATAI-EASW-Development",[4,4,0,0,0,0,0],"Vacation",[0,0,8,8,8,8,8],"kiran2","209@gmail.com"],
    # ["IMS",[6,6,6,6,6,6,6],"Vacation",[0,0,0,0,0,0,0],"dvr2","210@gmail.com"]

    # ]
    #PROJECT = [ "VEDA-Portal", [0,0,8,8,0,0,8],"Vacation",[0,0,0,0,3,2,1]]
    #driver=webdriver.Chrome(executable_path='C:\\Users\\rhita\\bin\\chromedriver.exe')
    driver = webdriver.Chrome(executable_path=DRIVER_EXECUTABLE_PATH,chrome_options=chrome_options)
    driver.maximize_window()
    driver.get('http://testvedika.atai.ai') 

    for each_project in PROJECTS:
        PROJECT = each_project
        # print(PROJECT)
        print("filling for ---"+PROJECT[1])
        try:
            login(driver,PROJECT[1],"Welcome@123")
            
            change_tab(driver,TAB)

            WEEK = driver.find_element_by_xpath('/html/body/app-root/div/main/div/app-timesheet-view/app-time-sheet/div/div[2]/div[1]').text
            print("week no "+WEEK)
            
            projects=driver.find_elements_by_xpath('/html/body/app-root/div/main/div/app-timesheet-view/app-time-sheet/div/*/div[1]')
            pop_up_button = 1
            for k in range(2,len(PROJECT),2):
                i=1
                for pro in projects:
                    if(PROJECT[k] in pro.text):
                        # print(pro.text)
                        # print("i=",i)
                        if('Vacation' in pro.text or 'Miscellaneous' in pro.text or 'Holiday' in pro.text):
                            timeboxes = driver.find_elements_by_xpath('/html/body/app-root/div/main/div/app-timesheet-view/app-time-sheet/div/div['+str(i)+']/*/app-time-field/input')
                        else:
                            timeboxes = driver.find_elements_by_xpath('/html/body/app-root/div/main/div/app-timesheet-view/app-time-sheet/div/div['+str(i)+']/div/*/app-time-field/input')
                        # print(timeboxes)                    
                        j=0
                        for eachtime in PROJECT[k+1]:
                            # print("j=",j)
                            # if(eachtime != 0):
                            if(eachtime != None and eachtime != 0):
                                timeboxes[j].clear()
                                timeboxes[j].send_keys(eachtime)
                                if(not ('Vacation' in pro.text or 'Miscellaneous' in pro.text or 'Holiday' in pro.text)):
                                    pop_up_button = 0
                            j=j+1
                    i=i+1 # /html/body/app-root/div/main/div/app-timesheet-view/app-time-sheet/div/div[5]/div[2]/app-time-field/input

            driver.find_element_by_xpath('/html/body/app-root/div/main/div/app-timesheet-view/div[2]/div[1]/div/textarea').send_keys(PROJECT[0]+" "+WEEK)
            time.sleep(1)
            driver.find_element_by_xpath('/html/body/app-root/div/main/div/app-timesheet-view/div[2]/div[5]/app-button[1]/button').click() #save
            time.sleep(2)
            pop_up = driver.find_elements_by_xpath('/html/body/app-root/div/main/div/app-timesheet-view/app-modal-popup[2]/div/div/div[2]/div/div/div/app-button[2]/button') 
            #     #print(len(pop_up))
            if(pop_up_button == 1):
                pop_up[0].click()
            if(SUBMIT_DATA):
                driver.find_element_by_xpath('/html/body/app-root/div/main/div/app-timesheet-view/div[2]/div[5]/app-button[2]/button').click() #submit
                time.sleep(2)

                # time.sleep(2)
                # driver.find_element_by_xpath('/html/body/app-root/div/main/div/app-timesheet-view/div[2]/app-button[2]/button').click() #save and submit
                # time.sleep(2)
                # pop_up = driver.find_elements_by_xpath('/html/body/app-root/div/main/div/app-timesheet-view/app-modal-popup[2]/div/div/div[2]/div/div/div/app-button[2]/button')


                driver.find_element_by_xpath('/html/body/app-root/div/main/div/app-timesheet-view/app-modal-popup[3]/div/div/div[2]/div/div/div/app-button[2]/button').click()
            time.sleep(2)
            print("done for ---"+PROJECT[1])
            logout(driver)
        except:
            FAIL_PROJECTS.append(PROJECT)
            print("failed for ---"+PROJECT[1])
            driver = webdriver.Chrome(executable_path='/home/rhitam/bin/chromedriver',chrome_options=chrome_options)
            driver.maximize_window()
            driver.get('http://testvedika.atai.ai') 
            time.sleep(3)
        



def call_with_thread():
    
    WTS_DATA,SUBMIT_INFO,ACTION_INFO = get_wts_data()
    EMP_EMAIL,MANAGER_DATA = get_email_id()
    # print(WTS_DATA)
    # print(EMP_LIST)
    ALL_PROJECTS = []
    PROJECTS = []
    item = 25
    for i in range(0,len(WTS_DATA)):
        # print(each[1:])
        if( i != 0 and i % item == 0):
            ALL_PROJECTS.append(PROJECTS)
            PROJECTS = []
            PROJECTS.append([WTS_DATA[i][0],EMP_EMAIL[WTS_DATA[i][0]]]+WTS_DATA[i][1:])
        else:
            PROJECTS.append([WTS_DATA[i][0],EMP_EMAIL[WTS_DATA[i][0]]]+WTS_DATA[i][1:])
            if(i == len(WTS_DATA)-1):
                ALL_PROJECTS.append(PROJECTS)
    all_threads = []
    for each_pr in ALL_PROJECTS:
        # print("----------------------------------------------")
        # print(each_pr)
        this_thread = threading.Thread(target=fill_timesheet_data,args=(each_pr,))
        all_threads.append(this_thread)
        this_thread.start()
    for each in all_threads:
        each.join()
    print("=========================================")
    print(FAIL_PROJECTS)
    print("retrying.........")
    fill_timesheet_data(FAIL_PROJECTS)

# fill_timesheet_data()
change_time(TIMESHEET_FILLING_DATE)
time.sleep(2)
call_with_thread()
