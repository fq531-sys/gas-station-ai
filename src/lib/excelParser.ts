// 加油站AI智能营销官 - 智能Excel解析器
// 支持多种零管系统导出的不同格式Excel

import * as XLSX from 'xlsx';
import { Order } from './types';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

// ============ 零管系统指纹定义 ============
export type OilStationSystem = '喂车' | '油客里里' | '智慧油客' | '帮jol' | '油分期' | '三泰云' | '盒子科技' | '哆点宝' | '量子高科' | '扫呀' | '卡路万' | 'ETCP' | '掌车' | '大唐' | '宽畅' | '嘀嘟' | 'TMS' | '百望' | '小米木' | '扫付' | '博士刷' | '窝窝头' | '58车智付' | '车主邦' | '懂老板' | '量子' | '嗖嗖' | '回收' | '扫钱' | '快支付' | '沃支付' | '壹消费' | '省省' | '星支付' | '扫得快' | '钱方' | '扫货' | '收银' | '快捷' | '收钱吧' | '付掌柜' | '来火' | '云支付' | '微支付' | '口碑' | '美团' | '大众点评' | '抖音' | '抖音月付' | '快手' | '今日头条' | 'QQ' | '微信' | '支付宝' | '翼支付' | '和包' | '云闪付' | '银联' | '拉卡拉' | '随行付' | '点刷' | '钱宝' | '考拉' | '合利宝' | '腾付通' | '汇聚' | '联动优势' | '易宝' | '新生' | '敏付' | '嘉联' | '瑞银信' | '现代' | '迅付' | '酷刷' | '银盛' | '通联' | '中汇' | '汇付' | '环迅' | '富友' | '卡拉卡' | '中付' | '付临门' | '银嘉' | 'POS' | '三善';

export interface SystemFingerprint {
  name: OilStationSystem;
  sheetNamePatterns: string[];
  headerSignature: string[];
  fieldMapping: Record<string, string>;
  notes: string;
}

const SYSTEM_FINGERPRINTS: SystemFingerprint[] = [
  {
    name: '喂车',
    sheetNamePatterns: ['喂车', '喂车·', 'weiche', 'weichewang'],
    headerSignature: ['油枪', '油机', '枪号', '油品', '加注量', '单价', '金额', '优惠', '实付', '交易时间', '订单号'],
    fieldMapping: {
      orderId: '订单号',
      transactionTime: '交易时间',
      oilType: '油品',
      quantity: '加注量',
      actualAmount: '实付金额',
      unitPrice: '单价',
      gunNo: '油枪',
      payWechat: '微信支付',
      payAlipay: '支付宝',
      payCash: '现金',
      payStoredCard: '储值卡',
      terminal: '站点',
    },
    notes: '喂车互联导出的Excel，表头包含"加注量"而非"加注数量"',
  },
  {
    name: '油客里里',
    sheetNamePatterns: ['油客里里', '油客', 'youke', 'youkeli'],
    headerSignature: ['子卡手机号', '子卡卡号', '实体卡号(付款)', '车牌号码(付款)', '交易时间', '油品', '加注数量', '订单金额', '实付金额', '优惠总额', '收银员工', '交易终端', '子卡姓名', '子卡车牌号', '油机联动', '通道商户号', '通道手续费', '通道结算金额', '标签名称', '会员昵称'],
    fieldMapping: {
      orderId: '订单号',
      transactionTime: '交易时间',
      subCardPhone: '子卡手机号',
      memberCode: '实体卡号(付款)',
      carPlate: '车牌号码(付款)',
      oilType: '油品',
      quantity: '加注数量',
      orderAmount: '订单金额',
      actualAmount: '实付金额',
      discountTotal: '优惠总额',
      terminal: '交易终端',
      cashier: '收银员工',
      memberNickname: '会员昵称',
      payUserPhone: '付款用户',
      gunNo: '油枪',
      payWechat: '实付_微信支付',
      payAlipay: '实付_支付宝支付',
      payCash: '实付_现金',
      payStoredCard: '实付_储值卡',
      payBankCard: '实付_银行卡支付',
      machineId: '油机联动',
      merchantNo: '通道商户号',
      channelFee: '通道手续费',
      channelSettleAmount: '通道结算金额',
      memberTag: '标签名称',
    },
    notes: '油客里里导出的Excel，表头固定包含"子卡卡号"和"子卡手机号"',
  },
  {
    name: '智慧油客',
    sheetNamePatterns: ['智慧油客', 'zhihui', '油客', '智慧'],
    headerSignature: ['订单号', '交易时间', '油品', '加注数量', '订单金额', '实付金额', '支付方式', '车牌号', '手机号', '站点名称', '枪号', '优惠总额', '满减优惠', '优惠券优惠'],
    fieldMapping: {
      orderId: '顾客会员编号',
      transactionTime: '创建时间',
      oilType: '商品号',
      quantity: '数量(L)',
      orderAmount: '应付金额',
      actualAmount: '客户实付金额',
      unitPrice: '单价',
      payType: '支付方式',
      carPlate: '',
      subCardPhone: '手机号',
      terminal: '站点名称',
      gunNo: '枪号',
      discountTotal: '优惠金额',
      memberCode: '实体卡号',
      memberNickname: '用户名称',
    },
    notes: '智慧油客导出的Excel',
  },
  {
    name: '帮jol',
    sheetNamePatterns: ['帮jol', '帮JOL', '帮jol', 'bangjol'],
    headerSignature: ['订单号', '订单时间', '油品', '油枪', '升数', '单价', '金额', '优惠', '实付金额', '支付方式', '卡号', '加油站'],
    fieldMapping: {
      orderId: '订单号',
      transactionTime: '订单时间',
      oilType: '油品',
      quantity: '升数',
      actualAmount: '实付金额',
      unitPrice: '单价',
      orderAmount: '金额',
      gunNo: '油枪',
      payType: '支付方式',
      memberCode: '卡号',
      terminal: '加油站',
    },
    notes: '帮jol导出的Excel',
  },
  {
    name: '油分期',
    sheetNamePatterns: ['油分期', 'youfenqi', 'youfq'],
    headerSignature: ['订单号', '交易时间', '油品', '升数', '原价', '实付', '优惠', '分期', '手机'],
    fieldMapping: {
      orderId: '订单号',
      transactionTime: '交易时间',
      oilType: '油品',
      quantity: '升数',
      orderAmount: '原价',
      actualAmount: '实付金额',
      discountTotal: '优惠',
      subCardPhone: '手机',
      terminal: '站点',
    },
    notes: '油分期导出的Excel',
  },
  {
    name: '三泰云',
    sheetNamePatterns: ['三泰云', 'santai', '三泰'],
    headerSignature: ['订单编号', '交易时间', '油品名称', '加注量', '单价', '金额', '实付', '支付', '车牌'],
    fieldMapping: {
      orderId: '订单编号',
      transactionTime: '交易时间',
      oilType: '油品名称',
      quantity: '加注量',
      actualAmount: '实付',
      unitPrice: '单价',
      orderAmount: '金额',
      payType: '支付',
      carPlate: '车牌',
      terminal: '站点',
    },
    notes: '三泰云导出的Excel',
  },
  {
    name: '三善',
    sheetNamePatterns: ['三善', 'sanshan'],
    headerSignature: ['销售流水号', '油站名称', '油枪编号', '油品名称', '油机单价(元/升)', '油机升数(升)', '油机金额(元)', '实收金额(元)', '优惠单价(元/升)', '券优惠金额(元)', '系统优惠金额(元)', '消费类型', '加油时间', '结算时间', '是否会员', '会员ID', '电话号码', '储值卡号', '班次'],
    fieldMapping: {
      orderId: '销售流水号',
      transactionTime: '加油时间',
      terminal: '油站名称',
      oilType: '油品名称',
      quantity: '油机升数(升)',
      unitPrice: '油机单价(元/升)',
      orderAmount: '油机金额(元)',
      actualAmount: '实收金额(元)',
      gunNo: '油枪编号',
      payType: '消费类型',
      memberCode: '会员ID',
      subCardPhone: '电话号码',
    },
    notes: '三善导出的Excel',
  },
];

