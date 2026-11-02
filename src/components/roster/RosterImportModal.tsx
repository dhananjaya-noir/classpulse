import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { 
  parseCSVContent, 
  parseExcelFile, 
  parsePastedText, 
  detectColumnMapping, 
  validateAndProcessRoster, 
  ColumnMapping 
} from '@/lib/import';
import { RosterImportPreview } from '@/types';
import { downloadSampleCSV, SAMPLE_STUDENTS_70 } from '@/lib/sampleData';
import { 
  Upload, 
  FileSpreadsheet, 
  Clipboard, 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface RosterImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportConfirmed: (students: Array<{ usn: string; fullName: string; section?: string }>) => Promise<void>;
  existingUsns?: string[];
}

export function RosterImportModal({
  isOpen,
  onClose,
  onImportConfirmed,
  existingUsns = [],
}: RosterImportModalProps) {
  const { success, error } = useToast();
  const [tab, setTab] = useState<'upload' | 'paste'>('upload');
  const [pasteText, setPasteText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parsing & mapping state
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ usnKey: '', nameKey: '' });
  const [preview, setPreview] = useState<RosterImportPreview | null>(null);

  const existingSet = new Set(existingUsns.map(u => u.toUpperCase()));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      let parsedHeaders: string[] = [];
      let parsedRows: any[] = [];

      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const res = await parseCSVContent(text);
        parsedHeaders = res.headers;
        parsedRows = res.rows;
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const res = await parseExcelFile(file);
        parsedHeaders = res.headers;
        parsedRows = res.rows;
      } else {
        error('Unsupported format', 'Please upload a .csv, .xlsx, or .xls file.');
        setIsProcessing(false);
        return;
      }

      setHeaders(parsedHeaders);
      setRawRows(parsedRows);

      const detected = detectColumnMapping(parsedHeaders);
      setMapping(detected);

      const previewResult = validateAndProcessRoster(parsedRows, detected, existingSet);
      setPreview(previewResult);
    } catch (err: any) {
      error('Import failed', err?.message || 'Could not parse the roster file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasteProcess = () => {
    if (!pasteText.trim()) return;

    setIsProcessing(true);
    try {
      const { headers: parsedHeaders, rows: parsedRows } = parsePastedText(pasteText);
      setHeaders(parsedHeaders);
      setRawRows(parsedRows);

      const detected = detectColumnMapping(parsedHeaders);
      setMapping(detected);

      const previewResult = validateAndProcessRoster(parsedRows, detected, existingSet);
      setPreview(previewResult);
    } catch (err: any) {
      error('Parse failed', err?.message || 'Failed to process pasted text.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemap = (newMapping: ColumnMapping) => {
    setMapping(newMapping);
    if (rawRows.length > 0) {
      const previewResult = validateAndProcessRoster(rawRows, newMapping, existingSet);
      setPreview(previewResult);
    }
  };

  const handleLoadSample70 = () => {
    const previewResult = validateAndProcessRoster(
      SAMPLE_STUDENTS_70.map(s => ({ USN: s.usn, 'Student Name': s.fullName, Section: 'A' })),
      { usnKey: 'USN', nameKey: 'Student Name', sectionKey: 'Section' },
      existingSet
    );
    setPreview(previewResult);
    success('Sample loaded', '70 realistic engineering student records loaded for preview.');
  };

  const handleConfirmSave = async () => {
    if (!preview || preview.validRows.length === 0) return;

    setIsSubmitting(true);
    try {
      await onImportConfirmed(preview.validRows);
      success('Roster Imported', `Successfully enrolled ${preview.validRows.length} students.`);
      handleReset();
      onClose();
    } catch (err: any) {
      error('Save failed', err?.message || 'Error saving imported students.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setRawRows([]);
    setHeaders([]);
    setPreview(null);
    setPasteText('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Student Roster"
      description="Upload a CSV/Excel file or paste spreadsheet rows to enroll students."
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => downloadSampleCSV()}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Sample Template (.csv)
          </Button>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            {preview && preview.validRows.length > 0 && (
              <Button
                size="sm"
                variant="primary"
                isLoading={isSubmitting}
                onClick={handleConfirmSave}
              >
                Import {preview.validRows.length} Students
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Method Switcher Tabs */}
        {!preview && (
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTab('upload')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  tab === 'upload'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Upload CSV / Excel
              </button>
              <button
                type="button"
                onClick={() => setTab('paste')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  tab === 'paste'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Clipboard className="w-3.5 h-3.5" />
                Paste Rows
              </button>
            </div>

            {/* Quick PES University 69-student roster loader */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleLoadSample70}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
              className="text-xs"
            >
              Load 69 PES Students
            </Button>
          </div>
        )}

        {/* Upload Mode */}
        {!preview && tab === 'upload' && (
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center hover:border-teal-500/50 transition-colors bg-slate-50/50 dark:bg-slate-900/50">
            <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Drag and drop roster file here, or browse
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Supports .csv and .xlsx files. Auto-detects columns: USN, Roll Number, Student Name, Section.
            </p>
            <div className="mt-4">
              <label className="inline-flex cursor-pointer">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <span className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs">
                  Choose File
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Paste Mode */}
        {!preview && tab === 'paste' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Copy rows directly from Google Sheets or Excel and paste here (tab-separated or comma-separated).
            </p>
            <textarea
              rows={6}
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              placeholder="USN	Student Name	Section&#10;1MS23CS001	Aarav Sharma	A&#10;1MS23CS002	Aanya Patel	A"
              className="w-full font-mono text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
            <Button
              size="sm"
              variant="primary"
              disabled={!pasteText.trim() || isProcessing}
              onClick={handlePasteProcess}
              isLoading={isProcessing}
            >
              Parse Pasted Roster
            </Button>
          </div>
        )}

        {/* Validation & Preview Screen */}
        {preview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Import Validation Summary
              </h4>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-teal-600 hover:underline"
              >
                Choose another file
              </button>
            </div>

            {/* Column Mapper Check */}
            {headers.length > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-xs grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    USN / Roll Number Column
                  </label>
                  <select
                    value={mapping.usnKey}
                    onChange={e => handleRemap({ ...mapping, usnKey: e.target.value })}
                    className="w-full h-8 px-2 rounded border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                  >
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Student Full Name Column
                  </label>
                  <select
                    value={mapping.nameKey}
                    onChange={e => handleRemap({ ...mapping, nameKey: e.target.value })}
                    className="w-full h-8 px-2 rounded border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                  >
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Validation Count Pills */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  Ready to Import
                </span>
                <p className="text-lg font-bold text-emerald-600 tabular-nums">
                  {preview.validRows.length} valid
                </p>
              </div>

              <div className="p-3 rounded-lg border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                  Duplicates
                </span>
                <p className="text-lg font-bold text-amber-600 tabular-nums">
                  {preview.duplicateRows.length} ignored
                </p>
              </div>

              <div className="p-3 rounded-lg border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                  Rejected / Invalid
                </span>
                <p className="text-lg font-bold text-rose-600 tabular-nums">
                  {preview.rejectedRows.length} rejected
                </p>
              </div>
            </div>

            {/* Validation Warnings / Rejections List */}
            {(preview.duplicateRows.length > 0 || preview.rejectedRows.length > 0) && (
              <div className="p-3 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 max-h-32 overflow-y-auto space-y-1 text-xs">
                {preview.rejectedRows.map((r, i) => (
                  <p key={i} className="text-rose-700 dark:text-rose-300">
                    • {r.reason}
                  </p>
                ))}
                {preview.duplicateRows.map((d, i) => (
                  <p key={i} className="text-amber-700 dark:text-amber-300">
                    • {d.reason}
                  </p>
                ))}
              </div>
            )}

            {/* Valid Rows Preview Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2 px-3 w-10">#</th>
                    <th className="py-2 px-3">USN / Roll No</th>
                    <th className="py-2 px-3">Student Name</th>
                    <th className="py-2 px-3">Section</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {preview.validRows.slice(0, 50).map((r, i) => (
                    <tr key={r.usn} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-1.5 px-3 text-slate-400 font-mono">{i + 1}</td>
                      <td className="py-1.5 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {r.usn}
                      </td>
                      <td className="py-1.5 px-3 text-slate-700 dark:text-slate-300">
                        {r.fullName}
                      </td>
                      <td className="py-1.5 px-3 text-slate-500">
                        {r.section || 'A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.validRows.length > 50 && (
                <div className="p-2 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40">
                  + {preview.validRows.length - 50} more valid students
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
