import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Upload, 
  Search, 
  Trash2, 
  Edit3, 
  Download, 
  Sparkles,
  UserX,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ClassItem, Student, ClassEnrollment } from '@/types';
import { StudentModal } from '@/components/roster/StudentModal';
import { RosterImportModal } from '@/components/roster/RosterImportModal';
import { storage } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { downloadSampleCSV, SAMPLE_STUDENTS_70 } from '@/lib/sampleData';

interface RosterPageProps {
  selectedClass: ClassItem | null;
  classes: ClassItem[];
  onSelectClass: (id: string) => void;
  enrollments: Array<ClassEnrollment & { student: Student }>;
  onRefreshRoster: () => Promise<void>;
  onOpenCreateClass: () => void;
}

export function RosterPage({
  selectedClass,
  classes,
  onSelectClass,
  enrollments,
  onRefreshRoster,
  onOpenCreateClass,
}: RosterPageProps) {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'usn' | 'name'>('usn');

  // Modals
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const existingUsns = enrollments.map(e => e.student.usn);

  // Add or Edit Student
  const handleSaveStudent = async (studentData: { usn: string; fullName: string; section?: string }) => {
    if (!selectedClass) return;
    const ownerId = user?.id || 'demo-faculty-001';

    try {
      if (editingStudent) {
        // Edit existing student
        const updated: Student = {
          ...editingStudent,
          full_name: studentData.fullName,
          updated_at: new Date().toISOString(),
        };
        await storage.saveStudents([updated], ownerId);
        success('Student Updated', `${studentData.fullName} details updated.`);
      } else {
        // Create student and enroll in class
        const newStudentId = crypto.randomUUID();
        const newStudent: Student = {
          id: newStudentId,
          owner_id: ownerId,
          usn: studentData.usn,
          full_name: studentData.fullName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await storage.saveStudents([newStudent], ownerId);
        await storage.enrollStudents(selectedClass.id, [newStudentId], ownerId);
        success('Student Added', `${studentData.fullName} enrolled in class.`);
      }
      await onRefreshRoster();
    } catch (err: any) {
      error('Failed to save student', err?.message);
    }
  };

  // Bulk Import Students
  const handleImportConfirmed = async (
    studentsToImport: Array<{ usn: string; fullName: string; section?: string }>
  ) => {
    if (!selectedClass) return;
    const ownerId = user?.id || 'demo-faculty-001';

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
      selectedClass.id,
      newStudents.map(s => s.id),
      ownerId
    );
    await onRefreshRoster();
  };

  // Remove enrollment
  const handleRemoveEnrollment = async (enrollmentId: string, name: string) => {
    if (!selectedClass) return;
    const ownerId = user?.id || 'demo-faculty-001';
    if (!window.confirm(`Are you sure you want to remove ${name} from this class roster?`)) {
      return;
    }

    try {
      await storage.removeEnrollment(enrollmentId, ownerId);
      success('Removed', `${name} removed from active class roster.`);
      await onRefreshRoster();
    } catch (err: any) {
      error('Removal failed', err?.message);
    }
  };

  // Quick 70-student loader
  const handleLoadSampleRoster = async () => {
    if (!selectedClass) return;
    await handleImportConfirmed(
      SAMPLE_STUDENTS_70.map(s => ({ usn: s.usn, fullName: s.fullName, section: selectedClass.section }))
    );
    success('Sample Roster Enrolled', '70 realistic students added to this class.');
  };

  // Filtered & Sorted Enrollments
  const filteredEnrollments = useMemo(() => {
    let result = [...enrollments];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        e => e.student.usn.toLowerCase().includes(q) || e.student.full_name.toLowerCase().includes(q)
      );
    }

    if (filterActive === 'active') {
      result = result.filter(e => e.is_active);
    } else if (filterActive === 'inactive') {
      result = result.filter(e => !e.is_active);
    }

    result.sort((a, b) => {
      if (sortBy === 'usn') {
        return a.student.usn.localeCompare(b.student.usn, undefined, { numeric: true });
      }
      return a.student.full_name.localeCompare(b.student.full_name);
    });

    return result;
  }, [enrollments, searchQuery, filterActive, sortBy]);

  const activeCount = enrollments.filter(e => e.is_active).length;
  const inactiveCount = enrollments.filter(e => !e.is_active).length;

  if (!selectedClass) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg mx-auto mt-8 shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center mx-auto">
          <Users className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          No Class Selected
        </h3>
        <p className="text-xs text-slate-500">
          Create or choose a class to view and manage its student roster.
        </p>
        <Button size="sm" variant="primary" onClick={onOpenCreateClass} leftIcon={<Plus className="w-4 h-4" />}>
          Create Class
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="neutral">
              {selectedClass.academic_year} • {selectedClass.semester}
            </Badge>
            <span className="text-xs font-semibold text-slate-500">
              Section {selectedClass.section}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
            {selectedClass.class_name} — Student Roster
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeCount} active enrolled students • {inactiveCount} archived
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {enrollments.length === 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleLoadSampleRoster}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
            >
              Load 70-Student Demo
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadSampleCSV()}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Template
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsImportModalOpen(true)}
            leftIcon={<Upload className="w-3.5 h-3.5" />}
          >
            Import Roster
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              setEditingStudent(null);
              setIsStudentModalOpen(true);
            }}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Student
          </Button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search USN or student name..."
            className="w-full h-8.5 pl-9 pr-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setFilterActive('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterActive === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs' : 'text-slate-500'
              }`}
            >
              All ({enrollments.length})
            </button>
            <button
              onClick={() => setFilterActive('active')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterActive === 'active' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Active ({activeCount})
            </button>
          </div>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="h-8 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="usn">Sort by USN</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        {filteredEnrollments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-3">
            <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {enrollments.length === 0 ? 'No students enrolled yet' : 'No students match filter criteria'}
            </p>
            <p>Upload a roster CSV or click "Load 70-Student Demo" to populate the classroom instantly.</p>
            {enrollments.length === 0 && (
              <Button size="sm" variant="primary" onClick={handleLoadSampleRoster} className="mt-2">
                Populate 70 Students
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4 w-12 text-center">#</th>
                  <th className="py-2.5 px-4 w-40">USN / Roll No</th>
                  <th className="py-2.5 px-4">Student Name</th>
                  <th className="py-2.5 px-4 w-28">Status</th>
                  <th className="py-2.5 px-4 text-right w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEnrollments.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-4 text-center text-slate-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {item.student.usn}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {item.student.full_name}
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge variant={item.is_active ? 'active' : 'inactive'} size="sm">
                        {item.is_active ? 'Active' : 'Archived'}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStudent(item.student);
                            setIsStudentModalOpen(true);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          title="Edit student"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveEnrollment(item.id, item.student.full_name)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600"
                          title="Remove from roster"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        onSave={handleSaveStudent}
        initialData={editingStudent}
        existingUsns={existingUsns}
      />

      {/* Bulk Roster Import Modal */}
      <RosterImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportConfirmed={handleImportConfirmed}
        existingUsns={existingUsns}
      />
    </div>
  );
}
