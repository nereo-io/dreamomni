// 数据库表结构定义
export interface BaziQuestion {
  id: string; // 唯一标识符
  text: string; // 问题文本
  text_en?: string; // 问题文本（英文）
  category: string; // 问题分类
  tags: string[]; // 问题标签
  tags_en?: string[]; // 问题标签（英文）
  copy_count: number; // 复制次数
  locale: string; // 语言
  created_at: string; // 创建时间
  updated_at?: string; // 更新时间
  user_id?: string; // 创建用户ID
  status: "active" | "inactive" | "deleted"; // 状态
}

// 复制记录表定义
export interface BaziQuestionCopy {
  id: string; // 复制记录ID
  question_id: string; // 关联的问题ID
  user_id?: string; // 用户ID（可选，匿名用户可能没有）
  copied_at: string; // 复制时间
  ip_address?: string; // IP地址（可选，用于防刷）
  device_info?: string; // 设备信息（可选）
}
