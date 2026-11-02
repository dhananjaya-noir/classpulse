import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Student } from '@/types';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: { usn: string; fullName: string; section?: string }) => Promise<void>;
  initialData?: Student | null;
  existingUsns?: string[];
}

export function StudentModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  existingUsns = [],
}: StudentModalProps) {
  const [usn, setUsn] = useState(initialData?.usn || '');
  const [fullName, setFullName] = useState(initialData?.full_name || '');
  const [section, setSection] = useState('A');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsn = usn.trim().toUpperCase();
    const cleanName = fullName.trim();

    if (!cleanUsn) {
      setError('USN / Roll Number is required.');
      return;
    }
    if (!cleanName) {
      setError('Student name is required.');
      return;
    }

    // Check duplicate USN if creating new student
    if (!initialData && existingUsns.map(u => u.toUpperCase()).includes(cleanUsn)) {
      setError(`A student with USN "${cleanUsn}" already exists.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        usn: cleanUsn,
        fullName: cleanName,
        section: section.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save student.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Student' : 'Add New Student'}
      description="Enter roll number and full name to register student in roster."
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button size="sm" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>
            {initialData ? 'Update Student' : 'Add Student'}
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
          label="USN / Roll Number"
          placeholder="e.g. 1MS23CS001"
          value={usn}
          onChange={e => {
            setUsn(e.target.value);
            setError('');
          }}
          disabled={Boolean(initialData)} // USN is immutable identifier
          required
        />

        <Input
          label="Student Full Name"
          placeholder="e.g. Aarav Sharma"
          value={fullName}
          onChange={e => {
            setFullName(e.target.value);
            setError('');
          }}
          required
        />

        <Input
          label="Section / Group"
          placeholder="e.g. A"
          value={section}
          onChange={e => setSection(e.target.value)}
        />
      </form>
    </Modal>
  );
}
