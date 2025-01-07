//八字计算与五行对应实现

// 基础类型定义
export enum Gender {
    Male = 'male',
    Female = 'female',
    Other = 'other'
  }
  
  export enum Stem {
    JIA = '甲',
    YI = '乙',
    BING = '丙',
    DING = '丁',
    WU = '戊',
    JI = '己',
    GENG = '庚',
    XIN = '辛',
    REN = '壬',
    GUI = '癸'
  }
  
  export enum Branch {
    ZI = '子',
    CHOU = '丑',
    YIN = '寅',
    MAO = '卯',
    CHEN = '辰',
    SI = '巳',
    WU = '午',
    WEI = '未',
    SHEN = '申',
    YOU = '酉',
    XU = '戌',
    HAI = '亥'
  }
  
  export enum WuXing {
    METAL = '金',
    WOOD = '木',
    WATER = '水',
    FIRE = '火',
    EARTH = '土'
  }
  
  export enum Direction {
    EAST = 'EAST',    // 东
    SOUTH = 'SOUTH',  // 南
    WEST = 'WEST',    // 西
    NORTH = 'NORTH'   // 北
  }
  
  // 定义天干地支关系类型
  export enum RelationType {
    SHENG = '生',
    KE = '克', 
    XIANGHE = '相合',
    SANHE = '三合',
    SANHUI = '三会',
    XIANGXING = '相刑',
    SANXING = '三刑',
    ZIXING = '自刑',
    XIANGCHONG = '相冲',
    XIANGHAI = '相害'
  }
  
  
  //大运计算
  // 阳男阴女的地支顺序
  export const YANG_MALE_YIN_FEMALE_BRANCHES = [
    Branch.ZI,   // 子
    Branch.YIN,  // 寅
    Branch.CHEN, // 辰
    Branch.WU,   // 午
    Branch.SHEN, // 申
    Branch.XU    // 戌
  ];
  
  // 阴男阳女的地支顺序
  export const YIN_MALE_YANG_FEMALE_BRANCHES = [
    Branch.CHOU, // 丑
    Branch.MAO,  // 卯
    Branch.SI,   // 巳
    Branch.WEI,  // 未
    Branch.YOU,  // 酉
    Branch.HAI   // 亥
  ];
  
  // 六十甲子表
  export const SIXTY_JIAZI: Array<{ stem: Stem; branch: Branch }> = [
    { stem: Stem.JIA, branch: Branch.ZI },    // 甲子
    { stem: Stem.YI, branch: Branch.CHOU },   // 乙丑
    { stem: Stem.BING, branch: Branch.YIN },  // 丙寅
    { stem: Stem.DING, branch: Branch.MAO },  // 丁卯
    { stem: Stem.WU, branch: Branch.CHEN },   // 戊辰
    { stem: Stem.JI, branch: Branch.SI },     // 己巳
    { stem: Stem.GENG, branch: Branch.WU },   // 庚午
    { stem: Stem.XIN, branch: Branch.WEI },   // 辛未
    { stem: Stem.REN, branch: Branch.SHEN },  // 壬申
    { stem: Stem.GUI, branch: Branch.YOU },   // 癸酉
    { stem: Stem.JIA, branch: Branch.XU },    // 甲戌
    { stem: Stem.YI, branch: Branch.HAI },    // 乙亥
    { stem: Stem.BING, branch: Branch.ZI },   // 丙子
    { stem: Stem.DING, branch: Branch.CHOU }, // 丁丑
    { stem: Stem.WU, branch: Branch.YIN },    // 戊寅
    { stem: Stem.JI, branch: Branch.MAO },    // 己卯
    { stem: Stem.GENG, branch: Branch.CHEN }, // 庚辰
    { stem: Stem.XIN, branch: Branch.SI },    // 辛巳
    { stem: Stem.REN, branch: Branch.WU },    // 壬午
    { stem: Stem.GUI, branch: Branch.WEI },   // 癸未
    { stem: Stem.JIA, branch: Branch.SHEN },  // 甲申
    { stem: Stem.YI, branch: Branch.YOU },    // 乙酉
    { stem: Stem.BING, branch: Branch.XU },   // 丙戌
    { stem: Stem.DING, branch: Branch.HAI },  // 丁亥
    { stem: Stem.WU, branch: Branch.ZI },     // 戊子
    { stem: Stem.JI, branch: Branch.CHOU },   // 己丑
    { stem: Stem.GENG, branch: Branch.YIN },  // 庚寅
    { stem: Stem.XIN, branch: Branch.MAO },   // 辛卯
    { stem: Stem.REN, branch: Branch.CHEN },  // 壬辰
    { stem: Stem.GUI, branch: Branch.SI },    // 癸巳
    { stem: Stem.JIA, branch: Branch.WU },    // 甲午
    { stem: Stem.YI, branch: Branch.WEI },    // 乙未
    { stem: Stem.BING, branch: Branch.SHEN }, // 丙申
    { stem: Stem.DING, branch: Branch.YOU },  // 丁酉
    { stem: Stem.WU, branch: Branch.XU },     // 戊戌
    { stem: Stem.JI, branch: Branch.HAI },    // 己亥
    { stem: Stem.GENG, branch: Branch.ZI },   // 庚子
    { stem: Stem.XIN, branch: Branch.CHOU },  // 辛丑
    { stem: Stem.REN, branch: Branch.YIN },   // 壬寅
    { stem: Stem.GUI, branch: Branch.MAO },   // 癸卯
    { stem: Stem.JIA, branch: Branch.CHEN },  // 甲辰
    { stem: Stem.YI, branch: Branch.SI },     // 乙巳
    { stem: Stem.BING, branch: Branch.WU },   // 丙午
    { stem: Stem.DING, branch: Branch.WEI },  // 丁未
    { stem: Stem.WU, branch: Branch.SHEN },   // 戊申
    { stem: Stem.JI, branch: Branch.YOU },    // 己酉
    { stem: Stem.GENG, branch: Branch.XU },   // 庚戌
    { stem: Stem.XIN, branch: Branch.HAI },   // 辛亥
    { stem: Stem.REN, branch: Branch.ZI },    // 壬子
    { stem: Stem.GUI, branch: Branch.CHOU },  // 癸丑
    { stem: Stem.JIA, branch: Branch.YIN },   // 甲寅
    { stem: Stem.YI, branch: Branch.MAO },    // 乙卯
    { stem: Stem.BING, branch: Branch.CHEN }, // 丙辰
    { stem: Stem.DING, branch: Branch.SI },   // 丁巳
    { stem: Stem.WU, branch: Branch.WU },     // 戊午
    { stem: Stem.JI, branch: Branch.WEI },    // 己未
    { stem: Stem.GENG, branch: Branch.SHEN }, // 庚申
    { stem: Stem.XIN, branch: Branch.YOU },   // 辛酉
    { stem: Stem.REN, branch: Branch.XU },    // 壬戌
    { stem: Stem.GUI, branch: Branch.HAI }    // 癸亥
  ];
  
  // 添加十神枚举
  export enum TenGod {
    ZHENG_GUAN = '正官', // 正官
    PIAN_GUAN = '七杀',  // 偏官(七杀)
    ZHENG_YIN = '正印',  // 正印
    PIAN_YIN = '偏印',   // 偏印
    BI_JIAN = '比肩',    // 比肩
    PIAN_CAI = '偏财',   // 偏财
    ZHENG_CAI = '正财',  // 正财
    SHANG_GUAN = '伤官', // 伤官
    SHI_SHEN = '食神',   // 食神
    JIAN_DI = '劫财',    // 劫财
    RI_YUAN = '日元'     // 日元（新增）
  }
  
  // 添加五行颜色枚举
  export enum WuXingColor {
    METAL = '#FFD700', // 金 - 黄色
    WOOD = '#228B22',  // 木 - 绿色
    WATER = '#1E90FF', // 水 - 蓝色
    FIRE = '#FF4500',  // 火 - 红色
    EARTH = '#CD853F'  // 土 - 土黄色
  }
  
  
  