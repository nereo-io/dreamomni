-- =====================================================
-- 图片生成积分消耗记录表
-- Image Generation Credits Usage Schema
-- =====================================================

-- 扩展现有的 credits 表，或创建专门的图片生成积分使用记录表

-- =====================================================
-- 方案一：扩展现有 credits 表
-- =====================================================

-- 为现有 credits 表添加图片生成相关字段
ALTER TABLE credits ADD COLUMN IF NOT EXISTS image_generation_id UUID REFERENCES image_generations(id);
ALTER TABLE credits ADD COLUMN IF NOT EXISTS generation_type TEXT; -- 'video', 'image', 'audio' etc.

-- 为新字段创建索引
CREATE INDEX IF NOT EXISTS idx_credits_image_generation_id ON credits(image_generation_id) 
    WHERE image_generation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_credits_generation_type ON credits(generation_type) 
    WHERE generation_type IS NOT NULL;

-- =====================================================
-- 方案二：创建专门的图片生成积分记录表
-- =====================================================

CREATE TABLE image_generation_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 关联信息
    user_uuid TEXT NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
    image_generation_id UUID NOT NULL REFERENCES image_generations(id) ON DELETE CASCADE,
    
    -- 积分信息
    credits_consumed INTEGER NOT NULL,          -- 消耗的积分数量
    credits_before INTEGER NOT NULL,            -- 消耗前的积分余额
    credits_after INTEGER NOT NULL,             -- 消耗后的积分余额
    
    -- 详细信息
    model_id TEXT NOT NULL,                     -- 使用的AI模型
    generation_mode image_generation_mode NOT NULL,  -- 生成模式
    generation_source image_generation_source NOT NULL,  -- 生成来源
    
    -- 定价信息
    base_cost INTEGER NOT NULL,                 -- 基础成本
    extra_cost INTEGER DEFAULT 0,               -- 额外成本 (高质量、特殊参数等)
    discount_applied INTEGER DEFAULT 0,         -- 应用的折扣
    final_cost INTEGER NOT NULL,                -- 最终成本
    
    -- 促销和优惠
    promotion_code TEXT,                        -- 促销代码
    membership_discount DECIMAL(5,4),           -- 会员折扣 (0.1000 = 10%)
    
    -- 扩展信息
    metadata JSONB,                            -- 额外元数据
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 索引优化
-- =====================================================

-- 基础索引
CREATE INDEX idx_image_generation_credits_user_uuid ON image_generation_credits(user_uuid);
CREATE INDEX idx_image_generation_credits_image_generation_id ON image_generation_credits(image_generation_id);
CREATE INDEX idx_image_generation_credits_created_at ON image_generation_credits(created_at DESC);

-- 复合索引
CREATE INDEX idx_image_generation_credits_user_date ON image_generation_credits(user_uuid, created_at DESC);
CREATE INDEX idx_image_generation_credits_model_mode ON image_generation_credits(model_id, generation_mode);

-- 统计索引
CREATE INDEX idx_image_generation_credits_model_stats ON image_generation_credits(model_id, credits_consumed);

-- =====================================================
-- 触发器：自动更新时间戳
-- =====================================================

CREATE OR REPLACE FUNCTION update_image_generation_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_image_generation_credits_updated_at
    BEFORE UPDATE ON image_generation_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_image_generation_credits_updated_at();

-- =====================================================
-- 触发器：确保积分余额一致性
-- =====================================================

