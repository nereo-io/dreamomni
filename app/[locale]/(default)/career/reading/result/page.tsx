"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function CareerReadingResultPage() {
  const [message, setMessage] = useState("");

  return (
    <main className="container py-10">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Free Report Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Your Career Reading</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">Career Element Analysis</h3>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  [Visual Element Chart Placeholder]
                </div>
                <p className="mt-3 text-muted-foreground">
                  Basic interpretation of your career elements...
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Current Career Phase</h3>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  [Timeline Visualization Placeholder]
                </div>
                <p className="mt-3 text-muted-foreground">
                  Description of your current career phase...
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Basic Guidance</h3>
                <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                  <li>Key point 1...</li>
                  <li>Key point 2...</li>
                  <li>Key point 3...</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* AI Chat Interface */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Ask AI Assistant</h2>
            
            <div className="h-[400px] bg-muted rounded-lg mb-4 p-4 overflow-y-auto">
              [Chat History Placeholder]
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Type your question..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button>Send</Button>
            </div>

            <p className="text-sm text-muted-foreground mt-2">
              <Badge variant="outline">Free</Badge> 3 messages remaining
            </p>
          </Card>
        </div>

        {/* Premium Features Preview */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Unlock Premium Insights</h2>
            
            <Tabs defaultValue="analysis">
              <TabsList className="w-full">
                <TabsTrigger value="analysis" className="flex-1">Analysis</TabsTrigger>
                <TabsTrigger value="forecast" className="flex-1">Forecast</TabsTrigger>
                <TabsTrigger value="strategy" className="flex-1">Strategy</TabsTrigger>
              </TabsList>

              <TabsContent value="analysis">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                  [Detailed Analysis Preview]
                </div>
                <p className="text-muted-foreground mb-4">
                  Get in-depth analysis of your career elements and potential...
                </p>
              </TabsContent>

              <TabsContent value="forecast">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                  [12-Month Forecast Preview]
                </div>
                <p className="text-muted-foreground mb-4">
                  View your career opportunities and challenges for the next 12 months...
                </p>
              </TabsContent>

              <TabsContent value="strategy">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                  [Personal Strategy Preview]
                </div>
                <p className="text-muted-foreground mb-4">
                  Get personalized strategies to achieve your career goals...
                </p>
              </TabsContent>
            </Tabs>

            <Button className="w-full">Upgrade to Premium</Button>
          </Card>
        </div>
      </div>
    </main>
  );
} 