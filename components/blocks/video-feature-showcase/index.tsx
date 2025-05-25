"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoPlayer } from "./video-player";
import { ControlPanel } from "./control-panel";
import { TechnicalSpecs } from "./technical-specs";
import { VideoFeatureShowcase as VideoFeatureShowcaseType } from "@/types/blocks/video-feature-showcase";

interface VideoFeatureShowcaseProps {
  data: VideoFeatureShowcaseType;
}

export default function VideoFeatureShowcase({
  data,
}: VideoFeatureShowcaseProps) {
  const [activeFeature, setActiveFeature] = useState(
    data.features[0]?.id || ""
  );
  const [isPlaying, setIsPlaying] = useState(false);

  const currentFeature =
    data.features.find((f: any) => f.id === activeFeature) || data.features[0];

  if (!data.features || data.features.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            {data.badge}
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            {data.title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {data.description}
          </p>
        </div>

        {/* Feature Navigation */}
        <Tabs
          value={activeFeature}
          onValueChange={setActiveFeature}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto p-1 bg-gray-100 dark:bg-gray-800">
            {data.features.map((feature: any) => (
              <TabsTrigger
                key={feature.id}
                value={feature.id}
                className="flex flex-col items-center p-3 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700"
              >
                <div className="text-2xl mb-1">{feature.icon}</div>
                <span className="text-xs text-center leading-tight">
                  {feature.navLabel}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Main Content Area */}
          {data.features.map((feature: any) => (
            <TabsContent key={feature.id} value={feature.id} className="mt-8">
              <Card className="overflow-hidden border-0 shadow-2xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                  {/* Video Display Area - 2/3 width */}
                  <div className="lg:col-span-2 bg-black relative">
                    <VideoPlayer
                      feature={feature}
                      isPlaying={isPlaying}
                      onPlayStateChange={setIsPlaying}
                    />
                  </div>

                  {/* Control Panel Area - 1/3 width */}
                  <div className="lg:col-span-1 bg-gray-50 dark:bg-gray-900 p-6">
                    <ControlPanel
                      feature={feature}
                      isPlaying={isPlaying}
                      onPlayStateChange={setIsPlaying}
                    />
                  </div>
                </div>

                {/* Technical Specifications */}
                <div className="p-6 bg-white dark:bg-gray-800 border-t">
                  <TechnicalSpecs feature={feature} />
                </div>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Button size="lg" className="px-8 py-3 text-lg">
            {data.ctaText}
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            {data.ctaSubtext}
          </p>
        </div>
      </div>
    </section>
  );
}
