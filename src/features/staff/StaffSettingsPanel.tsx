// @ts-nocheck
'use client';
import React, { useState, useEffect } from 'react';
import { useStaffStore } from './useStaffStore';

// ==============================
// StaffSettingsPanel（担当者管理画面）
// ==============================
interface StaffSettingsPanelProps {
  onClose: () => void;
}

export default function StaffSettingsPanel({
  onClose,
}: StaffSettingsPanelProps) {
  const {
    staffList,
    isLoading,
    fetchStaff,
    addStaff,
    updateStaff,
    deleteStaff,
    reorderStaff,
  } = useStaffStore();

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 初回データ取得
  useEffect(() => {
    fetchStaff();
  }, []);

  // ────────────────────────────────────────
  // 追加
  // ────────────────────────────────────────
  const handleAdd = async () => {
    if (!newName.trim()) return;
    setIsSaving(true);
    try {
      await addStaff(newName.trim());
      setNewName('');
    } catch (err: any) {
      alert(`追加に失敗しました。\n${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // ────────────────────────────────────────
  // 編集開始
  // ────────────────────────────────────────
  const handleEditStart = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  // ────────────────────────────────────────
  // 編集保存
  // ────────────────────────────────────────
  const handleEditSave = async (id: string) => {
    if (!editName.trim()) return;
    setIsSaving(true);
    try {
      await updateStaff(id, editName.trim());
      setEditingId(null);
      setEditName('');
    } catch (err: any) {
      alert(`更新に失敗しました。\n${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // ────────────────────────────────────────
  // 削除
  // ────────────────────────────────────────
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    try {
      await deleteStaff(id);
    } catch (err: any) {
      alert(`削除に失敗しました。\n${err.message}`);
    }
  };

  // ==============================
  // レンダリング
  // ==============================
  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-white">
      {/* ヘッダー */}
      <header className="bg-[#003366] text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚙️</span>
          <div>
            <h2 className="font-black text-sm">担当者設定</h2>
            <div className="text-[10px] text-blue-200 mt-0.5">
              見積書に表示される担当者を管理します
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/10 px-3 py-1.5 rounded-lg text-sm font-bold transition"
        >
          ✕ 閉じる
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {/* 担当者追加フォーム */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
            <h3 className="text-xs font-black text-slate-700">
              ➕ 担当者を追加
            </h3>
          </div>
          <div className="p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="例: 中島、田中 太郎..."
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={handleAdd}
                disabled={isSaving || !newName.trim()}
                className={[
                  'px-4 py-2 rounded-lg text-sm font-black text-white transition',
                  isSaving || !newName.trim()
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-[#003366] hover:bg-blue-900 active:scale-95',
                ].join(' ')}
              >
                追加
              </button>
            </div>
          </div>
        </div>

        {/* 担当者一覧 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-700">👥 担当者一覧</h3>
            <span className="text-[10px] text-slate-400">
              {staffList.length}名
            </span>
          </div>

          {/* ローディング */}
          {isLoading && (
            <div className="text-center py-8 text-slate-400 text-sm animate-pulse">
              読み込み中...
            </div>
          )}

          {/* 空状態 */}
          {!isLoading && staffList.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">
              <div className="text-3xl mb-2">👤</div>
              <div>担当者が登録されていません</div>
              <div className="text-xs mt-1">
                上のフォームから追加してください
              </div>
            </div>
          )}

          {/* リスト */}
          <div className="divide-y divide-slate-100">
            {staffList.map((staff, index) => (
              <div key={staff.id} className="px-4 py-3 flex items-center gap-2">
                {/* 並び順ボタン */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    onClick={() => reorderStaff(staff.id, 'up')}
                    disabled={index === 0}
                    className={[
                      'w-5 h-5 rounded text-[10px] flex items-center justify-center transition',
                      index === 0
                        ? 'text-slate-200 cursor-not-allowed'
                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700',
                    ].join(' ')}
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => reorderStaff(staff.id, 'down')}
                    disabled={index === staffList.length - 1}
                    className={[
                      'w-5 h-5 rounded text-[10px] flex items-center justify-center transition',
                      index === staffList.length - 1
                        ? 'text-slate-200 cursor-not-allowed'
                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700',
                    ].join(' ')}
                  >
                    ▼
                  </button>
                </div>

                {/* 順番バッジ */}
                <span className="shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black flex items-center justify-center">
                  {index + 1}
                </span>

                {/* 名前（編集中 or 表示） */}
                {editingId === staff.id ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && handleEditSave(staff.id)
                      }
                      autoFocus
                      className="flex-1 border border-blue-400 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <button
                      onClick={() => handleEditSave(staff.id)}
                      disabled={isSaving}
                      className="px-3 py-1 rounded-lg bg-[#003366] text-white text-xs font-black hover:bg-blue-900 transition"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditName('');
                      }}
                      className="px-3 py-1 rounded-lg border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-bold text-slate-800">
                      {staff.name}
                    </span>
                    {/* 編集・削除ボタン */}
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => handleEditStart(staff.id, staff.name)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 transition"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(staff.id, staff.name)}
                        className="px-2.5 py-1 rounded-lg border border-red-200 text-red-400 text-xs font-bold hover:bg-red-50 transition"
                      >
                        🗑
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 説明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 space-y-1">
          <div className="font-black">💡 使い方</div>
          <div>
            • 追加した担当者は見積画面の「担当者」セレクトボックスに表示されます
          </div>
          <div>• ▲▼ ボタンで表示順を変更できます</div>
          <div>• 削除しても過去の見積データには影響しません</div>
        </div>
      </div>
    </div>
  );
}
