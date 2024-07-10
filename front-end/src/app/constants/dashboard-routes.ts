import enmRole from 'src/app/enums/role.enum';

export const dashboardRoutes = new Map(
  [
    [enmRole.L0, "emp-l0/dashboard"],
    [enmRole.L1, "emp-l1/dashboard"],
    [enmRole.L2, "emp-l2/dashboard"],
    [enmRole.L3, "emp-l3/dashboard"]
  ]
);

export const rolePrefix = new Map(
  [
    [enmRole.L0, "emp-l0"],
    [enmRole.L1, "emp-l1"],
    [enmRole.L2, "emp-l2"],
    [enmRole.L3, "emp-l3"]
  ]
);


export const MILLISECONDS_DAY = 86400000


export enum LeaveApplcnStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  EmployeeCancelled = 3,
  AutoApprovedEmp = 4,
  AutoApprovedMgr=5,
  DiscrepancyApproved=6,
  DiscrepancyRejected=7,
  TimesheeDiscrepancy = 8
}
export enum LeaveDiscrepancyStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2
}