# Agent UI 重构技术文档

## 概述

将 Agent 页面从 3 个独立页面（列表/创建/详情）重构为单一左右布局页面，统一风格参考 image-to-video 工具页面。

## 设计原则

1. **布局统一**：与 `ai-video-generation-tool` 保持一致的左右布局
2. **组件复用**：复用 `video-generator` 和 `video-history` 的样式和交互模式
3. **极简设计**：移除不必要的层级（tabs、展开/收起），所有内容直接展示
4. **状态统一**：使用与 `StatusBadge` 一致的状态展示方式

## 架构对比

### 原架构（3 页面）
```
/agent
├── page.tsx              → Job 列表页
├── create/
│   └── page.tsx          → 创建页面
└── [id]/
    └── page.tsx          → 详情页面

components/blocks/agent/
├── AgentJobList.tsx      → 列表组件
├── AgentJobCard.tsx      → 卡片组件
├── AgentCreateForm.tsx   → 创建表单
├── AgentJobDetail.tsx    → 详情视图
├── AgentJobHeader.tsx    → 详情头部
├── AgentShotList.tsx     → 分镜列表
└── AgentShotCard.tsx     → 分镜卡片
```

### 新架构（单页面左右布局）
```
/agent
└── page.tsx              → 统一入口（左右布局）

components/blocks/agent/
├── AgentCreatePanel.tsx  → 左侧创建面板（新增）
├── AgentJobsList.tsx     → 右侧 Jobs 列表（新增）
├── AgentJobItem.tsx      → Job 卡片（新增，参考 VideoHistoryItem）
├── AgentAssetGrid.tsx    → Asset 网格组件（新增）
├── AssetModal.tsx        → Asset 弹窗（新增）
└── [保留但不使用]
    ├── AgentShotCard.tsx → 可能在 AssetGrid 中复用
    └── AgentJobSkeleton.tsx → 骨架屏组件
```

---

## 文件改动清单

### 一、删除的文件

#### 1. 页面文件
- ❌ `app/[locale]/(home)/agent/create/page.tsx`
  - 原因：创建功能合并到左侧面板
- ❌ `app/[locale]/(home)/agent/[id]/page.tsx`
  - 原因：详情视图合并到右侧列表

#### 2. 组件文件
- ❌ `components/blocks/agent/AgentJobList.tsx`
  - 替代：新的 `AgentJobsList.tsx`（完全重写）
- ❌ `components/blocks/agent/AgentJobCard.tsx`
  - 替代：新的 `AgentJobItem.tsx`（参考 VideoHistoryItem）
- ❌ `components/blocks/agent/AgentCreateForm.tsx`
  - 替代：新的 `AgentCreatePanel.tsx`
- ❌ `components/blocks/agent/AgentJobDetail.tsx`
  - 原因：详情功能合并到 JobItem 和 AssetModal
- ❌ `components/blocks/agent/AgentJobHeader.tsx`
  - 原因：头部信息合并到 JobItem
- ❌ `components/blocks/agent/AgentShotList.tsx`
  - 替代：新的 `AgentAssetGrid.tsx`

#### 3. 保留的组件
- ✅ `components/blocks/agent/AgentShotCard.tsx`
  - 用途：可能在 AssetGrid 中复用（待评估）
- ✅ `components/blocks/agent/AgentJobSkeleton.tsx`
  - 用途：加载骨架屏

---

### 二、修改的文件

#### 1. `app/[locale]/(home)/agent/page.tsx`
**修改内容**：
```tsx
// 原代码
export default function AgentJobsPage() {
  return (
    <div className="bg-gray-900 rounded-xl shadow-lg min-h-[600px]">
      <AgentJobList locale={locale} />
    </div>
  );
}

// 新代码
export default function AgentPage() {
  return (
    <div className="w-full mb-6 sm:mb-8 lg:mb-10 lg:h-[calc(100vh-120px)]">
      <div className="flex flex-col lg:flex-row gap-2 h-full">
        <AgentCreatePanel onJobCreated={() => {}} />
        <AgentJobsList locale={locale} />
      </div>
    </div>
  );
}
```

**关键改动**：
- 布局从单一容器改为左右分栏
- 使用与 `ai-video-generation-tool` 一致的 flex 布局
- 引入新的 `AgentCreatePanel` 和 `AgentJobsList`

