// @ts-nocheck
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { FULL_ITEM_LIST, ROOMS, type RoomType } from './householdData';
import {
  buildJudgmentResult,
  calcGaugePercent,
  getCurrentZone,
  GAUGE_ZONES,
  type VehicleJudgmentResult,
} from '../store/vehicleJudgment';
import VehiclePriceAdminModal from '../../reception/components/VehiclePriceAdminModal';

// ==============================
// 型定義
// ==============================

type SimQuantities = Record<string, number>;

interface FreeItem {
  name: string;
  pt: number;
  qty: number;
}

const INITIAL_FREE_ITEMS: FreeItem[] = Array(3)
  .fill(null)
  .map(() => ({ name: '', pt: 0, qty: 0 }));

// ==============================
// コンポーネント
// ==============================

type Props = { store: any };

export default function VolumeSimulatorTab({ store }: Props) {
  const {
    vehiclePriceTable,
    setVehiclePriceTable,
    applySimulatorResult,
    dateCategory,
    totalPt: existingTotalPt,
  } = store;

  const [simQuantities, setSimQuantities] = useState<SimQuantities>({});
  const [freeItems, setFreeItems] = useState<FreeItem[]>(INITIAL_FREE_ITEMS);
  const [activeRoom, setActiveRoom] = useState<RoomType | 'すべて'>('LDK');
  const [search, setSearch] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  // ── フィルタリング ────────────────────────────
  const filteredList = useMemo(() => {
    return FULL_ITEM_LIST.filter((m) => {
      const matchSearch = m.name.includes(search);
      const matchRoom = activeRoom === 'すべて' || m.room === activeRoom;
      return matchSearch && matchRoom;
    });
  }, [search, activeRoom]);

  // ── ポイント集計 ──────────────────────────────
  const simTotalPt = useMemo(() => {
    const masterPt = FULL_ITEM_LIST.reduce(
      (sum, item) =>
        sum + (simQuantities[`${item.room}-${item.name}`] || 0) * item.pt,
      0
    );
    const freePt = freeItems.reduce((sum, fi) => sum + fi.qty * fi.pt, 0);
    return masterPt + freePt;
  }, [simQuantities, freeItems]);

  // ── 車両判定 ──────────────────────────────────
  const judgment: VehicleJudgmentResult = useMemo(
    () => buildJudgmentResult(simTotalPt, vehiclePriceTable),
    [simTotalPt, vehiclePriceTable]
  );

  const gaugePercent = calcGaugePercent(simTotalPt);
  const currentZone = getCurrentZone(simTotalPt);

  // ── 数量操作 ──────────────────────────────────
  const setSimQty = useCallback((key: string, qty: number) => {
    setSimQuantities((prev) => ({ ...prev, [key]: Math.max(0, qty) }));
    setIsApplied(false);
  }, []);

  const updateFreeItem = useCallback(
    (idx: number, field: keyof FreeItem, value: string | number) => {
      setFreeItems((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], [field]: value };
        return next;
      });
      setIsApplied(false);
    },
    []
  );

  const resetSimulator = useCallback(() => {
    if (!confirm('シミュレーターをリセットしますか？')) return;
    setSimQuantities({});
    setFreeItems(INITIAL_FREE_ITEMS);
    setIsApplied(false);
  }, []);

  // ── 見積に反映 ───────────────────────────────
  const handleApply = useCallback(() => {
    if (!judgment.vehicleKey) {
      alert('荷物が登録されていません。家財を追加してください。');
      return;
    }
    const confirmed = confirm(
      `【シミュレーター結果を見積に反映】\n\n` +
        `推奨車両: ${judgment.label} × ${judgment.quantity}台\n` +
        `合計ポイント: ${simTotalPt}P\n\n` +
        `現在の「料金」タブの車両設定を上書きします。よろしいですか？`
    );
    if (!confirmed) return;
    applySimulatorResult(simTotalPt, dateCategory);
    setIsApplied(true);
    alert(
      `✅ 反映完了！\n「料金」タブの車両設定に ${judgment.label} × ${judgment.quantity}台 を設定しました。`
    );
  }, [judgment, simTotalPt, dateCategory, applySimulatorResult]);

  // ── 部屋別集計 ────────────────────────────────
  const roomSummary = useMemo(() => {
    return ROOMS.filter((r) => r !== 'すべて').map((room) => {
      const count = FULL_ITEM_LIST.filter((item) => item.room === room).reduce(
        (sum, item) => sum + (simQuantities[`${item.room}-${item.name}`] || 0),
        0
      );
      return { room, count };
    });
  }, [simQuantities]);

  // ==============================
  // レンダリング
  // ==============================
  return (
    <div className="flex flex-col h-[calc(100vh-160px)] bg-slate-50">
      {/* ── ヘッダー：判定結果パネル ── */}
      <div className="bg-[#003366] text-white px-4 pt-4 pb-3 shadow-lg">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xs font-black uppercase tracking-widest opacity-70">
            📊 荷物ボリューム シミュレーター
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() =>
                prompt('PASS: keio123') === 'keio123' && setIsAdminOpen(true)
              }
              className="text-[9px] bg-white/20 hover:bg-white/30 px-2 py-1 rounded font-bold transition-all"
            >
              ⚙️ 単価設定
            </button>
            <button
              onClick={resetSimulator}
              className="text-[9px] bg-red-500/80 hover:bg-red-500 px-2 py-1 rounded font-bold transition-all"
            >
              リセット
            </button>
          </div>
        </div>

        {/* 4カラム：ポイント / 推奨車両 / 通常料金 / 時間指定料金 */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="text-center">
            <p className="text-[8px] font-black opacity-50 uppercase mb-1">
              合計ポイント
            </p>
            <p className="text-2xl font-black font-mono text-white">
              {simTotalPt}
              <span className="text-xs opacity-60 ml-0.5">P</span>
            </p>
          </div>
          <div className="text-center border-l border-white/10">
            <p className="text-[8px] font-black opacity-50 uppercase mb-1">
              推奨車両
            </p>
            <p
              className={`text-xl font-black ${
                judgment.vehicleKey ? 'text-yellow-400' : 'text-white/30'
              }`}
            >
              {judgment.label}
            </p>
          </div>
          <div className="text-center border-l border-white/10">
            <p className="text-[8px] font-black opacity-50 uppercase mb-1">
              通常料金〜
            </p>
            <p className="text-lg font-black font-mono text-white">
              {judgment.normalPrice > 0
                ? `¥${judgment.normalPrice.toLocaleString()}`
                : '---'}
            </p>
          </div>
          <div className="text-center border-l border-white/10">
            <p className="text-[8px] font-black opacity-50 uppercase mb-1">
              時間指定〜
            </p>
            <p className="text-lg font-black font-mono text-white">
              {judgment.designatedPrice > 0
                ? `¥${judgment.designatedPrice.toLocaleString()}`
                : '---'}
            </p>
          </div>
        </div>

        {/* ポイントゲージ */}
        <div className="space-y-1">
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                currentZone?.color || 'bg-white/20'
              }`}
              style={{ width: `${gaugePercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[7px] font-black opacity-40">
            {GAUGE_ZONES.map((z) => (
              <span
                key={z.key}
                className={
                  simTotalPt >= z.minPt && simTotalPt <= z.maxPt
                    ? 'opacity-100 text-yellow-300'
                    : ''
                }
              >
                {z.label}
              </span>
            ))}
          </div>
        </div>

        {/* 家財タブの登録済みポイントとの比較 */}
        {existingTotalPt > 0 && (
          <div className="mt-2 bg-white/10 rounded-lg px-3 py-1.5 flex items-center justify-between">
            <span className="text-[9px] font-bold opacity-70">
              💡 家財タブの登録済みポイント
            </span>
            <span className="text-[11px] font-black text-yellow-300">
              {existingTotalPt}P
            </span>
          </div>
        )}
      </div>

      {/* ── メインエリア ── */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* 部屋タブ */}
        <div className="bg-slate-200 flex overflow-x-auto p-1 gap-1 no-scrollbar border-b border-slate-300">
          {ROOMS.map((r) => {
            const summary = roomSummary.find((s) => s.room === r);
            return (
              <button
                key={r}
                onClick={() => setActiveRoom(r)}
                className={`py-2 px-3 text-[10px] font-black whitespace-nowrap transition-all rounded-sm ${
                  activeRoom === r
                    ? 'bg-white text-[#003366] shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {r}
                {r !== 'すべて' && summary && summary.count > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-[7px] px-1 rounded-full">
                    {summary.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 検索バー */}
        <div className="bg-white border-b px-3 py-2">
          <input
            type="text"
            placeholder="家財名で検索..."
            className="w-full border border-slate-200 px-3 py-1.5 text-xs font-bold outline-none focus:border-[#003366] rounded"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* 家財リスト */}
        <div className="flex-1 overflow-y-auto bg-white">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-slate-50 z-10">
              <tr className="border-b border-slate-100">
                <th className="p-3 text-left text-[9px] font-black text-slate-400 uppercase">
                  家財名
                </th>
                <th className="p-3 text-center text-[9px] font-black text-red-500 uppercase">
                  Pt
                </th>
                <th className="p-3 text-right text-[9px] font-black text-slate-400 uppercase">
                  数量
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredList.map((item) => {
                const key = `${item.room}-${item.name}`;
                const qty = simQuantities[key] || 0;
                return (
                  <tr
                    key={key}
                    className={`transition-colors ${
                      qty > 0 ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[7px] px-1 py-0.5 font-black rounded ${
                            item.cat === '家電'
                              ? 'bg-blue-100 text-blue-600'
                              : item.cat === '家具'
                              ? 'bg-emerald-100 text-emerald-600'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {item.cat}
                        </span>
                        <span className="text-sm font-bold text-slate-700">
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-xs font-black text-red-500 font-mono">
                        {item.pt}P
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {qty > 0 ? (
                        <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white">
                          <button
                            onClick={() => setSimQty(key, qty - 1)}
                            className="w-9 h-9 flex items-center justify-center font-black text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors text-lg"
                          >
                            −
                          </button>
                          <span className="w-10 text-center text-sm font-black text-[#003366] font-mono">
                            {qty}
                          </span>
                          <button
                            onClick={() => setSimQty(key, qty + 1)}
                            className="w-9 h-9 flex items-center justify-center font-black text-[#003366] hover:bg-blue-50 active:bg-blue-100 transition-colors text-lg"
                          >
                            ＋
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSimQty(key, 1)}
                          className="w-9 h-9 border-2 border-dashed border-slate-200 rounded-lg text-slate-300 hover:border-[#003366] hover:text-[#003366] transition-all font-black text-lg"
                        >
                          ＋
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* フリー入力エリア */}
        <div className="bg-slate-50 border-t border-slate-200 px-3 py-2">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-1.5">
            ✏️ フリー入力（リストにない家財）
          </p>
          <div className="space-y-1.5">
            {freeItems.map((fi, idx) => (
              <div key={idx} className="flex gap-1.5 items-center">
                <input
                  type="text"
                  placeholder="家財名"
                  value={fi.name}
                  onChange={(e) => updateFreeItem(idx, 'name', e.target.value)}
                  className="flex-1 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold outline-none focus:border-[#003366]"
                />
                <input
                  type="number"
                  placeholder="Pt"
                  value={fi.pt || ''}
                  onChange={(e) =>
                    updateFreeItem(idx, 'pt', Number(e.target.value))
                  }
                  className="w-14 border border-slate-200 rounded px-2 py-1.5 text-xs font-black text-center outline-none focus:border-red-400 font-mono"
                />
                <span className="text-[9px] text-slate-400 font-black">×</span>
                <input
                  type="number"
                  placeholder="個"
                  value={fi.qty || ''}
                  onChange={(e) =>
                    updateFreeItem(idx, 'qty', Number(e.target.value))
                  }
                  className="w-14 border border-slate-200 rounded px-2 py-1.5 text-xs font-black text-center outline-none focus:border-[#003366] font-mono"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── フッター：反映ボタン ── */}
      <div className="bg-white border-t border-slate-200 px-4 py-3 flex items-center gap-3">
        <div className="flex-1 text-xs text-slate-500">
          <span className="font-black text-[#003366]">{simTotalPt}P</span>{' '}
          計測中
          {judgment.vehicleKey && (
            <span className="ml-2 text-slate-400">
              → 推奨:{' '}
              <span className="font-black text-yellow-600">
                {judgment.label} × {judgment.quantity}台
              </span>
            </span>
          )}
        </div>
        <button
          onClick={handleApply}
          disabled={!judgment.vehicleKey}
          className={`px-5 py-2.5 rounded-lg text-xs font-black transition-all ${
            isApplied
              ? 'bg-emerald-500 text-white'
              : judgment.vehicleKey
              ? 'bg-[#003366] text-white hover:bg-[#004499] shadow-md active:scale-95'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isApplied ? '✅ 反映済み' : '見積に反映する →'}
        </button>
      </div>

      {/* 単価設定モーダル */}
      {isAdminOpen && (
        <VehiclePriceAdminModal
          table={vehiclePriceTable}
          onSave={(newTable) => {
            setVehiclePriceTable(newTable);
            setIsAdminOpen(false);
          }}
          onClose={() => setIsAdminOpen(false)}
        />
      )}
    </div>
  );
}
