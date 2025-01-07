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
