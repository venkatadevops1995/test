import re

def convert_time(data):
    if type(data) == int:
        data = str(data)+ ':00'
        # print(str(data)+ ':00')
    if(data is None):
        return (0,0)
    pattern = r'^(\d+) ?: ?(\d\d)'
    x = re.search(pattern,data)
    h = int(x.group(1))
    m = int(x.group(2))
    return (h,m)


def compare_time(time1,time2):
    # time 1 Resolve data
    for i in range(len(time1)-1):
        # print(time1[i])
        # print(time2[i])
        (h1,m1) = convert_time(time1[i])
        (h2,m2) = convert_time(time2[i])
        if h1 == h2 and m1 == m2:
            # print('time1 matched',h1,m1)
            # print('time2 matched',h2,m2)
            pass
        else:
            # print('time1 not matched',h1,m1)
            # print('time2 not matched',h2,m2)
            return False
    return True


def compare_project(projectlist1,projectlist2):
    compare_status = False
    for i in range(0,len(projectlist1),2):
        # print(projectlist1[i])
        for j in range(0,len(projectlist2),2):
            if(projectlist2[j] in projectlist1[i]):
                # print("matched",projectlist1[i],projectlist2[j])
                # print(projectlist1[i+1])
                # print(projectlist2[j+1])
                compare_status = compare_time(projectlist1[i+1],projectlist2[j+1])
                if compare_status == False:
                    return projectlist2[j]
    return True
                


def get_project(emp_list):
    emp_project_list = []
    for i in range(1,len(emp_list),2):
        emp_project_list.append(emp_list[i])
        emp_project_list.append(emp_list[i+1])
    return emp_project_list
        
def compare_wts(empList1,empList2):
    all_status = []
    for emp1 in empList1:
        print('checking '+emp1[0])
        for emp2 in empList2:
            # print("----"+emp2[0])
            if(emp2[0] in emp1[0]):
                projects1=get_project(emp1)
                projects2=get_project(emp2)
                status = compare_project(projects1,projects2)
                # print("==========================")
                # print('checked-'+emp1[0]+'-'+emp2[0]+'-')
                ## if(status !=  True):
                ## print("==========================")
                ## print(emp1[0],status)
                all_status.append([emp1[0],status])
                break
            # else:
            #     print('not matched-'+emp1[0]+'-'+emp2[0]+'-')
    # print("------------------------------")
    # print(all_status)
    return all_status


# empList1 = [['Nagalakshmi Gudala', 'Total', ['00 : 00', '00 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '40 : 00'], 'Project Sub Total', ['00 : 00', '00 : 00', '00 : 00', '00 : 00', '00 : 00', '00 : 00', '00 : 00', '00 : 00'], 'ATAI-Sol-CONCOR [00 : 00]', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Miscellaneous', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Holiday', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Vacation', ['0 : 00', '0 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '40 : 00']], ['Kiran', 'Total', ['04 : 00', '04 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '48 : 00'], 'Project Sub Total', ['04 : 00', '04 : 00', '00 : 00', '00 : 00', '00 : 00', '00 : 00', '00 : 00', '08 : 00'], 'ATAI-EASW-Development [00 : 00]', ['4 : 00', '4 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '08 : 00'], 'Miscellaneous', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Holiday', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Vacation', ['0 : 00', '0 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '40 : 00']], ['DVR', 'Total', ['08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '56 : 00'], 'Project Sub Total', ['08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '08 : 00', '56 : 00'], 'IMS [00 : 00]', ['8 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '56 : 00'], 'Miscellaneous', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Holiday', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Vacation', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00']]]
# empList2 =  [['Nagalakshmi Gudala', 'ATAI-Sol-CONCOR [00 : 00]', ['0 : 00', '0 : 90', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Miscellaneous', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Holiday', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Vacation', ['0 : 00', '0 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '40 : 00']], ['Kiran', 'ATAI-EASW-Development [00 : 00]', ['4 : 00', '4 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '08 : 00'], 'Miscellaneous', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Holiday', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Vacation', ['0 : 00', '0 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '40 : 00']], ['DVR', 'IMS [00 : 00]', ['8 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '8 : 00', '56 : 00'], 'Miscellaneous', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Holiday', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00'], 'Vacation', ['0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '0 : 00', '00 : 00']]]

# compare_wts(empList1,empList2)


            


