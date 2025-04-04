"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CustomerInputFormSimple from "@/components/readers/CustomerInputFormSimple";
import { PersonalityTestPage } from "@/types/pages/personality-test";
import { ReaderPage } from "@/types/pages/reader";

interface PersonalityResultProps {
  page: PersonalityTestPage;
  result: any;
}

export const PersonalityResult = ({ page, result }: PersonalityResultProps) => {
  const [showResult, setShowResult] = useState(true);

  const handleSubmitForm = (data: any) => {
    console.log("表单数据:", data);
    setShowResult(true);
  };

  return (
    <div className="container py-12">
      <div className="max-w-3xl mx-auto">
        {!showResult ? (
          <div className="space-y-6">
            <h1>Personality Result</h1>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                2
              </div>
              <h2 className="text-2xl font-bold">
                Your Bazi Personality Type Is...
              </h2>
            </div>

            <Card className="p-8 bg-[#f5f0e8] border-none">
              <div className="text-center space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-500"></div>
                    <h3 className="text-2xl font-bold text-purple-600">
                      You Are a Treasure Seeker
                    </h3>
                  </div>
                  <p className="text-gray-700">
                    Bold • Intuitive • Fast-moving
                  </p>
                </div>

                <blockquote className="text-lg italic text-gray-700">
                  "You act on instinct, not plans. You chase what others fear."
                </blockquote>

                <hr className="border-gray-300" />

                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">💡</span>
                  <p className="text-center text-gray-700">
                    Your type reflects your money mindset and life approach.
                    Ready to explore more?
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-3">
                    ✨ Career Reading →
                  </Button>
                  <Button className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-3">
                    💕 Love Compatibility →
                  </Button>
                  <Button className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-3">
                    🔮 2025 Forecast →
                  </Button>
                </div>

                <div className="mt-8">
                  <p className="text-center text-gray-700 mb-4">
                    Want to see what type your friends are?
                  </p>
                  <div className="flex justify-center">
                    <Button className="bg-purple-500 hover:bg-purple-600 text-white font-medium px-6 py-3">
                      Share Your Personality Card →
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
