import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Calendar, 
  FileSpreadsheet, 
  ArrowRight, 
  FileText, 
  Download,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { AttendanceSession, ClassItem, Subject } from '@/types';
import { formatDate, formatTime } from '@/lib/utils';
import { storage } from '@/lib/storage';
import { exportAttendanceExcel, exportAttendancePDF, downloadAbsenteesOnlySimple } from '@/lib/export';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';

interface HistoryPageProps {
  sessions: AttendanceSession[];
  classes: ClassItem[];
  subjects: Subject[];
  onOpenSession: (sessionId: string) => void;
  onRefreshSessions: () => Promise<void>;
}

export function HistoryPage({
  sessions,
  classes,
  subjects,
  onOpenSession,
  onRefreshSessions,
}: HistoryPageProps) {
  const { profile } = useAuth();
  const { success, error } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');

  // Quick export from history table
  const handleQuickExport = async (session: AttendanceSession, format: 'excel' | 'pdf' | 'absentees') => {
    try {
      const records = await storage.getAttendanceRecords(session.id);
      const absentees = records
        .filter(r => r.attendance_status === 'absent')
        .map((r, i) => ({
          serialNumber: i + 1,
          usn: r.student_usn_snapshot,
          fullName: r.student_name_snapshot,
        }));

      const reportData = {
        institutionName: profile?.institution_name || 'University Department of Computer Science',
        className: session.class_name || 'Class',
        semester: 'Semester 5',
        section: 'A',
        academicYear: '2026-2027',
        subjectName: session.subject_name || 'Subject',
        subjectCode: session.subject_code || '',
        date: session.session_date,
        startTime: session.start_time,
        stats: {
          total: records.length,
          present: records.filter(r => r.attendance_status === 'present').length,
          absent: absentees.length,
          late: records.filter(r => r.attendance_status === 'late').length,
          excused: records.filter(r => r.attendance_status === 'excused').length,
          unmarked: records.filter(r => r.attendance_status === 'unmarked').length,
          attendancePercentage: records.length > 0
            ? Math.round((records.filter(r => r.attendance_status === 'present').length / records.length) * 1000) / 10
            : 0,
        },
        records: records.map((r, i) => ({
          serialNumber: i + 1,
          usn: r.student_usn_snapshot,
          fullName: r.student_name_snapshot,
          status: r.attendance_status,
        })),
        absentees,
      };

      if (format === 'excel') {
        exportAttendanceExcel(reportData);
      } else if (format === 'pdf') {
        exportAttendancePDF(reportData);
      } else {
        downloadAbsenteesOnlySimple(reportData, 'xlsx');
      }
      success('Export Generated', `Attendance files created for ${formatDate(session.session_date)}.`);
    } catch (err: any) {
      error('Export failed', err?.message);
    }
  };

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        s =>
          (s.class_name || '').toLowerCase().includes(q) ||
          (s.subject_name || '').toLowerCase().includes(q) ||
          (s.remarks || '').toLowerCase().includes(q)
      );
    }

    if (selectedClassId !== 'all') {
      result = result.filter(s => s.class_id === selectedClassId);
    }

    if (selectedSubjectId !== 'all') {
      result = result.filter(s => s.subject_id === selectedSubjectId);
    }

    if (dateFilter) {
      result = result.filter(s => s.session_date === dateFilter);
    }

    return result;
  }, [sessions, searchQuery, selectedClassId, selectedSubjectId, dateFilter]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Attendance History & Archives
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit past classroom sessions, inspect absentee registries, and re-export official documents.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search class or subject..."
            className="w-full h-8.5 pl-8.5 pr-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <select
          value={selectedClassId}
          onChange={e => setSelectedClassId(e.target.value)}
          className="h-8.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
        >
          <option value="all">All Classes</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>
              {c.class_name} (Sec {c.section})
            </option>
          ))}
        </select>

        <select
          value={selectedSubjectId}
          onChange={e => setSelectedSubjectId(e.target.value)}
          className="h-8.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
        >
          <option value="all">All Subjects</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>
              {s.subject_name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="h-8.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
        />
      </div>

      {/* Sessions Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        {filteredSessions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <History className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              No attendance sessions found
            </p>
            <p>Sessions recorded will automatically appear here with full export capabilities.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Date & Time</th>
                  <th className="py-2.5 px-4">Class</th>
                  <th className="py-2.5 px-4">Subject</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Quick Export</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSessions.map(session => (
                  <tr key={session.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatDate(session.session_date)}
                      </span>
                      <span className="block text-[11px] text-slate-400 font-mono">
                        {formatTime(session.start_time)}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {session.class_name}
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-slate-700 dark:text-slate-300">
                        {session.subject_name}
                      </span>
                      {session.subject_code && (
                        <span className="ml-1.5 px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500">
                          {session.subject_code}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <Badge variant={session.status === 'finalized' ? 'finalized' : 'draft'}>
                        {session.status.toUpperCase()}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickExport(session, 'absentees')}
                          className="px-2 py-1 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 text-[11px] font-medium transition-colors"
                          title="Download Absentees List (.xlsx)"
                        >
                          Absentees
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickExport(session, 'excel')}
                          className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Download Excel (.xlsx)"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickExport(session, 'pdf')}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Download PDF (.pdf)"
                        >
                          <FileText className="w-4 h-4 text-rose-600" />
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenSession(session.id)}
                        className="text-xs"
                      >
                        Open Session
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