// 检测Excel属于哪个零管系统
export function detectOilStationSystem(workbook: XLSX.WorkBook, headers: string[]): OilStationSystem | null {
  // 1. 先用sheet名称匹配
  for (const sheetName of workbook.SheetNames) {
    for (const fp of SYSTEM_FINGERPRINTS) {
      for (const pattern of fp.sheetNamePatterns) {
        if (sheetName.includes(pattern) || sheetName.toLowerCase().includes(pattern.toLowerCase())) {
          console.log(`[系统识别] 通过Sheet名称识别: ${sheetName} -> ${fp.name}`);
          return fp.name;
        }
      }
    }
  }

  // 2. 用表头特征匹配（精确匹配优先）
  const headerSet = new Set(headers.map(h => h.trim()));

  let bestMatch: SystemFingerprint | null = null;
  let bestScore = 0;

  for (const fp of SYSTEM_FINGERPRINTS) {
    let score = 0;
    for (const sig of fp.headerSignature) {
      if (headerSet.has(sig)) {
        // 精确匹配得2分
        score += 2;
      } else {
        // 模糊匹配得1分（包含关系）
        for (const h of headers) {
          if (typeof h === 'string' && (h.includes(sig) || sig.includes(h))) {
            score += 1;
            break;
          }
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = fp;
    }
  }

  if (bestMatch && bestScore >= 4) {
    console.log(`[系统识别] 通过表头特征识别: ${bestMatch.name} (得分${bestScore})`);
    return bestMatch.name;
  }

  return null;
}

// 根据系统类型获取预定义的字段映射
export function getSystemFieldMapping(systemName: OilStationSystem): Record<string, string> | null {
  const fp = SYSTEM_FINGERPRINTS.find(f => f.name === systemName);
  return fp ? fp.fieldMapping : null;
}

// ============ 字段变体定义 ============
const FIELD_VARIANTS: Record<string, string[]> = {
  orderId: ['订单号', '交易单号', '流水号', '单号', 'order_no', 'orderid', 'order_id', 'uid', '编号'],
  oilType: ['油品', '油号', '品号', '油种类', 'oil_type', 'product', '加油油品', '油品名称', '油品'],
  quantity: ['加注数量', '加注量', '加油量', '数量', '升数', 'volume', 'qty', 'liter', '加油升数', '加油数量', '升数'],
  actualAmount: ['实付金额', '实付', '实收金额', '实收', '支付金额', 'amount', 'pay_amount', '实付合计'],
  transactionTime: ['交易时间', '下单时间', '时间', '订单时间', 'datetime', 'time', 'trans_time', 'create_time', '支付时间', '成交时间'],
  terminal: ['交易终端', '终端', '来源', 'terminal', '油站名', '站点', '油站', '油站名称'],
  cashier: ['收银员工', '收银员', '员工', '操作员', 'cashier', '收银'],
  gunNo: ['油枪', '枪号', '枪', 'gun_no', 'gun'],
  unitPrice: ['单价', '价格', '油单价', 'price', '油品单面值', '单价'],
  orderAmount: ['订单金额', '订单总额', '总金额', 'order_amount', '加油金额（原价）', '原价', '应付金额', '油品单面值'],
  discountTotal: ['优惠总额', '优惠总金额', '总优惠', 'discount', '优惠金额'],
  payWechat: ['实付_微信支付', '微信', '微信支付', 'wechat', '微信支付金额'],
  payAlipay: ['实付_支付宝', '支付宝', 'alipay', '支付宝金额'],
  payCash: ['实付_现金', '现金', 'cash', '现金金额'],
  payStoredCard: ['实付_储值卡', '储值卡', '储值', '储值卡金额'],
  payBankCard: ['实付_银行卡支付', '银行卡', 'bank', '银行卡金额'],
  payType: ['付款类型', '支付方式', '支付类型', 'pay_type'],
  memberNickname: ['会员昵称', '会员名称', '昵称', 'member_name', 'name'],
  carPlate: ['车牌号码', '车牌', '车牌号', 'car_plate', 'plate', '车号'],
  subCardPhone: ['子卡手机号', '手机号码', '电话号码', 'phone', 'tel', 'mobile', 'sub_phone', '手机', '手机号码'],
  payUserPhone: ['付款用户', '付款人', '用户', 'user', '付款账号', '会员手机'],
  memberTag: ['标签名称', '标签', '会员标签', 'tag'],
  memberCode: ['会员编码', '加油卡号', 'member_code', '会员号', '加油卡号', '卡号'],
  machineId: ['油机联动'],
  merchantNo: ['通道商户号'],
  channelFee: ['通道手续费'],
  channelSettleAmount: ['通道结算金额'],
};

// 数字字段（需要转换为数字类型）
const NUMERIC_FIELDS = new Set([
  'quantity', 'unitPrice', 'orderAmount', 'discountTotal', 'actualAmount',
  'discountFullReduce', 'discountCoupon', 'discountRoundOff',
  'payWechat', 'payAlipay', 'payCash', 'payStoredCard', 'payBankCard',
  'channelFee', 'channelSettleAmount', 'discountedPrice'
]);

// 日期字段
const DATE_FIELDS = ['transactionTime'];

// 油品名称标准化映射（从完整中文名提取标准油品号）
const OIL_TYPE_MAP: Record<string, string> = {
  '国六92#车用汽油': '92#',
  '国六95#车用汽油': '95#',
  '国六98#车用汽油': '98#',
  '国六0#车用柴油': '0#',
  '92#车用汽油': '92#',
  '95#车用汽油': '95#',
  '98#车用汽油': '98#',
  '0#车用柴油': '0#',
  '92#汽油': '92#',
  '95#汽油': '95#',
  '98#汽油': '98#',
  '0#柴油': '0#',
  '92#': '92#',
  '95#': '95#',
  '98#': '98#',
  '0#': '0#',
};

export interface ParseResult {
  orders: Order[];
  fieldMapping: Record<string, string>;
  stats: {
    totalRows: number;
    validRows: number;
    errorRows: number;
  };
}

// 标准化油品名称
function normalizeOilType(oilType: string): string {
  if (!oilType) return '';

  const trimmed = oilType.trim();

  // 先查找精确映射
  if (OIL_TYPE_MAP[trimmed]) {
    return OIL_TYPE_MAP[trimmed];
  }

  // 尝试模糊匹配（包含关键词）
  for (const [fullName, shortName] of Object.entries(OIL_TYPE_MAP)) {
    if (trimmed.includes(fullName) || fullName.includes(trimmed)) {
      return shortName;
    }
  }

  // 直接提取92#、95#等数字+井号格式
  const match = trimmed.match(/([0-9]+#)/);
  if (match) {
    return match[1];
  }

  // 如果是纯数字（如92），加上#
  if (/^\d+$/.test(trimmed)) {
    return trimmed + '#';
  }

  return trimmed;
}

// 解析Excel日期序列号
function parseExcelDate(serial: number): Date | undefined {
  if (!serial || typeof serial !== 'number' || isNaN(serial)) return undefined;

  // Excel日期序列号从1900-01-01开始（但实际上1900年2月有29天，所以要减1）
  // 公式：JS时间戳 = (Excel序列号 - 25569) * 86400 * 1000
  // 但有些Excel使用1904日期系统，这里需要兼容
  try {
    // 先尝试标准的Excel序列号转换
    let date = new Date((serial - 25569) * 86400 * 1000);

    // 如果结果在1970年之前，可能是1904日期系统
    if (isNaN(date.getTime()) || date.getFullYear() < 1970) {
      // 1904日期系统：基准是1904-01-01
      date = new Date((serial - 24107) * 86400 * 1000);
    }

    // 再次检查是否有效
    if (isNaN(date.getTime())) {
      return undefined;
    }

    // 验证日期合理性（必须在2000年到当前时间之间）
    if (date.getFullYear() >= 2000 && date.getFullYear() <= 2100) {
      return date;
    }

    return undefined;
  } catch {
    return undefined;
  }
}

// 解析日期时间（兼容多种格式）
function parseDateTime(value: any): Date | undefined {
  if (!value) return undefined;

  // 已经是Date对象
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return undefined;
    // 检查是否是有效的Windows FILETIME (1600年代) - 转换为JS Date
    if (value.getFullYear() < 1970 && value.getFullYear() > 1500) {
      // 这可能是Windows FILETIME，需要转换
      const ms = value.getTime();
      value = new Date((ms - 11644473600000000) / 10000);
    }
    return value;
  }

  // Excel序列号（数字类型）
  if (typeof value === 'number') {
    return parseExcelDate(value);
  }

  // 字符串日期
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    // 先尝试作为Excel序列号解析（有些Excel可能仍返回数字字符串）
    const asNumber = parseFloat(trimmed);
    if (!isNaN(asNumber) && asNumber > 25000 && asNumber < 60000) {
      const excelDate = parseExcelDate(asNumber);
      if (excelDate) return excelDate;
    }

    // 尝试解析时间戳格式（如 2023013114125013147044 这样的14位或17位数字）
    if (/^\d{10,20}$/.test(trimmed)) {
      const ts = parseInt(trimmed);
      // 毫秒级时间戳（13位）
      if (ts > 1000000000000) {
        const date = new Date(ts);
        if (!isNaN(date.getTime()) && date.getFullYear() >= 2000 && date.getFullYear() <= 2100) {
          return date;
        }
      }
      // 秒级时间戳（10位）
      if (ts > 1000000000 && ts < 2000000000) {
        const date = new Date(ts * 1000);
        if (!isNaN(date.getTime()) && date.getFullYear() >= 2000 && date.getFullYear() <= 2100) {
          return date;
        }
      }
      // 可能是14位格式 YYYYMMDDHHmmss
      if (trimmed.length === 14) {
        const date = dayjs(trimmed, 'YYYYMMDDHHmmss');
        if (date.isValid()) return date.toDate();
      }
      // 17位格式（纳秒级时间戳除以100000）
      if (trimmed.length === 17) {
        const date = new Date(ts / 100000);
        if (!isNaN(date.getTime()) && date.getFullYear() >= 2000 && date.getFullYear() <= 2100) {
          return date;
        }
      }
      // 19位格式：可能是 YYYYMMDDHHmmss + 尾码 (如 2023031120191115291129)
      // 前14位是日期时间：20230311201911 = 2023-03-11 20:19:11
      if (trimmed.length === 19 || trimmed.length === 18 || trimmed.length === 20) {
        const datetimePart = trimmed.substring(0, 14);
        if (/^\d{14}$/.test(datetimePart)) {
          const date = dayjs(datetimePart, 'YYYYMMDDHHmmss');
          if (date.isValid() && date.year() >= 2000 && date.year() <= 2100) {
            return date.toDate();
          }
        }
      }
    }

    // 尝试多种日期格式
    const formats = [
      'M/D/YY HH:mm:ss',
      'M/D/YY HH:mm',
      'M/D/YYYY HH:mm:ss',
      'M/D/YYYY HH:mm',
      'YYYY-MM-DD HH:mm:ss',
      'YYYY-MM-DD HH:mm',
      'YYYY-MM-DD',
      'YYYY/MM/DD HH:mm:ss',
      'YYYY/MM/DD HH:mm',
      'YYYY/MM/DD',
      'MM/DD/YYYY HH:mm:ss',
      'MM/DD/YYYY HH:mm',
      'MM/DD/YYYY',
      'DD/MM/YYYY HH:mm:ss',
      'DD/MM/YYYY',
      'YY/M/D HH:mm',
      'YYYY年MM月DD日 HH:mm:ss',
      'YYYY年MM月DD日 HH:mm',
      'YYYY年MM月DD日',
      'DD/MM/YY HH:mm:ss',
      'DD/MM/YY HH:mm',
      'DD-MM-YYYY HH:mm:ss',
      'DD-MM-YYYY HH:mm',
      'DD-MM-YYYY',
      'YYYY-MM-DDTHH:mm:ss',
      'YYYY-MM-DDTHH:mm:ss.SSS',
      'YYYYMMDD HH:mm:ss',
      'YYYYMMDDHHmmss',
    ];

    for (const format of formats) {
      const parsed = dayjs(trimmed, format, true);
      if (parsed.isValid()) {
        const date = parsed.toDate();
        if (date.getFullYear() >= 2000 && date.getFullYear() <= 2100) {
          return date;
        }
      }
    }

    // 最后尝试dayjs的自动解析
    const autoParsed = dayjs(trimmed);
    if (autoParsed.isValid()) {
      const date = autoParsed.toDate();
      if (date.getFullYear() >= 2000 && date.getFullYear() <= 2100) {
        return date;
      }
    }

    // 检查是否是中国日期格式：YYYY年MM月DD日 HH:mm:ss
    const cnMatch = trimmed.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (cnMatch) {
      const date = new Date(parseInt(cnMatch[1]), parseInt(cnMatch[2]) - 1, parseInt(cnMatch[3]));
      if (!isNaN(date.getTime()) && date.getFullYear() >= 2000 && date.getFullYear() <= 2100) {
        // 解析时间部分
        const timeMatch = trimmed.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
        if (timeMatch) {
          date.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), parseInt(timeMatch[3] || '0'));
        }
        return date;
      }
    }
  }

  return undefined;
}

