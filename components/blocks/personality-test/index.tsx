"use client";

import { useState } from "react";
import CustomerInputFormSimple from "@/components/readers/CustomerInputFormSimple";
import { PersonalityTestPage } from "@/types/pages/personality-test";
import { ReaderPage } from "@/types/pages/reader";
import { PersonalityResult } from "./personality-result";
interface PersonalityTestProps {
  page: PersonalityTestPage;
  readerPage: ReaderPage;
}

export const PersonalityTest = ({ page, readerPage }: PersonalityTestProps) => {
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState<any>(null); // 用于存储计算结果

  // 处理用户提交的数据
  const handleSubmit = async (formData: any) => {
    try {
      // 调用计算服务
      const response = await calculatePersonalityResult(formData);
      // 保存计算结果
      setResultData(response);
      // 显示结果
      setShowResult(true);
    } catch (error) {
      console.error("计算个性测试结果时出错:", error);
      // 可以添加错误处理，例如显示错误提示
    }
  };
  // 计算个性测试结果的服务函数（后续实现）
  const calculatePersonalityResult = async (data: any) => {
    // 这里可以调用 API 或者进行本地计算
    // 示例：
    // const response = await fetch('/api/personality-test/calculate', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data)
    // });
    // return await response.json();

    // 暂时返回模拟数据
    return { type: "示例类型", description: "这是一个示例结果" };
  };

  return (
    <div className="container py-12">
      <div className="max-w-3xl mx-auto">
        <CustomerInputFormSimple
          messages={readerPage}
          type="self"
          onSuccess={handleSubmit}
        />
      </div>
      {showResult && resultData && (
        <PersonalityResult page={page} result={resultData} />
      )}
    </div>
  );
};
