"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { GenerationTypeSelector } from "./GenerationTypeSelector";
import { AudioUploader } from "./AudioUploader";
import type { MusicGenerationType, VocalGender } from "@/types/music.d";
import type { MusicGenerationParams } from "@/hooks/useMusicGeneration";
import { Loader2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

interface MusicGeneratorFormProps {
  onSubmit: (params: MusicGenerationParams) => Promise<any>;
  isLoading: boolean;
  userCredits?: number;
  fixedGenerationType?: MusicGenerationType;
}

export function MusicGeneratorForm({
  onSubmit,
  isLoading,
  userCredits = 0,
  fixedGenerationType,
}: MusicGeneratorFormProps) {
  const t = useTranslations("music-generator");

  const [generationType, setGenerationType] = useState<MusicGenerationType>(
    fixedGenerationType || "direct"
  );
  const [customMode, setCustomMode] = useState(true);
  const [instrumental, setInstrumental] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [style, setStyle] = useState("");
  const [negativeTags, setNegativeTags] = useState("");
  const [uploadAudioUrl, setUploadAudioUrl] = useState("");
  const [modelId, setModelId] = useState("suno-v5");
  
  // 高级选项
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [styleWeight, setStyleWeight] = useState(0.65);
  const [weirdnessConstraint, setWeirdnessConstraint] = useState(0.65);
  const [audioWeight, setAudioWeight] = useState(0.65);
  const [vocalGender, setVocalGender] = useState<VocalGender | undefined>(undefined);

  const requiredCredits = 12;
  const hasEnoughCredits = userCredits >= requiredCredits;

  const needsAudioUpload = ["add-vocals", "add-instrumental", "upload-cover"].includes(generationType);
  const hasCustomMode = ["direct", "upload-cover"].includes(generationType);

  const showPrompt = () => {
    if (generationType === "add-vocals") return true;
    if (generationType === "add-instrumental") return false;
    if (hasCustomMode) {
      return !customMode || (customMode && !instrumental);
    }
    return false;
  };

  const showTitle = () => {
    if (generationType === "add-vocals" || generationType === "add-instrumental") return true;
    if (hasCustomMode && customMode) return true;
    return false;
  };

  const showStyle = () => {
    if (generationType === "add-vocals" || generationType === "add-instrumental") return true;
    if (hasCustomMode && customMode) return true;
    return false;
  };

  const showNegativeTags = () => {
    if (generationType === "add-vocals" || generationType === "add-instrumental") return true;
    if (hasCustomMode && customMode) return true;
    return false;
  };

  const getPromptMaxLength = () => {
    if (!hasCustomMode) return 500;
    if (customMode) return 5000;
    return 500;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasEnoughCredits) {
      toast.error(t("errors.insufficientCredits") || "Insufficient credits");
      return;
    }

    if (needsAudioUpload && !uploadAudioUrl) {
      toast.error(t("errors.audioRequired") || "Please upload an audio file");
      return;
    }

    if (showPrompt() && !prompt.trim()) {
      toast.error(t("errors.promptRequired") || "Please enter a prompt");
      return;
    }

    if (showTitle() && !title.trim()) {
      toast.error(t("errors.titleRequired") || "Please enter a title");
      return;
    }

    if (showStyle() && !style.trim()) {
      toast.error(t("errors.styleRequired") || "Please enter a style");
      return;
    }

    if (generationType === "add-vocals" && !negativeTags.trim()) {
      toast.error(t("errors.negativeTagsRequired") || "Please enter negative tags");
      return;
    }

    if (generationType === "add-instrumental" && !negativeTags.trim()) {
      toast.error(t("errors.negativeTagsRequired") || "Please enter negative tags");
      return;
    }

    const params: MusicGenerationParams = {
      generationType,
      customMode: hasCustomMode ? customMode : undefined,
      instrumental: hasCustomMode ? instrumental : undefined,
      prompt: showPrompt() ? prompt : undefined,
      title: showTitle() ? title : undefined,
      style: showStyle() ? style : undefined,
      negativeTags: showNegativeTags() ? negativeTags : undefined,
      uploadAudioUrl: needsAudioUpload ? uploadAudioUrl : undefined,
      modelId,
      // 高级选项
      styleWeight: showAdvanced ? styleWeight : undefined,
      weirdnessConstraint: showAdvanced ? weirdnessConstraint : undefined,
      audioWeight: showAdvanced ? audioWeight : undefined,
      vocalGender: showAdvanced && vocalGender ? vocalGender : undefined,
    };

    await onSubmit(params);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!fixedGenerationType && (
        <GenerationTypeSelector
          value={generationType}
          onChange={setGenerationType}
          disabled={isLoading}
        />
      )}

      {needsAudioUpload && (
        <AudioUploader
          onAudioUploaded={setUploadAudioUrl}
          currentAudioUrl={uploadAudioUrl}
          disabled={isLoading}
        />
      )}

      {hasCustomMode && (
        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <div>
            <label className="text-white font-medium">
              {t("customMode") || "Custom Mode"}
            </label>
            <p className="text-sm text-gray-400 mt-1">
              {t("customModeDescription") || "Enable detailed control over all parameters"}
            </p>
          </div>
          <Switch
            checked={customMode}
            onCheckedChange={setCustomMode}
            disabled={isLoading}
          />
        </div>
      )}

      {hasCustomMode && (
        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <div>
            <label className="text-white font-medium">
              {t("instrumental") || "Instrumental"}
            </label>
            <p className="text-sm text-gray-400 mt-1">
              {t("instrumentalDescription") || "Generate music without vocals"}
            </p>
          </div>
          <Switch
            checked={instrumental}
            onCheckedChange={setInstrumental}
            disabled={isLoading}
          />
        </div>
      )}

      {showPrompt() && (
        <div>
          <label className="block text-white text-lg font-semibold mb-4">
            {generationType === "add-vocals" 
              ? (t("lyricsAndStyle") || "Lyrics & Vocal Style") 
              : (customMode && !instrumental 
                ? (t("lyrics") || "Lyrics") 
                : (t("description") || "Description"))}
            <span className="text-red-400 ml-1">*</span>
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
            className="w-full h-32 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
            placeholder={
              generationType === "add-vocals"
                ? (t("promptPlaceholderAddVocals") || "Enter lyrics and vocal style...")
                : (customMode && !instrumental
                  ? (t("promptPlaceholderLyrics") || "Enter your lyrics...")
                  : (t("promptPlaceholderDescription") || "Enter music description..."))
            }
            maxLength={getPromptMaxLength()}
          />
          <p className="text-xs text-gray-400 mt-2">
            {t("maxLength") || "Max"} {getPromptMaxLength()} {t("characters") || "characters"}
          </p>
        </div>
      )}

      {showTitle() && (
        <div>
          <label className="block text-white text-lg font-semibold mb-4">
            {t("musicTitle") || "Title"}
            <span className="text-red-400 ml-1">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder={t("titlePlaceholder") || "Enter song title..."}
            maxLength={80}
          />
        </div>
      )}

      {showStyle() && (
        <div>
          <label className="block text-white text-lg font-semibold mb-4">
            {generationType === "add-instrumental" 
              ? (t("tags") || "Tags") 
              : (t("style") || "Style")}
            <span className="text-red-400 ml-1">*</span>
          </label>
          <input
            type="text"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder={
              generationType === "add-instrumental"
                ? (t("tagsPlaceholder") || "e.g., upbeat, energetic, electronic...")
                : (t("stylePlaceholder") || "e.g., Jazz, Rock, Electronic...")
            }
            maxLength={1000}
          />
        </div>
      )}

      {showNegativeTags() && (
        <div>
          <label className="block text-white text-lg font-semibold mb-4">
            {t("negativeTags") || "Negative Tags"}
            {(generationType === "add-vocals" || generationType === "add-instrumental") && (
              <span className="text-red-400 ml-1">*</span>
            )}
          </label>
          <input
            type="text"
            value={negativeTags}
            onChange={(e) => setNegativeTags(e.target.value)}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder={t("negativeTagsPlaceholder") || "Styles to avoid..."}
          />
        </div>
      )}

      {/* 高级选项 */}
      <div className="border border-gray-700 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between p-4 bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
          disabled={isLoading}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <span className="text-white font-medium">{t("advancedOptions") || "Advanced Options"}</span>
            <span className="text-xs text-gray-400 ml-2">({t("optional") || "Optional"})</span>
          </div>
          {showAdvanced ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {showAdvanced && (
          <div className="p-4 space-y-6 bg-gray-800/30 border-t border-gray-700">
            {/* Style Weight */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-white font-medium">
                  {t("styleWeight") || "Style Weight"}
                </label>
                <span className="text-sm text-blue-400 font-mono">{styleWeight.toFixed(2)}</span>
              </div>
              <Slider
                value={[styleWeight]}
                onValueChange={(value) => setStyleWeight(value[0])}
                min={0}
                max={1}
                step={0.01}
                className="mb-2"
              />
              <p className="text-xs text-gray-400">
                {t("styleWeightDescription") || "How strictly to follow the specified style (0-1). Recommended: 0.65-0.80"}
              </p>
            </div>

            {/* Weirdness Constraint */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-white font-medium">
                  {t("weirdnessConstraint") || "Creativity Level"}
                </label>
                <span className="text-sm text-blue-400 font-mono">{weirdnessConstraint.toFixed(2)}</span>
              </div>
              <Slider
                value={[weirdnessConstraint]}
                onValueChange={(value) => setWeirdnessConstraint(value[0])}
                min={0}
                max={1}
                step={0.01}
                className="mb-2"
              />
              <p className="text-xs text-gray-400">
                {t("weirdnessConstraintDescription") || "Control experimental/creative deviation (0-1). Lower=traditional, Higher=creative. Recommended: 0.30-0.50"}
              </p>
            </div>

            {/* Audio Weight */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-white font-medium">
                  {t("audioWeight") || "Audio Weight"}
                </label>
                <span className="text-sm text-blue-400 font-mono">{audioWeight.toFixed(2)}</span>
              </div>
              <Slider
                value={[audioWeight]}
                onValueChange={(value) => setAudioWeight(value[0])}
                min={0}
                max={1}
                step={0.01}
                className="mb-2"
              />
              <p className="text-xs text-gray-400">
                {t("audioWeightDescription") || "Balance audio feature weight (0-1). Recommended: 0.60-0.75"}
              </p>
            </div>

            {/* Vocal Gender */}
            <div>
              <label className="block text-white font-medium mb-3">
                {t("vocalGender") || "Vocal Gender Preference"}
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setVocalGender(undefined)}
                  disabled={isLoading}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                    vocalGender === undefined
                      ? "border-blue-500 bg-blue-500/20 text-blue-400"
                      : "border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  {t("auto") || "Auto"}
                </button>
                <button
                  type="button"
                  onClick={() => setVocalGender("m")}
                  disabled={isLoading}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                    vocalGender === "m"
                      ? "border-blue-500 bg-blue-500/20 text-blue-400"
                      : "border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  {t("male") || "Male"}
                </button>
                <button
                  type="button"
                  onClick={() => setVocalGender("f")}
                  disabled={isLoading}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                    vocalGender === "f"
                      ? "border-blue-500 bg-blue-500/20 text-blue-400"
                      : "border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  {t("female") || "Female"}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {t("vocalGenderDescription") || "Note: This increases probability but does not guarantee strict adherence"}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div>
          <p className="text-gray-400 text-sm">{t("creditsRequired") || "Credits Required"}</p>
          <p className="text-white font-semibold">{requiredCredits}</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">{t("yourCredits") || "Your Credits"}</p>
          <p className={`font-semibold ${hasEnoughCredits ? "text-green-400" : "text-red-400"}`}>
            {userCredits}
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !hasEnoughCredits}
        className="w-full py-4 px-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("generating") || "Generating..."}
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            {t("generate") || "Generate Music"}
          </>
        )}
      </button>
    </form>
  );
}
