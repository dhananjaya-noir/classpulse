export type UserRole = 'admin' | 'teacher' | 'cr' | 'faculty';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  institution_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ClassItem {
  id: string;
  owner_id: string;
  class_name: string;
  academic_year: string;
  semester: string;
  section: string;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  owner_id: string;
  usn: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export interface ClassEnrollment {
  id: string;
  owner_id: string;
  class_id: string;
  student_id: string;
  is_active: boolean;
  enrolled_at: string;
  student?: Student;
}

export interface Subject {
  id: string;
  owner_id: string;
  subject_name: string;
  subject_code: string;
  created_at: string;
}

export type SessionStatus = 'draft' | 'in_progress' | 'finalized';

export interface AttendanceSession {
  id: string;
  owner_id: string;
  class_id: string;
  subject_id: string;
  session_date: string; // YYYY-MM-DD
  start_time: string;   // HH:MM
  status: SessionStatus;
  remarks?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  finalized_at?: string | null;
  // Joined relation metadata
  class_name?: string;
  subject_name?: string;
  subject_code?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'unmarked';

export interface AttendanceRecord {
  id: string;
  owner_id: string;
  session_id: string;
  student_id: string;
  student_name_snapshot: string;
  student_usn_snapshot: string;
  attendance_status: AttendanceStatus;
  marked_at: string;
  updated_at: string;
}
