import { db, staffBranchRoles, rolePermissions, branches } from '@qrserveup/db';
import { eq } from 'drizzle-orm';
import type { StaffContext } from './types';

/**
 * يُحسب مرة واحدة عند تسجيل الدخول.
 * يجمع الصلاحيات من كل الأدوار في كل الفروع.
 */
export async function computeStaffContext(tenantId: string, staffId: string): Promise<StaffContext> {
  const roles = await db
    .select({
      roleId: staffBranchRoles.roleId,
      branchId: staffBranchRoles.branchId,
    })
    .from(staffBranchRoles)
    .where(eq(staffBranchRoles.staffId, staffId));

  const roleIds = [...new Set(roles.map((r) => r.roleId))];
  const branchIds = [...new Set(roles.map((r) => r.branchId))];

  let permissions: Set<string> = new Set();
  if (roleIds.length > 0) {
    const perms = await db
      .select({ code: rolePermissions.permissionCode })
      .from(rolePermissions)
      .where(eq(rolePermissions.tenantId, tenantId));
    // فلترة roleIds في الذاكرة (تجنب SQL IN مع مصفوفة متغيرة)
    const roleIdsSet = new Set(roleIds);
    const filtered = await db.select().from(rolePermissions).where(eq(rolePermissions.tenantId, tenantId));
    permissions = new Set(filtered.filter((p) => roleIdsSet.has(p.roleId)).map((p) => p.permissionCode));
  }

  return {
    tenantId,
    staffId,
    branchIds,
    permissions,
  };
}
