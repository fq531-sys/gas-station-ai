// 加油站AI智能营销官 - 后端服务
// 使用 LeanCloud 作为后端存储

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

// 引入 LeanCloud SDK
const AV = require('leanengine');

// 初始化 LeanCloud
// 请替换为您的 LeanCloud AppID 和 AppKey
// 注册地址: https://leancloud.cn
const APP_ID = process.env.LEANCLOUD_APP_ID || 'your-app-id';
const APP_KEY = process.env.LEANCLOUD_APP_KEY || 'your-app-key';
const MASTER_KEY = process.env.LEANCLOUD_MASTER_KEY || 'your-master-key';

AV.init({
  appId: APP_ID,
  appKey: APP_KEY,
  masterKey: MASTER_KEY
});

const app = express();

// 中间件
app.use(cors());
app.use(bodyParser.json());

// JWT密钥（生产环境请使用复杂密钥）
const JWT_SECRET = process.env.JWT_SECRET || 'gas-station-ai-secret-key-2024';

// 模拟短信验证码发送（生产环境需要接入真实短信服务）
const smsCodes = new Map(); // phone -> { code, expires }

// 生成6位验证码
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ==================== API 接口 ====================

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 发送验证码
app.post('/api/auth/send-code', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: '手机号格式不正确' });
    }

    const code = generateCode();
    const expires = Date.now() + 5 * 60 * 1000; // 5分钟有效期

    // 存储验证码
    smsCodes.set(phone, { code, expires });

    // TODO: 生产环境调用真实短信服务
    // 这里先打印验证码，实际发送短信
    console.log(`[SMS] 向 ${phone} 发送验证码: ${code}`);

    // 模拟发送成功
    res.json({
      success: true,
      message: '验证码已发送',
      // 开发环境下返回验证码方便测试
      devCode: code
    });
  } catch (error) {
    console.error('发送验证码失败:', error);
    res.status(500).json({ error: '发送失败，请稍后重试' });
  }
});

// 验证验证码并登录/注册
app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ error: '手机号和验证码不能为空' });
    }

    // 验证验证码
    const stored = smsCodes.get(phone);
    if (!stored || stored.code !== code || Date.now() > stored.expires) {
      return res.status(401).json({ error: '验证码错误或已过期' });
    }

    // 清除已使用的验证码
    smsCodes.delete(phone);

    // 查询或创建用户
    const query = new AV.Query('User');
    query.equalTo('phone', phone);
    let user = await query.first();

    if (!user) {
      // 创建新用户
      const User = AV.Object.extend('User');
      user = new User();
      user.set('phone', phone);
      user.set('memberLevel', 'free'); // 默认免费会员
      user.set('createdAt', new Date());
      user.set('expireAt', null); // 免费会员无过期时间
      await user.save();
    }

    // 生成JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        phone: user.get('phone'),
        memberLevel: user.get('memberLevel')
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.get('phone'),
        memberLevel: user.get('memberLevel'),
        expireAt: user.get('expireAt'),
        createdAt: user.get('createdAt')
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

// 获取用户信息
app.get('/api/user/info', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const User = AV.Object.createWithoutData('User', decoded.userId);
    const user = await User.fetch();

    res.json({
      success: true,
      user: {
        id: user.id,
        phone: user.get('phone'),
        memberLevel: user.get('memberLevel'),
        expireAt: user.get('expireAt'),
        createdAt: user.get('createdAt')
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(401).json({ error: '登录已过期，请重新登录' });
  }
});

// 检查会员权限
app.post('/api/user/check-permission', async (req, res) => {
  try {
    const { feature } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: '未登录', hasPermission: false });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const memberLevel = decoded.memberLevel;

    // 权限配置
    const permissions = {
      free: ['basic_analysis', 'base_customer_export'],
      primary: ['basic_analysis', 'base_customer_export', 'churn_export', 'financial_risk_export'],
      advanced: ['basic_analysis', 'base_customer_export', 'churn_export', 'financial_risk_export', 'ai_insights', 'auto_recall'],
      ultimate: ['basic_analysis', 'base_customer_export', 'churn_export', 'financial_risk_export', 'ai_insights', 'auto_recall', 'priority_support', 'custom_report']
    };

    const hasPermission = permissions[memberLevel]?.includes(feature) || false;

    res.json({
      success: true,
      hasPermission,
      memberLevel,
      feature
    });
  } catch (error) {
    console.error('检查权限失败:', error);
    res.status(500).json({ error: '检查失败' });
  }
});