CREATE OR REPLACE FUNCTION validate_image_generation_credits_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- 验证积分计算是否正确
    IF NEW.credits_before - NEW.credits_consumed != NEW.credits_after THEN
        RAISE EXCEPTION 'Credits balance calculation error: % - % != %', 
            NEW.credits_before, NEW.credits_consumed, NEW.credits_after;
    END IF;
    
    -- 验证最终成本计算
    IF NEW.base_cost + NEW.extra_cost - NEW.discount_applied != NEW.final_cost THEN
        RAISE EXCEPTION 'Final cost calculation error: % + % - % != %', 
            NEW.base_cost, NEW.extra_cost, NEW.discount_applied, NEW.final_cost;
    END IF;
    
    -- 确保消耗的积分等于最终成本
    IF NEW.credits_consumed != NEW.final_cost THEN
        RAISE EXCEPTION 'Credits consumed must equal final cost: % != %', 
            NEW.credits_consumed, NEW.final_cost;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_image_generation_credits_balance
    BEFORE INSERT OR UPDATE ON image_generation_credits
    FOR EACH ROW
    EXECUTE FUNCTION validate_image_generation_credits_balance();

-- =====================================================
-- 统计视图
-- =====================================================

-- 用户积分消耗统计
CREATE OR REPLACE VIEW user_image_credits_stats AS
SELECT 
    user_uuid,
    COUNT(*) as total_transactions,
    SUM(credits_consumed) as total_credits_consumed,
    AVG(credits_consumed) as avg_credits_per_generation,
    SUM(credits_consumed) FILTER (WHERE generation_mode = 'text-to-image') as text_to_image_credits,
    SUM(credits_consumed) FILTER (WHERE generation_mode = 'image-edit') as image_edit_credits,
    SUM(credits_consumed) FILTER (WHERE generation_mode = 'image-to-image') as image_to_image_credits,
    COUNT(*) FILTER (WHERE promotion_code IS NOT NULL) as promotions_used,
    SUM(discount_applied) as total_discounts_received,
    AVG(membership_discount) FILTER (WHERE membership_discount > 0) as avg_membership_discount,
    MAX(created_at) as last_usage_at,
    MIN(created_at) as first_usage_at
FROM image_generation_credits
GROUP BY user_uuid;

-- 模型积分消耗统计
CREATE OR REPLACE VIEW model_credits_stats AS
SELECT 
    model_id,
    generation_mode,
    COUNT(*) as usage_count,
    SUM(credits_consumed) as total_credits,
    AVG(credits_consumed) as avg_credits,
    MIN(credits_consumed) as min_credits,
    MAX(credits_consumed) as max_credits,
    COUNT(DISTINCT user_uuid) as unique_users,
    SUM(discount_applied) as total_discounts_given,
    AVG(membership_discount) FILTER (WHERE membership_discount > 0) as avg_membership_discount
FROM image_generation_credits
GROUP BY model_id, generation_mode
ORDER BY total_credits DESC;

-- 每日积分消耗统计
CREATE OR REPLACE VIEW daily_credits_consumption AS
SELECT 
    DATE(created_at) as consumption_date,
    COUNT(*) as total_transactions,
    SUM(credits_consumed) as total_credits_consumed,
    AVG(credits_consumed) as avg_credits_per_transaction,
    COUNT(DISTINCT user_uuid) as active_users,
    SUM(discount_applied) as total_discounts,
    COUNT(*) FILTER (WHERE promotion_code IS NOT NULL) as promotion_usage,
    generation_mode,
    generation_source
FROM image_generation_credits
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(created_at), generation_mode, generation_source
ORDER BY consumption_date DESC, total_credits_consumed DESC;

-- =====================================================
-- 积分消耗函数
-- =====================================================

