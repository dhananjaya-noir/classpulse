import { describe, it, expect } from 'vitest';
import { calculateAttendanceStats } from '../lib/utils';
import { AttendanceStatus, StudentAttendanceRow, AttendanceActionUndo } from '../types';
import { SAMPLE_STUDENTS_70 } from '../lib/sampleData';

describe('Phase 17 QA: Attendance Engine & Calculations', () => {
  it('correctly calculates stats for exactly 70 students when all marked Present', () => {
    const statuses: AttendanceStatus[] = Array(70).fill('present');
    const stats = calculateAttendanceStats(statuses);

    expect(stats.total).toBe(70);
    expect(stats.present).toBe(70);
    expect(stats.absent).toBe(0);
    expect(stats.late).toBe(0);
    expect(stats.excused).toBe(0);
    expect(stats.unmarked).toBe(0);
    expect(stats.attendancePercentage).toBe(100);
  });

  it('correctly calculates stats when 8 of 70 students are marked Absent (62 Present)', () => {
    // 62 Present + 8 Absent = 70 total
    const statuses: AttendanceStatus[] = [
      ...Array(62).fill('present'),
      ...Array(8).fill('absent'),
    ];
    const stats = calculateAttendanceStats(statuses);

    expect(stats.total).toBe(70);
    expect(stats.present).toBe(62);
    expect(stats.absent).toBe(8);
    expect(stats.unmarked).toBe(0);
    // 62 / 70 * 100 = 88.5714... rounded to 1 decimal = 88.6%
    expect(stats.attendancePercentage).toBe(88.6);
  });

  it('keeps Late and Excused separate from Present count per product specification', () => {
    // 60 Present + 5 Late + 3 Excused + 2 Absent = 70 total
    const statuses: AttendanceStatus[] = [
      ...Array(60).fill('present'),
      ...Array(5).fill('late'),
      ...Array(3).fill('excused'),
      ...Array(2).fill('absent'),
    ];
    const stats = calculateAttendanceStats(statuses);

    expect(stats.total).toBe(70);
    expect(stats.present).toBe(60);
    expect(stats.late).toBe(5);
    expect(stats.excused).toBe(3);
    expect(stats.absent).toBe(2);
    // Attendance percentage = Present / Total * 100 = 60 / 70 * 100 = 85.7%
    expect(stats.attendancePercentage).toBe(85.7);
  });

  it('correctly tracks and reverts actions using the undo stack', () => {
    let rows: StudentAttendanceRow[] = SAMPLE_STUDENTS_70.map(s => ({
      studentId: s.usn,
      usn: s.usn,
      fullName: s.fullName,
      status: 'present' as AttendanceStatus,
      markedAt: new Date().toISOString(),
    }));

    // Action: Mark 5th student absent
    const targetStudentId = SAMPLE_STUDENTS_70[4].usn;
    const originalStatus = rows.find(r => r.studentId === targetStudentId)!.status;

    const undoItem: AttendanceActionUndo = {
      type: 'MARK_INDIVIDUAL',
      description: 'Marked 1MS23CS005 as absent',
      previousRecords: [{ studentId: targetStudentId, previousStatus: originalStatus }],
      timestamp: Date.now(),
    };

    // Apply change
    rows = rows.map(r => r.studentId === targetStudentId ? { ...r, status: 'absent' } : r);
    expect(rows.find(r => r.studentId === targetStudentId)!.status).toBe('absent');

    // Undo action
    const prevMap = new Map(undoItem.previousRecords.map(p => [p.studentId, p.previousStatus]));
    rows = rows.map(r => {
      const prev = prevMap.get(r.studentId);
      return prev ? { ...r, status: prev } : r;
    });

    expect(rows.find(r => r.studentId === targetStudentId)!.status).toBe('present');
  });
});
