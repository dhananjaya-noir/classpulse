import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  AttendanceSession, 
  StudentAttendanceRow, 
  AttendanceStatus, 
  AttendanceActionUndo, 
  ClassItem, 
  Subject, 
  AttendanceReportData 
} from '@/types';
import { storage } from '@/lib/storage';
import { calculateAttendanceStats, formatDate, formatTime } from '@/lib/utils';
import { AttendanceStatsBar } from '@/components/attendance/AttendanceStatsBar';
import { StudentAttendanceTable } from '@/components/attendance/StudentAttendanceTable';
import { FinalizeModal } from '@/components/attendance/FinalizeModal';
import { QuickAddStudentModal } from '@/components/attendance/QuickAddStudentModal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Check, 
  X, 
  RotateCcw, 
  Search, 
  CheckCircle2, 
  Download, 
  CloudCheck, 
  CloudAlert, 
  Lock, 
  Unlock,
  ArrowUpDown,
  Filter,
  UserPlus
} from 'lucide-react';
import { downloadAbsenteesOnlySimple, exportAttendanceExcel } from '@/lib/export';

interface AttendancePageProps {
  session: AttendanceSession;
  classes: ClassItem[];
  subjects: Subject[];
  onBackToDashboard: () => void;
  onSessionUpdated: (session: AttendanceSession) => void;
}

