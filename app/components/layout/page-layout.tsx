import { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  heading?: string;
  description?: string;
  actions?: ReactNode;
}

export function PageLayout({
  children,
  heading,
  description,
  actions,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
        {(heading || actions) && (
          <div className="flex items-center justify-between space-y-2">
            <div>
              {heading && <h2 className="text-2xl font-bold text-foreground">{heading}</h2>}
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            {actions && <div className="flex items-center space-x-4">{actions}</div>}
          </div>
        )}
        <div className="text-foreground">
          {children}
        </div>
      </div>
    </div>
  );
} 