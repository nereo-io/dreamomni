# 1. 主页架构 (luckbox.com):
- Title: "LuckBox - AI-Powered Eastern Wisdom for Life's Journey"
- Description: "Discover personalized insights for your career, love, fortune, and life path through the perfect blend of AI technology and traditional Eastern wisdom."

## 1.1 Career 频道 (luckbox.com/career):
- Title: "LuckBox Career - AI Career Reading & Professional Path Guidance"
- Description: "Make confident career moves with personalized predictions and guidance. Get insights about job changes, promotions, and business decisions based on Eastern wisdom and AI analysis."

主要功能页面：
- /career/reading (职业运势解读)
- /career/timing (择时工具)
- /career/compatibility (职业匹配度)
- /career/business (创业指南)

### 1.1.1 页面结构 (/career):
- Hero Section
  标题："Unlock Your Career Potential with Eastern Wisdom"
  副标题："AI-powered career guidance based on your personal birth chart"
  CTA："Get Your Career Reading"

- Value Proposition Section
  • Career Timing（知晓最佳时机）
  • Career Direction（明确发展方向）
  • Career Destiny（了解职业天赋）

- How It Works Section
  三步流程展示：
  1. Enter Your Details
  2. Get AI Analysis
  3. Receive Guidance

- Sample Insights Section
  展示报告样例和解读示例

- Testimonials Section（未来添加）

- FAQ Section
### 1.1.2 核心功能 (/career/reading):
Step 1: 基础信息
- 出生日期时间
- 性别
- 当前职业状态（选填）

Step 2: 职业困扰（多选）
- 职业方向迷茫
- 考虑跳槽
- 升职机会
- 创业时机
- 职场人际关系

Step 3: 具体问题（选填）
- 开放式问题输入
### 1.1.3 分析报告内容
免费版包含：
1. Career Element Analysis
   - 五行属性分析
   - 职业性格特点
   - 优势领域

2. Current Career Phase
   - 当前职业周期
   - 近期机遇与挑战
   - 基础建议

付费版添加：
3. Detailed Career Forecast
   - 12个月预测
   - 关键时间点提醒
   - 具体行动建议

4. Career Strategy Guide
   - 个性化职业规划
   - 技能提升建议
   - 人际关系策略

### 1.1.4 内容营销策略
A. 博客内容方向：
- Career Planning with Eastern Wisdom
- Best Timing for Job Change
- Understanding Your Career Elements
- Success Stories and Case Studies
B. 社交媒体内容：
- 每日职场建议
- 简短运势提醒
- 用户成功案例分享
- 东方智慧小贴士


## 1.2 Love 频道 (luckbox.com/love):
- Title: "LuckBox Love - Relationship Insights & Compatibility Reading"
- Description: "Understanding your relationships through Eastern astrology. Get personalized insights about love compatibility, relationship timing, and future romance prospects."

主要功能页面：
- /love/reading (感情运势)
- /love/compatibility (配对分析)
- /love/timing (桃花运时机)
- /love/marriage (婚姻预测)

## 1.3 Fortune 频道 (luckbox.com/fortune):
- Title: "LuckBox Fortune - Wealth & Prosperity Prediction"
- Description: "Unlock your wealth potential with personalized fortune readings. Get insights about financial opportunities, investment timing, and prosperity guidance."

主要功能页面：
- /fortune/reading (财运预测)
- /fortune/timing (财运时机)
- /fortune/investment (投资指南)
- /fortune/business (财商分析)

## 1.4 Life 频道 (luckbox.com/life):
- Title: "LuckBox Life - Personal Growth & Life Path Reading"
- Description: "Navigate life's journey with confidence. Get holistic guidance about personal development, life decisions, and future possibilities."

主要功能页面：
- /life/reading (人生解读)
- /life/decisions (重要决策)
- /life/potential (潜能发展)
- /life/harmony (生活平衡)

## 1.5 共享功能架构：
1. 每个频道都包含：
- 免费运势解读工具
- AI 互动咨询
- 深度分析报告
- 个性化建议

# 2. 付费层级
- Basic (免费):
  - 基础运势解读
  - 有限AI互动
  - 简单报告
- Pro ($19.99/月):
  - 深度解读
  - 无限AI咨询
  - 月度运势更新
  - 多领域分析
- 终极 ($49.99/月):
  - 全部Premium功能
  - 优先咨询权
  - 定制化报告
  - 关键时刻提醒


# 3. intruction

## 3.1 按照如下顺序顺序新建career/page.tsx页面

1. 基于线框图，调用components/block文件夹中的组件实现page.tsx，在app/[locale]/(default)/文件夹下新建对应的文件夹，并实现page.tsx
2. 因为要实现多语言，所以需要实现多语言的页面， 在app/i18n中新建文件夹，实现中文和英文的json文件。在 services/page.ts 中 实现getXXXPage 的的方法，在types/pages/xxxx.d.ts 中定义对应的接口


## 3.2 支付以及会员体系建设

1. 目前已经接入stripe，完成付费组件的设计，异同支付完成的回调逻辑。此部分已经已经实现。
- 价格表组件：components/blocks/pricing/index.tsx
- 支付下单接口：app/api/checkout/route.ts
- 支付回调逻辑：app/api/stripe-notify/route.ts

现在需要实现：
2. 现在需要在services/order.ts中实现支付逻辑，用户完成支付后，可以记录用户的订单信息，并更新用户的会员状态
3. 需要建立会员产品功能，用户完成月度订阅后，会员体系可以记录用户的会员有效时长。需要新建会员表，同时增加会员的产品逻辑
4. 会员的作用是1）用户可以无限次使用reading服务，在services/reading.ts中实现 2）用户可以无限次使用ai咨询的服务，非会员用户不能使用ai咨询，这个逻辑需要开发
5. 用户可以在个人中心app/mu-orders中查看自己的订单信息（目前已经实现），以及会员状态（需要实现）