export function AttendancePage({
  session,
  classes,
  subjects,
  onBackToDashboard,
  onSessionUpdated,
}: AttendancePageProps) {
  const { user, profile } = useAuth();
  const { success, error, info } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<StudentAttendanceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'offline'>('saved');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | AttendanceStatus>('all');
  const [sortBy, setSortBy] = useState<'usn_asc' | 'usn_desc' | 'name_asc' | 'status'>('usn_asc');

  // Undo Stack
  const [undoStack, setUndoStack] = useState<AttendanceActionUndo[]>([]);

  // Modals
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

  // Quick Add Student directly to active session
  const handleQuickAddStudent = async (data: {
    usn: string;
    fullName: string;
    initialStatus: AttendanceStatus;
  }) => {
    const ownerId = user?.id || 'demo-faculty-001';
    const newStudentId = crypto.randomUUID();
    const newStudent = {
      id: newStudentId,
      owner_id: ownerId,
      usn: data.usn,
      full_name: data.fullName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await storage.saveStudents([newStudent], ownerId);
    await storage.enrollStudents(session.class_id, [newStudentId], ownerId);

    const newRow: StudentAttendanceRow = {
      studentId: newStudentId,
      usn: data.usn,
      fullName: data.fullName,
      status: data.initialStatus,
      markedAt: new Date().toISOString(),
      recordId: crypto.randomUUID(),
    };

    const updated = [...rows, newRow];
    setRows(updated);
    persistChanges(updated);
    success('Student Added', `${data.fullName} (${data.usn}) added to session.`);
  };

  // Load roster and attendance records
  useEffect(() => {
    let isMounted = true;
    async function loadAttendanceData() {
      setIsLoading(true);
      try {
        // 1. Get class enrollments (to know all students)
        const enrollments = await storage.getClassEnrollments(session.class_id);

        // 2. Get existing attendance records for this session
        const existingRecords = await storage.getAttendanceRecords(session.id);
        const recordMap = new Map(existingRecords.map(r => [r.student_id, r]));

        if (!isMounted) return;

        // 3. Build composite attendance rows
        const initialRows: StudentAttendanceRow[] = enrollments.map(e => {
          const rec = recordMap.get(e.student_id);
          return {
            studentId: e.student_id,
            usn: e.student.usn,
            fullName: e.student.full_name,
            status: rec ? rec.attendance_status : 'unmarked',
            markedAt: rec ? rec.marked_at : new Date().toISOString(),
            recordId: rec ? rec.id : undefined,
          };
        });

        // Initial sort by USN
        initialRows.sort((a, b) => a.usn.localeCompare(b.usn, undefined, { numeric: true }));
        setRows(initialRows);
      } catch (err: any) {
        error('Load failed', err?.message || 'Failed to load attendance roster.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAttendanceData();
    return () => {
      isMounted = false;
    };
  }, [session.id, session.class_id]);

  // Keyboard shortcut listener: `/` to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute live statistics
  const stats = useMemo(() => {
    return calculateAttendanceStats(rows.map(r => r.status));
  }, [rows]);

  // Auto-save attendance records to storage
  const persistChanges = async (updatedRows: StudentAttendanceRow[]) => {
    setSaveStatus('saving');
    try {
      const ownerId = user?.id || 'demo-faculty-001';
      const recordsToSave = updatedRows.map(r => ({
        id: r.recordId || crypto.randomUUID(),
        owner_id: ownerId,
        session_id: session.id,
        student_id: r.studentId,
        student_name_snapshot: r.fullName,
        student_usn_snapshot: r.usn,
        attendance_status: r.status,
        markedAt: r.markedAt,
        marked_at: r.markedAt,
        updated_at: new Date().toISOString(),
      }));

      await storage.saveAttendanceRecords(session.id, recordsToSave, ownerId);
      setSaveStatus(navigator.onLine ? 'saved' : 'offline');
    } catch (err) {
      console.error('Failed to autosave attendance records:', err);
      setSaveStatus('offline');
    }
  };

  // 1. INDIVIDUAL STATUS CHANGE (1-Click toggle)
  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    if (session.status === 'finalized') {
      info('Session Finalized', 'Reopen this session to make adjustments.');
      return;
    }

    const targetRow = rows.find(r => r.studentId === studentId);
    if (!targetRow || targetRow.status === newStatus) return;

    // Push to undo stack
    setUndoStack(prev => [
      {
        type: 'MARK_INDIVIDUAL',
        description: `Marked ${targetRow.usn} as ${newStatus}`,
        previousRecords: [{ studentId, previousStatus: targetRow.status }],
        timestamp: Date.now(),
      },
      ...prev.slice(0, 20), // Retain last 20 operations
    ]);

    const updated = rows.map(r =>
      r.studentId === studentId
        ? { ...r, status: newStatus, markedAt: new Date().toISOString() }
        : r
    );

    setRows(updated);
    persistChanges(updated);
  };

  // 2. BULK ACTION: MARK EVERYONE PRESENT (Core immediate requirement)
  const handleMarkEveryonePresent = () => {
    if (session.status === 'finalized') return;

    // Save previous state for undo
    setUndoStack(prev => [
      {
        type: 'MARK_ALL_PRESENT',
        description: 'Marked all students Present',
        previousRecords: rows.map(r => ({ studentId: r.studentId, previousStatus: r.status })),
        timestamp: Date.now(),
      },
      ...prev.slice(0, 20),
    ]);

    const nowIso = new Date().toISOString();
    const updated = rows.map(r => ({
      ...r,
      status: 'present' as AttendanceStatus,
      markedAt: nowIso,
    }));

    setRows(updated);
    persistChanges(updated);
    success('Marked All Present', `${rows.length} students recorded present.`);
  };

  // 3. BULK ACTION: MARK EVERYONE ABSENT
  const handleMarkEveryoneAbsent = () => {
    if (session.status === 'finalized') return;

    setUndoStack(prev => [
      {
        type: 'MARK_ALL_ABSENT',
        description: 'Marked all students Absent',
        previousRecords: rows.map(r => ({ studentId: r.studentId, previousStatus: r.status })),
        timestamp: Date.now(),
      },
      ...prev.slice(0, 20),
    ]);

    const nowIso = new Date().toISOString();
    const updated = rows.map(r => ({
      ...r,
      status: 'absent' as AttendanceStatus,
      markedAt: nowIso,
    }));

    setRows(updated);
    persistChanges(updated);
    info('Marked All Absent', `${rows.length} students recorded absent.`);
  };

  // 4. BULK ACTION: RESET ALL
  const handleResetAll = () => {
    if (session.status === 'finalized') return;

    setUndoStack(prev => [
      {
        type: 'RESET_ALL',
        description: 'Reset all attendance statuses to Unmarked',
        previousRecords: rows.map(r => ({ studentId: r.studentId, previousStatus: r.status })),
        timestamp: Date.now(),
      },
      ...prev.slice(0, 20),
    ]);

    const updated = rows.map(r => ({
      ...r,
      status: 'unmarked' as AttendanceStatus,
    }));

    setRows(updated);
    persistChanges(updated);
    info('Reset Completed', 'All student attendance statuses reset.');
  };

  // 5. UNDO LAST ACTION
  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const [lastAction, ...remainingStack] = undoStack;
    const revertMap = new Map(lastAction.previousRecords.map(p => [p.studentId, p.previousStatus]));

    const updated = rows.map(r => {
      const prevStatus = revertMap.get(r.studentId);
      return prevStatus ? { ...r, status: prevStatus } : r;
    });

    setRows(updated);
    setUndoStack(remainingStack);
    persistChanges(updated);
    info('Action Undone', `Reverted: ${lastAction.description}`);
  };

  // Resolve remaining unmarked students
  const handleMarkRemainingPresent = () => {
    const updated = rows.map(r =>
      r.status === 'unmarked' ? { ...r, status: 'present' as AttendanceStatus } : r
    );
    setRows(updated);
    persistChanges(updated);
    success('Remaining Marked', 'All unmarked students marked Present.');
  };

  const handleMarkRemainingAbsent = () => {
    const updated = rows.map(r =>
      r.status === 'unmarked' ? { ...r, status: 'absent' as AttendanceStatus } : r
    );
    setRows(updated);
    persistChanges(updated);
    info('Remaining Marked', 'All unmarked students marked Absent.');
  };

  // Finalize Session
  const handleConfirmFinalize = async () => {
    try {
      const updatedSession: AttendanceSession = {
        ...session,
        status: 'finalized',
        finalized_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await storage.saveSession(updatedSession);
      onSessionUpdated(updatedSession);
      success('Session Finalized', 'Attendance locked and official records generated.');
    } catch (err: any) {
      error('Finalize failed', err?.message || 'Could not finalize session.');
    }
  };

  // Reopen Session
  const handleReopenSession = async () => {
    try {
      const updatedSession: AttendanceSession = {
        ...session,
        status: 'in_progress',
        finalized_at: null,
        updated_at: new Date().toISOString(),
      };
      await storage.saveSession(updatedSession);
      onSessionUpdated(updatedSession);
      success('Session Reopened', 'You can now modify student attendance statuses.');
      setIsFinalizeModalOpen(false);
    } catch (err: any) {
      error('Reopen failed', err?.message || 'Could not reopen session.');
    }
  };

  // Prepare standard report data for exports
  const reportData: AttendanceReportData = useMemo(() => {
    const absenteesList = rows
      .filter(r => r.status === 'absent')
      .map((r, i) => ({
        serialNumber: i + 1,
        usn: r.usn,
        fullName: r.fullName,
      }));

    const recordsList = rows.map((r, i) => ({
      serialNumber: i + 1,
      usn: r.usn,
      fullName: r.fullName,
      status: r.status,
    }));

    const currentClass = classes.find(c => c.id === session.class_id);
    const currentSubject = subjects.find(s => s.id === session.subject_id);

    return {
      institutionName: profile?.institution_name || 'University Department of Computer Science',
      className: currentClass?.class_name || session.class_name || 'Class',
      semester: currentClass?.semester || 'Semester 5',
      section: currentClass?.section || 'A',
      academicYear: currentClass?.academic_year || '2026-2027',
      subjectName: currentSubject?.subject_name || session.subject_name || 'Subject',
      subjectCode: currentSubject?.subject_code || session.subject_code || '',
      date: session.session_date,
      startTime: session.start_time,
      stats,
      records: recordsList,
      absentees: absenteesList,
    };
  }, [rows, session, classes, subjects, stats, profile]);

  // Filtered & Sorted Rows
  const displayedRows = useMemo(() => {
    let result = [...rows];

    // Filter by query (USN or Name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        r => r.usn.toLowerCase().includes(q) || r.fullName.toLowerCase().includes(q)
      );
    }

    // Filter by status
    if (activeFilter !== 'all') {
      result = result.filter(r => r.status === activeFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'usn_asc') {
        return a.usn.localeCompare(b.usn, undefined, { numeric: true });
      }
      if (sortBy === 'usn_desc') {
        return b.usn.localeCompare(a.usn, undefined, { numeric: true });
      }
      if (sortBy === 'name_asc') {
        return a.fullName.localeCompare(b.fullName);
      }
      if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

    return result;
  }, [rows, searchQuery, activeFilter, sortBy]);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p>Loading classroom attendance register...</p>
      </div>
    );
  }

  const isFinalized = session.status === 'finalized';

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Session Metadata Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant={isFinalized ? 'finalized' : 'draft'}>
              {isFinalized ? 'FINALIZED' : 'IN PROGRESS'}
            </Badge>
            <span className="text-xs text-slate-400 font-mono">
              {formatDate(session.session_date)} at {formatTime(session.start_time)}
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>{session.subject_name}</span>
            {session.subject_code && (
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono font-medium">
                {session.subject_code}
              </span>
            )}
          </h2>

          <p className="text-xs text-slate-500">
            {session.class_name} {session.remarks ? `• ${session.remarks}` : ''}
          </p>
        </div>

        {/* Sync status & Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
            {saveStatus === 'saving' ? (
              <span className="text-teal-600 font-medium">Saving...</span>
            ) : saveStatus === 'offline' ? (
              <span className="text-amber-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Saved Locally
              </span>
            ) : (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Cloud Synced
              </span>
            )}
          </div>

          {isFinalized ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadAbsenteesOnlySimple(reportData, 'xlsx')}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Download Absentees
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsFinalizeModalOpen(true)}
              >
                View Report & Exports
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="success"
              onClick={() => setIsFinalizeModalOpen(true)}
              leftIcon={<Check className="w-3.5 h-3.5 stroke-[2.5]" />}
            >
              Review & Finalize
            </Button>
          )}
        </div>
      </div>

      {/* Completion & Stats Filters Bar */}
      <AttendanceStatsBar
        stats={stats}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Prominent Main Bulk Actions Toolbar */}
      {!isFinalized && (
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Mark Everyone Present (Highest priority control) */}
            <Button
              size="sm"
              variant="primary"
              onClick={handleMarkEveryonePresent}
              leftIcon={<Check className="w-4 h-4 stroke-[2.5]" />}
              className="bg-emerald-600 hover:bg-emerald-700 border-emerald-500 font-semibold"
            >
              MARK EVERYONE PRESENT
            </Button>

            {/* Mark Everyone Absent */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkEveryoneAbsent}
              leftIcon={<X className="w-3.5 h-3.5 text-rose-500 stroke-[2.5]" />}
              className="text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50"
            >
              Mark Everyone Absent
            </Button>

            {/* Reset All */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetAll}
            >
              Reset All
            </Button>

            {/* Quick Add Student Directly to Current Session */}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsAddStudentModalOpen(true)}
              leftIcon={<UserPlus className="w-3.5 h-3.5 text-teal-600" />}
            >
              Add Student
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Undo Last Action */}
            <Button
              size="sm"
              variant="secondary"
              disabled={undoStack.length === 0}
              onClick={handleUndo}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              title="Undo last attendance status change"
            >
              Undo {undoStack.length > 0 ? `(${undoStack.length})` : ''}
            </Button>

            {/* Instant Absentees Download Shortcut */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadAbsenteesOnlySimple(reportData, 'xlsx')}
              leftIcon={<Download className="w-3.5 h-3.5 text-rose-600" />}
            >
              Absentees ({stats.absent})
            </Button>
          </div>
        </div>
      )}

      {/* Search & Sort Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
        {/* Search input with `/` shortcut */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name or USN... (press /)"
            className="w-full h-8.5 pl-9 pr-8 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Sort:
          </span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="h-8.5 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="usn_asc">USN (Ascending)</option>
            <option value="usn_desc">USN (Descending)</option>
            <option value="name_asc">Name (A — Z)</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* Main Student Attendance Table */}
      <StudentAttendanceTable
        rows={displayedRows}
        onStatusChange={handleStatusChange}
        disabled={isFinalized}
        totalEnrolledCount={rows.length}
      />

      {/* Finalize & Export Modal */}
      <FinalizeModal
        isOpen={isFinalizeModalOpen}
        onClose={() => setIsFinalizeModalOpen(false)}
        stats={stats}
        reportData={reportData}
        onConfirmFinalize={handleConfirmFinalize}
        onMarkRemainingPresent={handleMarkRemainingPresent}
        onMarkRemainingAbsent={handleMarkRemainingAbsent}
        isFinalized={isFinalized}
        onReopenSession={isFinalized ? handleReopenSession : undefined}
      />

      {/* Quick Add Student Modal */}
      <QuickAddStudentModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        onAddStudent={handleQuickAddStudent}
        existingUsns={rows.map(r => r.usn)}
      />
    </div>
  );
}
