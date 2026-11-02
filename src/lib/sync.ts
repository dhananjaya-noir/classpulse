import { localDb, SyncQueueItem } from './db';
import { supabase, isSupabaseConfigured } from './supabase';

export class SyncEngine {
  private isSyncing = false;
  private listeners: Array<(state: 'idle' | 'syncing' | 'synced' | 'error', pendingCount: number) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.syncPending();
      });
    }
  }

  public subscribe(listener: (state: 'idle' | 'syncing' | 'synced' | 'error', pendingCount: number) => void) {
    this.listeners.push(listener);
    this.notifyState();
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private async notifyState(state: 'idle' | 'syncing' | 'synced' | 'error' = 'idle') {
    const pendingCount = await localDb.syncQueue.where('status').equals('pending').count();
    this.listeners.forEach(listener => listener(state, pendingCount));
  }

  public async getPendingCount(): Promise<number> {
    return await localDb.syncQueue.where('status').equals('pending').count();
  }

  public async enqueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'status' | 'retries'>) {
    await localDb.syncQueue.add({
      ...item,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retries: 0,
    });
    this.notifyState('idle');
    // Attempt instant sync if online
    if (navigator.onLine && isSupabaseConfigured()) {
      this.syncPending();
    }
  }

  public async syncPending(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing) return { synced: 0, failed: 0 };
    if (!navigator.onLine || !isSupabaseConfigured() || !supabase) {
      this.notifyState('idle');
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.notifyState('syncing');

    let syncedCount = 0;
    let failedCount = 0;

    try {
      const pendingItems = await localDb.syncQueue
        .where('status')
        .equals('pending')
        .sortBy('id');

      for (const item of pendingItems) {
        if (!item.id) continue;
        try {
          await localDb.syncQueue.update(item.id, { status: 'syncing' });

          const targetTable = item.table;
          const { action, payload } = item;

          let error: any = null;

          if (action === 'insert') {
            const { error: insErr } = await supabase.from(targetTable).upsert(payload);
            error = insErr;
          } else if (action === 'update') {
            const { id, ...updates } = payload;
            const { error: updErr } = await supabase.from(targetTable).update(updates).eq('id', id);
            error = updErr;
          } else if (action === 'delete') {
            const { error: delErr } = await supabase.from(targetTable).delete().eq('id', payload.id);
            error = delErr;
          } else if (action === 'upsert_records') {
            // Records batch upsert using session_id + student_id unique constraint
            const { error: recErr } = await supabase
              .from('attendance_records')
              .upsert(payload, { onConflict: 'session_id,student_id' });
            error = recErr;
          }

          if (error) {
            console.error(`Sync error on ${targetTable}:`, error);
            await localDb.syncQueue.update(item.id, {
              status: 'pending',
              retries: item.retries + 1,
              lastError: error.message || 'Unknown Supabase error',
            });
            failedCount++;
          } else {
            await localDb.syncQueue.delete(item.id);
            syncedCount++;
          }
        } catch (itemErr: any) {
          console.error('Failed to sync queue item:', itemErr);
          await localDb.syncQueue.update(item.id, {
            status: 'pending',
            retries: item.retries + 1,
            lastError: itemErr?.message || 'Network exception',
          });
          failedCount++;
        }
      }

      this.notifyState(failedCount > 0 ? 'error' : 'synced');
    } catch (err) {
      console.error('Sync batch execution failed:', err);
      this.notifyState('error');
    } finally {
      this.isSyncing = false;
    }

    return { synced: syncedCount, failed: failedCount };
  }
}

export const syncEngine = new SyncEngine();
