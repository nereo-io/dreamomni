// 加载环境变量
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.development" });
import { generateText } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createQuestion } from "@/models/question";
import { SiDeluge } from "react-icons/si";

type QuestionCard = {
  subject: string;
  question: string;
  tags: string[];
};

const deepseek = createDeepSeek({
  apiKey: "sk-43072ca60a7b47c98a08ccbef42b170a",
});
const deepseekALI = createDeepSeek({
  apiKey: "sk-8514df8de24d4eaa80b05790aa0db00b",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

// 问题卡片数据
// 问题卡片数据
const questionCards: QuestionCard[] = [
  {
    subject: "chinese-zodiac",
    question: "1991年出生属羊在2025年运势如何?",
    tags: ["1991", "goat"],
  },
];

// 提取并解析 JSON 字符串
function extractAndParseJSON(text: string) {
  try {
    // 尝试直接解析（如果已经是 JSON 字符串）
    return JSON.parse(text);
  } catch (e) {
    try {
      // 尝试提取 JSON 代码块
      const jsonRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
      const match = text.match(jsonRegex);

      if (match && match[1]) {
        return JSON.parse(match[1]);
      }

      // 尝试提取任何看起来像 JSON 对象的内容
      const objectRegex = /\{[\s\S]*?\}/;
      const objectMatch = text.match(objectRegex);

      if (objectMatch) {
        return JSON.parse(objectMatch[0]);
      }
    } catch (innerError) {
      console.error("JSON 解析错误:", innerError);
    }

    console.error("无法从文本中提取 JSON:", text);
    // 返回默认值
    return {
      slug: "default-slug",
      reading_type: "single",
      tags: ["默认标签"],
      locale: "zh",
    };
  }
}

async function main() {
  // 逐个处理每个问题卡片
  for (const card of questionCards) {
    console.log(
      `处理问题: ${card.subject} - ${card.question.substring(0, 30)}...`
    );

    try {
      // 1. 请求大模型返回结果
      const { text, reasoning } = await generateText({
        // model: deepseek("deepseek-reasoner"),
        model: deepseekALI("deepseek-r1"),
        // model: deepseekALI("qwen-max-latest"),
        system: `你是一个专业的八字命理师清风明月，擅长帮助用户答疑解惑。
        1）采用通俗易懂的方式详细回答用户的的问题，不要问用户要命盘，讲清楚问题背后中国命理的原理和方法
        2）如果需要的话，可以举例说明，先简单说一下举例的命盘，再给出分析
        3）用英文回答
        4）今年是2025年`,
        messages: [
          {
            role: "user",
            content: card.question,
          },
        ],
      });

      // 2. 请求大模型返回附加信息
      const { text: text_addition } = await generateText({
        // model: deepseek("deepseek-reasoner"),
        model: deepseekALI("qwen-max-latest"),
        system: `你是一个专业的命理师清风明月，擅长根据八字分析人的运势和性格。
          基于用户的问题，返回一个附加信息，附加信息返回的规则是
          1. slug。基于用户的问题统一转换成英文，生成最少由5个英文单词，最多不超过8个组成的slug，通过-连接
          2. reading_type。明确一下这是否是一个双人匹配的问题，需要有两个人生辰信息。如果是的，返回"double"，如果不是，返回"single
          3. locale：判断一下用户的问题，如果是简体中文，返回"zh"；如果是繁体中文，返回"zh-tw"；如果是英文，返回"en"

          
          最后用json格式返回，不要用其他文字描述
          {
            "slug": "slug",
            "reading_type": "single",
            "locale": "en"
          }
          `,
        messages: [
          {
            role: "user",
            content: card.question,
          },
        ],
      });
      console.log("text_addition", text_addition);
      const text_addition_json = extractAndParseJSON(text_addition);
      //   const text_addition_json = JSON.parse(text_addition);
      console.log("text_addition_json", text_addition_json);

      // 2. 转换成questionData
      const questionData = {
        title: card.question,
        content: text,
        tags: card.tags,
        author_name: "清风明月",
        author_avatar_url: "/qingfeng.png",
        category: card.subject,
        locale: "en",
        slug: text_addition_json.slug,
        reading_type: text_addition_json.reading_type,
        rating: 100,
        votes: Math.floor(Math.random() * 10),
      };

      // 3. 使用createQuestion将数据保存到数据库中
      const savedQuestion = await createQuestion(questionData);

      console.log(`问题已保存，ID: ${savedQuestion ? "成功" : "失败"}`);
      console.log(
        `分析推理: ${reasoning?.substring(0, 100) || "无推理数据"}...`
      );
      console.log(`回答内容: ${text.substring(0, 100)}...`);
      console.log("-----------------------------------");

      // 添加延迟，避免API请求过于频繁
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`处理问题时出错: ${card.subject}`, error);
    }
  }

  console.log("所有问题处理完成！");
}

main().catch((error) => {
  console.error("执行过程中发生错误:", error);
});
