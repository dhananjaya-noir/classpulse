import React from 'react';
import { cn } from '@/lib/utils';
import { AttendanceStatus } from '@/types';
import { Check, X, Clock, HelpCircle, ShieldAlert } from 'lucide-react';

interface StatusPillProps {
  status: AttendanceStatus;
  onChange: (newStatus: AttendanceStatus) => void;
  disabled?: boolean;
}

export function StatusPill({ status, onChange, disabled = false }: StatusPillProps) {
  const options: Array<{
    value: AttendanceStatus;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    activeClass: string;
    hoverClass: string;
  }> = [
    {
      value: 'present',
      label: 'Present',
      shortLabel: 'P',
      icon: <Check className="w-3 h-3 stroke-[2.5]" />,
      activeClass:
        'bg-emerald-600 text-white font-semibold shadow-xs ring-1 ring-emerald-600',
      hoverClass: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
    },
    {
      value: 'absent',
      label: 'Absent',
      shortLabel: 'A',
      icon: <X className="w-3 h-3 stroke-[2.5]" />,
      activeClass:
        'bg-rose-600 text-white font-semibold shadow-xs ring-1 ring-rose-600',
      hoverClass: 'hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-700 dark:text-rose-400',
    },
    {
      value: 'late',
      label: 'Late',
      shortLabel: 'L',
      icon: <Clock className="w-3 h-3 stroke-[2]" />,
      activeClass:
        'bg-amber-600 text-white font-semibold shadow-xs ring-1 ring-amber-600',
      hoverClass: 'hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-400',
    },
    {
      value: 'excused',
      label: 'Excused',
      shortLabel: 'E',
      icon: <ShieldAlert className="w-3 h-3 stroke-[2]" />,
      activeClass:
        'bg-indigo-600 text-white font-semibold shadow-xs ring-1 ring-indigo-600',
      hoverClass: 'hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400',
    },
  ];

  return (
    <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 select-none">
      {options.map(opt => {
        const isActive = status === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            title={opt.label}
            className={cn(
              'flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-all font-medium',
              isActive
                ? opt.activeClass
                : cn('text-slate-600 dark:text-slate-400', opt.hoverClass),
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {opt.icon}
            <span className="hidden sm:inline">{opt.label}</span>
            <span className="sm:hidden">{opt.shortLabel}</span>
          </button>
        );
      })}
      {status === 'unmarked' && (
        <span className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 font-medium italic">
          <HelpCircle className="w-3 h-3" />
          <span className="hidden sm:inline">Unmarked</span>
        </span>
      )}
    </div>
  );
}
