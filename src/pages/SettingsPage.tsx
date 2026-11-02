import React, { useState } from 'react';
import { 
  Settings, 
  User, 
  Building2, 
  Database, 
  Download, 
  Upload, 
  Moon, 
  Sun, 
  CheckCircle2, 
  AlertTriangle, 
  Save,
  Clock
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { storage } from '@/lib/storage';
import { isSupabaseConfigured } from '@/lib/supabase';

export function SettingsPage() {
  const { profile, updateProfile, isDemoMode, toggleDemoMode, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { success, error, warning } = useToast();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [institutionName, setInstitutionName] = useState(
    profile?.institution_name || 'Department of Computer Science & Engineering'
  );
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Backup & Restore
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        institution_name: institutionName.trim(),
      });
      success('Settings Updated', 'Profile and institution preferences saved.');
    } catch (err: any) {
      error('Failed to save', err?.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Full JSON Export (Phase 13 requirement)
  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const ownerId = user?.id || 'demo-faculty-001';
      const backup = await storage.exportFullBackup(ownerId);
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ClassPulse_Complete_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      success('Backup Downloaded', 'Full application data exported to JSON.');
    } catch (err: any) {
      error('Export failed', err?.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Full JSON Restore (Phase 13 requirement)
  const handleRestoreJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('Restoring will merge and import records into your local database. Do you wish to proceed?')) {
      return;
    }

    setIsRestoring(true);
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      const ownerId = user?.id || 'demo-faculty-001';
      const result = await storage.restoreFullBackup(backupData, ownerId);

      if (result.success) {
        success('Restore Successful', result.message);
        setTimeout(() => window.location.reload(), 1200);
      } else {
        error('Restore Error', result.message);
      }
    } catch (err: any) {
      error('Invalid Backup File', err?.message || 'Could not parse JSON file.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Page Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Preferences & System Settings
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure instructor profile, academic institution details, database connection, and JSON data backups.
        </p>
      </div>

      {/* Cloud & Database Connection Status */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-teal-600" />
          <span>Cloud Database & Backend State</span>
        </h3>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              {isSupabaseConfigured() ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Supabase Cloud Active
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Local Sandbox & IndexedDB Active
                </>
              )}
            </span>
            <p className="text-[11px] text-slate-500">
              {isSupabaseConfigured()
                ? 'Authenticated and connected to PostgreSQL with Row Level Security.'
                : 'Running in resilient offline/local mode. All data is cached in IndexedDB.'}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-mono text-slate-400">
              {isDemoMode ? 'SANDBOX_USER' : user?.email || 'Authenticated'}
            </span>
          </div>
        </div>
      </div>

      {/* Profile & Institution Details */}
      <form onSubmit={handleSaveProfile} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-teal-600" />
          <span>Institution & Academic Preferences</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Faculty / Instructor Full Name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="e.g. Dr. Ramesh Kumar"
            required
          />

          <Input
            label="Institution / Department Name"
            value={institutionName}
            onChange={e => setInstitutionName(e.target.value)}
            placeholder="e.g. Department of Computer Science & Engineering"
            required
          />

          <Input
            label="Default Academic Year"
            value={academicYear}
            onChange={e => setAcademicYear(e.target.value)}
            placeholder="e.g. 2026-2027"
          />

          <Select
            label="Timezone Preference"
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
            options={[
              { label: 'Asia/Kolkata (IST +5:30)', value: 'Asia/Kolkata' },
              { label: 'UTC (Coordinated Universal Time)', value: 'UTC' },
              { label: 'America/New_York (EST)', value: 'America/New_York' },
              { label: 'Europe/London (GMT)', value: 'Europe/London' },
            ]}
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button
            size="sm"
            variant="primary"
            isLoading={isSavingProfile}
            type="submit"
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            Save Preferences
          </Button>
        </div>
      </form>

      {/* Theme Settings */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          {theme === 'dark' ? <Moon className="w-4 h-4 text-teal-500" /> : <Sun className="w-4 h-4 text-amber-500" />}
          <span>Appearance & Theme</span>
        </h3>
        <p className="text-xs text-slate-500">
          ClassPulse persists your preferred theme across sessions.
        </p>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              theme === 'light'
                ? 'border-teal-500 bg-teal-50 text-teal-800 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Light Theme</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              theme === 'dark'
                ? 'border-teal-500 bg-teal-950 text-teal-200 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Moon className="w-4 h-4 text-teal-400" />
            <span>Dark Theme</span>
          </button>
        </div>
      </div>

      {/* Data Backup & Disaster Recovery (Phase 13 requirement) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Download className="w-4 h-4 text-teal-600" />
          <span>Full Application Backup & Restore</span>
        </h3>
        <p className="text-xs text-slate-500">
          Export your entire database (classes, student rosters, historical sessions, and records) to a JSON file or restore from a previous backup.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleExportJSON}
            isLoading={isExporting}
            leftIcon={<Download className="w-3.5 h-3.5 text-teal-600" />}
          >
            Export Complete JSON Backup
          </Button>

          <label className="inline-flex">
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreJSON}
              className="hidden"
              disabled={isRestoring}
            />
            <span className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer shadow-xs">
              <Upload className="w-3.5 h-3.5 text-amber-600" />
              <span>{isRestoring ? 'Restoring...' : 'Restore from JSON Backup'}</span>
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
