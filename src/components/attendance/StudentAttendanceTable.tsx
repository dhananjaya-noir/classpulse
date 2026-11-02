import React from 'react';
import { StudentAttendanceRow, AttendanceStatus } from '@/types';
import { StatusPill } from '@/components/common/StatusPill';
import { UserCheck, SearchX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudentAttendanceTableProps {
  rows: StudentAttendanceRow[];
  onStatusChange: (studentId: string, newStatus: AttendanceStatus) => void;
  disabled?: boolean;
  totalEnrolledCount: number;
}

export function StudentAttendanceTable({
  rows,
  onStatusChange,
  disabled = false,
  totalEnrolledCount,
}: StudentAttendanceTableProps) {
  if (rows.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center shadow-2xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
          <SearchX className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          No students match current filter
        </h4>
        <p className="text-xs text-slate-500 mt-1">
          Try clearing your search keyword or switching the status filter tab.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto max-h-[calc(100vh-320px)] relative">
        <table className="w-full text-left text-sm border-collapse">
          {/* Sticky Table Header */}
          <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center">#</th>
              <th className="py-2.5 px-3 w-36">USN / Roll No</th>
              <th className="py-2.5 px-4">Student Name</th>
              <th className="py-2.5 px-4 text-right">Attendance Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {rows.map((row, index) => {
              const isAbsent = row.status === 'absent';
              const isPresent = row.status === 'present';
              const isLate = row.status === 'late';
              const isExcused = row.status === 'excused';

              return (
                <tr
                  key={row.studentId}
                  className={cn(
                    'transition-colors duration-100 hover:bg-slate-50/70 dark:hover:bg-slate-800/40',
                    isAbsent && 'bg-rose-50/30 dark:bg-rose-950/20',
                    isLate && 'bg-amber-50/20 dark:bg-amber-950/15',
                    isExcused && 'bg-indigo-50/20 dark:bg-indigo-950/15'
                  )}
                >
                  {/* Row Serial Number */}
                  <td className="py-2.5 px-3 text-center text-xs text-slate-400 font-mono tabular-nums">
                    {index + 1}
                  </td>

                  {/* USN / Roll Number */}
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 tracking-wider">
                      {row.usn}
                    </span>
                  </td>

                  {/* Student Full Name */}
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'text-xs sm:text-sm font-medium',
                          isAbsent
                            ? 'text-rose-900 dark:text-rose-200 font-semibold'
                            : 'text-slate-800 dark:text-slate-200'
                        )}
                      >
                        {row.fullName}
                      </span>
                      {isAbsent && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                          Absent
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 1-Click Status Pill Segmented Control */}
                  <td className="py-2.5 px-4 text-right">
                    <StatusPill
                      status={row.status}
                      disabled={disabled}
                      onChange={newStatus => onStatusChange(row.studentId, newStatus)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Summary */}
      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <span className="tabular-nums">
          Showing <strong>{rows.length}</strong> of <strong>{totalEnrolledCount}</strong> enrolled students
        </span>
        <span className="text-[11px] text-slate-400">
          Tip: Click <strong>Mark Everyone Present</strong> then tap <strong>A</strong> on absentees
        </span>
      </div>
    </div>
  );
}
