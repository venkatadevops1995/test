Production 1.0 release

Release Summary
    1. Dashboard for L2 and L3 Employees.
    2. New Crons for updating the manager work history and cumulative work hours. In previous release cumulative hours calculated on weekly time sheet table.
    3. Priorities  P1 and P2 can be added to employ. Employee with P1 can see all L3 work info and L2(under him) work info.
    4. NC report download feature.
    

Release contents

Source code

http://phabricator.soct.com/source/Vedika.git

Branch 

atwork_prod_1.0

This Release covers the following features.

    1. L2 and L3 Manager will see last 3 week's team work info.
    2. L3 Manager will see all his L2 Managers last 3 week's team work info and L2 Managers will see 
    3. New Crons for updating the manager work history and cumulative work hours. In previous release cumulative hours calculated on weekly time table.
    3. Priorities  P1 and P2 can be added to employ. Employee with P1 can see all L3 work info and L2(under him) work info.
    4. NC report download feature.

Known Issues

    Application/UI Router name should change.
    Resolve Timesheet implemented with dynamic pagination, but static pagination is required. 
    'DOT' should retain after Tuesday.
    UI (logout/dashboard pages) presentation is not smooth as expected.
    Showing P1 projects with Zero time line in Resolve Timesheet page.
    Excel work hours’ sum in WTR is not workig in Libero office.
    
Fixed issues:
    Pagination Reset Issue.
    Dot Color Logic Based on Total Employees Status.
    Inactive project issue after MIS uploaded with new project.
    Showing inactive project in the rejected timesheet. (Only if that project has non-zero work hours for the previous week)
    Excel work hours’ time format in WTR.
    Removed zero work hours from WTR.
    Not saving zero work hour projects. (If the project is not posted earlier in that week with some non-zero values)
    Wednesday cron changes. (If any new employees added in approval cycle, then we are restricting them to get entry compliance on Wednesday)
    Storing employee project cumulative work hours in employee_project table, previously it is getting from employee_project_timetracker table.
    
