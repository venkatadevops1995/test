Production 1.1 patch release

Release Summary
    1. Employees can submit "Holiday" hours.
    2. Employees can submit WSR multiple times in the week.
    3. Project/Day wise sub total will be displayed.
    4. Login session issues fixed.
         

Release contents

Source code

http://phabricator.soct.com/source/Vedika.git

Branch 

atwork_prod_1.1

This Release covers the following features.

    1. Employee Timesheet - Employees can submit "Holiday" hours.
    2. Employee Timesheet - Project weekly total hours added as "Total".
    3. Employee Timesheet - Employees can submit WSR multiple times in the week. Employee clicks on "Save & Submit" for final submittion.    
    4. Employee entry NC will be marked, if final submission is not done.
    5. Resolve Timesheets - Project/Day wise sub total will be displayed.
    5. Resolve Timesheets (left menu item) - Indication DOT added. It matches with the Resolve Timesheet indicator.
    5. Resolve Timesheets -  Employee "Holiday" hours will be displayed.
    6. Download WTR -  Added "WTR Summary" as new sheet with Project wise work hours.
         

Known Issues

    Weekly Timesheet -> Weekly Status Report (Textarea): If user contineously presses Ctrl+V to paste text message, the "submit" button is not disabled after 5000 characters.
    Summary tab in WTR excel: Follow below steps in Libre Office.
        GOTO: tool->options-> Libreofc calc -> formula -> recalculation on file load 
        SELECT "always recalculate" IN Excel 2007 and newer
    
    
Fixed issues:
    Multiple records inserted in DB for some users( 2 out of 1388). This issue is fixed.
    Excel - work hour sum issues fixed.
    Browser session issues fixed. JWT Toke is valid for 5 hours. If the user is idle for more than 5 hours and On page reload it will redirect to login page.
    
     
         
