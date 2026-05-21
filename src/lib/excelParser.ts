// 加油站AI智能营销官 - 智能字段映射器
// 处理不同零管系统导出的不同格式Excel

import * as XLSX from 'xlsx';
import { Order } from './types';
import dayjs from 'dayjs';

// 核心必填字段（简化版，只保留关键指标）
const CORE_FIELDS = [
  'orderId',      // 订单号
  'oilType',      // 油品
  'quantity',     // 加注数量
  'actualAmount', // 实付金额
  'transactionTime', // 交易时间
] as const;

// 可选字段（用于客户识别和分析）
const OPTIONAL_FIELDS = [
  'terminal',     // 交易终端
  'cashier',      // 收银员工
  'gunNo',        // 油枪
  'unitPrice',    // 单价
  'orderAmount',  // 订单金额
  'discountTotal', // 优惠总额
  'discountFullReduce', // 满减优惠
  'discountCoupon', // 优惠券优惠
  'discountRoundOff', // 抹零金额
  'payWechat',    // 微信支付
  'payAlipay',    // 支付宝
  'payCash',      // 现金
  'payStoredCard', // 储值卡
  'payBankCard',  // 银行卡
  'payType',      // 付款类型
  'memberNickname', // 会员昵称
  'carPlate',     // 车牌号
  'subCardPhone', // 子卡手机号（客户电话）
  'payUserPhone', // 付款用户手机号
  'machineId',    // 油机联动
  'merchantNo',   // 通道商户号
  'channelFee',   // 通道手续费
  'channelSettleAmount', // 通道结算金额
  'discountedPrice', // 优惠后单价
  'memberTag',    // 会员标签
  'memberLevel',  // 会员等级
] as const;

// 常见字段名变体（用于智能匹配）
const FIELD_VARIANTS: Record<string, string[]> = {
  orderId: ['订单号', '交易单号', '流水号', '单号', 'order_no', 'orderid', 'order_id'],
  oilType: ['油品', '油号', '品号', '油种类', 'oil_type', 'product'],
  quantity: ['加注数量', '加油量', '数量', '升数', 'volume', 'qty', 'liter'],
  actualAmount: ['实付金额', '实付', '实收金额', '实收', '支付金额', 'amount', 'pay_amount'],
  transactionTime: ['交易时间', '下单时间', '时间', '订单时间', 'datetime', 'time', 'trans_time', 'create_time'],
  terminal: ['交易终端', '终端', '来源', 'terminal'],
  cashier: ['收银员工', '收银员', '员工', '操作员', 'cashier'],
  gunNo: ['油枪', '枪号', '枪', 'gun_no', 'gun'],
  unitPrice: ['单价', '价格', '油单价', 'price'],
  orderAmount: ['订单金额', '订单总额', '总金额', 'order_amount'],
  discountTotal: ['优惠总额', '优惠总金额', '总优惠', 'discount'],
  payWechat: ['实付_微信支付', '微信', '微信支付', 'wechat'],
  payAlipay: ['实付_支付宝', '支付宝', 'alipay'],
  payCash: ['实付_现金', '现金', 'cash'],
  payStoredCard: ['实付_储值卡', '储值卡', '储值'],
  payType: ['付款类型', '支付方式', '支付类型', 'pay_type'],
  memberNickname: ['会员昵称', '会员名称', '昵称', 'member_name', 'name'],
  carPlate: ['车牌号码', '车牌', '车牌号', 'car_plate', 'plate'],
  subCardPhone: ['子卡手机号', '手机号', '电话号码', 'phone', 'tel', 'mobile', 'sub_phone'],
  payUserPhone: ['付款用户', '付款人', '用户', 'user'],
  memberTag: ['标签名称', '标签', '会员标签', 'tag'],
};

// 数字字段
const NUMERIC_FIELDS = [
  'quantity', 'unitPrice', 'orderAmount', 'discountTotal', 'actualAmount',
  'discountFullReduce', 'discountCoupon', 'discountRoundOff',
  'payWechat', 'payAlipay', 'payCash', 'payStoredCard', 'payBankCard',
  'channelFee', 'channelSettleAmount', 'discountedPrice'
] as const;

// 日期字段
const DATE_FIELDS = ['transactionTime'] as const;

export interface ParseResult {
  orders: Order[];
  fieldMapping: Record<string, string>; // Excel列名 -> 系统字段
  stats: {
    totalRows: number;
    validRows: number;
    errorRows: number;
  };
}

export interface ExcelColumnInfo {
  columnName: string;
  sampleValues: any[];
  inferredField?: string;
}

