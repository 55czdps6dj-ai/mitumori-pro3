// @ts-nocheck
'use client';
import React, { useState, useMemo, useCallback } from 'react';
import { FULL_ITEM_LIST, ROOMS } from './householdData';
import type { HouseholdItem } from './householdData';

// ==============================
// 定数
// ==============================

/** カテゴリーバッジ色 */
const CAT_BADGE: Record<string, string> = {
  家具: 'bg-green-100 text-green-700',
  家電: 'bg-blue-100  text-blue-700',
  他: 'bg-slate-100 text-slate-500',
};

// ==============================
// ItemRow（家財入力・内容確認共通行）
// ==============================
interface ItemRowProps {
  item: any; // store item or master item
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
  onDelete?: () => void; // 内容確認パネル用（✕ボタン）
}

function ItemRow({ item, qty, onAdd, onRemove, onDelete }: ItemRowProps) {
  const catClass = CAT_BADGE[item.cat] || CAT_BADGE['他'];
  const selected = qty > 0;

  return (
    <div
      className={[
        'rounded-xl border px-3 py-2.5 flex items-center gap-2 transition',
        selected
          ? 'bg-blue-50 border-blue-300 shadow-sm'
          : 'bg-white border-slate-200',
      ].join(' ')}
    >
      {/* カテゴリーバッジ */}
      <span
        className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded ${catClass}`}
      >
        {item.cat}
      </span>

      {/* アイテム名 */}
      <span className="flex-1 text-sm font-bold text-slate-800 leading-tight truncate">
        {item.name}
      </span>

      {/* pt バッジ */}
      <span className="shrink-0 text-[9px] font-bold text-blue-500 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
        {item.pt}P
      </span>

      {/* ±ボタン */}
      <div className="shrink-0 flex items-center gap-1.5">
        <button
          onClick={onRemove}
          disabled={qty === 0}
          className={[
            'w-7 h-7 rounded-lg font-black text-base flex items-center justify-center transition',
            qty > 0
              ? 'bg-red-100 text-red-600 hover:bg-red-200 active:scale-90'
              : 'bg-slate-100 text-slate-300 cursor-not-allowed',
          ].join(' ')}
        >
          −
        </button>

        <span
          className={[
            'text-base font-black min-w-[20px] text-center',
            qty > 0 ? 'text-[#003366]' : 'text-slate-300',
          ].join(' ')}
        >
          {qty}
        </span>

        <button
          onClick={onAdd}
          className="w-7 h-7 rounded-lg bg-[#003366] text-white font-black text-base hover:bg-blue-900 active:scale-90 transition flex items-center justify-center"
        >
          ＋
        </button>
      </div>

      {/* ✕ボタン（内容確認パネル用） */}
      {onDelete && (
        <button
          onClick={onDelete}
          className="shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-500 text-xs font-black transition flex items-center justify-center"
          title="削除"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ==============================
// ConfirmPanel（内容確認タブ）
// ==============================
interface ConfirmPanelProps {
  activeItems: any[];
  totalPt: number;
  onAdd: (id: string, qty: number) => void;
  onRemove: (id: string, qty: number) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

function ConfirmPanel({
  activeItems,
  totalPt,
  onAdd,
  onRemove,
  onDelete,
  onClearAll,
}: ConfirmPanelProps) {
  const totalQty = activeItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* 全削除ボタン */}
      {activeItems.length > 0 && (
        <div className="px-3 pt-2 shrink-0">
          <button
            onClick={() => {
              if (confirm('選択した家財をすべて削除しますか？')) onClearAll();
            }}
            className="w-full py-2 rounded-xl border border-red-200 text-red-500 text-xs font-bold hover:bg-red-50 transition"
          >
            🗑 全削除
          </button>
        </div>
      )}

      {/* ヒント */}
      <div className="px-4 py-2 text-[10px] text-blue-600 font-bold flex items-center gap-1.5 shrink-0">
        <span>💡</span>
        <span>＋－で数量変更 ／ ✕で削除</span>
      </div>

      {/* リスト */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
        {activeItems.length === 0 && (
          <div className="text-center text-slate-400 py-16 text-sm">
            選択済みの家財はありません
          </div>
        )}
        {activeItems.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            qty={item.quantity}
            onAdd={() => onAdd(item.id, item.quantity + 1)}
            onRemove={() => onRemove(item.id, Math.max(0, item.quantity - 1))}
            onDelete={() => onDelete(item.id)}
          />
        ))}
      </div>

      {/* フッター */}
      {activeItems.length > 0 && (
        <div className="shrink-0 bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-bold">
            {activeItems.length}種類 / {totalQty}点
          </div>
          <div className="text-lg font-black text-[#003366]">
            合計 <span className="text-red-600">{totalPt}</span> P
          </div>
        </div>
      )}
    </div>
  );
}

// ==============================
// HouseholdTab（メイン）
// ==============================
interface HouseholdTabProps {
  store: any;
}

export default function HouseholdTab({ store }: HouseholdTabProps) {
  const { items, addItem, updateItemQuantity, currentRoomId } = store;

  const [innerTab, setInnerTab] = useState<'input' | 'confirm'>('input');
  const [selectedRoom, setSelectedRoom] = useState<string>('すべて');
  const [search, setSearch] = useState('');

  // ────────────────────────────────────────
  // フィルタリング
  // ────────────────────────────────────────
  const filteredItems = useMemo(() => {
    return FULL_ITEM_LIST.filter((m) => {
      if (selectedRoom !== 'すべて' && m.room !== selectedRoom) return false;
      if (search && !m.name.includes(search)) return false;
      return true;
    });
  }, [selectedRoom, search]);

  // ────────────────────────────────────────
  // 選択済みアイテム
  // ────────────────────────────────────────
  const activeItems = useMemo(
    () => items.filter((i: any) => Number(i.quantity) > 0),
    [items]
  );
  const totalPt = store.totalPt || 0;
  const totalQty = activeItems.reduce((s: number, i: any) => s + i.quantity, 0);

  // ────────────────────────────────────────
  // マスター → store quantity を取得
  // ────────────────────────────────────────
  const getQuantity = (masterItem: HouseholdItem): number => {
    const found = items.find(
      (i: any) =>
        i.name === masterItem.name &&
        (i.roomId === currentRoomId || i.room === masterItem.room)
    );
    return found ? Number(found.quantity) : 0;
  };

  // ────────────────────────────────────────
  // 数量操作
  // ────────────────────────────────────────
  const handleAdd = useCallback(
    (m: HouseholdItem) => {
      const existing = items.find(
        (i: any) => i.name === m.name && i.roomId === currentRoomId
      );
      if (existing) {
        updateItemQuantity(existing.id, existing.quantity + 1);
      } else {
        addItem({ ...m, id: `${m.name}-${Date.now()}` });
      }
    },
    [items, currentRoomId, addItem, updateItemQuantity]
  );

  const handleRemove = useCallback(
    (m: HouseholdItem) => {
      const existing = items.find(
        (i: any) => i.name === m.name && i.roomId === currentRoomId
      );
      if (!existing) return;
      updateItemQuantity(existing.id, Math.max(0, existing.quantity - 1));
    },
    [items, currentRoomId, updateItemQuantity]
  );

  const handleDelete = useCallback(
    (id: string) => {
      updateItemQuantity(id, 0);
    },
    [updateItemQuantity]
  );

  const handleClearAll = useCallback(() => {
    activeItems.forEach((i: any) => updateItemQuantity(i.id, 0));
  }, [activeItems, updateItemQuantity]);

  // ==============================
  // レンダリング
  // ==============================
  return (
    <div className="flex flex-col h-full">
      {/* ─── 内タブ（家財入力 / 内容確認） ─── */}
      <div className="flex bg-slate-100 border-b border-slate-200 shrink-0">
        {(['input', 'confirm'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setInnerTab(tab)}
            className={[
              'flex-1 py-2 text-xs font-bold transition relative',
              innerTab === tab
                ? 'bg-white text-[#003366] font-black'
                : 'text-slate-400',
            ].join(' ')}
          >
            {tab === 'input'
              ? '家財入力'
              : `内容確認${
                  activeItems.length > 0 ? ` (${activeItems.length})` : ''
                }`}
            {innerTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#003366]" />
            )}
          </button>
        ))}
      </div>

      {/* ─── 家財入力タブ ─── */}
      {innerTab === 'input' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* 部屋フィルター */}
          <div className="px-3 pt-2 pb-1 shrink-0">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {ROOMS.map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRoom(r)}
                  className={[
                    'shrink-0 px-3 py-1 rounded-full text-[10px] font-bold border transition',
                    selectedRoom === r
                      ? 'bg-[#003366] text-white border-[#003366]'
                      : 'bg-slate-50 text-slate-600 border-slate-300 hover:border-slate-400',
                  ].join(' ')}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* 検索 */}
          <div className="px-3 pb-2 shrink-0">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="家財名で検索..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* 家財リスト（1列） */}
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
            {filteredItems.length === 0 && (
              <div className="text-center text-slate-400 py-10 text-sm">
                該当する家財がありません
              </div>
            )}
            {filteredItems.map((m) => {
              const qty = getQuantity(m);
              return (
                <ItemRow
                  key={`${m.name}-${m.room}`}
                  item={m}
                  qty={qty}
                  onAdd={() => handleAdd(m)}
                  onRemove={() => handleRemove(m)}
                />
              );
            })}
          </div>

          {/* サマリーバー（タップで内容確認へ） */}
          {activeItems.length > 0 && (
            <button
              onClick={() => setInnerTab('confirm')}
              className="shrink-0 bg-[#003366] text-white px-4 py-2.5 flex items-center justify-between active:bg-blue-900 transition"
            >
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span>📦 選択済み一覧</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
                  {activeItems.length}種 / {totalQty}点
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-black">
                  <span className="text-blue-200 text-xs">合計 </span>
                  <span className="text-yellow-300">{totalPt}</span>
                  <span className="text-blue-200 text-xs"> P</span>
                </div>
                <span className="text-blue-200 text-xs">▶ 確認</span>
              </div>
            </button>
          )}
        </div>
      )}

      {/* ─── 内容確認タブ ─── */}
      {innerTab === 'confirm' && (
        <ConfirmPanel
          activeItems={activeItems}
          totalPt={totalPt}
          onAdd={(id, qty) => updateItemQuantity(id, qty)}
          onRemove={(id, qty) => updateItemQuantity(id, qty)}
          onDelete={handleDelete}
          onClearAll={handleClearAll}
        />
      )}
    </div>
  );
}
