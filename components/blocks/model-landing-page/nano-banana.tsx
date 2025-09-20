"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function GoogleNanoBanana() {
  const [prompt, setPrompt] = useState("");
  const [isTranslatePrompt, setIsTranslatePrompt] = useState(false);
  const [activeTab, setActiveTab] = useState("text-to-image");

  const handleGenerate = () => {
    // 这里实现生成图片的逻辑
    console.log("Generating with prompt:", prompt);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Google Nano Banana AI Image Generator</h1>
        <p className="text-muted-foreground">
          Google Nano Banana AI, also called Gemini 2.5 Flash Image, is an SOTA AI image generation and editing model
          developed by Google DeepMind. It has been <span className="text-primary font-medium">rolled out to the Gemini app</span>, 
          praised for its unparalleled ability to achieve ultra-high character consistency, the model's popularity has skyrocketed on social media. 
          Try <span className="text-primary font-medium">Nano Banana for free</span> in Palo AI image generator!
        </p>
      </div>

      <div className="flex justify-center mb-6">
        <div className="bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 h-2 w-24 rounded-full"></div>
      </div>

      <Tabs defaultValue="text-to-image" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="text-to-image">Text to Image</TabsTrigger>
          <TabsTrigger value="image-to-image">Image to Image</TabsTrigger>
        </TabsList>
        
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <TabsContent value="text-to-image" className="mt-0">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-4">Text to Image</h2>
              
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-medium">Prompt</div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="translate-prompt" 
                    checked={isTranslatePrompt}
                    onCheckedChange={setIsTranslatePrompt}
                  />
                  <Label htmlFor="translate-prompt" className="text-sm">Translate Prompt</Label>
                </div>
              </div>
              
              <Textarea 
                placeholder="What do you want to create?"
                className="min-h-32 bg-gray-950 border-gray-800"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              
              <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <path d="M12 17h.01"/>
                  </svg>
                  Generate with AI
                </div>
                <div>{prompt.length} / 2000</div>
              </div>
            </div>
            
            <div className="flex justify-center mt-6">
              <Button 
                className="w-full max-w-xs bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={handleGenerate}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M12 3v3"/>
                  <path d="M18.4 5.6a9 9 0 1 1-12.77.04"/>
                </svg>
                Create
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="image-to-image" className="mt-0">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-4">Image to Image</h2>
              <div className="flex justify-center items-center border-2 border-dashed border-gray-700 rounded-lg h-64">
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                      <circle cx="9" cy="9" r="2"/>
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Drag and drop an image here, or click to select
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center mt-6">
              <Button 
                className="w-full max-w-xs bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={true}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M12 3v3"/>
                  <path d="M18.4 5.6a9 9 0 1 1-12.77.04"/>
                </svg>
                Create
              </Button>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}