// 检查是否可能是标题行（而非真正的表头）
// 标题行通常包含特殊字符、日期范围、或看起来像描述性文本
function isLikelyTitleRow(headerRow: string[]): boolean {
  const titleIndicators = [
    '至', '至', '至', // 日期范围分隔符
    '优加油', '加油站', // 加油站名称相关
    '统计数据', '数据概览', '报表', '导出', '生成', '打印',
    '开始日期', '结束日期', '日期范围',
    '查询条件', '筛选', '过滤',
  ];

  // 如果有超过3个单元格包含标题关键词，则认为是标题行
  const matchCount = headerRow.filter(cell => {
    if (typeof cell !== 'string') return false;
    const cellStr = cell.trim();
    return titleIndicators.some(indicator => cellStr.includes(indicator));
  }).length;

  // 如果超过一半的单元格是空的且另一半像是描述性文本，也认为是标题行
  const emptyCount = headerRow.filter(cell => !cell || cell.trim() === '').length;
  const isMostlyEmpty = emptyCount > headerRow.length / 2;

  // 如果单元格内容以数字开头但看起来像日期范围，也认为是标题行
  const hasDateRange = headerRow.some(cell => {
    if (typeof cell !== 'string') return false;
    return /\d{4}-\d{2}-\d{2}\s+至\s+\d{4}-\d{2}-\d{2}/.test(cell);
  });

  // 如果包含日期范围格式 "2026-04-01 00:00:00至2026-04-02 23:59:59"
  const hasFullDateRange = headerRow.some(cell => {
    if (typeof cell !== 'string') return false;
    return /至/.test(cell) && (/\d{4}-\d{2}-\d{2}/.test(cell) || /\d{2}:\d{2}:\d{2}/.test(cell));
  });

  return matchCount >= 3 || hasDateRange || hasFullDateRange || (isMostlyEmpty && matchCount > 0);
}