---

### 三、新增的文件

#### 1. `components/blocks/agent/AgentCreatePanel.tsx`（已创建，需完善）

**功能**：左侧固定创建面板

**参考组件**：`components/blocks/video-generator/index.tsx`

**核心特性**：
- 固定宽度：`w-full lg:w-[420px]`
- 滚动内容区 + 底部固定按钮
- 积分余额和成本显示
- 表单字段：
  - 提示词输入（Textarea）
  - 参考图片上传（ImageUploader）
  - 时长选择（Select）
  - 模型选择（Keyframe + Video）

**需要完善的内容**：
```tsx
// 1. 集成 ImageUploader 组件
import { ImageUploader } from '@/components/blocks/video-generator/ImageUploader';

// 2. 使用 useCredits hook 获取积分余额
import useCredits from '@/hooks/useCredits';
const { leftCredits, updateLeftCredits } = useCredits();

// 3. 提交后通知父组件刷新列表
onJobCreated?.();
```

---

#### 2. `components/blocks/agent/AgentJobsList.tsx`（新建）

**功能**：右侧 Jobs 列表容器

**参考组件**：`components/blocks/video-history/index.tsx`

**核心特性**：
- 自动刷新机制（polling）
- 分页加载（可选）
- 空状态处理
- 骨架屏加载

**伪代码结构**：
```tsx
export function AgentJobsList({ locale, refreshTrigger }: Props) {
  const [jobs, setJobs] = useState<AgentJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 获取 jobs 列表
  const fetchJobs = useCallback(async () => {
    const response = await fetch('/api/agent/jobs');
    const data = await response.json();
    setJobs(data.jobs);
  }, []);

  // 轮询激活中的 jobs
  useEffect(() => {
    const interval = setInterval(() => {
      // 只刷新 processing 状态的 jobs
      const activeJobs = jobs.filter(j =>
        ['pending', 'splitting_shots', 'generating_keyframes'].includes(j.status)
      );
      if (activeJobs.length > 0) {
        fetchJobs();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [jobs]);

  return (
    <div className="flex-1 bg-gray-900 rounded-xl overflow-y-auto">
      {isLoading ? (
        <AgentJobSkeleton count={3} />
      ) : jobs.length === 0 ? (
        <EmptyState />
      ) : (
        jobs.map(job => (
          <AgentJobItem key={job.id} job={job} onDelete={handleDelete} />
        ))
      )}
    </div>
  );
}
```

---

#### 3. `components/blocks/agent/AgentJobItem.tsx`（新建）

**功能**：单个 Job 卡片（参考 VideoHistoryItem）

**参考组件**：`components/blocks/video-history/components/VideoHistoryItem.tsx`

**布局结构**：
```tsx
<div className="p-5 space-y-4">
  {/* Header: Status + Prompt + Timestamp */}
  <div className="flex justify-between items-start gap-3">
    <div className="flex items-start gap-3 flex-1">
      <StatusBadge status={job.status} />
      <p className="text-base font-bold text-white">{job.prompt}</p>
    </div>
    <span className="text-sm text-gray-400">{formatTimestamp()}</span>
  </div>

  {/* Metadata Tags */}
  <VideoMetadata
    aspectRatio="16:9"
    durationSeconds={job.duration_seconds}
    numShots={job.num_shots}
    modelName={job.video_model}
  />

  {/* Assets Grid */}
  <AgentAssetGrid
    shots={job.shots}
    finalVideoUrl={job.final_video_url}
    onAssetClick={handleAssetClick}
  />
</div>
```

**关键组件复用**：
- `StatusBadge`：从 `video-history/components/StatusBadge` 复用
- `VideoMetadata`：从 `video-history/components/VideoMetadata` 复用

**状态映射**：
```tsx
// Agent status → StatusBadge status
const statusMap = {
  'pending': 'submitted',
  'splitting_shots': 'processing',
  'generating_keyframes': 'processing',
  'orchestrating_videos': 'processing',
  'generating_videos': 'processing',
  'splicing': 'processing',
  'completed': 'completed',
  'failed': 'failed',
};
```

---

#### 4. `components/blocks/agent/AgentAssetGrid.tsx`（新建）

