import { supabase, isSupabaseConfigured } from './supabase';
import { localDb } from './db';
import { syncEngine } from './sync';
import { 
  ClassItem, 
  Subject, 
  Student, 
  ClassEnrollment, 
  AttendanceSession, 
  AttendanceRecord 
} from '@/types';

export const storage = {
  // --- CLASSES ---
  async getClasses(ownerId: string): Promise<ClassItem[]> {
    if (isSupabaseConfigured() && supabase && navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('classes')
          .select('*')
          .eq('owner_id', ownerId)
          .order('class_name', { ascending: true });

        if (!error && data) {
          // Cache in local IndexedDB
          await localDb.classes.bulkPut(data);
          return data;
        }
      } catch (err) {
        console.warn('Falling back to local classes cache:', err);
      }
    }
    return await localDb.classes.where('owner_id').equals(ownerId).toArray();
  },

  async saveClass(classData: ClassItem): Promise<ClassItem> {
    // 1. Save to IndexedDB immediately
    await localDb.classes.put(classData);

    // 2. Queue or execute cloud sync
    if (isSupabaseConfigured() && supabase && navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('classes')
          .upsert(classData)
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Queuing class for background sync:', err);
        await syncEngine.enqueue({
          table: 'classes',
          action: 'insert',
          payload: classData,
        });
      }
    } else {
      await syncEngine.enqueue({
        table: 'classes',
        action: 'insert',
        payload: classData,
      });
    }
    return classData;
  },

  async deleteClass(classId: string, ownerId: string): Promise<void> {
    await localDb.classes.delete(classId);
    await localDb.enrollments.where('class_id').equals(classId).delete();
    await localDb.sessions.where('class_id').equals(classId).delete();

    if (isSupabaseConfigured() && supabase && navigator.onLine) {
      try {
        await supabase.from('classes').delete().eq('id', classId).eq('owner_id', ownerId);
      } catch (err) {
        await syncEngine.enqueue({
          table: 'classes',
          action: 'delete',
          payload: { id: classId, owner_id: ownerId },
        });
      }
    } else {
      await syncEngine.enqueue({
        table: 'classes',
        action: 'delete',
        payload: { id: classId, owner_id: ownerId },
      });
    }
  },

  // --- SUBJECTS ---
  async getSubjects(ownerId: string): Promise<Subject[]> {
    if (isSupabaseConfigured() && supabase && navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('*')
          .eq('owner_id', ownerId)
          .order('subject_name', { ascending: true });

        if (!error && data) {
          await localDb.subjects.bulkPut(data);
          return data;
        }
      } catch (err) {
        console.warn('Falling back to local subjects cache:', err);
      }
    }
    return await localDb.subjects.where('owner_id').equals(ownerId).toArray();
  },

  async saveSubject(subject: Subject): Promise<Subject> {
    await localDb.subjects.put(subject);

    if (isSupabaseConfigured() && supabase && navigator.onLine) {
      try {
        const { data, error } = await supabase.from('subjects').upsert(subject).select().single();
        if (error) throw error;
        return data;
      } catch (err) {
        await syncEngine.enqueue({
          table: 'subjects',
          action: 'insert',
          payload: subject,
        });
      }
    } else {
      await syncEngine.enqueue({
        table: 'subjects',
        action: 'insert',
        payload: subject,
      });
    }
    return subject;
  },

  async deleteSubject(subjectId: string, ownerId: string): Promise<void> {
    await localDb.subjects.delete(subjectId);
    if (isSupabaseConfigured() && supabase && navigator.onLine) {
      try {
        await supabase.from('subjects').delete().eq('id', subjectId).eq('owner_id', ownerId);
      } catch {
        await syncEngine.enqueue({
          table: 'subjects',
          action: 'delete',
          payload: { id: subjectId, owner_id: ownerId },
        });
      }
    } else {
      await syncEngine.enqueue({
        table: 'subjects',
        action: 'delete',
        payload: { id: subjectId, owner_id: ownerId },
      });
    }
  },

  // --- STUDENTS & ENROLLMENTS ---
  async getStudents(ownerId: string): Promise<Student[]> {
    if (isSupabaseConfigured() && supabase && navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('owner_id', ownerId)
          .order('usn', { ascending: true });

        if (!error && data) {
          await localDb.students.bulkPut(data);
          return data;
        }
      } catch (err) {
        console.warn('Falling back to local students cache:', err);
      }
    }
    return await localDb.students.where('owner_id').equals(ownerId).sortBy('usn');
  },

  async saveStudents(students: Student[], ownerId: string): Promise<Student[]> {
    if (students.length === 0) return [];
    await localDb.students.bulkPut(students);

    if (isSupabaseConfigured() && supabase && navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('students')
          .upsert(students, { onConflict: 'owner_id,usn' })
          .select();
        if (error) throw error;
        return data || students;
      } catch (err) {
        for (const s of students) {
          await syncEngine.enqueue({
            table: 'students',
            action: 'insert',
            payload: s,
          });
        }
      }
    } else {
      for (const s of students) {
        await syncEngine.enqueue({
          table: 'students',
          action: 'insert',
          payload: s,
        });
      }
    }
    return students;
  },

  async getClassEnrollments(classId: string): Promise<Array<ClassEnrollment & { student: Student }>> {
    if (isSupabaseConfigured() && supabase && navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('class_enrollments')
          .select('*, student:students(*)')
          .eq('class_id', classId)
          .eq('is_active', true);

        if (!error && data) {
          // Cache enrollments locally
          const formatted = data.map((item: any) => ({
            id: item.id,
            owner_id: item.owner_id,
            class_id: item.class_id,
            student_id: item.student_id,
            is_active: item.is_active,
            enrolled_at: item.enrolled_at,
            student: item.student,
          }));
          await localDb.enrollments.bulkPut(
            formatted.map(({ student, ...e }) => e)
          );
          if (formatted.every(e => e.student)) {
            return formatted;
          }
        }
      } catch (err) {
        console.warn('Falling back to local enrollments:', err);
      }
    }

    // Local IndexedDB fallback join
    const enrollments = await localDb.enrollments
      .where('class_id')
      .equals(classId)
      .filter(e => e.is_active)
      .toArray();

    const studentIds = enrollments.map(e => e.student_id);
    const students = await localDb.students.where('id').anyOf(studentIds).toArray();
    const studentMap = new Map(students.map(s => [s.id, s]));

    return enrollments
      .map(e => ({
        ...e,
        student: studentMap.get(e.student_id)!,
      }))
      .filter(e => Boolean(e.student))
      .sort((a, b) => a.student.usn.localeCompare(b.student.usn, undefined, { numeric: true }));
  },

  async enrollStudents(
    classId: string, 
    studentIds: string[], 
    ownerId: string
  ): Promise<void> {
    const enrollments: ClassEnrollment[] = studentIds.map(studentId => ({
      id: crypto.randomUUID(),
      owner_id: ownerId,
      class_id: classId,
      student_id: studentId,
      is_active: true,
      enrolled_at: new Date().toISOString(),
    }));

    await localDb.enrollments.bulkPut(enrollments);

    if (isSupabaseConfigured() && supabase && navigator.onLine) {
      try {
        const { error } = await supabase
          .from('class_enrollments')
          .upsert(enrollments, { onConflict: 'class_id,student_id' });
        if (error) throw error;
      } catch {
        for (const e of enrollments) {
          await syncEngine.enqueue({
            table: 'class_enrollments',
            action: 'insert',
            payload: e,
          });
        }
      }
    } else {
      for (const e of enrollments) {
        await syncEngine.enqueue({
          table: 'class_enrollments',
          action: 'insert',
          payload: e,
        });
      }
    }
  },

  async removeEnrollment(enrollmentId: string, ownerId: string): Promise<void> {
    await localDb.enrollments.update(enrollmentId, { is_active: false });

    if (isSupabaseConfigured() && supabase && navigator.onLine) {
      try {
        await supabase
          .from('class_enrollments')
          .update({ is_active: false })
          .eq('id', enrollmentId)
          .eq('owner_id', ownerId);
      } catch {
        await syncEngine.enqueue({
          table: 'class_enrollments',
          action: 'update',
          payload: { id: enrollmentId, is_active: false },
        });
      }
    } else {
      await syncEngine.enqueue({
        table: 'class_enrollments',
        action: 'update',
        payload: { id: enrollmentId, is_active: false },
      });
    }
  },

  // --- ATTENDANCE SESSIONS ---
  async getSessions(ownerId: string, classId?: string): Promise<AttendanceSession[]> {
    if (isSupabaseConfigured() && supabase && navigator.onLine) {
      try {
        let query = supabase
          .from('attendance_sessions')
          .select('*, class:classes(class_name), subject:subjects(subject_name, subject_code)')
          .eq('owner_id', ownerId)
          .order('session_date', { ascending: false })
          .order('start_time', { ascending: false });

        if (classId) {
          query = query.eq('class_id', classId);
        }

        const { data, error } = await query;
        if (!error && data) {
          const formatted = data.map((item: any) => ({
            id: item.id,
            owner_id: item.owner_id,
            class_id: item.class_id,
            subject_id: item.subject_id,
            session_date: item.session_date,
            start_time: item.start_time,
            status: item.status,
            remarks: item.remarks,
            created_by: item.created_by,
            created_at: item.created_at,
            updated_at: item.updated_at,
            finalized_at: item.finalized_at,
            class_name: item.class?.class_name,
            subject_name: item.subject?.subject_name,
            subject_code: item.subject?.subject_code,
          }));

          await localDb.sessions.bulkPut(
            formatted.map(({ class_name, subject_name, subject_code, ...s }) => s)
          );
          return formatted;
        }
      } catch (err) {
        console.warn('Falling back to local sessions cache:', err);
      }
    }

    // Local IndexedDB fallback
    let sessions = await localDb.sessions.where('owner_id').equals(ownerId).toArray();
    if (classId) {
      sessions = sessions.filter(s => s.class_id === classId);
    }

    // Enrich with class and subject names
    const classes = await localDb.classes.toArray();
    const classMap = new Map(classes.map(c => [c.id, c.class_name]));
    const subjects = await localDb.subjects.toArray();
    const subjectMap = new Map(subjects.map(s => [s.id, s]));

    return sessions
      .map(s => {
        const sub = subjectMap.get(s.subject_id);
        return {
          ...s,
          class_name: classMap.get(s.class_id) || 'Unknown Class',
          subject_name: sub?.subject_name || 'General',
          subject_code: sub?.subject_code || '',
        };
      })
      .sort((a, b) => b.session_date.localeCompare(a.session_date) || b.start_time.localeCompare(a.start_time));
  },

  async getSessionById(sessionId: string): Promise<AttendanceSession | null> {
    const local = await localDb.sessions.get(sessionId);
    if (local) {
      const cls = await localDb.classes.get(local.class_id);
      const sub = await localDb.subjects.get(local.subject_id);
      return {
        ...local,
        class_name: cls?.class_name || 'Class',
        subject_name: sub?.subject_name || 'Subject',
        subject_code: sub?.subject_code || '',
      };
    }

    if (isSupabaseConfigured() && supabase && navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('attendance_sessions')
          .select('*, class:classes(class_name), subject:subjects(subject_name, subject_code)')
          .eq('id', sessionId)
          .single();
        if (!error && data) {
          return {
            id: data.id,
            owner_id: data.owner_id,
            class_id: data.class_id,
            subject_id: data.subject_id,
            session_date: data.session_date,
            start_time: data.start_time,
            status: data.status,
            remarks: data.remarks,
            created_by: data.created_by,
            created_at: data.created_at,
            updated_at: data.updated_at,
            finalized_at: data.finalized_at,
            class_name: data.class?.class_name,
            subject_name: data.subject?.subject_name,
            subject_code: data.subject?.subject_code,
          };
        }
      } catch (err) {
        console.error('Failed to fetch session by id:', err);
      }
    }
    return null;
  },

  async saveSession(session: AttendanceSession): Promise<AttendanceSession> {
    const { class_name, subject_name, subject_code, ...cleanSession } = session;
    await localDb.sessions.put(cleanSession);

    if (isSupabaseConfigured() && supabase && navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('attendance_sessions')
          .upsert(cleanSession)
          .select()
          .single();
        if (error) throw error;
        return { ...data, class_name, subject_name, subject_code };
      } catch {
        await syncEngine.enqueue({
          table: 'attendance_sessions',
          action: 'insert',
          payload: cleanSession,
        });
      }
    } else {
      await syncEngine.enqueue({
        table: 'attendance_sessions',
        action: 'insert',
        payload: cleanSession,
      });
    }
    return session;
  },

  // --- ATTENDANCE RECORDS ---
  async getAttendanceRecords(sessionId: string): Promise<AttendanceRecord[]> {
    if (isSupabaseConfigured() && supabase && navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('session_id', sessionId)
          .order('student_usn_snapshot', { ascending: true });

        if (!error && data) {
          await localDb.records.bulkPut(data);
          return data;
        }
      } catch (err) {
        console.warn('Falling back to local records cache:', err);
      }
    }
    return await localDb.records
      .where('session_id')
      .equals(sessionId)
      .sortBy('student_usn_snapshot');
  },

  async saveAttendanceRecords(
    sessionId: string, 
    records: AttendanceRecord[], 
    ownerId: string
  ): Promise<void> {
    if (records.length === 0) return;

    // 1. Update IndexedDB locally immediately
    await localDb.records.bulkPut(records);

    // 2. Queue or write to Supabase
    if (isSupabaseConfigured() && supabase && navigator.onLine) {
      try {
        const { error } = await supabase
          .from('attendance_records')
          .upsert(records, { onConflict: 'session_id,student_id' });
        if (error) throw error;
      } catch (err) {
        console.warn('Queuing attendance records batch sync:', err);
        await syncEngine.enqueue({
          table: 'attendance_records',
          action: 'upsert_records',
          payload: records,
        });
      }
    } else {
      await syncEngine.enqueue({
        table: 'attendance_records',
        action: 'upsert_records',
        payload: records,
      });
    }
  },

  // --- APP SETTINGS & BACKUP/RESTORE ---
  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    const item = await localDb.appSettings.get(key);
    return item ? (item.value as T) : defaultValue;
  },

  async setSetting(key: string, value: any): Promise<void> {
    await localDb.appSettings.put({ key, value });
  },

  async exportFullBackup(ownerId: string) {
    const classes = await localDb.classes.where('owner_id').equals(ownerId).toArray();
    const subjects = await localDb.subjects.where('owner_id').equals(ownerId).toArray();
    const students = await localDb.students.where('owner_id').equals(ownerId).toArray();
    const enrollments = await localDb.enrollments.where('owner_id').equals(ownerId).toArray();
    const sessions = await localDb.sessions.where('owner_id').equals(ownerId).toArray();
    const records = await localDb.records.where('owner_id').equals(ownerId).toArray();

    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      ownerId,
      data: {
        classes,
        subjects,
        students,
        enrollments,
        sessions,
        records,
      },
    };
  },

  async restoreFullBackup(backupData: any, ownerId: string): Promise<{ success: boolean; message: string }> {
    if (!backupData?.data || !backupData.version) {
      return { success: false, message: 'Invalid backup JSON file structure.' };
    }

    const { classes = [], subjects = [], students = [], enrollments = [], sessions = [], records = [] } = backupData.data;

    // Update owner_id to current user to prevent orphan records
    const cleanClasses = classes.map((c: any) => ({ ...c, owner_id: ownerId }));
    const cleanSubjects = subjects.map((s: any) => ({ ...s, owner_id: ownerId }));
    const cleanStudents = students.map((st: any) => ({ ...st, owner_id: ownerId }));
    const cleanEnrollments = enrollments.map((e: any) => ({ ...e, owner_id: ownerId }));
    const cleanSessions = sessions.map((se: any) => ({ ...se, owner_id: ownerId }));
    const cleanRecords = records.map((r: any) => ({ ...r, owner_id: ownerId }));

    await localDb.classes.bulkPut(cleanClasses);
    await localDb.subjects.bulkPut(cleanSubjects);
    await localDb.students.bulkPut(cleanStudents);
    await localDb.enrollments.bulkPut(cleanEnrollments);
    await localDb.sessions.bulkPut(cleanSessions);
    await localDb.records.bulkPut(cleanRecords);

    // Sync to Supabase if connected
    if (isSupabaseConfigured() && supabase && navigator.onLine) {
      try {
        if (cleanClasses.length) await supabase.from('classes').upsert(cleanClasses);
        if (cleanSubjects.length) await supabase.from('subjects').upsert(cleanSubjects);
        if (cleanStudents.length) await supabase.from('students').upsert(cleanStudents, { onConflict: 'owner_id,usn' });
        if (cleanEnrollments.length) await supabase.from('class_enrollments').upsert(cleanEnrollments, { onConflict: 'class_id,student_id' });
        if (cleanSessions.length) await supabase.from('attendance_sessions').upsert(cleanSessions);
        if (cleanRecords.length) await supabase.from('attendance_records').upsert(cleanRecords, { onConflict: 'session_id,student_id' });
      } catch (err: any) {
        console.warn('Backup restored locally; remote sync queued:', err);
      }
    }

    return {
      success: true,
      message: `Restored ${cleanStudents.length} students, ${cleanClasses.length} classes, and ${cleanSessions.length} sessions successfully.`,
    };
  },
};