// 检查是否像是真正的表头行
// 真正的表头通常包含常见的字段名如手机号、订单号、金额等
function isLikelyRealHeaderRow(headerRow: string[]): boolean {
  const realHeaderKeywords = [
    '手机', '订单', '金额', '油品', '加油', '时间', '支付', '车牌', '会员',
    '升数', '原价', '实付', '油枪', '收银', '终端', '编号', '卡号',
    '折扣', '优惠', '满减', '券', '枪号', '站点', '散户', '现金', '微信', '支付宝',
    '交易', '散户', '编号', '昵称', '标签', '渠道', '结算', '手续费', '油机', '通道',
    '单价', '数量', '总额', '单号', '流水', '用户', '客户', '姓名', '余额', '备注',
    '类型', '名称', '时间', '日期', '编号', '序号'
  ];

  // 检查这行是否包含真实表头关键词
  const matchCount = headerRow.filter(cell => {
    if (typeof cell !== 'string') return false;
    const cellStr = cell.trim();
    return realHeaderKeywords.some(kw => cellStr === kw || cellStr.includes(kw));
  }).length;

  // 如果有至少5个匹配，认为是真实表头
  return matchCount >= 5;
}

// 智能识别表头行（跳过可能的无用行）
function findHeaderRow(jsonData: any[][]): { headerRow: string[]; dataStartIndex: number } {
  // 如果第一行全是字符串（看起来像字段名），那就是表头
  const firstRow = jsonData[0];
  if (firstRow && firstRow.length > 5) {
    const stringCellCount = firstRow.filter(c => typeof c === 'string' && c.trim().length > 0).length;
    const totalCells = firstRow.length;
    // 如果第一行超过80%的单元格是字符串，认为是表头行
    if (stringCellCount / totalCells > 0.8) {
      const headerRow = firstRow.map(cell => String(cell || '').trim());
      // 检查是否是真正的表头（不能是标题行）
      if (!isLikelyTitleRow(headerRow) && !hasMergedCellDuplication(headerRow)) {
        return { headerRow, dataStartIndex: 1 };
      }
    }
  }

  // 扩大的表头关键词列表
  const headerKeywords = [
    '手机', '订单', '金额', '油品', '加油', '时间', '支付', '车牌', '会员',
    '升数', '原价', '实付', '油枪', '收银', '终端', '编号', '卡号',
    '折扣', '优惠', '满减', '券', '枪号', '站点', '散户', '现金', '微信', '支付宝',
    '交易', '散户', '编号', '昵称', '标签', '渠道', '结算', '手续费', '油机', '通道',
    '单价', '数量', '总额', '编号', '单号', '流水', '用户', '客户', '姓名', '姓名'
  ];

  for (let i = 0; i < Math.min(20, jsonData.length); i++) {
    const row = jsonData[i];
    if (!row || row.length === 0) continue;

    // 检查这一行是否像表头（包含常见字段名）
    const matchCount = row.filter(cell => {
      if (typeof cell !== 'string') return false;
      const cellStr = cell.trim();
      // 检查是否完全匹配关键词（精确匹配优先级更高）
      return headerKeywords.some(kw => cellStr === kw || cellStr.includes(kw));
    }).length;

    // 如果这行有3个以上单元格匹配关键词，认为是表头行
    if (matchCount >= 3) {
      const headerRow = row.map(cell => String(cell || '').trim());
      // 再次检查是否是标题行或合并单元格问题
      if (!isLikelyTitleRow(headerRow) && !hasMergedCellDuplication(headerRow)) {
        return { headerRow, dataStartIndex: i + 1 };
      }
    }
  }

  // 找不到表头，扫描更多行，找含有最多关键词的那一行
  let bestRowIndex = 0;
  let bestMatchCount = 0;
  for (let i = 0; i < Math.min(30, jsonData.length); i++) {
    const row = jsonData[i];
    if (!row || row.length === 0) continue;
    const matchCount = row.filter(cell => {
      if (typeof cell !== 'string') return false;
      const cellStr = cell.trim();
      return headerKeywords.some(kw => cellStr === kw || cellStr.includes(kw));
    }).length;
    if (matchCount > bestMatchCount) {
      bestMatchCount = matchCount;
      bestRowIndex = i;
    }
  }

  if (bestMatchCount > 0) {
    const headerRow = jsonData[bestRowIndex].map(cell => String(cell || '').trim());
    return { headerRow, dataStartIndex: bestRowIndex + 1 };
  }

  // 最后兜底：假设第0行是表头
  return { headerRow: jsonData[0].map(cell => String(cell || '').trim()), dataStartIndex: 1 };
}

