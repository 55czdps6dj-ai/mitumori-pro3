// @ts-nocheck
'use client';
import { create } from 'zustand';
// 共通の接続設定済みの supabase クライアントをインポートしてエラーを根本解決
import { supabase } from '../../lib/supabase';

const LOCAL_STAFF_KEY = 'mitumori-staff-list';

// ==============================
// 型定義
// ==============================
export interface Staff {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

// ==============================
// DB スネークケース → アプリ キャメルケース 変換
// ==============================
function mapToApp(row: any): Staff {
  return {
    id: row.id,
    name: row.name || '',
    sortOrder: row.sort_order ?? 0,
    isActive: row.is_active ?? true,
    createdAt: row.created_at || '',
  };
}

function createLocalStaff(name: string, sortOrder: number): Staff {
  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    sortOrder,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
}

function readLocalStaff(): Staff[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_STAFF_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeLocalStaff(staffList: Staff[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(staffList));
}

function mergeStaffLists(primary: Staff[], fallback: Staff[]) {
  const names = new Set(primary.map((staff) => staff.name));
  return [
    ...primary,
    ...fallback.filter((staff) => staff.isActive && !names.has(staff.name)),
  ].sort((a, b) => a.sortOrder - b.sortOrder);
}

// ==============================
// ストア定義
// ==============================
interface StaffStore {
  staffList: Staff[];
  isLoading: boolean;
  error: string | null;

  fetchStaff: () => Promise<void>;
  addStaff: (name: string) => Promise<void>;
  updateStaff: (id: string, name: string) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  reorderStaff: (id: string, direction: 'up' | 'down') => Promise<void>;
}

export const useStaffStore = create<StaffStore>((set, get) => ({
  staffList: [],
  isLoading: false,
  error: null,

  // ────────────────────────────────────────
  // 一覧取得
  // ────────────────────────────────────────
  fetchStaff: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      const remoteStaff = (data || []).map(mapToApp);
      set({
        staffList: mergeStaffLists(remoteStaff, readLocalStaff()),
        isLoading: false,
      });
    } catch (err: any) {
      console.error('fetchStaff error:', err);
      set({ staffList: readLocalStaff(), error: err.message, isLoading: false });
    }
  },

  // ────────────────────────────────────────
  // 追加
  // ────────────────────────────────────────
  addStaff: async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      // 現在の最大 sort_order を取得して +1
      const currentList = get().staffList;
      const maxOrder = currentList.reduce(
        (max, s) => Math.max(max, s.sortOrder),
        -1
      );

      const { data, error } = await supabase
        .from('staff')
        .insert([{ name: trimmed, sort_order: maxOrder + 1, is_active: true }])
        .select()
        .single();

      if (error) throw error;

      const newStaff = mapToApp(data);
      set((s) => ({ staffList: [...s.staffList, newStaff] }));
    } catch (err: any) {
      console.error('addStaff error:', err);
      const currentList = get().staffList;
      if (currentList.some((staff) => staff.name === trimmed)) return;
      const maxOrder = currentList.reduce(
        (max, s) => Math.max(max, s.sortOrder),
        -1
      );
      const newStaff = createLocalStaff(trimmed, maxOrder + 1);
      const newList = [...currentList, newStaff];
      writeLocalStaff(newList.filter((staff) => staff.id.startsWith('local-')));
      set({ staffList: newList, error: err.message });
    }
  },

  // ────────────────────────────────────────
  // 名前更新
  // ────────────────────────────────────────
  updateStaff: async (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      const { data, error } = await supabase
        .from('staff')
        .update({ name: trimmed })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updated = mapToApp(data);
      set((s) => ({
        staffList: s.staffList.map((st) => (st.id === id ? updated : st)),
      }));
    } catch (err: any) {
      console.error('updateStaff error:', err);
      const newList = get().staffList.map((st) =>
        st.id === id ? { ...st, name: trimmed } : st
      );
      writeLocalStaff(newList.filter((staff) => staff.id.startsWith('local-')));
      set({ staffList: newList, error: err.message });
    }
  },

  // ────────────────────────────────────────
  // 削除（論理削除: is_active = false）
  // ────────────────────────────────────────
  deleteStaff: async (id) => {
    try {
      const { error } = await supabase
        .from('staff')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      set((s) => ({
        staffList: s.staffList.filter((st) => st.id !== id),
      }));
    } catch (err: any) {
      console.error('deleteStaff error:', err);
      const newList = get().staffList.filter((st) => st.id !== id);
      writeLocalStaff(newList.filter((staff) => staff.id.startsWith('local-')));
      set({ staffList: newList, error: err.message });
    }
  },

  // ────────────────────────────────────────
  // 並び順変更
  // ────────────────────────────────────────
  reorderStaff: async (id, direction) => {
    const list = get().staffList;
    const index = list.findIndex((s) => s.id === id);
    if (index < 0) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= list.length) return;

    const current = list[index];
    const swap = list[swapIndex];

    try {
      // 2件の sort_order を入れ替え
      await supabase
        .from('staff')
        .update({ sort_order: swap.sortOrder })
        .eq('id', current.id);

      await supabase
        .from('staff')
        .update({ sort_order: current.sortOrder })
        .eq('id', swap.id);

      // ローカル更新
      const newList = [...list];
      newList[index] = { ...current, sortOrder: swap.sortOrder };
      newList[swapIndex] = { ...swap, sortOrder: current.sortOrder };
      newList.sort((a, b) => a.sortOrder - b.sortOrder);

      set({ staffList: newList });
    } catch (err: any) {
      console.error('reorderStaff error:', err);
      const newList = [...list];
      newList[index] = { ...current, sortOrder: swap.sortOrder };
      newList[swapIndex] = { ...swap, sortOrder: current.sortOrder };
      newList.sort((a, b) => a.sortOrder - b.sortOrder);
      writeLocalStaff(newList.filter((staff) => staff.id.startsWith('local-')));
      set({ staffList: newList, error: err.message });
    }
  },
}));
