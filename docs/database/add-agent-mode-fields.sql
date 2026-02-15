-- 多角度批量图片生成功能 - 数据库迁移脚本
-- Migration: Add Agent Mode Fields to image_generations table
-- Date: 2025-01-XX
-- Description: 为 image_generations 表添加 Agent 模式相关字段

-- 添加 is_agent_mode 字段 - 标识是否为 Agent 模式生成
ALTER TABLE image_generations
ADD COLUMN IF NOT EXISTS is_agent_mode BOOLEAN DEFAULT FALSE;

-- 添加 agent_image_count 字段 - Agent 模式生成的图片数量 (6, 9, 12)
ALTER TABLE image_generations
ADD COLUMN IF NOT EXISTS agent_image_count INTEGER DEFAULT NULL;

-- 添加 expanded_prompts 字段 - 扩展后的提示词数组
ALTER TABLE image_generations
ADD COLUMN IF NOT EXISTS expanded_prompts TEXT[] DEFAULT NULL;

-- 创建索引以优化 Agent 模式查询
CREATE INDEX IF NOT EXISTS idx_image_generations_is_agent_mode
ON image_generations (is_agent_mode)
WHERE is_agent_mode = TRUE;

-- 添加注释
COMMENT ON COLUMN image_generations.is_agent_mode IS 'Whether this is an Agent mode generation (multi-angle batch)';
COMMENT ON COLUMN image_generations.agent_image_count IS 'Number of images in Agent mode (6, 9, or 12)';
COMMENT ON COLUMN image_generations.expanded_prompts IS 'Array of expanded prompts for Agent mode';

-- 验证迁移结果
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'image_generations'
  AND column_name IN ('is_agent_mode', 'agent_image_count', 'expanded_prompts');
