import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AttendanceStatus, AttendanceSummaryStats } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateAttendanceStats(statuses: AttendanceStatus[]): AttendanceSummaryStats {
  const total = statuses.length;
  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;
  let unmarked = 0;

  for (const s of statuses) {
    if (s === 'present') present++;
    else if (s === 'absent') absent++;
    else if (s === 'late') late++;
    else if (s === 'excused') excused++;
    else unmarked++;
  }

  // Attendance percentage = Present students / Total enrolled students × 100
  // Per spec: Keep Late and Excused separate, rather than silently including them in the Present count.
  const attendancePercentage = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;

  return {
    total,
    present,
    absent,
    late,
    excused,
    unmarked,
    attendancePercentage,
  };
}

export function formatDate(dateString: string): string {
  try {
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatTime(timeString: string): string {
  try {
    const parts = timeString.split(':');
    if (parts.length < 2) return timeString;
    const hours = parseInt(parts[0]);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  } catch {
    return timeString;
  }
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
