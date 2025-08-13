import { Badge } from "@/components/ui/badge";

interface SectionHeadingProps {
  badge?: string;
  title: string;
  description?: string;
  align?: "left" | "center" | "right";
  badgeVariant?: "default" | "primary" | "accent";
}

export function SectionHeading({
  badge,
  title,
  description,
  align = "center",
  badgeVariant = "default",
}: SectionHeadingProps) {
  const alignmentClasses = {
    left: "items-start text-left",
    center: "items-center text-center",
    right: "items-end text-right",
  };

  const badgeClasses = {
    default: "",
    primary: "bg-primary hover:bg-primary/80 text-primary-foreground",
    accent: "bg-accent hover:bg-accent/80 text-accent-foreground",
  };

  return (
    <div className={`flex flex-col gap-4 ${alignmentClasses[align]}`}>
      {badge && (
        <div>
          <Badge className={badgeClasses[badgeVariant]}>{badge}</Badge>
        </div>
      )}
      <div className="flex gap-2 flex-col">
        <h2 className="text-3xl md:text-5xl tracking-tighter font-bold" style={{ fontFamily: "'Red Hat Display', sans-serif" }}>
          {title}
        </h2>
        {description && (
          <p className="text-lg max-w-xl lg:max-w-2xl leading-relaxed tracking-tight text-muted-foreground" style={{ fontFamily: "'Nunito Sans', sans-serif" }}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
