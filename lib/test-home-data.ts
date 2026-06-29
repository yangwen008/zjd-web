// 测试专用数据层 - 不影响现有 lib
// 这里先用假数据，后续可以对接真实 API

export interface Region {
  id: string;
  rank: number;
  name: string;
  subtitle: string;
  views: number;
  imageUrl: string;
}

export interface Property {
  id: string;
  title: string;
  price: string;
  priceUnit: string;
  area?: string;
  location: string;
  type: string;
  imageUrl: string;
  badge?: string;
}

export interface VillageProject {
  id: string;
  title: string;
  contact: string;
  description: string;
  price: string;
  imageUrl: string;
}

// BulkProject interface moved to lib/data.ts

export interface InfraRating {
  id: string;
  region: string;
  score: number;
  internet: string;
  medical: string;
  power: string;
}

export interface Broker {
  id: string;
  name: string;
  region: string;
  avatarUrl: string;
  successRate: string;
  leads: string;
  phone: string;
}

// 假数据 - 后续可以替换为真实 API 调用
export const mockRegions: Region[] = [
  {
    id: "1",
    rank: 1,
    name: "杭州·安吉园",
    subtitle: "溪畔宅基地原矿",
    views: 11420,
    imageUrl: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&h=400&fit=crop"
  },
  {
    id: "2",
    rank: 2,
    name: "成都·都江堰青城山",
    subtitle: "林地茶场",
    views: 17120,
    imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=400&fit=crop"
  },
  {
    id: "3",
    rank: 3,
    name: "大理·苍洱园",
    subtitle: "传统完好白族老宅",
    views: 12400,
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop"
  },
  {
    id: "4",
    rank: 4,
    name: "丽水·缙云园",
    subtitle: "景区旁极客石头房",
    views: 9450,
    imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&h=400&fit=crop"
  },
  {
    id: "5",
    rank: 5,
    name: "桂林·阳朔园",
    subtitle: "临江峰林院落",
    views: 8900,
    imageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=400&fit=crop"
  },
  {
    id: "6",
    rank: 6,
    name: "北京·延庆园",
    subtitle: "长城脚下北方老院",
    views: 6610,
    imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&h=400&fit=crop"
  }
];

export const mockProperties: Property[] = [
  {
    id: "p1",
    title: "安吉递铺镇 180㎡溪畔官方原矿宅基地",
    price: "8.5万",
    priceUnit: "年",
    location: "浙江·安吉",
    type: "20年期正确权使用权",
    imageUrl: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&h=400&fit=crop",
    badge: "一手官方资源"
  },
  {
    id: "p2",
    title: "都江堰青城山避暑带 240㎡集体确权民居",
    price: "12万",
    priceUnit: "年",
    location: "四川·都江堰",
    type: "20年期正确权使用权",
    imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop",
    badge: "一手官方资源"
  },
  {
    id: "p3",
    title: "大理喜洲 150㎡传统白族完好修缮老宅",
    price: "6.5万",
    priceUnit: "年",
    location: "云南·大理",
    type: "20年期正确权使用权",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
    badge: "一手官方资源"
  },
  {
    id: "p4",
    title: "丽水缙云 210㎡仙都景区旁极客流转石头房",
    price: "5.8万",
    priceUnit: "年",
    location: "浙江·丽水",
    type: "25年期正确权使用权",
    imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&h=400&fit=crop",
    badge: "一手官方资源"
  },
  {
    id: "p5",
    title: "桂林阳朔 190㎡临江独栋原生峰林院落",
    price: "9.2万",
    priceUnit: "年",
    location: "广西·桂林",
    type: "20年期正确权使用权",
    imageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=400&fit=crop",
    badge: "一手官方资源"
  },
  {
    id: "p6",
    title: "北京延庆 160㎡长城脚下保存完美北方老院",
    price: "11.5万",
    priceUnit: "年",
    location: "北京·延庆",
    type: "15年期正确权使用权",
    imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&h=400&fit=crop",
    badge: "一手官方资源"
  }
];

export const mockVillageProjects: VillageProject[] = [
  {
    id: "v1",
    title: "安吉余村 1200㎡闲置村办小学校舍整体招商",
    contact: "陈书记（余村股份合作社）",
    description: "【村委官方直招】已完成林地及基本农田交叉排查。流转红线图已经过绵阳网安科技有限公司实测归档。适合中高档奢野度假、数字游...",
    price: "15万/年",
    imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop"
  },
  {
    id: "v2",
    title: "青城山下 45亩 传统梯田茶园配3栋闲置库房",
    contact: "都江堰青城山镇合作社驻外办",
    description: "【村委官方直招】已完成林地及基本农田交叉排查。流转红线图已经过绵阳网安科技有限公司实测归档。适合中高档奢野度假、数字游...",
    price: "18.5万/年",
    imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=400&fit=crop"
  }
];

export const mockBulkProjects: BulkProject[] = [
  {
    id: "b1",
    code: "230-990: 021",
    title: "莫干山辐射圈 · 闲置集体村办小学校舍整栋流转招商",
    description: "包含完整苏式红砖多功能空间、宽敞院落。权属已归属乡村经济合作社，AI测算黄金投资回报周期约5.8年。",
    area: "约1220㎡",
    yieldRate: "6.80%",
    price: "15.0万/年起打包",
    hasCertificate: true
  },
  {
    id: "b2",
    code: "230-990: 055",
    title: "都江堰青城山旁 · 45亩传统梯田茶园配3栋闲置库房",
    description: "首期已由村委办协调完成林地林权排他性测绘，提供小溪及微水电野奢级配接入方案。适合品牌文旅民宿带开发。",
    area: "约1300㎡",
    yieldRate: "6.80%",
    price: "18.5万/年起流转",
    hasCertificate: true
  }
];

export const mockInfraRatings: InfraRating[] = [
  {
    id: "i1",
    region: "浙江安吉天荒坪余村片区",
    score: 9.5,
    internet: "100% 已双线入户",
    medical: "三甲医院 22分钟车程",
    power: "镇供电所 双回路高压电备份"
  },
  {
    id: "i2",
    region: "成都都江堰青城山度假区",
    score: 8.8,
    internet: "92% 光纤宽带并网",
    medical: "都江堰人民医院 15分钟",
    power: "独立山泉泉水小水电联网备份"
  },
  {
    id: "i3",
    region: "大理白族自治州喜洲古镇区",
    score: 7.2,
    internet: "75% 5G基站高复盖",
    medical: "大理州第二人民医院 35分钟",
    power: "古镇强双营电管网并联"
  }
];

export const mockBrokers: Broker[] = [
  {
    id: "br1",
    name: "金牌合伙人-老何镖团队",
    region: "湖州安吉/安吉余村四周",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    successRate: "94%",
    leads: "24 宗",
    phone: "138****5678"
  },
  {
    id: "br2",
    name: "青城山翠姐地陪办",
    region: "都江堰/大邑林盘群",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    successRate: "88%",
    leads: "18 宗",
    phone: "139****1234"
  },
  {
    id: "br3",
    name: "大理喜洲严大哥老宅代办",
    region: "云南/不属白族自治州",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    successRate: "91%",
    leads: "15 宗",
    phone: "137****9876"
  }
];

// 后续可以添加真实 API 调用
// export async function getTestHomeData() {
//   const [regions, properties, ...] = await Promise.all([
//     fetch('/api/regions').then(r => r.json()),
//     fetch('/api/properties').then(r => r.json()),
//   ]);
//   return { regions, properties, ... };
// }