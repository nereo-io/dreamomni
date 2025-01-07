export interface CustomerInput {
  id?: string;                    // UUID
  userUuid: string;              // 关联的用户UUID
  createdAt?: string;            // 创建时间
  updatedAt?: string;            // 更新时间
  
  // 个人信息
  name: string;                  // 姓名
  gender: string;                // 性别
  birthDateTime: Date;         // 出生时间
  
  // 地理信息
  birthCity?: string;             // 出生城市
  cityAdcode?: string;            // 城市编码
  cityAddress?: string;           // 详细地址
  cityLat?: string;               // 纬度
  cityLng?: string;               // 经度
  
  // 时间信息
  trueSolarTime?: Date;         // 真太阳时
  timezone: string;              // 时区
}

export interface CustomerAnalysis {
  id?: string;                  // UUID
  customerId: string;           // 关联的 customer_inputs 表的 ID
  baziResult: string;           // 八字分析结果
  createdAt?: string;           // 创建时间
  updatedAt?: string;           // 更新时间
}

// 可选：组合类型
export interface CustomerWithAnalysis extends CustomerInput {
  analysis?: CustomerAnalysis;  // 包含分析结果
} 