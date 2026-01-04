-- ========================================
-- 音乐生成记录表
-- 版本: v2.0（优化版）
-- 日期: 2026-01-03
-- 优化: 基于Suno接口文档，与官方API保持一致
-- ========================================

CREATE TABLE IF NOT EXISTS music_generations (
  -- 主键
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 用户关联
  user_id TEXT NOT NULL,
  
  -- 提供商与模型
  provider VARCHAR(50) NOT NULL DEFAULT 'kieai',
  model_id VARCHAR(100) NOT NULL DEFAULT 'suno-v5',
  
  -- 任务标识（支持多提供商）
  provider_task_id VARCHAR(255),
  
  -- 生成类型与模式
  generation_type VARCHAR(50) NOT NULL DEFAULT 'direct',
  custom_mode BOOLEAN NOT NULL DEFAULT TRUE,
  instrumental BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- 用户输入（核心参数）
  prompt TEXT NOT NULL,
  title VARCHAR(500),
  style VARCHAR(1000),
  negative_tags VARCHAR(500),
  
  -- 音频输入（add-vocals/add-instrumental/upload-cover 模式使用）
  upload_audio_url TEXT,
  
  -- 高级参数（风格控制）
  vocal_gender VARCHAR(10),
  style_weight DECIMAL(3,2),
  weirdness_constraint DECIMAL(3,2),
  audio_weight DECIMAL(3,2),
  persona_id VARCHAR(255),
  
  -- 状态管理
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  
  -- 结果 URL（支持多提供商）
  audio_url_provider TEXT,
  audio_url_r2 TEXT,
  image_url TEXT,
  stream_audio_url TEXT,
  
  -- 生成结果详情
  generated_tags TEXT,
  duration_seconds DECIMAL(6,2),
  
  -- 错误处理
  error_message TEXT,
  error_code VARCHAR(50),
  retry_count INTEGER DEFAULT 0,
  
  -- 积分扣费记录
  credits_cost INTEGER NOT NULL DEFAULT 12,
  
  -- 扩展元数据（JSONB格式）
  metadata JSONB DEFAULT '{}',
  
  -- 审计字段
  is_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ========================================
-- 索引设计（优化查询性能）
-- ========================================

-- 基础索引
CREATE INDEX IF NOT EXISTS idx_music_generations_user_id ON music_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_music_generations_provider ON music_generations(provider);
CREATE INDEX IF NOT EXISTS idx_music_generations_model_id ON music_generations(model_id);
CREATE INDEX IF NOT EXISTS idx_music_generations_status ON music_generations(status);
CREATE INDEX IF NOT EXISTS idx_music_generations_provider_task_id ON music_generations(provider_task_id);
CREATE INDEX IF NOT EXISTS idx_music_generations_created_at ON music_generations(created_at DESC);

-- 组合索引：用户查询自己的历史记录（高频查询）
CREATE INDEX IF NOT EXISTS idx_music_generations_user_created 
ON music_generations(user_id, created_at DESC) 
WHERE is_delete = FALSE;

-- 组合索引：查询待处理任务（Webhook 回调、状态同步使用）
CREATE INDEX IF NOT EXISTS idx_music_generations_pending 
ON music_generations(provider, status, updated_at) 
WHERE status IN ('PENDING', 'TEXT_GENERATED', 'FIRST_TRACK_COMPLETED');

-- 组合索引：按生成类型查询（分析和统计使用）
CREATE INDEX IF NOT EXISTS idx_music_generations_type 
ON music_generations(generation_type, status, created_at DESC)
WHERE is_delete = FALSE;

-- ========================================
-- 字段注释
-- ========================================

COMMENT ON TABLE music_generations IS '音乐生成任务记录表（支持4种生成模式）';
COMMENT ON COLUMN music_generations.provider IS '音乐生成提供商（如 kieai）';
COMMENT ON COLUMN music_generations.model_id IS '模型ID（如 suno-v5，包含版本信息）';
COMMENT ON COLUMN music_generations.provider_task_id IS '提供商返回的任务ID（用于回调匹配）';
COMMENT ON COLUMN music_generations.generation_type IS '生成类型：direct/add-vocals/add-instrumental/upload-cover';
COMMENT ON COLUMN music_generations.custom_mode IS '是否启用自定义模式（true=详细参数，false=简化模式）';
COMMENT ON COLUMN music_generations.instrumental IS '是否生成纯音乐（false=Song，true=Instrumental）';
COMMENT ON COLUMN music_generations.prompt IS '统一输入字段：Song模式为歌词，Instrumental模式为音乐描述；Webhook回调不覆盖';
COMMENT ON COLUMN music_generations.upload_audio_url IS '用户上传的音频URL（add-vocals/add-instrumental/upload-cover模式）';
COMMENT ON COLUMN music_generations.audio_url_provider IS '提供商返回的音频URL（临时，14天有效）';
COMMENT ON COLUMN music_generations.audio_url_r2 IS 'R2永久存储的音频URL（优先使用）';
COMMENT ON COLUMN music_generations.metadata IS 'JSONB格式元数据，存储积分扣费、回调信息、提供商响应等';