// 检查是否有大量重复的单元格值（合并单元格特征）
function hasMergedCellDuplication(headerRow: string[]): boolean {
  const valueCount = new Map<string, number>();
  headerRow.forEach(cell => {
    if (cell && cell.trim()) {
      const count = valueCount.get(cell) || 0;
      valueCount.set(cell, count + 1);
    }
  });

  // 如果任何值重复超过3次，认为可能是合并单元格问题
  for (const count of valueCount.values()) {
    if (count > 3) return true;
  }

  return false;
}

// 智能字段映射（模糊匹配）
function intelligentFieldMapping(headers: string[], sampleRows: any[][] = []): Record<string, string> {
  const mapping: Record<string, string> = {};

  // 第一阶段：只做精确匹配（排除包含匹配）
  headers.forEach((header, index) => {
    if (!header || typeof header !== 'string') return;

    const normalizedHeader = header.trim().toLowerCase();

    for (const [field, variants] of Object.entries(FIELD_VARIANTS)) {
      for (const variant of variants) {
        const normalizedVariant = variant.toLowerCase();
        // 仅精确匹配
        if (normalizedHeader === normalizedVariant) {
          if (!mapping[field]) {
            mapping[field] = header;
          }
          break;
        }
      }
    }
  });

  // 第二阶段：对尚未匹配的字段，尝试包含匹配（但要严格条件）
  headers.forEach((header, index) => {
    if (!header || typeof header !== 'string') return;

    const normalizedHeader = header.trim().toLowerCase();
    // 表头太短容易误匹配，跳过（如"时间"、"订单"等单独字）
    if (normalizedHeader.length <= 2) return;

    for (const [field, variants] of Object.entries(FIELD_VARIANTS)) {
      // 已匹配的字段跳过
      if (mapping[field]) continue;

      for (const variant of variants) {
        const normalizedVariant = variant.toLowerCase();
        // 包含匹配：表头长度 >= 5 且 变体长度 >= 2
        if (normalizedHeader.length >= 5 && normalizedVariant.length >= 2) {
          if (normalizedHeader.includes(normalizedVariant) || normalizedVariant.includes(normalizedHeader)) {
            mapping[field] = header;
            break;
          }
        }
      }
    }
  });

  // 第三阶段：编辑距离模糊匹配（处理打字错误）
  headers.forEach((header) => {
    if (!header || typeof header !== 'string') return;

    const normalizedHeader = header.trim().toLowerCase();
    // 表头太短不做模糊匹配
    if (normalizedHeader.length <= 3) return;

    for (const [field, variants] of Object.entries(FIELD_VARIANTS)) {
      if (mapping[field]) continue;

      for (const variant of variants) {
        const normalizedVariant = variant.toLowerCase();
        // 只在长度相近时使用编辑距离
        if (normalizedHeader.length > 3 && normalizedVariant.length > 3 &&
            Math.abs(normalizedHeader.length - normalizedVariant.length) <= 2) {
          if (fuzzyMatch(normalizedHeader, normalizedVariant)) {
            mapping[field] = header;
            break;
          }
        }
      }
    }
  });

  // 第四阶段：基于数据内容推断字段（后备方案 - 最低优先级）
  if (sampleRows.length > 0) {
    const inferMapping = inferFieldsFromContent(headers, sampleRows);
    for (const [field, column] of Object.entries(inferMapping)) {
      // 内容推断只填充尚未匹配的字段
      if (!mapping[field]) {
        mapping[field] = column;
      }
    }
  }

  // 第五阶段：基于位置的兜底映射（仅对仍未匹配的字段生效）
  // 典型列顺序: 交易终端, 收银员工, 订单号, 油品, 油枪, 单价, 加注数量, 订单金额, ...
  const fallbackPositions: Record<string, number> = {
    orderId: 2,       // 订单号
    oilType: 3,       // 油品
    gunNo: 4,         // 油枪
    unitPrice: 5,     // 单价
    quantity: 6,      // 加注数量
    orderAmount: 7,   // 订单金额
    actualAmount: 12, // 实付金额
    transactionTime: 26, // 交易时间
    payType: 22,      // 付款类型
    subCardPhone: 34, // 子卡卡号
    carPlate: 29,     // 车牌号码(付款)
    memberNickname: 23, // 会员昵称
    memberCode: 35,   // 实体卡号(付款)
  };

  for (const [field, pos] of Object.entries(fallbackPositions)) {
    if (!mapping[field] && pos < headers.length && headers[pos]) {
      mapping[field] = headers[pos];
    }
  }

  return mapping;
}

