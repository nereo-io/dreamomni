"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getVideoModel } from "@/config/video-models";

interface ModelUsage {
  model_id: string;
  count: number;
  percentage: number;
}

interface ModelUsageChartProps {
  data: ModelUsage[];
  title?: string;
}

export default function ModelUsageChart({
  data,
  title = "Model Usage Statistics",
}: ModelUsageChartProps) {
  const chartData = data.map((item) => {
    const modelConfig = getVideoModel(item.model_id);
    return {
      ...item,
      displayName: modelConfig?.displayName || item.model_id,
      fullName: modelConfig?.name || item.model_id,
      type: modelConfig?.type || "unknown",
      description: modelConfig?.description || "",
    };
  });

  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No usage data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <div className="text-sm text-gray-600">Total generations: {total}</div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {chartData.map((item, index) => (
            <div
              key={item.model_id}
              className="space-y-2 p-4 border rounded-lg hover:bg-gray-50/50 transition-colors"
            >
              {/* Model Info Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{item.displayName}</span>
                    {item.description && (
                      <span className="text-xs text-gray-500">
                        {item.description}
                      </span>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {item.type}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {item.percentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">{item.count} uses</div>
                </div>
              </div>

              {/* Progress Bar */}
              <Progress value={item.percentage} className="h-2" />
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="text-sm font-medium text-blue-800 mb-2">
            Usage Summary
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="text-center">
              <div className="text-blue-600 font-semibold">{total}</div>
              <div className="text-blue-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-blue-600 font-semibold">{data.length}</div>
              <div className="text-blue-500">Models</div>
            </div>
            {data[0] && (
              <div className="text-center">
                <div className="text-blue-600 font-semibold">
                  {data[0].count}
                </div>
                <div className="text-blue-500">Top Usage</div>
              </div>
            )}
            {data[0] && (
              <div className="text-center">
                <div className="text-blue-600 font-semibold">
                  {data[0].percentage.toFixed(1)}%
                </div>
                <div className="text-blue-500">Top Share</div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
