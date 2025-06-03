# veo3 AI 数据分析报表页面需求文档

## 📋 项目概述

本文档定义了 veo3 AI 平台数据分析报表页面的需求。该页面将为管理员提供全面的业务数据分析视图，帮助了解平台的运营状况和用户行为。

## 🎯 核心目标

1. **业务监控**：实时监控视频生成业务的核心指标
2. **用户洞察**：深入了解用户行为和增长趋势
3. **商业分析**：跟踪收入、转化率等商业指标
4. **运营决策**：为产品和运营决策提供数据支持

## 🔍 现有代码分析

### 需要移除的旧业务数据

- ❌ 客户信息统计（`customer_info`表）- 聊天 AI 项目遗留
- ❌ 聊天会话统计（`chat_sessions`表）- 聊天 AI 项目遗留
- ❌ 聊天消息统计（`chat_messages`表）- 聊天 AI 项目遗留

### 保留并优化的数据

- ✅ 用户统计（`users`表）- 核心用户数据
- ✅ 会员统计（`memberships`表）- 付费用户数据
- ✅ 目标追踪统计 - KPI 监控
- ✅ 订单统计（`orders`表）- 商业数据

### 新增核心业务数据

- 🆕 视频生成统计（`video_generations`表）- veo3 AI 核心业务

## 📊 详细需求规格

### 1. 目标追踪板块

#### 1.1 时间进度指示器

- **当前月份进度条**：显示本月已过天数占比
- **剩余天数倒计时**：距离月底剩余天数
- **UTC 时间显示**：当前 UTC 时间和日期

#### 1.2 KPI 追踪

```typescript
interface TargetMetrics {
  // 用户目标
  monthlyUserTarget: number; // 月度新增用户目标
  currentMonthUsers: number; // 本月实际新增用户
  userTargetProgress: number; // 用户目标完成率 (%)

  // 付费用户目标
  monthlyPaidUserTarget: number; // 月度新增付费用户目标
  currentMonthPaidUsers: number; // 本月实际新增付费用户
  paidUserTargetProgress: number; // 付费用户目标完成率 (%)
}
```

### 2. 用户数据板块

#### 2.1 基础用户指标

```typescript
interface UserStatistics {
  // 累计数据
  totalUsers: number; // 总注册用户数

  // 时间维度统计
  todayNewUsers: number; // 今日新增用户
  yesterdayNewUsers: number; // 昨日新增用户
  thisWeekNewUsers: number; // 本周新增用户
  thisMonthNewUsers: number; // 本月新增用户

  // 趋势数据
  userGrowthTrend: DailyGrowthData[]; // 7天/30天增长趋势
}

interface DailyGrowthData {
  date: string;
  newUsers: number;
}
```

### 3. 视频生成数据板块（核心业务）

#### 3.1 基础生成指标

```typescript
interface VideoGenerationStatistics {
  // 累计数据
  totalGenerations: number; // 累计视频生成总数

  // 时间维度统计
  todayGenerations: number; // 今日生成数
  yesterdayGenerations: number; // 昨日生成数
  thisWeekGenerations: number; // 本周生成数
  thisMonthGenerations: number; // 本月生成数

  // 状态分布
  todaySuccessful: number; // 今日成功生成数
  todayFailed: number; // 今日失败数
  todayPending: number; // 今日等待/处理中数

  // 成功率指标
  overallSuccessRate: number; // 总体成功率
  todaySuccessRate: number; // 今日成功率
  weeklySuccessRate: number; // 本周成功率

  // 趋势数据
  generationTrend: DailyGenerationData[]; // 生成趋势
}

interface DailyGenerationData {
  date: string;
  total: number;
  successful: number;
  failed: number;
  pending: number;
  successRate: number;
}
```

#### 3.2 模型使用分析

```typescript
interface ModelUsageStatistics {
  modelName: string; // 模型名称
  totalUsage: number; // 总使用次数
  todayUsage: number; // 今日使用次数
  successCount: number; // 成功次数
  failureCount: number; // 失败次数
  successRate: number; // 成功率
  avgProcessingTime: number; // 平均处理时间(秒)
  usagePercentage: number; // 使用占比
}
```

#### 3.3 视频生成状态定义

- **PENDING**: 等待处理
- **IN_QUEUE**: 队列中
- **IN_PROGRESS**: 处理中
- **COMPLETED**: 生成完成
- **FAILED**: 生成失败
- **SAVED_TO_R2**: 已保存到存储

### 4. 订单数据板块

#### 4.1 订单统计指标

```typescript
interface OrderStatistics {
  // 订单数量统计
  totalOrders: number; // 累计订单数
  todayOrders: number; // 今日新增订单
  yesterdayOrders: number; // 昨日新增订单
  thisMonthOrders: number; // 本月新增订单

  // 支付成功统计
  totalPaidOrders: number; // 累计支付成功订单
  todayPaidOrders: number; // 今日支付成功订单
  yesterdayPaidOrders: number; // 昨日支付成功订单
  thisMonthPaidOrders: number; // 本月支付成功订单

  // 转化率指标
  overallConversionRate: number; // 总体转化率
  todayConversionRate: number; // 今日转化率
  monthlyConversionRate: number; // 本月转化率

  // 趋势数据
  orderTrend: DailyOrderData[]; // 订单趋势
}

interface DailyOrderData {
  date: string;
  orders: number;
  paidOrders: number;
  conversionRate: number;
}
```

