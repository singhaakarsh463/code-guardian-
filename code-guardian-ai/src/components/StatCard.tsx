interface StatCardProps {
  value: string;
  label: string;
  suffix?: string;
}

export function StatCard({ value, label, suffix }: StatCardProps) {
  return (
    <div className="text-center p-6">
      <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
        {value}
        {suffix && <span className="text-2xl">{suffix}</span>}
      </div>
      <div className="text-muted-foreground text-sm">{label}</div>
    </div>
  );
}
