import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";

interface GettingStartedProps {
  data: {
    title: string;
    description: string;
    steps: Array<{
      step: number;
      title: string;
      description: string;
      icon: string;
    }>;
    cta: {
      title: string;
      url: string;
    };
  };
}

export default function GettingStarted({ data }: GettingStartedProps) {
  return (
    <section className="py-16 md:py-20 lg:py-24 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {data.title}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            {data.description}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-12">
          {data.steps.map((step, index) => (
            <Card key={index} className="relative h-full border-border/50 hover:border-border transition-colors duration-200">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 relative">
                  <Icon name={step.icon} className="w-6 h-6 text-primary" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                </div>
                <CardTitle className="text-xl text-card-foreground">
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-muted-foreground leading-relaxed">
                  {step.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center">
          <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <a href={data.cta.url}>{data.cta.title}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}