### 5. 会员数据板块

#### 5.1 会员统计指标

```typescript
interface MembershipStatistics {
  // 基础统计
  totalMemberships: number; // 累计会员数
  activeMemberships: number; // 当前活跃会员数
  expiredMemberships: number; // 已过期会员数

  // 时间维度统计
  todayNewMemberships: number; // 今日新增会员
  yesterdayNewMemberships: number; // 昨日新增会员
  thisMonthNewMemberships: number; // 本月新增会员
  // 趋势数据
  membershipTrend: DailyMembershipData[]; // 会员趋势
}

interface DailyMembershipData {
  date: string;
  newMemberships: number;
  activeMemberships: number;
  churnCount: number;
}
```

## 🎨 UI/UX 设计要求

### 1. 页面布局结构

```
┌─────────────────────────────────────────────────────────────┐
│ 页面标题 + UTC时间显示                                         │
├─────────────────────────────────────────────────────────────┤
│ 目标追踪看板 (TargetBoard)                                    │
│ - 月度进度 | 用户目标进度 | 付费用户目标进度 | 收入目标进度      │
├─────────────────────────────────────────────────────────────┤
│ 数据概览卡片区域                                              │
│ ┌─────────┬─────────┬─────────┐                              │
│ │用户总数  │日活用户  │新增用户  │ 用户数据行                   │
│ ├─────────┼─────────┼─────────┼─────────┐                    │
│ │视频总数  │今日生成  │成功率   │处理中数  │ 视频生成数据行        │
│ ├─────────┼─────────┼─────────┼─────────┤                    │
│ │订单总数  │支付成功  │转化率   │今日收入  │ 订单数据行           │
│ ├─────────┼─────────┼─────────┼─────────┤                    │
│ │会员总数  │活跃会员  │新增会员  │续费率   │ 会员数据行           │
│ └─────────┴─────────┴─────────┴─────────┘                    │
├─────────────────────────────────────────────────────────────┤
│ 详细图表分析区域                                              │
│ ┌─────────────────┬─────────────────┐                        │
│ │用户增长趋势图    │视频生成趋势图    │                        │
│ ├─────────────────┼─────────────────┤                        │
│ │订单转化漏斗图    │模型使用分布图    │                        │
│ └─────────────────┴─────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### 2. 视觉设计原则

- **信息层次清晰**：重要指标突出显示
- **色彩语义化**：成功(绿色)、警告(黄色)、错误(红色)
- **响应式设计**：适配桌面和移动设备
- **加载状态**：数据加载时显示骨架屏
- **交互反馈**：hover 状态和点击反馈

### 3. 数据展示规范

- **数字格式化**：大数字使用千分位分隔符
- **百分比显示**：保留 1 位小数
- **时间格式**：统一使用 YYYY-MM-DD HH:mm:ss 格式
- **货币格式**：USD $X,XXX.XX 格式
- **趋势指示**：使用箭头和颜色表示涨跌

## 🔧 技术实现方案

### 1. 数据模型层重构

#### 1.1 新增统计函数

```typescript
// models/statistics.ts

// 视频生成统计
export async function getVideoGenerationStatistics(): Promise<VideoGenerationStatistics>;
export async function getVideoGenerationByModel(): Promise<
  ModelUsageStatistics[]
>;
export async function getVideoGenerationTrend(
  days: number
): Promise<DailyGenerationData[]>;

// 用户活跃度统计
export async function getUserActivityStatistics(): Promise<UserStatistics>;
export async function getUserGrowthTrend(
  days: number
): Promise<DailyGrowthData[]>;

// 订单详细统计
export async function getOrderStatistics(): Promise<OrderStatistics>;
export async function getProductSalesStatistics(): Promise<
  ProductSalesStatistics[]
>;
export async function getOrderTrend(days: number): Promise<DailyOrderData[]>;

// 会员详细统计
export async function getMembershipDetailedStatistics(): Promise<MembershipStatistics>;
export async function getMembershipTrend(
  days: number
): Promise<DailyMembershipData[]>;

// 目标追踪统计 (增强现有函数)
export async function getTargetMetrics(): Promise<TargetMetrics>;
```

#### 1.2 删除旧函数

```typescript
// 需要移除的函数
-getCustomerInfoStatistics() -
  getChatSessionStatistics() -
  getChatMessageStatistics();
```

### 2. 组件开发计划

#### 2.1 新增统计卡片组件

```typescript
// components/dashboard/stats-cards/
-VideoGenerationStatsCard.tsx - // 视频生成统计卡片
  OrderStatsCard.tsx - // 订单统计卡片
  UserActivityCard.tsx - // 用户活跃度卡片
  MembershipStatsCard.tsx; // 会员统计卡片
