import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Subject } from '@/types';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subject: { subject_name: string; subject_code: string }) => Promise<void>;
  initialData?: Subject | null;
}

export function SubjectModal({ isOpen, onClose, onSave, initialData }: SubjectModalProps) {
  const [subjectName, setSubjectName] = useState(initialData?.subject_name || '');
  const [subjectCode, setSubjectCode] = useState(initialData?.subject_code || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) {
      setError('Subject name is required.');
      return;
    }
    if (!subjectCode.trim()) {
      setError('Subject code is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        subject_name: subjectName.trim(),
        subject_code: subjectCode.trim().toUpperCase(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save subject.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Subject' : 'Add Subject'}
      description="Register an academic subject or course code."
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button size="sm" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>
            {initialData ? 'Update Subject' : 'Add Subject'}
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
          label="Subject Name"
          placeholder="e.g. Computer Networks"
          value={subjectName}
          onChange={e => {
            setSubjectName(e.target.value);
            setError('');
          }}
          required
        />

        <Input
          label="Subject / Course Code"
          placeholder="e.g. CS501"
          value={subjectCode}
          onChange={e => {
            setSubjectCode(e.target.value);
            setError('');
          }}
          required
        />
      </form>
    </Modal>
  );
}
