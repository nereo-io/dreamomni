// 加载环境变量
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.development" });
import { generateText } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createQuestion } from "@/models/question";
import * as fs from "fs";
import { flushAllTraces } from "next/dist/trace";

type QuestionCard = {
  subject: string;
  question: string;
  tags: string[];
};

const deepseek = createDeepSeek({
  apiKey: "sk-43072ca60a7b47c98a08ccbef42b170a",
});
const deepseekALI = createDeepSeek({
  apiKey: "sk-ce6b687683f54e5aaf806cf66eab2f69",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});
const deepseekARK = createDeepSeek({
  apiKey: process.env.ARK_API_KEY ?? "",
  baseURL: "https://ark.cn-beijing.volces.com/api/v3",
});

// 生成从1944年到2023年的所有生肖问题
function generateZodiacQuestions(): QuestionCard[] {
  const zodiacSigns = [
    "Monkey",
    "Rooster",
    "Dog",
    "Pig",
    "Rat",
    "Ox",
    "Tiger",
    "Rabbit",
    "Dragon",
    "Snake",
    "Horse",
    "Goat",
  ];

  const zodiacChineseSigns = [
    "猴",
    "鸡",
    "狗",
    "猪",
    "鼠",
    "牛",
    "虎",
    "兔",
    "龙",
    "蛇",
    "马",
    "羊",
  ];

  const questions: QuestionCard[] = [];

  for (let year = 1944; year <= 2023; year++) {
    const zodiacIndex = year % 12;
    const zodiacSign = zodiacSigns[zodiacIndex];
    const chineseZodiacSign = zodiacChineseSigns[zodiacIndex];

    questions.push({
      subject: "chinese-zodiac",
      question: `What is the 2025 fortune forecast for those born in the Year of the ${zodiacSign} in ${year}?`,
      tags: [
        year.toString(),
        zodiacSign.toLowerCase(),
        "chinese-zodiac",
        "2025-forecast",
      ],
    });
  }

  return questions;
}

// 中国五行元素对应表
function getElement(year: number): string {
  const elements = ["Wood", "Fire", "Earth", "Metal", "Water"];
  const elementIndex = Math.floor(((year - 4) % 10) / 2);
  return elements[elementIndex];
}

// 从年份获取生肖
function getZodiacSign(year: number): string {
  const zodiacSigns = [
    "Monkey",
    "Rooster",
    "Dog",
    "Pig",
    "Rat",
    "Ox",
    "Tiger",
    "Rabbit",
    "Dragon",
    "Snake",
    "Horse",
    "Goat",
  ];
  return zodiacSigns[year % 12];
}

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
      console.error("JSON parsing error:", innerError);
    }

    console.error("Unable to extract JSON from text:", text);
    // 返回默认值
    return {
      slug: "default-slug",
      reading_type: "single",
      tags: ["default-tag"],
      locale: "en",
    };
  }
}

