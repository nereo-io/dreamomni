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
  // Love Questions - 爱情问题
  {
    subject: "love",
    question: "When will I meet my soulmate according to my birth chart?",
    tags: ["soulmate", "love timing", "astrology", "relationship", "destiny"],
  },
  {
    subject: "love",
    question:
      "Is my current relationship destined for marriage based on our birth charts?",
    tags: [
      "marriage potential",
      "relationship destiny",
      "compatibility",
      "astrology",
      "commitment",
    ],
  },
  {
    subject: "love",
    question:
      "How compatible are we based on our birth charts and zodiac signs?",
    tags: [
      "compatibility",
      "zodiac compatibility",
      "birth chart comparison",
      "relationship harmony",
      "astrological match",
    ],
  },
  {
    subject: "love",
    question:
      "What love challenges will I face this year according to my astrological chart?",
    tags: [
      "love challenges",
      "relationship obstacles",
      "emotional growth",
      "astrology",
      "forewarning",
    ],
  },
  {
    subject: "love",
    question:
      "How can I attract a more fulfilling relationship based on my birth chart?",
    tags: [
      "attraction",
      "fulfilling relationship",
      "love manifestation",
      "astrology",
      "emotional fulfillment",
    ],
  },
  {
    subject: "love",
    question:
      "Why do I keep attracting the wrong partners according to my astrological profile?",
    tags: [
      "relationship patterns",
      "wrong partners",
      "self-reflection",
      "astrology",
      "emotional growth",
    ],
  },
  {
    subject: "love",
    question:
      "When is the best time for me to get married according to my birth chart?",
    tags: [
      "marriage timing",
      "wedding date",
      "auspicious timing",
      "astrology",
      "commitment",
    ],
  },
  {
    subject: "love",
    question:
      "How will my love life change after this breakup according to astrology?",
    tags: [
      "post-breakup",
      "love forecast",
      "moving on",
      "emotional healing",
      "new beginnings",
    ],
  },
  {
    subject: "love",
    question:
      "What type of partner is most compatible with me based on my birth chart?",
    tags: [
      "compatible partner",
      "ideal match",
      "relationship harmony",
      "astrology",
      "partner traits",
    ],
  },
  {
    subject: "love",
    question:
      "How can I improve communication in my relationship based on our astrological profiles?",
    tags: [
      "relationship communication",
      "couple harmony",
      "astrology",
      "emotional connection",
      "understanding",
    ],
  },
  {
    subject: "love",
    question:
      "Is long-distance relationship viable for us according to our birth charts?",
    tags: [
      "long-distance relationship",
      "relationship challenges",
      "astrology",
      "commitment",
      "relationship endurance",
    ],
  },
  {
    subject: "love",
    question:
      "Will my ex and I reconcile according to our astrological compatibility?",
    tags: [
      "reconciliation",
      "ex-partner",
      "second chances",
      "astrology",
      "relationship destiny",
    ],
  },
  {
    subject: "love",
    question:
      "How do our moon signs affect our emotional compatibility in a relationship?",
    tags: [
      "moon signs",
      "emotional compatibility",
      "astrology",
      "relationship depth",
      "understanding",
    ],
  },
  {
    subject: "love",
    question:
      "What role does Venus play in my love life according to my birth chart?",
    tags: [
      "Venus influence",
      "love planet",
      "astrology",
      "romantic nature",
      "attraction patterns",
    ],
  },
  {
    subject: "love",
    question:
      "How can I heal from past relationship trauma according to my birth chart?",
    tags: [
      "relationship healing",
      "emotional trauma",
      "moving forward",
      "astrology",
      "personal growth",
    ],
  },

  // Health Questions - 健康问题
  {
    subject: "health",
    question:
      "What health issues should I be aware of according to my birth chart?",
    tags: [
      "health awareness",
      "prevention",
      "astrology",
      "wellbeing",
      "medical astrology",
    ],
  },
  {
    subject: "health",
    question:
      "How can I improve my energy levels based on my astrological profile?",
    tags: [
      "energy improvement",
      "vitality",
      "astrology",
      "wellbeing",
      "lifestyle adjustment",
    ],
  },
  {
    subject: "health",
    question:
      "What exercise routine is best suited for my birth chart and body type?",
    tags: [
      "exercise routine",
      "fitness",
      "astrology",
      "physical wellbeing",
      "body harmony",
    ],
  },
  {
    subject: "health",
    question:
      "How will my mental health evolve this year according to my astrological chart?",
    tags: [
      "mental health",
      "emotional wellbeing",
      "astrology",
      "psychological forecast",
      "mind harmony",
    ],
  },
  {
    subject: "health",
    question:
      "Which healing modalities are most effective for me based on my birth chart?",
    tags: [
      "healing modalities",
      "alternative medicine",
      "astrology",
      "treatment compatibility",
      "wellness approach",
    ],
  },
  {
    subject: "health",
    question:
      "What dietary changes would benefit my health according to my astrological profile?",
    tags: [
      "dietary changes",
      "nutrition",
      "astrology",
      "physical wellbeing",
      "body harmony",
    ],
  },
  {
    subject: "health",
    question: "How can I achieve better sleep quality based on my birth chart?",
    tags: [
      "sleep quality",
      "rest patterns",
      "astrology",
      "wellbeing",
      "circadian rhythm",
    ],
  },
  {
    subject: "health",
    question:
      "What stress management techniques work best for my astrological sign?",
    tags: [
      "stress management",
      "emotional balance",
      "astrology",
      "wellbeing",
      "mental health",
    ],
  },
  {
    subject: "health",
    question:
      "How does my birth chart affect my susceptibility to specific health conditions?",
    tags: [
      "health susceptibility",
      "medical astrology",
      "prevention",
      "wellbeing",
      "body awareness",
    ],
  },
  {
    subject: "health",
    question:
      "What is the best time for medical procedures according to my astrological chart?",
    tags: [
      "medical timing",
      "surgery dates",
      "astrology",
      "health decisions",
      "auspicious timing",
    ],
  },
  {
    subject: "health",
    question:
      "How can I balance my hormones naturally based on my birth chart?",
    tags: [
      "hormone balance",
      "natural health",
      "astrology",
      "endocrine system",
      "body harmony",
    ],
  },
  {
    subject: "health",
    question:
      "What impact will the planetary movements have on my immunity this year?",
    tags: [
      "immunity",
      "planetary influence",
      "astrology",
      "health forecast",
      "disease prevention",
    ],
  },
  {
    subject: "health",
    question:
      "How can I address chronic pain issues based on my astrological profile?",
    tags: [
      "chronic pain",
      "pain management",
      "astrology",
      "wellbeing",
      "healing approach",
    ],
  },
  {
    subject: "health",
    question:
      "What fertility insights can my birth chart provide if I'm trying to conceive?",
    tags: [
      "fertility",
      "conception",
      "astrology",
      "family planning",
      "reproductive health",
    ],
  },
  {
    subject: "health",
    question:
      "How can I achieve optimal weight for my body type according to astrology?",
    tags: [
      "weight management",
      "body type",
      "astrology",
      "physical wellbeing",
      "balanced approach",
    ],
  },

  // 2025 Forecast Questions - 2025年预测问题
  {
    subject: "2025-forecast",
    question:
      "What major life changes can I expect in 2025 according to my birth chart?",
    tags: [
      "2025 changes",
      "life transitions",
      "yearly forecast",
      "astrology",
      "future prediction",
    ],
  },
  {
    subject: "2025-forecast",
    question:
      "How will my financial situation evolve in 2025 based on astrological predictions?",
    tags: [
      "2025 finances",
      "money forecast",
      "wealth prediction",
      "astrology",
      "financial planning",
    ],
  },
  {
    subject: "2025-forecast",
    question:
      "What relationship developments can I expect in 2025 according to astrology?",
    tags: [
      "2025 relationships",
      "love forecast",
      "connection changes",
      "astrology",
      "future prediction",
    ],
  },
  {
    subject: "2025-forecast",
    question:
      "Which months of 2025 will be most fortunate for me based on my birth chart?",
    tags: [
      "fortunate months 2025",
      "auspicious timing",
      "yearly cycle",
      "astrology",
      "opportunity periods",
    ],
  },
  {
    subject: "2025-forecast",
    question:
      "What career opportunities should I look for in 2025 according to astrology?",
    tags: [
      "2025 career",
      "professional opportunities",
      "job forecast",
      "astrology",
      "future prediction",
    ],
  },
  {
    subject: "2025-forecast",
    question:
      "How will my health trends change in 2025 based on my astrological chart?",
    tags: [
      "2025 health",
      "wellbeing forecast",
      "medical astrology",
      "physical changes",
      "future prediction",
    ],
  },
  {
    subject: "2025-forecast",
    question:
      "What personal growth opportunities will 2025 bring according to my birth chart?",
    tags: [
      "personal growth 2025",
      "self-development",
      "spiritual evolution",
      "astrology",
      "inner journey",
    ],
  },
  {
    subject: "2025-forecast",
    question: "How will planetary retrogrades in 2025 affect my life path?",
    tags: [
      "2025 retrogrades",
      "planetary influence",
      "life disruption",
      "astrology",
      "timing awareness",
    ],
  },
  {
    subject: "2025-forecast",
    question:
      "What travel opportunities will arise for me in 2025 according to astrology?",
    tags: [
      "2025 travel",
      "journey forecast",
      "exploration",
      "astrology",
      "geographical movement",
    ],
  },
  {
    subject: "2025-forecast",
    question:
      "How can I best prepare for the challenges of 2025 based on my birth chart?",
    tags: [
      "2025 preparation",
      "challenge management",
      "future planning",
      "astrology",
      "resilience building",
    ],
  },
  {
    subject: "2025-forecast",
    question:
      "What spiritual awakening might I experience in 2025 according to astrology?",
    tags: [
      "spiritual awakening 2025",
      "consciousness expansion",
      "inner growth",
      "astrology",
      "soul journey",
    ],
  },
  {
    subject: "2025-forecast",
    question:
      "How will my family dynamics change in 2025 based on astrological forecasts?",
    tags: [
      "family changes 2025",
      "home life",
      "relationship dynamics",
      "astrology",
      "domestic prediction",
    ],
  },
  {
    subject: "2025-forecast",
    question:
      "What new skills should I develop in 2025 according to my birth chart?",
    tags: [
      "2025 skill development",
      "learning opportunities",
      "self-improvement",
      "astrology",
      "capability expansion",
    ],
  },
  {
    subject: "2025-forecast",
    question:
      "How will the 2025 eclipse season impact my personal and professional life?",
    tags: [
      "2025 eclipses",
      "astrological events",
      "life impact",
      "transformation periods",
      "cosmic influence",
    ],
  },
  {
    subject: "2025-forecast",
    question:
      "What major decisions should I avoid making in 2025 according to astrology?",
    tags: [
      "2025 cautions",
      "decision timing",
      "auspicious periods",
      "astrology",
      "risk management",
    ],
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