// 升级会员（模拟支付回调）
app.post('/api/user/upgrade', async (req, res) => {
  try {
    const { level, months } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // TODO: 生产环境需要接入微信支付，验证支付结果
    // 这里简化处理，直接升级会员

    const User = AV.Object.createWithoutData('User', decoded.userId);
    const user = await User.fetch();

    user.set('memberLevel', level);

    // 计算过期时间
    const now = new Date();
    const currentExpire = user.get('expireAt');
    let expireAt = currentExpire && currentExpire > now ? currentExpire : now;

    // 添加月份
    expireAt.setMonth(expireAt.getMonth() + months);

    user.set('expireAt', expireAt);
    await user.save();

    // 生成新token
    const newToken = jwt.sign(
      {
        userId: user.id,
        phone: user.get('phone'),
        memberLevel: level
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: '升级成功',
      token: newToken,
      user: {
        id: user.id,
        phone: user.get('phone'),
        memberLevel: level,
        expireAt: expireAt
      }
    });
  } catch (error) {
    console.error('升级失败:', error);
    res.status(500).json({ error: '升级失败，请稍后重试' });
  }
});

// 保存用户数据
app.post('/api/data/save', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { dataType, data } = req.body;

    // 保存数据到 LeanCloud
    const DataRecord = AV.Object.extend('DataRecord');
    const record = new DataRecord();
    record.set('userId', decoded.userId);
    record.set('dataType', dataType); // 'orders', 'customers', 'reports'等
    record.set('data', data);
    record.set('updatedAt', new Date());

    await record.save();

    res.json({ success: true, message: '保存成功' });
  } catch (error) {
    console.error('保存数据失败:', error);
    res.status(500).json({ error: '保存失败' });
  }
});

// 获取用户数据列表
app.get('/api/data/list', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { dataType } = req.query;

    const query = new AV.Query('DataRecord');
    query.equalTo('userId', decoded.userId);
    if (dataType) {
      query.equalTo('dataType', dataType);
    }
    query.descending('updatedAt');
    query.limit(50);

    const records = await query.find();

    res.json({
      success: true,
      records: records.map(r => ({
        id: r.id,
        dataType: r.get('dataType'),
        updatedAt: r.get('updatedAt'),
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    console.error('获取数据列表失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

// 获取指定数据
app.get('/api/data/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { id } = req.params;

    const DataRecord = AV.Object.createWithoutData('DataRecord', id);
    const record = await DataRecord.fetch();

    // 检查权限
    if (record.get('userId') !== decoded.userId) {
      return res.status(403).json({ error: '无权访问' });
    }

    res.json({
      success: true,
      record: {
        id: record.id,
        dataType: record.get('dataType'),
        data: record.get('data'),
        updatedAt: record.get('updatedAt')
      }
    });
  } catch (error) {
    console.error('获取数据失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: '服务器错误' });
});

// 启动服务器
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 加油站AI智能营销官后端服务已启动`);
  console.log(`📡 端口: ${PORT}`);
  console.log(`📋 API文档:`);
  console.log(`   - GET  /api/health        - 健康检查`);
  console.log(`   - POST /api/auth/send-code - 发送验证码`);
  console.log(`   - POST /api/auth/login     - 登录/注册`);
  console.log(`   - GET  /api/user/info      - 获取用户信息`);
  console.log(`   - POST /api/user/upgrade   - 升级会员`);
  console.log(`   - POST /api/data/save       - 保存数据`);
  console.log(`   - GET  /api/data/list       - 获取数据列表`);

  if (APP_ID === 'your-app-id') {
    console.log('\n⚠️  警告: 请设置 LEANCLOUD_APP_ID 和 LEANCLOUD_APP_KEY 环境变量');
    console.log('   注册地址: https://leancloud.cn');
  }
});

module.exports = app;