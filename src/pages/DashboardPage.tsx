import React from 'react';
import { 
  ClipboardCheck, 
  Users, 
  Plus, 
  FileSpreadsheet, 
  History, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  ArrowRight,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ClassItem, AttendanceSession, Student } from '@/types';
import { formatDate, formatTime } from '@/lib/utils';
import { NavPage } from '@/components/layout/Sidebar';

interface DashboardPageProps {
  classes: ClassItem[];
  selectedClass: ClassItem | null;
  sessions: AttendanceSession[];
  enrolledStudents: Student[];
  onNavigate: (page: NavPage) => void;
  onOpenCreateClass: () => void;
  onOpenImportRoster: () => void;
  onStartAttendance: () => void;
  onOpenSession: (sessionId: string) => void;
}

export function DashboardPage({
  classes,
  selectedClass,
  sessions,
  enrolledStudents,
  onNavigate,
  onOpenCreateClass,
  onOpenImportRoster,
  onStartAttendance,
  onOpenSession,
}: DashboardPageProps) {
  // Calculations
  const totalStudents = enrolledStudents.length;
  const totalSessions = sessions.length;
  const latestSession = sessions[0] || null;

  // Recent 5 sessions
  const recentSessions = sessions.slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              {selectedClass ? `${selectedClass.academic_year} • ${selectedClass.semester}` : 'Academic Overview'}
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {selectedClass ? selectedClass.class_name : 'Welcome to ClassPulse'}
          </h2>
          <p className="text-xs text-slate-500 max-w-xl">
            High-speed attendance tracking designed for high-density classrooms. Mark 70+ students in seconds, detect absentees instantly, and generate official records.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            size="md"
            variant="primary"
            onClick={onStartAttendance}
            leftIcon={<ClipboardCheck className="w-4 h-4" />}
            className="shadow-xs font-semibold"
          >
            Take Attendance
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          label="Enrolled Students"
          value={totalStudents}
          subValue={selectedClass ? `Sec ${selectedClass.section}` : undefined}
          icon={<Users className="w-4 h-4" />}
          variant="default"
        />

        <StatCard
          label="Recorded Sessions"
          value={totalSessions}
          subValue={latestSession ? formatDate(latestSession.session_date) : 'No sessions'}
          icon={<Calendar className="w-4 h-4" />}
          variant="default"
        />

        <StatCard
          label="Active Class"
          value={selectedClass ? selectedClass.class_name.split(' ')[0] : 'None'}
          subValue={selectedClass ? `${selectedClass.semester}` : 'Create class'}
          icon={<BookOpen className="w-4 h-4" />}
          variant="accent"
        />

        <StatCard
          label="Cloud Registry"
          value="Online"
          subValue="Auto-saving enabled"
          icon={<TrendingUp className="w-4 h-4" />}
          variant="present"
        />
      </div>

      {/* First-time Onboarding Experience (When no classes or students exist) */}
      {classes.length === 0 || totalStudents === 0 ? (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-teal-50/60 to-emerald-50/40 dark:from-slate-900 dark:to-teal-950/20 border border-teal-200/60 dark:border-teal-900/40 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Classroom Setup Checklist</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className={`p-4 rounded-xl border bg-white dark:bg-slate-900 ${classes.length > 0 ? 'border-emerald-300 dark:border-emerald-800' : 'border-slate-200 dark:border-slate-800'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Step 1</span>
                {classes.length > 0 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-2">Create a Class</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Define academic year, course, and section.</p>
              {classes.length === 0 && (
                <Button size="sm" variant="outline" onClick={onOpenCreateClass} className="mt-3 w-full text-xs">
                  Create Class
                </Button>
              )}
            </div>

            <div className={`p-4 rounded-xl border bg-white dark:bg-slate-900 ${totalStudents > 0 ? 'border-emerald-300 dark:border-emerald-800' : 'border-slate-200 dark:border-slate-800'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Step 2</span>
                {totalStudents > 0 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-2">Import Student Roster</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Upload .csv/.xlsx or load 70-student test data.</p>
              {totalStudents === 0 && (
                <Button size="sm" variant="primary" onClick={onOpenImportRoster} className="mt-3 w-full text-xs">
                  Import Students
                </Button>
              )}
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-xs font-bold text-slate-400">Step 3</span>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-2">Take Attendance</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">1-click mark present, tap absentees.</p>
              <Button size="sm" variant="secondary" onClick={onStartAttendance} className="mt-3 w-full text-xs" disabled={totalStudents === 0}>
                Start Register
              </Button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-xs font-bold text-slate-400">Step 4</span>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-2">Download Reports</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Official Excel (3 sheets), CSV, and PDF.</p>
              <Button size="sm" variant="ghost" onClick={() => onNavigate('reports')} className="mt-3 w-full text-xs">
                View Reports
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Quick Actions Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Quick Workflows
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            type="button"
            onClick={onStartAttendance}
            className="p-3.5 rounded-xl border border-teal-200 dark:border-teal-800/60 bg-teal-50/40 dark:bg-teal-950/30 hover:bg-teal-50 dark:hover:bg-teal-900/40 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center mb-2.5 shadow-2xs group-hover:scale-105 transition-transform">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Take Attendance</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Start session</p>
          </button>

          <button
            type="button"
            onClick={onOpenCreateClass}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Create Class</p>
            <p className="text-[10px] text-slate-500 mt-0.5">New section</p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('roster')}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Manage Students</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Edit roster</p>
          </button>

          <button
            type="button"
            onClick={onOpenImportRoster}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Import Roster</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Excel / CSV / Paste</p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('history')}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <History className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Session History</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Audit past dates</p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('reports')}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Reports & Analytics</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Download files</p>
          </button>
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Recent Attendance Sessions
          </h3>
          {sessions.length > 5 && (
            <button
              type="button"
              onClick={() => onNavigate('history')}
              className="text-xs font-medium text-teal-600 hover:underline flex items-center gap-1"
            >
              <span>View all ({sessions.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          {recentSessions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              <p>No attendance sessions recorded yet.</p>
              <Button size="sm" variant="outline" onClick={onStartAttendance} className="mt-3">
                Open First Session
              </Button>
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
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentSessions.map(session => (
                    <tr
                      key={session.id}
                      onClick={() => onOpenSession(session.id)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
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
                        <span className="text-teal-600 hover:text-teal-700 font-medium inline-flex items-center gap-1">
                          Open <ArrowRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
