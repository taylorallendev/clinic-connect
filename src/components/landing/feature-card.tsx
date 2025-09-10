import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  className = "",
}: FeatureCardProps) {
  return (
    <div
      className={`bg-muted rounded-md p-6 flex justify-between flex-col ${className}`}
    >
      <Icon className="w-8 h-8 stroke-1 text-primary" />
      <div className="flex flex-col">
        <h3 className="text-xl tracking-tight">{title}</h3>
        <p className="text-muted-foreground max-w-xs text-base">
          {description}
        </p>
      </div>
    </div>
  );
}
