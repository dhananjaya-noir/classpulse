import React from 'react';
import { AttendanceSummaryStats, AttendanceStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Check, X, Clock, ShieldAlert, HelpCircle, Users } from 'lucide-react';

interface AttendanceStatsBarProps {
  stats: AttendanceSummaryStats;
  activeFilter: 'all' | AttendanceStatus;
  onFilterChange: (filter: 'all' | AttendanceStatus) => void;
}

export function AttendanceStatsBar({
  stats,
  activeFilter,
  onFilterChange,
}: AttendanceStatsBarProps) {
  const completionPercentage = stats.total > 0
    ? Math.round(((stats.total - stats.unmarked) / stats.total) * 100)
    : 0;

  const filters: Array<{
    id: 'all' | AttendanceStatus;
    label: string;
    count: number;
    icon: React.ReactNode;
    colorClasses: string;
    activeClasses: string;
  }> = [
    {
      id: 'all',
      label: 'All Enrolled',
      count: stats.total,
      icon: <Users className="w-3.5 h-3.5" />,
      colorClasses: 'text-slate-700 dark:text-slate-300',
      activeClasses: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs',
    },
    {
      id: 'present',
      label: 'Present',
      count: stats.present,
      icon: <Check className="w-3.5 h-3.5 stroke-[2.5]" />,
      colorClasses: 'text-emerald-700 dark:text-emerald-400',
      activeClasses: 'bg-emerald-600 text-white shadow-xs',
    },
    {
      id: 'absent',
      label: 'Absent',
      count: stats.absent,
      icon: <X className="w-3.5 h-3.5 stroke-[2.5]" />,
      colorClasses: 'text-rose-700 dark:text-rose-400',
      activeClasses: 'bg-rose-600 text-white shadow-xs',
    },
    {
      id: 'late',
      label: 'Late',
      count: stats.late,
      icon: <Clock className="w-3.5 h-3.5" />,
      colorClasses: 'text-amber-700 dark:text-amber-400',
      activeClasses: 'bg-amber-600 text-white shadow-xs',
    },
    {
      id: 'excused',
      label: 'Excused',
      count: stats.excused,
      icon: <ShieldAlert className="w-3.5 h-3.5" />,
      colorClasses: 'text-indigo-700 dark:text-indigo-400',
      activeClasses: 'bg-indigo-600 text-white shadow-xs',
    },
    {
      id: 'unmarked',
      label: 'Unmarked',
      count: stats.unmarked,
      icon: <HelpCircle className="w-3.5 h-3.5" />,
      colorClasses: 'text-slate-500',
      activeClasses: 'bg-slate-600 text-white shadow-xs',
    },
  ];

  return (
    <div className="space-y-3">
      {/* Top Completion Progress Indicator */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
          <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <span>Roster Completion</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {stats.total - stats.unmarked} of {stats.total} marked ({completionPercentage}%)
            </span>
          </span>

          <span className="font-bold text-teal-600 dark:text-teal-400 tabular-nums">
            {stats.attendancePercentage}% Present
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${stats.total > 0 ? (stats.present / stats.total) * 100 : 0}%` }}
            title={`Present: ${stats.present}`}
          />
          <div
            className="h-full bg-rose-500 transition-all duration-300"
            style={{ width: `${stats.total > 0 ? (stats.absent / stats.total) * 100 : 0}%` }}
            title={`Absent: ${stats.absent}`}
          />
          <div
            className="h-full bg-amber-500 transition-all duration-300"
            style={{ width: `${stats.total > 0 ? (stats.late / stats.total) * 100 : 0}%` }}
            title={`Late: ${stats.late}`}
          />
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${stats.total > 0 ? (stats.excused / stats.total) * 100 : 0}%` }}
            title={`Excused: ${stats.excused}`}
          />
        </div>
      </div>

      {/* Filter Badges with Counts */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {filters.map(f => {
          const isActive = activeFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onFilterChange(f.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all shrink-0',
                isActive
                  ? f.activeClasses
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60',
                !isActive && f.colorClasses
              )}
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
              <span
                className={cn(
                  'px-1.5 py-0.2 text-[10px] font-bold rounded-full tabular-nums',
                  isActive
                    ? 'bg-black/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                )}
              >
                {f.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
