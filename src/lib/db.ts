import Dexie, { type EntityTable } from 'dexie';
import { 
  ClassItem, 
  Subject, 
  Student, 
  ClassEnrollment, 
  AttendanceSession, 
  AttendanceRecord 
} from '@/types';

export interface SyncQueueItem {
  id?: number;
  table: 'classes' | 'subjects' | 'students' | 'class_enrollments' | 'attendance_sessions' | 'attendance_records';
  action: 'insert' | 'update' | 'delete' | 'upsert_records';
  payload: any;
  timestamp: string;
  status: 'pending' | 'syncing' | 'failed';
  retries: number;
  lastError?: string;
}

export interface AppSettingItem {
  key: string;
  value: any;
}

export class ClassPulseDatabase extends Dexie {
  classes!: EntityTable<ClassItem, 'id'>;
  subjects!: EntityTable<Subject, 'id'>;
  students!: EntityTable<Student, 'id'>;
  enrollments!: EntityTable<ClassEnrollment, 'id'>;
  sessions!: EntityTable<AttendanceSession, 'id'>;
  records!: EntityTable<AttendanceRecord, 'id'>;
  syncQueue!: EntityTable<SyncQueueItem, 'id'>;
  appSettings!: EntityTable<AppSettingItem, 'key'>;

  constructor() {
    super('ClassPulseDB');
    this.version(1).stores({
      classes: 'id, owner_id, academic_year, semester',
      subjects: 'id, owner_id, subject_code',
      students: 'id, owner_id, usn, [owner_id+usn]',
      enrollments: 'id, owner_id, class_id, student_id, [class_id+student_id]',
      sessions: 'id, owner_id, class_id, subject_id, session_date, status',
      records: 'id, owner_id, session_id, student_id, [session_id+student_id], attendance_status',
      syncQueue: '++id, table, action, status, timestamp',
      appSettings: 'key',
    });
  }
}

export const localDb = new ClassPulseDatabase();
