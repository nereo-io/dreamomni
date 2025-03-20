# BaZi AI 系统数据模型概览

本文档提供了 BaZi AI 系统中所有数据模型的概述，帮助你理解数据结构和关系。

## 数据库连接

- **db.ts**: 提供 Supabase 客户端连接实例，所有其他模型通过它访问数据库。

## 核心用户模型

### 用户管理

- **user.ts**: 用户账户管理
  - 创建用户、查找用户（通过邮箱或 UUID）
  - 获取用户列表和用户 Stripe 客户 ID

### 会员与订阅

- **membership.ts**: 用户会员资格管理
  - 查询活跃会员
  - 创建和更新会员记录
  - 获取会员历史记录
  - 检查并更新会员状态（过期处理）

### 订单与支付

- **order.ts**: 处理用户支付和订单
  - 创建订单
  - 查询、更新订单状态
  - 管理订阅相关信息
  - 获取付费订单列表

### 积分系统

- **credit.ts**: 管理用户积分
  - 创建积分记录
  - 查询用户有效积分
  - 获取积分记录

### API 密钥

- **apikey.ts**: 管理 API 访问密钥
  - 创建 API 密钥
  - 获取用户 API 密钥列表
  - 通过 API 密钥查找用户

## 内容与交互模型

### 客户信息

- **customer.ts**: 管理用户的个人信息与八字分析
  - 创建/更新客户基本信息
  - 创建客户问题记录
  - 获取八字分析所需的信息
  - 保存和获取八字分析结果

### 阅读记录

- **reading.ts**: 跟踪用户每日阅读次数
  - 获取用户当日阅读次数
  - 更新阅读计数

### 聊天系统

- **chat.ts**: 管理聊天会话和消息
  - 创建聊天会话
  - 获取会话列表和详情
  - 创建和更新聊天消息
  - 更新会话状态

### 内容发布

- **post.ts**: 管理博客文章等内容
  - 创建和更新文章
  - 通过 UUID 或 slug 查找文章
  - 获取文章列表

### 问答系统

- **question.ts**: 管理问答内容
  - 创建、查询、更新和删除问题
  - 获取相关问题
  - 获取问题详情
  - 问题评分

## 统计与分析

- **statistics.ts**: 提供系统统计数据
  - 用户统计（总数、今日新增、昨日新增）
  - 客户信息统计
  - 聊天会话统计
  - 聊天消息统计
  - 会员统计（包括活跃会员）
  - 目标追踪统计

## 数据表之间的关系

1. **用户核心关系**:

   - `users` -> `memberships`: 一对多，一个用户可以有多个会员记录
   - `users` -> `orders`: 一对多，一个用户可以有多个订单
   - `users` -> `credits`: 一对多，一个用户可以有多个积分记录
   - `users` -> `apikeys`: 一对多，一个用户可以有多个 API 密钥

2. **内容与用户关系**:

   - `users` -> `customer_info`: 一对多，一个用户可以有多个客户信息记录
   - `users` -> `chat_sessions`: 一对多，一个用户可以有多个聊天会话
   - `chat_sessions` -> `chat_messages`: 一对多，一个会话可以有多个消息
   - `users` -> `reading_records`: 一对多，一个用户可以有多个阅读记录

3. **分析与问答关系**:
   - `customer_info` -> `customer_inputs`: 一对多，客户信息可以关联多个问题输入
   - `customer_inputs` -> `customer_analysis`: 一对一，一个问题输入对应一个分析结果
   - `posts` (type=question) -> 相关问题: 多对多关系

## 使用示例

### 查询活跃会员

```typescript
const activeMembership = await findActiveMembershipByUserUuid(userUuid);
```

### 创建订单

```typescript
const order = {
  order_no: generateOrderNo(),
  user_uuid: userUuid,
  amount: 299,
  currency: "USD",
  status: OrderStatus.Created,
};
await insertOrder(order);
```

### 获取统计数据

```typescript
const userStats = await getUserStatistics();
const membershipStats = await getMembershipStatistics();
```

### 获取用户的聊天会话

```typescript
const chatSessions = await getChatSessionsByUserId(userUuid);
```

## 数据表字段参考

每个主要数据表包含以下核心字段:

1. `users`: uuid, email, created_at, updated_at
2. `memberships`: user_uuid, status, plan_type, start_date, end_date
3. `orders`: order_no, user_uuid, amount, currency, status, paid_at
4. `customer_info`: user_uuid, gender, birth_year, birth_month, birth_day, birth_hour
5. `chat_sessions`: uuid, user_uuid, title, status
6. `chat_messages`: session_id, role, content, created_at
7. `posts`: uuid, title, content, type, status, locale, slug
8. `reading_records`: user_uuid, read_date, count
