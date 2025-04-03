import { CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PricingCardProps {
  title: string;
  description: string;
  price: string | number;
  period?: string;
  features: string[];
  buttonText: string;
  buttonVariant?: "default" | "outline";
  popular?: boolean;
  className?: string;
}

export function PricingCard({
  title,
  description,
  price,
  period = "/month",
  features,
  buttonText,
  buttonVariant = "default",
  popular = false,
  className = "",
}: PricingCardProps) {
  return (
    <Card
      className={`flex flex-col ${popular ? "border-primary" : ""} ${className}`}
    >
      <CardContent className="p-6 flex-1 flex flex-col">
        <div className="space-y-2 mb-6">
          {popular && (
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground mb-2">
              Most Popular
            </div>
          )}
          <h3 className="text-2xl font-bold">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold">
              Contact Us
            </span>
          </div>
        </div>
        <ul className="space-y-2 flex-1 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button variant={buttonVariant} className="w-full">
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}
