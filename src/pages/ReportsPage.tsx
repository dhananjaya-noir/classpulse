import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  TrendingUp, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatCard } from '@/components/common/StatCard';
import { AttendanceSession, ClassItem, Subject, AttendanceReportData } from '@/types';
import { storage } from '@/lib/storage';
import { formatDate, formatTime } from '@/lib/utils';
import { 
  exportAttendanceExcel, 
  exportAbsenteesCSV, 
  exportAttendancePDF, 
  downloadAbsenteesOnlySimple 
} from '@/lib/export';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

interface ReportsPageProps {
  sessions: AttendanceSession[];
  classes: ClassItem[];
  subjects: Subject[];
}

export function ReportsPage({ sessions, classes, subjects }: ReportsPageProps) {
  const { profile } = useAuth();
  const { success, error } = useToast();

  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessions[0]?.id || '');
  const [reportData, setReportData] = useState<AttendanceReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load report data whenever selected session changes
  useEffect(() => {
    if (!selectedSessionId) {
      setReportData(null);
      return;
    }

    let isMounted = true;
    async function loadReport() {
      setIsLoading(true);
      try {
        const session = sessions.find(s => s.id === selectedSessionId);
        if (!session) return;

        const records = await storage.getAttendanceRecords(selectedSessionId);
        if (!isMounted) return;

        const currentClass = classes.find(c => c.id === session.class_id);
        const currentSubject = subjects.find(s => s.id === session.subject_id);

        const absentees = records
          .filter(r => r.attendance_status === 'absent')
          .map((r, i) => ({
            serialNumber: i + 1,
            usn: r.student_usn_snapshot,
            fullName: r.student_name_snapshot,
          }));

        const recordsList = records.map((r, i) => ({
          serialNumber: i + 1,
          usn: r.student_usn_snapshot,
          fullName: r.student_name_snapshot,
          status: r.attendance_status,
        }));

        const total = records.length;
        const present = records.filter(r => r.attendance_status === 'present').length;
        const absent = absentees.length;
        const late = records.filter(r => r.attendance_status === 'late').length;
        const excused = records.filter(r => r.attendance_status === 'excused').length;
        const unmarked = records.filter(r => r.attendance_status === 'unmarked').length;
        const attendancePercentage = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;

        setReportData({
          institutionName: profile?.institution_name || 'University Department of Computer Science',
          className: currentClass?.class_name || session.class_name || 'Class',
          semester: currentClass?.semester || 'Semester 5',
          section: currentClass?.section || 'A',
          academicYear: currentClass?.academic_year || '2026-2027',
          subjectName: currentSubject?.subject_name || session.subject_name || 'Subject',
          subjectCode: currentSubject?.subject_code || session.subject_code || '',
          date: session.session_date,
          startTime: session.start_time,
          stats: {
            total,
            present,
            absent,
            late,
            excused,
            unmarked,
            attendancePercentage,
          },
          records: recordsList,
          absentees,
        });
      } catch (err: any) {
        error('Report load failed', err?.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadReport();
    return () => {
      isMounted = false;
    };
  }, [selectedSessionId, sessions, classes, subjects, profile]);

  if (sessions.length === 0) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg mx-auto mt-8 shadow-xs space-y-3">
        <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          No Attendance Sessions Recorded Yet
        </h3>
        <p className="text-xs text-slate-500">
          Take your first classroom attendance to generate and export official records.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Attendance Reports & Document Exports
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Download Excel workbooks (3 sheets), CSVs with UTF-8 BOM, and formatted PDF reports.
          </p>
        </div>

        {/* Session Selector */}
        <div className="w-full sm:w-80">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Choose Session to Export
          </label>
          <select
            value={selectedSessionId}
            onChange={e => setSelectedSessionId(e.target.value)}
            className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
          >
            {sessions.map(s => (
              <option key={s.id} value={s.id}>
                {formatDate(s.session_date)} — {s.subject_name} ({s.class_name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {reportData && (
        <>
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <StatCard
              label="Total Enrolled"
              value={reportData.stats.total}
              variant="default"
            />
            <StatCard
              label="Present"
              value={reportData.stats.present}
              variant="present"
            />
            <StatCard
              label="Absent"
              value={reportData.stats.absent}
              variant="absent"
            />
            <StatCard
              label="Attendance Rate"
              value={`${reportData.stats.attendancePercentage}%`}
              variant="accent"
            />
          </div>

          {/* Export Action Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Export Official Attendance Deliverables
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct client-side file generation with guaranteed formatting and verified data.
                </p>
              </div>

              {/* Dedicated Absentees Only Button (Phase 11 critical deliverable) */}
              <Button
                size="md"
                variant="primary"
                onClick={() => downloadAbsenteesOnlySimple(reportData, 'xlsx')}
                leftIcon={<Download className="w-4 h-4" />}
                className="font-semibold shadow-xs"
              >
                DOWNLOAD ABSENTEES ONLY
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Option 1: Excel */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center gap-2 text-emerald-600">
                  <FileSpreadsheet className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Microsoft Excel (.xlsx)
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Comprehensive 3-sheet workbook: <strong>Sheet 1: Absentees</strong>, <strong>Sheet 2: Complete Roster</strong>, <strong>Sheet 3: Summary Metadata</strong>.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportAttendanceExcel(reportData)}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  className="w-full"
                >
                  Download Excel
                </Button>
              </div>

              {/* Option 2: CSV */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center gap-2 text-blue-600">
                  <FileText className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Absentee CSV (.csv)
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Clean, lightweight absentee list encoded with <strong>UTF-8 BOM</strong> for native Excel and Google Sheets compatibility.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportAbsenteesCSV(reportData)}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  className="w-full"
                >
                  Download CSV
                </Button>
              </div>

              {/* Option 3: PDF */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center gap-2 text-rose-600">
                  <FileText className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Formal PDF Report (.pdf)
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Formatted for printing and physical academic archives. Includes institution header, KPI stats boxes, and tabular page numbers.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportAttendancePDF(reportData)}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  className="w-full"
                >
                  Download PDF
                </Button>
              </div>
            </div>
          </div>

          {/* Absentee List Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Absentee Roster ({reportData.absentees.length} Students)
                </h3>
                <p className="text-xs text-slate-500">
                  Session date: {formatDate(reportData.date)} at {formatTime(reportData.startTime)}
                </p>
              </div>

              {reportData.absentees.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadAbsenteesOnlySimple(reportData, 'csv')}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Export CSV
                </Button>
              )}
            </div>

            {reportData.absentees.length === 0 ? (
              <div className="p-12 text-center text-xs space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                  No students were marked absent for this session.
                </p>
                <p className="text-slate-500">100% full classroom attendance recorded.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4 w-12 text-center">#</th>
                      <th className="py-2.5 px-4 w-40">USN / Roll Number</th>
                      <th className="py-2.5 px-4">Student Full Name</th>
                      <th className="py-2.5 px-4 text-right">Recorded Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {reportData.absentees.map((a, i) => (
                      <tr key={a.usn} className="hover:bg-rose-50/20 dark:hover:bg-rose-950/20">
                        <td className="py-2.5 px-4 text-center font-mono text-slate-400">
                          {i + 1}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-semibold text-rose-600 dark:text-rose-400">
                          {a.usn}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                          {a.fullName}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                            Absent
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
