interface StatCardProps {
  value: string | number;
  label: string;
  sublabel?: string;
}

export function StatCard({ value, label, sublabel }: StatCardProps) {
  return (
    <div className="rounded-lg border border-[#222222] bg-[#111111] p-4 card-hover">
      <div className="text-2xl font-bold text-[#c9a84c] lg:text-3xl">{value}</div>
      <div className="mt-1 text-xs font-medium text-[#a0a0a0] uppercase tracking-wide">{label}</div>
      {sublabel && (
        <div className="mt-0.5 text-[10px] text-[#666666]">{sublabel}</div>
      )}
    </div>
  );
}
