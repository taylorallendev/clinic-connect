import { Card, CardContent } from "@/components/ui/card";

interface TestimonialCardProps {
  quote: string;
  name: string;
  title: string;
  avatarUrl?: string;
}

export function TestimonialCard({
  quote,
  name,
  title,
  avatarUrl,
}: TestimonialCardProps) {
  return (
    <Card className="bg-card">
      <CardContent className="p-6 space-y-4">
        <p className="italic text-muted-foreground">{quote}</p>
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-muted h-10 w-10">
            {/* Avatar could be added here if available */}
          </div>
          <div>
            <p className="font-medium">{name}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
