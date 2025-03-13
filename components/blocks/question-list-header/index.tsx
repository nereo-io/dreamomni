import React from "react";
import { QuestionListHeader as QuestionListHeaderType } from "@/types/blocks/base";

export default function QuestionListHeader({
  questionListHeader,
}: {
  questionListHeader: QuestionListHeaderType;
}) {
  // const { title, description, action } = questionListHeader;
  return (
    <div className="container mx-auto">
      <div className="pt-16 pb-4 mb-2">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold lg:text-4xl">
              {questionListHeader.title}
            </h2>
            {questionListHeader.description && (
              <p className="mt-3 text-base max-w-3xl">
                {questionListHeader.description}
              </p>
            )}
          </div>
          {questionListHeader.action && <div>{questionListHeader.action}</div>}
        </div>
      </div>
    </div>
  );
}
