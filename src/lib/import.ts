import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { RosterImportPreview } from '@/types';

export interface RawParsedRow {
  [key: string]: any;
}

export interface ColumnMapping {
  usnKey: string;
  nameKey: string;
  sectionKey?: string;
}

// Auto-detect common academic column headers
export function detectColumnMapping(headers: string[]): ColumnMapping {
  const normalized = headers.map(h => (h || '').trim().toLowerCase());

  // Detect USN / Roll number column
  let usnIndex = normalized.findIndex(h => 
    h === 'usn' || 
    h === 'roll no' || 
    h === 'roll number' || 
    h === 'roll_no' || 
    h === 'student id' || 
    h === 'id' || 
    h === 'reg no' || 
    h === 'registration number' ||
    h.includes('usn') ||
    h.includes('roll')
  );

  // Detect Name column
  let nameIndex = normalized.findIndex(h => 
    h === 'student name' || 
    h === 'name' || 
    h === 'full name' || 
    h === 'student_name' || 
    h === 'candidate name' ||
    h.includes('name')
  );

  // Detect Section column
  let sectionIndex = normalized.findIndex(h => 
    h === 'section' || 
    h === 'sec' || 
    h === 'group'
  );

  return {
    usnKey: usnIndex !== -1 ? headers[usnIndex] : headers[0] || 'usn',
    nameKey: nameIndex !== -1 ? headers[nameIndex] : headers[1] || 'name',
    sectionKey: sectionIndex !== -1 ? headers[sectionIndex] : undefined,
  };
}

export function parseCSVContent(csvText: string): Promise<{ headers: string[]; rows: RawParsedRow[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        const headers = results.meta.fields || [];
        resolve({
          headers,
          rows: results.data as RawParsedRow[],
        });
      },
      error: (error: any) => reject(error),
    });
  });
}

export function parseExcelFile(file: File): Promise<{ headers: string[]; rows: RawParsedRow[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json<RawParsedRow>(worksheet, { header: 1 });

        if (json.length === 0) {
          resolve({ headers: [], rows: [] });
          return;
        }

        const headers = (json[0] as string[]).map(h => String(h || '').trim());
        const dataRows = json.slice(1);

        const rows: RawParsedRow[] = dataRows
          .filter(row => Array.isArray(row) && row.some(cell => cell !== undefined && cell !== null && cell !== ''))
          .map(row => {
            const obj: RawParsedRow = {};
            headers.forEach((header, index) => {
              obj[header] = (row as any[])[index];
            });
            return obj;
          });

        resolve({ headers, rows });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

export function parsePastedText(text: string): { headers: string[]; rows: RawParsedRow[] } {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };

  // Detect delimiter: tab or comma
  const firstLine = lines[0];
  const isTab = firstLine.includes('\t');
  const delimiter = isTab ? '\t' : ',';

  // Check if first line looks like a header
  const tokens = firstLine.split(delimiter).map(t => t.trim().replace(/^["']|["']$/g, ''));
  const hasHeaderKeywords = tokens.some(t => 
    /^(usn|roll|name|id|section|student)/i.test(t)
  );

  let headers: string[] = [];
  let dataLines: string[] = [];

  if (hasHeaderKeywords) {
    headers = tokens;
    dataLines = lines.slice(1);
  } else {
    headers = ['USN', 'Student Name', 'Section'];
    dataLines = lines;
  }

  const rows: RawParsedRow[] = dataLines.map(line => {
    const parts = line.split(delimiter).map(t => t.trim().replace(/^["']|["']$/g, ''));
    const obj: RawParsedRow = {};
    headers.forEach((h, i) => {
      obj[h] = parts[i] || '';
    });
    return obj;
  });

  return { headers, rows };
}

export function validateAndProcessRoster(
  rows: RawParsedRow[],
  mapping: ColumnMapping,
  existingUsnSet: Set<string> = new Set()
): RosterImportPreview {
  const validRows: Array<{ usn: string; fullName: string; section?: string }> = [];
  const duplicateRows: Array<{ usn: string; fullName: string; reason: string }> = [];
  const rejectedRows: Array<{ raw: any; reason: string }> = [];

  const seenInBatch = new Set<string>();

  rows.forEach((row, index) => {
    const rawUsn = row[mapping.usnKey];
    const rawName = row[mapping.nameKey];
    const rawSection = mapping.sectionKey ? row[mapping.sectionKey] : undefined;

    const usn = (rawUsn !== undefined && rawUsn !== null ? String(rawUsn) : '').trim();
    const fullName = (rawName !== undefined && rawName !== null ? String(rawName) : '').trim();
    const section = rawSection ? String(rawSection).trim() : undefined;

    // Check for empty row
    if (!usn && !fullName) {
      return; // Skip blank lines
    }

    // Validation 1: Missing USN
    if (!usn) {
      rejectedRows.push({
        raw: row,
        reason: `Row ${index + 1}: Missing USN / Roll number`,
      });
      return;
    }

    // Validation 2: Missing Full Name
    if (!fullName) {
      rejectedRows.push({
        raw: row,
        reason: `Row ${index + 1} (${usn}): Missing student name`,
      });
      return;
    }

    const normalizedUsn = usn.toUpperCase();

    // Validation 3: Duplicate within the current file batch
    if (seenInBatch.has(normalizedUsn)) {
      duplicateRows.push({
        usn: normalizedUsn,
        fullName,
        reason: `Duplicate USN "${normalizedUsn}" found multiple times in import file`,
      });
      return;
    }

    // Validation 4: Already enrolled in database roster
    if (existingUsnSet.has(normalizedUsn)) {
      duplicateRows.push({
        usn: normalizedUsn,
        fullName,
        reason: `USN "${normalizedUsn}" is already registered in the class roster`,
      });
      return;
    }

    seenInBatch.add(normalizedUsn);
    validRows.push({
      usn: normalizedUsn,
      fullName,
      section,
    });
  });

  return {
    validRows,
    duplicateRows,
    rejectedRows,
    totalCount: rows.length,
  };
}
