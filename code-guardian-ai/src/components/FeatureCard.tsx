import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  highlight?: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  highlight,
}: FeatureCardProps) {
  return (
    <div className="group relative p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
        
        {highlight && (
          <div className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {highlight}
          </div>
        )}
      </div>
    </div>
  );
}