// 智能解析Excel文件
export function parseExcelFileSmart(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 3) {
          reject(new Error('数据文件格式错误，行数不足'));
          return;
        }

        // 第0行是站点信息，第1行是列名，数据从第2行开始
        const headerRow = jsonData[1] as string[]; // 真正的列名在第2行
        const dataRows = jsonData.slice(2).filter(row => row.length > 0);

        // 智能匹配字段
        const fieldMapping = intelligentFieldMapping(headerRow);

        // 检查必填字段
        const missingCoreFields = CORE_FIELDS.filter(field => !fieldMapping[field]);
        if (missingCoreFields.length > 0) {
          console.warn('缺少核心字段:', missingCoreFields);
        }

        // 解析数据
        const result = parseDataRows(dataRows, headerRow, fieldMapping);

        resolve({
          orders: result.orders,
          fieldMapping,
          stats: {
            totalRows: dataRows.length,
            validRows: result.orders.length,
            errorRows: dataRows.length - result.orders.length,
          },
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}

// 智能匹配字段映射
function intelligentFieldMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const usedColumns = new Set<number>();

  // 首先精确匹配已知的字段名变体
  headers.forEach((header, index) => {
    const normalizedHeader = header.trim();

    for (const [field, variants] of Object.entries(FIELD_VARIANTS)) {
      if (variants.some(v => v === normalizedHeader || normalizedHeader.includes(v))) {
        if (!mapping[field]) {
          mapping[field] = normalizedHeader;
          usedColumns.add(index);
        }
        break;
      }
    }
  });

  // 处理电话字段的特殊逻辑：优先使用明确的电话字段
  const phoneColumnIndex = headers.findIndex(h =>
    h.includes('手机') || h.includes('电话') || h === 'phone' || h === 'tel'
  );
  if (phoneColumnIndex >= 0 && !mapping['subCardPhone']) {
    mapping['subCardPhone'] = headers[phoneColumnIndex];
    usedColumns.add(phoneColumnIndex);
  }

  // 处理车牌字段
  const plateColumnIndex = headers.findIndex(h =>
    h.includes('车牌') || h === 'plate' || h === 'car_plate'
  );
  if (plateColumnIndex >= 0 && !mapping['carPlate']) {
    mapping['carPlate'] = headers[plateColumnIndex];
    usedColumns.add(plateColumnIndex);
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

  // 建立列索引映射（Excel列名 -> 索引）
  const columnIndexMap: Record<string, number> = {};
  headers.forEach((header, index) => {
    columnIndexMap[header.trim()] = index;
  });

  // 建立系统字段 -> 列索引映射
  const fieldToColumnIndex: Record<string, number> = {};
  for (const [field, columnName] of Object.entries(fieldMapping)) {
    const index = columnIndexMap[columnName];
    if (index !== undefined) {
      fieldToColumnIndex[field] = index;
    }
  }

  dataRows.forEach((row, rowIndex) => {
    try {
      const order: any = {};

      // 解析必填字段
      for (const field of CORE_FIELDS) {
        const colIndex = fieldToColumnIndex[field];
        if (colIndex !== undefined) {
          let value = row[colIndex];

          // 类型转换
          if (NUMERIC_FIELDS.includes(field as any)) {
            value = parseFloat(value) || 0;
          } else if (DATE_FIELDS.includes(field as any)) {
            value = parseDateTime(value);
          }

          order[field] = value;
        }
      }

      // 解析可选字段
      for (const field of OPTIONAL_FIELDS) {
        const colIndex = fieldToColumnIndex[field];
        if (colIndex !== undefined) {
          let value = row[colIndex];

          if ((NUMERIC_FIELDS as readonly string[]).includes(field)) {
            value = parseFloat(value) || 0;
          }

          order[field] = value;
        }
      }

      // 解析日期字段（单独处理）
      const transactionTimeIndex = fieldToColumnIndex['transactionTime'];
      if (transactionTimeIndex !== undefined) {
        order.transactionTime = parseDateTime(row[transactionTimeIndex]);
      }

      // 计算小时字段
      if (order.transactionTime) {
        order.hour = new Date(order.transactionTime).getHours();
      }

      // 验证必填字段
      if (!order.orderId || !order.transactionTime) {
        errors.push(`行${rowIndex + 2}: 缺少必填字段`);
        return;
      }

      orders.push(order as Order);
    } catch (error) {
      errors.push(`行${rowIndex + 2}: 解析错误`);
    }
  });

  return { orders, errors };
}

// 解析日期时间
function parseDateTime(value: any): Date | undefined {
  if (!value) return undefined;

  if (value instanceof Date) return value;

  if (typeof value === 'number') {
    // Excel日期序列号
    return new Date((value - 25569) * 86400 * 1000);
  }

  if (typeof value === 'string') {
    const parsed = dayjs(value);
    if (parsed.isValid()) {
      return parsed.toDate();
    }
  }

  return undefined;
}

// 获取列信息（用于调试和展示）
export function getExcelColumnInfo(file: File): Promise<ExcelColumnInfo[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        const headers = jsonData[0] as string[];
        const dataRows = jsonData.slice(1, 6); // 只取前5行作为样本

        const columnInfo: ExcelColumnInfo[] = headers.map((header, index) => ({
          columnName: header,
          sampleValues: dataRows.map(row => row[index]).filter(v => v !== undefined && v !== ''),
          inferredField: Object.entries(FIELD_VARIANTS).find(([, variants]) =>
            variants.some(v => header.includes(v))
          )?.[0],
        }));

        resolve(columnInfo);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}

// 核心字段定义（导出供外部使用）
export { CORE_FIELDS, OPTIONAL_FIELDS };
