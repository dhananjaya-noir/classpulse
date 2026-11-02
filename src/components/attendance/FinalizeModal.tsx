import React from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { AttendanceSummaryStats, AttendanceReportData } from '@/types';
import { 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  ArrowLeft,
  Check
} from 'lucide-react';
import { 
  exportAttendanceExcel, 
  exportAbsenteesCSV, 
  exportAttendancePDF, 
  downloadAbsenteesOnlySimple 
} from '@/lib/export';

interface FinalizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: AttendanceSummaryStats;
  reportData: AttendanceReportData | null;
  onConfirmFinalize: () => void;
  onMarkRemainingPresent: () => void;
  onMarkRemainingAbsent: () => void;
  isFinalized: boolean;
  onReopenSession?: () => void;
}

export function FinalizeModal({
  isOpen,
  onClose,
  stats,
  reportData,
  onConfirmFinalize,
  onMarkRemainingPresent,
  onMarkRemainingAbsent,
  isFinalized,
  onReopenSession,
}: FinalizeModalProps) {
  const hasUnmarked = stats.unmarked > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isFinalized ? 'Session Finalized & Export' : 'Review & Finalize Attendance'}
      description={
        isFinalized
          ? 'Attendance has been locked and recorded to official registry.'
          : 'Please review the summary counts carefully before officially closing this session.'
      }
      maxWidth="lg"
      footer={
        isFinalized ? (
          <div className="flex items-center justify-between w-full">
            {onReopenSession && (
              <Button size="sm" variant="outline" onClick={onReopenSession}>
                Reopen Session (Edit)
              </Button>
            )}
            <Button size="sm" variant="primary" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2 w-full">
            <Button size="sm" variant="secondary" onClick={onClose} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Marking
            </Button>
            {!hasUnmarked && (
              <Button
                size="sm"
                variant="success"
                onClick={onConfirmFinalize}
                leftIcon={<Check className="w-3.5 h-3.5 stroke-[2.5]" />}
              >
                Confirm & Finalize Session
              </Button>
            )}
          </div>
        )
      }
    >
      <div className="space-y-5">
        {/* Unmarked Warning Prompt */}
        {!isFinalized && hasUnmarked && (
          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  {stats.unmarked} student{stats.unmarked > 1 ? 's are' : ' is'} still unmarked!
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  All students must be resolved before finalising attendance. How would you like to handle remaining unmarked students?
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={onMarkRemainingPresent}
                    leftIcon={<Check className="w-3.5 h-3.5" />}
                  >
                    Mark Remaining ({stats.unmarked}) Present
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={onMarkRemainingAbsent}
                  >
                    Mark Remaining ({stats.unmarked}) Absent
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Enrolled
            </span>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
              {stats.total}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Present
            </span>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
              {stats.present}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Absent
            </span>
            <p className="text-xl font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-0.5">
              {stats.absent}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-teal-200/60 dark:border-teal-900/40 bg-teal-50/50 dark:bg-teal-950/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Attendance %
            </span>
            <p className="text-xl font-bold text-teal-600 dark:text-teal-400 tabular-nums mt-0.5">
              {stats.attendancePercentage}%
            </p>
          </div>
        </div>

        {/* Absentee Preview Card */}
        {reportData && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Absentee List ({reportData.absentees.length})
              </span>
              {reportData.absentees.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadAbsenteesOnlySimple(reportData, 'xlsx')}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Download Absentees Only
                </Button>
              )}
            </div>

            {reportData.absentees.length === 0 ? (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>No students were marked absent for this session. (100% Attendance)</span>
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-1.5 px-3 w-10">#</th>
                      <th className="py-1.5 px-3">USN / Roll No</th>
                      <th className="py-1.5 px-3">Student Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {reportData.absentees.map((a, i) => (
                      <tr key={a.usn} className="hover:bg-rose-50/20 dark:hover:bg-rose-950/20">
                        <td className="py-1.5 px-3 text-slate-400 font-mono">{i + 1}</td>
                        <td className="py-1.5 px-3 font-mono font-semibold text-rose-600 dark:text-rose-400">
                          {a.usn}
                        </td>
                        <td className="py-1.5 px-3 text-slate-800 dark:text-slate-200">
                          {a.fullName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Download & Export Section */}
        {reportData && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Download Official Reports
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => exportAttendanceExcel(reportData)}
                leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
                className="justify-start text-xs font-medium"
              >
                Excel (.xlsx) with 3 Sheets
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => exportAbsenteesCSV(reportData)}
                leftIcon={<FileText className="w-4 h-4 text-blue-600" />}
                className="justify-start text-xs font-medium"
              >
                Absentee CSV (UTF-8 BOM)
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => exportAttendancePDF(reportData)}
                leftIcon={<FileText className="w-4 h-4 text-rose-600" />}
                className="justify-start text-xs font-medium"
              >
                Formal PDF Report
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
