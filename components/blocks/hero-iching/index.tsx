"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatSession, ChatStatus } from "@/types/chat.d";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { useAppContext } from "@/contexts/app";

type HexagramLine = "yin" | "yang" | "changing-yin" | "changing-yang" | null;

// 爻位名称
const lineNames = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];

type HeroIChingProps = {
  title?: string;
  description?: string;
};

export default function HeroIChing({
  title = "Free I Ching AI Reading",
  description = "AI-powered interpretations based on the online I Ching system.",
}: HeroIChingProps) {
  // 获取用户信息
  const { user, setChat } = useAppContext();
  const router = useRouter();

  // Current step state (1: Ask, 2: Cast, 3: Interpret)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Question form state
  const [question, setQuestion] = useState<string>("");
  const [charCount, setCharCount] = useState<number>(0);

  // Hexagram casting state
  const [isCasting, setIsCasting] = useState<boolean>(false);
  const [castingLine, setCastingLine] = useState<number>(0);
  const [hexagramLines, setHexagramLines] = useState<HexagramLine[]>([
    null,
    null,
    null,
    null,
    null,
    null,
  ]);

  // Result state
  const [hexagramResult, setHexagramResult] = useState<{
    number: number;
    name: string;
    chineseName: string;
    upperTrigram: string;
    lowerTrigram: string;
    description: string;
  } | null>(null);

  // Animation refs
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle question input change
  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newQuestion = e.target.value;
    if (newQuestion.length <= 150) {
      setQuestion(newQuestion);
      setCharCount(newQuestion.length);
    }
  };

  // Handle continue to casting
  const handleContinueToCasting = () => {
    if (question.trim().length === 0) {
      // Show error message
      return;
    }
    setCurrentStep(2);
  };

  // Handle back to question
  const handleBackToQuestion = () => {
    setCurrentStep(1);
  };

  // Handle back to casting
  const handleBackToCasting = () => {
    setCurrentStep(2);
  };

  // Simulate coin toss for one line
  const simulateCoinToss = (): HexagramLine => {
    // Simulate 3 coins (heads=3, tails=2)
    const coin1 = Math.random() < 0.5 ? 3 : 2;
    const coin2 = Math.random() < 0.5 ? 3 : 2;
    const coin3 = Math.random() < 0.5 ? 3 : 2;

    const total = coin1 + coin2 + coin3;

    // Determine line type based on total value
    switch (total) {
      case 6: // All tails (2+2+2)
        return "changing-yin";
      case 7: // Two heads, one tail
        return "yang";
      case 8: // One head, two tails
        return "yin";
      case 9: // All heads (3+3+3)
        return "changing-yang";
      default:
        return "yin"; // Fallback
    }
  };

  // Start casting animation
  const startCasting = () => {
    setIsCasting(true);
    setCastingLine(1);

    // Reset hexagram lines
    setHexagramLines([null, null, null, null, null, null]);
    // Start the animation sequence
    castNextLine(1);
  };

  // Cast the next line in sequence
  const castNextLine = (lineNumber: number) => {
    // Clear any existing animation timer
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
    }

    // Animation delay
    animationTimerRef.current = setTimeout(() => {
      const lineType = simulateCoinToss();

      // Update hexagram with the new line
      setHexagramLines((prev) => {
        const newLines = [...prev];
        newLines[lineNumber - 1] = lineType;

        // 如果这是最后一行，在状态更新后完成卦象生成
        if (lineNumber === 6) {
          setTimeout(() => {
            finishCasting(newLines);
          }, 1500);
        }

        return newLines;
      });

      // Move to next line or finish
      if (lineNumber < 6) {
        setCastingLine(lineNumber + 1);
        castNextLine(lineNumber + 1);
      }
    }, 1500); // 1.5 seconds per line
  };

  // Skip animation and generate full hexagram immediately
  const skipAnimation = () => {
    // Clear any existing animation timer
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
    }

    // Generate all lines at once
    const newLines: HexagramLine[] = [];
    for (let i = 0; i < 6; i++) {
      newLines.push(simulateCoinToss());
    }

    setHexagramLines(newLines);
    // 直接传递新生成的爻线数据，而不依赖状态
    finishCasting(newLines);
  };

  // Clean up timers when component unmounts
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  // 八卦数据（三爻组合）
  const trigramData: Record<
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

  // 六十四卦数据
  const hexagramData: Record<
    string,
    { number: number; name: string; chineseName: string; description: string }
  > = {
    "111111": {
      number: 1,
      name: "The Creative",
      chineseName: "乾",
      description:
        "Powerful creative energy. This is a time of strength, inspiration, and leadership. Act with confidence and purpose.",
    },
    "000000": {
      number: 2,
      name: "The Receptive",
      chineseName: "坤",
      description:
        "Nurturing receptive energy. This is a time to be open, accepting, and supportive. Practice patience and gentle persistence.",
    },
    "010001": {
      number: 3,
      name: "Difficulty at the Beginning",
      chineseName: "屯",
      description:
        "Initial obstacles and chaos. This is a time of new beginnings with challenges. Seek help and proceed carefully.",
    },
    "100010": {
      number: 4,
      name: "Youthful Folly",
      chineseName: "蒙",
      description:
        "Inexperience seeking guidance. This is a time for learning and finding a teacher. Be receptive to instruction.",
    },
    "010111": {
      number: 5,
      name: "Waiting",
      chineseName: "需",
      description:
        "Patience in timing. This is a time of anticipation and preparedness. Nourish yourself while waiting for the right moment.",
    },
    "111010": {
      number: 6,
      name: "Conflict",
      chineseName: "訟",
      description:
        "Facing opposition. This is a time of dispute or competing interests. Seek compromise or mediation.",
    },
    "010000": {
      number: 7,
      name: "The Army",
      chineseName: "師",
      description:
        "Organized collective action. This is a time for discipline and coordinated effort. Find strength in community.",
    },
    "000010": {
      number: 8,
      name: "Holding Together",
      chineseName: "比",
      description:
        "Unity and belonging. This is a time for building alliances and community. Seek connection with others.",
    },
    "111011": {
      number: 9,
      name: "Small Taming",
      chineseName: "小畜",
      description:
        "Gentle restraint of small forces. This is a time for gradual development and small adjustments.",
    },
    "110111": {
      number: 10,
      name: "Treading",
      chineseName: "履",
      description:
        "Careful progress. This is a time for mindful conduct and proceeding with caution. Watch your step.",
    },
    "111000": {
      number: 11,
      name: "Peace",
      chineseName: "泰",
      description:
        "Harmony and prosperity. This is a time of smooth interaction between heaven and earth. Enjoy tranquility.",
    },
    "000111": {
      number: 12,
      name: "Standstill",
      chineseName: "否",
      description:
        "Stagnation and blockage. This is a time when communication between high and low is obstructed. Wait for change.",
    },
    "101111": {
      number: 13,
      name: "Fellowship",
      chineseName: "同人",
      description:
        "Community and partnership. This is a time of connection with others who share your vision.",
    },
    "111101": {
      number: 14,
      name: "Great Possession",
      chineseName: "大有",
      description:
        "Abundance and prosperity. This is a time of great strength and resources. Use your power benevolently.",
    },
    "001000": {
      number: 15,
      name: "Modesty",
      chineseName: "謙",
      description:
        "Humility and simplicity. This is a time for moderation and staying grounded. Avoid arrogance.",
    },
    "000100": {
      number: 16,
      name: "Enthusiasm",
      chineseName: "豫",
      description:
        "Inspiration and motivation. This is a time for joy and mobilizing support. Share your enthusiasm.",
    },
    "011001": {
      number: 17,
      name: "Following",
      chineseName: "隨",
      description:
        "Adaptation and following. This is a time to respond appropriately to leadership. Be flexible.",
    },
    "100110": {
      number: 18,
      name: "Work on the Decayed",
      chineseName: "蠱",
      description:
        "Repairing what has been spoiled. This is a time to address corruption and decay. Restore integrity.",
    },
    "110000": {
      number: 19,
      name: "Approach",
      chineseName: "臨",
      description:
        "Advancement and opportunity. This is a time of approaching something valuable. Welcome what comes.",
    },
    "000011": {
      number: 20,
      name: "Contemplation",
      chineseName: "觀",
      description:
        "Observation and perspective. This is a time for seeing clearly and being seen. Gain insight.",
    },
    "100101": {
      number: 21,
      name: "Biting Through",
      chineseName: "噬嗑",
      description:
        "Decisiveness and clarity. This is a time for firm action and breaking through obstacles.",
    },
    "101001": {
      number: 22,
      name: "Grace",
      chineseName: "賁",
      description:
        "Elegance and refinement. This is a time for beautification and enhancing appearances.",
    },
    "000001": {
      number: 23,
      name: "Splitting Apart",
      chineseName: "剝",
      description:
        "Disintegration and decline. This is a time when things fall apart. Accept the process of ending.",
    },
    "100000": {
      number: 24,
      name: "Return",
      chineseName: "復",
      description:
        "Renewal and regeneration. This is a time of a new cycle beginning after reaching bottom.",
    },
    "100111": {
      number: 25,
      name: "Innocence",
      chineseName: "無妄",
      description:
        "Spontaneity and naturalness. This is a time for acting without ulterior motives. Be genuine.",
    },
    "111001": {
      number: 26,
      name: "Great Taming",
      chineseName: "大畜",
      description:
        "Accumulation of energy. This is a time for containing power and storing reserves. Build strength.",
    },
    "100001": {
      number: 27,
      name: "Nourishment",
      chineseName: "頤",
      description:
        "Sustenance and care. This is a time for proper nourishment and attention to what sustains you.",
    },
    "011110": {
      number: 28,
      name: "Great Preponderance",
      chineseName: "大過",
      description:
        "Critical mass and pressure. This is a time when something reaches its limit. Seek balance.",
    },
    "010010": {
      number: 29,
      name: "The Abysmal",
      chineseName: "坎",
      description:
        "Repeated danger and depth. This is a time of facing challenges repeatedly. Develop inner strength.",
    },
    "101101": {
      number: 30,
      name: "The Clinging",
      chineseName: "離",
      description:
        "Illumination and clarity. This is a time for brightness and awareness. Gain clarity and insight.",
    },
    "001110": {
      number: 31,
      name: "Influence",
      chineseName: "咸",
      description:
        "Mutual attraction and stimulus. This is a time for exchange and reciprocity. Be open to influence.",
    },
    "011100": {
      number: 32,
      name: "Duration",
      chineseName: "恆",
      description:
        "Endurance and constancy. This is a time for persistence and steadiness. Maintain your course.",
    },
    "001111": {
      number: 33,
      name: "Retreat",
      chineseName: "遯",
      description:
        "Strategic withdrawal. This is a time to step back from danger. Know when to yield.",
    },
    "111100": {
      number: 34,
      name: "Great Power",
      chineseName: "大壯",
      description:
        "Great vigor and strength. This is a time of great energy and power. Use it wisely.",
    },
    "000101": {
      number: 35,
      name: "Progress",
      chineseName: "晉",
      description:
        "Advancement and recognition. This is a time of rising and receiving favor. Move forward.",
    },
    "101000": {
      number: 36,
      name: "Darkening of the Light",
      chineseName: "明夷",
      description:
        "Injury to clarity. This is a time when brightness is obscured. Preserve inner light.",
    },
    "101011": {
      number: 37,
      name: "The Family",
      chineseName: "家人",
      description:
        "Clan and structure. This is a time for domestic harmony and clear roles. Support your home base.",
    },
    "110101": {
      number: 38,
      name: "Opposition",
      chineseName: "睽",
      description:
        "Contradiction and polarity. This is a time of divergent views. Find complementarity in differences.",
    },
    "001010": {
      number: 39,
      name: "Obstruction",
      chineseName: "蹇",
      description:
        "Difficulty and impediment. This is a time of obstacles and hardship. Seek alternate paths.",
    },
    "010100": {
      number: 40,
      name: "Deliverance",
      chineseName: "解",
      description:
        "Release from tension. This is a time of resolution and easing of problems. Welcome relief.",
    },
    "110001": {
      number: 41,
      name: "Decrease",
      chineseName: "損",
      description:
        "Reduction and simplification. This is a time to eliminate excess. Focus on what's essential.",
    },
    "100011": {
      number: 42,
      name: "Increase",
      chineseName: "益",
      description:
        "Gain and abundance. This is a time of growing prosperity and beneficial influence.",
    },
    "111110": {
      number: 43,
      name: "Breakthrough",
      chineseName: "夬",
      description:
        "Resolution and decisiveness. This is a time for determined action to clear opposition.",
    },
    "011111": {
      number: 44,
      name: "Coming to Meet",
      chineseName: "姤",
      description:
        "Unexpected encounter. This is a time when something powerful appears unexpectedly.",
    },
    "000110": {
      number: 45,
      name: "Gathering Together",
      chineseName: "萃",
      description:
        "Assembly and cohesion. This is a time for community gathering and joining forces.",
    },
    "011000": {
      number: 46,
      name: "Pushing Upward",
      chineseName: "升",
      description:
        "Gradual progress and rising. This is a time for steady advancement and promotion.",
    },
    "010110": {
      number: 47,
      name: "Oppression",
      chineseName: "困",
      description:
        "Exhaustion and confinement. This is a time of being restricted or limited. Conserve energy.",
    },
    "011010": {
      number: 48,
      name: "The Well",
      chineseName: "井",
      description:
        "Source of nourishment. This is a time to focus on what sustains community. Ensure resources are shared.",
    },
    "101110": {
      number: 49,
      name: "Revolution",
      chineseName: "革",
      description:
        "Radical change and renewal. This is a time of fundamental transformation. Embrace the new.",
    },
    "011101": {
      number: 50,
      name: "The Cauldron",
      chineseName: "鼎",
      description:
        "Transformation and receptivity. This is a time for alchemical change and spiritual nourishment.",
    },
    "100100": {
      number: 51,
      name: "The Arousing",
      chineseName: "震",
      description:
        "Shock and awakening. This is a time of sudden change that stimulates new growth.",
    },
    "001001": {
      number: 52,
      name: "Keeping Still",
      chineseName: "艮",
      description:
        "Stillness and restraint. This is a time for meditation and stopping. Find peace in stillness.",
    },
    "001011": {
      number: 53,
      name: "Development",
      chineseName: "漸",
      description:
        "Gradual progress. This is a time for steady, step-by-step advancement. Be patient.",
    },
    "110100": {
      number: 54,
      name: "The Marrying Maiden",
      chineseName: "歸妹",
      description:
        "Subordinate role and impermanence. This is a time for recognizing limitations of secondary positions.",
    },
    "101100": {
      number: 55,
      name: "Abundance",
      chineseName: "豐",
      description:
        "Fullness and zenith. This is a time of peak prosperity and brightness. Embrace the height of your power.",
    },
    "001101": {
      number: 56,
      name: "The Wanderer",
      chineseName: "旅",
      description:
        "Transience and impermanence. This is a time of being in unfamiliar territory. Travel lightly.",
    },
    "011011": {
      number: 57,
      name: "The Gentle",
      chineseName: "巽",
      description:
        "Penetration and influence. This is a time for subtle action and persuasion. Move gently but persistently.",
    },
    "110110": {
      number: 58,
      name: "The Joyous",
      chineseName: "兌",
      description:
        "Pleasure and satisfaction. This is a time for joyful exchange and communication. Share happiness.",
    },
    "010011": {
      number: 59,
      name: "Dispersion",
      chineseName: "渙",
      description:
        "Dissolution and scattering. This is a time to disperse confusion and gather consensus.",
    },
    "110010": {
      number: 60,
      name: "Limitation",
      chineseName: "節",
      description:
        "Boundaries and restriction. This is a time for establishing healthy limits. Define your boundaries.",
    },
    "110011": {
      number: 61,
      name: "Inner Truth",
      chineseName: "中孚",
      description:
        "Sincerity and trust. This is a time for inner truth and integrity. Act from your center.",
    },
    "001100": {
      number: 62,
      name: "Small Preponderance",
      chineseName: "小過",
      description:
        "Predominance of the small. This is a time for attention to small details. Focus on precision.",
    },
    "101010": {
      number: 63,
      name: "After Completion",
      chineseName: "既濟",
      description:
        "Completion and balance. This is a time when a cycle reaches its end. Maintain vigilance.",
    },
    "010101": {
      number: 64,
      name: "Before Completion",
      chineseName: "未濟",
      description:
        "Incompletion and transition. This is a time of being on the verge of success. Make final efforts.",
    },
  };

  // 获取卦象
  const getHexagramFromLines = (lines: HexagramLine[]) => {
    // 将 yin/yang 转换为二进制，变爻也计入当前卦的二进制
    const binaryString = lines
      .map((line) => {
        return line === "yang" || line === "changing-yang" ? "1" : "0";
      })
      .join("");

    // 取上卦和下卦（各三爻）
    const upperTrigram = binaryString.substring(0, 3);
    const lowerTrigram = binaryString.substring(3, 6);

    // 获取卦象数据
    const hexagram = hexagramData[binaryString];

    if (hexagram) {
      return {
        ...hexagram,
        upperTrigram: trigramData[upperTrigram]?.name || "Unknown",
        lowerTrigram: trigramData[lowerTrigram]?.name || "Unknown",
      };
    }

    // 如果没有找到匹配的卦象，返回默认值
    return {
      number: 0,
      name: "Unknown",
      chineseName: "未知",
      upperTrigram: "Unknown",
      lowerTrigram: "Unknown",
      description: "Unable to determine the hexagram. Please try again.",
    };
  };

  // Finish casting and show result
  const finishCasting = (lines?: HexagramLine[]) => {
    setIsCasting(false);

    // 使用传入的爻线数据或当前状态
    const currentLines = lines || hexagramLines;
    // console.log("hexagramLines", currentLines);

    // 计算卦象结果
    const hexagramResult = getHexagramFromLines(currentLines);
    setHexagramResult(hexagramResult);

    // Immediately move to result step without delay
    setCurrentStep(3);
  };

  // View full interpretation
  const viewInterpretation = () => {
    // In a real implementation, this would navigate to a detailed view
    console.log("View full interpretation");
    // if (question.trim()) {
    //   const chat: ChatSession = {
    //     uuid: uuidv4(),
    //     user_uuid: user.uuid,
    //     title: question,
    //     status: ChatStatus.New,
    //     created_at: new Date(),
    //     is_matching: false,
    //     is_iching: true,
    //   };
    //   setChat(chat);
    //   // console.log(chat);
    //
    //   const jump_url = `/chat/${chat.uuid}`;
    //   router.push(jump_url);
    // }
  };

  // 八卦符号映射
  const trigramUnicodeMap: Record<string, string> = {
    Heaven: "☰",
    Lake: "☱",
    Fire: "☲",
    Thunder: "☳",
    Wind: "☴",
    Water: "☵",
    Mountain: "☶",
    Earth: "☷",
  };
  const getTrigramSymbol = (trigram: string) =>
    trigramUnicodeMap[trigram] || "";

  // Render line symbol based on line type
  const renderLineSymbol = (lineType: HexagramLine, lineIndex?: number) => {
    const showLineName = lineIndex !== undefined;

    switch (lineType) {
      case "yang":
        return (
          <div className="flex items-center">
            {showLineName && (
              <span className="text-xs mr-2 font-medium text-gray-500 w-8">
                {lineNames[lineIndex]}
              </span>
            )}
            <div className="flex-grow relative">
              <div className="relative w-[90%]">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-2.5 bg-gray-800 rounded-sm"
                />
              </div>
            </div>
            <div className="flex items-center w-[10%] justify-end">
              {showLineName && (
                <span className="text-xs font-medium text-gray-500">少阳</span>
              )}
            </div>
          </div>
        );
      case "yin":
        return (
          <div className="flex items-center">
            {showLineName && (
              <span className="text-xs mr-2 font-medium text-gray-500 w-8">
                {lineNames[lineIndex]}
              </span>
            )}
            <div className="flex-grow relative">
              <div className="flex justify-between w-[90%]">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-[43%] h-2.5 bg-gray-800 rounded-sm"
                />
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="w-[43%] h-2.5 bg-gray-800 rounded-sm"
                />
              </div>
            </div>
            <div className="flex items-center w-[10%] justify-end">
              {showLineName && (
                <span className="text-xs font-medium text-gray-500">少阴</span>
              )}
            </div>
          </div>
        );
      case "changing-yang":
        return (
          <div className="flex items-center">
            {showLineName && (
              <span className="text-xs mr-2 font-medium text-gray-500 w-8">
                {lineNames[lineIndex]}
              </span>
            )}
            <div className="flex-grow relative">
              <div className="relative w-[90%]">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-2.5 bg-gray-800 rounded-sm"
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                  className="absolute right-[-20px] top-0 w-3 h-3 rounded-full bg-gray-800 flex items-center justify-center"
                />
              </div>
            </div>

            <div className="flex items-center w-[10%] justify-end">
              {showLineName && (
                <span className="text-xs font-medium text-gray-500">老阳</span>
              )}
            </div>
          </div>
        );
      case "changing-yin":
        return (
          <div className="flex items-center">
            {showLineName && (
              <span className="text-xs mr-2 font-medium text-gray-500 w-8">
                {lineNames[lineIndex]}
              </span>
            )}
            <div className="flex-grow relative">
              <div className="relative w-[90%]">
                <div className="flex justify-between w-full">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-[43%] h-2.5 bg-gray-800 rounded-sm"
                  />
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="w-[43%] h-2.5 bg-gray-800 rounded-sm"
                  />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                  className="absolute right-[-20px] top-0 w-3 h-3 rounded-full bg-gray-800 flex items-center justify-center"
                />
              </div>
            </div>
            <div className="flex items-center w-[10%] justify-end">
              {showLineName && (
                <span className="text-xs font-medium text-gray-500">老阴</span>
              )}
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center">
            {showLineName && (
              <span className="text-xs mr-2 font-medium text-gray-500 w-8">
                {lineNames[lineIndex]}
              </span>
            )}
            <div className="w-full h-2.5 bg-gray-200 rounded-sm"></div>
          </div>
        );
    }
  };

  return (
    <div
      className="bg-gradient-to-br from-gray-50 to-gray-100 py-16 md:py-24 relative overflow-hidden"
      id="start"
      style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700] to-[#8A2BE2] opacity-5 mix-blend-multiply"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 leading-tight">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            {description}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl max-w-2xl mx-auto p-8 border border-gray-100">
          {/* Process Steps */}
          <div className="flex justify-between mb-8 relative">
            {/* 步骤连接线 */}
            <div className="absolute top-[24px] left-[60px] right-[60px] h-[1px] bg-gray-200 z-0"></div>

            {/* Step 1: Ask */}
            <div className="flex flex-col items-center relative z-10 w-1/3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-medium mb-2 transition-all duration-300 bg-[#8A2BE2] text-white`}
              >
                {currentStep > 1 ? (
                  <div className="flex items-center">
                    <span className="text-xl font-bold mr-0.5">1</span>
                    <span className="text-xl font-bold">✓</span>
                  </div>
                ) : (
                  <span className="text-xl font-bold">1</span>
                )}
              </div>
              <div
                className={`text-base font-bold ${
                  currentStep === 1 ? "text-[#8A2BE2]" : "text-gray-500"
                }`}
              >
                Ask
              </div>
            </div>

            {/* Step 2: Cast */}
            <div className="flex flex-col items-center relative z-10 w-1/3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-medium mb-2 transition-all duration-300 bg-[#8A2BE2] text-white`}
              >
                {currentStep > 2 ? (
                  <div className="flex items-center">
                    <span className="text-xl font-bold mr-0.5">2</span>
                    <span className="text-xl font-bold">✓</span>
                  </div>
                ) : (
                  <span className="text-xl font-bold">2</span>
                )}
              </div>
              <div
                className={`text-base font-bold ${
                  currentStep === 2
                    ? "text-[#8A2BE2]"
                    : currentStep > 2
                    ? "text-gray-500"
                    : "text-gray-500"
                }`}
              >
                Cast
              </div>
            </div>

            {/* Step 3: Interpret */}
            <div className="flex flex-col items-center relative z-10 w-1/3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-medium mb-2 transition-all duration-300 bg-[#8A2BE2] text-white`}
              >
                <span className="text-xl font-bold">3</span>
              </div>
              <div
                className={`text-base font-bold ${
                  currentStep === 3 ? "text-[#8A2BE2]" : "text-gray-500"
                }`}
              >
                Interpret
              </div>
            </div>
          </div>

          {/* Step 1: Question Form */}
          <AnimatePresence mode="wait" initial={false}>
            {currentStep === 1 && (
              <motion.div
                key="question-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="space-y-6"
              >
                {/* Question Textarea */}
                <div className="space-y-1">
                  <textarea
                    value={question}
                    onChange={handleQuestionChange}
                    placeholder="What would you like to ask the I Ching today?"
                    className="w-full min-h-[120px] p-3 bg-white border border-gray-300 rounded-md text-gray-700 placeholder-gray-400 shadow-sm focus:border-[#8A2BE2] focus:outline-none focus:ring-2 focus:ring-[#8A2BE2] focus:ring-opacity-20 transition-colors resize-none"
                    maxLength={300}
                  ></textarea>
                  <div className="text-right text-sm text-gray-500">
                    {charCount}/300
                  </div>
                </div>

                {/* Continue Button */}
                <button
                  onClick={handleContinueToCasting}
                  disabled={!question.trim()}
                  className="w-full py-3 bg-[#8A2BE2] text-white font-bold rounded-md shadow-md hover:bg-[#7B24CC] transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-md"
                >
                  🔮 Continue to Cast Hexagram
                </button>

                {/* Example Questions */}
                <div className="text-center text-sm text-gray-500 mt-2">
                  <span>Examples:</span>
                  <button
                    onClick={() => {
                      setQuestion("Should I pursue a new relationship?");
                      setCharCount(
                        "Should I pursue a new relationship?".length
                      );
                    }}
                    className="text-[#8A2BE2] hover:text-[#7B24CC] hover:underline mx-1 font-medium"
                  >
                    Relationship
                  </button>
                  <span> • </span>
                  <button
                    onClick={() => {
                      setQuestion("What about my career path?");
                      setCharCount("What about my career path?".length);
                    }}
                    className="text-[#8A2BE2] hover:text-[#7B24CC] hover:underline mx-1 font-medium"
                  >
                    Career
                  </button>
                  <span> • </span>
                  <button
                    onClick={() => {
                      setQuestion("How to approach my decision?");
                      setCharCount("How to approach my decision?".length);
                    }}
                    className="text-[#8A2BE2] hover:text-[#7B24CC] hover:underline mx-1 font-medium"
                  >
                    Decision
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 2: Hexagram Casting */}
          <AnimatePresence mode="wait" initial={false}>
            {currentStep === 2 && (
              <motion.div
                key="hexagram-casting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="space-y-6"
              >
                <div className="bg-[#f9f5ff] rounded-xl py-5 px-5 border-l-[6px] border-l-[#8A2BE2] border-y-0 border-r-0">
                  <p className="text-gray-700 text-base">
                    We'll use the traditional coin toss method to cast your
                    hexagram, simulating the ancient I Ching divination process.
                  </p>
                </div>

                <div className="space-y-8">
                  {isCasting && (
                    <div className="text-center space-y-5">
                      <div className="flex justify-center space-x-8">
                        <motion.div
                          animate={{
                            rotateY: [0, 180, 360],
                            y: [0, -15, 0],
                            x: [0, 5, 0],
                          }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            repeatType: "loop",
                            times: [0, 0.5, 1],
                            delay: 0,
                          }}
                          className="w-14 h-14 rounded-full overflow-hidden shadow-lg"
                        >
                          <img
                            src="/images/ancient-coin-1.png"
                            alt="Ancient Chinese Coin"
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                        <motion.div
                          animate={{
                            rotateY: [0, 180, 360],
                            y: [0, -25, 0],
                            x: [0, -3, 0],
                          }}
                          transition={{
                            duration: 1.7,
                            repeat: Infinity,
                            repeatType: "loop",
                            times: [0, 0.5, 1],
                            delay: 0.2,
                          }}
                          className="w-14 h-14 rounded-full overflow-hidden shadow-lg"
                        >
                          <img
                            src="/images/ancient-coin-1.png"
                            alt="Ancient Chinese Coin"
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                        <motion.div
                          animate={{
                            rotateY: [0, 180, 360],
                            y: [0, -18, 0],
                            x: [0, -8, 0],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatType: "loop",
                            times: [0, 0.5, 1],
                            delay: 0.4,
                          }}
                          className="w-14 h-14 rounded-full overflow-hidden shadow-lg"
                        >
                          <img
                            src="/images/ancient-coin-1.png"
                            alt="Ancient Chinese Coin"
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                      </div>

                      <div className="mt-4">
                        <p className="text-base font-medium text-gray-700 mb-2">
                          Building line {castingLine} of 6
                        </p>
                        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(castingLine / 6) * 100}%` }}
                            className="h-full bg-gradient-to-r from-[#8A2BE2] to-purple-700 transition-all duration-500 ease-out"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center">
                    <div className="space-y-4 w-96">
                      {[5, 4, 3, 2, 1, 0].map((index) => (
                        <div key={index} className="h-5">
                          {renderLineSymbol(hexagramLines[index], index)}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center space-x-4">
                    {!isCasting ? (
                      <button
                        onClick={startCasting}
                        className="w-full px-6 py-3 bg-[#8A2BE2] text-white font-bold rounded-md shadow-md hover:bg-[#7B24CC] transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-lg"
                      >
                        Start Casting
                      </button>
                    ) : (
                      <button
                        onClick={skipAnimation}
                        className="w-full px-6 py-3 border border-[#8A2BE2] text-[#8A2BE2] bg-white font-bold rounded-md hover:bg-purple-50 transition-all duration-300"
                      >
                        Skip Animation
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-center pt-4">
                  <button
                    onClick={handleBackToQuestion}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-full transition-colors font-medium"
                  >
                    Back to Question
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 3: Hexagram Result */}
          <AnimatePresence mode="wait" initial={false}>
            {currentStep === 3 && hexagramResult && (
              <motion.div
                key="hexagram-interpretation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 p-6 bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-100 shadow-sm">
                  <div className="flex-shrink-0 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="space-y-2 w-24">
                      {[5, 4, 3, 2, 1, 0].map((index) => (
                        <div key={index} className="h-3">
                          {renderLineSymbol(hexagramLines[index])}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col justify-center">
                    <h3 className="text-2xl md:text-3xl font-bold text-[#8A2BE2] mb-1">
                      Hexagram {hexagramResult.number}: {hexagramResult.name}{" "}
                      <span className="text-[#8A2BE2] font-normal">
                        ({hexagramResult.chineseName})
                      </span>
                    </h3>
                    <div className="flex items-center text-base md:text-lg text-gray-500 font-medium">
                      <span className="mr-2 text-2xl md:text-3xl">
                        {getTrigramSymbol(hexagramResult.upperTrigram)}
                      </span>
                      <span className="mr-2">
                        {hexagramResult.upperTrigram} above,
                      </span>
                      <span className="mr-2 text-2xl md:text-3xl">
                        {getTrigramSymbol(hexagramResult.lowerTrigram)}
                      </span>
                      <span>{hexagramResult.lowerTrigram} below</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl p-6 border-l-4 border-[#8A2BE2] bg-white rounded-r-2xl shadow-sm mt-6">
                  <p className="text-gray-800 text-lg md:text-xl leading-relaxed font-normal">
                    {hexagramResult.description}
                  </p>
                </div>

                <div className="mt-6">
                  <button
                    onClick={viewInterpretation}
                    className="w-full py-3 bg-[#8A2BE2] text-white font-bold rounded-md shadow-md hover:bg-[#7B24CC] transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-lg"
                  >
                    View Full Interpretation
                  </button>
                </div>

                <div className="text-center pt-4">
                  <button
                    onClick={handleBackToCasting}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-full transition-colors font-medium"
                  >
                    Back to Casting
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
