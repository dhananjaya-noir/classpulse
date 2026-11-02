import { describe, it, expect } from 'vitest';
import { validateAndProcessRoster, detectColumnMapping, parsePastedText } from '../lib/import';

describe('Phase 17 QA: Roster Import & Validation Logic', () => {
  it('correctly auto-detects academic column headers', () => {
    const headers = ['USN', 'Candidate Name', 'Section'];
    const mapping = detectColumnMapping(headers);

    expect(mapping.usnKey).toBe('USN');
    expect(mapping.nameKey).toBe('Candidate Name');
    expect(mapping.sectionKey).toBe('Section');
  });

  it('detects duplicate USNs within the import batch and rejects duplicates', () => {
    const rawRows = [
      { USN: '1MS23CS001', 'Student Name': 'Aarav Sharma' },
      { USN: '1MS23CS002', 'Student Name': 'Aanya Patel' },
      { USN: '1MS23CS001', 'Student Name': 'Aarav Duplicate' }, // Duplicate USN
    ];

    const mapping = { usnKey: 'USN', nameKey: 'Student Name' };
    const result = validateAndProcessRoster(rawRows, mapping, new Set());

    expect(result.validRows.length).toBe(2);
    expect(result.duplicateRows.length).toBe(1);
    expect(result.duplicateRows[0].usn).toBe('1MS23CS001');
  });

  it('detects duplicate USNs against existing database roster', () => {
    const existing = new Set(['1MS23CS010']);
    const rawRows = [
      { USN: '1MS23CS010', 'Student Name': 'Arjun Nair' }, // Already in database
      { USN: '1MS23CS011', 'Student Name': 'Arman Khan' },
    ];

    const mapping = { usnKey: 'USN', nameKey: 'Student Name' };
    const result = validateAndProcessRoster(rawRows, mapping, existing);

    expect(result.validRows.length).toBe(1);
    expect(result.duplicateRows.length).toBe(1);
    expect(result.validRows[0].usn).toBe('1MS23CS011');
  });

  it('rejects rows with missing USN or missing student name', () => {
    const rawRows = [
      { USN: '', 'Student Name': 'No USN Student' },
      { USN: '1MS23CS099', 'Student Name': '' },
      { USN: '1MS23CS100', 'Student Name': 'Valid Student' },
    ];

    const mapping = { usnKey: 'USN', nameKey: 'Student Name' };
    const result = validateAndProcessRoster(rawRows, mapping, new Set());

    expect(result.validRows.length).toBe(1);
    expect(result.rejectedRows.length).toBe(2);
  });

  it('correctly parses tab-separated pasted data from Excel/Google Sheets', () => {
    const pasted = "USN\tStudent Name\tSection\n1MS23CS001\tAarav Sharma\tA\n1MS23CS002\tAanya Patel\tA";
    const { headers, rows } = parsePastedText(pasted);

    expect(headers).toEqual(['USN', 'Student Name', 'Section']);
    expect(rows.length).toBe(2);
    expect(rows[0]['USN']).toBe('1MS23CS001');
    expect(rows[0]['Student Name']).toBe('Aarav Sharma');
  });
});
