import fs from "fs";
import path from "path";
import {
  SuggestedQuestion,
  QuestionSuggestions,
} from "../types/blocks/question-suggestions";

/**
 * 获取建议问题列表
 * @param locale 语言区域
 * @returns QuestionSuggestions对象，包含categories和questions
 */
export const getSuggestedQuestions = (locale: string): QuestionSuggestions => {
  try {
    // 读取对应语言的问题配置文件
    const filePath = path.join(
      process.cwd(),
      `i18n/content/question-sug/${locale}.json`
    );
    const fileContent = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(fileContent);

    // 从数据中提取问题
    const questions = data.questionSuggestions.questions;

    // 按reading_type分类问题
    const singleQuestions: SuggestedQuestion[] = [];
    const doubleQuestions: SuggestedQuestion[] = [];

    // 遍历问题并分类
    Object.keys(questions).forEach((key) => {
      const question = questions[key];
      // 添加id字段（使用键值）
      const questionWithId: SuggestedQuestion = {
        ...question,
        id: key,
      };

      if (question.reading_type === "single") {
        singleQuestions.push(questionWithId);
      } else if (question.reading_type === "double") {
        doubleQuestions.push(questionWithId);
      }
    });

    // 使用当前日期作为随机种子
    const today = new Date();
    const seed =
      today.getFullYear() * 10000 +
      (today.getMonth() + 1) * 100 +
      today.getDate();

    // 选择2个single问题和2个double问题
    const selectedSingle = getWeightedRandomQuestions(singleQuestions, 3, seed);
    const selectedDouble = getWeightedRandomQuestions(
      doubleQuestions,
      3,
      seed + 1
    ); // 使用不同的种子

    // 合并结果并转换为所需的输出格式
    const selectedQuestions = [...selectedSingle, ...selectedDouble];

    // 创建符合QuestionSuggestions接口的返回对象
    const result: QuestionSuggestions = {
      categories: {
        all: "all",
      },
      questions: {},
    };

    // 将问题数组转换为对象格式
    selectedQuestions.forEach((question) => {
      if (question.id) {
        result.questions[question.id] = question;
      }
    });

    return result;
  } catch (error) {
    console.error(
      `Error getting suggested questions for locale ${locale}:`,
      error
    );
    return {
      categories: { all: "all" },
      questions: {},
    };
  }
};

/**
 * 基于优先级权重随机选择问题
 * @param questions 问题列表
 * @param count 需要选择的问题数量
 * @param seed 随机种子
 * @returns 选中的问题数组
 */
function getWeightedRandomQuestions(
  questions: SuggestedQuestion[],
  count: number,
  seed: number
): SuggestedQuestion[] {
  // 如果问题数量不足，则返回所有问题
  if (questions.length <= count) {
    return [...questions];
  }

  // 使用种子创建伪随机数生成器
  const seededRandom = createSeededRandom(seed);

  // 创建问题副本以避免修改原数组
  const questionsCopy = [...questions];
  const result: SuggestedQuestion[] = [];

  // 权重指数，用于放大权重差异
  // 使用2.58作为指数，使得(0.6/0.3)^2.58 ≈ 6
  const WEIGHT_EXPONENT = 2.58;

  // 计算总权重
  const calculateTotalWeight = (items: SuggestedQuestion[]) => {
    return items.reduce((sum, item) => {
      // 对优先级进行指数变换以放大差异
      const priority = item.priority || 0.5;
      const transformedWeight = Math.pow(priority, WEIGHT_EXPONENT);
      return sum + transformedWeight;
    }, 0);
  };

  // 选择指定数量的问题
  for (let i = 0; i < count; i++) {
    if (questionsCopy.length === 0) break;

    const totalWeight = calculateTotalWeight(questionsCopy);
    // 生成一个0到totalWeight之间的随机数
    let randomWeight = seededRandom() * totalWeight;

    // 根据权重选择问题
    for (let j = 0; j < questionsCopy.length; j++) {
      const basePriority = questionsCopy[j].priority || 0.5;
      const transformedWeight = Math.pow(basePriority, WEIGHT_EXPONENT);

      if (randomWeight < transformedWeight) {
        // 选中当前问题
        result.push(questionsCopy[j]);
        // 从列表中移除已选问题
        questionsCopy.splice(j, 1);
        break;
      }
      randomWeight -= transformedWeight;
    }
  }

  return result;
}

/**
 * 创建基于种子的伪随机数生成器
 * @param seed 随机种子
 * @returns 返回0-1之间的随机数的函数
 */
function createSeededRandom(seed: number): () => number {
  return function () {
    // 简单的伪随机数生成算法（线性同余法）
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

export default {
  getSuggestedQuestions,
};
