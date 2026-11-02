import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ClassItem, Subject, AttendanceSession } from '@/types';
import { getTodayDateString, getCurrentTimeString } from '@/lib/utils';
import { AlertCircle, Calendar, Clock, Plus, BookOpen } from 'lucide-react';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassItem[];
  subjects: Subject[];
  existingSessions: AttendanceSession[];
  onSessionCreated: (sessionData: {
    class_id: string;
    subject_id: string;
    session_date: string;
    start_time: string;
    remarks?: string;
  }) => Promise<void>;
  onOpenCreateSubject: () => void;
  defaultClassId?: string | null;
}

export function CreateSessionModal({
  isOpen,
  onClose,
  classes,
  subjects,
  existingSessions,
  onSessionCreated,
  onOpenCreateSubject,
  defaultClassId,
}: CreateSessionModalProps) {
  const [classId, setClassId] = useState(defaultClassId || classes[0]?.id || '');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [sessionDate, setSessionDate] = useState(getTodayDateString());
  const [startTime, setStartTime] = useState(getCurrentTimeString());
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Automatically keep classId & subjectId synchronized with available classes/subjects
  useEffect(() => {
    if (isOpen) {
      const validClassId = (defaultClassId && classes.some(c => c.id === defaultClassId))
        ? defaultClassId
        : (classId && classes.some(c => c.id === classId) ? classId : (classes[0]?.id || ''));
      setClassId(validClassId);

      const validSubjectId = (subjectId && subjects.some(s => s.id === subjectId))
        ? subjectId
        : (subjects[0]?.id || '');
      setSubjectId(validSubjectId);

      setSessionDate(getTodayDateString());
      setStartTime(getCurrentTimeString());
      setError('');
    }
  }, [isOpen, classes, subjects, defaultClassId]);

  const effectiveClassId = classId || defaultClassId || classes[0]?.id || '';
  const effectiveSubjectId = subjectId || subjects[0]?.id || '';

  // Check duplicate session
  const isDuplicate = existingSessions.some(
    s => s.class_id === effectiveClassId && s.subject_id === effectiveSubjectId && s.session_date === sessionDate
  );

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const targetClassId = classId || defaultClassId || classes[0]?.id;
    const targetSubjectId = subjectId || subjects[0]?.id;

    if (!targetClassId) {
      setError('Please select or create a class first.');
      return;
    }
    if (!targetSubjectId) {
      setError('Please select or add a subject first.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSessionCreated({
        class_id: targetClassId,
        subject_id: targetSubjectId,
        session_date: sessionDate,
        start_time: startTime,
        remarks: remarks.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to start attendance session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormReady = classes.length > 0 && subjects.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start New Attendance Session"
      description="Configure classroom session parameters and prepare the attendance roster."
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
            onClick={() => handleSubmit()}
            disabled={!isFormReady || isSubmitting}
          >
            Open Attendance Register
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

        {/* Duplicate Session Notice */}
        {isDuplicate && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Notice: Existing Session Detected</p>
              <p className="opacity-90 mt-0.5">
                An attendance session for this class and subject already exists on {sessionDate}. You can still create another period or open the existing one from Attendance History.
              </p>
            </div>
          </div>
        )}

        {/* Class Selection */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Class / Section
          </label>
          <select
            value={effectiveClassId}
            onChange={e => setClassId(e.target.value)}
            className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            required
          >
            {classes.length === 0 && <option value="">No classes found — create a class first</option>}
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.class_name} ({c.academic_year} — Sec {c.section})
              </option>
            ))}
          </select>
        </div>

        {/* Subject Selection with Quick Add Action */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Subject
            </label>
            <button
              type="button"
              onClick={onOpenCreateSubject}
              className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 font-medium flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add Subject
            </button>
          </div>
          <select
            value={effectiveSubjectId}
            onChange={e => setSubjectId(e.target.value)}
            className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            required
          >
            {subjects.length === 0 && <option value="">No subjects yet — click Add Subject</option>}
            {subjects.map(s => (
              <option key={s.id} value={s.id}>
                {s.subject_name} {s.subject_code ? `(${s.subject_code})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Date and Start Time */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="date"
            label="Session Date"
            value={sessionDate}
            onChange={e => setSessionDate(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
            required
          />

          <Input
            type="time"
            label="Start Time"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            leftIcon={<Clock className="w-4 h-4" />}
            required
          />
        </div>

        {/* Optional Remarks */}
        <Input
          label="Session Remarks (Optional)"
          placeholder="e.g. Lab Session / Unit Test / Substitute Lecture"
          value={remarks}
          onChange={e => setRemarks(e.target.value)}
        />
      </form>
    </Modal>
  );
}
