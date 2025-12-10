import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
  variant?: 'default' | 'dark' | 'primary';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  variant = 'default',
}) => {
  const baseStyles = 'admin-stat-card group cursor-default';
  
  const variantStyles = {
    default: 'bg-card',
    dark: 'gradient-dark text-primary-foreground border-transparent',
    primary: 'gradient-primary text-primary-foreground border-transparent',
  };

  const iconStyles = {
    default: 'text-muted-foreground group-hover:text-primary transition-colors',
    dark: 'text-primary-foreground/70',
    primary: 'text-primary-foreground/70',
  };

  const titleStyles = {
    default: 'text-muted-foreground group-hover:text-primary transition-colors',
    dark: 'text-primary-foreground/70',
    primary: 'text-primary-foreground/70',
  };

  const valueStyles = {
    default: 'text-foreground',
    dark: 'text-primary-foreground',
    primary: 'text-primary-foreground',
  };

  return (
    <div className={cn(baseStyles, variantStyles[variant])}>
      <div className="flex justify-between items-start mb-4">
        <h3 className={cn('text-sm font-medium', titleStyles[variant])}>
          {title}
        </h3>
        <Icon className={cn('w-5 h-5', iconStyles[variant])} />
      </div>
      
      <div className={cn('text-3xl font-bold', valueStyles[variant])}>
        {value}
      </div>
      
      {trend && (
        <div className="flex items-center gap-2 mt-2">
          <span className={cn(
            'text-xs font-medium',
            trend.isPositive ? 'text-success' : 'text-destructive'
          )}>
            {trend.isPositive ? '+' : ''}{trend.value}
          </span>
        </div>
      )}
      
      {subtitle && (
        <p className={cn(
          'text-xs mt-2',
          variant === 'default' ? 'text-muted-foreground' : 'text-primary-foreground/60'
        )}>
          {subtitle}
        </p>
      )}
    </div>
  );
};
