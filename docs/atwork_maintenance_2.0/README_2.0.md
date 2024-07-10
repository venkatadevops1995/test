Production 1.4 release

Release Summary
    1. Leave Management
    2. Add/Update employee projects
    3. Update employee managers
    4. Emails- Timesheet reject notification
    5. Emails templates change
    6. Global Search box in the header to find the employee details.
         

Release contents

Source code

http://phabricator.soct.com/source/Vedika.git

Branch

atwork_maintenance_2.0 (Assueme vedika_1.5 relese)

This Release covers the following features.

	Access Permissions:
		1. Leave, holidays and reports will be accessible only for the function owner's with permissions.

	Timesheet report:
		1. Manager can download employees (direct and indirect reportees) timesheet between date range
		2. Employees can download a timesheet between date range
		3. Highlight the total hours if total hours > 0 and punch hours = 0

	Attendance:
		1. Manager can download employees (direct and indirect reportees) Attendance between date range
		2. Employees can download a timesheet between date range
		3. Attendance report have Timesheet hours and Punched hours

	Leave Management:
		1. Employees can apply for leave, .
		2. Employee can raise discrepancy for the leaves if not used
		3. Managers can take actions on Employee leave requests,    
		4. Manager has to take action before the leave start date, Otherwise it will be auto approved(AutoApprovedMgr)
		5. Managers can take actions on leave discrepancy requests    
		6. HR can config the monthly leave credit based on employee designation(category) using Policy configuration page
		7. HR can modify single employee leave balance from UI
		8. HR can download all employees leave balance as excel.
		9. HR can modify multiple employee leave balance by uploading excel ( UI provided)

	Holidays:
		1. HR can create holiday calendar for the current year and next year,
		2. provision to add/modify/delete holidays, but the holiday date should be more than current date
		3. It is mandatory to notify all the employees about the list of holidays for the first time, next time onwards( on update/add/delete the year holidays) will be visible to employees dynamically.
		4. Employees can view the current and next year holiday list if HR provides access.

	Project Change:
		1. Manager can change team members (direct reportees) active project
		2. If no projects for employees and added new projects it will effect immediately, otherwise the updated projects will be effective on Wednesday onwards.

	Transfer Manager:
		1. Managers can transfer team members(direct and indirect reportees) to other managers.
		2. L1 can transfer reportees to siblings or his/her manager
		3. L2 can transfer reportees to siblings or his/her manager
		4. L3 can transfer reportees to sibling ( other L3)
	   
Known Issues

	Special leave ( Marriage, Paternity and Maternity): if it starts with half day, have issue with end day (half-day)
	Special leave: Employee not able to select the end date if the end date is on next year date (Next year dates disabled)
	Leaves: Employee can apply leaves for the current year only.

   
     
         