```

#### 2.2 图表组件开发

```typescript
// components/dashboard/charts/
-TrendChart.tsx - // 趋势折线图
  ModelDistributionChart.tsx - // 模型使用分布饼图
  ConversionFunnelChart.tsx - // 转化漏斗图
  ProgressRing.tsx; // 进度环形图
```

#### 2.3 增强现有组件

```typescript
// 优化现有组件
-StatsCard.tsx - // 支持更多数据类型和样式
  TargetBoard.tsx; // 增加收入目标追踪
```

### 3. 数据库查询优化

#### 3.1 建议添加的索引

```sql
-- 视频生成表索引
CREATE INDEX idx_video_generations_user_id_created_at ON video_generations(user_id, created_at);
CREATE INDEX idx_video_generations_status_created_at ON video_generations(status, created_at);
CREATE INDEX idx_video_generations_model_id_created_at ON video_generations(model_id, created_at);

-- 用户表索引
CREATE INDEX idx_users_created_at ON users(created_at);

-- 订单表索引
CREATE INDEX idx_orders_status_created_at ON orders(status, created_at);
CREATE INDEX idx_orders_product_id_created_at ON orders(product_id, created_at);

-- 会员表索引
CREATE INDEX idx_memberships_status_created_at ON memberships(status, created_at);
```

#### 3.2 查询性能考虑

- 使用 UTC 时间进行所有时间相关查询
- 实现查询结果缓存机制（Redis）
- 对于大数据量查询，考虑分页和限制
- 使用 `count` 查询时启用 `exact` 模式

## 📝 总结

本需求文档为 veo3 AI 数据统计报表页面提供了完整的规格说明，涵盖了从业务需求到技术实现的各个方面。通过实施此方案，将为 veo3 AI 平台提供强大的数据分析能力，支持精细化运营和数据驱动的决策制定。

---

## 🔄 实施进度

### ✅ 已完成 (阶段一：数据模型层)

- [x] 创建 TypeScript 类型定义 (`types/statistics.ts`)
- [x] 重构统计模型文件 (`models/statistics.ts`)
  - [x] 移除旧业务统计函数 (客户信息、聊天会话、聊天消息)
  - [x] 增强用户统计功能 (增加周、月维度)
  - [x] 新增视频生成统计功能 (核心业务)
  - [x] 新增订单统计功能 (商业数据)
  - [x] 增强会员统计功能 (详细状态)
  - [x] 增强目标追踪功能 (完成率计算)
  - [x] 新增模型使用统计功能
- [x] 添加趋势数据获取函数
- [x] 优化数据库查询性能
- [x] 添加错误处理和异常捕获

### ✅ 已完成 (阶段二：组件开发)

- [x] 创建增强版统计卡片组件 (`EnhancedStatsCard`)
- [x] 创建视频生成专用卡片组件 (`VideoGenerationStatsCard`)
- [x] 创建增强版目标追踪组件 (`EnhancedTargetBoard`)
- [x] 创建模型使用统计图表组件 (`ModelUsageChart`)

### ✅ 已完成 (阶段三：页面重构)

- [x] 重构主数据统计页面 (`app/[locale]/(admin)/admin/data/page.tsx`)
  - [x] 移除旧的聊天 AI 统计展示
  - [x] 集成新的视频生成业务统计
  - [x] 实现并行数据获取优化
  - [x] 添加详细数据分析区域
  - [x] 添加性能指标概览
- [x] 创建统计数据 API 路由 (`app/api/admin/statistics/route.ts`)
- [x] 实现用户身份验证
- [x] 支持分类数据获取

### 🔄 进行中 (阶段四：优化和测试)

- [ ] 性能测试和优化
- [ ] 错误边界组件添加
- [ ] 响应式设计验证
- [ ] 数据准确性验证

### 📋 待完成 (阶段五：增强功能)

- [ ] 实时数据刷新机制
- [ ] 数据导出功能
- [ ] 自定义时间范围筛选
- [ ] 数据缓存优化
- [ ] 移动端适配优化

### 🎯 核心成果

1. **业务转型完成**：成功从聊天 AI 统计转换为视频生成业务统计
2. **数据完整性**：覆盖用户、视频、订单、会员、目标追踪五大核心板块
3. **技术架构升级**：TypeScript 类型安全、组件化设计、性能优化
4. **用户体验提升**：现代化 UI 设计、直观的数据展示、智能趋势分析

### 🔍 技术亮点

- **并行数据处理**：使用 `Promise.all` 优化数据获取性能
- **智能成功率计算**：基于视频生成状态的多维度成功率分析
- **模型使用洞察**：提供模型性能对比和使用建议
- **目标完成预测**：基于时间进度的目标达成情况预测
- **趋势数据可视化**：7 天历史数据展示，支持快速趋势识别

该实施已完成核心功能开发，为 veo3 AI 平台提供了专业的数据分析能力，支持产品和运营决策。
