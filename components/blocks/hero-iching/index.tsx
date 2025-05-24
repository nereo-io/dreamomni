"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatSession, ChatStatus } from "@/types/chat.d";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { useAppContext } from "@/contexts/app";
import {
  HexagramLine,
  HexagramResult,
  LineType,
  HexagramData,
} from "@/types/hexagram.d";
import { trigramData, trigramUnicodeMap } from "@/constants/i-ching/trigrams";
import { getIChingContent } from "@/services/page";
import { IChingHero } from "@/types/pages/i-ching";

// 爻位名称
const lineNames = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];

type HeroIChingProps = {
  t: IChingHero;
};

// 定义变卦类型
interface ChangingHexagram {
  positions?: number[];
  hexagram: any; // 最好替换为具体的hexagram类型
}

export default function HeroIChing({ t }: HeroIChingProps) {
  // 设置默认值和翻译值
  const title = t.title;
  const description = t.description;

  // 获取用户信息
  const { user, setShowSignModal, setChat } = useAppContext();
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

  // 加载Hexagrams Content 的数据
  const [hexagramData, setHexagramData] = useState<Record<string, any>>({});
  const [completeData, setCompleteData] = useState<HexagramData | undefined>(
    undefined
  );

  // 在组件加载时获取数据
  useEffect(() => {
    async function loadIChingData() {
      const iChingContent = await getIChingContent("zh");
      setHexagramData(iChingContent.hexagrams || {});
    }

    loadIChingData();
  }, []);

  // Result state
  const [hexagramResult, setHexagramResult] = useState<
    HexagramResult | undefined
  >(undefined);

  // 添加changingHexagrams和HexagramData状态
  const [changingHexagrams, setChangingHexagrams] = useState<
    ChangingHexagram[]
  >([]);

  // Animation refs
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 添加textarea引用
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整textarea高度的函数
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // 当问题变化时调整高度
  useEffect(() => {
    adjustTextareaHeight();
  }, [question]);

  // 组件挂载后调整高度
  useEffect(() => {
    adjustTextareaHeight();
  }, []);

  // Handle question input change
  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newQuestion = e.target.value;
    if (newQuestion.length <= 2000) {
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
        return LineType.CHANGING_YIN;
      case 7: // Two heads, one tail
        return LineType.YANG;
      case 8: // One head, two tails
        return LineType.YIN;
      case 9: // All heads (3+3+3)
        return LineType.CHANGING_YANG;
      default:
        return LineType.YIN; // Fallback
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

  // 获取卦象
  const getHexagramFromLines = (lines: HexagramLine[]) => {
    // 为了符合传统易经顺序（从下到上），反转爻序再进行计算
    const reversedLines = [...lines].reverse();

    // 将 yin/yang 转换为二进制，变爻也计入当前卦的二进制
    const binaryString = [...lines]
      .map((line) => {
        return line === LineType.YANG || line === LineType.CHANGING_YANG
          ? "1"
          : "0";
      })
      .join("");
    // console.log("binaryString", binaryString);

    // 取上卦和下卦（各三爻）
    const lowerTrigram = binaryString.substring(0, 3);
    const upperTrigram = binaryString.substring(3, 6);

    // 获取卦象数据
    const hexagram = hexagramData[binaryString];

    // 计算变卦
    const hasChangingLines = lines.some(
      (line) =>
        line === LineType.CHANGING_YIN || line === LineType.CHANGING_YANG
    );

    let changingHexagram: ChangingHexagram | null = null;

    // 如果有变爻，计算变卦
    if (hasChangingLines) {
      // 创建新的爻数组，同时改变所有变爻
      const newLines = [...lines].map((line) => {
        if (line === LineType.CHANGING_YIN) {
          return LineType.YANG;
        } else if (line === LineType.CHANGING_YANG) {
          return LineType.YIN;
        }
        return line; // 非变爻保持不变
      });

      // 生成变化后的二进制字符串
      const newBinaryString = [...newLines]
        .map((line) => {
          if (line === LineType.YANG) {
            return "1";
          } else {
            return "0";
          }
        })
        .join("");
      // console.log("变卦二进制", newBinaryString);

      // 获取变卦数据
      const changedHexagram = hexagramData[newBinaryString];
      if (changedHexagram) {
        // 记录变爻的位置
        const changingPositions = lines
          .map((line, index) =>
            line === LineType.CHANGING_YIN || line === LineType.CHANGING_YANG
              ? index
              : -1
          )
          .filter((pos) => pos !== -1)
          .map((pos) => pos + 1); // 将0基索引转换为1基爻位

        changingHexagram = {
          positions: changingPositions, // 存储所有变爻的位置
          hexagram: changedHexagram,
        };
      }
    }

    if (hexagram) {
      return {
        ...hexagram,
        upperTrigram: trigramData[upperTrigram]?.name || "Unknown",
        lowerTrigram: trigramData[lowerTrigram]?.name || "Unknown",
        changingHexagram: changingHexagram, // 直接返回变卦对象，而不是数组
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
    // console.log("currentLines", currentLines);

    // 计算卦象结果
    const hexagramResult = getHexagramFromLines(currentLines);
    // console.log("hexagramResult", hexagramResult);
    setHexagramResult(hexagramResult);

    // 创建不包含冗余数据的卦象结构
    const completeHexagramData = {
      // 从hexagramResult中提取基本卦象信息，不包括changingHexagram
      hexagram: {
        number: hexagramResult.number,
        name: hexagramResult.name,
        chineseName: hexagramResult.chineseName,
        upperTrigram: hexagramResult.upperTrigram,
        lowerTrigram: hexagramResult.lowerTrigram,
        description: hexagramResult.description,
        judgement: hexagramResult.judgement,
        imageTxt: hexagramResult.imageTxt,
        lineTxt: hexagramResult.lineTxt,
      },
      // 单独存储变卦信息
      changingHexagram: hexagramResult.changingHexagram,
    };

    // 设置完整的卦象数据
    setCompleteData(completeHexagramData);

    // Immediately move to result step without delay
    setCurrentStep(3);
  };

  // View full interpretation
  const viewInterpretation = () => {
    // In a real implementation, this would navigate to a detailed view
    // console.log("View full interpretation");

    if (!user) {
      setShowSignModal(true);
      return;
    }

    if (question.trim() && hexagramResult) {
      // 创建chat会话
      const chat: ChatSession = {
        uuid: uuidv4(),
        user_uuid: user.uuid,
        title: question,
        status: ChatStatus.New,
        created_at: new Date(),
        // 注意：移除了 is_matching, is_iching, hexagramLines, hexagramData 字段
        // 因为简化的 ChatSession 表结构中不包含这些字段
        model: "gpt-4",
      };
      setChat(chat);
      // console.log(chat);

      const jump_url = `/chat/${chat.uuid}`;
      router.push(jump_url);
    }
  };

  const getTrigramSymbol = (trigram: string) =>
    trigramUnicodeMap[trigram] || "";

  // Render line symbol based on line type
  const renderLineSymbol = (lineType: HexagramLine, lineIndex?: number) => {
    const showLineName = lineIndex !== undefined;

    switch (lineType) {
      case LineType.YANG:
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
      case LineType.YIN:
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
      case LineType.CHANGING_YANG:
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
      case LineType.CHANGING_YIN:
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
                } h-10 flex items-center justify-center text-center`}
              >
                {t.steps.ask}
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
                } h-10 flex items-center justify-center text-center`}
              >
                {t.steps.cast}
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
                } h-10 flex items-center justify-center text-center`}
              >
                {t.steps.interpret}
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
                    ref={textareaRef}
                    value={question}
                    onChange={handleQuestionChange}
                    placeholder={t.questionPlaceholder}
                    className="w-full min-h-[120px] p-3 bg-white border border-gray-300 rounded-md text-gray-700 placeholder-gray-400 shadow-sm focus:border-[#8A2BE2] focus:outline-none focus:ring-2 focus:ring-[#8A2BE2] focus:ring-opacity-20 transition-colors resize-none overflow-hidden"
                    maxLength={1000}
                  ></textarea>
                  {/* <div className="text-right text-sm text-gray-500">
                    {charCount}/300 {t.characters}
                  </div> */}
                </div>

                {/* Continue Button */}
                <button
                  onClick={handleContinueToCasting}
                  disabled={!question.trim()}
                  className="w-full py-3 bg-[#8A2BE2] text-white font-bold rounded-md shadow-md hover:bg-[#7B24CC] transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-md"
                >
                  🔮 {t.buttons.continue}
                </button>

                {/* Example Questions */}
                <div className="text-center text-sm text-gray-500 mt-2">
                  <span>{t.examples.title}</span>
                  <button
                    onClick={() => {
                      setQuestion(t.examples.relationshipQuestion);
                      setCharCount(t.examples.relationshipQuestion.length);
                    }}
                    className="text-[#8A2BE2] hover:text-[#7B24CC] hover:underline mx-1 font-medium"
                  >
                    {t.examples.relationship}
                  </button>
                  <span> • </span>
                  <button
                    onClick={() => {
                      setQuestion(t.examples.careerQuestion);
                      setCharCount(t.examples.careerQuestion.length);
                    }}
                    className="text-[#8A2BE2] hover:text-[#7B24CC] hover:underline mx-1 font-medium"
                  >
                    {t.examples.career}
                  </button>
                  <span> • </span>
                  <button
                    onClick={() => {
                      setQuestion(t.examples.decisionQuestion);
                      setCharCount(t.examples.decisionQuestion.length);
                    }}
                    className="text-[#8A2BE2] hover:text-[#7B24CC] hover:underline mx-1 font-medium"
                  >
                    {t.examples.decision}
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
                    {t.castingDescription}
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
                            duration: 0.9,
                            repeat: Infinity,
                            repeatType: "loop",
                            times: [0, 0.5, 1],
                            delay: 0,
                          }}
                          className="w-14 h-14 rounded-full overflow-hidden shadow-lg"
                        >
                          <img
                            src="/imgs/ancient-coin-1.png"
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
                            duration: 1.2,
                            repeat: Infinity,
                            repeatType: "loop",
                            times: [0, 0.5, 1],
                            delay: 0.2,
                          }}
                          className="w-14 h-14 rounded-full overflow-hidden shadow-lg"
                        >
                          <img
                            src="/imgs/ancient-coin-1.png"
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
                            duration: 1.1,
                            repeat: Infinity,
                            repeatType: "loop",
                            times: [0, 0.5, 1],
                            delay: 0.4,
                          }}
                          className="w-14 h-14 rounded-full overflow-hidden shadow-lg"
                        >
                          <img
                            src="/imgs/ancient-coin-1.png"
                            alt="Ancient Chinese Coin"
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                      </div>

                      <div className="mt-4">
                        <p className="text-base font-medium text-gray-700 mb-2">
                          {t.castingLines} {castingLine} {t.of} 6
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
                        {t.startCasting}
                      </button>
                    ) : (
                      <button
                        onClick={skipAnimation}
                        className="w-full px-6 py-3 border border-[#8A2BE2] text-[#8A2BE2] bg-white font-bold rounded-md hover:bg-purple-50 transition-all duration-300"
                      >
                        {t.buttons.skip}
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-center pt-4">
                  <button
                    onClick={handleBackToQuestion}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-full transition-colors font-medium"
                  >
                    {t.buttons.back}
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
                      {t.hexagram} {hexagramResult.number}:{" "}
                      {hexagramResult.name}{" "}
                      <span className="text-[#8A2BE2] font-normal">
                        ({hexagramResult.chineseName})
                      </span>
                    </h3>
                    <div className="flex items-center text-base md:text-lg text-gray-500 font-medium">
                      <span className="mr-2 text-2xl md:text-3xl">
                        {getTrigramSymbol(hexagramResult.upperTrigram)}
                      </span>
                      <span className="mr-2">
                        {
                          t.trigrams[
                            hexagramResult.upperTrigram as keyof typeof t.trigrams
                          ]
                        }{" "}
                        {t.over},
                      </span>
                      <span className="mr-2 text-2xl md:text-3xl">
                        {getTrigramSymbol(hexagramResult.lowerTrigram)}
                      </span>
                      <span>
                        {
                          t.trigrams[
                            hexagramResult.lowerTrigram as keyof typeof t.trigrams
                          ]
                        }{" "}
                        {t.below}
                      </span>
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
                    {t.viewFullInterpretation}
                  </button>
                </div>

                <div className="text-center pt-4">
                  <button
                    onClick={handleBackToCasting}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-full transition-colors font-medium"
                  >
                    {t.buttons.back}
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
