// 加载环境变量
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.development" });
import { generateText } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createQuestion } from "@/models/question";
import { SiDeluge } from "react-icons/si";

const deepseek = createDeepSeek({
  apiKey: "sk-43072ca60a7b47c98a08ccbef42b170a",
});
const deepseekALI = createDeepSeek({
  apiKey: "sk-8514df8de24d4eaa80b05790aa0db00b",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

// 问题卡片数据
const questionCards = [
  {
    subject: "love",
    question: "我和伴侣之间的关系如何发展？我们之间的缘分有多深？",
    tags: ["爱情", "婚姻", "缘分"],
  },
  {
    subject: "career",
    question: "明年我的事业会有怎样的发展？是否会有新的工作机会？",
    tags: ["事业", "工作", "机遇"],
  },
  {
    subject: "health",
    question: "我目前的健康状况如何？未来一年有哪些健康方面需要注意的地方？",
    tags: ["健康", "疾病", "预防"],
  },
  {
    subject: "life",
    question: "我今年的运势如何？有什么关键转折点需要把握？",
    tags: ["运势", "转折点", "把握"],
  },
  {
    subject: "chinese-zodiac",
    question:
      "作为属龙的人，我在2025年的运势如何？爱情、事业和财运有什么特别的机遇？",
    tags: ["运势", "机遇", "挑战"],
  },
  {
    subject: "love",
    question: "单身的我何时会遇到真爱？对方会是什么样的人？",
    tags: ["爱情", "缘分", "真爱"],
  },
  {
    subject: "career",
    question: "我适合创业吗？如果创业，什么行业更适合我的八字？",
    tags: ["创业", "行业", "八字"],
  },
  {
    subject: "health",
    question:
      "我的八字显示我有哪些健康隐患？如何通过改变生活习惯来避免这些问题？",
    tags: ["健康", "隐患", "生活习惯"],
  },
  {
    subject: "chinese-zodiac",
    question:
      "我是属牛的，与属虎的人在事业上合作会有怎样的相性？我们之间会有什么样的能量交流？",
    tags: ["合作", "相性", "能量"],
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
        model: deepseekALI("qwen-max-latest"),
        system:
          "你是一个专业的命理师清风明月，擅长根据八字分析人的运势和性格。",
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
          3. tags：针对用户的问题，提取一下tag，tag的语言与用户问题的语言保持一致，在2-4个之间
          4. locale：判断一下用户的问题，如果是简体中文，返回"zh"；如果是繁体中文，返回"zh-tw"；如果是英文，返回"en"

          
          最后用json格式返回，不要用其他文字描述
          {
            "slug": "slug",
            "reading_type": "single",
            "tags": ["tag1", "tag2", "tag3"],
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
        tags: text_addition_json.tags,
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
