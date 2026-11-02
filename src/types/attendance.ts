import { AttendanceRecord, AttendanceStatus, AttendanceSession, ClassItem, Student, Subject } from './database';

export interface AttendanceSummaryStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  unmarked: number;
  attendancePercentage: number; // Present / Total * 100
}

export interface StudentAttendanceRow {
  studentId: string;
  usn: string;
  fullName: string;
  status: AttendanceStatus;
  markedAt: string;
  recordId?: string;
}

export type AttendanceActionType = 
  | 'MARK_INDIVIDUAL'
  | 'MARK_ALL_PRESENT'
  | 'MARK_ALL_ABSENT'
  | 'RESET_ALL'
  | 'BATCH_MARK';

export interface AttendanceActionUndo {
  type: AttendanceActionType;
  description: string;
  previousRecords: Array<{
    studentId: string;
    previousStatus: AttendanceStatus;
  }>;
  timestamp: number;
}

export interface AttendanceReportData {
  institutionName: string;
  className: string;
  semester: string;
  section: string;
  academicYear: string;
  subjectName: string;
  subjectCode: string;
  date: string;
  startTime: string;
  stats: AttendanceSummaryStats;
  records: Array<{
    serialNumber: number;
    usn: string;
    fullName: string;
    status: AttendanceStatus;
  }>;
  absentees: Array<{
    serialNumber: number;
    usn: string;
    fullName: string;
  }>;
}

export interface RosterImportPreview {
  validRows: Array<{ usn: string; fullName: string; section?: string }>;
  duplicateRows: Array<{ usn: string; fullName: string; reason: string }>;
  rejectedRows: Array<{ raw: any; reason: string }>;
  totalCount: number;
}

export type SyncState = 'synced' | 'saving' | 'sync_pending' | 'offline' | 'error';
