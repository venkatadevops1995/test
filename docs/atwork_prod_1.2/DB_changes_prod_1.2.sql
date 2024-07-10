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


CREATE TABLE `holidays` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`holiday_name` varchar(255) NOT NULL,
`holiday_date` date NOT NULL,
`status` tinyint(2) NOT NULL DEFAULT '1' COMMENT '0-Inactive, 1-Active',
PRIMARY KEY (`id`),
KEY `key_holidays_status` (`status`)
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


-- Below changes need in production.
--Priority task


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

insert into global_access_flag values (null,'EMAIL', now(),0)
insert into global_access_flag values (null,'ATTENDANCE', now(),0)


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








