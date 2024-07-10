import xlsxwriter
from django.http import HttpResponse

header_format = {'font_size': 10,'bold':True,'font_name':'Arial','align':'center','bg_color':'#4FA67B','border':1}
disable_format = {'font_size': 10,'bold':False,'font_name':'Arial','align':'center','bg_color':'red','border':1,'num_format': 'yyyy-mm-dd'}

cell_format = {'font_size': 10,'font_name':'Arial','align':'center'}
project_cell_format = {'font_size': 10,'font_name':'Arial','align':'center','font_color':'cc5803'}
absent_cell_format = {'font_size': 10,'font_name':'Arial','align':'left','font_color':'red'}
student_holiday_format = {'font_size': 10,'bold':False,'font_name':'Arial','align':'left','bg_color':'red','border':1}
new_format_h1 = {'font_size': 14,'bold':True,'align':'center'}
new_format_h2 = {'font_size': 12,'bold':True,'align':'center'}

merge_format = {
    'bold': 1,
    'border': 1,
    'align': 'center',
    'valign': 'vcenter',
    'fg_color': 'yellow'}
cust_cell_special_format = {'fg_color':'gray','border':1,'text_wrap':True}

# here is one extra column for checking status = 0 or one at last 
class ExcelServices:
    def __init__(self,filename,workSheetName='MainWorksheet',in_memory=False,header_format=header_format,cell_format=cell_format,merge_rane=None
                ,merge_format=merge_format,merge_string='MERGE RANGE',multisheetFlag=False, disable_format=disable_format, project_cell_format = project_cell_format, absent_cell_format=absent_cell_format,student_holiday_format=student_holiday_format,new_format_h1=new_format_h1,new_format_h2=new_format_h2):
        self.filenameWithExt = filename
        self.workSheetName = workSheetName
        if in_memory:
            self.workbook = xlsxwriter.Workbook(self.filenameWithExt, {'in_memory': True})
        else:
            self.filenameWithExt = filename+'.xlsx'
            self.workbook = xlsxwriter.Workbook(self.filenameWithExt)
        
        self.header_format=self.workbook.add_format(header_format)
        self.disable_format=self.workbook.add_format(disable_format)
        self.student_holiday_format=self.workbook.add_format(student_holiday_format)
        self.project_cell_format=self.workbook.add_format(project_cell_format)
        self.absent_cell_format=self.workbook.add_format(absent_cell_format)
        self.cell_format=self.workbook.add_format(cell_format)
        self.cust_cell_special_format=self.workbook.add_format(cust_cell_special_format)
        self.merge_format=self.workbook.add_format(merge_format)
        self.new_format_h1=self.workbook.add_format(new_format_h1)
        self.new_format_h2=self.workbook.add_format(new_format_h2)
        
        if(multisheetFlag):
            self.multiWorksheet=[]
        else:
            self.worksheet = self.workbook.add_worksheet(workSheetName)
            if merge_rane is not None:
                self.worksheet.merge_range(merge_rane,merge_string,self.merge_format)
    
    def defineMultipleWorksheets(self,workSheetNamesList,dataList,reportFlag=False,leaveFlag=False):
        for i,eachworksheet in enumerate(workSheetNamesList):
            self.multiWorksheet.append(self.workbook.add_worksheet(eachworksheet))
            if(i==0):
                if(not reportFlag):
                    if(not leaveFlag):
                        self.writeExcel(dataList[i],worksheet=self.multiWorksheet[i],row_start=0,datetimeColList=[5],customFormat={'num_format':'[HH]:MM'},closeFlag=False)
                    else:
                        self.writeExcel(dataList[i],worksheet=self.multiWorksheet[i],row_start=0,closeFlag=False)
                else:
                    self.writeExcel(dataList[i],worksheet=self.multiWorksheet[i],row_start=0,customFormat={'num_format':'HH:MM'},closeFlag=False)
            elif(i==1):
                if(not reportFlag):
                    self.writeExcel(dataList[i],worksheet=self.multiWorksheet[i],row_start=0,closeFlag=False,formulaColms=[4])
                else:
                    self.writeExcel(dataList[i],worksheet=self.multiWorksheet[i],row_start=0,datetimeColList=[5],customFormat={'num_format':'HH:MM'},closeFlag=False)
            elif(i == 2):
                self.writeExcel(dataList[i],worksheet=self.multiWorksheet[i],row_start=0,closeFlag=False)
            else:
                self.writeExcel(dataList[i],worksheet=self.multiWorksheet[i],row_start=0,datetimeColList=[5,6],customFormat={'num_format':'[HH]:MM'},closeFlag=False)
        self.workbook.close()

    def writeExcel(self,regras,worksheet=None,row_start=0,col_start=0,colListForCellFormat=[],long_column_list=[],datetimeColList=[],customFormat={'align':'left'},closeFlag=True,formulaColms=[],is_inactive_project_exit = {}):
        customFormat=self.workbook.add_format(customFormat)
        if worksheet is None:
            worksheet=self.worksheet
        if(len(long_column_list)>0):
            for col in range(row_start,len(regras[0])):
                worksheet.set_column(col,col,30)
            for col in long_column_list:
                worksheet.set_column(col,col,50)
        else:
            worksheet.set_column(row_start,len(regras[0]),20)
        for row_num, regra in enumerate(regras):
            row_nums=row_num+row_start
            col=col_start
            for each in range(0,len(regra)):
                if(regra[len(regra) - 1] == 0 and regra[each] != "Isdisable" and self.workSheetName == 'MIS'):
                    if (each != len(regra) - 1):
                        worksheet.write(row_nums,col,regra[each],self.disable_format)
                elif(regra[len(regra) - 1] == 'Yes' and regra[each] != "Isdisable"  and self.workSheetName == 'Student Attendance Report'):
                    worksheet.write(row_nums,col,regra[each],self.student_holiday_format)
                elif(row_nums==row_start):
                    if(regra[each] != "Isdisable"):
                        worksheet.write(row_nums,col,regra[each],self.header_format)
                else:
                    if ((each == len(regra) - 1 and self.workSheetName == 'MIS')):
                        continue
                    if(len(colListForCellFormat)>0):
                        if col in colListForCellFormat:

                            worksheet.write(row_nums, col , regra[each],self.cust_cell_special_format)
                        else:
                            worksheet.write(row_nums, col , regra[each],self.cell_format)

                    elif(len(datetimeColList)>0):
                        if col in datetimeColList:
                            customFormat.__dict__['font_size'] = 10
                            worksheet.write_datetime(row_nums, col , regra[each],customFormat)
                        else:
                            if(row_nums != (len(is_inactive_project_exit) -1)):
                                if(each == 11 and is_inactive_project_exit[regra[4]][0] == True):
                                    worksheet.write(row_nums,col,regra[11],self.project_cell_format)

                                elif(each == 13 and is_inactive_project_exit[regra[4]][1] == True):
                                    worksheet.write(row_nums,col,regra[13],self.project_cell_format)

                                elif(each == 15 and is_inactive_project_exit[regra[4]][2] == True):
                                    worksheet.write(row_nums,col,regra[15],self.project_cell_format)
                                else:
                                    worksheet.write(row_nums, col , regra[each],self.cell_format)
                            else:
                                worksheet.write(row_nums, col , regra[each],self.cell_format)

                    elif(len(formulaColms)>0):

                        if col in formulaColms:
                            worksheet.write_formula(row_nums, col , "=SUMIFS('Weekly Timesheet Report'!F:F,'Weekly Timesheet Report'!D:D,\""+regra[2]+"\",'Weekly Timesheet Report'!C:C,\""+regra[1]+"\")",self.workbook.add_format({'num_format':'[HH]:MM'}))
                        else:
                            worksheet.write(row_nums, col , regra[each],self.cell_format)
                    else:
                        if(regra[each]== 'Absent'):
                            worksheet.write(row_nums, col , regra[each],self.absent_cell_format)
                        else:
                            if(self.workSheetName == 'Attendance By Alt.Id Report'):
                                if(regra[each] == 'SOCTRONICS TECHNOLOGIES PVT. LTD.'):
                                    worksheet.merge_range("A3:D3",regra[each],self.new_format_h1)

                                elif(regra[each]  == 'Badge ID' or regra[each]  == 'EmpName' or regra[each]  == 'DateTime' or regra[each]  == 'In/Out' or regra[each]  == 'ReaderName'):
                                    worksheet.write(row_nums, col , regra[each],self.header_format)
                                    
                                elif(str(regra[each]).find('From Date:') !=-1 ):
                                    worksheet.merge_range("A5:D5",regra[each],self.new_format_h2)
                                else:
                                    worksheet.write(row_nums, col , regra[each],self.cell_format)
                            else:
                                worksheet.write(row_nums, col , regra[each],self.cell_format)
                col=col+1
        if(closeFlag):
            self.workbook.close()
        
        
    def terminateExcelService(self):
        self.workbook.close()