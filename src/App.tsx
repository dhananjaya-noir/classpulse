import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginPage } from '@/pages/LoginPage';
import { Sidebar, NavPage } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { DashboardPage } from '@/pages/DashboardPage';
import { AttendancePage } from '@/pages/AttendancePage';
import { RosterPage } from '@/pages/RosterPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ClassModal } from '@/components/roster/ClassModal';
import { SubjectModal } from '@/components/roster/SubjectModal';
import { CreateSessionModal } from '@/components/attendance/CreateSessionModal';
import { RosterImportModal } from '@/components/roster/RosterImportModal';
import { Button } from '@/components/common/Button';
import { storage } from '@/lib/storage';
import { ClassItem, Subject, AttendanceSession, ClassEnrollment, Student } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { SAMPLE_STUDENTS_70 } from '@/lib/sampleData';

export function App() {
  const { user, isLoading } = useAuth();
  const { success, error } = useToast();

  const [currentPage, setCurrentPage] = useState<NavPage>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Core Application Data State
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [enrollments, setEnrollments] = useState<Array<ClassEnrollment & { student: Student }>>([]);

  // Modals state
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isCreateSessionModalOpen, setIsCreateSessionModalOpen] = useState(false);
  const [isImportRosterModalOpen, setIsImportRosterModalOpen] = useState(false);

  const ownerId = user?.id || 'demo-faculty-001';

  // Load all initial data
  const loadInitialData = useCallback(async () => {
    try {
      // 1. Load Classes
      const loadedClasses = await storage.getClasses(ownerId);
      setClasses(loadedClasses);

      let currentClassId = selectedClassId;
      if (!currentClassId && loadedClasses.length > 0) {
        currentClassId = loadedClasses[0].id;
        setSelectedClassId(currentClassId);
      }

      // 2. Load Subjects
      let loadedSubjects = await storage.getSubjects(ownerId);
      if (loadedSubjects.length === 0) {
        // Pre-populate core subjects for convenient initial setup
        const defaultSubject: Subject = {
          id: crypto.randomUUID(),
          owner_id: ownerId,
          subject_name: 'Computer Networks',
          subject_code: 'CS501',
          created_at: new Date().toISOString(),
        };
        await storage.saveSubject(defaultSubject);
        loadedSubjects = [defaultSubject];
      }
      setSubjects(loadedSubjects);

      // 3. Load Sessions
      const loadedSessions = await storage.getSessions(ownerId);
      setSessions(loadedSessions);

      // 4. Load Enrollments for current class
      if (currentClassId) {
        const loadedEnrollments = await storage.getClassEnrollments(currentClassId);
        setEnrollments(loadedEnrollments);
      }
    } catch (err: any) {
      console.error('Error loading initial data:', err);
    }
  }, [ownerId, selectedClassId]);

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user, loadInitialData]);

  // Handle class selection change
  const handleSelectClass = async (classId: string) => {
    setSelectedClassId(classId);
    const loadedEnrollments = await storage.getClassEnrollments(classId);
    setEnrollments(loadedEnrollments);
  };

  // Create new class handler
  const handleSaveClass = async (classData: Omit<ClassItem, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => {
    const newClass: ClassItem = {
      ...classData,
      id: crypto.randomUUID(),
      owner_id: ownerId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await storage.saveClass(newClass);
    setClasses(prev => [...prev, newClass]);
    setSelectedClassId(newClass.id);
    setEnrollments([]);
    success('Class Created', `Created ${newClass.class_name} (Sec ${newClass.section}).`);
  };

  // Create new subject handler
  const handleSaveSubject = async (subjectData: { subject_name: string; subject_code: string }) => {
    const newSubject: Subject = {
      id: crypto.randomUUID(),
      owner_id: ownerId,
      subject_name: subjectData.subject_name,
      subject_code: subjectData.subject_code,
      created_at: new Date().toISOString(),
    };

    await storage.saveSubject(newSubject);
    setSubjects(prev => [...prev, newSubject]);
    success('Subject Added', `${newSubject.subject_name} (${newSubject.subject_code}) created.`);
  };

  // Create new attendance session handler
  const handleSessionCreated = async (sessionData: {
    class_id: string;
    subject_id: string;
    session_date: string;
    start_time: string;
    remarks?: string;
  }) => {
    const selectedCls = classes.find(c => c.id === sessionData.class_id);
    const selectedSub = subjects.find(s => s.id === sessionData.subject_id);

    const newSession: AttendanceSession = {
      id: crypto.randomUUID(),
      owner_id: ownerId,
      class_id: sessionData.class_id,
      subject_id: sessionData.subject_id,
      session_date: sessionData.session_date,
      start_time: sessionData.start_time,
      status: 'in_progress',
      remarks: sessionData.remarks,
      created_by: ownerId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      class_name: selectedCls?.class_name,
      subject_name: selectedSub?.subject_name,
      subject_code: selectedSub?.subject_code,
    };

    await storage.saveSession(newSession);
    setSessions(prev => [newSession, ...prev]);
    setActiveSession(newSession);
    setCurrentPage('attendance');
    success('Session Started', `Attendance register open for ${newSession.subject_name}.`);
  };

  // Open existing session
  const handleOpenSession = async (sessionId: string) => {
    const sess = await storage.getSessionById(sessionId);
    if (sess) {
      setActiveSession(sess);
      setCurrentPage('attendance');
    }
  };

  // Refresh current class enrollments
  const handleRefreshRoster = async () => {
    if (selectedClassId) {
      const updated = await storage.getClassEnrollments(selectedClassId);
      setEnrollments(updated);
    }
  };

  // Bulk import into selected class
  const handleImportRoster = async (
    studentsToImport: Array<{ usn: string; fullName: string; section?: string }>
  ) => {
    if (!selectedClassId) return;

    const newStudents: Student[] = studentsToImport.map(s => ({
      id: crypto.randomUUID(),
      owner_id: ownerId,
      usn: s.usn,
      full_name: s.fullName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    await storage.saveStudents(newStudents, ownerId);
    await storage.enrollStudents(
      selectedClassId,
      newStudents.map(s => s.id),
      ownerId
    );
    await handleRefreshRoster();
  };

  // Start Quick Attendance CTA action
  const handleStartQuickAttendance = () => {
    if (classes.length === 0) {
      setIsClassModalOpen(true);
      return;
    }
    setIsCreateSessionModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-slate-500">Initializing ClassPulse...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const selectedClass = classes.find(c => c.id === selectedClassId) || null;

  const pageTitles: Record<NavPage, string> = {
    dashboard: 'Classroom Dashboard',
    attendance: activeSession ? `${activeSession.subject_name} Attendance` : 'Attendance Register',
    roster: 'Student Roster',
    history: 'Attendance History',
    reports: 'Reports & Document Exports',
    settings: 'Settings & Preferences',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <Header
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          classes={classes}
          selectedClassId={selectedClassId}
          onSelectClass={handleSelectClass}
          onOpenCreateClass={() => setIsClassModalOpen(true)}
          onQuickStartAttendance={handleStartQuickAttendance}
          title={pageTitles[currentPage]}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {currentPage === 'dashboard' && (
            <DashboardPage
              classes={classes}
              selectedClass={selectedClass}
              sessions={sessions}
              enrolledStudents={enrollments.map(e => e.student)}
              onNavigate={setCurrentPage}
              onOpenCreateClass={() => setIsClassModalOpen(true)}
              onOpenImportRoster={() => setIsImportRosterModalOpen(true)}
              onStartAttendance={handleStartQuickAttendance}
              onOpenSession={handleOpenSession}
            />
          )}

          {currentPage === 'attendance' && (
            activeSession ? (
              <AttendancePage
                session={activeSession}
                classes={classes}
                subjects={subjects}
                onBackToDashboard={() => setCurrentPage('dashboard')}
                onSessionUpdated={updated => {
                  setActiveSession(updated);
                  setSessions(prev => prev.map(s => (s.id === updated.id ? updated : s)));
                }}
              />
            ) : (
              <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md mx-auto space-y-3">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No active session selected
                </p>
                <p className="text-xs text-slate-500">
                  Open an existing session or start a new attendance period.
                </p>
                <Button size="sm" variant="primary" onClick={handleStartQuickAttendance}>
                  Start New Session
                </Button>
              </div>
            )
          )}

          {currentPage === 'roster' && (
            <RosterPage
              selectedClass={selectedClass}
              classes={classes}
              onSelectClass={handleSelectClass}
              enrollments={enrollments}
              onRefreshRoster={handleRefreshRoster}
              onOpenCreateClass={() => setIsClassModalOpen(true)}
            />
          )}

          {currentPage === 'history' && (
            <HistoryPage
              sessions={sessions}
              classes={classes}
              subjects={subjects}
              onOpenSession={handleOpenSession}
              onRefreshSessions={async () => {
                const updated = await storage.getSessions(ownerId);
                setSessions(updated);
              }}
            />
          )}

          {currentPage === 'reports' && (
            <ReportsPage
              sessions={sessions}
              classes={classes}
              subjects={subjects}
            />
          )}

          {currentPage === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Modals */}
      <ClassModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        onSave={handleSaveClass}
      />

      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        onSave={handleSaveSubject}
      />

      <CreateSessionModal
        isOpen={isCreateSessionModalOpen}
        onClose={() => setIsCreateSessionModalOpen(false)}
        classes={classes}
        subjects={subjects}
        existingSessions={sessions}
        onSessionCreated={handleSessionCreated}
        onOpenCreateSubject={() => setIsSubjectModalOpen(true)}
        defaultClassId={selectedClassId}
      />

      <RosterImportModal
        isOpen={isImportRosterModalOpen}
        onClose={() => setIsImportRosterModalOpen(false)}
        onImportConfirmed={handleImportRoster}
        existingUsns={enrollments.map(e => e.student.usn)}
      />
    </div>
  );
}
export default App;
