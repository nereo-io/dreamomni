import { Gender, Stem, Branch, WuXing, TenGod } from './enums';

// 用户输入
export interface UserInput {
  gender: Gender;
  birthDate: Date;
} 

export interface BaZi {
  year: { stem: Stem; branch: Branch };
  month: { stem: Stem; branch: Branch };
  day: { stem: Stem; branch: Branch };
  hour: { stem: Stem; branch: Branch };
}

export interface BaZiApiResponse {
  code: number;
  data: {
    yearGanZhi: string;
    monthGanZhi: string;
    dayGanZhi: string;
    timeGanZhi: string;
  };
}

// 藏干映射表
export interface HiddenStem {
  main: Stem;
  secondary?: Stem;
  tertiary?: Stem;
}

// 新增数据库相关的接口定义
export interface CustomerInput {
  id?: string;           // 可选，因为创建时不需要
  name: string;
  gender: Gender;
  birthDateTime: Date;
  trueSolarTime: Date;
  birthCity: string;
  cityAdcode: string;
  cityAddress: string;
  cityLng: string;
  cityLat: string;
  userId: string;
  timezone: string;
}

export interface UserInfo {
  userId: string;
  userName: string;
}

// Fortune 相关接口
export interface FortuneInfo {
  customerId: string;
  fortuneDate: Date;
  overallScore: number;
  details: any; // 可以根据实际数据结构定义更具体的类型
}

// 大运相关接口
export interface DaYun {
  age: number;          // 起运年龄
  year: number;         // 起运年份
  stem: Stem;         // 天干
  branch: Branch;       // 地支
}

export interface DaYunResult {
  startAge: number;     // 起运年龄
  startYear: number;    // 起运年份
  sequence: 'forward' | 'backward';     // 顺/逆
  daYuns: DaYun[];     // 8个大运信息
}

// LLMService 返回的类型
export interface FortuneAnalysis {
  lifeScript: string;
  personality: string;
  health: string;
  wealth: string;
  love: string;
  career: string;
}

// FASTAPI 八字分析请求
// 请求接口
export interface BaziRequest {
  year: number;
  month: number;
  day: number;
  hour: number;
  gender?: 'male' | 'female';
}
// 响应接口
export interface BaziResponse {
  status: 'success' | 'error'; 
  data: string;
}