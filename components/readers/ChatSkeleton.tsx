// ChatSkeleton 组件 - 可以添加到 ChatInterface.tsx 文件内或创建新文件
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const ChatSkeleton = () => {
  return (
    <div className="flex flex-col space-y-6 w-full">
      {/* AI 欢迎消息骨架 */}
      <div className="flex justify-start max-w-[92%]">
        <div className="bg-card/80 backdrop-blur-sm rounded-lg p-4 w-3/4 shadow-sm border border-border/30">
          <div className="space-y-3">
            <Skeleton className="h-3 w-[85%] rounded-full" />
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-[90%] rounded-full" />
            <Skeleton className="h-3 w-[60%] rounded-full" />
          </div>
        </div>
      </div>

      {/* 用户问题骨架
      <div className="flex justify-end max-w-[92%]">
        <div className="bg-primary/90 text-primary-foreground rounded-lg p-4 w-[85%] shadow-sm">
          <div className="space-y-2">
            <div className="h-3 bg-primary-foreground/20 rounded-full w-full animate-pulse"></div>
            <div className="h-3 bg-primary-foreground/20 rounded-full w-[75%] animate-pulse"></div>
          </div>
        </div>
      </div> */}

      {/* AI 回复骨架 - 更长更详细 */}
      <div className="flex justify-start max-w-[92%]">
        <div className="bg-card/80 backdrop-blur-sm rounded-lg p-4 w-[85%] shadow-sm border border-border/30">
          <div className="space-y-3">
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-[92%] rounded-full" />
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-[88%] rounded-full" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-3 w-[95%] rounded-full" />
              <Skeleton className="h-3 w-[90%] rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* 用户跟进问题骨架 */}
      {/* <div className="flex justify-end max-w-[92%]">
        <div className="bg-primary/90 text-primary-foreground rounded-lg p-4 w-[80%] shadow-sm">
          <div className="space-y-2">
            <div className="h-3 bg-primary-foreground/20 rounded-full w-[85%] animate-pulse"></div>
            <div className="h-3 bg-primary-foreground/20 rounded-full w-[60%] animate-pulse"></div>
          </div>
        </div>
      </div> */}

      {/* AI 最终回复骨架 */}
      <div className="flex justify-start max-w-[92%]">
        <div className="bg-card/80 backdrop-blur-sm rounded-lg p-4 w-[80%] shadow-sm border border-border/30">
          <div className="space-y-3">
            <Skeleton className="h-3 w-[92%] rounded-full" />
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-[85%] rounded-full" />
          </div>
        </div>
      </div>
      <div className="flex justify-start max-w-[92%]">
        <div className="bg-card/80 backdrop-blur-sm rounded-lg p-4 w-[80%] shadow-sm border border-border/30">
          <div className="space-y-3">
            <Skeleton className="h-3 w-[92%] rounded-full" />
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-[85%] rounded-full" />
          </div>
        </div>
      </div>
      <div className="flex justify-start max-w-[92%]">
        <div className="bg-card/80 backdrop-blur-sm rounded-lg p-4 w-[80%] shadow-sm border border-border/30">
          <div className="space-y-3">
            <Skeleton className="h-3 w-[92%] rounded-full" />
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-[85%] rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSkeleton;
