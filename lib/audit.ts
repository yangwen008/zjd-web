// lib/audit.ts — 审计日志工具库
import { execute } from './db';

export interface AuditLogParams {
  userId: number;
  userRole: string;
  action: string;
  module: string;
  level?: 'info' | 'warn' | 'error';
  targetType?: string;
  targetId?: number;
  detail?: string;
  beforeData?: unknown;
  afterData?: unknown;
  request?: Request;
}

export async function writeAuditLog(params: AuditLogParams): Promise<void> {
  const {
    userId, userRole, action, module, level = 'info',
    targetType, targetId, detail,
    beforeData, afterData, request,
  } = params;

  const ip = request?.headers.get('cf-connecting-ip') ||
             request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
  const ua = request?.headers.get('user-agent') || '';

  try {
    await execute(
      `INSERT INTO admin_audit_logs
       (admin_id, action, target_type, target_id, detail, user_role, module, level, before_data, after_data, ip_address, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      userId, action, targetType || null, targetId || null,
      detail || null, userRole, module, level,
      beforeData ? JSON.stringify(beforeData) : null,
      afterData ? JSON.stringify(afterData) : null,
      ip, ua
    );
  } catch (err) {
    // 审计日志写入不应阻塞主业务
    console.error('Audit log write failed:', err);
  }
}

// 快捷方法
export async function auditAsset(params: {
  userId: number; userRole: string; action: string;
  assetId: number; detail?: string; beforeData?: unknown; afterData?: unknown; request?: Request;
}) {
  await writeAuditLog({
    userId: params.userId, userRole: params.userRole,
    action: `asset.${params.action}`, module: 'asset',
    level: params.action === 'delete' ? 'warn' : 'info',
    targetType: 'asset', targetId: params.assetId,
    detail: params.detail, beforeData: params.beforeData, afterData: params.afterData,
    request: params.request,
  });
}

export async function auditBulk(params: {
  userId: number; userRole: string; action: string;
  bulkId: number; detail?: string; request?: Request;
}) {
  await writeAuditLog({
    userId: params.userId, userRole: params.userRole,
    action: `bulk.${params.action}`, module: 'bulk',
    level: params.action === 'delete' ? 'warn' : 'info',
    targetType: 'bulk_project', targetId: params.bulkId,
    detail: params.detail, request: params.request,
  });
}

export async function auditUser(params: {
  userId: number; userRole: string; action: string;
  targetUserId: number; detail?: string; beforeData?: unknown; afterData?: unknown; request?: Request;
}) {
  await writeAuditLog({
    userId: params.userId, userRole: params.userRole,
    action: `user.${params.action}`, module: 'user',
    level: 'warn',
    targetType: 'user', targetId: params.targetUserId,
    detail: params.detail, beforeData: params.beforeData, afterData: params.afterData,
    request: params.request,
  });
}

export async function auditAuth(params: {
  userId?: number; userRole?: string; action: string;
  phone: string; detail?: string; request?: Request;
}) {
  await writeAuditLog({
    userId: params.userId || 0, userRole: params.userRole || 'anonymous',
    action: `auth.${params.action}`, module: 'auth',
    level: params.action === 'login_failed' ? 'warn' : 'info',
    detail: `${params.phone}: ${params.detail || ''}`, request: params.request,
  });
}

export async function auditConfig(params: {
  userId: number; userRole: string; action: string;
  detail?: string; beforeData?: unknown; afterData?: unknown; request?: Request;
}) {
  await writeAuditLog({
    userId: params.userId, userRole: params.userRole,
    action: `config.${params.action}`, module: 'config', level: 'warn',
    detail: params.detail, beforeData: params.beforeData, afterData: params.afterData,
    request: params.request,
  });
}
