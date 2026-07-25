// lib/pinyin.ts — 汉字转拼音首字母工具
// 用于生成资产编号：SC-CD-CZ-001（四川省成都市崇州市）

// 常用汉字拼音首字母映射（覆盖省市区高频用字）
// 按拼音分组，每个字母对应的常用汉字
const PINYIN_MAP: Record<string, string> = {};

function mapChars(chars: string, letter: string) {
  for (const c of chars) PINYIN_MAP[c] = letter;
}

// A
mapChars('阿啊哀爱安暗昂凹澳', 'A');
// B
mapChars('八巴把白百班般办半邦包宝保北本比毕边变宾滨冰并伯博卜不步', 'B');
// C
mapChars('才材蔡参仓曹草策层曾差柴产昌长常朝潮陈成呈程池冲充崇川创春此从丛崔翠村', 'C');
// D
mapChars('大达代带单但当党刀道得德的灯等低地弟点电丁定东冬洞都斗独杜度段对多', 'D');
// E
mapChars('额俄鄂恩尔二', 'E');
// F
mapChars('发法番繁方房飞非分丰风凤佛夫福甫复富', 'F');
// G
mapChars('甘感赣刚港高告哥格给根更工公功古谷固关观广贵桂国果', 'G');
// H
mapChars('哈海含汉杭好合和何河菏鹤黑很恒衡红宏洪后湖虎花华化怀淮环桓黄辉回会惠浑霍', 'H');
// J
mapChars('吉鸡基及极集济计记嘉加佳家甲尖简建江姜将焦角教揭洁结金津晋京经荆精景九久酒巨句军均', 'J');
// K
mapChars('开凯康考可克刻垦孔口奎昆', 'K');
// L
mapChars('拉来兰蓝郎朗劳老乐雷冷离梨黎礼里力历利连联良凉梁辽临灵陵令刘柳六龙陇卢鲁陆路吕洛骆', 'L');
// M
mapChars('马买麦满芒茅茂梅门蒙盟米密绵苗民名明莫墨默牟木目牧慕睦', 'M');
// N
mapChars('那纳南难内能宁农奴暖', 'N');
// P
mapChars('攀盘培沛彭蓬鹏平凭莆濮蒲莆普', 'P');
// Q
mapChars('七齐其奇启起千前乾黔桥巧钦秦琴青清庆丘区曲全泉', 'Q');
// R
mapChars('然仁任日荣容融如汝瑞润', 'R');
// S
mapChars('三色山陕汕善上韶邵绍社深神沈圣师十石时识始寿蜀双水顺朔四泗松苏肃随遂孙', 'S');
// T
mapChars('台太泰唐桃特天铁通同铜头图土吐屯托', 'T');
// W
mapChars('万汪王威为潍渭温文翁乌吴五武务', 'W');
// X
mapChars('西溪习峡厦仙鲜咸显香祥湘乡襄向象小孝新信兴行邢雄徐许宣薛学雪寻', 'X');
// Y
mapChars('牙崖雅烟延严言岩盐阳杨养尧姚叶一伊宜义益银应英营永用优游友有于余鱼渝榆玉元原远岳粤云', 'Y');
// Z
mapChars('扎杂枣泽则曾增扎寨张章召赵浙珍真镇正郑政枝知值植中忠钟周珠竹驻庄卓子自淄资紫遵柞', 'Z');

