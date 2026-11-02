import React from 'react';
import { Menu, Plus, Calendar, Clock } from 'lucide-react';
import { ClassItem } from '@/types';
import { Button } from '@/components/common/Button';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  classes: ClassItem[];
  selectedClassId: string | null;
  onSelectClass: (id: string) => void;
  onOpenCreateClass: () => void;
  onQuickStartAttendance: () => void;
  title: string;
}

export function Header({
  onOpenMobileSidebar,
  classes,
  selectedClassId,
  onSelectClass,
  onOpenCreateClass,
  onQuickStartAttendance,
  title,
}: HeaderProps) {
  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile trigger & Page title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {title}
            </h1>
          </div>
        </div>

        {/* Right: Class Selector & Quick Attendance Trigger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Class Selector */}
          <div className="flex items-center">
            {classes.length > 0 ? (
              <div className="relative">
                <select
                  value={selectedClassId || ''}
                  onChange={e => onSelectClass(e.target.value)}
                  className="h-8 pl-2.5 pr-7 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer appearance-none"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.class_name} (Sec {c.section})
                    </option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  ▼
                </div>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={onOpenCreateClass} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Create Class
              </Button>
            )}
          </div>

          {/* Date pill for desktop */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 text-xs font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{todayStr}</span>
          </div>

          {/* Quick Attendance CTA */}
          <Button
            size="sm"
            variant="primary"
            onClick={onQuickStartAttendance}
            className="shadow-xs font-medium text-xs whitespace-nowrap"
            leftIcon={
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            }
          >
            Take Attendance
          </Button>
        </div>
      </div>
    </header>
  );
}
