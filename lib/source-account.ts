// lib/source-account.ts — 信息来源账号自动管理
import { queryOne, execute, query } from './db';

export interface SourceAccount {
  id: number;
  name: string;
  province: string | null;
  city: string | null;
  district: string | null;
  user_id: number | null;
  auto_approve: number;
  enabled: number;
}

/**
 * 根据地址信息查找或自动创建来源账号
 * 优先级：district 精确匹配 > city 匹配 > province 匹配 > 默认账号
 */
export async function findOrCreateSourceAccount(params: {
  province?: string;
  city?: string;
  district?: string;
  address?: string; // 完整地址，用于自动推断
}): Promise<SourceAccount | null> {
  const { province, city, district } = params;

  // 1. 精确匹配：省+市+区
  if (province && city && district) {
    const exact = await queryOne<SourceAccount>(
      'SELECT * FROM source_accounts WHERE province = ? AND city = ? AND district = ? AND enabled = 1',
      province, city, district
    );
    if (exact) return exact;
  }

  // 2. 省+市匹配
  if (province && city) {
    const cityMatch = await queryOne<SourceAccount>(
      'SELECT * FROM source_accounts WHERE province = ? AND city = ? AND district IS NULL AND enabled = 1',
      province, city
    );
    if (cityMatch) return cityMatch;
  }

  // 3. 省匹配（兜底）
  if (province) {
    const provMatch = await queryOne<SourceAccount>(
      'SELECT * FROM source_accounts WHERE province = ? AND city IS NULL AND enabled = 1',
      province
    );
    if (provMatch) return provMatch;
  }

  // 4. 无匹配 → 自动创建
  if (province && city) {
    const newName = generateSourceName(province, city, district);
    return await autoCreateSourceAccount(newName, province, city, district);
  }

  // 5. 最终兜底：返回默认账号
  return await queryOne<SourceAccount>(
    "SELECT * FROM source_accounts WHERE city IS NULL AND province IS NOT NULL AND enabled = 1 LIMIT 1"
  );
}

/**
 * 生成来源名称
 * 规则：
 * - 成都市 → 成都农交所
 * - 德阳市 → 成都农交所德阳子公司（德阳是成都农交所的分所）
 * - 绵阳市 → 绵阳市农村产权交易所
 * - 其他 → {城市}农交所
 */
function generateSourceName(province: string, city: string, district?: string | null): string {
  // 去掉"市"、"州"等后缀
  const cityShort = city.replace(/[市州地区]$/, '');

  // 特殊映射：德阳、眉山、资阳 等归成都农交所
  const chengduBranches = ['德阳', '眉山', '资阳', '雅安', '遂宁'];
  if (chengduBranches.some(b => cityShort.includes(b))) {
    return `成都农交所${cityShort}子公司`;
  }

  // 成都市本身
  if (cityShort === '成都') {
    return '成都农交所';
  }

  // 其他城市
  return `${cityShort}市农村产权交易中心`;
}

/**
 * 自动创建来源账号
 */
async function autoCreateSourceAccount(
  name: string, province: string, city: string, district?: string | null
): Promise<SourceAccount> {
  // 检查是否已存在同名用户
  let user = await queryOne<{ id: number }>(
    'SELECT id FROM users WHERE nickname = ? AND role = ?', name, 'project_publisher'
  );

  if (!user) {
    // 创建新用户账号
    const result = await execute(
      `INSERT INTO users (nickname, role, status, daily_quota, created_at, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
      name, 'project_publisher', 'active', 50
    );
    user = { id: result.meta?.last_row_id || 0 };
  }

  // 创建映射记录
  await execute(
    `INSERT INTO source_accounts (name, province, city, district, user_id, auto_approve)
     VALUES (?, ?, ?, ?, ?, 1)`,
    name, province, city || null, district || null, user.id
  );

  return {
    id: 0, name, province, city, district: district || null,
    user_id: user.id, auto_approve: 1, enabled: 1,
  };
}

/**
 * 获取所有来源账号（管理用）
 */
export async function getAllSourceAccounts(): Promise<SourceAccount[]> {
  return query<SourceAccount>(
    `SELECT sa.*, u.nickname as user_nickname, u.status as user_status
     FROM source_accounts sa
     LEFT JOIN users u ON sa.user_id = u.id
     ORDER BY sa.province, sa.city, sa.district`
  );
}