// 省份简称映射（直接用省份名首字取拼音首字母已够用，但部分需要特殊处理）
const PROVINCE_SHORT: Record<string, string> = {
  '北京市': 'BJ', '天津市': 'TJ', '上海市': 'SH', '重庆市': 'CQ',
  '河北省': 'HE', '山西省': 'SX', '辽宁省': 'LN', '吉林省': 'JL',
  '黑龙江省': 'HL', '江苏省': 'JS', '浙江省': 'ZJ', '安徽省': 'AH',
  '福建省': 'FJ', '江西省': 'JX', '山东省': 'SD', '河南省': 'HA',
  '湖北省': 'HB', '湖南省': 'HN', '广东省': 'GD', '海南省': 'HI',
  '四川省': 'SC', '贵州省': 'GZ', '云南省': 'YN', '陕西省': 'SN',
  '甘肃省': 'GS', '青海省': 'QH', '台湾省': 'TW',
  '内蒙古自治区': 'NM', '广西壮族自治区': 'GX', '西藏自治区': 'XZ',
  '宁夏回族自治区': 'NX', '新疆维吾尔自治区': 'XJ',
  '香港特别行政区': 'HK', '澳门特别行政区': 'MO',
};

/**
 * 获取单个汉字的拼音首字母
 */
function getCharInitial(char: string): string {
  return PINYIN_MAP[char] || char.toUpperCase().charAt(0);
}

/**
 * 获取中文字符串的拼音首字母缩写
 * 如：成都市 → CD, 西湖区 → XH
 */
export function getPinyinInitials(text: string): string {
  // 去掉"省""市""区""县""州""旗""盟"等行政后缀
  const cleaned = text
    .replace(/[省市州区县旗盟地区乡]/g, '')
    .trim();

  if (!cleaned) return 'XX';

  // 取每个字的首字母，最多取4个
  return Array.from(cleaned)
    .slice(0, 4)
    .map(c => getCharInitial(c))
    .join('')
    .toUpperCase();
}

/**
 * 获取省份的缩写代码
 */
export function getProvinceCode(province: string): string {
  // 先查精确匹配
  if (PROVINCE_SHORT[province]) return PROVINCE_SHORT[province];
  // 再查包含匹配（如"四川省"匹配"四川"）
  for (const [key, val] of Object.entries(PROVINCE_SHORT)) {
    if (key.includes(province) || province.includes(key.replace(/[省市区]/g, ''))) return val;
  }
  // fallback: 取拼音首字母
  return getPinyinInitials(province);
}

/**
 * 生成资产编号
 * 格式：省代码-城市首字母-区县首字母-序号
 * 如：SC-CD-CZ-001（四川省成都市崇州市第1号）
 */
export function generateAssetCode(
  province: string,
  city: string | null,
  district: string | null,
  sequenceNumber: number
): string {
  const parts: string[] = [];

  // 省份代码
  parts.push(getProvinceCode(province));

  // 城市代码
  if (city) {
    parts.push(getPinyinInitials(city));
  }

  // 区县代码
  if (district) {
    parts.push(getPinyinInitials(district));
  }

  // 序号（3位补零）
  parts.push(String(sequenceNumber).padStart(3, '0'));

  return parts.join('-');
}

/**
 * 根据资产数据生成编号（从数据库查询序号）
 */
export async function generateAssetCodeFromDB(
  province: string,
  city: string | null,
  district: string | null,
  assetType: 'asset' | 'bulk' = 'asset'
): Promise<string> {
  const { queryOne } = await import('./db');

  // 统计同地区的已有资产数量，用于生成序号
  let countSql: string;
  let args: unknown[];

  if (assetType === 'bulk') {
    countSql = 'SELECT COUNT(*) as cnt FROM bulk_projects WHERE province = ?';
    args = [province];
    if (city) { countSql += ' AND city = ?'; args.push(city); }
    if (district) { countSql += ' AND district = ?'; args.push(district); }
  } else {
    countSql = 'SELECT COUNT(*) as cnt FROM assets WHERE province = ? AND status != ?';
    args = [province, 'rejected'];
    if (city) { countSql += ' AND city = ?'; args.push(city); }
    if (district) { countSql += ' AND district = ?'; args.push(district); }
  }

  const countRow = await queryOne<{ cnt: number }>(countSql, ...args);
  const nextNum = (countRow?.cnt || 0) + 1;

  return generateAssetCode(province, city, district, nextNum);
}