// 模糊字符串匹配（基于编辑距离）
function fuzzyMatch(s1: string, s2: string, maxDistance: number = 3): boolean {
  if (Math.abs(s1.length - s2.length) > maxDistance) return false;
  const distance = levenshteinDistance(s1, s2);
  return distance <= maxDistance;
}

// Levenshtein编辑距离算法
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]) + 1;
      }
    }
  }
  return dp[m][n];
}

// 基于数据内容推断字段
function inferFieldsFromContent(headers: string[], sampleRows: any[][]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const headerCount = headers.length;

  for (let colIndex = 0; colIndex < headerCount; colIndex++) {
    const header = headers[colIndex]?.toString().trim() || '';
    if (!header) continue;

    // 分析该列的数据特征
    const values = sampleRows.slice(0, 20).map(row => row[colIndex]).filter(v => v != null && v !== '' && v !== undefined);
    if (values.length === 0) continue;

    const numericCount = values.filter(v => {
      const num = parseFloat(v);
      return !isNaN(num) && String(v).trim() !== '';
    }).length;
    const dateCount = values.filter(v => {
      const val = String(v).trim();
      return val.includes('/') || val.includes('-') || val.includes(':');
    }).length;
    const phoneCount = values.filter(v => {
      const val = String(v).replace(/[\s\-]/g, '');
      return /^1\d{10}$/.test(val) || /^\d{11}$/.test(val);
    }).length;
    const plateCount = values.filter(v => {
      const val = String(v).toUpperCase();
      return /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使][A-Z][A-Z0-9]{5}$/.test(val);
    }).length;
    const oilCount = values.filter(v => {
      const val = String(v).toUpperCase();
      return val.includes('92') || val.includes('95') || val.includes('98') || val.includes('0#') || val.includes('柴油') || val.includes('汽油');
    }).length;

    const totalValues = values.length;
    const numericRatio = totalValues > 0 ? numericCount / totalValues : 0;
    const dateRatio = totalValues > 0 ? dateCount / totalValues : 0;
    const phoneRatio = totalValues > 0 ? phoneCount / totalValues : 0;
    const plateRatio = totalValues > 0 ? plateCount / totalValues : 0;
    const oilRatio = totalValues > 0 ? oilCount / totalValues : 0;

    // 根据数据特征推断字段（只覆盖未匹配的字段）
    if (phoneRatio > 0.6 && !mapping['subCardPhone'] && !mapping['payUserPhone']) {
      mapping['subCardPhone'] = header;
    } else if (plateRatio > 0.3 && !mapping['carPlate']) {
      mapping['carPlate'] = header;
    } else if (oilRatio > 0.6 && !mapping['oilType']) {
      mapping['oilType'] = header;
    } else if (dateRatio > 0.6 && !mapping['transactionTime']) {
      mapping['transactionTime'] = header;
    } else if (numericRatio > 0.8 && !mapping['quantity'] && typeof header === 'string' && header.toLowerCase().includes('升')) {
      mapping['quantity'] = header;
    } else if (numericRatio > 0.8 && !mapping['actualAmount'] && typeof header === 'string' && (header.includes('实付') || header.includes('实收'))) {
      mapping['actualAmount'] = header;
    } else if (numericRatio > 0.8 && !mapping['orderAmount'] && typeof header === 'string' && (header.includes('原价') || header.includes('总金额') || header.includes('订单'))) {
      mapping['orderAmount'] = header;
    }
  }

  return mapping;
}

