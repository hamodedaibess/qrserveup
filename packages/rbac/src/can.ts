import type { StaffContext, PermissionCode } from './types';

/**
 * فحص صلاحية في الذاكرة — O(1).
 * لا يلمس DB. الصلاحيات تُحسب مرة واحدة عند الدخول وتُوضع في ctx.
 */
export function can(ctx: StaffContext, permission: PermissionCode): boolean {
  return ctx.permissions.has(permission);
}

export function canAny(ctx: StaffContext, permissions: PermissionCode[]): boolean {
  return permissions.some((p) => ctx.permissions.has(p));
}

export function canAll(ctx: StaffContext, permissions: PermissionCode[]): boolean {
  return permissions.every((p) => ctx.permissions.has(p));
}

export function canInBranch(ctx: StaffContext, branchId: string): boolean {
  return ctx.branchIds.includes(branchId);
}
