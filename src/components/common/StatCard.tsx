import React from 'react';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'present' | 'absent' | 'accent' | 'warning';
  className?: string;
}

export function StatCard({
  label,
  value,
  subValue,
  icon,
  variant = 'default',
  className,
}: StatCardProps) {
  const valueColorStyles = {
    default: 'text-slate-900 dark:text-slate-100',
    present: 'text-emerald-600 dark:text-emerald-400',
    absent: 'text-rose-600 dark:text-rose-400',
    accent: 'text-teal-600 dark:text-teal-400',
    warning: 'text-amber-600 dark:text-amber-400',
  };

  const bgStyles = {
    default: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800',
    present: 'bg-white dark:bg-slate-900 border-emerald-200/60 dark:border-emerald-900/40',
    absent: 'bg-white dark:bg-slate-900 border-rose-200/60 dark:border-rose-900/40',
    accent: 'bg-white dark:bg-slate-900 border-teal-200/60 dark:border-teal-900/40',
    warning: 'bg-white dark:bg-slate-900 border-amber-200/60 dark:border-amber-900/40',
  };

  return (
    <div
      className={cn(
        'p-4 rounded-xl border shadow-xs transition-all flex flex-col justify-between',
        bgStyles[variant],
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
          {label}
        </span>
        {icon && <div className="text-slate-400 shrink-0">{icon}</div>}
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <span
          className={cn(
            'text-2xl font-bold tracking-tight tabular-nums',
            valueColorStyles[variant]
          )}
        >
          {value}
        </span>
        {subValue && (
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
}
