Atwork product release

Release Summary
    1. Added API Security for missing endpoints
    2. Added Angular AuthGuard for front-end application
    3. MIS and CLB(Current Leave Balance) email notifications
    4. Additional features to disable employee
    5. HR leaves history
    6. Employee self leave
    7. Policy UI changes    
    8. In the Resolve timesheet page added counter
    9. "S.No" column added in Edit employee, Transfer employee and Project change pages (UI) 
    10. On leave balance update system will save current leave balance and modified leave balance in database for reference
    11. Employee search in header issue fixed
    


Release contents

Source code

https://scm.atai.ai/projects/ATWORK

Branch 

atwork_maintenance_2.3 (Assume vedika_1.5.3 release)

This Release covers the following features/changes.

    1. Added API Security for missing endpoints
    2. Added Angular AuthGuard for front-end application
    3. MIS and CLB(Current Leave Balance) email notifications
        a). Pre-defined list of employees will receive separate email notification with MIS and CLB documents as an attachment
    4. Additional features to disable employee
        a) Disabled employee can access atwork until the last working day
        b) Email notifications will be sent to employees if the relieving date is greater than today
        c) Email notifications will be sent to RM, MM, FM and HR
    5. HR leave history
        a) Date restriction remove in date filter
        b) Added "Future Leaves Only" filter
        c) Approved leave "correction" records are not showing
    6. Employee self leave
        a) Apply past leave for last 60 day or upto 1st day of current year(whichever comes first)
        b) apply leave upto the end of current year
        c) Approved leave "correction" records are not showing
    7. Policy UI changes    
    8. In the Resolve timesheet page added counter
    9. "S.No" column added in Edit employee, Transfer employee and Project change pages (UI) 
    10. On leave balance update system will save current leave balance and modified leave balance in database for reference
    
    
    
   