**功能**：Asset 网格展示（脚本、图片、视频）

**核心特性**：
- 统一的网格布局：`grid-cols-[auto-fill,minmax(140px,1fr)]`
- Asset 类型徽章（左上角）
- Asset 信息 overlay（底部）
- 点击打开 AssetModal

**Asset 类型定义**：
```tsx
type AssetType = 'script' | 'image' | 'video';

interface Asset {
  id: string;
  type: AssetType;
  url?: string;
  content?: string; // For script
  shotNumber?: number;
  duration?: number; // For video
}
```

**伪代码结构**：
```tsx
export function AgentAssetGrid({ shots, finalVideoUrl, onAssetClick }: Props) {
  const assets = useMemo(() => {
    const result: Asset[] = [];

    // 1. 脚本（如果有多个 shots，生成脚本内容）
    if (shots && shots.length > 0) {
      const scriptContent = shots
        .map((s, i) => `Shot ${i + 1} (${s.duration_seconds}s): ${s.prompt}`)
        .join('\n');
      result.push({
        id: 'script',
        type: 'script',
        content: scriptContent,
      });
    }

    // 2. 关键帧图片
    shots?.forEach(shot => {
      if (shot.keyframe_url) {
        result.push({
          id: `keyframe-${shot.id}`,
          type: 'image',
          url: shot.keyframe_url,
          shotNumber: shot.shot_number,
        });
      }
    });

    // 3. 分镜视频
    shots?.forEach(shot => {
      if (shot.video_url) {
        result.push({
          id: `video-${shot.id}`,
          type: 'video',
          url: shot.video_url,
          shotNumber: shot.shot_number,
          duration: shot.duration_seconds,
        });
      }
    });

    // 4. 最终视频
    if (finalVideoUrl) {
      result.push({
        id: 'final-video',
        type: 'video',
        url: finalVideoUrl,
      });
    }

    return result;
  }, [shots, finalVideoUrl]);

  return (
    <div className="grid grid-cols-[auto-fill,minmax(140px,1fr)] gap-3">
      {assets.map(asset => (
        <AssetCard
          key={asset.id}
          asset={asset}
          onClick={() => onAssetClick(asset)}
        />
      ))}
    </div>
  );
}
```

---

#### 5. `components/blocks/agent/AssetModal.tsx`（已创建，需完善）

**功能**：统一的 Asset 预览弹窗

**参考组件**：`components/ui/dialog`

**需要完善的内容**：
```tsx
// 1. 使用 Dialog 组件而不是自定义 modal
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';

// 2. 支持键盘导航（方向键切换同类型 assets）
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowLeft') {
    // 切换到上一个 asset
  } else if (e.key === 'ArrowRight') {
    // 切换到下一个 asset
  }
};

// 3. 添加复制和下载功能
const handleCopy = async () => {
  if (data.content) {
    await navigator.clipboard.writeText(data.content);
    toast.success('Copied to clipboard');
  }
};
```

---

### 四、API 路由（无需修改）

现有 API 路由已满足需求：
- ✅ `GET /api/agent/jobs` - 获取 jobs 列表（支持分页）
- ✅ `GET /api/agent/jobs/[id]` - 获取单个 job 详情（包含 shots）
- ✅ `POST /api/agent/jobs` - 创建新 job
- ✅ `DELETE /api/agent/jobs/[id]` - 删除 job
- ✅ `GET /api/agent/jobs/[id]/assets` - 获取 job 的 assets（如需要）

---

## 实现步骤

### Phase 1: 核心组件实现（优先级高）
1. ✅ 完善 `AgentCreatePanel.tsx`
   - 集成 ImageUploader
   - 集成 useCredits hook
   - 表单验证和提交逻辑
2. 🔲 创建 `AgentJobsList.tsx`
   - 数据获取和状态管理
   - 轮询机制
   - 空状态和骨架屏
3. 🔲 创建 `AgentJobItem.tsx`
   - 布局和样式（参考 VideoHistoryItem）
   - 状态映射和显示
   - Metadata 复用

### Phase 2: Asset 展示（优先级高）
4. 🔲 创建 `AgentAssetGrid.tsx`
   - Asset 数据聚合逻辑
   - 网格布局和样式
   - 类型徽章和 overlay
