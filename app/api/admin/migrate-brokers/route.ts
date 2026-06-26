export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';

export async function POST() {
  try {
    // 1. Add new columns to brokers table
    const columns = await query<{ name: string }>(
      "PRAGMA table_info(brokers)"
    );
    const colNames = columns.map((c) => c.name);

    if (!colNames.includes('province')) {
      await execute("ALTER TABLE brokers ADD COLUMN province TEXT");
    }
    if (!colNames.includes('city')) {
      await execute("ALTER TABLE brokers ADD COLUMN city TEXT");
    }
    if (!colNames.includes('specialties')) {
      await execute("ALTER TABLE brokers ADD COLUMN specialties TEXT");
    }

    // 2. Create indexes
    await execute("CREATE INDEX IF NOT EXISTS idx_brokers_province ON brokers(province)");
    await execute("CREATE INDEX IF NOT EXISTS idx_brokers_city ON brokers(city)");
    await execute("CREATE INDEX IF NOT EXISTS idx_brokers_rating ON brokers(rating)");

    // 3. Update existing brokers with province/city/specialties
    const brokers = await query<{ id: number; region: string }>(
      "SELECT id, region FROM brokers"
    );

    const regionMap: Record<string, { province: string; city: string; specialties: string }> = {
      '浙江安吉': { province: '浙江省', city: '湖州市', specialties: '["宅基地","茶园","民宿改造"]' },
      '四川都江堰': { province: '四川省', city: '成都市', specialties: '["林地","茶园","康养项目"]' },
      '云南大理': { province: '云南省', city: '大理州', specialties: '["古宅","民宿改造","文旅项目"]' },
      '丽水缙云': { province: '浙江省', city: '丽水市', specialties: '["宅基地","石头房","景区民宿"]' },
      '桂林阳朔': { province: '广西壮族自治区', city: '桂林市', specialties: '["宅基地","院落","法规咨询"]' },
    };

    for (const broker of brokers) {
      const mapping = regionMap[broker.region];
      if (mapping) {
        await execute(
          "UPDATE brokers SET province = ?, city = ?, specialties = ? WHERE id = ? AND (province IS NULL OR province = '')",
          mapping.province, mapping.city, mapping.specialties, broker.id
        );
      }
    }

    // 4. Seed more brokers with province/city data for testing
    const existingCount = await query<{ c: number }>("SELECT COUNT(*) as c FROM brokers");
    if (existingCount[0]?.c < 10) {
      const moreBrokers = [
        { name: '陈小明', region: '浙江莫干山', province: '浙江省', city: '湖州市', bio: '莫干山民宿集群运营专家，精通集体建设用地流转政策', specialties: '["民宿改造","集体建设用地","政策咨询"]', rating: 'gold', show_count: 95, good_rate: 97 },
        { name: '周丽华', region: '浙江千岛湖', province: '浙江省', city: '杭州市', bio: '千岛湖畔文旅项目操盘手，专注湖景资产', specialties: '["湖景资产","文旅项目","宅基地"]', rating: 'silver', show_count: 72, good_rate: 94 },
        { name: '赵国强', region: '四川峨眉山', province: '四川省', city: '乐山市', bio: '峨眉山脚下资深地陪，康养项目选址专家', specialties: '["康养项目","林地","避暑资产"]', rating: 'silver', show_count: 58, good_rate: 93 },
        { name: '孙秀兰', region: '贵州黔东南', province: '贵州省', city: '黔东南州', bio: '苗寨侗寨古村落保护与开发顾问', specialties: '["古村落","民族建筑","文旅项目"]', rating: 'bronze', show_count: 35, good_rate: 96 },
        { name: '钱大海', region: '广西北海', province: '广西壮族自治区', city: '北海市', bio: '北海银滩周边海景资产经纪人', specialties: '["海景资产","避寒地产","宅基地"]', rating: 'bronze', show_count: 42, good_rate: 91 },
        { name: '吴美玲', region: '湖北恩施', province: '湖北省', city: '恩施州', bio: '恩施利川苏马荡避暑地产专家', specialties: '["避暑地产","山居","民宿改造"]', rating: 'silver', show_count: 67, good_rate: 95 },
        { name: '郑伟', region: '云南丽江', province: '云南省', city: '丽江市', bio: '丽江古城纳西族老宅流转顾问', specialties: '["古宅","民宿改造","文旅项目"]', rating: 'gold', show_count: 110, good_rate: 98 },
        { name: '林芳', region: '福建土楼', province: '福建省', city: '龙岩市', bio: '福建土楼周边客家古村落保护开发', specialties: '["古村落","客家建筑","文旅项目"]', rating: 'bronze', show_count: 28, good_rate: 92 },
      ];

      for (const b of moreBrokers) {
        await execute(
          `INSERT OR IGNORE INTO brokers (user_id, name, region, province, city, bio, specialties, rating, show_count, good_rate, status, created_at)
           VALUES (0, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))`,
          b.name, b.region, b.province, b.city, b.bio, b.specialties, b.rating, b.show_count, b.good_rate
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration complete. Found ${brokers.length} existing brokers.`,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
