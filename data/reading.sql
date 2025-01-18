CREATE TABLE reading_records (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_uuid VARCHAR(255) NOT NULL,
    read_date DATE NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW(),
    FOREIGN KEY (user_uuid) REFERENCES users(uuid)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_reading_records_user_date ON reading_records(user_uuid, read_date);

-- 添加唯一约束,确保每个用户每天只有一条记录
ALTER TABLE reading_records ADD CONSTRAINT uniq_user_date UNIQUE (user_uuid, read_date); 