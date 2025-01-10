CREATE TABLE customer_inputs (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_uuid VARCHAR(255) NOT NULL,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW(),

    name VARCHAR(255) NOT NULL,
    gender VARCHAR(50) NOT NULL,
    birth_date_time timestamptz NOT NULL,

    birth_city VARCHAR(255) NOT NULL,
    city_adcode VARCHAR(255) NOT NULL,
    city_address VARCHAR(255) NOT NULL,
    city_lat VARCHAR(255) NOT NULL,
    city_lng VARCHAR(255) NOT NULL,
    true_solar_time timestamptz NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    FOREIGN KEY (user_uuid) REFERENCES users(uuid)
);

CREATE TABLE customer_analysis (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4(),

    customer_id VARCHAR(255) UNIQUE NOT NULL,

    bazi_result TEXT NOT NULL,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW(),
    FOREIGN KEY (customer_id) REFERENCES customer_inputs(id)
);

-- 1. 首先添加新列，允许为空
ALTER TABLE customers 
ADD COLUMN birth_year INTEGER,
ADD COLUMN birth_month INTEGER,
ADD COLUMN birth_day INTEGER,
ADD COLUMN birth_hour INTEGER;

-- 2. 更新现有数据
UPDATE customers 
SET 
  birth_year = EXTRACT(YEAR FROM birth_date_time),
  birth_month = EXTRACT(MONTH FROM birth_date_time),
  birth_day = EXTRACT(DAY FROM birth_date_time),
  birth_hour = EXTRACT(HOUR FROM birth_date_time)
WHERE birth_date_time IS NOT NULL;

-- 3. 将新列设置为非空
ALTER TABLE customers 
ALTER COLUMN birth_year SET NOT NULL,
ALTER COLUMN birth_month SET NOT NULL,
ALTER COLUMN birth_day SET NOT NULL,
ALTER COLUMN birth_hour SET NOT NULL;

-- 4. 最后删除旧列
ALTER TABLE customers 
DROP COLUMN birth_date_time;