// 解析数据行
function parseDataRows(
  dataRows: any[][],
  headers: string[],
  fieldMapping: Record<string, string>
): { orders: Order[]; errors: string[] } {
  const orders: Order[] = [];
  const errors: string[] = [];

  // 建立列索引映射
  const columnIndexMap: Record<string, number> = {};
  headers.forEach((header, index) => {
    if (header) {
      columnIndexMap[header.trim()] = index;
    }
  });

  // 建立系统字段 -> 列索引映射
  const fieldToColumnIndex: Record<string, number> = {};
  for (const [field, columnName] of Object.entries(fieldMapping)) {
    if (typeof columnName !== 'string') continue;
    const index = columnIndexMap[columnName];
    if (index !== undefined) {
      fieldToColumnIndex[field] = index;
    }
  }

  // 备用列位置映射（基于常见加油站Excel的列顺序，仅作为最后兜底）
  // 典型顺序: [序号, uid, 手机号, 加油升数, 油品, 原价, 实付, 时间, 站点, 支付方式]
  const fallbackPositions: Record<string, number> = {
    orderId: 0,
    subCardPhone: 2,
    quantity: 3,
    oilType: 4,
    orderAmount: 5,
    actualAmount: 6,
    transactionTime: 7,
    terminal: 8,
    payType: 9,
  };

  // 兜底逻辑：只有当某列位置没有任何表头关键词匹配时才使用位置推断
  for (const [field, pos] of Object.entries(fallbackPositions)) {
    if (!fieldToColumnIndex[field] && pos < headers.length) {
      fieldToColumnIndex[field] = pos;
    }
  }

  dataRows.forEach((row, rowIndex) => {
    if (!row || row.length === 0) return;

    try {
      const order: any = {};

      // 获取每个字段的值
      for (const [field, colIndex] of Object.entries(fieldToColumnIndex)) {
        let value = row[colIndex];

        // 处理空单元格
        if (value === null || value === undefined || value === '') {
          if (field === 'oilType') {
            value = '92#'; // 油品默认值
          } else if (NUMERIC_FIELDS.has(field)) {
            value = 0;
          } else {
            value = '';
          }
          order[field] = value;
          continue;
        }

        // 类型转换
        if (NUMERIC_FIELDS.has(field)) {
          value = parseFloat(value);
          if (isNaN(value)) value = 0;
        } else if (DATE_FIELDS.includes(field)) {
          value = parseDateTime(value);
        } else if (field === 'oilType') {
          value = normalizeOilType(String(value));
        } else {
          value = String(value).trim();
        }

        order[field] = value;
      }

      // 生成订单号（如果不存在）
      if (!order.orderId) {
        order.orderId = `AUTO_${Date.now()}_${rowIndex}`;
      }

      // 计算小时字段（日期为可选项，无效日期不跳过该行）
      if (order.transactionTime && order.transactionTime instanceof Date && !isNaN(order.transactionTime.getTime())) {
        order.hour = order.transactionTime.getHours();
      } else {
        // 无效日期，不跳过该行，但不掩盖问题
        console.warn(`行${rowIndex + 1}: 无效的交易时间，跳过分类`, order.transactionTime);
        order.hour = 0;
        order._invalidDate = true; // 标记无效日期
      }

      // 宽松的验证条件：有订单号即可保留（说明这行有数据）
      if (!order.orderId) {
        return;
      }

      // 确保油品有值
      if (!order.oilType) {
        order.oilType = '92#'; // 默认值
      }

      orders.push(order as Order);
    } catch (error) {
      errors.push(`行${rowIndex + 1}: 解析错误`);
    }
  });

  return { orders, errors };
}

