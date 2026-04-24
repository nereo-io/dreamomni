"use client";

import { Check, X } from "lucide-react";
import type { ComparisonSection } from "@/types/pages/model-landing-page";

interface ModelComparisonProps {
  section: ComparisonSection;
}

export default function ModelComparison({ section }: ModelComparisonProps) {
  const { title, models, features, featureLabel = "Feature" } = section;

  const renderValue = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="w-5 h-5 text-green-500 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-red-400 mx-auto" />
      );
    }
    return <span className="text-foreground">{value}</span>;
  };

  return (
    <section className="w-full py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
          {title}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-4 text-muted-foreground font-medium">
                  {featureLabel}
                </th>
                {models.map((model, index) => (
                  <th
                    key={index}
                    className="text-center py-4 px-4 text-foreground font-semibold"
                  >
                    {model}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr
                  key={index}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-4 px-4 text-foreground font-medium">
                    {feature.name}
                  </td>
                  {feature.values.map((value, vIndex) => (
                    <td key={vIndex} className="py-4 px-4 text-center">
                      {renderValue(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
