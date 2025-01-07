export interface CustomerInput {
  id?: string;                    // UUID
  user_uuid: string;             // 关联的用户UUID
  created_at?: string;           // 创建时间
  updated_at?: string;           // 更新时间
  
  // 个人信息
  name: string;                  // 姓名
  gender: string;                // 性别
  birth_date_time: string;       // 出生时间
  
  // 地理信息
  birth_city: string;            // 出生城市
  city_adcode: string;          // 城市编码
  city_address: string;         // 详细地址
  city_lat: string;             // 纬度
  city_lng: string;             // 经度
  
  // 时间信息
  true_solar_time: string;      // 真太阳时
  timezone: string;             // 时区
}

export interface CustomerAnalysis {
  id?: string;                  // UUID
  customer_id: string;          // 关联的 customer_inputs 表的 ID
  bazi_result: string;          // 八字分析结果
  created_at?: string;          // 创建时间
  updated_at?: string;          // 更新时间
}

// 可选：组合类型
export interface CustomerWithAnalysis extends CustomerInput {
  analysis?: CustomerAnalysis;  // 包含分析结果
} 