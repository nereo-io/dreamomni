export type HexagramLine = "少阴" | "少阳" | "老阴" | "老阳" | null;

// 定义枚举类型
export enum LineType {
  YANG = "少阳", // yang line
  YIN = "少阴", // yin line
  CHANGING_YANG = "老阳", // changing yang
  CHANGING_YIN = "老阴", // changing yin
}

export interface HexagramResult {
  number: number;
  name: string;
  chineseName: string;
  upperTrigram: string;
  lowerTrigram: string;
  description: string;
  changingHexagram: Hexagram;
}

export interface Hexagram {
  number: number;
  name: string;
  chineseName: string;
  description: string;
  judgement?: string;
  imageTxt?: string;
  lineTxt?: string;
}

export interface Trigram {
  number: number;
  name: string;
  chineseName: string;
  description: string;
}

// 64 卦常量数据
export interface IChingContent {
  hexagrams: Record<string, Hexagram>;
}

// 占卜最后的结果，本卦和变卦的数据
export interface HexagramData {
  hexagram: Record<string, Hexagram>;
  changingHexagrams?: Record<string, Hexagram>;
}
