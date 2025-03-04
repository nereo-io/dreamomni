// app/api/chat/route.ts
import { ChatPromptService } from "@/services/chat/chatPromptService";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { streamText, generateText } from "ai";
import { BaziFastApiService } from "@/services/chat/baziAPIService";
import { getGenerateContentPrompt } from "@/i18n/prompts/generate-content";
import { respErr, respData } from "@/lib/resp";
import { Message, MessageRole } from "@/types/chat";

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY ?? "",
});

const deepseekARK = createDeepSeek({
  apiKey: process.env.ARK_API_KEY ?? "",
  baseURL: "https://ark.cn-beijing.volces.com/api/v3",
});

const deepseekALI = createDeepSeek({
  apiKey: process.env.ALI_API_KEY ?? "",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

export async function POST(req: Request) {
  try {
    const { question, locale } = await req.json();
    const customer_info = {
      id: "1",
      userUuid: "1",
      gender: "male",
      birthYear: 1990,
      birthMonth: 1,
      birthDay: 1,
      birthHour: 1,
      name: "Tom",
      relationshipStatus: "single",
      jobStatus: "employed",
      additionalInfo: "Tom is a software engineer",
    };

    try {
      const baziAnalysis = await BaziFastApiService.getAnalysisForCustomer(
        customer_info
      );
      const systemPrompt = getGenerateContentPrompt(
        locale,
        customer_info,
        baziAnalysis
      );
      const messages = [
        {
          role: "user" as MessageRole,
          content: question,
        },
      ];
      const messageHistory = ChatPromptService.buildMessageHistory(
        systemPrompt,
        messages
      );
      // console.log("systemPrompt: ", systemPrompt);

      const text = await generateText({
        model: deepseekARK("ep-20250205155325-bsdb5"), //r1
        // model: deepseekARK("ep-20250208110123-np259"), // deepseek-qwen-32B
        // model: deepseekARK("ep-20250228181734-xc4qb"), // doubao-lite
        // model: deepseekALI('deepseek-r1'),
        // model: deepseekALI("qwen-max-latest"),
        // model: deepseekALI("qwen2.5-vl-7b-instruct"),
        messages: messageHistory,
        maxTokens: 8000,
      });
      console.log("text: ", text.text);
      return respData(text.text);
    } catch (e: any) {
      console.log("generate content failed: ", e);
      return respErr("generate content failed: " + e.message);
    }
  } catch (e: any) {
    console.log("chat failed: ", e);
    return respErr("chat failed: " + e.message);
  }
}
