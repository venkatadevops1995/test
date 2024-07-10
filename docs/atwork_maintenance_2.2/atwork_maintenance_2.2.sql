
CREATE TABLE `role` (
`role_id` int(11) NOT NULL AUTO_INCREMENT,
`role_name` varchar(45) NOT NULL,
`created` datetime NOT NULL,
`updated` datetime NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0 - Inactive, 1 - Active',
PRIMARY KEY (`role_id`),
KEY `key_role_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `role` (`role_id`, `role_name`, `created`, `updated`, `status`) VALUES (1, 'L0', '2020-04-25 18:39:18', '2020-04-25 18:39:18', '1');
INSERT INTO `role` (`role_id`, `role_name`, `created`, `updated`, `status`) VALUES ('2', 'L1', '2020-04-25 18:39:18', '2020-04-25 18:39:18', '1');
INSERT INTO `role` (`role_id`, `role_name`, `created`, `updated`, `status`) VALUES ('3', 'L2', '2020-04-25 18:39:18', '2020-04-25 18:39:18', '1');
INSERT INTO `role` (`role_id`, `role_name`, `created`, `updated`, `status`) VALUES ('4', 'L3', '2020-04-25 18:39:18', '2020-04-25 18:39:18', '1');


CREATE TABLE `employee` (
`emp_id` int(11) NOT NULL AUTO_INCREMENT,
`email` varchar(100) NOT NULL,
`password` varchar(255) NOT NULL,
`emp_name` varchar(100) NOT NULL,
`company` varchar(100) NOT NULL,
`staff_no` varchar(45) NOT NULL,
`created` datetime NOT NULL,
`updated` datetime NOT NULL,
`role_id` int(11) NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Inactive, 1-Active',
PRIMARY KEY (`emp_id`),
UNIQUE KEY `email_unique` (`email`),
KEY `fk_employee_1_idx` (`role_id`),
CONSTRAINT `fk_employee_1` FOREIGN KEY (`role_id`) REFERENCES `role` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `project` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`name` varchar(255) NOT NULL,
`code` varchar(255) NOT NULL,
`created` datetime NOT NULL,
`updated` datetime NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Inactive, 1-Active',
PRIMARY KEY (`id`),
KEY `key_project_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `employee_project` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`project_id` int(11) NOT NULL,
`emp_id` int(11) NOT NULL,
`priority` int(3) NOT NULL DEFAULT 0,
`created` datetime NOT NULL,
`updated` datetime NOT NULL,
`status` tinyint(1) NOT NULL,
PRIMARY KEY (`id`),
KEY `key_employee_project_status` (`status`),
KEY `fk_emp_id_123_employee_emp_id` (`emp_id`),
KEY `fk_project_id_123_project_project_id` (`project_id`),
CONSTRAINT `fk_emp_id_123_employee_emp_id` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`),
CONSTRAINT `fk_project_id_123_project_project_id` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `employee_project_time_tracker` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`employee_project_id` int(11) NOT NULL,
`work_minutes` int(5) NOT NULL DEFAULT 0,
`work_date` date NOT NULL,
`work_week` int(3) NOT NULL,
`created` datetime NOT NULL,
`updated` datetime NOT NULL,
`status` tinyint(1) NOT NULL COMMENT '0-Pending, 1-Approved, 2-Rejected',
PRIMARY KEY (`id`),
KEY `key_employee_project_track_status` (`status`),
KEY `key_employee_project_track_work_minutes` (`work_minutes`),
KEY `key_employee_project_track_work_date` (`work_date`),
KEY `key_employee_project_track_work_work_week` (`work_week`),
KEY `fk_employee_project_id_123_employee_project_id` (`employee_project_id`),
CONSTRAINT `fk_employee_project_id_123_employee_project_id` FOREIGN KEY (`employee_project_id`) REFERENCES `employee_project` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `employee_weekly_status_tracker` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`employee_project_id` int(11) NOT NULL,
`work_report` text,
`wsr_date` date NOT NULL,
`wsr_week` int(3) NOT NULL,
`created` datetime NOT NULL,
`updated` datetime NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0 - Inactive, 1 - Active',
PRIMARY KEY (`id`),
KEY `key_e_weely_report_status` (`status`),
KEY `key_e_weely_report_wsr_date` (`wsr_date`),
KEY `key_e_weely_report_wsr_week` (`wsr_week`),
KEY `fk_employee_wsr_123_employee_project_id` (`employee_project_id`),
CONSTRAINT `fk_employee_wsr_123_employee_project_id` FOREIGN KEY (`employee_project_id`) REFERENCES `employee_project` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `employee_hierarchy` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`emp_id` int(11) NOT NULL COMMENT 'employee Id',
`manager_id` int(11) NOT NULL COMMENT 'Employees Manager Id',
`priority` tinyint(2) NOT NULL COMMENT "1-Reporting Manager, 2-Managers Manager, 3-Functional Owner",
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Inactive, 1-Active',
PRIMARY KEY (`id`),
KEY `fk_employee_hierarchy_emp_id` (`emp_id`),
KEY `fk_employee_hierarchy_manager_id` (`manager_id`),
CONSTRAINT `fk_employee_hierarchy_emp_id` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`),
CONSTRAINT `fk_employee_hierarchy_manager_id` FOREIGN KEY (`manager_id`) REFERENCES `employee` (`emp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

alter table employee add column added_by varchar(10) not null default 'mis' after role_id;



CREATE TABLE `employee_work_approve_status` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`emp_id` int(11) NOT NULL ,
`work_week` int(11) NOT NULL ,
`comments` varchar(255) default NULL,
`created` datetime NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '0' COMMENT '0-Pending, 1-Approved, 2-Rejected',
PRIMARY KEY (`id`),
KEY `key_ewas_status` (`status`),
KEY `fk_ewas_emp_id` (`emp_id`),
CONSTRAINT `fk_ewas_emp_id` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `employee_admin` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`emp_id` int(11) NOT NULL ,
`status` tinyint(2) NOT NULL DEFAULT '0' COMMENT '0-In Active, 1-Active',
PRIMARY KEY (`id`),
KEY `key_employee_admin_status` (`status`),
KEY `fk_employee_admin_emp_id` (`emp_id`),
CONSTRAINT `fk_employee_admin_emp_id` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `allowed_domains` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`domain_name` int(11) NOT NULL ,
`status` tinyint(2) NOT NULL DEFAULT '0' COMMENT '0-In Active, 1-Active',
PRIMARY KEY (`id`),
KEY `key_allowed_domains_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `mis_info` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`mis_filename` varchar(255) NOT NULL,
`info` text,
`created` datetime NOT NULL,
`updated` datetime NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '0' COMMENT '0-failure, 1-success',
PRIMARY KEY (`id`),
KEY `key_mis_info_status` (`status`),
KEY `key_mis_info_created` (`created`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `employee_entry_comp_status` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`emp_id` int(11) NOT NULL ,
`work_week` int(11) NOT NULL ,
`cnt` int(5) NOT NULL DEFAULT '1',
`created` datetime NOT NULL,
`updated` datetime NOT NULL,
PRIMARY KEY (`id`),
KEY `fk_eecs_emp_id` (`emp_id`),
CONSTRAINT `fk_eecs_emp_id` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `employee_approval_comp_status` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`emp_id` int(11) NOT NULL ,
`work_week` int(11) NOT NULL ,
`cnt` int(5) NOT NULL DEFAULT '0',
`created` datetime NOT NULL,
`updated` datetime NOT NULL,
PRIMARY KEY (`id`),
KEY `fk_eacs_emp_id` (`emp_id`),
CONSTRAINT `fk_eacs_emp_id` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `manager_work_history` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`emp_id` int(11) NOT NULL,
`work_week` int(11) NOT NULL,
`total_work_minutes` int(11) NOT NULL DEFAULT '0',
`entry_comp_cnt` int(10) NOT NULL DEFAULT '0',
`approval_comp_cnt` int(10) NOT NULL DEFAULT '0',
`emp_cnt` int(10) NOT NULL DEFAULT '0',
`emp_list` MEDIUMTEXT,
`entry_comp_list` text,
`approval_comp_list` text,
`created` datetime NOT NULL,
`updated` datetime NOT NULL,
PRIMARY KEY (`id`),
KEY `key_mwh_work_week` (`work_week`),
KEY `key_mwh_created` (`created`),
KEY `fk_mwh_emp_id` (`emp_id`),
CONSTRAINT `fk_mwh_emp_id` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `company_work_history` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`company` varchar(100) NOT NULL,
`work_week` int(11) NOT NULL,
`total_work_minutes` int(11) NOT NULL DEFAULT '0',
`entry_comp_cnt` int(10) NOT NULL DEFAULT '0',
`approval_comp_cnt` int(10) NOT NULL DEFAULT '0',
`emp_cnt` int(10) NOT NULL DEFAULT '0',
`emp_list` MEDIUMTEXT,
`entry_comp_list` MEDIUMTEXT,
`approval_comp_list` MEDIUMTEXT,
`created` datetime NOT NULL,
`updated` datetime NOT NULL,
PRIMARY KEY (`id`),
KEY `key_cwh_company` (`company`),
KEY `key_cwh_work_week` (`work_week`),
KEY `key_cwh_created` (`created`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- Added in version 2
-- Important  pls check table before you do
alter table employee_project add column total_work_minutes int(11) NOT NULL DEFAULT '0' after priority;

alter table mis_info change info info text;
alter table employee_weekly_status_tracker change work_report work_report text;
alter table employee_admin add column priority int(2) NOT NULL DEFAULT '2' after emp_id;
ALTER TABLE employee_project_time_tracker MODIFY COLUMN id BIGINT unsigned  AUTO_INCREMENT;

-- Added in Branch atwork_prod_1.2  --- atwork DB
CREATE TABLE `attendance_access_group` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`emp_id` int(11) NOT NULL,
`created` datetime NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Inactive, 1-Active',
PRIMARY KEY (`id`),
KEY `fk_aag_status` (`status`),
UNIQUE KEY `fk_aag_emp_id` (`emp_id`),
CONSTRAINT `fk_aag_emp_id` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `email_access_group` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`emp_id` int(11) NOT NULL,
`created` datetime NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Inactive, 1-Active',
PRIMARY KEY (`id`),
KEY `fk_eag_status` (`status`),
UNIQUE KEY `fk_eag_emp_id` (`emp_id`),
CONSTRAINT `fk_eag_emp_id` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `global_access_flag` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`access_type` varchar(50) NOT NULL,
`created` datetime NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Inactive, 1-Active',
PRIMARY KEY (`id`),
KEY `fk_gag_status` (`status`),
UNIQUE KEY `access_type_unique` (`access_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

insert into global_access_flag values (null,'EMAIL', now(),0);
insert into global_access_flag values (null,'ATTENDANCE', now(),0);


CREATE TABLE `welcome_email_notification` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`emp_id` int(11) NOT NULL,
`created` datetime NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Pending, 1-Email sent',
PRIMARY KEY (`id`),
KEY `fk_wen_status` (`status`),
UNIQUE KEY `fk_wen_emp_id` (`emp_id`),
CONSTRAINT `fk_wen_emp_id` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `rejected_timesheet_email_notification` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`emp_id` int(11) NOT NULL,
`work_week` int(11) NOT NULL,
`work_year` int(4) NOT NULL,
`created` datetime NOT NULL,
`updated` datetime NOT NULL,
`comments` varchar(255) default NULL,
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Pending, 1-Email sent',
PRIMARY KEY (`id`),
KEY `fk_tsren_status` (`status`),
KEY `fk_tsren_emp_id` (`emp_id`),
CONSTRAINT `fk_tsren_emp_id` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- For Space App Security
CREATE TABLE `service_account` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`api_user` varchar(255) NOT NULL,
`password` varchar(255) NOT NULL,
`created` datetime NOT NULL,
`updated` datetime NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-InActive, 1-Active',
PRIMARY KEY (`id`),
KEY `fk_service_account_status` (`status`),
UNIQUE KEY `fk_service_account_api_user` (`api_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

insert into service_account values (null, "spaceapp", md5("Welcome@123"),now(),now(),1);
insert into service_account values (null, "mis_apikey", md5("123456789"),now(),now(),1);

-- Added in Branch atwork_prod_1.2 --- attendance DB
CREATE TABLE `EmployeeMaster` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `EmpId` varchar(50) COLLATE utf8mb4_de_pb_0900_ai_ci NOT NULL,
  `DeviceId` int NOT NULL DEFAULT '0',
  `AmdId` decimal(18,0) NOT NULL DEFAULT '0.0',
  `AmdStatus` tinyint NOT NULL DEFAULT '0',
  `HIDDeviceId` decimal(18,0) NOT NULL DEFAULT '0',
  `CardNumber` varchar(50) COLLATE utf8mb4_de_pb_0900_ai_ci DEFAULT NULL,
  `EmpName` varchar(50) COLLATE utf8mb4_de_pb_0900_ai_ci DEFAULT NULL,
  `ManagerName` varchar(50) COLLATE utf8mb4_de_pb_0900_ai_ci DEFAULT NULL,
  `Location` varchar(50) COLLATE utf8mb4_de_pb_0900_ai_ci DEFAULT NULL,
  `DOJ` datetime DEFAULT NULL,
  `PreviousExp` double NOT NULL DEFAULT '0',
  `EmploymentType` varchar(50) COLLATE utf8mb4_de_pb_0900_ai_ci DEFAULT NULL,
  `EmploymentStatus` varchar(15) COLLATE utf8mb4_de_pb_0900_ai_ci DEFAULT NULL,
  `Email` varchar(75) COLLATE utf8mb4_de_pb_0900_ai_ci DEFAULT NULL,
  `StatusChangedOn` datetime DEFAULT NULL,
  `IsManager` tinyint DEFAULT '0',
  `IsUnknown` tinyint DEFAULT '0',
  `CompanyId` int DEFAULT NULL,
  `LocationId` int DEFAULT NULL,
  `DOR` datetime DEFAULT NULL,
  `DesignationId` int DEFAULT NULL,
  `ManagerId` varchar(50) COLLATE utf8mb4_de_pb_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_de_pb_0900_ai_ci;

CREATE TABLE `punch_logs` (
  `TransID` bigint NOT NULL AUTO_INCREMENT,
  `DeviceID` int DEFAULT NULL,
  `LogDate` datetime NOT NULL,
  `Direction` varchar(50) DEFAULT NULL,
  `SerialNo` varchar(50) DEFAULT NULL,
  `Hrview_TransID` bigint DEFAULT NULL,
  `Source` varchar(50) DEFAULT (_utf8mb3'BIOMETRIC'),
  PRIMARY KEY (`TransID`,`LogDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `device_sync_lookup` (
  `device_ip` varchar(50) NOT NULL,
  `device_last_trans_id` bigint(11) UNSIGNED DEFAULT NULL,
  `last_record_time` varchar(50) DEFAULT NULL,
  `download_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `device_first_emp_id` int(11) UNSIGNED DEFAULT NULL,
  `device_first_record_time` varchar(50) DEFAULT NULL,
  `serial_no` varchar(50) DEFAULT NULL,
  `device_name` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;




-- Added in Atwork 1.3 for Add user a and add projects----


CREATE TABLE `stage_employee_project` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`project_id` int(11) NOT NULL DEFAULT 0,
`emp_id` int(11) NOT NULL,
`priority` int(3) NOT NULL DEFAULT 0,
`created` datetime NOT NULL,
`updated` datetime NOT NULL,
`status` tinyint(1) NOT NULL default '1' comment '0-already action taken, 1-need to take action',
PRIMARY KEY (`id`),
KEY `key_stage_employee_project_status` (`status`),
KEY `fk_emp_id_1234_employee_emp_id` (`emp_id`),
CONSTRAINT `fk_emp_id_1234_employee_emp_id` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


--- This is not required
-- CREATE TABLE `stage_employee_hierarchy` (
-- `id` int(11) NOT NULL AUTO_INCREMENT,
-- `emp_id` int(11) NOT NULL COMMENT 'employee Id',
-- `manager_id` int(11) NOT NULL COMMENT 'Employees Manager Id',
-- `priority` tinyint(2) NOT NULL COMMENT "1-Reporting Manager, 2-Managers Manager, 3-Functional Owner",
-- `status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Inactive, 1-Active',
-- PRIMARY KEY (`id`),
-- KEY `fk_stage_employee_hierarchy_emp_id` (`emp_id`),
-- KEY `fk_stage_employee_hierarchy_manager_id` (`manager_id`),
-- CONSTRAINT `fk_stage_employee_hierarchy_emp_id` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`),
-- CONSTRAINT `fk_stage_employee_hierarchy_manager_id` FOREIGN KEY (`manager_id`) REFERENCES `employee` (`emp_id`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- leave management --

CREATE TABLE `company` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`name` varchar(50) NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Inactive, 1-Active',
PRIMARY KEY (`id`),
KEY `fk_company_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

insert into company values ( 1, 'SoCtronics', 1);
insert into company values ( 2, 'INVECAS', 1);
insert into company values ( 3, 'atai', 1);

insert into company values ( 4, 'Makuta', 1);


-- CREATE TABLE `designation` (
-- `id` int(11) NOT NULL AUTO_INCREMENT,
-- `name` varchar(50) NOT NULL,
-- `status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Inactive, 1-Active',
-- PRIMARY KEY (`id`),
-- KEY `fk_designation_status` (`status`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8;



-- Assume only two category --> trainee and others
-- OR We can add all categories like -> Permanent, Trainee, Intern, Trainee 2, Consultant, Contractor, Others

CREATE TABLE `category` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`name` varchar(50) NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Inactive, 1-Active',
PRIMARY KEY (`id`),
KEY `fk_designation_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

insert into category values ( 1, 'Permanent', 1);
insert into category values ( 2, 'Trainee', 1);
insert into category values ( 3, 'Intern', 1);
insert into category values ( 4, 'Trainee 2', 1);
insert into category values ( 5, 'Consultant', 1);
insert into category values ( 6, 'Contractor', 1);

-- leave type is dependent on designation? and company/group?
-- config table 
-- `max_leaves` float(5,2) default 0.0 COMMENT  'Might be this is very for each designation',
-- `designation_id` int(11) NOT NULL,
-- leave types --> Paid, Unpaid, Marriage, Paternal, Maternal



-- Can we make it as employee profile  
-- add DOJ, Gender, Marital status at the time of joining and update marital status, if getting married after joining the company.

-- add descriotn column here..
CREATE TABLE `leave_type` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`name` varchar(50) NOT NULL COMMENT 'Paid, Unpaid, Marriage, Paternal, Maternal, COFF, WFH, AUTO',
`priority` tinyint(2) NOT NULL DEFAULT '0' COMMENT '0-Employee Only visible, 1-addition for HR',
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Inactive, 1-Active',
PRIMARY KEY (`id`),
KEY `fk_l_t_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

insert into leave_type values(1, 'Paid', 0, 1);
insert into leave_type values(2, 'Unpaid', 0, 1);
insert into leave_type values(3, 'Marriage', 0, 1);
insert into leave_type values(4, 'Paternity', 0, 1);
insert into leave_type values(5, 'Maternity', 0, 1);
-- insert into leave_type values(null, 'COFF', 1, 1);
-- insert into leave_type values(null, 'WFH', 1, 1);
-- insert into leave_type values(null, 'AUTO', 1, 1);
-- here AUTO means based on Punch

-- change the name of the table
-- execute this url to get Data in this table :  {{host}}leave/config/fill-leave-config/

CREATE TABLE `leave_config` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`category_id` int(11) NOT NULL,
`leave_type_id` int(11) NOT NULL,
`max_leaves` float(5,2) default 0.0 COMMENT  'Might be this is very for each category',
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Inactive, 1-Active',
PRIMARY KEY (`id`),
KEY `fk_l_t_status` (`status`),
KEY `fk_l_t_category_id_1234_category_id` (`category_id`),
CONSTRAINT `fk_l_t_category_id_1234_category_id` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`),

KEY `fk_l_t_leave_type_id_1234_leave_type_id` (`leave_type_id`),
CONSTRAINT `fk_l_t_leave_type_id_1234_leave_type_id` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_type` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `leave_request` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`emp_id` int(11) NOT NULL,
`startdate` datetime NOT NULL,
`enddate` datetime NOT NULL,
`requested_by` varchar(10) DEFAULT 'emp' COMMENT 'options - emp, hr' ,
`leave_type_id` int(11) not NULL,
`created` datetime NOT NULL,
`updated` datetime NOT NULL,
`leave_reason` varchar(40) NOT NULL,
`emp_comments` text,
`manager_comments` text,
`uploads_invitation` text,
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Pending, 1-Approved, 2-Rejected, 3-Employee Cancelled, 4-AutoApprovedEmp, 5-AutoApprovedMgr', 
PRIMARY KEY (`id`),
KEY `fk_l_r_status` (`status`),
KEY `fk_l_r_emp_id_1234_employee_emp_id` (`emp_id`),
CONSTRAINT `fk_l_r_emp_id_1234_employee_emp_id` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`),
KEY `fk_l_r_leave_type_id_1234_leave_type_id` (`leave_type_id`),
CONSTRAINT `fk_l_r_leave_type_id_1234_leave_type_id` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_type` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `leave` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`leave_request_id` int(11) NOT NULL,
`leave_on` datetime NOT NULL,
`day_leave_type` ENUM ('FULL', 'FIRST_HALF', 'SECOND_HALF') DEFAULT 'FULL' ,
`created` datetime NOT NULL,
`updated` datetime NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Pending, 1-Consumed, 2-Rejected, 3-Cancelled',
PRIMARY KEY (`id`),
KEY `fk_leave_status` (`status`),
KEY `fk_leave_leave_request_id_1234_leave_request_id` (`leave_request_id`),
CONSTRAINT `fk_leave_leave_request_id_1234_leave_request_id` FOREIGN KEY (`leave_request_id`) REFERENCES `leave_request` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `leave_balance` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`emp_id` int(11) NOT NULL,
`year` int(4) NOT NULL,
`month` int(2) NOT NULL,
`leave_credits` float(5,2) NOT NULL DEFAULT 0.0,
`acted_by` ENUM('cron','hr'),
`hr_emp_id` int(11) NOT NULL default 0,
`created` datetime NOT NULL,
`comments` varchar(255) DEFAULT NULL COMMENT 'hr added / removed leaves, cron added leave, leaves carry forwarded from last year.',
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-InActive, 1-Active',

PRIMARY KEY (`id`),
KEY `fk_leave_balance_status` (`status`),
KEY `fk_leave_balance_year` (`year`),
KEY `fk_leave_balance_month` (`month`),
KEY `fk_leave_balance_acted_by` (`acted_by`),

KEY `fk_leave_balanc_emp_id_1234_employee_emp_id` (`emp_id`),
CONSTRAINT `fk_leave_balanc_emp_id_1234_employee_emp_id` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- alter table `leave` add column `updated` datetime NOT NULL after created;
-- alter table `leave_request` add column `updated` datetime NOT NULL after created;
-- alter table `leave_request` add column `uploads_invitation` text after manager_comments;



-- drop table holidays;

CREATE TABLE `holiday` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`holiday_name` varchar(255) NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Inactive, 1-Active',
PRIMARY KEY (`id`),
KEY `key_holiday_status` (`status`),
UNIQUE KEY `unique_holiday_name` (`holiday_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- Store holidays name to show in the drop donw list
CREATE TABLE `holiday_permanent` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`name` varchar(255) NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Inactive, 1-Active',
PRIMARY KEY (`id`),
KEY `key_holiday_permanent_status` (`status`),
UNIQUE KEY `unique_holiday_permanent_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- `year` int(4) NOT NULL,
-- remove year
insert into `holiday_permanent` values (1, "Makara Sankranti",  1);
insert into `holiday_permanent` values (2, "Republic Day",  1);
insert into `holiday_permanent` values (3, "Holi",  1);
insert into `holiday_permanent` values (4, "Ugadi",  1);
insert into `holiday_permanent` values (5, "Ramzan",  1);
insert into `holiday_permanent` values (6, "Krishnastami",  1);
insert into `holiday_permanent` values (7, "Ganesh Chaturthi",  1);
insert into `holiday_permanent` values (8, "Dusshera",  1);
insert into `holiday_permanent` values (9, "Diwali",  1);


-- To store the HR confirmation, to enable for Employee.
CREATE TABLE `holiday_view_confirmation` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`year` int(4) NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Inactive, 1-Active',
PRIMARY KEY (`id`),
KEY `holiday_view_confirmation` (`status`),
UNIQUE KEY `unique_holiday_view_confirmation_year` (`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `holiday_calendar` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`holiday_id` int(11) NOT NULL,
`holiday_year` int(4) NOT NULL,
`holiday_date` date NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Inactive, 1-Active',
PRIMARY KEY (`id`),
KEY `key_holidays_status` (`status`),
KEY `fk_holiday_id_1234_holiday_id` (`holiday_id`),
CONSTRAINT `fk_holiday_id_1234_holiday_id` FOREIGN KEY (`holiday_id`) REFERENCES `holiday` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- UNIQUE KEY `unique_holiday_id` (`holiday_id`, `holiday_year`, `holiday_date`),
-- alter table `holiday_calendar` DROP KEY CONSTRAINT `unique_holiday_id`;


CREATE TABLE `location` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`name` varchar(255) NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Inactive, 1-Active',
PRIMARY KEY (`id`),
KEY `key_location_status` (`status`),
UNIQUE KEY `unique_location_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

insert into location values (1, 'Hyderabad',1);
insert into location values (2, 'Guntur',1);
insert into location values (3, 'Noida',1);
insert into location values (4, 'Benguluru',1);

CREATE TABLE `location_holiday_calendar` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`location_id` int(11) NOT NULL,
`holiday_calendar_id` int(11) NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Inactive, 1-Active',
PRIMARY KEY (`id`),
KEY `location_holiday_calendar_status` (`status`),

KEY `fk_lhc_location_id_1234_location_id` (`location_id`),
CONSTRAINT `fk_lhc_location_id_1234_location_id` FOREIGN KEY (`location_id`) REFERENCES `location` (`id`),
KEY `fk_lhc_hc_id_1234_holiday_calendar_id` (`holiday_calendar_id`),
CONSTRAINT `fk_lhc_hc_id_1234_holiday_calendar_id` FOREIGN KEY (`holiday_calendar_id`) REFERENCES `holiday_calendar` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- `discrepancy_on` datetime NOT NULL,
-- `day_leave_type` ENUM ('FULL', 'FIRST_HALF', 'SECOND_HALF') DEFAULT 'FULL' ,

CREATE TABLE `leave_discrepancy` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`leave_request_id` int(11) NOT NULL,
`emp_comments` text,
`manager_comments` text,
`created` datetime NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Pending, 1-Manager approved, 2-Manager Rejected',
PRIMARY KEY (`id`),
KEY `fk_leave_discrepancy_status` (`status`),
KEY `fk_leave_discrepancy_leave_request_id_1234_leave_request_id` (`leave_request_id`),
CONSTRAINT `fk_leave_discrepancy_leave_request_id_1234_leave_request_id` FOREIGN KEY (`leave_request_id`) REFERENCES `leave_request` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- alter table `leave_discrepancy` add column `emp_comments` text after leave_request_id;
-- alter table `leave_discrepancy` add column `manager_comments` text after emp_comments;


CREATE TABLE `employee_profile` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`emp_id` int(11) NOT NULL,
`category_id` int(11) NOT NULL,
`gender_id` int(2) NOT NULL default 0 COMMENT  '0-none, 1-Male, 2-Female',
`is_married` boolean NOT NULL default false,
`patentry_maternity_cnt` int(11) NOT NULL default 0,
`date_of_join` date NULL ,
`location_id` int(11) NOT NULL,
`picture` varchar(255) default NULL,
PRIMARY KEY (`id`),
KEY `fk_e_d_emp_id_1234_emp_emp_id` (`emp_id`),
CONSTRAINT `fk_e_d_emp_id_1234_emp_emp_id` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`),
KEY `fk_e_d_category_id_1234_category_id` (`category_id`),
CONSTRAINT `fk_e_d_category_id_1234_category_id` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`),

KEY `fk_e_d_location_id_1234_location_id` (`location_id`),
CONSTRAINT `fk_e_d_location_id_1234_location_id` FOREIGN KEY (`location_id`) REFERENCES `location` (`id`)

) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- alter table `employee_profile` add column `location_id` int(11) NOT NULL after `date_of_join`;  
-- alter table employee_profile  ADD KEY `fk_e_d_location_id_1234_location_id` (`location_id`);
-- alter table employee_profile ADD CONSTRAINT `fk_e_d_location_id_1234_location_id` FOREIGN KEY (`location_id`) REFERENCES `location` (`id`);
-- alter table `employee_profile` add column `picture` varchar(255) default NULL after location_id;

-- Dinith's tables-----

CREATE TABLE `leave_policy_month_time_periods` (
  `id` int NOT NULL AUTO_INCREMENT,
  `start_date` int NOT NULL,
  `end_date` int NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_PERIOD` (`start_date`,`end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


insert into leave_policy_month_time_periods values ( 1, 1,10,1);
insert into leave_policy_month_time_periods values ( 2, 11,20,1);
insert into leave_policy_month_time_periods values ( 3, 21,31,1);

-- execute this url to get Data in this table :  {{host}}leave/config/fill-leave-config/
-- To insert data in this table execute this url: {{host}}leave/config/fill-new-hire-leave-config/
CREATE TABLE `leave_credit_roundoff_newhire_timeperiod` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `time_period_id` int NOT NULL,
  `round_off_leave_credit` float(2,1) NOT NULL DEFAULT '0.0',
  `status` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_emp_type_time_period` (`category_id`,`time_period_id`),
  KEY `time_period_id` (`time_period_id`),
  CONSTRAINT `leave_credit_roundoff_newhire_timeperiod_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leave_credit_roundoff_newhire_timeperiod_ibfk_2` FOREIGN KEY (`time_period_id`) REFERENCES `leave_policy_month_time_periods` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `leave_access_group` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`emp_id` int(11) NOT NULL,
`created` datetime NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Inactive, 1-Active',
PRIMARY KEY (`id`),
KEY `fk_lag_status` (`status`),
UNIQUE KEY `fk_lag_unique` (`emp_id`),
CONSTRAINT `fk_lag_status` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `manager_email_opted` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`emp_id` int(11) NOT NULL,
`created` datetime NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Inactive, 1-Active',
PRIMARY KEY (`id`),
KEY `fk_meo_status` (`status`),
UNIQUE KEY `fk_meo_unique` (`emp_id`),
CONSTRAINT `fk_meo_status` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `timesheet_discrepancy` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `leave_request_id` int NOT NULL,
  `employee_project_time_tracker_id` bigint unsigned NOT NULL,
  `work_minutes` int NOT NULL DEFAULT '0',
  `created` datetime NOT NULL,
  `updated` datetime NOT NULL,
  `status` tinyint(1) NOT NULL COMMENT '0-Pending, 1-Approved',
  PRIMARY KEY (`id`),
  KEY `key_ts_discrepancy_status` (`status`),
  KEY `fk_ts_discrepancy_leave_request_id_123_leave_request_id` (`leave_request_id`),
  KEY `fk_ts_discrepancy_emp_proj_tt_id_123_emp_proj_tt_id` (`employee_project_time_tracker_id`),
  CONSTRAINT `fk_ts_discrepancy_emp_proj_tt_id_123_emp_proj_tt_id` FOREIGN KEY (`employee_project_time_tracker_id`) REFERENCES `employee_project_time_tracker` (`id`),
  CONSTRAINT `fk_ts_discrepancy_leave_request_id_123_leave_request_id` FOREIGN KEY (`leave_request_id`) REFERENCES `leave_request` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `email_queue` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`emp_id` int(11) NOT NULL,
`email` varchar(100) NOT NULL,
`email_subject` varchar(255) NOT NULL,
`email_type` varchar(50) NOT NULL,
`required_inputs` text NOT NULL,
`created` datetime NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Pending, 1-Processing, 2-Success, 3-Failed',
PRIMARY KEY (`id`),
KEY `fk_lag_status` (`status`),
KEY `fk_email_queue_emp_id_123_employee_emp_id` (`emp_id`),
CONSTRAINT `fk_email_queue_emp_id_123_employee_emp_id` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


insert into global_access_flag values (null,'LEAVE', now(),0);


CREATE TABLE `leave_balance_uploaded` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`emp_id` int(11) NOT NULL,
`leave_balance_filename` varchar(255) NOT NULL,
`info` text,
`created` datetime NOT NULL,
`updated` datetime NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '0' COMMENT '0-failure, 1-success',
PRIMARY KEY (`id`),
KEY `key_leave_balance_uploaded_status` (`status`),
KEY `fk_leave_balance_emp_id_123_employee_emp_id` (`emp_id`),
CONSTRAINT `fk_leave_balance_emp_id_123_employee_emp_id` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- alter table `leave_discrepancy` add column `emp_comments` text after leave_request_id;

-- alter table `leave_balance` add column `hr_emp_id` int(11) NOT NULL default 0 after acted_by;


CREATE TABLE `employee_timesheet_approved_history` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`emp_id` int(11) NOT NULL COMMENT 'employee Id',
`work_date` date NOT NULL,
`work_minutes` int(10) NOT NULL DEFAULT 0,
`swipe_minutes` int(10) NOT NULL DEFAULT 0,
`rm_comments` text,
`rm_id` int(11) NOT NULL COMMENT 'Reporting Manager Id',
`mm_id` int(11) NOT NULL COMMENT 'Manager Manager Id',
`fo_id` int(11) NOT NULL COMMENT 'Functional Manager Id',
`created` datetime NOT NULL,
`updated` datetime NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Inactive, 1-Active',
PRIMARY KEY (`id`),
KEY `key_employee_timesheet_approved_history_status` (`status`),
KEY `fk_employee_timesheet_approved_history_emp_id` (`emp_id`),
CONSTRAINT `fk_employee_timesheet_approved_history_emp_id` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`),

KEY `fk_employee_timesheet_approved_history_rm_id` (`rm_id`),
CONSTRAINT `fk_employee_timesheet_approved_history_rm_id` FOREIGN KEY (`rm_id`) REFERENCES `employee` (`emp_id`),

KEY `fk_employee_timesheet_approved_history_mm_id` (`mm_id`),
CONSTRAINT `fk_employee_timesheet_approved_history_mm_id` FOREIGN KEY (`mm_id`) REFERENCES `employee` (`emp_id`),

KEY `fk_employee_timesheet_approved_history_fo_id` (`fo_id`),
CONSTRAINT `fk_employee_timesheet_approved_history_fo_id` FOREIGN KEY (`fo_id`) REFERENCES `employee` (`emp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- alter table `employee_approved_history` add column `rm_comments` text  after swipe_minutes;

-- alter table `employee_profile` add column `picture` varchar(255) default NULL after location_id;

-- End--------


URLS TO EXECUTE:
----------------
-- execute this url to get Data in this table :  {{host}}leave/config/fill-leave-config/
-- To insert data in this table execute this url: {{host}}leave/config/fill-new-hire-leave-config/

Permissions:
-------------
insert into leave_access_group values (null, 45, now(),1);
insert into leave_access_group values (null, 47, now(),1);

insert into holiday_view_confirmation values (null, 2021,1);

Add new table for WFH, COFF -- because we need to track the leave details if applicable.( Might be emp can take leaves in WFH Period)

-------------------Documents feature for employees-------------------------
-- is it location based ?
-- is it company based ? -- yes



----------------JAN 2022 release DB changes--------------------------
------------------------ Policy Documents--------------------
CREATE TABLE `policy_type` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`name` varchar(255) NOT NULL,
`created` datetime NOT NULL,
`updated` datetime NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Inactive, 1-Active',
PRIMARY KEY (`id`),
KEY `key_policy_type_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

insert into `policy_type` values (1, "View-Only", now(), now(),1);
insert into `policy_type` values (2, "Digital-Accept", now(), now(),0);
insert into `policy_type` values (3, "Download/Upload", now(), now(),0);

-- `is_viewable` boolean NOT NULL DEFAULT true,
-- `is_acceptable` boolean NOT NULL DEFAULT false,
-- `is_downloadable` boolean NOT NULL DEFAULT false,
-- `is_uploadable` boolean NOT NULL DEFAULT false,

CREATE TABLE `policy_document` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `policy_type_id` int(11) NOT NULL,
  `policy_name` varchar(255) DEFAULT NULL,
  `display_name` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `enable_for` varchar(20) NOT NULL DEFAULT 'ALL' COMMENT 'Options are -  ALL, FEW',
  `enable_on` date NOT NULL,
  `expire_on` date NOT NULL,
  `created` datetime NOT NULL,
  `updated` datetime DEFAULT NULL,
  `status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Inactive, 1-Active',
  PRIMARY KEY (`id`),
  KEY `key_policy_document_status` (`status`),
  KEY `key_policy_document_enable_for` (`enable_for`),
  KEY `key_policy_document_enable_on` (`enable_on`),
  KEY `key_policy_document_expire_on` (`expire_on`),
  KEY `fk_p_d_policy_type_id_1234_policy_type_id` (`policy_type_id`),
  CONSTRAINT `fk_p_d_policy_type_id_1234_policy_type_id` FOREIGN KEY (`policy_type_id`) REFERENCES `policy_type` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `policy_company` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `policy_id` int(11) NOT NULL,
  `status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Inactive, 1-Active',
  PRIMARY KEY (`id`),
  KEY `fk_p_c_company_id_1234_company_id` (`company_id`),
  KEY `fk_p_c_policy_id_1234_policy_id` (`policy_id`),
  CONSTRAINT `fk_p_c_company_id_1234_company_id` FOREIGN KEY (`company_id`) REFERENCES `company` (`id`),
  CONSTRAINT `fk_p_c_policy_id_1234_policy_id` FOREIGN KEY (`policy_id`) REFERENCES `policy_document` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `policy_document_employee_access_permission` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `policy_document_id` int(11) NOT NULL,
  `emp_id` int(11) NOT NULL,
  `created` datetime NOT NULL,
  `updated` datetime NOT NULL,
  `status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Inactive, 1-Active',
  PRIMARY KEY (`id`),
  KEY `fk_pdeap_p_d_id_1234_p_d_policy_document_id` (`policy_document_id`),
  KEY `fk_pdeap_emp_id_1234_emp_emp_id` (`emp_id`),
  CONSTRAINT `fk_pdeap_emp_id_1234_emp_emp_id` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`),
  CONSTRAINT `fk_pdeap_p_d_id_1234_p_d_policy_document_id` FOREIGN KEY (`policy_document_id`) REFERENCES `policy_document` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `policy_document_employee_action` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `policy_document_id` int(11) NOT NULL,
  `emp_id` int(11) NOT NULL,
  `is_policy_accepted` tinyint(1) NOT NULL DEFAULT '0',
  `upload_status` tinyint(1) NOT NULL DEFAULT '0',
  `upload_policy_document` varchar(255) DEFAULT NULL,
  `created` datetime NOT NULL,
  `updated` datetime NOT NULL,
  `status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Inactive, 1-Active',
  PRIMARY KEY (`id`),
  KEY `fk_pdea_policy_document_id_1234_p_d_policy_document_id` (`policy_document_id`),
  KEY `fk_pde_action_emp_id_1234_emp_emp_id` (`emp_id`),
  CONSTRAINT `fk_pde_action_emp_id_1234_emp_emp_id` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`),
  CONSTRAINT `fk_pdea_policy_document_id_1234_p_d_policy_document_id` FOREIGN KEY (`policy_document_id`) REFERENCES `policy_document` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- `view_status` boolean NOT NULL DEFAULT false,
-- `downdload_status` boolean NOT NULL DEFAULT false,


alter table employee add column relieved date DEFAULT NULL after updated;


















