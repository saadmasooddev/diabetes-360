import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { TipCard } from "./TipCard";

interface WhatToDoNextProps {
  tips?: Array<{ name: string; tip: string }>;
  isLoading?: boolean;
}

export function WhatToDoNext({ tips, isLoading = false }: WhatToDoNextProps) {
  // Hide component if there's an error and no tips data
  if (!isLoading && (!tips || tips.length === 0)) {
    return null;
  }

  return (
    <Card
      className="p-8 transition-all duration-300 hover:shadow-xl"
      style={{
        background: "linear-gradient(135deg, #FFFFFF 0%, #F7F9F9 100%)",
        border: "1px solid rgba(0, 133, 111, 0.12)",
        borderRadius: "16px",
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
      }}
      data-testid="section-what-to-do-next"
    >
      <h2
        className="mb-4"
        style={{
          fontSize: "28px",
          fontWeight: 700,
          color: "#00453A",
          letterSpacing: "-0.02em",
        }}
      >
        What to Do Next
      </h2>
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#546E7A" }} />
          <p style={{ fontSize: "16px", color: "#546E7A" }}>Loading recommendations...</p>
        </div>
      ) : (
        tips && tips.length > 0 && (
          <div className="space-y-4">
            {tips.map((tip, index) => (
              <TipCard key={index} name={tip.name} tip={tip.tip} />
            ))}
          </div>
        )
      )}
    </Card>
  );
}
