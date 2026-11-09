export interface StaffContext {
  tenantId: string;
  staffId: string;
  branchIds: string[];
  permissions: Set<string>;
}

export type PermissionCode =
  | 'orders.view'
  | 'orders.confirm'
  | 'orders.cancel'
  | 'orders.edit'
  | 'finance.view'
  | 'finance.refund'
  | 'staff.manage'
  | 'settings.manage'
  | 'discounts.apply'
  | 'discounts.approve';
