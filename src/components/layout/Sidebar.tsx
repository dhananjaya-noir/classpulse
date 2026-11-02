import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  Users, 
  History, 
  FileSpreadsheet, 
  Settings, 
  LogOut, 
  Moon, 
  Sun, 
  Cloud, 
  CloudOff, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { syncEngine } from '@/lib/sync';
import { isSupabaseConfigured } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export type NavPage = 'dashboard' | 'attendance' | 'roster' | 'history' | 'reports' | 'settings';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ currentPage, onNavigate, isOpenMobile, onCloseMobile }: SidebarProps) {
  const { profile, signOut, isDemoMode } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((state, count) => {
      setSyncState(state);
      setPendingCount(count);
    });
    return () => unsubscribe();
  }, []);

  const navItems: Array<{ id: NavPage; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'attendance', label: 'Quick Attendance', icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: 'roster', label: 'Students & Roster', icon: <Users className="w-4 h-4" /> },
    { id: 'history', label: 'Attendance History', icon: <History className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports & Exports', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings & Backup', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleNavClick = (id: NavPage) => {
    onNavigate(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/50 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0',
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Top Header & Branding */}
        <div>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-xs font-bold">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 12h3l3-7 4 14 3-7h3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100">
                  ClassPulse
                </span>
                <span className="text-[10px] block font-mono text-teal-600 dark:text-teal-400 font-semibold tracking-wider uppercase">
                  Academic Suite
                </span>
              </div>
            </div>
          </div>

          {/* Sync & Cloud Status Indicator */}
          <div className="px-3 pt-3">
            <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {isDemoMode ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-slate-600 dark:text-slate-300 font-medium text-[11px]">
                      Local Sandbox Mode
                    </span>
                  </>
                ) : !navigator.onLine ? (
                  <>
                    <CloudOff className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-rose-600 dark:text-rose-400 font-medium text-[11px]">
                      Offline Mode
                    </span>
                  </>
                ) : syncState === 'syncing' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-teal-500 animate-spin" />
                    <span className="text-teal-600 dark:text-teal-400 font-medium text-[11px]">
                      Syncing cloud...
                    </span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-slate-600 dark:text-slate-300 font-medium text-[11px]">
                      Supabase Connected
                    </span>
                  </>
                )}
              </div>

              {pendingCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                  {pendingCount} queued
                </span>
              )}
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            {navItems.map(item => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left',
                    isActive
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 font-semibold border border-teal-200/50 dark:border-teal-800/40 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  )}
                >
                  <span
                    className={cn(
                      'transition-colors',
                      isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'
                    )}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile & Utilities */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {/* User Card */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {profile?.full_name?.charAt(0) || 'P'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {profile?.full_name || 'Faculty Member'}
                </p>
                <p className="text-[10px] text-slate-400 capitalize truncate">
                  {profile?.role || 'Instructor'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleTheme}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={signOut}
                title="Sign out"
                className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