async function main() {
  // 生成所有生肖问题
  const allQuestionCards = generateZodiacQuestions();

  // 是否只处理一部分问题(用于测试)
  const isTestMode = false;
  // 选择要处理的问题卡片
  const questionCards = isTestMode
    ? allQuestionCards.slice(0, 2)
    : allQuestionCards;

  console.log(`Total questions to process: ${questionCards.length}`);

  // 创建日志文件
  const logStream = fs.createWriteStream("zodiac-content-generation.log", {
    flags: "a",
  });
  logStream.write(
    `Content generation started at ${new Date().toISOString()}\n`
  );

  // 逐个处理每个问题卡片
  for (const card of questionCards) {
    console.log(`Processing question: ${card.subject} - ${card.question}`);
    logStream.write(`\nProcessing: ${card.question}\n`);

    try {
      // 从问题中提取年份和生肖
      const year = parseInt(card.tags[0]);
      const zodiacSign = getZodiacSign(year);
      const element = getElement(year);

      // 创建针对SEO优化的提示
      const seoOptimizedPrompt = `
2025 Fortune Forecast: What awaits those born in the Year of the ${zodiacSign} (${year})

## Introduction:
Born in ${year}, people under the ${element} ${zodiacSign} sign have distinctive characteristics that influence their life path. Let me share how 2025 will unfold for them in terms of career, finances, health, and relationships.

## Basic Characteristics of ${year} ${zodiacSign}:
- Explore personality traits of ${element} ${zodiacSign}
- Analyze how their ${element} element influences their character
- Discuss how these traits affect their decision-making

## Overall 2025 Fortune:
- Overall energy patterns for ${zodiacSign} in 2025
- Key opportunities to embrace
- Potential challenges to navigate

## Career Prospects:
- Professional outlook for 2025
- Favorable career paths and projects
- Strategic advice for workplace success
- Potential challenges and solutions

## Financial Forecast:
- Money matters in 2025
- Investment opportunities
- Financial risks to avoid
- Best timing for major financial decisions

## Health Outlook:
- Physical wellbeing forecast
- Mental and emotional health considerations
- Preventative health recommendations
- Balance maintenance strategies

## Relationship Forecast:
- Social and family relationship developments
- Love and marriage prospects
- Advice for improving relationships
- Most compatible signs for ${zodiacSign} in 2025

## Lucky Elements:
- Favorable colors
- Lucky numbers and directions
- Recommended talismans or items
- Best seasons or months

## Strategies to Enhance Fortune:
- Practical advice to maximize positive energy
- Lifestyle adjustments
- Mindset recommendations
- Traditional practices to consider

## Conclusion:
- Summary of key opportunities and challenges
- Positive encouragement for the year ahead
- Prompt users to use Bazi AI Reading Toll for more personalized insights
`;

      // 1. 请求大模型返回结果
      const { text, reasoning } = await generateText({
        model: deepseekALI("deepseek-r1"),
        // model: deepseekARK("ep-20250205155325-bsdb5"), //r1
        // model: deepseekARK("ep-20250208110123-np259"), // deepseek-qwen-32B
        // model: deepseekARK("ep-20250228181734-xc4qb"), // doubao-lite
        // model: deepseekALI('deepseek-r1'),
        system: `You are Master Qing Feng, a renowned expert in Chinese astrology and fortune telling.

Your task is to write a comprehensive, SEO-optimized article about the 2025 fortune forecast for people born in a specific Chinese zodiac year. 

Guidelines:
1) Write in fluent, professional English suited for international readers interested in Chinese astrology
2) Explain Chinese astrology concepts clearly for western audiences
3) Create engaging, detailed content that's valuable and shareable
4) Include relevant keywords naturally throughout the text
5) Format the article with proper headings and structure
6) Maintain a tone that is knowledgeable but accessible
7) The current year is 2025
8) Aim for approximately 1500-2000 words of comprehensive content

Important note: 
- Do not add any metadata at the end of the article, such as word count, SEO keyword lists, etc.
- End the article with a natural conclusion paragraph that seamlessly incorporates a suggestion to use the Bazi analysis tool for personalized insights, without using section headings like "Call to Action" or explicitly labeling it as such.

The article should be informative, authoritative, and optimized for search engines while providing genuine value to readers.`,
        messages: [
          {
            role: "user",
            content: seoOptimizedPrompt,
          },
        ],
      });

      // 2. 请求大模型返回附加信息
      const { text: text_addition } = await generateText({
        model: deepseekALI("qwen-max-latest"),
        system: `You are an SEO expert specializing in extracting and optimizing article metadata.
        
I will provide you with a complete article about Chinese zodiac forecasts. Your task is to:

1. Analyze the article's structure and content carefully
2. Extract the most relevant H1/H2 headings from the markdown format
3. Based on these headings and content, create:
   - A compelling title under 60 characters that includes birth year, zodiac sign and "2025 forecast"
   - An engaging description under 160 characters that summarizes the key predictions

FORMAT YOUR RESPONSE AS JSON ONLY:
{
  "title": "Your extracted and optimized title here",
  "description": "Your extracted and optimized description here"
}

Focus on clarity, keywords, and search intent. Do not add any explanations or extra text.`,
        messages: [
          {
            role: "user",
            content: text,
          },
        ],
      });

      console.log("Metadata generated:", text_addition);
      const metadata = extractAndParseJSON(text_addition);
      console.log("Parsed metadata:", metadata);

      // 3. 转换成questionData
      const questionData = {
        title:
          metadata.title ||
          `2025 ${zodiacSign} (${year}) Fortune Forecast: Career, Love & Wealth`,
        description:
          metadata.description ||
          `Discover what 2025 holds for those born in the Year of the ${zodiacSign} (${year}). Comprehensive forecast covering career, love, health and wealth.`,
        content: text,
        cover_url: `/imgs/zodiac/${zodiacSign.toLowerCase()}.png`,
        tags: card.tags,
        author_name: "Master Qing Feng",
        author_avatar_url: "/qingfeng.png",
        category: card.subject,
        locale: "en",
        slug: `${year}-${card.tags[1]}-fortune-forecast-2025`,
        reading_type: "single",
        rating: 100,
        votes: Math.floor(Math.random() * 20) + 5,
      };

      // 4. 保存日志
      logStream.write(`Generated content for: ${card.question}\n`);
      logStream.write(`Slug: ${questionData.slug}\n`);
      logStream.write(`Meta title: ${questionData.title}\n`);
      logStream.write(`Content length: ${text.length} characters\n`);

      // 5. 使用createQuestion将数据保存到数据库中
      const savedQuestion = await createQuestion(questionData);

      console.log(
        `Question saved, ID: ${savedQuestion ? "Success" : "Failed"}`
      );
      console.log(
        `Analysis reasoning: ${
          reasoning?.substring(0, 100) || "No reasoning data"
        }...`
      );
      console.log(`Answer content (preview): ${text.substring(0, 100)}...`);
      console.log("-----------------------------------");

      // 添加延迟，避免API请求过于频繁
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error) {
      console.error(`Error processing question: ${card.subject}`, error);
      logStream.write(`ERROR: Failed to process ${card.question}: ${error}\n`);
    }
  }

  logStream.write(
    `Content generation completed at ${new Date().toISOString()}\n`
  );
  logStream.end();
  console.log("All questions processed!");
}

main().catch((error) => {
  console.error("Error during execution:", error);
});
