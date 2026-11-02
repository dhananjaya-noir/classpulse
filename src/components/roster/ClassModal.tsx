import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { ClassItem } from '@/types';

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (classData: Omit<ClassItem, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  initialData?: ClassItem | null;
}

export function ClassModal({ isOpen, onClose, onSave, initialData }: ClassModalProps) {
  const [className, setClassName] = useState(initialData?.class_name || 'PES University — 1st Semester');
  const [academicYear, setAcademicYear] = useState(initialData?.academic_year || '2026-2027');
  const [semester, setSemester] = useState(initialData?.semester || 'Semester 1');
  const [section, setSection] = useState(initialData?.section || 'D');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) {
      setError('Class name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        class_name: className.trim(),
        academic_year: academicYear.trim(),
        semester: semester.trim(),
        section: section.trim() || 'A',
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save class.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Class' : 'Create New Class'}
      description="Define class details for attendance and student roster tracking."
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button size="sm" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>
            {initialData ? 'Update Class' : 'Create Class'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
            {error}
          </div>
        )}

        <Input
          label="Class / Course Name"
          placeholder="e.g. Computer Science & Engineering (3rd Year)"
          value={className}
          onChange={e => {
            setClassName(e.target.value);
            setError('');
          }}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Academic Year"
            placeholder="e.g. 2026-2027"
            value={academicYear}
            onChange={e => setAcademicYear(e.target.value)}
            required
          />

          <Select
            label="Semester"
            value={semester}
            onChange={e => setSemester(e.target.value)}
            options={[
              { label: 'Semester 1', value: 'Semester 1' },
              { label: 'Semester 2', value: 'Semester 2' },
              { label: 'Semester 3', value: 'Semester 3' },
              { label: 'Semester 4', value: 'Semester 4' },
              { label: 'Semester 5', value: 'Semester 5' },
              { label: 'Semester 6', value: 'Semester 6' },
              { label: 'Semester 7', value: 'Semester 7' },
              { label: 'Semester 8', value: 'Semester 8' },
            ]}
          />
        </div>

        <Input
          label="Section / Group"
          placeholder="e.g. A, B, or Morning Batch"
          value={section}
          onChange={e => setSection(e.target.value)}
        />
      </form>
    </Modal>
  );
}
