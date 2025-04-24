// 八卦数据（三爻组合）
export const trigramData: Record<
  string,
  { name: string; symbol: string; binary: string }
> = {
  "111": { name: "Heaven", symbol: "☰", binary: "111" },
  "110": { name: "Lake", symbol: "☱", binary: "110" },
  "101": { name: "Fire", symbol: "☲", binary: "101" },
  "100": { name: "Thunder", symbol: "☳", binary: "100" },
  "011": { name: "Wind", symbol: "☴", binary: "011" },
  "010": { name: "Water", symbol: "☵", binary: "010" },
  "001": { name: "Mountain", symbol: "☶", binary: "001" },
  "000": { name: "Earth", symbol: "☷", binary: "000" },
};

// 八卦符号映射
export const trigramUnicodeMap: Record<string, string> = {
  Heaven: "☰",
  Lake: "☱",
  Fire: "☲",
  Thunder: "☳",
  Wind: "☴",
  Water: "☵",
  Mountain: "☶",
  Earth: "☷",
};
