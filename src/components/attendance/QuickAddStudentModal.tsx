import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { AttendanceStatus } from '@/types';
import { UserPlus, Check } from 'lucide-react';

interface QuickAddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudent: (data: {
    usn: string;
    fullName: string;
    initialStatus: AttendanceStatus;
  }) => Promise<void>;
  existingUsns?: string[];
}

export function QuickAddStudentModal({
  isOpen,
  onClose,
  onAddStudent,
  existingUsns = [],
}: QuickAddStudentModalProps) {
  const [usn, setUsn] = useState('');
  const [fullName, setFullName] = useState('');
  const [initialStatus, setInitialStatus] = useState<AttendanceStatus>('present');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsn = usn.trim().toUpperCase();
    const cleanName = fullName.trim();

    if (!cleanUsn) {
      setError('SRN / Roll Number is required.');
      return;
    }
    if (!cleanName) {
      setError('Student name is required.');
      return;
    }

    if (existingUsns.map(u => u.toUpperCase()).includes(cleanUsn)) {
      setError(`A student with SRN "${cleanUsn}" is already in this attendance list.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddStudent({
        usn: cleanUsn,
        fullName: cleanName,
        initialStatus,
      });
      setUsn('');
      setFullName('');
      setInitialStatus('present');
      setError('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to add student.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Student to Attendance List"
      description="Add a new student directly into this classroom session."
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button size="sm" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            isLoading={isSubmitting}
            onClick={handleSubmit}
            leftIcon={<UserPlus className="w-3.5 h-3.5" />}
          >
            Add to Session
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
          label="SRN / Roll Number"
          placeholder="e.g. PES1UG26PY999"
          value={usn}
          onChange={e => {
            setUsn(e.target.value);
            setError('');
          }}
          required
          autoFocus
        />

        <Input
          label="Student Full Name"
          placeholder="e.g. RAHUL SHARMA"
          value={fullName}
          onChange={e => {
            setFullName(e.target.value);
            setError('');
          }}
          required
        />

        <Select
          label="Mark Attendance as:"
          value={initialStatus}
          onChange={e => setInitialStatus(e.target.value as AttendanceStatus)}
          options={[
            { label: 'Present', value: 'present' },
            { label: 'Absent', value: 'absent' },
            { label: 'Late', value: 'late' },
            { label: 'Excused', value: 'excused' },
            { label: 'Unmarked', value: 'unmarked' },
          ]}
        />
      </form>
    </Modal>
  );
}
