# from selenium import webdriver
import time
def login(driver,email,password):
    driver.find_element_by_xpath('//*[@id="mat-input-0"]').send_keys(email)
    driver.find_element_by_xpath('//*[@id="mat-input-1"]').send_keys(password)
    #time.sleep(1)
    driver.find_element_by_xpath('/html/body/app-root/div/main/div/app-login/app-pre-sign-in/div/div[3]/div/form/div[2]/app-button[2]/button').click()
    time.sleep(2)

def logout(driver):
        # time.sleep(5000) #wait before log out
        print("log out")
        driver.find_element_by_xpath('/html/body/app-root/div/app-header/a').click() #logout
        time.sleep(3)

def change_tab(driver,TAB):
    timesheet = driver.find_elements_by_xpath("/html/body/app-root/div/app-sidebar/ul/*")
    for each in timesheet:
        if(TAB == each.text):
            each.click()
            print("clicked "+TAB)
            break
    time.sleep(2)