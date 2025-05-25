"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  VideoFeature,
  ControlParameter,
} from "@/types/blocks/video-feature-showcase";
import { Play, Pause, Settings, Zap } from "lucide-react";

interface ControlPanelProps {
  feature: VideoFeature;
  isPlaying: boolean;
  onPlayStateChange: (playing: boolean) => void;
}

export function ControlPanel({
  feature,
  isPlaying,
  onPlayStateChange,
}: ControlPanelProps) {
  const [parameterValues, setParameterValues] = useState<Record<string, any>>(
    () => {
      const initial: Record<string, any> = {};
      feature.controlParameters.forEach((param) => {
        initial[param.id] = param.defaultValue;
      });
      return initial;
    }
  );

  const updateParameter = (id: string, value: any) => {
    setParameterValues((prev) => ({ ...prev, [id]: value }));
  };

  const renderControl = (param: ControlParameter) => {
    const value = parameterValues[param.id];

    switch (param.type) {
      case "slider":
        return (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">{param.label}</Label>
              <Badge variant="outline" className="text-xs">
                {value}
                {param.unit || ""}
              </Badge>
            </div>
            <Slider
              value={[Number(value)]}
              onValueChange={(values: number[]) =>
                updateParameter(param.id, values[0])
              }
              min={param.min || 0}
              max={param.max || 100}
              step={param.step || 1}
              className="w-full"
            />
            {param.description && (
              <p className="text-xs text-muted-foreground">
                {param.description}
              </p>
            )}
          </div>
        );

      case "toggle":
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{param.label}</Label>
              <Switch
                checked={Boolean(value)}
                onCheckedChange={(checked) =>
                  updateParameter(param.id, checked)
                }
              />
            </div>
            {param.description && (
              <p className="text-xs text-muted-foreground">
                {param.description}
              </p>
            )}
          </div>
        );

      case "select":
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{param.label}</Label>
            <Select
              value={String(value)}
              onValueChange={(newValue) => updateParameter(param.id, newValue)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {param.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {param.description && (
              <p className="text-xs text-muted-foreground">
                {param.description}
              </p>
            )}
          </div>
        );

      case "input":
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{param.label}</Label>
            <Input
              value={String(value)}
              onChange={(e) => updateParameter(param.id, e.target.value)}
              placeholder={param.description}
              className="w-full"
            />
            {param.description && (
              <p className="text-xs text-muted-foreground">
                {param.description}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          {feature.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {feature.description}
        </p>
      </div>

      {/* Main Control Area */}
      <div className="flex-1 space-y-6">
        {/* Play Controls */}
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Quick Controls</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => onPlayStateChange(!isPlaying)}
              className="w-full"
              variant={isPlaying ? "default" : "outline"}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Play Demo
                </>
              )}
            </Button>

            <Button variant="outline" className="w-full">
              Generate New
            </Button>
          </div>
        </Card>

        {/* Parameter Controls */}
        {feature.controlParameters.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Adjustable Parameters
            </h4>

            <div className="space-y-6">
              {feature.controlParameters.map((param) => (
                <div key={param.id}>{renderControl(param)}</div>
              ))}
            </div>
          </div>
        )}

        {/* Feature Highlights */}
        {feature.highlights.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Key Highlights
            </h4>
            <div className="space-y-2">
              {feature.highlights.map((highlight, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{highlight}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="mt-6 pt-4 border-t">
        <Button className="w-full" size="lg">
          Try This Feature
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Experience {feature.navLabel} in action
        </p>
      </div>
    </div>
  );
}
