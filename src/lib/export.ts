import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AttendanceReportData } from '@/types';
import { formatDate, formatTime } from './utils';

// Helper to trigger browser file download
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * 1. EXCEL (.XLSX) EXPORT WITH 3 SHEETS:
 * Sheet 1: Absentees
 * Sheet 2: Complete Attendance
 * Sheet 3: Attendance Summary
 */
export function exportAttendanceExcel(report: AttendanceReportData) {
  const workbook = XLSX.utils.book_new();

  // --- SHEET 1: ABSENTEES ---
  const absenteesData = report.absentees.length > 0
    ? report.absentees.map((a, idx) => ({
        'Serial No': idx + 1,
        'USN / Roll Number': a.usn,
        'Student Name': a.fullName,
      }))
    : [{ 'Serial No': '-', 'USN / Roll Number': '-', 'Student Name': 'No students were marked absent for this session.' }];

  const absenteesSheet = XLSX.utils.json_to_sheet(absenteesData);
  absenteesSheet['!cols'] = [
    { wch: 12 }, // Serial No
    { wch: 22 }, // USN
    { wch: 35 }, // Student Name
  ];
  XLSX.utils.book_append_sheet(workbook, absenteesSheet, 'Absentees');

  // --- SHEET 2: COMPLETE ATTENDANCE ---
  const completeData = report.records.map((r, idx) => ({
    'Serial No': idx + 1,
    'USN / Roll Number': r.usn,
    'Student Name': r.fullName,
    'Attendance Status': r.status.toUpperCase(),
  }));

  const completeSheet = XLSX.utils.json_to_sheet(completeData);
  completeSheet['!cols'] = [
    { wch: 12 },
    { wch: 22 },
    { wch: 35 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(workbook, completeSheet, 'Complete Attendance');

  // --- SHEET 3: ATTENDANCE SUMMARY ---
  const summaryData = [
    { Parameter: 'Institution', Value: report.institutionName || 'University Department' },
    { Parameter: 'Class / Program', Value: report.className },
    { Parameter: 'Academic Year', Value: report.academicYear },
    { Parameter: 'Semester', Value: report.semester },
    { Parameter: 'Section', Value: report.section },
    { Parameter: 'Subject Name', Value: report.subjectName },
    { Parameter: 'Subject Code', Value: report.subjectCode },
    { Parameter: 'Session Date', Value: formatDate(report.date) },
    { Parameter: 'Session Start Time', Value: formatTime(report.startTime) },
    { Parameter: 'Total Enrolled Students', Value: report.stats.total },
    { Parameter: 'Present Students', Value: report.stats.present },
    { Parameter: 'Absent Students', Value: report.stats.absent },
    { Parameter: 'Late Students', Value: report.stats.late },
    { Parameter: 'Excused Students', Value: report.stats.excused },
    { Parameter: 'Unmarked Students', Value: report.stats.unmarked },
    { Parameter: 'Attendance Percentage', Value: `${report.stats.attendancePercentage}%` },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [
    { wch: 26 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Attendance Summary');

  // Generate buffer and trigger download
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const safeSubject = report.subjectCode || report.subjectName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `ClassPulse_${safeSubject}_${report.date}_Attendance.xlsx`;
  triggerDownload(blob, filename);
}

/**
 * 2. CSV (.CSV) EXPORT WITH UTF-8 BOM
 * Generates an absentee-only or complete CSV for high compatibility with Microsoft Excel.
 */
export function exportAbsenteesCSV(report: AttendanceReportData) {
  let csvContent = '\uFEFF'; // UTF-8 BOM for Excel compatibility

  if (report.absentees.length === 0) {
    csvContent += 'Serial Number,USN / Roll Number,Student Name\n';
    csvContent += '1,None,"No students were marked absent for this session."\n';
  } else {
    csvContent += 'Serial Number,USN / Roll Number,Student Name\n';
    report.absentees.forEach((a, idx) => {
      csvContent += `${idx + 1},"${a.usn}","${a.fullName.replace(/"/g, '""')}"\n`;
    });
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const safeSubject = report.subjectCode || report.subjectName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `ClassPulse_Absentees_${safeSubject}_${report.date}.csv`;
  triggerDownload(blob, filename);
}

/**
 * 3. DEDICATED SIMPLE ABSENTEES-ONLY DOWNLOAD (USN + NAME)
 */
export function downloadAbsenteesOnlySimple(report: AttendanceReportData, format: 'csv' | 'xlsx' = 'xlsx') {
  if (format === 'csv') {
    let csv = '\uFEFFUSN,Student Name\n';
    if (report.absentees.length === 0) {
      csv += 'NONE,"No students were marked absent for this session."\n';
    } else {
      report.absentees.forEach(a => {
        csv += `"${a.usn}","${a.fullName.replace(/"/g, '""')}"\n`;
      });
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `Absentees_Only_${report.date}.csv`);
  } else {
    const wb = XLSX.utils.book_new();
    const rows = report.absentees.length > 0
      ? report.absentees.map(a => ({ USN: a.usn, 'Student Name': a.fullName }))
      : [{ USN: 'NONE', 'Student Name': 'No students were marked absent for this session.' }];
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 20 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Absentees');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    triggerDownload(blob, `Absentees_Only_${report.date}.xlsx`);
  }
}

/**
 * 4. PROFESSIONAL PDF REPORT VIA JSPDF & AUTOTABLE
 */
export function exportAttendancePDF(report: AttendanceReportData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Top Accent Bar
  doc.setFillColor(13, 148, 136); // #0D9488 (Teal accent)
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Institution / Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // #0F172A
  doc.text(report.institutionName || 'Department of Computer Science & Engineering', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // #64748B
  doc.text('ClassPulse — Official Attendance & Absentee Report', 14, 24);

  // Metadata Grid Box
  doc.setDrawColor(226, 232, 240); // #E2E8F0
  doc.setFillColor(248, 250, 252); // #F8FAFC
  doc.roundedRect(14, 28, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.text('Class:', 18, 35);
  doc.setFont('helvetica', 'normal');
  doc.text(`${report.className} (Sec ${report.section})`, 34, 35);

  doc.setFont('helvetica', 'bold');
  doc.text('Subject:', 100, 35);
  doc.setFont('helvetica', 'normal');
  doc.text(`${report.subjectName} (${report.subjectCode})`, 116, 35);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', 18, 43);
  doc.setFont('helvetica', 'normal');
  doc.text(`${formatDate(report.date)} at ${formatTime(report.startTime)}`, 34, 43);

  doc.setFont('helvetica', 'bold');
  doc.text('Academic Year:', 100, 43);
  doc.setFont('helvetica', 'normal');
  doc.text(`${report.academicYear} | ${report.semester}`, 130, 43);

  // Stats KPI Cards
  const kpiY = 58;
  const cardWidth = (pageWidth - 28 - 15) / 4;

  const kpis = [
    { label: 'TOTAL ENROLLED', val: report.stats.total, color: [71, 85, 105] },
    { label: 'PRESENT', val: report.stats.present, color: [5, 150, 105] }, // green
    { label: 'ABSENT', val: report.stats.absent, color: [225, 29, 72] },   // red
    { label: 'PERCENTAGE', val: `${report.stats.attendancePercentage}%`, color: [13, 148, 136] }, // teal
  ];

  kpis.forEach((kpi, i) => {
    const x = 14 + i * (cardWidth + 5);
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, kpiY, cardWidth, 18, 1.5, 1.5, 'FD');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.label, x + 4, kpiY + 6);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(String(kpi.val), x + 4, kpiY + 14);
  });

  // Section Heading: Absentees
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Official Absentee List (${report.absentees.length} Absent)`, 14, 85);

  if (report.absentees.length === 0) {
    doc.setDrawColor(16, 185, 129);
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(14, 90, pageWidth - 28, 14, 2, 2, 'FD');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(5, 150, 105);
    doc.text('✓ Perfect Attendance! No students were marked absent for this session.', 20, 99);
  } else {
    const tableRows = report.absentees.map((a, i) => [
      String(i + 1),
      a.usn,
      a.fullName,
      'ABSENT',
    ]);

    autoTable(doc, {
      startY: 90,
      head: [['#', 'USN / Roll Number', 'Student Full Name', 'Status']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 8.5,
        textColor: [51, 65, 85],
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 35, fontStyle: 'bold' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 25, halign: 'center', textColor: [225, 29, 72], fontStyle: 'bold' },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer with Page Numbers
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generated by ClassPulse on ${new Date().toLocaleString('en-IN')} | Page ${p} of ${totalPages}`,
      14,
      doc.internal.pageSize.getHeight() - 8
    );
  }

  const safeSubject = report.subjectCode || report.subjectName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`ClassPulse_Report_${safeSubject}_${report.date}.pdf`);
}
