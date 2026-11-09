export type Result<T, E> = 
  | { success: true; data: T } 
  | { success: false; error: E };

export interface RequestContext {
  tenantId: string;
  branchId: string;
  userId: string;
  permissions: string[];
}