5. 🔲 完善 `AssetModal.tsx`
   - Dialog 组件集成
   - 键盘导航支持
   - 复制和下载功能

### Phase 3: 页面集成（优先级高）
6. 🔲 修改 `app/[locale]/(home)/agent/page.tsx`
   - 左右布局结构
   - 组件集成和数据流
   - 响应式适配

### Phase 4: 清理和优化（优先级中）
7. 🔲 删除旧文件
   - 删除 create 和 [id] 页面
   - 删除旧组件
8. 🔲 测试和优化
   - 功能测试
   - 性能优化（虚拟滚动等）
   - 响应式测试

---

## 风险评估

### 高风险
1. **数据流变化**：从 3 个页面合并为 1 个，需要确保状态管理正确
   - 缓解：使用 React Context 或 URL state 管理
2. **轮询性能**：多个 jobs 同时轮询可能影响性能
   - 缓解：只轮询激活状态的 jobs，设置合理的轮询间隔

### 中风险
1. **组件复用兼容性**：video-history 的组件是否完全适配 agent 场景
   - 缓解：先做小范围测试，确认兼容性
2. **路由跳转问题**：删除详情页后，可能有外部链接失效
   - 缓解：添加重定向规则

### 低风险
1. **样式一致性**：新组件样式与现有风格是否一致
   - 缓解：严格参考 video-generator 和 video-history

---

## 回滚计划

如果重构出现问题，可以通过以下方式回滚：

1. **Git 回滚**：
   ```bash
   git checkout <before-refactor-commit>
   ```

2. **保留旧文件**（临时）：
   - 在删除前，先将旧文件重命名为 `.backup`
   - 确认新版本稳定后再删除

---

## 测试检查清单

### 功能测试
- [ ] 左侧面板：创建 job 成功
- [ ] 左侧面板：表单验证正确
- [ ] 左侧面板：积分余额实时更新
- [ ] 右侧列表：job 列表正确显示
- [ ] 右侧列表：状态实时更新（轮询）
- [ ] 右侧列表：空状态展示
- [ ] Asset 网格：所有类型 asset 正确展示
- [ ] Asset 弹窗：图片/视频/脚本预览正常
- [ ] Asset 弹窗：复制和下载功能正常
- [ ] 删除 job 功能正常

### 样式测试
- [ ] 左侧面板宽度：420px（桌面端）
- [ ] 布局 gap：8px
- [ ] 状态徽章样式与 video-history 一致
- [ ] Asset 网格布局正确
- [ ] 响应式：移动端上下布局

### 性能测试
- [ ] 大量 jobs（50+）时滚动流畅
- [ ] 轮询不影响 UI 响应性
- [ ] Asset 图片懒加载生效

---

## 文档更新

需要同步更新以下文档：
1. `CLAUDE.md` - 更新 Agent 页面架构说明
2. `README.md` - 更新开发指南（如有）
3. API 文档 - 确认 API 路由使用说明正确

---

## 时间估算

- Phase 1 (核心组件): **4-6 小时**
- Phase 2 (Asset 展示): **3-4 小时**
- Phase 3 (页面集成): **2-3 小时**
- Phase 4 (清理优化): **2-3 小时**

**总计**: 11-16 小时

---

## 附录

### 参考组件映射表

| 新组件 | 参考组件 | 复用程度 |
|--------|----------|----------|
| AgentCreatePanel | video-generator/index.tsx | 结构和样式 |
| AgentJobsList | video-history/index.tsx | 数据获取逻辑 |
| AgentJobItem | video-history/VideoHistoryItem | 布局和样式 |
| AgentAssetGrid | - | 全新设计 |
| AssetModal | ui/dialog | UI 组件库 |

### 状态映射表

| Agent Status | Display Status | Badge Color |
|--------------|----------------|-------------|
| pending | Pending | Gray |
| splitting_shots | Processing | Blue |
| generating_keyframes | Processing | Blue |
| waiting_for_confirmation | Awaiting | Yellow |
| orchestrating_videos | Processing | Blue |
| generating_videos | Processing | Blue |
| splicing | Processing | Blue |
| completed | Completed | Green |
| failed | Failed | Red |

---

**文档版本**: 1.0
**创建时间**: 2025-01-13
**作者**: Claude Code
**审核状态**: 待审核