// 智能解析Excel文件（支持多种格式）
export function parseExcelFileSmart(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        // 收集所有sheet的数据
        const allOrders: Order[] = [];
        const allFieldMappings: Record<string, string>[] = [];
        let totalRows = 0;

        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];

          // 转换为JSON（保留原始值）
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd hh:mm:ss' }) as any[][];

          if (jsonData.length < 2) continue;

          // 智能识别表头行
          const { headerRow, dataStartIndex } = findHeaderRow(jsonData);

          // 如果没找到表头，使用第0行
          const headers = headerRow.length > 0 ? headerRow : (jsonData[0] || []).map(c => String(c || '').trim());
          const dataRows = jsonData.slice(dataStartIndex).filter(row => row && row.length > 0 && row.some(cell => cell !== null && cell !== undefined && cell !== ''));
          const sampleRows = jsonData.slice(dataStartIndex, dataStartIndex + 10);

          totalRows += dataRows.length;

          // 检测零管系统类型
          const detectedSystem = detectOilStationSystem(workbook, headers);
          const systemFieldMapping = detectedSystem ? getSystemFieldMapping(detectedSystem) : null;

          // 智能映射字段（传入样本数据用于内容分析）
          const fieldMapping = intelligentFieldMapping(headers, sampleRows);

          // 如果检测到系统，使用预定义字段映射覆盖（预定义优先）
          if (systemFieldMapping && headers) {
            console.log(`[系统识别] 使用预定义映射: ${detectedSystem}`);
            for (const [field, column] of Object.entries(systemFieldMapping)) {
              if (column && typeof column === 'string' && headers.includes(column)) {
                fieldMapping[field] = column;
              }
            }
          }

          console.log('字段映射:', JSON.stringify(fieldMapping));
          console.log('表头:', JSON.stringify(headers));
          console.log('样本行数据(前2行):', JSON.stringify(sampleRows.slice(0, 2)));
          console.log('colIndex for transactionTime:', fieldMapping['transactionTime']);

          // 解析数据
          const result = parseDataRows(dataRows, headers, fieldMapping);

          // 调试：分析客户标识覆盖率
          const totalOrders = result.orders.length;
          const withPhone = result.orders.filter(o => (o as any).subCardPhone && !String((o as any).subCardPhone).startsWith('ANON_')).length;
          const withMemberCode = result.orders.filter(o => (o as any).memberCode).length;
          const withCarPlate = result.orders.filter(o => o.carPlate).length;
          const withValidCustomerId = result.orders.filter(o => {
            const id = ((o as any).subCardPhone || (o as any).memberCode || (o as any).carPlate);
            return id && !String(id).startsWith('ANON_');
          }).length;
          console.log(`订单总数=${totalOrders}, 有手机号=${withPhone}, 有会员编码=${withMemberCode}, 有车牌=${withCarPlate}, 有有效客户ID=${withValidCustomerId}`);
          console.log('客户ID样本:', result.orders.slice(0, 3).map(o => ({ phone: (o as any).subCardPhone, memberCode: (o as any).memberCode, carPlate: o.carPlate })));

          allOrders.push(...result.orders);
          allFieldMappings.push(fieldMapping);
        }

        if (allOrders.length === 0) {
          console.error('解析失败 - 未找到有效的订单数据');
          console.error('Field mapping attempted:', allFieldMappings);
          reject(new Error('没有找到有效的订单数据'));
          return;
        }

        // 合并字段映射
        const mergedFieldMapping: Record<string, string> = {};
        for (const mapping of allFieldMappings) {
          for (const [field, column] of Object.entries(mapping)) {
            if (!mergedFieldMapping[field] && column) {
              mergedFieldMapping[field] = column;
            }
          }
        }

        resolve({
          orders: allOrders,
          fieldMapping: mergedFieldMapping,
          stats: {
            totalRows,
            validRows: allOrders.length,
            errorRows: totalRows - allOrders.length,
          },
        });
      } catch (error) {
        reject(new Error(`解析Excel失败: ${error instanceof Error ? error.message : String(error)}`));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}

// 预览Excel结构（用于调试）
export function previewExcelStructure(file: File): Promise<{
  sheetNames: string[];
  headers: string[];
  sampleRows: any[][];
  suggestedMapping: Record<string, string>;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        const { headerRow, dataStartIndex } = findHeaderRow(jsonData);
        const headers = headerRow.length > 0 ? headerRow : (jsonData[0] || []).map(c => String(c || '').trim());
        const sampleRows = jsonData.slice(dataStartIndex, dataStartIndex + 3);
        const mapping = intelligentFieldMapping(headers);

        resolve({
          sheetNames: workbook.SheetNames,
          headers,
          sampleRows,
          suggestedMapping: mapping,
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}