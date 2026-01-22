import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  value: string | number;
  label: string;
  delay?: string;
}

const StatsCard = ({ icon: Icon, iconColor, iconBg, value, label, delay = '' }: StatsCardProps) => {
  return (
    <div className={`bg-card rounded-xl p-6 shadow-card border border-border animate-fade-up ${delay}`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