-- 记录图片生成积分消耗
CREATE OR REPLACE FUNCTION record_image_generation_credit_usage(
    p_user_uuid TEXT,
    p_image_generation_id UUID,
    p_model_id TEXT,
    p_generation_mode image_generation_mode,
    p_generation_source image_generation_source,
    p_base_cost INTEGER,
    p_extra_cost INTEGER DEFAULT 0,
    p_discount_applied INTEGER DEFAULT 0,
    p_promotion_code TEXT DEFAULT NULL,
    p_membership_discount DECIMAL DEFAULT 0,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    current_credits INTEGER;
    final_cost INTEGER;
    new_credit_record_id UUID;
BEGIN
    -- 计算最终成本
    final_cost := p_base_cost + p_extra_cost - p_discount_applied;
    
    -- 获取用户当前积分
    SELECT COALESCE(SUM(credits), 0) INTO current_credits
    FROM credits 
    WHERE user_uuid = p_user_uuid 
      AND expired_at > NOW();
    
    -- 检查积分是否足够
    IF current_credits < final_cost THEN
        RAISE EXCEPTION 'Insufficient credits: has %, needs %', current_credits, final_cost;
    END IF;
    
    -- 记录积分消耗
    INSERT INTO image_generation_credits (
        user_uuid,
        image_generation_id,
        credits_consumed,
        credits_before,
        credits_after,
        model_id,
        generation_mode,
        generation_source,
        base_cost,
        extra_cost,
        discount_applied,
        final_cost,
        promotion_code,
        membership_discount,
        metadata
    ) VALUES (
        p_user_uuid,
        p_image_generation_id,
        final_cost,
        current_credits,
        current_credits - final_cost,
        p_model_id,
        p_generation_mode,
        p_generation_source,
        p_base_cost,
        p_extra_cost,
        p_discount_applied,
        final_cost,
        p_promotion_code,
        p_membership_discount,
        p_metadata
    ) RETURNING id INTO new_credit_record_id;
    
    -- 扣除积分 (插入负积分记录到 credits 表)
    INSERT INTO credits (
        user_uuid,
        amount,
        type,
        description,
        created_at
    ) VALUES (
        p_user_uuid,
        -final_cost,
        'usage',
        'Image generation with model ' || p_model_id,
        NOW()
    );
    
    RETURN new_credit_record_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 查询函数
-- =====================================================

-- 获取用户积分消耗历史
CREATE OR REPLACE FUNCTION get_user_image_credit_history(
    p_user_uuid TEXT,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    image_generation_id UUID,
    credits_consumed INTEGER,
    model_id TEXT,
    generation_mode image_generation_mode,
    promotion_code TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        igc.id,
        igc.image_generation_id,
        igc.credits_consumed,
        igc.model_id,
        igc.generation_mode,
        igc.promotion_code,
        igc.created_at
    FROM image_generation_credits igc
    WHERE igc.user_uuid = p_user_uuid
    ORDER BY igc.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 获取模型定价信息
CREATE OR REPLACE FUNCTION get_model_pricing_stats(
    p_model_id TEXT,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    generation_mode image_generation_mode,
    avg_base_cost DECIMAL,
    avg_extra_cost DECIMAL,
    avg_final_cost DECIMAL,
    usage_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        igc.generation_mode,
        AVG(igc.base_cost::DECIMAL),
        AVG(igc.extra_cost::DECIMAL),
        AVG(igc.final_cost::DECIMAL),
        COUNT(*)
    FROM image_generation_credits igc
    WHERE igc.model_id = p_model_id
      AND igc.created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY igc.generation_mode;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 权限设置
-- =====================================================

-- 启用行级安全
ALTER TABLE image_generation_credits ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的积分消耗记录
CREATE POLICY "Users can view own credit usage" ON image_generation_credits
    FOR SELECT USING (auth.uid()::text = user_uuid);

-- 用户只能插入自己的积分消耗记录
CREATE POLICY "Users can insert own credit usage" ON image_generation_credits
    FOR INSERT WITH CHECK (auth.uid()::text = user_uuid);

-- 用户不能直接更新或删除积分消耗记录 (只能通过函数)
-- 这样可以确保积分记录的完整性

-- =====================================================
-- 数据清理
-- =====================================================

-- 清理超过2年的积分消耗记录
CREATE OR REPLACE FUNCTION cleanup_old_credit_records()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM image_generation_credits 
    WHERE created_at < NOW() - INTERVAL '2 years';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
